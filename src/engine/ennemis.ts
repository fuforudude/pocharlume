// Ennemis : apparition, effets dans le temps, déplacement le long du chemin, attaques, fuite.
import { REGLES } from '../data/regles';
import { tirer, tirerEntre } from './aleatoire';
import { ajusterMontant } from './argent';
import { placerSurChemin, segmentPour } from './chemins';
import { difficulteDe } from './contenu';
import { infligerDegats, libererEnnemi } from './degats';
import type { BrulureContact, DefEnnemi, Drain, Noyade, Rage, Renversement } from './definitions';
import { EFFET, type Ennemi, type EtatPartie, type Unite } from './etat';
import { chercherParId, distance2 } from './recherche';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { blesserUnite, libererBloques, mourir } from './unites';

/** Le palier de protection au-dessus de `valeur` (le dernier si elle y est déjà) : 0 → 30 %, 30 → 60 %, 60 → 90 %, 90 → 90 %. */
function palierSuperieur(valeur: number): number {
  for (const palier of REGLES.paliersProtection) if (palier > valeur) return palier;
  return REGLES.paliersProtection[REGLES.paliersProtection.length - 1] ?? valeur;
}

/** Réglages facultatifs de l'apparition d'un ennemi. */
export interface OptionsApparition {
  /** Part de ses PV et de sa prime (1 par défaut) : un mini-boss de l'infini est un boss à 30 % de ses PV. */
  facteurPv?: number;
  /** Index (de 0) de la vague dont il fait partie ; par défaut la dernière vague lancée. */
  vague?: number;
}

/**
 * Fait apparaître un ennemi sur un chemin, à une distance parcourue donnée. Les stats sont copiées dans
 * l'état (PV et prime ajustés par la difficulté) : le moteur ne relit plus les données ensuite.
 * `elite` : version d'élite (PV, un palier d'armure et de résistance de plus, prime, une vie de plus) ; sans effet
 * sur un boss.
 */
