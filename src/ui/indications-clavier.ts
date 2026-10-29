// Les indications de touches (« E », « Q », « W », « ␣ » sur les boutons du HUD) n'ont de sens qu'avec un clavier.
// La décision est prise ici, à un seul endroit : l'attribut `data-sans-clavier` de <html> cache toute indication
// (`.touche`, voir style.css). Les raccourcis eux-mêmes ne changent pas.
import { commandeClavier } from './clavier';

/** Appareil tactile sans survol ni souris précise : téléphone ou tablette. */
export const REQUETE_TACTILE = '(hover: none) and (pointer: coarse)';

/**
 * Cache les indications quand l'appareil est tactile ET qu'aucune touche du clavier n'a été pressée (un clavier
 * branché sur une tablette les fait revenir dès la première touche).
 */
export function indicationsTouchesVisibles(tactile: boolean, clavierUtilise: boolean): boolean {
  return !tactile || clavierUtilise;
}

/** Ce que la décision lit d'un événement clavier (un sous-ensemble de `KeyboardEvent`). */
export interface FrappeLue {
  readonly key: string;
  readonly code: string;
  readonly isTrusted: boolean;
  readonly isComposing: boolean;
  readonly keyCode: number;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  /** Vrai si la cible est un champ de saisie (input, textarea, select, contenteditable). */
  readonly dansUnChamp: boolean;
}

/**
 * Une vraie frappe de raccourci : touche réelle (pas un événement fabriqué), hors composition (clavier virtuel, IME :
 * keyCode 229), hors champ de saisie, et touche réellement utilisée comme raccourci du jeu (liste de clavier.ts).
 */
export function estFrappeDeRaccourci(f: FrappeLue): boolean {
  if (!f.isTrusted || f.isComposing || f.keyCode === 229 || f.dansUnChamp) return false;
  return commandeClavier(f) !== null;
}

function cibleEstUnChamp(cible: EventTarget | null): boolean {
  if (!(cible instanceof HTMLElement)) return false;
  return cible.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName);
}

/** Branche la décision sur le document ; `exigerTouche` faux seulement dans les tests (événements fabriqués). Rend la fonction qui retire les écouteurs. */
export function installerIndicationsClavier(doc: Document = document, fenetre: Window = window, exigerTouche = true): () => void {
  const requete = typeof fenetre.matchMedia === 'function' ? fenetre.matchMedia(REQUETE_TACTILE) : null;
  let clavierUtilise = false;
  const appliquer = (): void => {
    const visibles = indicationsTouchesVisibles(requete?.matches ?? false, clavierUtilise);
    if (visibles) doc.documentElement.removeAttribute('data-sans-clavier');
    else doc.documentElement.setAttribute('data-sans-clavier', '');
  };
  const surTouche = (e: KeyboardEvent): void => {
    if (clavierUtilise) return;
    // keyCode est déprécié mais reste le seul signal (229) d’un clavier virtuel en composition.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    if (!estFrappeDeRaccourci({ key: e.key, code: e.code, isTrusted: e.isTrusted || !exigerTouche, isComposing: e.isComposing, keyCode: e.keyCode, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey, dansUnChamp: cibleEstUnChamp(e.target) })) return;
    clavierUtilise = true;
    appliquer();
  };
  fenetre.addEventListener('keydown', surTouche);
  requete?.addEventListener('change', appliquer);
  appliquer();
  return () => {
    fenetre.removeEventListener('keydown', surTouche);
    requete?.removeEventListener('change', appliquer);
  };
}
