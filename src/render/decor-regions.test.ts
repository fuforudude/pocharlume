// Décor des régions 2 à 5 : chaque sprite existe dans l'atlas en catégorie decor, et la liste GRANDS_DECORS (qui sert à
// écarter le décor du chemin) dit vrai : 32×32 dedans, 16×16 dehors.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GRANDS_DECORS } from '../data/niveaux/habillage';
import type { AtlasJson } from './atlas';

const atlas = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as AtlasJson;

const DECOR_PAR_REGION: Readonly<Record<number, { grands: readonly string[]; petits: readonly string[] }>> = {
  2: {
    grands: ['arbre-calcine-1', 'arbre-calcine-2', 'meule-brulee', 'chariot-brise'],
    petits: ['gerbes-brulees', 'sillon', 'fourche-brisee', 'souche-calcinee'],
  },
  3: {
    grands: ['bucher-braises', 'echafaud', 'maison-brulee-1', 'maison-brulee-2'],
    petits: ['cendres', 'fagots', 'torche-fichee', 'cloche-fendue'],
  },
  4: {
    grands: ['saule-marais-1', 'saule-marais-2', 'barque-echouee', 'puits-noir'],
    petits: ['roseaux', 'nenuphars', 'souche-moussue', 'feu-follet'],
  },
  5: {
    grands: ['maison-condamnee-1', 'maison-condamnee-2', 'charrette-linceuls', 'fosse-commune'],
    petits: ['croix-rouge', 'linceul', 'lanterne-peste', 'tas-ossements'],
  },
};

describe('décor des régions 2 à 5', () => {
  for (const [region, { grands, petits }] of Object.entries(DECOR_PAR_REGION)) {
    it(`région ${region} : ${String(grands.length)} grands décors en 32×32 (dans GRANDS_DECORS) et ${String(petits.length)} petits en 16×16`, () => {
      for (const nom of grands) {
        const s = atlas.sprites[nom];
        expect(s?.categorie, nom).toBe('decor');
        expect([s?.largeur, s?.hauteur], nom).toEqual([32, 32]);
        expect(GRANDS_DECORS.has(nom), nom).toBe(true);
      }
      for (const nom of petits) {
        const s = atlas.sprites[nom];
        expect(s?.categorie, nom).toBe('decor');
        expect([s?.largeur, s?.hauteur], nom).toEqual([16, 16]);
        expect(GRANDS_DECORS.has(nom), nom).toBe(false);
      }
    });
  }

  it('n’a pas de grand décor déclaré sans sprite 32×32 dans l’atlas', () => {
    for (const nom of GRANDS_DECORS) expect(atlas.sprites[nom]?.largeur, nom).toBe(32);
  });
});
