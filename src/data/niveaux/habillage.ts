// Règles d'habillage d'une carte : largeur supposée du chemin dessiné et emprises des sprites au sol.
// Le moteur ne lit pas ce fichier ; il sert à écarter le décor du chemin, à calculer les cases interdites (grille-niveau.ts) et aux tests.
import type { Decor, ZoneSol } from '../visuel';
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
  // Régions 6 à 10 (art/sprites/decor-region6.txt)
  'arbre-ossements-1',
  'arbre-ossements-2',
  'mausolee-brise',
  'ossuaire',
  // Régions 6 à 10 (art/sprites/decor-region7.txt)
  'tente-croisee-1',
  'tente-croisee-2',
  'baliste-brisee',
  'chariot-armes',
  // Régions 6 à 10 (art/sprites/decor-region8.txt)
  'arche-cloitre',
  'clocher-noir',
  'statue-moine',
  'fontaine-noire',
  // Régions 6 à 10 (art/sprites/decor-region9.txt)
  'tourelle-royale',
  'fontaine-royale',
  'statue-roi',
  'herse-brisee',
  // Régions 6 à 10 (art/sprites/decor-region10.txt)
  'pilier-brise-1',
  'pilier-brise-2',
  'vitrail-brise',
  'autel-bleme',
  'statue-ange',
  // Région 11 (art/sprites/decor-region11.txt)
  'epave-coque',
  'epave-mat',
  'ponton-pourri',
  'cloche-naufrage',
  'filets-perches',
  'ancre-rouillee',
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

/**
 * Sols où l'on ne construit pas, par région : la région 11 (les Grèves Grises) recolore la « boue » en eau morte, et l'eau bloque la
 * construction (spec de l'après-histoire, décisions du jalon 1), étangs compris. Une case de la grille dont une tuile est dans une
 * telle zone est interdite (grille-niveau.ts), comme une case de chemin. Ailleurs, aucun sol ne bloque : la boue reste constructible.
 */
export const SOLS_BLOQUANTS: Readonly<Partial<Record<number, readonly ZoneSol['sol'][]>>> = {
  11: ['boue'],
};

/** Les zones de sol d'une carte où l'on ne construit pas (l'eau de la région 11), selon `SOLS_BLOQUANTS`. */
export function zonesBloquantes(carte: { readonly region: number; readonly zones: readonly ZoneSol[] }): ZoneSol[] {
  const sols = SOLS_BLOQUANTS[carte.region] ?? [];
  return carte.zones.filter((z) => sols.includes(z.sol));
}
