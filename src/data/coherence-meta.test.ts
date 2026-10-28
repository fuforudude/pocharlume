// Cohérence entre le contenu en partie (dieux, héros, objets, arbre) et la méta-progression (meta.ts) : mêmes ids,
// mêmes plafonds, et un seul endroit pour chaque prix.
import { describe, expect, it } from 'vitest';
import { BRANCHES } from './ameliorations';
import { DIEUX } from './dieux';
import { HEROS, SEUILS_XP } from './heros';
import {
  braisesDeVictoire,
  BRANCHES_ARBRE,
  COMPETENCES_PAR_HEROS,
  HEROS_PAR_DIEU,
  IDS_DIEUX,
  IDS_HEROS,
  IDS_OBJETS,
  NIVEAU_ULTIME,
  PRIX_DISCIPLE,
  RANG_MAX_ARBRE,
  RANG_MAX_COMPETENCE,
} from './meta';
import { OBJETS } from './objets';
import { REGLES } from './regles';

const trie = (ids: readonly string[]): string[] => [...ids].sort();

describe('ids du contenu et de la méta-progression', () => {
  it('dieux', () => {
    expect(trie(Object.keys(DIEUX))).toEqual(trie(IDS_DIEUX));
  });

  it('héros : les mêmes, et chaque dieu a les siens, l’avatar d’abord', () => {
    expect(trie(Object.keys(HEROS))).toEqual(trie(IDS_HEROS));
    for (const dieu of IDS_DIEUX) {
      expect([...DIEUX[dieu].idsHeros]).toEqual([...HEROS_PAR_DIEU[dieu]]);
      for (const h of HEROS_PAR_DIEU[dieu]) expect(HEROS[h].dieu, h).toBe(dieu);
    }
  });

  it('objets', () => {
    expect(trie(Object.keys(OBJETS))).toEqual(trie(IDS_OBJETS));
  });

  it('branches de l’arbre', () => {
    expect(trie(Object.keys(BRANCHES))).toEqual(trie(BRANCHES_ARBRE));
  });

  it('plafonds : rangs de l’arbre et des compétences, ultime, compétences par héros, niveau maximal', () => {
    for (const b of Object.values(BRANCHES)) expect(b.rangMax).toBe(RANG_MAX_ARBRE);
    for (const h of Object.values(HEROS)) {
      expect(h.competences).toHaveLength(COMPETENCES_PAR_HEROS);
      for (const c of h.competences) {
        expect(c.rangMax).toBe(RANG_MAX_COMPETENCE);
        expect(c.niveauRequis).toBe(c.ultime ? NIVEAU_ULTIME : 1);
      }
    }
    expect(SEUILS_XP.length + 1).toBe(REGLES.niveauHerosMax);
  });

  it('les prix et le stock des objets ne sont définis que dans meta.ts', () => {
    for (const objet of Object.values(OBJETS)) {
      expect(Object.keys(objet)).not.toContain('prix');
      expect(Object.keys(objet)).not.toContain('stockMax');
    }
  });

  it('les braises de la région 1 (5 par niveau, 10 du boss, 2 par niveau à 3 étoiles) paient deux disciples, pas trois', () => {
    let total = 0;
    for (let niveau = 1; niveau <= 10; niveau++) total += braisesDeVictoire(niveau, true, true);
    expect(total).toBe(80);
    expect(total).toBeGreaterThanOrEqual(2 * PRIX_DISCIPLE);
    expect(total).toBeLessThan(3 * PRIX_DISCIPLE);
  });
});
