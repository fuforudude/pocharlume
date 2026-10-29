// Les indications de touches (« E », « Q », « W », « ␣ » sur les boutons du HUD) n'ont de sens qu'avec un clavier.
// La décision est prise ici, à un seul endroit : l'attribut `data-sans-clavier` de <html> cache toute indication
// (`.touche`, voir style.css). Les raccourcis eux-mêmes ne changent pas.

/** Appareil tactile sans survol ni souris précise : téléphone ou tablette. */
export const REQUETE_TACTILE = '(hover: none) and (pointer: coarse)';

/**
 * Cache les indications quand l'appareil est tactile ET qu'aucune touche du clavier n'a été pressée (un clavier
 * branché sur une tablette les fait revenir dès la première touche).
 */
export function indicationsTouchesVisibles(tactile: boolean, clavierUtilise: boolean): boolean {
  return !tactile || clavierUtilise;
}

/** Touches qui ne prouvent pas un vrai clavier (retour du navigateur, boutons matériels). */
const TOUCHES_IGNOREES = new Set(['Unidentified', 'Dead', 'Process', 'GoBack', 'BrowserBack']);

/** Branche la décision sur le document ; rend la fonction qui retire les écouteurs. */
export function installerIndicationsClavier(doc: Document = document, fenetre: Window = window): () => void {
  const requete = typeof fenetre.matchMedia === 'function' ? fenetre.matchMedia(REQUETE_TACTILE) : null;
  let clavierUtilise = false;
  const appliquer = (): void => {
    const visibles = indicationsTouchesVisibles(requete?.matches ?? false, clavierUtilise);
    if (visibles) doc.documentElement.removeAttribute('data-sans-clavier');
    else doc.documentElement.setAttribute('data-sans-clavier', '');
  };
  const surTouche = (e: KeyboardEvent): void => {
    if (clavierUtilise || TOUCHES_IGNOREES.has(e.key)) return;
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
