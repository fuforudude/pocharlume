// Pouvoirs des ennemis qui s'exercent à chaque pas, tous pilotés par `Ennemi.pouvoirs` (données) : fin de
// l'intouchabilité (relèvement, plongée), paliers de PV et actions périodiques des boss (affamer ou aveugler les tours,
// les mettre en feu ou les geler, appeler des ennemis, plonger, charger, bannir une invocation, relever les morts),
// aura de vitesse et de protection, soin des ennemis proches, régénération, échange armure/résistance, nuage toxique,
// division et dernière lueur à la mort, et les actions qui s'en prennent aux pièges, aux tourelles et aux soldats (désamorcer, terrifier,
// purifier).
// Les mécaniques propres au combat (brûlure, noyade, drain, dégâts contre le héros, rage, renversement) sont dans
// ennemis.ts et unites.ts.
import { facteurPiquet } from './capacites-campagne';
import { placerSurChemin, segmentPour, trajetEnnemi } from './chemins';
import { defEnnemi } from './contenu';
import { libererEnnemi } from './degats';
import type { ActionEnnemi, SoinEnnemis } from './definitions';
import { ajouterEnnemi } from './ennemis';
import { repousser, tirerSurTour } from './pouvoirs-modernes';
import { EFFET, MINUTEUR, type Ennemi, type EtatPartie, type Tour, type Unite } from './etat';
import { chercherParId, distance2 } from './recherche';
import { creerZone } from './structures';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { libererBloques, mourir } from './unites';

/** Les tours à portée du lanceur perdent une part de leur cadence pendant un temps (La Faim). */
function affamer(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'affamer' }>): void {
  const rayon2 = action.rayon * action.rayon;
  const pas = Math.max(1, enPas(action.duree));
  for (const t of etat.tours) {
    if (distance2(t.x, t.y, e.x, e.y) > rayon2) continue;
    t.affameCadence = Math.max(t.affamePas > 0 ? t.affameCadence : 0, action.cadence);
    t.affamePas = Math.max(t.affamePas, pas);
  }
  etat.evenements.push({ type: 'famine', ennemi: e.id, x: e.x, y: e.y, rayon: action.rayon, duree: action.duree });
}

/**
 * La tour la plus proche du lanceur (la première en cas d'égalité) est mise en feu. Sans `rayon` (Juge des Flammes), l'action compte
 * toujours comme faite, même sans tour : il attend toute sa cadence. Avec un `rayon` (Fagotier), elle échoue s'il n'y a aucune tour à
 * portée et est retentée au pas suivant.
 */
function desactiverTour(etat: EtatPartie, e: Ennemi, duree: number, rayon?: number): boolean {
  const rayon2 = rayon === undefined ? Infinity : rayon * rayon;
  let proche: Tour | undefined;
  let min = Infinity;
  for (const t of etat.tours) {
    const d = distance2(t.x, t.y, e.x, e.y);
    if (d <= rayon2 && d < min) {
      min = d;
      proche = t;
    }
  }
  if (!proche) return rayon === undefined;
  proche.desactivee = Math.max(proche.desactivee, Math.max(1, enPas(duree)));
  etat.evenements.push({ type: 'tour_desactivee', ennemi: e.id, tour: proche.id, duree });
  return true;
}

/** `nombre` ennemis apparaissent sur le chemin du lanceur, à sa hauteur puis espacés de `ecart` tuiles vers l'entrée. */
function appeler(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'invoquer' }>): void {
  const def = defEnnemi(action.ennemi);
  if (!def) return;
  etat.evenements.push({ type: 'appel', ennemi: e.id, typeEnnemi: action.ennemi, nombre: action.nombre });
  for (let i = 0; i < action.nombre; i++) {
    ajouterEnnemi(etat, def, action.ennemi, e.chemin, Math.max(0, e.distance - i * action.ecart), false, { vague: e.vague });
  }
}

