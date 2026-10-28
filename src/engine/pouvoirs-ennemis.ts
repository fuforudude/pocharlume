// Pouvoirs des ennemis qui s'exercent à chaque pas, tous pilotés par `Ennemi.pouvoirs` (données) : fin de
// l'intouchabilité (relèvement, plongée), paliers de PV et actions périodiques des boss (affamer les tours,
// mettre une tour en feu, appeler des ennemis, plonger), soin des ennemis proches, nuage toxique laissé à la mort.
// Les mécaniques propres au combat (brûlure, noyade, drain, dégâts contre le héros) sont dans ennemis.ts et unites.ts.
import { placerSurChemin, segmentPour } from './chemins';
import { defEnnemi } from './contenu';
import { libererEnnemi } from './degats';
import type { ActionEnnemi, SoinEnnemis } from './definitions';
import { ajouterEnnemi } from './ennemis';
import type { Ennemi, EtatPartie, Tour } from './etat';
import { distance2 } from './recherche';
import { creerZone } from './structures';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { mourir } from './unites';

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

/** La tour la plus proche du lanceur est mise en feu (Juge des Flammes). */
function desactiverTour(etat: EtatPartie, e: Ennemi, duree: number): void {
  let proche: Tour | undefined;
  let min = Infinity;
  for (const t of etat.tours) {
    const d = distance2(t.x, t.y, e.x, e.y);
    if (d < min) {
      min = d;
      proche = t;
    }
  }
  if (!proche) return;
  proche.desactivee = Math.max(proche.desactivee, Math.max(1, enPas(duree)));
  etat.evenements.push({ type: 'tour_desactivee', ennemi: e.id, tour: proche.id, duree });
}

/** `nombre` ennemis apparaissent sur le chemin du lanceur, à sa hauteur puis espacés de `ecart` tuiles vers l'entrée. */
function appeler(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'invoquer' }>): void {
  const def = defEnnemi(action.ennemi);
  if (!def) return;
  etat.evenements.push({ type: 'appel', ennemi: e.id, typeEnnemi: action.ennemi, nombre: action.nombre });
  for (let i = 0; i < action.nombre; i++) ajouterEnnemi(etat, def, action.ennemi, e.chemin, Math.max(0, e.distance - i * action.ecart));
}

/** Plonge : intouchable le temps de la plongée, il réapparaîtra plus loin sur son chemin. */
function plonger(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'plonger' }>): void {
  e.invulnerable = Math.max(e.invulnerable, Math.max(1, enPas(action.duree)));
  e.saut += action.saut;
  e.effetsPas.fill(0);
  libererEnnemi(etat, e);
  etat.evenements.push({ type: 'plongee', ennemi: e.id, x: e.x, y: e.y, delai: action.duree });
}

function executerAction(etat: EtatPartie, e: Ennemi, action: ActionEnnemi): void {
  switch (action.type) {
    case 'affamer':
      affamer(etat, e, action);
      return;
    case 'desactiver_tour':
      desactiverTour(etat, e, action.duree);
      return;
    case 'invoquer':
      appeler(etat, e, action);
      return;
    case 'plonger':
      plonger(etat, e, action);
      return;
  }
}

/** Fin de l'intouchabilité : après une plongée, l'ennemi saute plus loin sur son chemin ; il est de nouveau là. */
function emerger(etat: EtatPartie, e: Ennemi): void {
  const chemin = etat.chemins[e.chemin];
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
 * Un pas de pouvoirs pour chaque ennemi vivant (ceux appelés pendant le pas commencent au pas suivant) : décompte de
 * l'intouchabilité, soin, paliers de PV franchis (chacun une seule fois, dans l'ordre), actions périodiques. Un ennemi
 * intouchable ne fait rien d'autre qu'attendre.
 */
export function mettreAJourPouvoirsEnnemis(etat: EtatPartie): void {
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
        const attente = e.minuteurs[k] ?? 0;
        if (attente > 1) {
          e.minuteurs[k] = attente - 1;
          return;
        }
        for (const action of periodique.actions) executerAction(etat, e, action);
        e.minuteurs[k] = Math.max(1, enPas(periodique.cadence));
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
      u.pv -= montant;
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
