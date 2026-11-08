// Choix d'une cible pour ce qui tire sans bouger : tours, tourelles.
import { estVisible } from './degats';
import { trajetEnnemi } from './chemins';
import type { Ennemi, EtatPartie } from './etat';
import { distance2 } from './recherche';

/**
 * Premier ennemi du chemin (celui à qui il reste le moins de distance à parcourir) à portée, visible, et de
 * ceux que le tireur sait toucher (`volants`). `revele` : le tireur voit les furtifs.
 */
export function premierEnnemi(etat: EtatPartie, x: number, y: number, portee: number, volants: boolean, revele: boolean): Ennemi | undefined {
  const portee2 = portee * portee;
  let meilleur: Ennemi | undefined;
  let restantMin = Infinity;
  for (const e of etat.ennemis) {
    if (!e.vivant || e.invulnerable > 0 || (e.volant && !volants) || !estVisible(e, revele)) continue;
    if (distance2(e.x, e.y, x, y) > portee2) continue;
    const restant = (trajetEnnemi(etat, e)?.longueur ?? 0) - e.distance;
    if (restant < restantMin) {
      restantMin = restant;
      meilleur = e;
    }
  }
  return meilleur;
}