/** Les `nombre` tours les plus proches du lanceur (à moins de `rayon` tuiles), de la plus proche à la plus lointaine. */
function toursProches(etat: EtatPartie, e: Ennemi, nombre: number, rayon: number): Tour[] {
  const rayon2 = rayon * rayon;
  return etat.tours
    .map((t) => ({ t, d: distance2(t.x, t.y, e.x, e.y) }))
    .filter(({ d }) => d <= rayon2)
    .sort((a, b) => a.d - b.d)
    .slice(0, nombre)
    .map(({ t }) => t);
}

/** Gèle les tours les plus proches (Inquisiteur, Grand Inquisiteur). Faux s'il n'y en a aucune à portée. */
function figerTours(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'figer_tour' }>): boolean {
  const cibles = toursProches(etat, e, action.nombre, action.rayon ?? Infinity);
  for (const t of cibles) {
    t.gel = Math.max(t.gel, Math.max(1, enPas(action.duree)));
    etat.evenements.push({ type: 'tour_gelee', ennemi: e.id, tour: t.id, duree: action.duree });
  }
  return cibles.length > 0;
}

/** Les tours à portée voient moins loin pendant un temps (Soleil Blême). */
function aveugler(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'aveugler' }>): void {
  const rayon2 = action.rayon * action.rayon;
  const pas = Math.max(1, enPas(action.duree));
  for (const t of etat.tours) {
    if (distance2(t.x, t.y, e.x, e.y) > rayon2) continue;
    t.aveugleFacteur = Math.max(t.aveuglePas > 0 ? t.aveugleFacteur : 0, action.portee);
    t.aveuglePas = Math.max(t.aveuglePas, pas);
  }
  etat.evenements.push({ type: 'aveuglement', ennemi: e.id, x: e.x, y: e.y, rayon: action.rayon, duree: action.duree });
}

/**
 * Bannissement (Exorciste) : tue l'invocation la plus proche (spectre, renfort) à portée ; sans invocation, étourdit le
 * héros s'il est à portée. Faux s'il n'y a personne à bannir.
 */
function bannir(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'bannir' }>): boolean {
  const rayon2 = action.rayon * action.rayon;
  let invocation: Unite | undefined;
  let min = rayon2;
  for (const u of etat.unites) {
    if (u.mort || (u.genre !== 'spectre' && u.genre !== 'renfort')) continue;
    const d = distance2(u.x, u.y, e.x, e.y);
    if (d <= min) {
      min = d;
      invocation = u;
    }
  }
  if (invocation) {
    etat.evenements.push({ type: 'bannissement', ennemi: e.id, unite: invocation.id, genre: invocation.genre, duree: 0 });
    mourir(etat, invocation);
    return true;
  }
  const heros = chercherParId(etat.unites, etat.heros);
  if (!heros || heros.mort || distance2(heros.x, heros.y, e.x, e.y) > rayon2) return false;
  heros.etourdi = Math.max(heros.etourdi, Math.max(1, enPas(action.etourdissement)));
  libererBloques(etat, heros);
  etat.evenements.push({ type: 'bannissement', ennemi: e.id, unite: heros.id, genre: heros.genre, duree: action.etourdissement });
  return true;
}

/** Relève les derniers ennemis morts, du plus ancien au plus récent, là où ils sont tombés. Faux s'il n'y en a aucun. */
function releverMorts(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'relever_morts' }>): boolean {
  const morts = etat.morts.splice(Math.max(0, etat.morts.length - action.nombre), action.nombre);
  if (morts.length === 0) return false;
  etat.evenements.push({ type: 'resurrection', ennemi: e.id, nombre: morts.length });
  for (const mort of morts) {
    const def = defEnnemi(mort.type);
    if (!def) continue;
    // Un mort de binôme se relève seul : chacun des deux est relevé pour son compte.
    const releve = ajouterEnnemi(etat, def, mort.type, mort.chemin, mort.distance, mort.elite, { vague: mort.vague, seul: true });
    releve.pv = releve.pvMax * action.pv;
  }
  return true;
}

