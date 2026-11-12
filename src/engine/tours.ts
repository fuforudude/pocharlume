// Tours : stats (bonus du dieu, de l'arbre et des compétences compris), coûts, soldats des casernes, ciblage, tirs,
// ondes, projectiles, boost temporaire, Atelier (tourelles et pièges).
import { REGLES } from '../data/regles';
import { tirer, tirerEntre } from './aleatoire';
import { ajusterMontant } from './argent';
import { appliquerBonusTour, bonusDeFamille, bonusEffectif } from './bonus';
import { placerSurChemin, segmentPour, trajetEnnemi } from './chemins';
import { avecCapacite } from './capacites-campagne';
import { premierEnnemi } from './ciblage';
import { defFamille, dieuDe } from './contenu';
import { appliquerEffets, estVisible, infligerDegats, partApresBouclier } from './degats';
import type { DefNiveauTour, Voie } from './definitions';
import { facteurVitesse } from './ennemis';
import type { Ennemi, EtatPartie, FamilleTour, Projectile, Tour } from './etat';
import { AUCUN_ARBRE, appliquerModsTour, modArbre, sommeModsTour } from './modificateurs';
import { chercherParId, distance2 } from './recherche';
import { bonusCritiqueZones, creerZone, mettreAJourOuvrage, poserPiege } from './structures';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { creerUnite, libererBloques, placeEnFormation } from './unites';

/** Définition brute d'un niveau de tour (niveau 1 à 3, ou 4 avec une voie). */
export function defNiveau(etat: EtatPartie, famille: FamilleTour, niveau: number, voie: Voie | null): DefNiveauTour | undefined {
  if (famille === 'divine') return niveau === 1 ? dieuDe(etat).tourDivine : undefined;
  const def = defFamille(famille);
  if (!def) return undefined;
  if (niveau === 4) return voie === 'A' || voie === 'B' ? def.specialisations[voie] : undefined;
  return def.niveaux[niveau - 1];
}

/**
 * Stats effectives d'un niveau de tour : la définition, les rangs de compétence achetés (`rangs`, même ordre que
 * `def.competences`), l'arbre d'améliorations, le bonus de famille du dieu (les PV des soldats de ces trois sources
 * s'additionnent), puis le bonus de collection de la famille (sa tour de base et ses spécialisations ; rien en Fer, rien
 * pour la tour divine).
 */
export function statsTour(etat: EtatPartie, famille: FamilleTour, def: DefNiveauTour, rangs: readonly number[] = []): DefNiveauTour {
  const stats = statsTourDuDieu(etat, famille, def, rangs);
  if (famille === 'divine') return stats;
  const collection = bonusDeFamille(bonusEffectif(etat.config), famille);
  // Puis la capacité de famille de la campagne qui change ses coups (« Perçage » ; rien dans l'histoire).
  return avecCapacite(etat, famille, collection ? appliquerBonusTour(stats, collection) : stats);
}

function statsTourDuDieu(etat: EtatPartie, famille: FamilleTour, def: DefNiveauTour, rangs: readonly number[]): DefNiveauTour {
  const bonus = dieuDe(etat).bonus;
  let base = def;
  let fractionPv = 0;
  if (famille !== 'divine') {
    const mod = sommeModsTour(def.competences, rangs);
    const arbre = modArbre(etat.config, famille);
    if (rangs.some((r) => r > 0) || arbre !== AUCUN_ARBRE) base = appliquerModsTour(def, mod, arbre);
    fractionPv = mod.pvSoldats + arbre.pvSoldats;
  }
  if (bonus.famille !== famille) return fractionPv !== 0 ? avecPvSoldats(base, fractionPv) : base;
  fractionPv += bonus.pvSoldats;
  const avecPv = fractionPv !== 0 ? avecPvSoldats(base, fractionPv) : base;
  const critique = bonus.chanceCritique > 0
    ? {
        chance: (avecPv.critique?.chance ?? 0) + bonus.chanceCritique,
        multiplicateur: avecPv.critique?.multiplicateur ?? REGLES.multiplicateurCritique,
      }
    : avecPv.critique;
  return {
    ...avecPv,
    cadence: avecPv.cadence / (1 + bonus.cadence),
    critique,
    effets: avecPv.soldats ? avecPv.effets : [...avecPv.effets, ...bonus.effets],
    soldats: avecPv.soldats ? { ...avecPv.soldats, effets: [...avecPv.soldats.effets, ...bonus.effets] } : null,
    piegeAuSol: bonus.piegeAuSol,
  };
}

