// Cibles tactiles : une case de construction doit faire au moins `cibleCss` pixels CSS de côté, sinon le doigt
// (44 px) vise à côté. Calcul pur ; la caméra l'applique comme plancher de zoom sur un écran tactile.
import { REGLES } from '../data/regles';
import { TUILE } from './camera';

/**
 * Plus petit zoom entier (pixels d'écran par pixel logique) qui donne à une case au moins `cibleCss` pixels CSS de côté,
 * l'écran ayant `ratio` pixels physiques par pixel CSS. 1 si le ratio ou la cible sont invalides.
 */
export function zoomPourCase(ratio: number, cibleCss: number): number {
  if (!(ratio > 0) || !(cibleCss > 0) || !Number.isFinite(ratio) || !Number.isFinite(cibleCss)) return 1;
  // Marge de 1e-9 : 44 px pile ne doit pas passer au palier suivant à cause d'un arrondi flottant.
  return Math.max(1, Math.ceil((cibleCss * ratio) / (REGLES.tailleCase * TUILE) - 1e-9));
}