/** Charge : vitesse multipliée un temps, sans s'arrêter aux soldats (ceux qui le bloquaient le lâchent). */
function charger(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'charger' }>): void {
  e.charge = Math.max(e.charge, Math.max(1, enPas(action.duree)));
  e.accelerationCharge = Math.max(e.accelerationCharge, Math.max(1, enPas(action.duree)));
  e.chargeVitesse = action.vitesse;
  libererEnnemi(etat, e);
  etat.evenements.push({ type: 'charge', ennemi: e.id, x: e.x, y: e.y, duree: action.duree });
}

/** Intouchable le temps de l'effet, sans bouger (Roi Fou à ses seuils de PV). */
function protegerTemporairement(etat: EtatPartie, e: Ennemi, duree: number): void {
  e.invulnerable = Math.max(e.invulnerable, Math.max(1, enPas(duree)));
  e.effetsPas.fill(0);
  libererEnnemi(etat, e);
  etat.evenements.push({ type: 'invulnerabilite', ennemi: e.id, x: e.x, y: e.y, duree });
}

/** Plonge : intouchable le temps de la plongée, il réapparaîtra plus loin sur son chemin. */
function plonger(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'plonger' }>): void {
  e.invulnerable = Math.max(e.invulnerable, Math.max(1, enPas(action.duree)));
  e.saut += action.saut;
  e.effetsPas.fill(0);
  libererEnnemi(etat, e);
  etat.evenements.push({ type: 'plongee', ennemi: e.id, x: e.x, y: e.y, delai: action.duree });
}

/** Une tourelle d'atelier ou de héros détruite par le Sapeur n'est pas rebâtie aussitôt : le minuteur de construction de son origine repart de sa valeur pleine. */
function reinitialiserConstruction(etat: EtatPartie, origine: number): void {
  const tour = chercherParId(etat.tours, origine);
  const unite = tour ? undefined : chercherParId(etat.unites, origine);
  const constructeur = (tour ? tour.stats.atelier : unite?.stats.capacites?.ouvrage)?.constructeur;
  const minuteurs = tour?.minuteurs ?? unite?.minuteurs;
  if (constructeur && minuteurs) minuteurs[MINUTEUR.tourelle] = Math.max(1, enPas(constructeur.cadence));
}

/** Sapeur : les pièges et les tourelles des alliés à portée sont détruits. Faux s'il n'y en a aucun. */
function desamorcer(etat: EtatPartie, e: Ennemi, rayon: number): boolean {
  const rayon2 = rayon * rayon;
  let nombre = 0;
  etat.pieges = etat.pieges.filter((p) => {
    const proche = distance2(p.x, p.y, e.x, e.y) <= rayon2;
    if (proche) {
      nombre++;
      etat.evenements.push({ type: 'piege_desamorce', piege: p.id, ennemi: e.id, x: p.x, y: p.y });
    }
    return !proche;
  });
  etat.structures = etat.structures.filter((s) => {
    const proche = distance2(s.x, s.y, e.x, e.y) <= rayon2;
    if (proche) {
      nombre++;
      etat.evenements.push({ type: 'structure_fin', structure: s.id, x: s.x, y: s.y });
      reinitialiserConstruction(etat, s.origine);
    }
    return !proche;
  });
  if (nombre === 0) return false;
  etat.evenements.push({ type: 'desamorcage', ennemi: e.id, x: e.x, y: e.y, nombre });
  return true;
}

/** Aumônier : les ennemis à portée (lui compris) perdent leur ralentissement et leur étourdissement. Faux si aucun n'en avait. */
function purifier(etat: EtatPartie, e: Ennemi, rayon: number): boolean {
  const rayon2 = rayon * rayon;
  let purifie = false;
  for (const autre of etat.ennemis) {
    if (!autre.vivant || distance2(autre.x, autre.y, e.x, e.y) > rayon2) continue;
    for (const k of [EFFET.ralentissement, EFFET.etourdissement]) {
      if ((autre.effetsPas[k] ?? 0) > 0) {
        autre.effetsPas[k] = 0;
        purifie = true;
      }
    }
  }
  if (purifie) etat.evenements.push({ type: 'purification', ennemi: e.id, x: e.x, y: e.y, rayon });
  return purifie;
}

