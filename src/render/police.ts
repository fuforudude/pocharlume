// Chiffres en pixels (3 × 5) pour les nombres qui flottent sur la carte (« +6 » à la mort d'un ennemi).
// Dessinés par rectangles d'un pixel : nets à tout zoom, sans police ni texte à allouer.

/** Un glyphe tient en 15 bits, ligne par ligne du haut vers le bas, 3 colonnes ; le bit de poids fort est en haut à gauche. */
const CHIFFRES: readonly number[] = [
  0b111101101101111, 0b010110010010111, 0b111001111100111, 0b111001111001111, 0b101101111001001,
  0b111100111001111, 0b111100111101111, 0b111001001001001, 0b111101111101111, 0b111101111001111,
];
const PLUS = 0b000010111010000;

export const LARGEUR_GLYPHE = 3;
export const HAUTEUR_GLYPHE = 5;
const ESPACE = 1;

function glyphe(ctx: CanvasRenderingContext2D, bits: number, x: number, y: number): void {
  for (let ligne = 0; ligne < HAUTEUR_GLYPHE; ligne++) {
    for (let colonne = 0; colonne < LARGEUR_GLYPHE; colonne++) {
      if ((bits >> (14 - (ligne * LARGEUR_GLYPHE + colonne))) & 1) ctx.fillRect(x + colonne, y + ligne, 1, 1);
    }
  }
}

function nombreDeChiffres(valeur: number): number {
  let n = 1;
  for (let v = Math.floor(valeur / 10); v > 0; v = Math.floor(v / 10)) n++;
  return n;
}

/** Largeur en pixels de « +valeur » (ou de « valeur » sans plus). */
export function largeurNombre(valeur: number, avecPlus: boolean): number {
  const glyphes = nombreDeChiffres(Math.max(0, Math.floor(valeur))) + (avecPlus ? 1 : 0);
  return glyphes * (LARGEUR_GLYPHE + ESPACE) - ESPACE;
}

/** Écrit un entier positif avec le style de remplissage courant, coin haut gauche en (x, y). */
export function dessinerNombre(ctx: CanvasRenderingContext2D, valeur: number, x: number, y: number, avecPlus: boolean): void {
  const entier = Math.max(0, Math.floor(valeur));
  let colonne = x;
  if (avecPlus) {
    glyphe(ctx, PLUS, colonne, y);
    colonne += LARGEUR_GLYPHE + ESPACE;
  }
  const chiffres = nombreDeChiffres(entier);
  let diviseur = 1;
  for (let i = 1; i < chiffres; i++) diviseur *= 10;
  for (let i = 0; i < chiffres; i++) {
    glyphe(ctx, CHIFFRES[Math.floor(entier / diviseur) % 10] ?? 0, colonne, y);
    colonne += LARGEUR_GLYPHE + ESPACE;
    diviseur /= 10;
  }
}
