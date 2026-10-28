import { describe, expect, it } from 'vitest';
import { fr } from '../i18n/fr';
import {
  CATALOGUE,
  DEFS_FAMILIERS,
  DEFS_SKINS,
  estIdCollection,
  estIdFamilier,
  estIdSkin,
  IDS_FAMILIERS,
  IDS_SKINS,
  objetsDeCaisse,
  raretesDeCaisse,
} from './collection';
import { HEROS } from './heros';
import { IDS_HEROS, RARETES, TYPES_CAISSE } from './meta';

describe('catalogue de la collection', () => {
  it('21 skins : 3 par tour de base et 1 par héros, ids du cahier des charges', () => {
    expect(IDS_SKINS).toHaveLength(21);
    expect([...IDS_SKINS].sort()).toEqual(
      [
        ...['caserne', 'tir', 'magie', 'artillerie'].flatMap((f) => [1, 2, 3].map((n) => `skin_${f}_${String(n)}`)),
        ...IDS_HEROS.map((h) => `skin_${h}`),
      ].sort(),
    );
  });

  it('12 familiers aux ids du cahier des charges', () => {
    expect([...IDS_FAMILIERS].sort()).toEqual(
      [
        'familier_rat', 'familier_crapaud', 'familier_chouette', 'familier_chauve_souris', 'familier_luciole', 'familier_lezard',
        'familier_araignee', 'familier_corneille', 'familier_furet', 'familier_escargot', 'familier_papillon_nuit', 'familier_salamandre',
      ].sort(),
    );
  });

  it('les skins de héros visent des héros qui existent vraiment dans src/data/heros.ts', () => {
    for (const heros of IDS_HEROS) {
      expect(DEFS_SKINS[`skin_${heros}`].cible, heros).toMatchObject({ type: 'heros', heros });
      expect(Object.hasOwn(HEROS, heros)).toBe(true);
    }
  });

  it('chaque skin de tour porte une stat de tour, chaque skin de héros et chaque familier une stat de héros', () => {
    for (const def of Object.values(DEFS_SKINS)) {
      if (def.cible.type === 'tour') expect(['degats', 'cadence', 'portee', 'pvSoldats']).toContain(def.stat);
      else expect(['pv', 'degats', 'cadence', 'regeneration']).toContain(def.stat);
    }
    for (const def of Object.values(DEFS_FAMILIERS)) expect(['pv', 'degats', 'cadence', 'regeneration']).toContain(def.stat);
  });

  it('chaque tour de base a ses 3 skins, des PV de soldats seulement pour la Caserne', () => {
    for (const famille of ['caserne', 'tir', 'magie', 'artillerie']) {
      const skins = Object.values(DEFS_SKINS).filter((d) => d.cible.type === 'tour' && d.cible.famille === famille);
      expect(skins, famille).toHaveLength(3);
      if (famille !== 'caserne') for (const skin of skins) expect(skin.stat).not.toBe('pvSoldats');
    }
  });

  it('chaque rareté existe dans chaque caisse (le tirage n’a jamais de rareté vide)', () => {
    for (const type of TYPES_CAISSE) {
      expect(raretesDeCaisse(type), type).toEqual([...RARETES]);
      for (const rarete of RARETES) expect(objetsDeCaisse(type, rarete).length, `${type} ${rarete}`).toBeGreaterThan(0);
    }
  });

  it('les objets d’une caisse sont tous de ce type, sans doublon, et couvrent le catalogue', () => {
    const tous = TYPES_CAISSE.flatMap((type) => RARETES.flatMap((rarete) => objetsDeCaisse(type, rarete)));
    expect(new Set(tous).size).toBe(33);
    expect(tous.filter(estIdSkin)).toHaveLength(21);
    expect(tous.filter(estIdFamilier)).toHaveLength(12);
  });

  it('ids uniques, gardes de type et catalogue unifié', () => {
    expect(Object.keys(CATALOGUE)).toHaveLength(33);
    expect(estIdSkin('skin_plume')).toBe(true);
    expect(estIdSkin('familier_rat')).toBe(false);
    expect(estIdFamilier('familier_rat')).toBe(true);
    expect(estIdCollection('constructor')).toBe(false);
    expect(estIdCollection('__proto__')).toBe(false);
    expect(estIdCollection(3)).toBe(false);
  });

  it('chaque objet a un nom et une description dans la table des textes', () => {
    for (const def of Object.values(CATALOGUE)) {
      expect(Object.hasOwn(fr, def.nom), def.nom).toBe(true);
      expect(Object.hasOwn(fr, def.description), def.description).toBe(true);
    }
  });

  it('chaque rareté, chaque stat et chaque famille a son texte', () => {
    for (const rarete of RARETES) expect(Object.hasOwn(fr, `rarete.${rarete}`), rarete).toBe(true);
    for (const stat of ['pv', 'degats', 'cadence', 'regeneration', 'portee', 'pvSoldats']) expect(Object.hasOwn(fr, `stat.${stat}`), stat).toBe(true);
  });

  it('chaque raison de refus propre à la collection et aux défis a sa phrase', () => {
    const raisons = ['type_inconnu', 'eclats_insuffisants', 'non_possede', 'emplacement_invalide', 'aleatoire_indisponible', 'defi_inconnu', 'defi_verrouille'];
    for (const raison of raisons) expect(Object.hasOwn(fr, `collection.refus.${raison}`), raison).toBe(true);
  });
});
