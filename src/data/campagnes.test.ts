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
import { REGION1 } from './niveaux/region1';
import type { NiveauCampagne } from './visuel';
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
  it('la Fac (région 1) et la Préfecture (région 3) sont livrées : niveaux 1 à 10 et 21 à 30, la Manif est encore vide', () => {
    expect(CAMPAGNE_MODERNE.map((n) => n.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    expect(REGIONS_MODERNE).toHaveLength(NOMBRE_REGIONS_MODERNE);
    expect(REGIONS_MODERNE.map((r) => r.length)).toEqual([10, 0, 10]);
    expect(niveauModerne(1)).toBe(CAMPAGNE_MODERNE[0]);
    expect(niveauModerne(11)).toBeUndefined();
    expect(niveauModerne(30)?.numero).toBe(30);
    expect([NOEUDS_REGIONS_MODERNE, TRACES_REGIONS_MODERNE, TEXTES_REGIONS_MODERNE].map((l) => l.length)).toEqual([NOMBRE_REGIONS_MODERNE, NOMBRE_REGIONS_MODERNE, NOMBRE_REGIONS_MODERNE]);
    expect([NOEUDS_REGIONS_MODERNE[0]?.length, TRACES_REGIONS_MODERNE[0]?.length, TEXTES_REGIONS_MODERNE[0]?.length]).toEqual([10, 9, 10]);
    expect([NOEUDS_REGIONS_MODERNE[1]?.length, TRACES_REGIONS_MODERNE[1]?.length, TEXTES_REGIONS_MODERNE[1]?.length]).toEqual([0, 0, 0]);
    expect([NOEUDS_REGIONS_MODERNE[2]?.length, TRACES_REGIONS_MODERNE[2]?.length, TEXTES_REGIONS_MODERNE[2]?.length]).toEqual([10, 9, 10]);
  });

  /** Les écarts d'une liste de niveaux du DLC à la règle : campagne, numéros croissants, région. */
  function ecartsModerne(liste: readonly NiveauCampagne[], regions: readonly (readonly NiveauCampagne[])[]): string[] {
    const ecarts: string[] = [];
    liste.forEach((n, i) => {
      if (n.campagne !== 'moderne' || n.niveau.campagne !== 'moderne') ecarts.push(`${String(i + 1)} : campagne`);
      // Numéros croissants de 1 à 30 (une région pas encore livrée laisse un trou de 10, comme la Manif tant qu'elle manque).
      const precedent = liste[i - 1]?.numero ?? 0;
      if (!(n.numero > precedent && n.numero <= NIVEAU_MAX_MODERNE) || n.niveau.numero !== n.numero) ecarts.push(`${String(i + 1)} : numéro`);
      if (!regions[regionDuNiveauModerne(n.numero) - 1]?.includes(n)) ecarts.push(`${String(i + 1)} : région`);
    });
    if (liste.length > NIVEAU_MAX_MODERNE) ecarts.push('trop de niveaux');
    return ecarts;
  }

  it('chaque niveau livré porte la campagne moderne et un numéro de 1 à 30, rangé dans sa région', () => {
    expect(ecartsModerne(CAMPAGNE_MODERNE, REGIONS_MODERNE)).toEqual([]);
  });

  it('la règle sait voir un niveau du DLC mal étiqueté (elle ne passe pas à vide)', () => {
    const base = REGION1[0];
    if (!base) throw new Error('niveau 1 absent');
    const bon: NiveauCampagne = { ...base, numero: 1, campagne: 'moderne', niveau: { ...base.niveau, numero: 1, campagne: 'moderne' } };
    const mauvais: NiveauCampagne = { ...base, numero: 2, niveau: { ...base.niveau, numero: 2 } };
    const regions = [[bon, mauvais], [], []];
    expect(ecartsModerne([bon], regions)).toEqual([]);
    expect(ecartsModerne([bon, mauvais], regions)).toEqual(['2 : campagne']);
    expect(ecartsModerne([mauvais, bon], regions)).toContain('1 : campagne');
  });
});
