// Opérations sur les cadres : superposition, décalage, miroir, rotation, recoloration, agrandissement, contour.
// Une couche est une image RVBA plus un masque « efface » : un pixel effacé rend transparent ce qu'il recouvre.
import type { Image } from './png.ts';

export interface Couche {
  readonly largeur: number;
  readonly hauteur: number;
  readonly pixels: Uint8Array;
  readonly efface: Uint8Array;
}

/** Couleur du contour du pack Minifolks (aussi utilisée pour les ombres internes). */
export const COULEUR_CONTOUR = 0x2b2928ff;

export function coucheVide(largeur: number, hauteur: number): Couche {
  return { largeur, hauteur, pixels: new Uint8Array(largeur * hauteur * 4), efface: new Uint8Array(largeur * hauteur) };
}

export function depuisImage(image: Image): Couche {
  return { ...coucheVide(image.largeur, image.hauteur), pixels: image.pixels.slice() };
}

export function versImage(couche: Couche): Image {
  return { largeur: couche.largeur, hauteur: couche.hauteur, pixels: couche.pixels };
}

export function lirePixel(c: Couche, x: number, y: number): number {
  const i = (y * c.largeur + x) * 4;
  return (((c.pixels[i] ?? 0) << 24) | ((c.pixels[i + 1] ?? 0) << 16) | ((c.pixels[i + 2] ?? 0) << 8) | (c.pixels[i + 3] ?? 0)) >>> 0;
}

export function ecrirePixel(c: Couche, x: number, y: number, rvba: number): void {
  if (x < 0 || y < 0 || x >= c.largeur || y >= c.hauteur) return;
  const i = (y * c.largeur + x) * 4;
  c.pixels[i] = (rvba >>> 24) & 0xff;
  c.pixels[i + 1] = (rvba >>> 16) & 0xff;
  c.pixels[i + 2] = (rvba >>> 8) & 0xff;
  c.pixels[i + 3] = rvba & 0xff;
}

export function estOpaque(c: Couche, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= c.largeur || y >= c.hauteur) return false;
  return (c.pixels[(y * c.largeur + x) * 4 + 3] ?? 0) > 0;
}

function estEfface(c: Couche, x: number, y: number): boolean {
  return (c.efface[y * c.largeur + x] ?? 0) > 0;
}

/** Recopie une couche en transformant les coordonnées : (x, y) de la cible lit source(f(x, y)). */
function transformer(c: Couche, largeur: number, hauteur: number, lire: (x: number, y: number) => [number, number]): Couche {
  const sortie = coucheVide(largeur, hauteur);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const [sx, sy] = lire(x, y);
      if (sx < 0 || sy < 0 || sx >= c.largeur || sy >= c.hauteur) continue;
      ecrirePixel(sortie, x, y, lirePixel(c, sx, sy));
      sortie.efface[y * largeur + x] = c.efface[sy * c.largeur + sx] ?? 0;
    }
  }
  return sortie;
}

export function decaler(c: Couche, dx: number, dy: number): Couche {
  return transformer(c, c.largeur, c.hauteur, (x, y) => [x - dx, y - dy]);
}

/** Découpe le rectangle (x, y, largeur, hauteur) : la sortie fait cette taille, le vide hors de la couche reste transparent. */
export function rogner(c: Couche, x: number, y: number, largeur: number, hauteur: number): Couche {
  return transformer(c, largeur, hauteur, (px, py) => [px + x, py + y]);
}

export function miroir(c: Couche): Couche {
  return transformer(c, c.largeur, c.hauteur, (x, y) => [c.largeur - 1 - x, y]);
}

export function retourner(c: Couche): Couche {
  return transformer(c, c.largeur, c.hauteur, (x, y) => [x, c.hauteur - 1 - y]);
}

/** Rotation d'un quart de tour dans le sens horaire, répétée `quarts` fois (cadres carrés seulement). */
export function tourner(c: Couche, quarts: number): Couche {
  if (c.largeur !== c.hauteur) throw new Error('Rotation réservée aux cadres carrés');
  let sortie = c;
  for (let q = 0; q < ((quarts % 4) + 4) % 4; q++) {
    const n = sortie.largeur;
    const source = sortie;
    sortie = transformer(source, n, n, (x, y) => [y, n - 1 - x]);
  }
  return sortie;
}

