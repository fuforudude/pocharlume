// Lecture et écriture de PNG sans dépendance : zlib de Node et CRC 32 maison.
// On ne gère que ce dont le pipeline a besoin : RVBA 8 bits, sans entrelacement.
import { deflateSync, inflateSync } from 'node:zlib';

/** Image RVBA en mémoire, 4 octets par pixel, ligne par ligne. */
export interface Image {
  readonly largeur: number;
  readonly hauteur: number;
  readonly pixels: Uint8Array;
}

const SIGNATURE = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

const TABLE_CRC = ((): Uint32Array => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(octets: Uint8Array): number {
  let c = 0xffffffff;
  for (const o of octets) c = (TABLE_CRC[(c ^ o) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function nouvelleImage(largeur: number, hauteur: number): Image {
  return { largeur, hauteur, pixels: new Uint8Array(largeur * hauteur * 4) };
}

function morceau(type: string, donnees: Uint8Array): Uint8Array {
  const sortie = new Uint8Array(12 + donnees.length);
  const vue = new DataView(sortie.buffer);
  vue.setUint32(0, donnees.length);
  for (let i = 0; i < 4; i++) sortie[4 + i] = type.charCodeAt(i);
  sortie.set(donnees, 8);
  vue.setUint32(8 + donnees.length, crc32(sortie.subarray(4, 8 + donnees.length)));
  return sortie;
}

/** Encode en PNG RVBA 8 bits. Sortie déterministe : mêmes pixels, mêmes octets. */
export function encoderPng(image: Image): Uint8Array {
  const { largeur, hauteur, pixels } = image;
  const entete = new Uint8Array(13);
  const vue = new DataView(entete.buffer);
  vue.setUint32(0, largeur);
  vue.setUint32(4, hauteur);
  entete[8] = 8; // profondeur
  entete[9] = 6; // RVBA
  const ligne = largeur * 4;
  const brut = new Uint8Array((ligne + 1) * hauteur);
  for (let y = 0; y < hauteur; y++) {
    // Filtre « Sub » sur chaque ligne : les aplats du pixel art deviennent des zéros que zlib compresse bien.
    const debut = y * (ligne + 1);
    brut[debut] = 1;
    for (let x = 0; x < ligne; x++) {
      const v = pixels[y * ligne + x] ?? 0;
      const gauche = x >= 4 ? (pixels[y * ligne + x - 4] ?? 0) : 0;
      brut[debut + 1 + x] = (v - gauche) & 0xff;
    }
  }
  const compresse = deflateSync(brut, { level: 9 });
  const parties = [SIGNATURE, morceau('IHDR', entete), morceau('IDAT', compresse), morceau('IEND', new Uint8Array(0))];
  const sortie = new Uint8Array(parties.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  for (const p of parties) {
    sortie.set(p, pos);
    pos += p.length;
  }
  return sortie;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Décode un PNG RVBA 8 bits non entrelacé (le format du pack Minifolks et de nos sorties). */
export function decoderPng(octets: Uint8Array): Image {
  for (let i = 0; i < SIGNATURE.length; i++) {
    if (octets[i] !== SIGNATURE[i]) throw new Error('Pas un PNG');
  }
  const vue = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  let pos = 8;
  let largeur = 0;
  let hauteur = 0;
  const idat: Uint8Array[] = [];
  while (pos < octets.length) {
    const longueur = vue.getUint32(pos);
    const type = String.fromCharCode(...octets.subarray(pos + 4, pos + 8));
    const donnees = octets.subarray(pos + 8, pos + 8 + longueur);
    if (type === 'IHDR') {
      largeur = vue.getUint32(pos + 8);
      hauteur = vue.getUint32(pos + 12);
      const profondeur = donnees[8];
      const couleur = donnees[9];
      const entrelace = donnees[12];
      if (profondeur !== 8 || couleur !== 6 || entrelace !== 0) {
        throw new Error(`PNG non géré : profondeur ${String(profondeur)}, type ${String(couleur)}`);
      }
    } else if (type === 'IDAT') {
      idat.push(donnees);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + longueur;
  }
  const compresse = new Uint8Array(idat.reduce((s, d) => s + d.length, 0));
  let p = 0;
  for (const d of idat) {
    compresse.set(d, p);
    p += d.length;
  }
  const brut = inflateSync(compresse);
  const ligne = largeur * 4;
  const pixels = new Uint8Array(ligne * hauteur);
  for (let y = 0; y < hauteur; y++) {
    const filtre = brut[y * (ligne + 1)];
    const source = y * (ligne + 1) + 1;
    for (let x = 0; x < ligne; x++) {
      const brutX = brut[source + x] ?? 0;
      const a = x >= 4 ? (pixels[y * ligne + x - 4] ?? 0) : 0;
      const b = y > 0 ? (pixels[(y - 1) * ligne + x] ?? 0) : 0;
      const c = x >= 4 && y > 0 ? (pixels[(y - 1) * ligne + x - 4] ?? 0) : 0;
      let v: number;
      switch (filtre) {
        case 0: v = brutX; break;
        case 1: v = brutX + a; break;
        case 2: v = brutX + b; break;
        case 3: v = brutX + ((a + b) >> 1); break;
        case 4: v = brutX + paeth(a, b, c); break;
        default: throw new Error(`Filtre PNG inconnu : ${String(filtre)}`);
      }
      pixels[y * ligne + x] = v & 0xff;
    }
  }
  return { largeur, hauteur, pixels };
}