function avecPvSoldats(def: DefNiveauTour, fraction: number): DefNiveauTour {
  return def.soldats ? { ...def, soldats: { ...def.soldats, pv: def.soldats.pv * (1 + fraction) } } : def;
}

/** Un montant en arêtes pour une tour de cette famille, remise (ou majoration) de famille du dieu comprise. */
export function prixFamille(etat: EtatPartie, famille: FamilleTour, montant: number): number {
  const bonus = dieuDe(etat).bonus;
  return bonus.famille === famille ? ajusterMontant(montant, 1 + bonus.prix) : montant;
}

/** Prix d'un niveau, remise de famille du dieu comprise. */
export function prix(etat: EtatPartie, famille: FamilleTour, def: DefNiveauTour): number {
  return prixFamille(etat, famille, def.cout);
}

/** Met les soldats d'une caserne au nombre et aux stats de son niveau courant (remis à neuf). */
export function synchroniserSoldats(etat: EtatPartie, tour: Tour): void {
  const soldats = tour.stats.soldats;
  if (!soldats) return;
  let n = 0;
  for (const u of etat.unites) {
    if (u.tour !== tour.id || u.genre !== 'soldat') continue;
    u.stats = soldats;
    u.delaiReapparition = Math.max(1, enPas(soldats.reapparition));
    if (!u.mort) u.pv = soldats.pv;
    n++;
  }
  for (let i = n; i < soldats.nombre; i++) {
    const place = placeEnFormation(i, tour.ralliementX, tour.ralliementY);
    creerUnite(etat, {
      genre: 'soldat',
      tour: tour.id,
      emplacement: i,
      x: tour.x,
      y: tour.y,
      ancreX: place.x,
      ancreY: place.y,
      stats: soldats,
      delaiReapparition: Math.max(1, enPas(soldats.reapparition)),
      duree: -1,
      zone: null,
    });
  }
}

/** Nouveau point de ralliement : les soldats lâchent leurs ennemis et rejoignent leur place. */
export function deplacerSoldats(etat: EtatPartie, tour: Tour): void {
  for (const u of etat.unites) {
    if (u.tour !== tour.id || u.genre !== 'soldat') continue;
    const place = placeEnFormation(u.emplacement, tour.ralliementX, tour.ralliementY);
    u.ancreX = place.x;
    u.ancreY = place.y;
    libererBloques(etat, u);
  }
}

/** Ennemis déjà touchés par une chaîne en cours (tampon réutilisé, hors état). */
const dejaTouches: number[] = [];

/** Coup au but sur une cible : dégâts, effets, puis chaîne vers les voisins visibles (pas les furtifs cachés). */
function toucher(etat: EtatPartie, s: DefNiveauTour, cible: Ennemi, degats: number, origineX: number, origineY: number): void {
  const x = cible.x;
  const y = cible.y;
  // Le bouclier frontal (Porte-Herse) arrête le coup direct venu de devant lui, sauf « Perçage » ; la chaîne qui suit n'est pas arrêtée.
  const bouclier = s.percageBouclier === true ? 1 : partApresBouclier(etat, cible, origineX, origineY);
  infligerDegats(etat, cible, degats * bouclier, s.typeDegats, s.ignoreArmure);
  appliquerEffets(etat, cible, s.effets);
  const chaine = s.chaine;
  if (!chaine) return;
  dejaTouches.length = 0;
  dejaTouches.push(cible.id);
  let px = x;
  let py = y;
  const rayon2 = chaine.rayon * chaine.rayon;
  for (let n = 0; n < chaine.nombre; n++) {
    let suivant: Ennemi | undefined;
    let min = rayon2;
    for (const e of etat.ennemis) {
      if (!e.vivant || (e.volant && !s.volants) || !estVisible(e, s.revele) || dejaTouches.includes(e.id)) continue;
      const d = distance2(e.x, e.y, px, py);
      if (d <= min) {
        min = d;
        suivant = e;
      }
    }
    if (!suivant) return;
    dejaTouches.push(suivant.id);
    px = suivant.x;
    py = suivant.y;
    infligerDegats(etat, suivant, degats * chaine.facteur, s.typeDegats, s.ignoreArmure);
    appliquerEffets(etat, suivant, s.effets);
  }
}

