// Petits outils du navigateur : appels à l'API, images RVBA, création d'éléments.
import type { ImageRvba } from '../types.ts';

export async function appeler<T>(chemin: string, corps?: unknown): Promise<T> {
  const reponse = await fetch(chemin, corps === undefined
    ? undefined
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const json = await reponse.json() as T & { erreur?: string };
  if (!reponse.ok) throw new Error(json.erreur ?? `Erreur ${String(reponse.status)}`);
  return json;
}

const caches = new WeakMap<ImageRvba, HTMLCanvasElement>();

/** Dessine une image RVBA dans un canvas (mis en cache par objet image). */
export function canvasDe(image: ImageRvba): HTMLCanvasElement {
  const connu = caches.get(image);
  if (connu) return connu;
  const canvas = document.createElement('canvas');
  canvas.width = image.largeur;
  canvas.height = image.hauteur;
  const octets = Uint8ClampedArray.from(atob(image.rvba), (c) => c.charCodeAt(0));
  canvas.getContext('2d')?.putImageData(new ImageData(octets, image.largeur, image.hauteur), 0, 0);
  caches.set(image, canvas);
  return canvas;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  nom: K,
  proprietes: Partial<Record<string, string>> = {},
  ...enfants: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(nom);
  for (const [cle, valeur] of Object.entries(proprietes)) {
    if (valeur === undefined) continue;
    if (cle === 'texte') e.textContent = valeur;
    else e.setAttribute(cle, valeur);
  }
  e.append(...enfants);
  return e;
}

/** Hex `#rrggbb[aa]` vers une couleur CSS. */
export function couleurCss(hex: string): string {
  return hex.length === 9 ? `rgba(${String(parseInt(hex.slice(1, 3), 16))},${String(parseInt(hex.slice(3, 5), 16))},${String(parseInt(hex.slice(5, 7), 16))},${String(parseInt(hex.slice(7, 9), 16) / 255)})` : hex;
}

export function nettoyer(noeud: HTMLElement): void {
  noeud.replaceChildren();
}

/** Appelle `f` au plus une fois à la fois ; si des demandes arrivent pendant l'exécution, relance une fois avec la dernière. */
export function dernierSeulement(f: () => Promise<void>): () => void {
  let enCours = false;
  let enAttente = false;
  const lancer = (): void => {
    if (enCours) { enAttente = true; return; }
    enCours = true;
    void f().finally(() => {
      enCours = false;
      if (enAttente) { enAttente = false; lancer(); }
    });
  };
  return lancer;
}
