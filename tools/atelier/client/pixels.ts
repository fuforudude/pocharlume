// Modèle d'édition des calques de pixels (sans DOM, testé à part) : une grille de lettres, `.` pour transparent.
export const TRANSPARENT = '.';

/** Lettre à la colonne i, ligne j de la grille (`.` hors des lignes écrites). */
export function lire(lignes: readonly string[], i: number, j: number): string {
  if (i < 0 || j < 0) return TRANSPARENT;
  return lignes[j]?.[i] ?? TRANSPARENT;
}

/**
 * Pose une lettre : étend la grille vers la droite et vers le bas si besoin (jamais vers le haut ni la gauche, l'origine
 * d'une grille est fixe). Rend la nouvelle grille, ou null si rien ne change ou si la cellule est hors d'atteinte.
 */
export function poser(lignes: readonly string[], i: number, j: number, lettre: string): string[] | null {
  if (i < 0 || j < 0 || lettre.length !== 1) return null;
  if (lire(lignes, i, j) === lettre) return null;
  const sortie = [...lignes];
  while (sortie.length <= j) sortie.push('');
  const ligne = (sortie[j] ?? '').padEnd(i + 1, TRANSPARENT);
  sortie[j] = ligne.slice(0, i) + lettre + ligne.slice(i + 1);
  return sortie;
}

/** Cellules traversées par le segment (Bresenham), extrémités comprises : un trait rapide ne laisse pas de trous. */
export function segment(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const cellules: [number, number][] = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let erreur = dx + dy;
  for (;;) {
    cellules.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * erreur;
    if (e2 >= dy) { erreur += dy; x += sx; }
    if (e2 <= dx) { erreur += dx; y += sy; }
  }
  return cellules;
}

export interface Modification {
  readonly id: string;
  readonly avant: readonly string[];
  readonly apres: readonly string[];
}

/** Annuler / rétablir : une entrée par coup de pinceau (de l'appui au relâchement). */
export class Historique {
  private passe: Modification[] = [];
  private futur: Modification[] = [];

  enregistrer(m: Modification): void {
    this.passe.push(m);
    this.futur = [];
  }

  annuler(): Modification | undefined {
    const m = this.passe.pop();
    if (m) this.futur.push(m);
    return m;
  }

  refaire(): Modification | undefined {
    const m = this.futur.pop();
    if (m) this.passe.push(m);
    return m;
  }

  peutAnnuler(): boolean {
    return this.passe.length > 0;
  }

  peutRefaire(): boolean {
    return this.futur.length > 0;
  }

  vider(): void {
    this.passe = [];
    this.futur = [];
  }
}

/** Cellule d'une grille sous un point de l'écran : coordonnées de pixel de l'image, zoom entier. */
export function cellule(px: number, py: number, zoom: number): [number, number] {
  return [Math.floor(px / zoom), Math.floor(py / zoom)];
}
