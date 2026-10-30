// Déblocage progressif des tours : le palier visé par une construction, une amélioration ou une spécialisation doit être
// ouvert par le niveau joué. La règle ne lit que le numéro du niveau (table de src/data/deblocage.ts) : le rejeu et le
// déterminisme tiennent, défis compris. Le mode infini et un niveau sans numéro (essai) ont tout d'ouvert.
import { NIVEAU_TOUT_OUVERT, niveauOuverture } from '../data/deblocage';
import type { Action } from './actions';
import type { EtatPartie, FamilleTour } from './etat';
import { tourSurCase } from './grille';

/** Numéro du niveau qui ouvre ce palier de cette famille, ou null s'il est déjà ouvert dans cette partie. */
export function niveauDeblocagePalier(etat: EtatPartie, famille: FamilleTour, palier: number): number | null {
  const numero = etat.niveau.numero;
  if (numero === undefined || numero >= NIVEAU_TOUT_OUVERT || etat.config.infini) return null;
  const ouverture = niveauOuverture(famille, palier);
  return ouverture > numero ? ouverture : null;
}

/**
 * Numéro du niveau qui ouvre ce que l'action construirait (tour posée, niveau suivant ou spécialisation), ou null si c'est déjà
 * ouvert ou si l'action ne construit rien.
 */
export function niveauDeblocage(etat: EtatPartie, action: Action): number | null {
  if (action.type === 'construire') return niveauDeblocagePalier(etat, action.tour, 1);
  if (action.type !== 'ameliorer' && action.type !== 'specialiser') return null;
  const t = tourSurCase(etat, action.cx, action.cy);
  if (!t || t.famille === 'divine') return null;
  if (action.type === 'specialiser') return t.niveau === 3 ? niveauDeblocagePalier(etat, t.famille, 4) : null;
  return t.niveau < 3 ? niveauDeblocagePalier(etat, t.famille, t.niveau + 1) : null;
}
