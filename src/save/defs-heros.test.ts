// DEFS_META (src/data/heros.ts) est bien la DefsMeta que la sauvegarde attend, et la valide.
import { describe, expect, it } from 'vitest';
import { DEFS_META, HEROS, SEUILS_XP } from '../data/heros';
import { IDS_HEROS } from '../data/meta';
import type { DefsMeta } from './definitions';

describe('DEFS_META', () => {
  it('est une DefsMeta : tous les héros avec leurs 4 compétences, et les seuils d’expérience', () => {
    const defs: DefsMeta = DEFS_META;
    expect(Object.keys(defs.heros).sort()).toEqual([...IDS_HEROS].sort());
    for (const [id, h] of Object.entries(HEROS)) {
      expect(defs.heros[id]?.competences, id).toEqual(h.competences.map((c) => ({ id: c.id, rangMax: c.rangMax, niveauRequis: c.niveauRequis })));
    }
    expect(defs.seuilsXp).toEqual(SEUILS_XP);
    expect(defs.seuilsXp[0]).toBe(150);
  });
});
