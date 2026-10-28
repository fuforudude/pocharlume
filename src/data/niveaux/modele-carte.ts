// Structure d'une carte dessinée à la main (32 × 18 tuiles) et petits constructeurs pour l'écrire. Les cartes
// elles-mêmes sont dans cartes.ts (région 1) et cartes-region2.ts à cartes-region5.ts ; `CARTES` (cartes-toutes.ts) les
// rassemble.
import type { CheminCarte, Point, Socle } from '../../engine/definitions';
import type { Decor, ZoneSol } from '../visuel';

export interface CarteModele {
  readonly id: string;
  /** Région dont la carte porte le jeu de tuiles et le décor (1 à 5). */
  readonly region: number;
  readonly largeur: number;
  readonly hauteur: number;
  readonly chemins: readonly CheminCarte[];
  readonly socles: readonly Socle[];
  /** Où attend le héros : sur la fin commune des chemins, donc sur le chemin de tous les niveaux. */
  readonly departHeros: Point;
  readonly zones: readonly ZoneSol[];
  readonly decor: readonly Decor[];
}

export function chemin(...points: [number, number][]): CheminCarte {
  return { points: points.map(([x, y]) => ({ x, y })) };
}

export function socle(x: number, y: number, rx: number, ry: number): Socle {
  return { x, y, ralliement: { x: rx, y: ry } };
}

export function decor(sprite: string, x: number, y: number, miroir = false): Decor {
  return miroir ? { sprite, x, y, miroir } : { sprite, x, y };
}

export function zone(sol: ZoneSol['sol'], x: number, y: number, largeur: number, hauteur: number): ZoneSol {
  return { sol, x, y, largeur, hauteur };
}
