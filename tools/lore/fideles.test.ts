// Les trois fidèles (Nielle, Gond, Clopin) gardent exactement les identifiants, statistiques, compétences et clés de
// texte des anciens héros-dieux : l'équilibrage et les sauvegardes ne bougent pas, seuls les textes et les sprites changent.
// Les empreintes ont été prises sur les données d'avant le jalon 5 ; une retouche volontaire des héros les change.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { HEROS } from '../../src/data/heros';
import { fr } from '../../src/i18n/fr';

const EMPREINTES = { plume: '729ea666a0e89b0f', charlie: '4ca5ad6f2336c6ad', pollen: 'a7a273b225036e9e' } as const;

describe('les trois fidèles', () => {
  for (const id of ['plume', 'charlie', 'pollen'] as const) {
    it(`${id} : mêmes données qu’avant`, () => {
      const empreinte = createHash('sha256').update(JSON.stringify(HEROS[id])).digest('hex').slice(0, 16);
      expect(empreinte).toBe(EMPREINTES[id]);
    });
  }

  it('portent leurs nouveaux noms', () => {
    expect(fr['heros.plume']).toBe('Nielle, Souffle-Lampes');
    expect(fr['heros.charlie']).toBe('Gond, le Portier');
    expect(fr['heros.pollen']).toBe('Clopin, le Tendeur');
  });
});
