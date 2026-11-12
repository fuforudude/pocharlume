// Garde-fou de l'atlas à part du DLC « Temps modernes » (public/sprites/atlas-moderne.*) : il doit être exactement celui que produisent
// les sources de art/dlc-moderne/, ne contenir qu'elles, et rester léger (il n'est chargé que pour une partie du DLC).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { AtlasJson } from './atlas.ts';
import { construireModerne, DOSSIER_SORTIE, IMAGE_MODERNE, lireSources, lireSourcesModernes, type Construction } from './construire.ts';
import { decoderPng } from './png.ts';

let resultat: Construction;
let commite: AtlasJson;

beforeAll(() => {
  resultat = construireModerne();
  commite = JSON.parse(readFileSync(join(DOSSIER_SORTIE, 'atlas-moderne.json'), 'utf8')) as AtlasJson;
}, 60_000);

describe('atlas du DLC « Temps modernes »', () => {
  it('est à jour par rapport aux sources (sinon : npm run art)', () => {
    const texte = readFileSync(join(DOSSIER_SORTIE, 'atlas-moderne.json'), 'utf8').replace(/\r\n/g, '\n');
    expect(texte).toBe(resultat.texteJson);
    const image = decoderPng(readFileSync(join(DOSSIER_SORTIE, IMAGE_MODERNE)));
    expect([image.largeur, image.hauteur]).toEqual([resultat.image.largeur, resultat.image.hauteur]);
    expect(Buffer.from(image.pixels).equals(Buffer.from(resultat.image.pixels))).toBe(true);
    expect(commite.image).toBe(IMAGE_MODERNE);
  });

  it('contient tous les sprites des sources du DLC, et seulement eux (préfixe moderne-, aucun nom commun avec l’atlas du jeu)', () => {
    const noms = lireSourcesModernes().map((s) => s.nom).sort();
    expect(Object.keys(commite.sprites).sort()).toEqual(noms);
    const jeu = new Set(lireSources().sprites.map((s) => s.nom));
    for (const nom of noms) {
      expect(nom.startsWith('moderne-'), nom).toBe(true);
      expect(jeu.has(nom), nom).toBe(false);
    }
  });

  it('reste léger : planche sous 300 Ko et sous 2 048 px de haut', () => {
    expect(resultat.png.length).toBeLessThan(300 * 1024);
    expect(resultat.image.hauteur).toBeLessThan(2048);
  });
});
