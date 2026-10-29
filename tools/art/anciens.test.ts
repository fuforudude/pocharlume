// Le gros matou des Renforts, Mastoc et l'assassin d'ombre du Sanctuaire dérivaient de Charlie et de Plume. Depuis le
// jalon 5, ces deux héros sont redessinés (Gond, Nielle) : les trois sprites partent donc des copies figées
// `charlie-ancien` et `plume-ancien`, et leurs cadres doivent rester ceux d'avant. Empreintes prises sur l'état d'avant le
// jalon 5 (voir `empreintes.ts`) ; une retouche voulue de l'un de ces trois sprites les change (à mettre à jour alors).
import { describe, expect, it } from 'vitest';
import { construire } from './construire.ts';
import { empreintesSprite } from './empreintes.ts';

const ATTENDUES: Record<string, Record<string, string>> = {
  'gros-matou': { repos: '2142cc47a4461c6e', marche: '5444b09a412006c7', attaque: 'e19c3de49b3f90f6', competence: 'cbe07dab92a7df45', blesse: '3ed7f4e6baf22d70', mort: '64a7bf778d2d2e6f' },
  'heros-mastoc': { repos: '8048208c151c36cd', marche: 'e37b5ccb7b48c3d0', attaque: 'c4c4de2663cd3b6c', competence: '7fbb362996033866', blesse: 'ebe732e1ad0e9b1b', mort: '61801927dbdd1962' },
  'assassin-ombre': { marche: '8351fb16623eafc5', blesse: '4e61e9a620799960', repos: '3ffa06ff9d7c8265', attaque: 'f659394c3d3c8e83', competence: '0e909f7ed6834baa', mort: 'acdce6c09e7244bf' },
};

describe('sprites dérivés des anciens Charlie et Plume', () => {
  const sprites = construire().sprites;
  for (const [nom, attendu] of Object.entries(ATTENDUES)) {
    it(`${nom} garde les cadres d'avant le jalon 5`, () => {
      const s = sprites.find((x) => x.nom === nom);
      expect(s).toBeDefined();
      if (s) expect(empreintesSprite(s)).toEqual(attendu);
    });
  }
});