function frapperZone(etat: EtatPartie, s: DefNiveauTour, x: number, y: number, rayon: number, degats: number): void {
  const rayon2 = rayon * rayon;
  for (const e of etat.ennemis) {
    if (!e.vivant || (e.volant && !s.volants) || !estVisible(e, s.revele) || distance2(e.x, e.y, x, y) > rayon2) continue;
    infligerDegats(etat, e, degats, s.typeDegats, s.ignoreArmure);
    appliquerEffets(etat, e, s.effets);
  }
}

const visee = { x: 0, y: 0 };

/** Point d'impact visé par un tir au sol : position prévue de la cible à l'arrivée du projectile. */
function anticiper(etat: EtatPartie, t: Tour, e: Ennemi, vitesse: number): void {
  visee.x = e.x;
  visee.y = e.y;
  const c = trajetEnnemi(etat, e);
  if (!c || e.bloqueur !== -1) return;
  const vol = Math.sqrt(distance2(t.x, t.y, e.x, e.y)) / vitesse;
  const distance = Math.min(c.longueur, e.distance + e.vitesse * facteurVitesse(e) * vol);
  placerSurChemin(c, distance, segmentPour(c, distance, e.segment), e.decalage, visee);
}

/** Portée de tir de la tour : celle de ses stats, réduite tant qu'elle est aveuglée (Soleil Blême). */
function porteeDe(t: Tour): number {
  return t.aveuglePas > 0 ? t.stats.portee * (1 - t.aveugleFacteur) : t.stats.portee;
}

function ondeDeChoc(etat: EtatPartie, t: Tour): boolean {
  const s = t.stats;
  const portee = porteeDe(t);
  const portee2 = portee * portee;
  let present = false;
  for (const e of etat.ennemis) {
    if (e.vivant && (s.volants || !e.volant) && estVisible(e, s.revele) && distance2(e.x, e.y, t.x, t.y) <= portee2) {
      present = true;
      break;
    }
  }
  if (!present) return false;
  etat.evenements.push({ type: 'onde', tour: t.id, x: t.x, y: t.y, rayon: portee });
  for (const e of etat.ennemis) {
    if (!e.vivant || (e.volant && !s.volants) || !estVisible(e, s.revele) || distance2(e.x, e.y, t.x, t.y) > portee2) continue;
    infligerDegats(etat, e, tirerEntre(etat, s.degats[0], s.degats[1]), s.typeDegats);
    appliquerEffets(etat, e, s.effets);
  }
  return true;
}

function tirerSur(etat: EtatPartie, t: Tour, cible: Ennemi): void {
  const s = t.stats;
  let degats = tirerEntre(etat, s.degats[0], s.degats[1]);
  // Les zones comme le Voile de Nuit ajoutent des points de critique aux tirs sur un ennemi qui s'y trouve.
  const chance = (s.critique?.chance ?? 0) + bonusCritiqueZones(etat, cible.x, cible.y, cible.volant);
  const critique = chance > 0 && tirer(etat) < chance;
  if (critique) degats *= s.critique?.multiplicateur ?? REGLES.multiplicateurCritique;
  if (s.projectile <= 0) {
    etat.evenements.push({ type: 'tir', tour: t.id, cible: cible.id, projectile: -1, x: t.x, y: t.y, critique });
    toucher(etat, s, cible, degats, t.x, t.y);
    return;
  }
  const vitesse = s.projectile / PAS_PAR_SECONDE;
  const auSol = s.zone > 0;
  if (auSol) anticiper(etat, t, cible, vitesse);
  const p: Projectile = {
    id: etat.prochainId++,
    tour: t.id,
    x: t.x,
    y: t.y,
    cible: auSol ? -1 : cible.id,
    cx: auSol ? visee.x : cible.x,
    cy: auSol ? visee.y : cible.y,
    vitesse,
    degats,
    critique,
    stats: s,
    origineX: t.x,
    origineY: t.y,
  };
  etat.projectiles.push(p);
  etat.evenements.push({ type: 'tir', tour: t.id, cible: cible.id, projectile: p.id, x: t.x, y: t.y, critique });
}

