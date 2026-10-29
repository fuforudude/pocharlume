// Planche « avant / après » de quelques cartes : à gauche le tracé d'origine (axe sur les arêtes des cases, donc à cheval sur deux
// rangées), à droite le tracé accroché à la grille des cases. `node --import ./tools/niveaux/enregistrer.ts tools/cartes/avant-apres.ts`
// écrit docs/cartes/chemins-avant-apres.png.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARTES, type IdCarte } from '../../src/data/niveaux/cartes-toutes.ts';
import type { CarteModele } from '../../src/data/niveaux/modele-carte.ts';
import { TUILE } from '../../src/render/camera.ts';
import { encoderPng, nouvelleImage } from '../art/png.ts';
import { poser } from '../art/apercu.ts';
import { dessinerCarte } from '../niveaux/planche.ts';

type Pts = [number, number][][];
/** Tracés d'origine (avant le jalon 5) des cartes montrées, et l'attente du héros. */
const AVANT: Partial<Record<IdCarte, { chemins: Pts; hero: [number, number] }>> = {
  chaumes: { chemins: [[[-1, 4], [12, 4], [12, 13], [24, 13], [24, 7], [33, 7]], [[-1, 16], [6, 16], [6, 10], [12, 10], [12, 13], [24, 13], [24, 7], [33, 7]]], hero: [16, 13] },
  meules: { chemins: [[[-1, 5], [10, 5], [10, 12], [22, 12], [22, 7], [33, 7]], [[-1, 15], [5, 15], [5, 12], [10, 12], [22, 12], [22, 7], [33, 7]]], hero: [16, 12] },
  ponton: { chemins: [[[-1, 9], [6, 9], [6, 3], [14, 3], [14, 14], [26, 14], [26, 6], [33, 6]]], hero: [20, 14] },
  cloitre: { chemins: [[[-1, 15], [4, 15], [4, 3], [12, 3], [12, 12], [20, 12], [20, 3], [28, 3], [28, 19]]], hero: [28, 15] },
};

const ids = Object.keys(AVANT) as IdCarte[];
const L = 32 * TUILE;
const H = 18 * TUILE;
const E = 6;
const image = nouvelleImage(2 * L + 3 * E, ids.length * (H + E) + E);
for (let i = 0; i < image.pixels.length; i += 4) { image.pixels[i] = 20; image.pixels[i + 1] = 20; image.pixels[i + 2] = 24; image.pixels[i + 3] = 255; }
ids.forEach((id, k) => {
  const apres: CarteModele = CARTES[id];
  const a = AVANT[id];
  if (!a) return;
  const avant: CarteModele = { ...apres, chemins: a.chemins.map((c) => ({ points: c.map(([x, y]) => ({ x, y })) })), departHeros: { x: a.hero[0], y: a.hero[1] } };
  poser(image, dessinerCarte(avant), E, E + k * (H + E));
  poser(image, dessinerCarte(apres), 2 * E + L, E + k * (H + E));
});
const sortie = fileURLToPath(new URL('../../docs/cartes/chemins-avant-apres.png', import.meta.url));
mkdirSync(dirname(sortie), { recursive: true });
writeFileSync(sortie, encoderPng(image));
console.log(`Planche écrite : ${sortie}`);