/** Chantre : les soldats, le héros et les autres unités ciblables à portée sont étourdis et lâchent leurs ennemis. Faux s'il n'y en a aucune. */
function terrifier(etat: EtatPartie, e: Ennemi, rayon: number, etourdissement: number): boolean {
  const rayon2 = rayon * rayon;
  const pas = Math.max(1, enPas(etourdissement));
  let touche = false;
  for (const u of etat.unites) {
    if (u.mort || u.stats.capacites?.ciblable === false || distance2(u.x, u.y, e.x, e.y) > rayon2) continue;
    u.etourdi = Math.max(u.etourdi, pas);
    libererBloques(etat, u);
    touche = true;
  }
  if (touche) etat.evenements.push({ type: 'terreur', ennemi: e.id, x: e.x, y: e.y, rayon, duree: etourdissement });
  return touche;
}

/** Actions qui supposent un chemin : un ennemi en couloir (Vol de Corbeaux) les ignore. */
const ACTIONS_DE_CHEMIN: ReadonlySet<ActionEnnemi['type']> = new Set(['invoquer', 'plonger']);

/**
 * Exécute une action ; faux si elle n'a eu aucun effet (personne à geler, à bannir, à relever, ou action de chemin d'un ennemi en
 * couloir) : l'action périodique est retentée.
 */
function executerAction(etat: EtatPartie, e: Ennemi, action: ActionEnnemi): boolean {
  if (e.couloir >= 0 && ACTIONS_DE_CHEMIN.has(action.type)) return false;
  switch (action.type) {
    case 'affamer':
      affamer(etat, e, action);
      return true;
    case 'desactiver_tour':
      return desactiverTour(etat, e, action.duree, action.rayon);
    case 'invoquer':
      appeler(etat, e, action);
      return true;
    case 'plonger':
      plonger(etat, e, action);
      return true;
    case 'figer_tour':
      return figerTours(etat, e, action);
    case 'aveugler':
      aveugler(etat, e, action);
      return true;
    case 'bannir':
      return bannir(etat, e, action);
    case 'relever_morts':
      return releverMorts(etat, e, action);
    case 'charger':
      charger(etat, e, action);
      return true;
    case 'invulnerabilite':
      protegerTemporairement(etat, e, action.duree);
      return true;
    case 'desamorcer':
      return desamorcer(etat, e, action.rayon);
    case 'purifier':
      return purifier(etat, e, action.rayon);
    case 'terrifier':
      return terrifier(etat, e, action.rayon, action.etourdissement);
    case 'repousser':
      return repousser(etat, e, action);
    case 'tirer_tour':
      return tirerSurTour(etat, e, action);
  }
}

/** Fin de l'intouchabilité : après une plongée, l'ennemi saute plus loin sur son chemin ; il est de nouveau là. */
function emerger(etat: EtatPartie, e: Ennemi): void {
  const chemin = trajetEnnemi(etat, e);
  if (e.saut > 0 && chemin) {
    e.distance = Math.min(chemin.longueur, e.distance + e.saut);
    e.segment = segmentPour(chemin, e.distance, e.segment);
    placerSurChemin(chemin, e.distance, e.segment, e.decalage, e);
  }
  e.saut = 0;
  etat.evenements.push({ type: 'emergence', ennemi: e.id, x: e.x, y: e.y });
}

/** Soigne les autres ennemis proches ; sans blessé à soigner, il réessaie au pas suivant. */
function soigner(etat: EtatPartie, e: Ennemi, soin: SoinEnnemis): void {
  if (e.rechargeSoin > 0) {
    e.rechargeSoin--;
    if (e.rechargeSoin > 0) return;
  }
  const rayon2 = soin.rayon * soin.rayon;
  let soigne = false;
  for (const autre of etat.ennemis) {
    if (autre === e || !autre.vivant || autre.invulnerable > 0 || autre.pv >= autre.pvMax || distance2(autre.x, autre.y, e.x, e.y) > rayon2) continue;
    const rendu = Math.min(autre.pvMax - autre.pv, autre.pvMax * soin.quantite);
    autre.pv += rendu;
    soigne = true;
    etat.evenements.push({ type: 'soin_ennemi', source: e.id, ennemi: autre.id, pv: rendu });
  }
  if (soigne) e.rechargeSoin = Math.max(1, enPas(soin.cadence));
}

