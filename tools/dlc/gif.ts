// Petit encodeur GIF89a animé, sans dépendance : palette globale (les sprites n'ont que quelques dizaines de couleurs),
// compression LZW, boucle infinie (extension NETSCAPE2.0). Les images doivent être opaques : la transparence est ignorée.
import type { Image } from '../art/png.ts';

export interface ImageGif {
  readonly image: Image;
  /** Durée d'affichage en millisecondes (arrondie au centième de seconde, sans dérive sur l'ensemble). */
  readonly duree: number;
}

const MAX_COULEURS = 256;
const MAX_CODES = 4096;

function cle(p: Uint8Array, i: number): number {
  return ((p[i] ?? 0) << 16) | ((p[i + 1] ?? 0) << 8) | (p[i + 2] ?? 0);
}

/** Palette des couleurs utilisées ; au-delà de 256, les plus fréquentes, les autres ramenées à la plus proche. */
function construirePalette(images: readonly ImageGif[]): { couleurs: number[]; indice: Map<number, number> } {
  const frequences = new Map<number, number>();
  for (const { image } of images) {
    for (let i = 0; i < image.pixels.length; i += 4) {
      const c = cle(image.pixels, i);
      frequences.set(c, (frequences.get(c) ?? 0) + 1);
    }
  }
  const triees = [...frequences.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([c]) => c);
  const couleurs = triees.slice(0, MAX_COULEURS);
  const indice = new Map(couleurs.map((c, i) => [c, i]));
  for (const c of triees.slice(MAX_COULEURS)) {
    let meilleure = 0;
    let distance = Infinity;
    couleurs.forEach((p, i) => {
      const d = (((c >> 16) & 255) - ((p >> 16) & 255)) ** 2 + (((c >> 8) & 255) - ((p >> 8) & 255)) ** 2 + ((c & 255) - (p & 255)) ** 2;
      if (d < distance) {
        distance = d;
        meilleure = i;
      }
    });
    indice.set(c, meilleure);
  }
  return { couleurs, indice };
}

/** Compression LZW des indices de couleur, découpée en sous-blocs de 255 octets. */
function compresser(indices: Uint8Array, tailleMin: number): number[] {
  const effacer = 1 << tailleMin;
  const fin = effacer + 1;
  const octets: number[] = [];
  let accumulateur = 0;
  let bits = 0;
  let taille = tailleMin + 1;
  const emettre = (code: number): void => {
    accumulateur |= code << bits;
    bits += taille;
    while (bits >= 8) {
      octets.push(accumulateur & 255);
      accumulateur >>>= 8;
      bits -= 8;
    }
  };
  let table = new Map<number, number>();
  let suivant = fin + 1;
  emettre(effacer);
  let prefixe = indices[0] ?? 0;
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i] ?? 0;
    const c = prefixe * 256 + k;
    const connu = table.get(c);
    if (connu !== undefined) {
      prefixe = connu;
      continue;
    }
    emettre(prefixe);
    if (suivant === MAX_CODES) {
      emettre(effacer);
      table = new Map();
      suivant = fin + 1;
      taille = tailleMin + 1;
    } else {
      if (suivant >= 1 << taille) taille++;
      table.set(c, suivant++);
    }
    prefixe = k;
  }
  emettre(prefixe);
  emettre(fin);
  if (bits > 0) octets.push(accumulateur & 255);
  const blocs: number[] = [];
  for (let i = 0; i < octets.length; i += 255) {
    const morceau = octets.slice(i, i + 255);
    blocs.push(morceau.length);
    for (const o of morceau) blocs.push(o);
  }
  blocs.push(0);
  return blocs;
}

function ascii(texte: string): number[] {
  return Array.from({ length: texte.length }, (_, i) => texte.charCodeAt(i));
}

/** Encode une suite d'images de même taille en GIF animé qui boucle. */
export function encoderGif(images: readonly ImageGif[]): Uint8Array {
  const premiere = images[0];
  if (!premiere) throw new Error('GIF sans image');
  const { largeur, hauteur } = premiere.image;
  if (images.some((i) => i.image.largeur !== largeur || i.image.hauteur !== hauteur)) throw new Error('images de tailles différentes');
  const { couleurs, indice } = construirePalette(images);
  let bitsPalette = 1;
  while (1 << bitsPalette < couleurs.length) bitsPalette++;
  const tailleMin = Math.max(2, bitsPalette);
  const sortie: number[] = [];
  const mot = (n: number): void => {
    sortie.push(n & 255, (n >> 8) & 255);
  };
  sortie.push(...ascii('GIF89a'));
  mot(largeur);
  mot(hauteur);
  sortie.push(0x80 | 0x70 | (bitsPalette - 1), 0, 0);
  for (let i = 0; i < 1 << bitsPalette; i++) {
    const c = couleurs[i] ?? 0;
    sortie.push((c >> 16) & 255, (c >> 8) & 255, c & 255);
  }
  // Boucle infinie.
  sortie.push(0x21, 0xff, 11, ...ascii('NETSCAPE2.0'), 3, 1, 0, 0, 0);
  let temps = 0;
  let affiche = 0;
  for (const { image, duree } of images) {
    temps += duree;
    const centiemes = Math.max(2, Math.round(temps / 10) - affiche);
    affiche += centiemes;
    sortie.push(0x21, 0xf9, 4, 0x04, centiemes & 255, (centiemes >> 8) & 255, 0, 0);
    sortie.push(0x2c);
    mot(0);
    mot(0);
    mot(largeur);
    mot(hauteur);
    sortie.push(0);
    const indices = new Uint8Array(largeur * hauteur);
    for (let p = 0; p < indices.length; p++) indices[p] = indice.get(cle(image.pixels, p * 4)) ?? 0;
    sortie.push(tailleMin);
    for (const o of compresser(indices, tailleMin)) sortie.push(o);
  }
  sortie.push(0x3b);
  return Uint8Array.from(sortie);
}
