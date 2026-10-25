// Planches d'aperçu agrandies, pour regarder les sprites sans lancer le jeu (dossier art/apercu/, ignoré par git).
import { boiteOpaque, type Couche } from './couche.ts';
import type { SpriteDessine } from './dessin.ts';
import { nouvelleImage, type Image } from './png.ts';

/** Fond proche de la terre du Village Affamé, pour juger la lisibilité en situation. */
const FOND_A = [0x4a, 0x47, 0x36] as const;
const FOND_B = [0x55, 0x52, 0x3f] as const;
const ESPACE = 2;

function remplir(image: Image, x0: number, y0: number, l: number, h: number, [r, v, b]: readonly [number, number, number]): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + l; x++) {
      if (x >= image.largeur || y >= image.hauteur) continue;
      const i = (y * image.largeur + x) * 4;
      image.pixels[i] = r;
      image.pixels[i + 1] = v;
      image.pixels[i + 2] = b;
      image.pixels[i + 3] = 255;
    }
  }
}

/** Pose une couche en mélangeant l'alpha (les pixels hors de l'image sont ignorés). */
export function poser(image: Image, c: Couche | Image, x0: number, y0: number): void {
  for (let y = 0; y < c.hauteur; y++) {
    for (let x = 0; x < c.largeur; x++) {
      const s = (y * c.largeur + x) * 4;
      const a = c.pixels[s + 3] ?? 0;
      const tx = x0 + x;
      const ty = y0 + y;
      if (a === 0 || tx < 0 || ty < 0 || tx >= image.largeur || ty >= image.hauteur) continue;
      const d = (ty * image.largeur + tx) * 4;
      for (let k = 0; k < 3; k++) {
        const dessous = image.pixels[d + k] ?? 0;
        image.pixels[d + k] = Math.round(((c.pixels[s + k] ?? 0) * a + dessous * (255 - a)) / 255);
      }
      image.pixels[d + 3] = 255;
    }
  }
}

export function agrandirImage(image: Image, facteur: number): Image {
  const sortie = nouvelleImage(image.largeur * facteur, image.hauteur * facteur);
  for (let y = 0; y < sortie.hauteur; y++) {
    for (let x = 0; x < sortie.largeur; x++) {
      const s = (Math.floor(y / facteur) * image.largeur + Math.floor(x / facteur)) * 4;
      const d = (y * sortie.largeur + x) * 4;
      for (let k = 0; k < 4; k++) sortie.pixels[d + k] = image.pixels[s + k] ?? 0;
    }
  }
  return sortie;
}

/**
 * Une ligne par animation (avec contour), puis les mêmes sans contour, chaque cadre sur un fond alterné.
 * Les cases sont rognées à la zone utile de toutes les animations, pour agrandir davantage.
 */
export function plancheSprite(s: SpriteDessine, facteur = 10): Image {
  const lignes = [...s.anims, ...(s.animsSansContour ?? [])];
  const colonnes = Math.max(...lignes.map((a) => a.cadres.length));
  let x0 = s.largeur;
  let y0 = s.hauteur;
  let x1 = 0;
  let y1 = 0;
  for (const a of lignes) {
    for (const c of a.cadres) {
      const b = boiteOpaque(c.couche);
      if (!b) continue;
      x0 = Math.min(x0, b.x);
      y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.largeur);
      y1 = Math.max(y1, b.y + b.hauteur);
    }
  }
  x0 = Math.max(0, x0 - 1);
  y0 = Math.max(0, y0 - 1);
  x1 = Math.min(s.largeur, x1 + 1);
  y1 = Math.min(s.hauteur, y1 + 1);
  const pasX = x1 - x0 + ESPACE;
  const pasY = y1 - y0 + ESPACE;
  const image = nouvelleImage(colonnes * pasX, lignes.length * pasY);
  lignes.forEach((a, j) => {
    a.cadres.forEach((c, i) => {
      remplir(image, i * pasX, j * pasY, x1 - x0, y1 - y0, (i + j) % 2 === 0 ? FOND_A : FOND_B);
      poser(image, c.couche, i * pasX - x0, j * pasY - y0);
    });
  });
  return agrandirImage(image, facteur);
}

/** Premier cadre de chaque sprite, rangés par catégorie : la planche à montrer. */
export function plancheGenerale(sprites: readonly SpriteDessine[], facteur = 3, colonnes = 16): Image {
  const ordre = ['tour', 'unite', 'ennemi', 'projectile', 'effet', 'tuile', 'decor', 'icone'];
  const tries = [...sprites].sort((a, b) => ordre.indexOf(a.categorie) - ordre.indexOf(b.categorie));
  const placements: { s: SpriteDessine; x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let precedente = '';
  let hauteurLigne = 0;
  for (const s of tries) {
    if ((precedente !== '' && s.categorie !== precedente) || x >= colonnes) {
      x = 0;
      y += hauteurLigne;
      hauteurLigne = 0;
    }
    const pas = s.largeur > 32 || s.hauteur > 32 ? 2 : 1;
    if (x + pas > colonnes) {
      x = 0;
      y += hauteurLigne;
      hauteurLigne = 0;
    }
    placements.push({ s, x, y });
    x += pas;
    hauteurLigne = Math.max(hauteurLigne, s.hauteur + ESPACE);
    precedente = s.categorie;
  }
  const image = nouvelleImage(colonnes * (32 + ESPACE), y + hauteurLigne);
  remplir(image, 0, 0, image.largeur, image.hauteur, [0x1a, 0x18, 0x16]);
  for (const { s, x: cx, y: cy } of placements) {
    const anim = s.anims.find((a) => a.nom === 'repos') ?? s.anims[0];
    const cadre = anim?.cadres[0];
    if (!cadre) continue;
    const px = cx * (32 + ESPACE);
    remplir(image, px, cy, s.largeur, s.hauteur, FOND_A);
    poser(image, cadre.couche, px, cy);
  }
  return agrandirImage(image, facteur);
}