/**
 * Auras de vitesse (Porte-Bannière, Prince Croisé) : chaque ennemi vivant reçoit le bonus de la plus forte aura qui le
 * couvre, jamais la somme (non cumulable). L'ennemi qui porte l'aura n'en profite pas.
 */
function appliquerAuras(etat: EtatPartie): void {
  for (const e of etat.ennemis) {
    e.bonusVitesse = 0;
    e.bonusProtection = 0;
  }
  for (const source of etat.ennemis) {
    const aura = source.pouvoirs?.aura;
    const protection = source.pouvoirs?.auraProtection;
    if ((!aura && !protection) || !source.vivant || source.invulnerable > 0) continue;
    for (const e of etat.ennemis) {
      if (e === source || !e.vivant) continue;
      const d2 = distance2(e.x, e.y, source.x, source.y);
      if (aura && d2 <= aura.rayon * aura.rayon) e.bonusVitesse = Math.max(e.bonusVitesse, aura.vitesse);
      if (protection && d2 <= protection.rayon * protection.rayon) e.bonusProtection = Math.max(e.bonusProtection, protection.reduction);
    }
  }
}

/** Échange l'armure et la résistance magique de l'ennemi toutes les `periode` secondes (Effigie du Roi). */
function alterner(etat: EtatPartie, e: Ennemi, periode: number): void {
  e.alternancePas--;
  if (e.alternancePas > 0) return;
  e.alternancePas = Math.max(1, enPas(periode));
  const armure = e.armure;
  e.armure = e.resistance;
  e.resistance = armure;
  etat.evenements.push({ type: 'inversion', ennemi: e.id, x: e.x, y: e.y });
}

/**
 * Un pas de pouvoirs pour chaque ennemi vivant (ceux appelés pendant le pas commencent au pas suivant) : auras, décompte de
 * l'intouchabilité, soin, paliers de PV franchis (chacun une seule fois, dans l'ordre), actions périodiques (celles à
 * phase seulement dans leur phase). Un ennemi intouchable ne fait rien d'autre qu'attendre.
 */
export function mettreAJourPouvoirsEnnemis(etat: EtatPartie): void {
  appliquerAuras(etat);
  const n = etat.ennemis.length;
  for (let i = 0; i < n; i++) {
    const e = etat.ennemis[i];
    if (!e?.vivant) continue;
    if (e.invulnerable > 0) {
      e.invulnerable--;
      if (e.invulnerable === 0) emerger(etat, e);
      continue;
    }
    const pouvoirs = e.pouvoirs;
    if (!pouvoirs) continue;
    if (pouvoirs.regeneration && e.pv < e.pvMax) e.pv = Math.min(e.pvMax, e.pv + (e.pvMax * pouvoirs.regeneration.quantite) / PAS_PAR_SECONDE);
    if (pouvoirs.alternance) alterner(etat, e, pouvoirs.alternance.periode);
    if (pouvoirs.soin) soigner(etat, e, pouvoirs.soin);
    const paliers = pouvoirs.paliers;
    if (paliers) {
      for (let palier = paliers[e.palier]; palier && e.pv <= e.pvMax * palier.pv; palier = paliers[e.palier]) {
        e.palier++;
        for (const action of palier.actions) executerAction(etat, e, action);
      }
    }
    const periodiques = pouvoirs.periodiques;
    if (periodiques) {
      periodiques.forEach((periodique, k) => {
        const cadence = Math.max(1, enPas(periodique.cadence));
        const phase = periodique.phase;
        if (phase) {
          // Hors de sa phase, le délai repart de zéro : la première action d'une phase vient une cadence après son début.
          const part = e.pv / e.pvMax;
          if (part > phase[0] || part <= phase[1]) {
            e.minuteurs[k] = cadence;
            return;
          }
        }
        const attente = e.minuteurs[k] ?? 0;
        if (attente > 1) {
          e.minuteurs[k] = attente - 1;
          return;
        }
        let agi = false;
        for (const action of periodique.actions) if (executerAction(etat, e, action)) agi = true;
        // Sans effet (personne à geler ou à bannir), elle est retentée au pas suivant au lieu d'attendre toute la cadence.
        e.minuteurs[k] = agi ? cadence : 1;
      });
    }
  }
}

