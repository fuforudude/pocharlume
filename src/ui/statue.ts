// Toucher une vieille statue pendant une partie (jalon 5, « Les dieux sans visage ») : logique pure, sans DOM. La statue est un petit
// décor posé sur une case que le décor interdit déjà à la construction (voir src/data/niveaux/statues.ts) : sa zone de toucher est
// cette case, et seulement elle. Une case voisine, libre ou non, garde donc son comportement (menu de pose d'une tour).
//
// C'est de la méta : rien ne passe par le moteur ni par son journal.
import type { StatueCarte } from '../data/niveaux/statues';
import { REGLES } from '../data/regles';
import type { EtatPartie } from '../engine';
import type { CaseGrille } from '../engine/definitions';
import { cibleTouchee, type Mode } from './interaction';

/** La case de la grille qui porte la statue : celle où se tient son pied (le sprite, de 16×16, tient tout entier dans cette case). */
export function caseDeStatue(statue: Pick<StatueCarte, 'x' | 'y'>): CaseGrille {
  return { cx: Math.floor(statue.x / REGLES.tailleCase), cy: Math.floor((statue.y - 0.5) / REGLES.tailleCase) };
}

/**
 * Le point (x, y) (tuiles) touche-t-il la statue ? Seulement quand rien n'est en cours de visée (ni le héros, ni un sort, ni un objet,
 * ni un ralliement : ces gestes attendent un point libre, la statue n'y a pas de place) ; un menu de case ouvert n'empêche pas de
 * toucher la statue. Le héros prime : s'il est à portée du doigt (`rayon`, tuiles), c'est lui qui est touché.
 */
export function statueTouchee(etat: EtatPartie, mode: Mode, statue: StatueCarte | undefined, x: number, y: number, rayon: number): boolean {
  if (!statue || (mode.type !== 'libre' && mode.type !== 'menu')) return false;
  const cible = cibleTouchee(etat, x, y, rayon);
  if (cible?.type !== 'case') return false;
  const sienne = caseDeStatue(statue);
  return cible.cx === sienne.cx && cible.cy === sienne.cy;
}