/** Une tour qui révèle rend visibles de tous les furtifs de sa portée (le temps de quelques pas). */
function reveler(etat: EtatPartie, t: Tour): void {
  const portee = porteeDe(t);
  const portee2 = portee * portee;
  const duree = Math.max(1, enPas(REGLES.dureeRevelation));
  for (const e of etat.ennemis) {
    if (e.vivant && e.furtif && distance2(e.x, e.y, t.x, t.y) <= portee2) e.revele = duree;
  }
}

/** Pas entre deux tirs : la cadence de la tour, accélérée par le boost (Ingéniosité) et ralentie par la famine. */
function periodeDeTir(t: Tour): number {
  return Math.max(1, enPas(t.stats.cadence / ((1 + t.boostCadence) * (1 - t.affameCadence))));
}

export function mettreAJourTours(etat: EtatPartie): void {
  for (const t of etat.tours) {
    if (t.recharge > 0) t.recharge--;
    if (t.boostPas > 0) {
      t.boostPas--;
      if (t.boostPas === 0) t.boostCadence = 0;
    }
    if (t.affamePas > 0) {
      t.affamePas--;
      if (t.affamePas === 0) t.affameCadence = 0;
    }
    if (t.aveuglePas > 0) {
      t.aveuglePas--;
      if (t.aveuglePas === 0) t.aveugleFacteur = 0;
    }
    // En feu ou gelée : la tour ne tire pas, ne révèle pas, ne construit pas (ses soldats, eux, restent là).
    const figee = t.gel > 0 || t.desactivee > 0;
    if (t.gel > 0) t.gel--;
    if (t.desactivee > 0) t.desactivee--;
    if (figee) continue;
    const s = t.stats;
    if (s.revele) reveler(etat, t);
    if (s.atelier) {
      mettreAJourOuvrage(etat, t.id, t.x, t.y, s.atelier, t.minuteurs);
      continue;
    }
    if (t.recharge > 0 || s.soldats) continue;
    if (s.onde) {
      if (ondeDeChoc(etat, t)) t.recharge = periodeDeTir(t);
      continue;
    }
    const cible = premierEnnemi(etat, t.x, t.y, porteeDe(t), s.volants, s.revele);
    if (!cible) continue;
    tirerSur(etat, t, cible);
    t.recharge = periodeDeTir(t);
  }
}

/** Fait voler les projectiles ; à l'arrivée, dégâts sur la cible suivie ou dans la zone d'impact. */
export function mettreAJourProjectiles(etat: EtatPartie): void {
  const liste = etat.projectiles;
  let garde = 0;
  for (const p of liste) {
    let cible: Ennemi | undefined;
    if (p.cible >= 0) {
      cible = chercherParId(etat.ennemis, p.cible);
      if (cible?.vivant) {
        p.cx = cible.x;
        p.cy = cible.y;
      } else {
        // Cible perdue : le projectile finit sa course et se perd.
        cible = undefined;
        p.cible = -2;
      }
    }
    const dx = p.cx - p.x;
    const dy = p.cy - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > p.vitesse) {
      p.x += (dx / d) * p.vitesse;
      p.y += (dy / d) * p.vitesse;
      liste[garde++] = p;
      continue;
    }
    p.x = p.cx;
    p.y = p.cy;
    const s = p.stats;
    etat.evenements.push({ type: 'impact', projectile: p.id, tour: p.tour, x: p.x, y: p.y, zone: s.zone });
    if (s.zone > 0) {
      frapperZone(etat, s, p.x, p.y, s.zone, p.degats);
      if (s.nappe) creerZone(etat, s.nappe, p.x, p.y, s.nappe.rayon);
      // Un tir au sol de la famille d'un dieu qui sème des pièges (Pollen) en laisse parfois un à l'impact.
      if (s.piegeAuSol && tirer(etat) < s.piegeAuSol.chance) poserPiege(etat, s.piegeAuSol.piege, p.x, p.y);
    } else if (cible) {
      // L'origine est celle du tir : le bouclier frontal ne dépend pas d'une tour vendue entre-temps.
      toucher(etat, s, cible, p.degats, p.origineX, p.origineY);
    }
  }
  liste.length = garde;
}
