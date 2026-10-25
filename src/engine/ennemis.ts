// Ennemis : apparition, effets dans le temps, déplacement le long du chemin, attaques, fuite.
import { REGLES } from '../data/regles';
import { tirer, tirerEntre } from './aleatoire';
import { placerSurChemin, segmentPour } from './chemins';
import { difficulteDe } from './contenu';
import { infligerDegats, libererEnnemi } from './degats';
import type { DefEnnemi } from './definitions';
import { EFFET, type Ennemi, type EtatPartie, type Unite } from './etat';
import { chercherParId, distance2 } from './recherche';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { blesserUnite, mourir } from './unites';

/**
 * Fait apparaître un ennemi sur un chemin, à une distance parcourue donnée. Les stats sont copiées dans
 * l'état (PV et prime ajustés par la difficulté) : le moteur ne relit plus les données ensuite.
 */
export function ajouterEnnemi(etat: EtatPartie, def: DefEnnemi, type: string, chemin: number, distance = 0): Ennemi {
  const c = etat.chemins[chemin];
  if (!c) throw new Error(`Chemin inconnu : ${String(chemin)}`);
  const difficulte = difficulteDe(etat);
  const e: Ennemi = {
    id: etat.prochainId++,
    type,
    chemin,
    distance,
    segment: segmentPour(c, distance, 0),
    decalage: (tirer(etat) * 2 - 1) * REGLES.decalageLateralMax,
    x: 0,
    y: 0,
    pv: def.pv * difficulte.pvEnnemis,
    pvMax: def.pv * difficulte.pvEnnemis,
    vitesse: def.vitesse / PAS_PAR_SECONDE,
    armure: def.armure,
    resistance: def.resistance,
    volant: def.volant,
    furtif: def.furtif,
    degatsMin: def.degats[0],
    degatsMax: def.degats[1],
    cadence: Math.max(1, enPas(def.cadence)),
    recharge: 0,
    distanceAttaque: def.distance,
    rechargeDistance: 0,
    coutVies: def.coutVies,
    prime: Math.round(def.prime * difficulte.primes),
    boss: def.boss,
    insensibleEtourdissement: def.insensibleEtourdissement,
    devore: enPas(def.devore),
    rechargeDevore: enPas(def.devore),
    bloqueur: -1,
    vivant: true,
    effetsPas: [0, 0, 0, 0, 0],
    effetsValeur: [0, 0, 0, 0, 0],
  };
  placerSurChemin(c, e.distance, e.segment, e.decalage, e);
  etat.ennemis.push(e);
  etat.evenements.push({ type: 'apparition', ennemi: e.id, typeEnnemi: type });
  return e;
}

/** Facteur de vitesse courant (0 si étourdi). */
export function facteurVitesse(e: Ennemi): number {
  if ((e.effetsPas[EFFET.etourdissement] ?? 0) > 0) return 0;
  return (e.effetsPas[EFFET.ralentissement] ?? 0) > 0 ? (e.effetsValeur[EFFET.ralentissement] ?? 1) : 1;
}

function bloqueurAuContact(etat: EtatPartie, e: Ennemi): Unite | undefined {
  if (e.bloqueur === -1) return undefined;
  const u = chercherParId(etat.unites, e.bloqueur);
  if (!u || u.mort) {
    libererEnnemi(etat, e);
    return undefined;
  }
  const portee = REGLES.distanceBlocage;
  return distance2(u.x, u.y, e.x, e.y) <= portee * portee ? u : undefined;
}

function uniteLaPlusProche(etat: EtatPartie, x: number, y: number, portee: number): Unite | undefined {
  let meilleure: Unite | undefined;
  let min = portee * portee;
  for (const u of etat.unites) {
    if (u.mort) continue;
    const d = distance2(u.x, u.y, x, y);
    if (d <= min) {
      min = d;
      meilleure = u;
    }
  }
  return meilleure;
}

function fuir(etat: EtatPartie, e: Ennemi): void {
  e.vivant = false;
  libererEnnemi(etat, e);
  etat.vies = Math.max(0, etat.vies - e.coutVies);
  etat.evenements.push({ type: 'fuite', ennemi: e.id, vies: e.coutVies });
}

function attaquerAuContact(etat: EtatPartie, e: Ennemi, u: Unite): void {
  if (e.devore > 0 && u.genre !== 'heros') {
    e.rechargeDevore--;
    if (e.rechargeDevore <= 0) {
      e.rechargeDevore = e.devore;
      etat.evenements.push({ type: 'devore', ennemi: e.id, unite: u.id });
      mourir(etat, u);
      return;
    }
  }
  if (e.recharge > 0) return;
  e.recharge = e.cadence;
  if (e.degatsMax <= 0) return;
  etat.evenements.push({ type: 'coup_ennemi', ennemi: e.id, unite: u.id, distance: false });
  blesserUnite(etat, u, tirerEntre(etat, e.degatsMin, e.degatsMax), 'physique');
}

function attaquerADistance(etat: EtatPartie, e: Ennemi): void {
  const attaque = e.distanceAttaque;
  if (!attaque || e.rechargeDistance > 0) return;
  const u = uniteLaPlusProche(etat, e.x, e.y, attaque.portee);
  if (!u) return;
  e.rechargeDistance = Math.max(1, enPas(attaque.cadence));
  etat.evenements.push({ type: 'coup_ennemi', ennemi: e.id, unite: u.id, distance: true });
  blesserUnite(etat, u, tirerEntre(etat, attaque.degats[0], attaque.degats[1]), attaque.typeDegats);
}

export function mettreAJourEnnemis(etat: EtatPartie): void {
  for (const e of etat.ennemis) {
    if (!e.vivant) continue;
    const pas = e.effetsPas;
    const valeurs = e.effetsValeur;
    // Dégâts sur la durée (purs), puis décompte des effets après usage dans ce pas.
    for (let k: number = EFFET.brulure; k <= EFFET.poison; k++) {
      const restant = pas[k] ?? 0;
      if (restant > 0) {
        pas[k] = restant - 1;
        infligerDegats(etat, e, (valeurs[k] ?? 0) / PAS_PAR_SECONDE, 'pur');
      }
    }
    if (e.pv <= 0) continue;
    const facteur = facteurVitesse(e);
    if ((pas[EFFET.etourdissement] ?? 0) > 0) pas[EFFET.etourdissement] = (pas[EFFET.etourdissement] ?? 0) - 1;
    if ((pas[EFFET.ralentissement] ?? 0) > 0) pas[EFFET.ralentissement] = (pas[EFFET.ralentissement] ?? 0) - 1;
    if (e.recharge > 0) e.recharge--;
    if (e.rechargeDistance > 0) e.rechargeDistance--;
    if (facteur === 0) continue;

    const bloqueur = e.volant ? undefined : bloqueurAuContact(etat, e);
    if (bloqueur) {
      attaquerAuContact(etat, e, bloqueur);
      continue;
    }
    const c = etat.chemins[e.chemin];
    if (!c) continue;
    e.distance += e.vitesse * facteur;
    if (e.distance >= c.longueur) {
      fuir(etat, e);
      continue;
    }
    e.segment = segmentPour(c, e.distance, e.segment);
    placerSurChemin(c, e.distance, e.segment, e.decalage, e);
    attaquerADistance(etat, e);
  }
}
