// Choix du cadre d'une animation selon le temps écoulé. Fonctions pures et sans allocation : elles tournent
// pour chaque entité à chaque image.
import type { AnimationAtlas, CadreAtlas } from '../../tools/art/atlas.ts';

/** Cadre sans pixel, rendu quand une animation est vide (le dessin l'ignore). */
export const CADRE_VIDE: CadreAtlas = { x: 0, y: 0, largeur: 0, hauteur: 0, dx: 0, dy: 0, duree: 1 };

/** Durée d'un passage complet de l'animation, en millisecondes. */
export function dureeAnimation(anim: AnimationAtlas): number {
  let total = 0;
  for (const cadre of anim.cadres) total += cadre.duree;
  return total;
}

/** Indice du cadre affiché `ms` millisecondes après le début. Une animation sans boucle reste sur son dernier cadre. */
export function indiceCadre(anim: AnimationAtlas, ms: number): number {
  const n = anim.cadres.length;
  if (n <= 1) return 0;
  const total = dureeAnimation(anim);
  if (total <= 0) return 0;
  let t = ms;
  if (anim.boucle) {
    t %= total;
    if (t < 0) t += total;
  } else if (t >= total) {
    return n - 1;
  } else if (t < 0) {
    t = 0;
  }
  for (let i = 0; i < n; i++) {
    t -= anim.cadres[i]?.duree ?? 0;
    if (t < 0) return i;
  }
  return n - 1;
}

export function cadreA(anim: AnimationAtlas, ms: number): CadreAtlas {
  return anim.cadres[indiceCadre(anim, ms)] ?? CADRE_VIDE;
}

/** Une animation sans boucle est finie quand sa durée est écoulée. */
export function estTerminee(anim: AnimationAtlas, ms: number): boolean {
  return !anim.boucle && ms >= dureeAnimation(anim);
}