export function ajouterEnnemi(etat: EtatPartie, def: DefEnnemi, type: string, chemin: number, distance = 0, elite = false, options: OptionsApparition = {}): Ennemi {
  const c = etat.chemins[chemin];
  if (!c) throw new Error(`Chemin inconnu : ${String(chemin)}`);
  const difficulte = difficulteDe(etat);
  const estElite = elite && !def.boss;
  const facteurPv = options.facteurPv ?? 1;
  const prime = ajusterMontant(def.prime, difficulte.primes * facteurPv);
  const pv = def.pv * difficulte.pvEnnemis * facteurPv * (estElite ? REGLES.elite.facteurPv : 1);
  const e: Ennemi = {
    id: etat.prochainId++,
    type,
    chemin,
    distance,
    segment: segmentPour(c, distance, 0),
    decalage: (tirer(etat) * 2 - 1) * REGLES.decalageLateralMax,
    x: 0,
    y: 0,
    pv,
    pvMax: pv,
    vitesse: def.vitesse / PAS_PAR_SECONDE,
    armure: estElite ? palierSuperieur(def.armure) : def.armure,
    resistance: estElite ? palierSuperieur(def.resistance) : def.resistance,
    volant: def.volant,
    furtif: def.furtif,
    revele: 0,
    degatsMin: def.degats[0],
    degatsMax: def.degats[1],
    cadence: Math.max(1, enPas(def.cadence)),
    recharge: 0,
    distanceAttaque: def.distance,
    rechargeDistance: 0,
    coutVies: estElite ? def.coutVies + REGLES.elite.viesEnPlus : def.coutVies,
    prime: estElite ? ajusterMontant(prime, REGLES.elite.facteurPrime) : prime,
    boss: def.boss,
    insensibleEtourdissement: def.insensibleEtourdissement,
    devore: enPas(def.devore),
    rechargeDevore: enPas(def.devore),
    elite: estElite,
    pouvoirs: def.pouvoirs ?? null,
    releves: def.pouvoirs?.relevement?.fois ?? 0,
    vague: options.vague ?? Math.max(0, etat.vagues.lancees - 1),
    bonusVitesse: 0,
    charge: 0,
    chargeVitesse: 1,
    renversements: def.pouvoirs?.renversement ? 1 : 0,
    invulnerable: 0,
    saut: 0,
    palier: 0,
    minuteurs: (def.pouvoirs?.periodiques ?? []).map((p) => Math.max(1, enPas(p.cadence))),
    rechargeSoin: def.pouvoirs?.soin ? Math.max(1, enPas(def.pouvoirs.soin.cadence)) : 0,
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

/** La rage de l'ennemi, s'il en a une et que ses PV sont assez bas (Flagellant) ; sinon null. */
function rageActive(e: Ennemi): Rage | null {
  const rage = e.pouvoirs?.rage;
  return rage && e.pv <= e.pvMax * rage.pv ? rage : null;
}

/** Facteur de vitesse courant (0 si étourdi) : ralentissement, charge, aura d'un autre ennemi et rage. */
export function facteurVitesse(e: Ennemi): number {
  if ((e.effetsPas[EFFET.etourdissement] ?? 0) > 0) return 0;
  let facteur = (e.effetsPas[EFFET.ralentissement] ?? 0) > 0 ? (e.effetsValeur[EFFET.ralentissement] ?? 1) : 1;
  if (e.charge > 0) facteur *= e.chargeVitesse;
  facteur *= 1 + e.bonusVitesse;
  const rage = rageActive(e);
  return rage ? facteur * (1 + rage.vitesse) : facteur;
}

/** Facteur de ses dégâts (rage). */
function facteurDegats(e: Ennemi): number {
  const rage = rageActive(e);
  return rage ? 1 + rage.degats : 1;
}

/**
 * Bloqueur qui arrête l'ennemi ce pas-ci. Un bloqueur mort, ou qui n'est plus au contact sans viser cet
 * ennemi (provocation dont il s'est éloigné), le relâche : pas de blocage fantôme.
 */
function bloqueurAuContact(etat: EtatPartie, e: Ennemi): Unite | undefined {
  if (e.bloqueur === -1) return undefined;
  const u = chercherParId(etat.unites, e.bloqueur);
  if (!u || u.mort) {
    libererEnnemi(etat, e);
    return undefined;
  }
  const portee = REGLES.distanceBlocage;
  if (distance2(u.x, u.y, e.x, e.y) <= portee * portee) return u;
  if (u.cible !== e.id) libererEnnemi(etat, e);
  return undefined;
}

function uniteLaPlusProche(etat: EtatPartie, x: number, y: number, portee: number): Unite | undefined {
  let meilleure: Unite | undefined;
  let min = portee * portee;
  for (const u of etat.unites) {
    if (u.mort || u.stats.capacites?.ciblable === false) continue;
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
  if (e.coutVies > 0) etat.viePerdue = true;
  etat.evenements.push({ type: 'fuite', ennemi: e.id, vies: e.coutVies });
}

/** Dégâts d'un coup de l'ennemi sur une unité : multipliés contre un héros pour qui a `degatsHeros` (Chasseur de Sorcières). */
function degatsContre(e: Ennemi, u: Unite, montant: number): number {
  return u.genre === 'heros' ? montant * (e.pouvoirs?.degatsHeros ?? 1) : montant;
}

/** Drain : retire des PV (purs, sans esquive) à l'unité touchée et en rend une part à l'ennemi, à chaque pas de contact. */
function drainer(etat: EtatPartie, e: Ennemi, u: Unite, drain: Drain): void {
  const montant = drain.degats / PAS_PAR_SECONDE;
  u.pv -= montant;
  e.pv = Math.min(e.pvMax, e.pv + montant * drain.soin);
  if (u.pv <= 0) mourir(etat, u);
}

/** Noyade : l'unité (hors héros) que le noyeur tient au contact est entraînée sous l'eau, une seule fois à la fois. */
function noyer(etat: EtatPartie, e: Ennemi, u: Unite, noyade: Noyade): void {
  if (u.genre === 'heros' || u.noyade > 0) return;
  u.noyade = Math.max(1, enPas(noyade.delai));
  u.noyeur = e.id;
  etat.evenements.push({ type: 'noyade', ennemi: e.id, unite: u.id, delai: noyade.delai });
}

/** Brûlure : l'unité touchée au corps-à-corps prend feu ; une brûlure en cours est prolongée, jamais cumulée. */
function enflammer(etat: EtatPartie, e: Ennemi, u: Unite, brulure: BrulureContact): void {
  if (u.mort) return;
  if (u.brulure === 0) etat.evenements.push({ type: 'brulure', ennemi: e.id, unite: u.id });
  u.brulure = Math.max(u.brulure, enPas(brulure.duree));
  u.brulureDegats = Math.max(u.brulureDegats, brulure.degats);
}

/** Le Cavalier renverse l'unité qui le bloque (étourdie, elle lâche tous ceux qu'elle bloque) et passe : une seule fois. */
function renverser(etat: EtatPartie, e: Ennemi, u: Unite, renversement: Renversement): void {
  e.renversements--;
  u.etourdi = Math.max(u.etourdi, Math.max(1, enPas(renversement.etourdissement)));
  libererBloques(etat, u);
  etat.evenements.push({ type: 'renversement', ennemi: e.id, unite: u.id, duree: renversement.etourdissement });
}

function attaquerAuContact(etat: EtatPartie, e: Ennemi, u: Unite): void {
  const pouvoirs = e.pouvoirs;
  if (pouvoirs?.drain) {
    drainer(etat, e, u, pouvoirs.drain);
    if (u.mort) return;
  }
  if (pouvoirs?.noyade) noyer(etat, e, u, pouvoirs.noyade);
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
  blesserUnite(etat, u, degatsContre(e, u, tirerEntre(etat, e.degatsMin, e.degatsMax) * facteurDegats(e)), 'physique', e.id);
  if (pouvoirs?.brulure) enflammer(etat, e, u, pouvoirs.brulure);
}

function attaquerADistance(etat: EtatPartie, e: Ennemi): void {
  const attaque = e.distanceAttaque;
  if (!attaque || e.rechargeDistance > 0) return;
  const u = uniteLaPlusProche(etat, e.x, e.y, attaque.portee);
  if (!u) return;
  e.rechargeDistance = Math.max(1, enPas(attaque.cadence));
  etat.evenements.push({ type: 'coup_ennemi', ennemi: e.id, unite: u.id, distance: true });
  blesserUnite(etat, u, degatsContre(e, u, tirerEntre(etat, attaque.degats[0], attaque.degats[1]) * facteurDegats(e)), attaque.typeDegats, e.id);
}

export function mettreAJourEnnemis(etat: EtatPartie): void {
  for (const e of etat.ennemis) {
    // À terre ou plongé : rien ne le touche, il ne bouge ni n'attaque (voir pouvoirs-ennemis.ts).
    if (!e.vivant || e.invulnerable > 0) continue;
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
    if (e.pv <= 0 || e.invulnerable > 0) continue;
    const facteur = facteurVitesse(e);
    const enCharge = e.charge > 0;
    if ((pas[EFFET.etourdissement] ?? 0) > 0) pas[EFFET.etourdissement] = (pas[EFFET.etourdissement] ?? 0) - 1;
    if ((pas[EFFET.ralentissement] ?? 0) > 0) pas[EFFET.ralentissement] = (pas[EFFET.ralentissement] ?? 0) - 1;
    if (e.revele > 0) e.revele--;
    if (e.recharge > 0) e.recharge--;
    if (e.rechargeDistance > 0) e.rechargeDistance--;
    if (e.charge > 0) e.charge--;
    if (facteur === 0) continue;

    // Un volant, ou un ennemi en pleine charge, ne s'arrête pas aux soldats.
    let bloqueur = e.volant || enCharge ? undefined : bloqueurAuContact(etat, e);
    const renversement = e.pouvoirs?.renversement;
    if (bloqueur && renversement && e.renversements > 0 && bloqueur.genre !== 'heros') {
      renverser(etat, e, bloqueur, renversement);
      bloqueur = undefined;
    }
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
