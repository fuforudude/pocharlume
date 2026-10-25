// Carte de la région 1 : où se trouvent les 10 niveaux et le chemin qui les relie. Coordonnées en pixels
// logiques sur un fond de 512 × 288 (le rendu choisit le zoom entier). L'écran de la carte du monde dessine le
// fond, le tracé et les nœuds ; il ne contient aucune position en dur.
import type { Point } from '../../engine/definitions';

export const LARGEUR_CARTE_MONDE = 512;
export const HAUTEUR_CARTE_MONDE = 288;

export interface NoeudNiveau extends Point {
  /** Numéro du niveau dans la région, 1 à 10. */
  readonly numero: number;
  readonly boss: boolean;
}

function noeud(numero: number, x: number, y: number): NoeudNiveau {
  return { numero, x, y, boss: numero === 10 };
}

/** Le Village Affamé : la route part du sud-ouest, serpente d'est en ouest jusqu'à Vaudrelle, au nord-est. */
export const NOEUDS_REGION1: readonly NoeudNiveau[] = [
  noeud(1, 40, 236),
  noeud(2, 92, 196),
  noeud(3, 148, 230),
  noeud(4, 206, 190),
  noeud(5, 256, 232),
  noeud(6, 310, 186),
  noeud(7, 366, 226),
  noeud(8, 414, 176),
  noeud(9, 452, 128),
  noeud(10, 468, 70),
];

function route(...points: [number, number][]): readonly Point[] {
  return points.map(([x, y]) => ({ x, y }));
}

/**
 * Le chemin entre deux niveaux consécutifs : `TRACE_REGION1[i]` va du nœud i + 1 au nœud i + 2 (9 tronçons).
 * Chaque tronçon commence et finit exactement sur un nœud ; on dessine les tronçons jusqu'au dernier niveau
 * débloqué, le reste en pointillé.
 */
export const TRACE_REGION1: readonly (readonly Point[])[] = [
  route([40, 236], [58, 226], [74, 206], [92, 196]),
  route([92, 196], [112, 200], [130, 222], [148, 230]),
  route([148, 230], [170, 226], [190, 206], [206, 190]),
  route([206, 190], [222, 198], [238, 222], [256, 232]),
  route([256, 232], [280, 226], [296, 206], [310, 186]),
  route([310, 186], [330, 196], [348, 222], [366, 226]),
  route([366, 226], [388, 214], [402, 196], [414, 176]),
  route([414, 176], [430, 164], [446, 150], [452, 128]),
  route([452, 128], [462, 112], [468, 92], [468, 70]),
];
