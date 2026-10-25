// Raccourcis clavier : traduit une touche en commande. Logique pure ; l'écoute des événements est dans partie.ts.
import type { FamilleTour } from '../engine/etat';

export type Commande =
  /** Construit la tour sur le socle sélectionné. */
  | { readonly type: 'tour'; readonly famille: FamilleTour }
  | { readonly type: 'sort'; readonly emplacement: number }
  | { readonly type: 'heros' }
  | { readonly type: 'vague' }
  | { readonly type: 'pause' }
  | { readonly type: 'vitesse' }
  | { readonly type: 'annuler' };

/** Touches 1 à 5, dans l'ordre du menu en cercle. */
const TOURS: readonly FamilleTour[] = ['caserne', 'tir', 'magie', 'artillerie', 'divine'];

export interface ToucheClavier {
  /** `KeyboardEvent.key` : le caractère produit (« q », « Escape », « » pour Espace). */
  readonly key: string;
  /** `KeyboardEvent.code` : la touche physique (« Digit1 », « Numpad1 »). */
  readonly code: string;
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
  readonly metaKey?: boolean;
}

/**
 * Commande d'une touche, ou null. Les chiffres se lisent par `code` : sur un clavier AZERTY, la touche 1
 * produit « & » sans Maj. Les combinaisons avec Ctrl, Alt ou Méta restent au navigateur (Ctrl+P, Ctrl+F…).
 */
export function commandeClavier(touche: ToucheClavier): Commande | null {
  if (touche.ctrlKey || touche.altKey || touche.metaKey) return null;
  const chiffre = /^(?:Digit|Numpad)([1-5])$/.exec(touche.code);
  if (chiffre?.[1]) {
    const famille = TOURS[Number(chiffre[1]) - 1];
    return famille ? { type: 'tour', famille } : null;
  }
  switch (touche.key.length === 1 ? touche.key.toLowerCase() : touche.key) {
    case 'q':
      return { type: 'sort', emplacement: 0 };
    case 'w':
      return { type: 'sort', emplacement: 1 };
    case 'e':
      return { type: 'heros' };
    case ' ':
    case 'Spacebar':
      return { type: 'vague' };
    case 'p':
      return { type: 'pause' };
    case 'f':
      return { type: 'vitesse' };
    case 'Escape':
    case 'Esc':
      return { type: 'annuler' };
    default:
      return null;
  }
}
