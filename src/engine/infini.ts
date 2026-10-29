// Mode infini : génération déterministe des vagues. La vague n d'une partie ne dépend que de la graine de la config, de la
// région de la carte et de n (jamais de l'état ni du générateur de la partie) : même graine, mêmes vagues, et le rejeu
// d'un journal reste exact. Toutes les valeurs sont dans src/data/infini.ts.
import { INFINI } from '../data/infini';
import { budgetVague, genererVague } from '../data/equilibrage';
import { creerGenerateur, tirer } from './aleatoire';
import { defEnnemi } from './contenu';
import type { DefEnnemi, Paquet, Vague } from './definitions';
import type { ConfigPartie } from './etat';

/** Budget de menace de la vague `vague` (1, 2…) : celui de la première vague × croissance^(vague − 1), par produits successifs. */
export function budgetInfini(vague: number): number {
  let budget = budgetVague(INFINI.niveauBase, 1);
  for (let n = 1; n < vague; n++) budget *= INFINI.croissance;
  return budget;
}

/** Part des ennemis d'élite à la vague `vague` : 0 avant la première vague d'élites, puis un palier de plus tous les `intervalle` vagues. */
export function partElites(vague: number): number {
  const { premiereVague, partDepart, partParPalier, intervalle, partMax } = INFINI.elites;
  if (vague < premiereVague) return 0;
  const paliers = Math.floor((vague - premiereVague) / intervalle);
  return Math.min(partMax, partDepart + partParPalier * paliers);
}

/** Part des PV du boss du mini-boss de la vague `vague`, ou 0 si cette vague n'en a pas (toutes les `intervalle` vagues). */
export function pvMiniBoss(vague: number): number {
  const { intervalle, pvDepart, pvParMiniBoss } = INFINI.miniBoss;
  if (vague < intervalle || vague % intervalle !== 0) return 0;
  return pvDepart + pvParMiniBoss * (vague / intervalle - 1);
}

/** Les ennemis ordinaires d'une carte de la région `region` : ceux des régions 1 à `region`, dans l'ordre des régions. */
export function ennemisInfini(region: number): (readonly [string, DefEnnemi])[] {
  const liste: (readonly [string, DefEnnemi])[] = [];
  for (const r of INFINI.regions.slice(0, region)) {
    for (const id of r.ennemis) {
      const def = defEnnemi(id);
      if (def) liste.push([id, def] as const);
    }
  }
  return liste;
}

/**
 * Chaque groupe est coupé en une part d'élites et une part ordinaire, à la suite l'une de l'autre. Le nombre d'élites d'un
 * groupe est `nombre × part` arrondi au hasard (graine de la vague) : la part est exacte en moyenne, même pour de petits groupes.
 * Un essaim se coupe par groupes entiers (un groupe de 5 Chauves-Souris est d'élite en entier ou pas du tout).
 */
function avecElites(paquets: readonly Paquet[], part: number, graine: number, vague: number): Paquet[] {
  if (part <= 0) return [...paquets];
  const g = creerGenerateur((graine ^ 0x5bd1e995 ^ Math.imul(vague, 0x27d4eb2f)) >>> 0);
  const sortie: Paquet[] = [];
  for (const p of paquets) {
    const taille = defEnnemi(p.ennemi)?.pouvoirs?.essaim ?? 1;
    const groupes = Math.max(1, Math.floor(p.nombre / taille));
    const exact = groupes * part;
    const elites = Math.min(p.nombre, taille * (Math.floor(exact) + (tirer(g) < exact - Math.floor(exact) ? 1 : 0)));
    if (elites > 0) sortie.push({ ...p, nombre: elites, elite: true });
    if (elites < p.nombre) sortie.push({ ...p, nombre: p.nombre - elites, delai: p.delai + elites * p.intervalle });
  }
  return sortie;
}

function total(paquets: readonly Paquet[]): number {
  return paquets.reduce((somme, p) => somme + p.nombre, 0);
}

/**
 * Les paquets de la vague et le facteur de PV qui porte le surplus de budget. Tant que la vague tient dans `ennemisMaxParVague`, elle
 * remplit son budget en ennemis (facteur 1). Sinon le budget est réduit (par approches successives, déterministes) jusqu'à ce que le
 * nombre d'ennemis tienne, et le facteur vaut budget ÷ budget réduit : la menace totale (nombre × PV) reste celle du budget.
 */
function remplirBudget(config: ConfigPartie, region: number, chemins: number, vague: number): { paquets: Paquet[]; facteurPv: number } {
  const ennemis = ennemisInfini(region);
  const budget = budgetInfini(vague);
  const generer = (b: number): Paquet[] => [...genererVague({ niveau: region, vague, ennemis, graine: config.graine, chemins, budget: b }).paquets];
  let reduit = budget;
  let paquets = generer(reduit);
  for (let essai = 0; essai < 8 && total(paquets) > INFINI.ennemisMaxParVague; essai++) {
    reduit *= (INFINI.ennemisMaxParVague / total(paquets)) * 0.95;
    paquets = generer(reduit);
  }
  return { paquets, facteurPv: budget / reduit };
}

/**
 * La vague `vague` (1, 2…) d'une partie infinie sur une carte de `chemins` chemins : un budget de menace rempli par des
 * ennemis de la région et des précédentes, des élites à partir de la vague 20, un mini-boss (le boss de la région, à une part
 * de ses PV, avec la vague) toutes les 10 vagues.
 */
export function genererVagueInfinie(config: ConfigPartie, chemins: number, vague: number): Vague {
  const region = config.infini?.region ?? 1;
  const { paquets: ordinaires, facteurPv: facteurVague } = remplirBudget(config, region, chemins, vague);
  const paquets = avecElites(ordinaires, partElites(vague), config.graine, vague);
  if (facteurVague > 1) for (let i = 0; i < paquets.length; i++) paquets[i] = { ...(paquets[i] as Paquet), facteurPv: facteurVague };
  const facteurPv = pvMiniBoss(vague);
  const boss = INFINI.regions[region - 1]?.boss;
  if (facteurPv > 0 && boss) {
    const g = creerGenerateur((config.graine ^ 0x1b873593 ^ Math.imul(vague, 0x2545f491)) >>> 0);
    paquets.push({ ennemi: boss, nombre: 1, intervalle: 0, chemin: Math.floor(tirer(g) * chemins), delai: INFINI.miniBoss.delai, facteurPv });
  }
  return { paquets };
}
