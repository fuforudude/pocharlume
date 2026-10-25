// Pouvoirs des unités alliées qui s'exercent à chaque pas : régénération, soin des alliés autour, tourelles et
// pièges construits par un héros, tir à distance. Les pouvoirs qui touchent au combat au corps-à-corps
// (exécution, rage, critique, esquive) sont dans unites.ts.
import { CAPACITES_NULLES } from '../data/capacites';
import { tirer, tirerEntre } from './aleatoire';
import { appliquerEffets, estVisible, infligerDegats } from './degats';
import type { CapacitesUnite, SoinZone } from './definitions';
import { MINUTEUR, type Ennemi, type EtatPartie, type Unite } from './etat';
import { distance2 } from './recherche';
import { mettreAJourOuvrage } from './structures';
import { enPas, PAS_PAR_SECONDE } from './temps';

export function capacitesDe(u: Unite): CapacitesUnite {
  return u.stats.capacites ?? CAPACITES_NULLES;
}

function soigner(etat: EtatPartie, source: Unite, soin: SoinZone): void {
  const attente = source.minuteurs[MINUTEUR.soin] ?? 0;
  if (attente > 0) {
    source.minuteurs[MINUTEUR.soin] = attente - 1;
    return;
  }
  const rayon2 = soin.rayon * soin.rayon;
  let soigne = false;
  for (const allie of etat.unites) {
    if (allie.mort || allie.pv >= allie.stats.pv || distance2(allie.x, allie.y, source.x, source.y) > rayon2) continue;
    const rendu = Math.min(allie.stats.pv - allie.pv, allie.stats.pv * soin.quantite);
    allie.pv += rendu;
    soigne = true;
    etat.evenements.push({ type: 'soin', source: source.id, unite: allie.id, pv: rendu });
  }
  // Rien à soigner : on réessaiera au pas suivant ; sinon on attend la cadence.
  if (soigne) source.minuteurs[MINUTEUR.soin] = Math.max(1, enPas(soin.cadence));
}

/** Pouvoirs permanents d'une unité vivante : régénération, soin des alliés, tourelles et pièges. */
export function mettreAJourPouvoirs(etat: EtatPartie, u: Unite): void {
  const cap = u.stats.capacites;
  if (!cap) return;
  if (cap.regeneration > 0 && u.pv < u.stats.pv) u.pv = Math.min(u.stats.pv, u.pv + cap.regeneration / PAS_PAR_SECONDE);
  if (cap.soin) soigner(etat, u, cap.soin);
  if (cap.ouvrage) mettreAJourOuvrage(etat, u.id, u.x, u.y, cap.ouvrage, u.minuteurs);
}

/** Dégâts d'un coup d'une unité : tirage dans la fourchette, rage (proportionnelle aux PV perdus), critique. */
export function degatsDuCoup(etat: EtatPartie, u: Unite, cap: CapacitesUnite, min: number, max: number): { degats: number; critique: boolean } {
  let degats = tirerEntre(etat, min, max);
  if (cap.rage > 0) degats *= 1 + cap.rage * Math.max(0, 1 - u.pv / u.stats.pv);
  let critique = false;
  if (cap.critique) {
    critique = tirer(etat) < cap.critique.chance;
    if (critique) degats *= cap.critique.multiplicateur;
  }
  return { degats, critique };
}

/**
 * Tir d'une unité à distance (héros tireur ou soigneur) sur l'ennemi le plus avancé à portée. Elle ne bloque
 * personne et reste à son point de garde.
 */
export function tirerDeLoin(etat: EtatPartie, u: Unite): void {
  const attaque = u.stats.capacites?.distance;
  const cap = u.stats.capacites;
  if (!attaque || !cap || u.recharge > 0) return;
  const portee2 = attaque.portee * attaque.portee;
  let cible: Ennemi | undefined;
  let restantMin = Infinity;
  for (const e of etat.ennemis) {
    if (!e.vivant || (e.volant && !attaque.volants) || !estVisible(e, cap.voitFurtifs) || distance2(e.x, e.y, u.x, u.y) > portee2) continue;
    const restant = (etat.chemins[e.chemin]?.longueur ?? 0) - e.distance;
    if (restant < restantMin) {
      restantMin = restant;
      cible = e;
    }
  }
  if (!cible) return;
  u.recharge = Math.max(1, enPas(attaque.cadence));
  u.cible = cible.id;
  const { degats, critique } = degatsDuCoup(etat, u, cap, attaque.degats[0], attaque.degats[1]);
  etat.evenements.push({ type: 'tir_unite', unite: u.id, ennemi: cible.id, critique });
  infligerDegats(etat, cible, degats, attaque.typeDegats, cap.ignoreArmure);
  appliquerEffets(etat, cible, attaque.effets);
}

