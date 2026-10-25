// Règles d'habillage d'une carte : largeur supposée du chemin dessiné et emprises des sprites au sol.
// Le moteur ne lit pas ce fichier ; il sert à écarter le décor du chemin et des socles, et aux tests.
import type { Decor } from '../visuel';
import { rectAutour, type Rect } from './geometrie';

/** Le chemin est dessiné sur 2 tuiles de large : 1 tuile de chaque côté de son axe. */
export const DEMI_LARGEUR_CHEMIN = 1;
/** Espace libre laissé entre le décor et le bord du chemin, en tuiles. */
export const MARGE_DECOR = 0.25;

/** Sprites de décor de 32×32 (2×2 tuiles, ancre au pied) ; les autres font 16×16. */
export const GRANDS_DECORS: ReadonlySet<string> = new Set([
  'arbre-mort-1',
  'arbre-mort-2',
  'bucher-eteint',
  'maison-ruine-1',
  'maison-ruine-2',
  'potence',
  'puits',
]);

/** Emprise d'un décor : tout le sprite (le rectangle de pixels, ancre comprise). */
export function empriseDecor(d: Pick<Decor, 'sprite' | 'x' | 'y'>): Rect {
  return GRANDS_DECORS.has(d.sprite)
    ? rectAutour(d.x, d.y, 1, 1.875, 1, 0.125)
    : rectAutour(d.x, d.y, 0.5, 0.9375, 0.5, 0.0625);
}

/** Emprise du sprite d'un socle (32×32, ancre à 26 px du haut). */
export function empriseSprite(x: number, y: number): Rect {
  return rectAutour(x, y, 1, 1.625, 1, 0.375);
}

/** Emprise de la pierre du socle, la partie qui ne doit pas mordre sur le chemin. */
export function empriseSocle(x: number, y: number): Rect {
  return rectAutour(x, y, 0.75, 0.75, 0.75, 0.25);
}
