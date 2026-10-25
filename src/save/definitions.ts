// Définitions de jeu dont la méta-progression a besoin sans les posséder : les compétences de chaque héros et les
// seuils d'expérience viennent de `src/data/heros.ts`. La sauvegarde reste générique : l'appelant lui passe ces
// définitions (`DefsMeta`), les tests lui passent des fixtures. Fonctions pures.
import { POINTS_PAR_NIVEAU } from '../data/meta';

export interface DefCompetence {
  readonly id: string;
  /** Rang maximal (3). */
  readonly rangMax: number;
  /** Niveau du héros à partir duquel la compétence s'apprend (6 pour l'ultime, 1 pour les autres). */
  readonly niveauRequis: number;
}

export interface DefHeros {
  readonly competences: readonly DefCompetence[];
}

export interface DefsMeta {
  /** Les compétences de chaque héros, par identifiant de héros. */
  readonly heros: Readonly<Record<string, DefHeros>>;
  /**
   * Expérience cumulée qu'il faut pour atteindre les niveaux 2, 3, … : `seuilsXp[0]` donne le niveau 2. Croissant ;
   * le niveau maximal est `seuilsXp.length + 1`.
   */
  readonly seuilsXp: readonly number[];
}

/** Niveau d'un héros d'après son expérience : 1 + le nombre de seuils atteints. */
export function niveauHerosDepuisXp(xp: number, seuilsXp: readonly number[]): number {
  let niveau = 1;
  for (const seuil of seuilsXp) {
    if (xp < seuil) break;
    niveau++;
  }
  return niveau;
}

/** Points de compétence dont dispose un héros de ce niveau (placés ou non). */
export function pointsDeCompetence(niveau: number): number {
  return niveau * POINTS_PAR_NIVEAU;
}

/** La définition d'un héros, si `defs` la connaît (propriété propre seulement). */
export function definitionDuHeros(defs: DefsMeta, heros: string): DefHeros | null {
  return Object.hasOwn(defs.heros, heros) ? (defs.heros[heros] ?? null) : null;
}
