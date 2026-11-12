// Les campagnes nommées : l'histoire (niveaux 1 à 150, inchangée) et « Temps modernes » (le DLC, 3 régions de 10 niveaux).
import { describe, expect, it } from 'vitest';
import {
  campagneDuNiveau,
  IDS_CAMPAGNES,
  NIVEAU_MAX_MODERNE,
  NOMBRE_REGIONS_MODERNE,
  regionDuNiveauModerne,
  regionOuverteModerne,
  toutEstOuvertDans,
} from './campagnes';
import { NIVEAU_MAX, NIVEAUX_PAR_REGION, NOMBRE_REGIONS, regionDuNiveau } from './meta';
import { CAMPAGNE } from './niveaux/campagne';
import { CAMPAGNE_MODERNE, NOEUDS_REGIONS_MODERNE, REGIONS_MODERNE, TEXTES_REGIONS_MODERNE, TRACES_REGIONS_MODERNE, niveauModerne } from './niveaux/campagne-moderne';

describe('campagnes nommées', () => {
  it('deux campagnes : l’histoire et Temps modernes', () => {
    expect(IDS_CAMPAGNES).toEqual(['histoire', 'moderne']);
  });

  it('l’histoire garde ses 15 régions et ses 150 niveaux', () => {
    expect([NOMBRE_REGIONS, NIVEAU_MAX, regionDuNiveau(150)]).toEqual([15, 150, 15]);
  });

  it('le DLC a ses propres constantes : 3 régions de 10 niveaux', () => {
    expect(NOMBRE_REGIONS_MODERNE).toBe(3);
    expect(NIVEAU_MAX_MODERNE).toBe(3 * NIVEAUX_PAR_REGION);
    expect([1, 10, 11, 20, 21, 30].map(regionDuNiveauModerne)).toEqual([1, 1, 2, 2, 3, 3]);
    for (const hors of [0, 31, 1.5, -1, Number.NaN]) expect(regionDuNiveauModerne(hors)).toBe(0);
  });

  it('une région du DLC s’ouvre quand le boss de la précédente est battu', () => {
    expect([1, 10, 11, 20, 21, 30].map(regionOuverteModerne)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('un niveau sans campagne est de l’histoire (les niveaux de l’histoire ne changent pas)', () => {
    expect(campagneDuNiveau({})).toBe('histoire');
    expect(campagneDuNiveau({ campagne: 'moderne' })).toBe('moderne');
    for (const n of CAMPAGNE) {
      expect(n.campagne, `niveau ${String(n.numero)}`).toBeUndefined();
      expect(n.niveau.campagne, `niveau ${String(n.numero)}`).toBeUndefined();
    }
  });

  it('tout est ouvert dans le DLC, comme après le niveau 11 de l’histoire ; l’histoire garde son déblocage progressif', () => {
    expect(toutEstOuvertDans('moderne')).toBe(true);
    expect(toutEstOuvertDans('histoire')).toBe(false);
  });
});

describe('liste des niveaux du DLC', () => {
  it('est vide pour l’instant, sans rien casser : aucune région n’est complète', () => {
    expect(CAMPAGNE_MODERNE).toEqual([]);
    expect(REGIONS_MODERNE).toHaveLength(NOMBRE_REGIONS_MODERNE);
    expect(REGIONS_MODERNE.every((r) => r.length === 0)).toBe(true);
    expect(niveauModerne(1)).toBeUndefined();
    expect([NOEUDS_REGIONS_MODERNE, TRACES_REGIONS_MODERNE, TEXTES_REGIONS_MODERNE].map((l) => l.length)).toEqual([NOMBRE_REGIONS_MODERNE, NOMBRE_REGIONS_MODERNE, NOMBRE_REGIONS_MODERNE]);
  });

  it('chaque niveau livré porte la campagne moderne et un numéro de 1 à 30, rangé dans sa région', () => {
    CAMPAGNE_MODERNE.forEach((n, i) => {
      expect(n.campagne).toBe('moderne');
      expect(n.niveau.campagne).toBe('moderne');
      expect(n.numero).toBe(i + 1);
      expect(n.niveau.numero).toBe(n.numero);
      expect(REGIONS_MODERNE[regionDuNiveauModerne(n.numero) - 1]).toContain(n);
    });
    expect(CAMPAGNE_MODERNE.length).toBeLessThanOrEqual(NIVEAU_MAX_MODERNE);
  });
});
