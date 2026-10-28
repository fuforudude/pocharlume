// Planche d'aperçu des cartes : le vrai sol (tuiles de la région, chemin, zones), le décor visible quand un niveau emprunte
// tous les chemins, à l'échelle 1 (16 px par tuile). Les croix rouges marquent les départs du héros. Sert à juger les cartes sans lancer le jeu (`npm run niveaux:apercu -- planche`).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decorVisible } from '../../src/data/niveaux/assemblage.ts';
import type { CarteModele } from '../../src/data/niveaux/modele-carte.ts';
import { construireSol } from '../../src/render/sol.ts';
import { TUILE } from '../../src/render/camera.ts';
import { poser } from '../art/apercu.ts';
import { decoderPng, nouvelleImage, type Image } from '../art/png.ts';

interface Cadre {
  readonly x: number;
  readonly y: number;
  readonly largeur: number;
  readonly hauteur: number;
  readonly dx: number;
  readonly dy: number;
}
interface SpriteAtlas {
  readonly ancre: { readonly x: number; readonly y: number };
  readonly animations: Readonly<Record<string, { readonly cadres: readonly Cadre[] }>>;
}

const RACINE = fileURLToPath(new URL('../../', import.meta.url));
const ATLAS = (JSON.parse(readFileSync(`${RACINE}public/sprites/atlas.json`, 'utf8')) as { sprites: Record<string, SpriteAtlas> }).sprites;
const PLANCHE = decoderPng(new Uint8Array(readFileSync(`${RACINE}public/sprites/atlas.png`)));

/** Pose le premier cadre de `repos` du sprite, son ancre sur (px, py) ; `miroir` le retourne autour de l'ancre. */
function poserSprite(image: Image, nom: string, px: number, py: number, miroir = false): void {
  const sprite = ATLAS[nom];
  const cadre = sprite?.animations.repos?.cadres[0];
  if (!sprite || !cadre) throw new Error(`Sprite introuvable dans l'atlas : ${nom}`);
  const coupe = nouvelleImage(cadre.largeur, cadre.hauteur);
  for (let y = 0; y < cadre.hauteur; y++) {
    for (let x = 0; x < cadre.largeur; x++) {
      const source = ((cadre.y + y) * PLANCHE.largeur + cadre.x + x) * 4;
      const sx = miroir ? cadre.largeur - 1 - x : x;
      const dest = (y * cadre.largeur + sx) * 4;
      for (let k = 0; k < 4; k++) coupe.pixels[dest + k] = PLANCHE.pixels[source + k] ?? 0;
    }
  }
  const gauche = miroir ? px + sprite.ancre.x - cadre.dx - cadre.largeur : px - sprite.ancre.x + cadre.dx;
  poser(image, coupe, gauche, py - sprite.ancre.y + cadre.dy);
}

function point(image: Image, x: number, y: number, [r, v, b]: readonly [number, number, number]): void {
  if (x < 0 || y < 0 || x >= image.largeur || y >= image.hauteur) return;
  const i = (y * image.largeur + x) * 4;
  image.pixels[i] = r;
  image.pixels[i + 1] = v;
  image.pixels[i + 2] = b;
  image.pixels[i + 3] = 255;
}

/** Une carte entière (tous chemins) sur une image de 512 × 288. */
export function dessinerCarte(modele: CarteModele): Image {
  const carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins, departHeros: modele.departHeros };
  const decor = decorVisible(modele, carte);
  const visuel = { region: modele.region, zones: modele.zones, decor };
  const image = nouvelleImage(modele.largeur * TUILE, modele.hauteur * TUILE);
  const grille = construireSol(carte, visuel);
  grille.tuiles.forEach((nom, i) => {
    poserSprite(image, nom, (i % grille.largeur) * TUILE, Math.floor(i / grille.largeur) * TUILE);
  });
  // Ancre des tuiles : en haut à gauche, comme pour le sol du jeu.
  const objets = decor.map((d) => ({ sprite: d.sprite, x: d.x, y: d.y, miroir: d.miroir === true })).sort((a, b) => a.y - b.y);
  for (const o of objets) poserSprite(image, o.sprite, Math.round(o.x * TUILE), Math.round(o.y * TUILE), o.miroir);
  const hx = Math.round(modele.departHeros.x * TUILE);
  const hy = Math.round(modele.departHeros.y * TUILE);
  for (let d = -3; d <= 3; d++) {
    point(image, hx + d, hy + d, [230, 30, 30]);
    point(image, hx + d, hy - d, [230, 30, 30]);
  }
  return image;
}

/** Les cartes côte à côte, `colonnes` par ligne, séparées de 4 px. */
export function planche(modeles: readonly CarteModele[], colonnes: number): Image {
  const ESPACE = 4;
  const l = 32 * TUILE;
  const h = 18 * TUILE;
  const lignes = Math.ceil(modeles.length / colonnes);
  const image = nouvelleImage(colonnes * (l + ESPACE) + ESPACE, lignes * (h + ESPACE) + ESPACE);
  for (let i = 0; i < image.pixels.length; i += 4) {
    image.pixels[i] = 20;
    image.pixels[i + 1] = 20;
    image.pixels[i + 2] = 24;
    image.pixels[i + 3] = 255;
  }
  modeles.forEach((m, i) => {
    poser(image, dessinerCarte(m), ESPACE + (i % colonnes) * (l + ESPACE), ESPACE + Math.floor(i / colonnes) * (h + ESPACE));
  });
  return image;
}
