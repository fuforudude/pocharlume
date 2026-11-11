// Tests de l'encodeur GIF : structure du fichier, et relecture des pixels par un petit décodeur LZW écrit ici.
import { describe, expect, it } from 'vitest';
import { nouvelleImage, type Image } from '../art/png.ts';
import { encoderGif } from './gif.ts';

function image(largeur: number, hauteur: number, couleur: (x: number, y: number) => [number, number, number]): Image {
  const im = nouvelleImage(largeur, hauteur);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const [r, v, b] = couleur(x, y);
      im.pixels.set([r, v, b, 255], (y * largeur + x) * 4);
    }
  }
  return im;
}

interface Lu {
  largeur: number;
  hauteur: number;
  boucle: boolean;
  images: { delai: number; pixels: number[][] }[];
}

/** Décodeur minimal (palette globale, images pleine taille) pour vérifier ce que l'encodeur écrit. */
function lireGif(o: Uint8Array): Lu {
  const texte = String.fromCharCode(...o.slice(0, 6));
  if (texte !== 'GIF89a') throw new Error('en-tête');
  const mot = (i: number): number => (o[i] ?? 0) | ((o[i + 1] ?? 0) << 8);
  const largeur = mot(6);
  const hauteur = mot(8);
  const champs = o[10] ?? 0;
  const nPalette = 1 << ((champs & 7) + 1);
  const palette: number[][] = [];
  for (let k = 0; k < nPalette; k++) palette.push([o[13 + 3 * k] ?? 0, o[14 + 3 * k] ?? 0, o[15 + 3 * k] ?? 0]);
  let i = 13 + 3 * nPalette;
  const lu: Lu = { largeur, hauteur, boucle: false, images: [] };
  let delai = 0;
  const sousBlocs = (): number[] => {
    const d: number[] = [];
    for (let n = o[i++] ?? 0; n > 0; n = o[i++] ?? 0) {
      for (let k = 0; k < n; k++) d.push(o[i++] ?? 0);
    }
    return d;
  };
  for (;;) {
    const b = o[i++];
    if (b === 0x3b) return lu;
    if (b === 0x21) {
      const etiquette = o[i++];
      const d = sousBlocs();
      if (etiquette === 0xf9) delai = (d[1] ?? 0) | ((d[2] ?? 0) << 8);
      if (etiquette === 0xff && String.fromCharCode(...d.slice(0, 11)) === 'NETSCAPE2.0') lu.boucle = true;
    } else if (b === 0x2c) {
      i += 9;
      const tailleMin = o[i++] ?? 2;
      const donnees = sousBlocs();
      const indices = decompresser(donnees, tailleMin);
      lu.images.push({ delai, pixels: indices.map((k) => palette[k] ?? [0, 0, 0]) });
    } else {
      throw new Error(`bloc inconnu ${String(b)}`);
    }
  }
}

function decompresser(d: readonly number[], tailleMin: number): number[] {
  const effacer = 1 << tailleMin;
  const fin = effacer + 1;
  let taille = tailleMin + 1;
  let table: number[][] = [];
  const reinitialiser = (): void => {
    table = [];
    for (let k = 0; k < effacer; k++) table.push([k]);
    table.push([], []);
    taille = tailleMin + 1;
  };
  reinitialiser();
  const sortie: number[] = [];
  let bit = 0;
  let precedent: number[] | null = null;
  for (;;) {
    let code = 0;
    for (let k = 0; k < taille; k++, bit++) code |= (((d[bit >> 3] ?? 0) >> (bit & 7)) & 1) << k;
    if (code === effacer) {
      reinitialiser();
      precedent = null;
      continue;
    }
    if (code === fin) return sortie;
    let entree = table[code];
    if (!entree) {
      if (!precedent) throw new Error('code inconnu');
      entree = [...precedent, precedent[0] ?? 0];
    }
    sortie.push(...entree);
    if (precedent) table.push([...precedent, entree[0] ?? 0]);
    if (table.length === 1 << taille && taille < 12) taille++;
    precedent = entree;
  }
}

describe('encodeur GIF', () => {
  it('écrit des images qui se relisent à l’identique, avec leurs délais et la boucle', () => {
    const a = image(5, 3, (x, y) => ((x + y) % 2 === 0 ? [255, 0, 0] : [0, 0, 255]));
    const b = image(5, 3, (x) => (x < 2 ? [0, 255, 0] : [255, 255, 255]));
    const lu = lireGif(encoderGif([{ image: a, duree: 140 }, { image: b, duree: 90 }]));
    expect([lu.largeur, lu.hauteur, lu.boucle]).toEqual([5, 3, true]);
    expect(lu.images.map((im) => im.delai)).toEqual([14, 9]);
    expect(lu.images[0]?.pixels[0]).toEqual([255, 0, 0]);
    expect(lu.images[0]?.pixels[1]).toEqual([0, 0, 255]);
    expect(lu.images[1]?.pixels.slice(0, 5)).toEqual([[0, 255, 0], [0, 255, 0], [255, 255, 255], [255, 255, 255], [255, 255, 255]]);
  });

  it('arrondit les délais au centième sans dérive', () => {
    const a = image(1, 1, () => [0, 0, 0]);
    const lu = lireGif(encoderGif([1, 2, 3].map(() => ({ image: a, duree: 115 }))));
    // 115, 230, 345 ms : 12 + 11 + 12 centièmes (somme 35, au lieu de 36 en arrondissant chaque image).
    expect(lu.images.map((im) => im.delai).reduce((s, d) => s + d)).toBe(35);
  });

  it('compresse une grande image à beaucoup de couleurs (table LZW pleine et réinitialisée)', () => {
    const grande = image(160, 120, (x, y) => [(x * 7) & 255, (y * 13) & 255, (x * y) & 255]);
    const lu = lireGif(encoderGif([{ image: grande, duree: 100 }]));
    expect(lu.images[0]?.pixels).toHaveLength(160 * 120);
    // Au-delà de 256 couleurs, chaque pixel prend une couleur de la palette ; celles retenues restent exactes.
    expect(lu.images[0]?.pixels[0]).toEqual([0, 0, 0]);
  });

  it('refuse des images de tailles différentes', () => {
    expect(() => encoderGif([{ image: nouvelleImage(2, 2), duree: 1 }, { image: nouvelleImage(3, 2), duree: 1 }])).toThrow(/tailles/);
  });
});
