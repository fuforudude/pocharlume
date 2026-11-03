// Mastoc et l'assassin d'ombre du Sanctuaire dérivaient de Charlie et de Plume. Depuis le jalon 5, ces deux héros sont
// redessinés (Gond, Nielle) : les deux sprites partent donc des copies figées `charlie-ancien` et `plume-ancien`, et leurs
// cadres doivent rester ceux d'avant (le gros matou, lui, est une version réduite de Gond). Empreintes prises sur l'état d'avant le
// jalon 5 (voir `empreintes.ts`) ; une retouche voulue de l'un de ces trois sprites les change (à mettre à jour alors).
import { describe, expect, it } from 'vitest';
import { construire } from './construire.ts';
import { empreintesSprite } from './empreintes.ts';

const ATTENDUES: Record<string, Record<string, string>> = {
  'heros-mastoc': { repos: '8048208c151c36cd', marche: 'e37b5ccb7b48c3d0', attaque: 'c4c4de2663cd3b6c', competence: '7fbb362996033866', blesse: 'ebe732e1ad0e9b1b', mort: '61801927dbdd1962' },
  // Yeux retouchés par l'auteur le 2026-11-01 (ancien-plume.txt, commit « changes art »).
  'assassin-ombre': { marche: 'bf15b9db86e14af7', blesse: '4e61e9a620799960', repos: '0ef1b083245f7e2b', attaque: '6cbcefb5f41d22df', competence: '32fa0f0f19e17d89', mort: 'acdce6c09e7244bf' },
};

describe('sprites de Mastoc et de l’assassin d’ombre, dérivés des anciens Charlie et Plume', () => {
  const sprites = construire().sprites;
  for (const [nom, attendu] of Object.entries(ATTENDUES)) {
    it(`${nom} garde les cadres d'avant le jalon 5`, () => {
      const s = sprites.find((x) => x.nom === nom);
      expect(s).toBeDefined();
      if (s) expect(empreintesSprite(s)).toEqual(attendu);
    });
  }
});
