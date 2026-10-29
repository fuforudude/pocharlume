// `npm run niveaux:statues` : écrit art/apercu/_statues.png, la planche des vieilles statues. En haut, les quatre sprites agrandis ; dessous,
// quatre cartes (une par origine) avec leur statue, la case de toucher repérée par quatre coins jaunes. Sert à juger la discrétion des
// statues en situation. Doit être lancé après `npm run art` (qui vide art/apercu/) et son fichier se commite avec `git add -f`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARTES, type IdCarte } from '../../src/data/niveaux/cartes-toutes.ts';
import { SPRITE_STATUE, STATUES } from '../../src/data/niveaux/statues.ts';
import { REGLES } from '../../src/data/regles.ts';
import { TUILE } from '../../src/render/camera.ts';
import { agrandirImage, poser } from '../art/apercu.ts';
import { decoderPng, nouvelleImage, type Image } from '../art/png.ts';
import { encoderPng } from '../art/png.ts';
import { dessinerCarte } from './planche.ts';

const RACINE = fileURLToPath(new URL('../../', import.meta.url));
/** Une carte par origine, de régions différentes : colosse, ombre, trois pattes, Église. */
const CARTES_MONTREES: readonly IdCarte[] = ['chaumes', 'ruelles', 'ponton', 'scriptorium'];
const FACTEUR_SPRITES = 8;
const FACTEUR_CARTES = 2;
const ESPACE = 8;
const FOND: readonly [number, number, number] = [20, 20, 24];

interface Cadre {
  readonly x: number;
  readonly y: number;
  readonly largeur: number;
  readonly hauteur: number;
}
const ATLAS = (JSON.parse(readFileSync(`${RACINE}public/sprites/atlas.json`, 'utf8')) as { sprites: Record<string, { animations: Record<string, { cadres: Cadre[] }> }> }).sprites;
const PLANCHE = decoderPng(new Uint8Array(readFileSync(`${RACINE}public/sprites/atlas.png`)));

function remplir(image: Image, [r, v, b]: readonly [number, number, number]): void {
  for (let i = 0; i < image.pixels.length; i += 4) {
    image.pixels[i] = r;
    image.pixels[i + 1] = v;
    image.pixels[i + 2] = b;
    image.pixels[i + 3] = 255;
  }
}

/** Le cadre de repos d'un sprite de l'atlas, rogné sur sa planche (avec son contour). */
function cadreDe(nom: string): Image {
  const cadre = ATLAS[nom]?.animations.repos?.cadres[0];
  if (!cadre) throw new Error(`Sprite introuvable dans l'atlas : ${nom}`);
  const coupe = nouvelleImage(cadre.largeur, cadre.hauteur);
  for (let y = 0; y < cadre.hauteur; y++) {
    for (let x = 0; x < cadre.largeur; x++) {
      const source = ((cadre.y + y) * PLANCHE.largeur + cadre.x + x) * 4;
      for (let k = 0; k < 4; k++) coupe.pixels[(y * cadre.largeur + x) * 4 + k] = PLANCHE.pixels[source + k] ?? 0;
    }
  }
  return coupe;
}

function point(image: Image, x: number, y: number): void {
  if (x < 0 || y < 0 || x >= image.largeur || y >= image.hauteur) return;
  const i = (y * image.largeur + x) * 4;
  image.pixels[i] = 255;
  image.pixels[i + 1] = 214;
  image.pixels[i + 2] = 64;
  image.pixels[i + 3] = 255;
}

/** Quatre coins jaunes autour de la case de la grille (`cx`, `cy`), pour la repérer sur une carte à l'échelle `facteur`. */
function reperer(image: Image, cx: number, cy: number, facteur: number): void {
  const cote = REGLES.tailleCase * TUILE * facteur;
  const x0 = cx * cote;
  const y0 = cy * cote;
  const bras = Math.round(cote / 4);
  for (let i = 0; i < bras; i++) {
    for (const e of [0, 1]) {
      point(image, x0 + i, y0 + e);
      point(image, x0 + e, y0 + i);
      point(image, x0 + cote - 1 - i, y0 + e);
      point(image, x0 + cote - 1 - e, y0 + i);
      point(image, x0 + i, y0 + cote - 1 - e);
      point(image, x0 + e, y0 + cote - 1 - i);
      point(image, x0 + cote - 1 - i, y0 + cote - 1 - e);
      point(image, x0 + cote - 1 - e, y0 + cote - 1 - i);
    }
  }
}

const sprites = Object.values(SPRITE_STATUE);
const largeurCarte = 32 * TUILE * FACTEUR_CARTES;
const hauteurCarte = 18 * TUILE * FACTEUR_CARTES;
const hautSprites = 24 * FACTEUR_SPRITES;
const image = nouvelleImage(2 * largeurCarte + 3 * ESPACE, hautSprites + ESPACE * 2 + 2 * (hauteurCarte + ESPACE));
remplir(image, FOND);

// Les quatre sprites, agrandis, côte à côte.
const pasSprites = Math.floor((image.largeur - ESPACE) / sprites.length);
sprites.forEach((nom, i) => {
  const grand = agrandirImage(cadreDe(nom), FACTEUR_SPRITES);
  poser(image, grand, ESPACE + i * pasSprites + Math.floor((pasSprites - grand.largeur) / 2), ESPACE + Math.floor((hautSprites - grand.hauteur) / 2));
});

// Les cartes avec leur statue.
CARTES_MONTREES.forEach((id, i) => {
  const carte = agrandirImage(dessinerCarte(CARTES[id], true), FACTEUR_CARTES);
  const statue = STATUES[id];
  reperer(carte, Math.floor(statue.x / REGLES.tailleCase), Math.floor((statue.y - 0.5) / REGLES.tailleCase), FACTEUR_CARTES);
  poser(image, carte, ESPACE + (i % 2) * (largeurCarte + ESPACE), hautSprites + ESPACE * 2 + Math.floor(i / 2) * (hauteurCarte + ESPACE));
});

const sortie = `${RACINE}art/apercu/_statues.png`;
mkdirSync(dirname(sortie), { recursive: true });
writeFileSync(sortie, encoderPng(image));
console.log(`Planche des statues : ${sortie}`);
