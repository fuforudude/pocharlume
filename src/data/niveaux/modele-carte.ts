// Structure d'une carte dessinée à la main (32 × 18 tuiles) et petits constructeurs pour l'écrire. Les cartes
// elles-mêmes sont dans cartes.ts (région 1) et cartes-region2.ts à cartes-region11.ts ; `CARTES` (cartes-toutes.ts) rassemble
// celles des régions 1 à 10, `CARTES_REGION11` (cartes-region11.ts) celles de la région 11, pas encore branchées.
import type { CheminCarte, Point } from '../../engine/definitions';
import type { Decor, ZoneSol } from '../visuel';

export interface CarteModele {
  readonly id: string;
  /** Région dont la carte porte le jeu de tuiles et le décor (1 à 11). */
  readonly region: number;
  readonly largeur: number;
  readonly hauteur: number;
  readonly chemins: readonly CheminCarte[];
  /** Où attend le héros : sur la fin commune des chemins, donc sur le chemin de tous les niveaux. */
  readonly departHeros: Point;
  readonly zones: readonly ZoneSol[];
  readonly decor: readonly Decor[];
}

export function chemin(...points: [number, number][]): CheminCarte {
  return { points: points.map(([x, y]) => ({ x, y })) };
}

export function decor(sprite: string, x: number, y: number, miroir = false): Decor {
  return miroir ? { sprite, x, y, miroir } : { sprite, x, y };
}

export function zone(sol: ZoneSol['sol'], x: number, y: number, largeur: number, hauteur: number): ZoneSol {
  return { sol, x, y, largeur, hauteur };
}
