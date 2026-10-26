// Ce qui relie le son au navigateur : déblocage au premier geste, clic de tout bouton, retour sonore d'un curseur
// de volume. Un seul jeu d'écouteurs sur le document, donc aucun écran n'a à y penser.
import type { IdSon } from './table';

/** Ce que ces écouteurs demandent au moteur de son. */
export interface CibleGeste {
  debloquer(): void;
  jouer(id: IdSon): boolean;
}

/** Gestes qui comptent comme une action de l'utilisateur pour débloquer le son (pas `pointerdown` ni `touchstart`). */
const GESTES_DEBLOCAGE = ['pointerup', 'click', 'keydown', 'touchend'] as const;

/** Délai avant le son de test d'un curseur : le temps que le réglage soit enregistré et lu par le moteur. */
export const DELAI_CURSEUR_MS = 250;

/**
 * Branche les écouteurs. Rend la fonction qui les retire (tests). Le clic d'un bouton grisé (`aria-disabled`) est
 * muet : si l'action est refusée, c'est le jeu qui joue « refus ».
 */
export function installerGestes(cible: CibleGeste, document: Document = globalThis.document): () => void {
  const controleur = new AbortController();
  const options = { capture: true, passive: true, signal: controleur.signal } as const;

  for (const geste of GESTES_DEBLOCAGE) {
    document.addEventListener(geste, () => { cible.debloquer(); }, options);
  }
  document.addEventListener('click', (e) => {
    const noeud = e.target;
    if (!(noeud instanceof Element)) return;
    const bouton = noeud.closest('button');
    if (!bouton || bouton.getAttribute('aria-disabled') === 'true') return;
    cible.jouer('clic');
  }, options);
  document.addEventListener('change', (e) => {
    const noeud = e.target;
    if (!(noeud instanceof HTMLInputElement) || noeud.type !== 'range') return;
    setTimeout(() => { cible.jouer('clic'); }, DELAI_CURSEUR_MS);
  }, options);

  return () => { controleur.abort(); };
}
