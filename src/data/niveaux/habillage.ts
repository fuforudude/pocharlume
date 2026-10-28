// Règles d'habillage d'une carte : largeur supposée du chemin dessiné et emprises des sprites au sol.
// Le moteur ne lit pas ce fichier ; il sert à écarter le décor du chemin, à calculer les cases interdites (grille-niveau.ts) et aux tests.
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
  // Régions 2 à 5 (art/sprites/decor-region<N>.txt)
  'arbre-calcine-1',
  'arbre-calcine-2',
  'meule-brulee',
  'chariot-brise',
  'bucher-braises',
  'echafaud',
  'maison-brulee-1',
  'maison-brulee-2',
  'saule-marais-1',
  'saule-marais-2',
  'barque-echouee',
  'puits-noir',
  'maison-condamnee-1',
  'maison-condamnee-2',
  'charrette-linceuls',
  'fosse-commune',
]);

/** Emprise d'un décor : tout le sprite (le rectangle de pixels, ancre comprise). */
export function empriseDecor(d: Pick<Decor, 'sprite' | 'x' | 'y'>): Rect {
  return GRANDS_DECORS.has(d.sprite)
    ? rectAutour(d.x, d.y, 1, 1.875, 1, 0.125)
    : rectAutour(d.x, d.y, 0.5, 0.9375, 0.5, 0.0625);
}

/**
 * Un grand décor bloque une tuile quand son emprise la recouvre de plus de cette longueur (en tuiles) dans les deux sens :
 * les marges de quelques pixels d'un sprite de 32×32 ne condamnent pas la tuile voisine.
 */
export const RECOUVREMENT_MIN_DECOR = 0.25;
