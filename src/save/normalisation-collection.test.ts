// Import d'un code de la v4 : la collection est remise en cohérence avec les héros possédés, sans rien perdre d'autre.
import { describe, expect, it } from 'vitest';
import { DEFS_TEST, sauvegardeRemplie } from './aides.test-utils';
import { exporterCode, importerCode } from './code';
import { moderneParDefaut, sauvegardeVide, type Sauvegarde } from './format';
import { normaliserImport } from './normalisation';
import { validerSauvegarde } from './validation';

/** La sauvegarde remplie avec un familier et un skin équipés sur des héros que le joueur n'a pas (Mastoc, Lanterne). */
function avecEquipementSurHerosAbsents(): Sauvegarde {
  const s = sauvegardeRemplie();
  return {
    ...s,
    meta: {
      ...s.meta,
      collection: {
        ...s.meta.collection,
        possedes: { ...s.meta.collection.possedes, skin_mastoc: 2, skin_lanterne: 1, familier_rat: 3 },
        equipes: {
          skins: { tir: 'skin_tir_1', suie: 'skin_suie', mastoc: 'skin_mastoc', lanterne: 'skin_lanterne' },
          familiers: { suie: 'familier_chouette', mastoc: 'familier_rat', plume: 'familier_rat' },
        },
      },
    },
  };
}

describe('normalisation de la collection à l’import', () => {
  it('déséquipe skins et familiers portés par un héros que le joueur n’a pas, et les garde dans la collection', () => {
    const importee = normaliserImport(avecEquipementSurHerosAbsents(), DEFS_TEST);
    expect(importee.meta.collection.equipes).toEqual({
      // Les skins de tour ne dépendent pas des héros ; Mastoc et Lanterne ne sont pas possédés.
      skins: { tir: 'skin_tir_1', suie: 'skin_suie' },
      // Plume est un avatar (toujours possédé), Suie est possédé ; Mastoc non.
      familiers: { suie: 'familier_chouette', plume: 'familier_rat' },
    });
    expect(importee.meta.collection.possedes).toEqual(avecEquipementSurHerosAbsents().meta.collection.possedes);
  });

  it('fonctionne aussi sans définitions de héros', () => {
    const importee = normaliserImport(avecEquipementSurHerosAbsents());
    expect(importee.meta.collection.equipes.skins).toEqual({ tir: 'skin_tir_1', suie: 'skin_suie' });
    expect(importee.meta.collection.equipes.familiers).toEqual({ suie: 'familier_chouette', plume: 'familier_rat' });
  });

  it('ne touche ni aux éclats, ni aux garanties, ni aux défis, ni à la région', () => {
    const avant = avecEquipementSurHerosAbsents();
    const apres = normaliserImport(avant, DEFS_TEST);
    expect(apres.meta.collection.eclats).toBe(avant.meta.collection.eclats);
    expect(apres.meta.collection.garanties).toEqual(avant.meta.collection.garanties);
    expect(apres.meta.defis).toEqual(avant.meta.defis);
    expect(apres.meta.regionMax).toBe(avant.meta.regionMax);
  });

  it('une collection déjà cohérente passe telle quelle', () => {
    const s = sauvegardeRemplie();
    expect(normaliserImport(s, DEFS_TEST).meta.collection).toEqual(s.meta.collection);
  });

  it('ne modifie pas la sauvegarde reçue', () => {
    const s = avecEquipementSurHerosAbsents();
    const avant = JSON.stringify(s);
    normaliserImport(s, DEFS_TEST);
    expect(JSON.stringify(s)).toBe(avant);
  });

  it('un code exporté avec un tel équipement est accepté (la validation est indulgente) puis normalisé', async () => {
    const code = await exporterCode(avecEquipementSurHerosAbsents());
    const r = await importerCode(code, DEFS_TEST);
    if (!r.ok) throw new Error(r.detail);
    expect(r.sauvegarde.meta.collection.equipes.familiers).toEqual({ suie: 'familier_chouette', plume: 'familier_rat' });
    expect(r.sauvegarde.meta.collection.equipes.skins).toEqual({ tir: 'skin_tir_1', suie: 'skin_suie' });
  });
});

describe('skins et titres du DLC inconnus du catalogue', () => {
  const catalogue = { skinsTours: ['skin_moderne_tir'], skinsHeros: ['skin_moderne_plume'], titres: ['fac_occupee'] };
  const importee = (): Sauvegarde => ({
    ...sauvegardeVide(),
    moderne: {
      ...moderneParDefaut(),
      collection: { skinsTours: ['skin_moderne_caserne', 'skin_moderne_tir', 'skin_retire'], skinsHeros: ['skin_moderne_plume', 'skin_renomme'], garantie: 4 },
      titres: ['fac_occupee', 'titre_retire'],
    },
  });

  it('sont écartés à la normalisation, le reste est gardé dans l’ordre', () => {
    const s = normaliserImport(importee(), undefined, catalogue);
    expect(s.moderne.collection).toEqual({ skinsTours: ['skin_moderne_tir'], skinsHeros: ['skin_moderne_plume'], garantie: 4 });
    expect(s.moderne.titres).toEqual(['fac_occupee']);
    expect(validerSauvegarde(JSON.parse(JSON.stringify(s))).ok).toBe(true);
  });

  it('la validation ne refuse pas une sauvegarde pour un identifiant bien formé mais inconnu', () => {
    expect(validerSauvegarde(JSON.parse(JSON.stringify(importee()))).ok).toBe(true);
  });

  it('sans catalogue (pas encore de récompenses), rien n’est écarté', () => {
    expect(normaliserImport(importee()).moderne).toEqual(importee().moderne);
    expect(normaliserImport(importee(), undefined, null).moderne).toEqual(importee().moderne);
  });
});
