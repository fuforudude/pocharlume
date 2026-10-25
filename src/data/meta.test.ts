import { describe, expect, it } from 'vitest';
import {
  AVATARS,
  aretesDeVictoire,
  braisesDeVictoire,
  BRANCHES_ARBRE,
  coutCumuleArbre,
  coutRangArbre,
  dieuDuHeros,
  estNiveauBoss,
  HEROS_PAR_DIEU,
  IDS_DIEUX,
  IDS_HEROS,
  IDS_OBJETS,
  OBJETS,
  RANG_MAX_ARBRE,
  xpDePartie,
} from './meta';

describe('ids de la méta-progression', () => {
  it('3 dieux, 9 héros (3 par dieu, l’avatar d’abord), sans doublon', () => {
    expect(IDS_DIEUX).toEqual(['plume', 'charlie', 'pollen']);
    expect(new Set(IDS_HEROS).size).toBe(9);
    for (const dieu of IDS_DIEUX) {
      expect(HEROS_PAR_DIEU[dieu]).toHaveLength(3);
      expect(HEROS_PAR_DIEU[dieu][0]).toBe(dieu);
    }
    expect([...IDS_DIEUX.flatMap((d) => HEROS_PAR_DIEU[d])].sort()).toEqual([...IDS_HEROS].sort());
    expect(AVATARS).toEqual(['plume', 'charlie', 'pollen']);
    expect(dieuDuHeros('brise_os')).toBe('charlie');
    expect(dieuDuHeros('lanterne')).toBe('pollen');
  });

  it('6 branches de 5 rangs, le rang n coûte n étoiles', () => {
    expect(BRANCHES_ARBRE).toEqual(['caserne', 'tir', 'magie', 'artillerie', 'sorts', 'heros']);
    expect(RANG_MAX_ARBRE).toBe(5);
    expect([1, 2, 3, 4, 5].map(coutRangArbre)).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 5].map(coutCumuleArbre)).toEqual([1, 3, 6, 10, 15]);
  });

  it('4 objets aux prix du cahier des charges', () => {
    expect(IDS_OBJETS).toEqual(['fiole_soufre', 'herbe_sabbat', 'griffe_renfort', 'sablier']);
    expect(IDS_OBJETS.map((o) => OBJETS[o].prix)).toEqual([60, 80, 60, 100]);
  });
});

describe('gains', () => {
  it('arêtes : 30 + 6 × N + 15 par étoile nouvelle, sinon 10 + 2 × N', () => {
    expect(aretesDeVictoire(1, 3)).toBe(30 + 6 + 45);
    expect(aretesDeVictoire(10, 1)).toBe(30 + 60 + 15);
    expect(aretesDeVictoire(1, 0)).toBe(12);
    expect(aretesDeVictoire(10, 0)).toBe(30);
  });

  it('braises : 10 à la première victoire d’un boss, 2 aux premières 3 étoiles', () => {
    expect(braisesDeVictoire(10, true, false)).toBe(10);
    expect(braisesDeVictoire(10, true, true)).toBe(12);
    expect(braisesDeVictoire(10, false, false)).toBe(0);
    expect(braisesDeVictoire(5, true, false)).toBe(0);
    expect(braisesDeVictoire(5, true, true)).toBe(2);
    expect(braisesDeVictoire(20, true, false)).toBe(10);
  });

  it('les boss sont les niveaux 10, 20, … 100', () => {
    expect([1, 9, 10, 11, 20, 99, 100].map(estNiveauBoss)).toEqual([false, false, true, false, true, false, true]);
    expect(estNiveauBoss(0)).toBe(false);
    expect(estNiveauBoss(10.5)).toBe(false);
  });

  it('expérience : 100 + 20 × N, la moitié en cas de défaite, toujours entière', () => {
    expect(xpDePartie(1, true)).toBe(120);
    expect(xpDePartie(1, false)).toBe(60);
    for (let n = 1; n <= 100; n++) expect(Number.isInteger(xpDePartie(n, false))).toBe(true);
  });
});
