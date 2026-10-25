// Petits utilitaires pour construire le DOM de l'interface sans framework.

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe = '', texte?: string): HTMLElementTagNameMap[K] {
  const noeud = document.createElement(tag);
  if (classe) noeud.className = classe;
  if (texte !== undefined) noeud.textContent = texte;
  return noeud;
}

/** Bouton d'interface : `type="button"`, cible tactile d'au moins 44 px (voir style.css). */
export function bouton(classe: string, libelle: string, auClic: () => void, signal?: AbortSignal): HTMLButtonElement {
  const b = el('button', classe);
  b.type = 'button';
  b.setAttribute('aria-label', libelle);
  b.title = libelle;
  b.addEventListener('click', auClic, signal ? { signal } : undefined);
  return b;
}

export function image(url: string, classe = '', alt = ''): HTMLImageElement {
  const i = el('img', classe);
  i.src = url;
  i.alt = alt;
  i.draggable = false;
  return i;
}

/** Texte d'un noeud qu'on ne réécrit que s'il change : évite de toucher au DOM à chaque image. */
export class TexteSuivi {
  private derniere = '';
  private cle = Number.NaN;

  constructor(readonly noeud: HTMLElement) {}

  mettre(valeur: string): void {
    if (valeur === this.derniere) return;
    this.derniere = valeur;
    this.noeud.textContent = valeur;
  }

  /**
   * Comme `mettre`, mais le texte (traduction, formatage) n'est fabriqué que quand `cle` change : appelé à chaque
   * image avec une valeur stable, il ne crée aucune chaîne.
   */
  mettreSelon(cle: number, fabriquer: () => string): void {
    if (cle === this.cle) return;
    this.cle = cle;
    this.mettre(fabriquer());
  }
}

/** Valeur d'attribut ou de classe mise à jour seulement quand elle change. */
export function basculerClasse(noeud: HTMLElement, classe: string, actif: boolean): void {
  if (noeud.classList.contains(classe) !== actif) noeud.classList.toggle(classe, actif);
}
