// Dégâts infligés aux ennemis, protections et effets (ralentissement, étourdissement, dégâts sur la durée).
import { REGLES } from '../data/regles';
import { tirer } from './aleatoire';
import type { EffetCoup, Relevement, TypeDegats } from './definitions';
import { EFFET, type Ennemi, type EtatPartie } from './etat';
import { chercherParId } from './recherche';
import { enPas } from './temps';

/** Part des dégâts qui passe les protections. `ignoreArmure` : part de l'armure physique que le coup ignore. */
export function partRestante(type: TypeDegats, armure: number, resistance: number, ignoreArmure = 0): number {
  if (type === 'physique') return 1 - armure * (1 - ignoreArmure);
  if (type === 'magique') return 1 - resistance;
  return 1;
}

/** L'ennemi n'a plus de bloqueur (mort, fuite, bloqueur parti). */
export function libererEnnemi(etat: EtatPartie, e: Ennemi): void {
  if (e.bloqueur === -1) return;
  const u = chercherParId(etat.unites, e.bloqueur);
  if (u) {
    u.bloques = Math.max(0, u.bloques - 1);
    if (u.cible === e.id) u.cible = -1;
  }
  e.bloqueur = -1;
}

function tuer(etat: EtatPartie, e: Ennemi): void {
  e.vivant = false;
  e.pv = 0;
  // Un voleur tué rend le butin qu'il portait en plus de sa prime.
  etat.aretes += e.prime + e.butin;
  libererEnnemi(etat, e);
  if (!e.boss) {
    etat.morts.push({ type: e.type, chemin: e.chemin, distance: e.distance, elite: e.elite, vague: e.vague });
    if (etat.morts.length > REGLES.memoireMorts) etat.morts.shift();
  }
  etat.evenements.push({ type: 'mort', ennemi: e.id, typeEnnemi: e.type, x: e.x, y: e.y, prime: e.prime + e.butin });
}

/**
 * Un ennemi qui se relève au lieu de mourir : il tombe (intouchable le temps du délai, plus d'effets, plus de bloqueur),
 * puis repart avec une part de ses PV maximaux. Pas de prime : il n'est pas mort.
 */
function relever(etat: EtatPartie, e: Ennemi, relevement: Relevement): void {
  e.releves--;
  e.pv = e.pvMax * relevement.pv;
  e.invulnerable = Math.max(1, enPas(relevement.delai));
  e.effetsPas.fill(0);
  libererEnnemi(etat, e);
  etat.evenements.push({ type: 'releve', ennemi: e.id, x: e.x, y: e.y, delai: relevement.delai });
}

/**
 * Inflige des dégâts après protections ; verse la prime si l'ennemi meurt (ou le relève s'il le peut). Un ennemi
 * intouchable (à terre, plongé) ne subit rien. Renvoie les dégâts subis.
 */
export function infligerDegats(etat: EtatPartie, e: Ennemi, montant: number, type: TypeDegats, ignoreArmure = 0): number {
  if (!e.vivant || e.invulnerable > 0) return 0;
  // L'aura d'un autre ennemi (Crieur Public) amoindrit les dégâts physiques et magiques, pas les dégâts purs.
  const subis = montant * partRestante(type, e.armure, e.resistance, ignoreArmure) * (type === 'pur' ? 1 : 1 - e.bonusProtection);
  e.pv -= subis;
  if (e.pv <= 0) {
    const relevement = e.pouvoirs?.relevement;
    if (relevement && e.releves > 0 && type !== relevement.sauf) relever(etat, e, relevement);
    else tuer(etat, e);
  }
  return subis;
}

/**
 * Part des dégâts d'un coup direct tiré depuis (x, y) qui passe le bouclier frontal de l'ennemi (1 s'il n'en a pas) : le bouclier
 * arrête le coup venu de devant lui, c'est-à-dire du côté où son chemin le mène, pas celui venu de côté ou de derrière.
 */
export function partApresBouclier(etat: EtatPartie, e: Ennemi, x: number, y: number): number {
  const bouclier = e.pouvoirs?.bouclier;
  if (!bouclier) return 1;
  const chemin = etat.chemins[e.chemin];
  if (!chemin) return 1;
  const devant = (x - e.x) * (chemin.dirX[e.segment] ?? 0) + (y - e.y) * (chemin.dirY[e.segment] ?? 0) > 0;
  return devant ? 1 - bouclier.reduction : 1;
}

/** Tue net un ennemi (exécution), quels que soient ses PV et ses protections ; un ennemi qui se relève ne se relève pas. La prime est versée. */
export function executer(etat: EtatPartie, e: Ennemi): void {
  if (!e.vivant || e.invulnerable > 0) return;
  etat.evenements.push({ type: 'execution', ennemi: e.id, x: e.x, y: e.y });
  tuer(etat, e);
}

/**
 * Applique un effet selon sa chance. Pas de cumul : la durée et la valeur gardent le maximum
 * (le facteur le plus fort pour un ralentissement).
 */
export function appliquerEffet(etat: EtatPartie, e: Ennemi, effet: EffetCoup): void {
  if (!e.vivant || e.invulnerable > 0) return;
  const k = EFFET[effet.type];
  if (k === EFFET.etourdissement && e.insensibleEtourdissement) return;
  if (k === EFFET.ralentissement && e.pouvoirs?.insensibleRalentissement) return;
  if (effet.chance < 1 && tirer(etat) >= effet.chance) return;
  const actif = (e.effetsPas[k] ?? 0) > 0;
  const valeur = e.effetsValeur[k] ?? 0;
  e.effetsPas[k] = Math.max(e.effetsPas[k] ?? 0, enPas(effet.duree));
  if (!actif) e.effetsValeur[k] = effet.valeur;
  else e.effetsValeur[k] = k === EFFET.ralentissement ? Math.min(valeur, effet.valeur) : Math.max(valeur, effet.valeur);
}

export function appliquerEffets(etat: EtatPartie, e: Ennemi, effets: readonly EffetCoup[]): void {
  for (const effet of effets) appliquerEffet(etat, e, effet);
}

/** Visible des tours et des unités : pas furtif, révélé (poison, tour ou assassin qui révèle), ou vu par le tireur. */
export function estVisible(e: Ennemi, revele: boolean): boolean {
  return !e.furtif || revele || e.revele > 0 || (e.effetsPas[EFFET.poison] ?? 0) > 0;
}
