// Tirage d'une caisse : fonctions pures, le hasard est injecté (`SourceAleatoire`). Un tirage consomme exactement deux
// jets : le premier choisit la rareté d'après les chances affichées (`CHANCES_RARETE`), le second l'objet de cette rareté
// dans la caisse. La garantie remplace les chances par celles des seules raretés Épique et mieux, en gardant leurs
// proportions (10, 4, 1).
import { objetsDeCaisse, type IdCollection } from '../data/collection';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, RARETE_GARANTIE, RARETES, type Rarete, type TypeCaisse } from '../data/meta';
import type { SourceAleatoire } from './aleatoire';

/** Nombre de jets qu'un tirage consomme. */
export const JETS_PAR_TIRAGE = 2;

/** Indice de 0 à `n - 1` pour un jet `u` dans [0, 1) ; un jet absurde (NaN, hors de [0, 1)) est ramené dans les bornes. */
function indice(u: number, n: number): number {
  const i = Math.floor(u * n);
  return Number.isNaN(i) ? 0 : Math.min(n - 1, Math.max(0, i));
}

/** Raretés qui comptent pour la garantie : Épique et mieux. */
const RARETES_GARANTIES: readonly Rarete[] = RARETES.slice(RARETES.indexOf(RARETE_GARANTIE));

/** Tire une rareté ; avec `garantie`, seulement parmi Épique et mieux. Consomme un jet. */
export function tirerRarete(alea: SourceAleatoire, garantie: boolean): Rarete {
  const candidates = garantie ? RARETES_GARANTIES : RARETES;
  const total = candidates.reduce((somme, rarete) => somme + CHANCES_RARETE[rarete], 0);
  // Les chances sont des pourcentages entiers : le jet se compare à des entiers, sans arrondi flottant.
  let jet = indice(alea(), total);
  for (const rarete of candidates) {
    if (jet < CHANCES_RARETE[rarete]) return rarete;
    jet -= CHANCES_RARETE[rarete];
  }
  return candidates[candidates.length - 1] ?? 'commun';
}

export interface TirageCaisse {
  readonly id: IdCollection;
  readonly rarete: Rarete;
  /** Vrai quand la garantie a imposé un Épique ou mieux (le jet seul aurait pu donner moins). */
  readonly garantie: boolean;
  /** Le compteur de la caisse après ce tirage : 0 après un Épique ou mieux, sinon `compteur + 1`. */
  readonly compteur: number;
}

/** La caisse qui suit `compteur` caisses sans Épique ni mieux est-elle garantie ? (Compteur absurde : oui.) */
export function garantieAtteinte(compteur: number): boolean {
  return !(compteur < CAISSES_AVANT_GARANTIE - 1);
}

/**
 * Ouvre une caisse du type donné. `compteur` : caisses de ce type ouvertes de suite sans Épique ni mieux. Consomme
 * `JETS_PAR_TIRAGE` jets, toujours, garantie ou non.
 */
export function tirerCaisse(type: TypeCaisse, compteur: number, alea: SourceAleatoire): TirageCaisse {
  const garantie = garantieAtteinte(compteur);
  const rarete = tirerRarete(alea, garantie);
  const objets = objetsDeCaisse(type, rarete);
  const id = objets[indice(alea(), objets.length)];
  if (id === undefined) throw new Error(`la caisse ${type} n'a aucun objet ${rarete}`);
  const bon = RARETES_GARANTIES.includes(rarete);
  return { id, rarete, garantie, compteur: bon ? 0 : compteur + 1 };
}