/** Dégâts des nuages toxiques aux unités alliées qui s'y trouvent (avant que la zone ne s'éteigne : toute sa durée compte). */
export function mettreAJourNuages(etat: EtatPartie): void {
  for (const zone of etat.zones) {
    if (zone.degatsAllies <= 0) continue;
    const rayon2 = zone.rayon * zone.rayon;
    const montant = zone.degatsAllies / PAS_PAR_SECONDE;
    for (const u of etat.unites) {
      if (u.mort || distance2(u.x, u.y, zone.x, zone.y) > rayon2) continue;
      // « Piquet » (campagne) : le nuage aussi est amoindri pour des soldats qui tiennent la ligne.
      u.pv -= montant * facteurPiquet(etat, u);
      if (u.pv <= 0) mourir(etat, u);
    }
  }
}

/** Un ennemi tué (et non échappé) qui laisse un nuage toxique le crée là où il est tombé, avant d'être retiré de la partie. */
export function laisserNuagesDesMorts(etat: EtatPartie): void {
  for (const e of etat.ennemis) {
    const nuage = e.pouvoirs?.nuage;
    if (!nuage || e.vivant || e.pv > 0) continue;
    creerZone(etat, { duree: nuage.duree, effets: [], critique: 0, volants: true, degatsAllies: nuage.degats }, e.x, e.y, nuage.rayon);
  }
}

/**
 * Ce que laisse un ennemi tué (et non échappé) : sa division en `nombre` ennemis là où il est tombé (Grand Manteau) et sa dernière
 * lueur, qui rend des PV aux ennemis qui l'entourent (Martyr Blême). Appelé avant que les morts ne soient retirés ; les ennemis
 * nés de la division agissent dès le pas suivant.
 */
export function laisserEffetsDesMorts(etat: EtatPartie): void {
  const n = etat.ennemis.length;
  for (let i = 0; i < n; i++) {
    const e = etat.ennemis[i];
    if (!e || e.vivant || e.pv > 0) continue;
    // Un ennemi en couloir ne se divise pas : ses morceaux, qui ne volent pas forcément, n'auraient pas de chemin.
    const division = e.couloir < 0 ? e.pouvoirs?.division : undefined;
    const def = division ? defEnnemi(division.ennemi) : undefined;
    if (division && def) {
      etat.evenements.push({ type: 'division', ennemi: e.id, typeEnnemi: division.ennemi, nombre: division.nombre, x: e.x, y: e.y });
      for (let k = 0; k < division.nombre; k++) {
        ajouterEnnemi(etat, def, division.ennemi, e.chemin, Math.max(0, e.distance - k * division.ecart), false, { vague: e.vague });
      }
    }
    const lueur = e.pouvoirs?.derniereLueur;
    if (!lueur) continue;
    const rayon2 = lueur.rayon * lueur.rayon;
    etat.evenements.push({ type: 'derniere_lueur', ennemi: e.id, x: e.x, y: e.y, rayon: lueur.rayon });
    for (const autre of etat.ennemis) {
      if (autre === e || !autre.vivant || autre.invulnerable > 0 || autre.pv >= autre.pvMax || distance2(autre.x, autre.y, e.x, e.y) > rayon2) continue;
      const rendu = Math.min(autre.pvMax - autre.pv, autre.pvMax * lueur.quantite);
      autre.pv += rendu;
      etat.evenements.push({ type: 'soin_ennemi', source: e.id, ennemi: autre.id, pv: rendu });
    }
  }
}