/** Remplace des couleurs exactes (RVBA) par d'autres, éventuellement dans un rectangle x0 y0 x1 y1 seulement. */
export function recolorer(c: Couche, table: ReadonlyMap<number, number>, zone: readonly [number, number, number, number] | null = null): Couche {
  const sortie: Couche = { ...c, pixels: c.pixels.slice(), efface: c.efface.slice() };
  for (let y = 0; y < c.hauteur; y++) {
    for (let x = 0; x < c.largeur; x++) {
      if (!estOpaque(c, x, y)) continue;
      if (zone && (x < zone[0] || y < zone[1] || x > zone[2] || y > zone[3])) continue;
      const nouvelle = table.get(lirePixel(c, x, y));
      if (nouvelle !== undefined) ecrirePixel(sortie, x, y, nouvelle);
    }
  }
  return sortie;
}

/** Facteurs rouge, vert, bleu des élites : plus sombre, avec un léger penchant froid. */
export const FACTEURS_SOMBRE: readonly [number, number, number] = [0.52, 0.5, 0.6];

/** Assombrit tous les pixels opaques (version d'élite) ; l'alpha et le masque d'effacement sont conservés. */
export function assombrir(c: Couche): Couche {
  const sortie: Couche = { ...c, pixels: c.pixels.slice(), efface: c.efface.slice() };
  for (let i = 0; i < sortie.pixels.length; i += 4) {
    if ((sortie.pixels[i + 3] ?? 0) === 0) continue;
    for (let k = 0; k < 3; k++) sortie.pixels[i + k] = Math.round((sortie.pixels[i + k] ?? 0) * (FACTEURS_SOMBRE[k] ?? 1));
  }
  return sortie;
}

/** Pose `dessus` sur `dessous` (même taille) : pixels opaques remplacés, pixels effacés vidés. */
export function superposer(dessous: Couche, dessus: Couche): Couche {
  const sortie: Couche = { ...dessous, pixels: dessous.pixels.slice(), efface: dessous.efface.slice() };
  for (let y = 0; y < dessus.hauteur; y++) {
    for (let x = 0; x < dessus.largeur; x++) {
      if (estEfface(dessus, x, y)) {
        ecrirePixel(sortie, x, y, 0);
        sortie.efface[y * sortie.largeur + x] = 1;
      } else if (estOpaque(dessus, x, y)) {
        ecrirePixel(sortie, x, y, lirePixel(dessus, x, y));
        sortie.efface[y * sortie.largeur + x] = 0;
      }
    }
  }
  return sortie;
}

/** Agrandissement au plus proche voisin, sans lissage. */
export function agrandir(c: Couche, facteur: number): Couche {
  return transformer(c, c.largeur * facteur, c.hauteur * facteur, (x, y) => [Math.floor(x / facteur), Math.floor(y / facteur)]);
}

/**
 * Contour d'un pixel à la façon du pack Minifolks : tout pixel transparent touchant (haut, bas, gauche, droite)
 * un pixel opaque devient sombre, sauf sous la ligne des pieds (le pack ne souligne jamais le sol).
 */
export function contourner(c: Couche, couleur = COULEUR_CONTOUR): Couche {
  let basOpaque = -1;
  for (let y = 0; y < c.hauteur; y++) {
    for (let x = 0; x < c.largeur; x++) if (estOpaque(c, x, y)) basOpaque = y;
  }
  const sortie: Couche = { ...c, pixels: c.pixels.slice(), efface: new Uint8Array(c.largeur * c.hauteur) };
  for (let y = 0; y <= basOpaque; y++) {
    for (let x = 0; x < c.largeur; x++) {
      if (estOpaque(c, x, y)) continue;
      if (estOpaque(c, x - 1, y) || estOpaque(c, x + 1, y) || estOpaque(c, x, y - 1) || estOpaque(c, x, y + 1)) {
        ecrirePixel(sortie, x, y, couleur);
      }
    }
  }
  return sortie;
}

/** Plus petit rectangle contenant les pixels opaques, ou null si la couche est vide. */
export function boiteOpaque(c: Couche): { x: number; y: number; largeur: number; hauteur: number } | null {
  let x0 = c.largeur;
  let y0 = c.hauteur;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < c.hauteur; y++) {
    for (let x = 0; x < c.largeur; x++) {
      if (!estOpaque(c, x, y)) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, largeur: x1 - x0 + 1, hauteur: y1 - y0 + 1 };
}

/** Découpe un rectangle d'une image (les pixels hors de l'image restent transparents). */
export function decouper(image: Image, x: number, y: number, largeur: number, hauteur: number): Couche {
  const sortie = coucheVide(largeur, hauteur);
  for (let j = 0; j < hauteur; j++) {
    for (let i = 0; i < largeur; i++) {
      if (x + i >= image.largeur || y + j >= image.hauteur) continue;
      const s = ((y + j) * image.largeur + x + i) * 4;
      const d = (j * largeur + i) * 4;
      for (let k = 0; k < 4; k++) sortie.pixels[d + k] = image.pixels[s + k] ?? 0;
    }
  }
  return sortie;
}
