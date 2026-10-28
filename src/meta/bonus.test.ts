import { describe, expect, it } from 'vitest';
import { CATALOGUE, DEFS_FAMILIERS, DEFS_SKINS, FAMILLES_BASE, IDS_FAMILIERS, IDS_SKINS, type IdFamilier, type IdSkin } from '../data/collection';
import {
  AVATARS,
  BONUS_FAMILIER_POURCENT,
  BONUS_SKIN_POURCENT,
  ECHELLE_BONUS,
  IDS_HEROS,
  PLAFOND_BONUS_ENTIERS,
  RANG_MAX_COLLECTION,
  type IdDefi,
  type IdHeros,
} from '../data/meta';
import { bonusDeCollection, bonusVide, type BonusCollection } from './bonus';
import { collectionVide, type Collection } from './collection';

/**
 * Le contrat exact de `ConfigPartie.bonus` côté moteur (tâche parallèle) : si `BonusCollection` s'en écarte, ces
 * affectations ne compilent plus.
 */
interface ContratBonus {
  tours: Partial<Record<'caserne' | 'tir' | 'magie' | 'artillerie', Partial<Record<'degats' | 'cadence' | 'portee' | 'pvSoldats', number>>>>;
  heros: Partial<Record<'pv' | 'degats' | 'cadence' | 'regeneration', number>>;
}
const verifieContrat = (b: BonusCollection): ContratBonus => b;
const verifieContratInverse = (c: ContratBonus): BonusCollection => c;

/** Une collection qui possède ces objets à ces rangs et les porte. */
function collectionAvec(options: {
  skins?: readonly [IdSkin, number][];
  familiers?: readonly [IdFamilier, number][];
  heros?: IdHeros;
}): Collection {
  const c = collectionVide();
  for (const [id, rang] of options.skins ?? []) {
    c.possedes[id] = rang;
    const def = DEFS_SKINS[id];
    c.equipes.skins[def.cible.type === 'tour' ? def.cible.famille : def.cible.heros] = id;
  }
  for (const [id, rang] of options.familiers ?? []) {
    c.possedes[id] = rang;
    c.equipes.familiers[options.heros ?? 'charlie'] = id;
  }
  return c;
}

/** Somme des bonus d'une tour ou d'un héros, en entiers de 1/100 000. */
function entiers(stats: Readonly<Record<string, number | undefined>> | undefined): number {
  return Object.values(stats ?? {}).reduce<number>((somme, v) => somme + Math.round((v ?? 0) * ECHELLE_BONUS), 0);
}

describe('bonus d’une collection équipée', () => {
  it('une collection vide ne donne aucun bonus', () => {
    expect(bonusDeCollection(collectionVide(), 'charlie', null)).toEqual({ tours: {}, heros: {} });
    expect(bonusVide()).toEqual({ tours: {}, heros: {} });
  });

  it('respecte le contrat de la config de partie dans les deux sens', () => {
    const b = verifieContrat(bonusDeCollection(collectionAvec({ skins: [['skin_tir_1', 1]] }), 'charlie', null));
    expect(verifieContratInverse(b)).toEqual(b);
  });

  it('un skin de tour donne sa base de rareté à la stat de sa tour, en fraction', () => {
    expect(bonusDeCollection(collectionAvec({ skins: [['skin_tir_1', 1]] }), 'charlie', null)).toEqual({ tours: { tir: { cadence: 0.01 } }, heros: {} });
    expect(bonusDeCollection(collectionAvec({ skins: [['skin_caserne_3', 1]] }), 'charlie', null)).toEqual({ tours: { caserne: { cadence: 0.03 } }, heros: {} });
    expect(bonusDeCollection(collectionAvec({ skins: [['skin_caserne_1', 1]] }), 'charlie', null)).toEqual({ tours: { caserne: { pvSoldats: 0.01 } }, heros: {} });
  });

  it('le rang multiplie le bonus par 1 + 0,25 × (rang − 1)', () => {
    const bonusAuRang = (rang: number): number | undefined =>
      bonusDeCollection(collectionAvec({ skins: [['skin_magie_2', rang]] }), 'charlie', null).tours.magie?.portee;
    expect([1, 2, 3, 4, 5].map(bonusAuRang)).toEqual([0.03, 0.0375, 0.045, 0.0525, 0.06]);
  });

  it('le skin et le familier du héros joué comptent, ceux des autres héros non', () => {
    const c = collectionAvec({ skins: [['skin_suie', 1], ['skin_mastoc', 1]], familiers: [['familier_chouette', 1]], heros: 'suie' });
    expect(bonusDeCollection(c, 'suie', null)).toEqual({ tours: {}, heros: { degats: 0.03, cadence: 0.015 } });
    expect(bonusDeCollection(c, 'mastoc', null)).toEqual({ tours: {}, heros: { pv: 0.04 } });
    expect(bonusDeCollection(c, 'plume', null)).toEqual({ tours: {}, heros: {} });
  });

  it('un skin et un familier sur la même stat du héros s’additionnent', () => {
    const c = collectionAvec({ skins: [['skin_charlie', 1]], familiers: [['familier_rat', 1]], heros: 'charlie' });
    expect(bonusDeCollection(c, 'charlie', null).heros).toEqual({ pv: 0.03 });
  });

  it('les bonus de toutes les tours équipées sortent ensemble', () => {
    const c = collectionAvec({ skins: [['skin_caserne_2', 1], ['skin_tir_2', 2], ['skin_magie_3', 1], ['skin_artillerie_1', 1]] });
    expect(bonusDeCollection(c, 'charlie', null).tours).toEqual({
      caserne: { degats: 0.02 },
      tir: { portee: 0.025 },
      magie: { cadence: 0.04 },
      artillerie: { portee: 0.01 },
    });
  });

  it('un objet équipé mais pas possédé (sauvegarde abîmée) ne donne rien', () => {
    const c = collectionVide();
    c.equipes.skins.tir = 'skin_tir_3';
    c.equipes.familiers.charlie = 'familier_rat';
    expect(bonusDeCollection(c, 'charlie', null)).toEqual({ tours: {}, heros: {} });
  });

  it('un skin mal placé (autre tour, autre héros) ne donne rien', () => {
    const c = collectionVide();
    c.possedes.skin_tir_3 = 5;
    c.equipes.skins.magie = 'skin_tir_3';
    expect(bonusDeCollection(c, 'charlie', null)).toEqual({ tours: {}, heros: {} });
  });

  it('le défi Héroïque garde les bonus, le défi Fer les supprime tous', () => {
    const c = collectionAvec({ skins: [['skin_tir_3', 5], ['skin_charlie', 5]], familiers: [['familier_salamandre', 5]], heros: 'charlie' });
    const normal = bonusDeCollection(c, 'charlie', null);
    expect(normal.tours.tir?.degats).toBeGreaterThan(0);
    expect(bonusDeCollection(c, 'charlie', 'heroique')).toEqual(normal);
    expect(bonusDeCollection(c, 'charlie', 'fer')).toEqual({ tours: {}, heros: {} });
  });

  it('ne modifie pas la collection qu’on lui donne', () => {
    const c = collectionAvec({ skins: [['skin_tir_3', 5]] });
    const avant = JSON.stringify(c);
    bonusDeCollection(c, 'charlie', null);
    expect(JSON.stringify(c)).toBe(avant);
  });

  describe('plafond de +10 % par tour ou par héros', () => {
    it('à pleine puissance, un skin Mythique de rang 5 atteint exactement 10 % et pas plus', () => {
      const c = collectionAvec({ skins: [['skin_lanterne', RANG_MAX_COLLECTION]] });
      expect(bonusDeCollection(c, 'lanterne', null).heros).toEqual({ regeneration: 0.1 });
    });

    it('au-delà, le total est ramené à 10 % en gardant les proportions entre stats', () => {
      // Lanterne : skin Mythique rang 5 (+10 % régénération) et familier Mythique rang 5 (+8 % dégâts) = 18 % bruts.
      const c = collectionAvec({ skins: [['skin_lanterne', 5]], familiers: [['familier_salamandre', 5]], heros: 'lanterne' });
      const h = bonusDeCollection(c, 'lanterne', null).heros;
      expect(entiers(h)).toBeLessThanOrEqual(PLAFOND_BONUS_ENTIERS);
      expect(entiers(h)).toBeGreaterThan(PLAFOND_BONUS_ENTIERS - 5);
      expect(h.regeneration ?? 0).toBeGreaterThan(h.degats ?? 0);
      expect((h.regeneration ?? 0) / (h.degats ?? 1)).toBeCloseTo(10 / 8, 2);
    });

    it('sur toutes les combinaisons du catalogue (chaque tour, chaque héros avec chaque familier, tous rangs), le total ne dépasse jamais +10 %', () => {
      let combinaisons = 0;
      let plafonne = 0;
      // Chaque skin de tour, à chaque rang.
      for (const id of IDS_SKINS) {
        for (let rang = 1; rang <= RANG_MAX_COLLECTION; rang++) {
          const c = collectionAvec({ skins: [[id, rang]] });
          for (const heros of IDS_HEROS) {
            const b = bonusDeCollection(c, heros, null);
            for (const famille of FAMILLES_BASE) expect(entiers(b.tours[famille]), `${id} rang ${String(rang)} ${famille}`).toBeLessThanOrEqual(PLAFOND_BONUS_ENTIERS);
            expect(entiers(b.heros), `${id} rang ${String(rang)} ${heros}`).toBeLessThanOrEqual(PLAFOND_BONUS_ENTIERS);
            combinaisons++;
          }
        }
      }
      // Chaque héros : son skin (ou aucun) à chaque rang avec chaque familier (ou aucun) à chaque rang.
      for (const heros of IDS_HEROS) {
        const skinsPossibles: (IdSkin | null)[] = [null, `skin_${heros}` as IdSkin];
        const familiersPossibles: (IdFamilier | null)[] = [null, ...IDS_FAMILIERS];
        for (const skin of skinsPossibles) {
          for (const familier of familiersPossibles) {
            for (let rangSkin = 1; rangSkin <= RANG_MAX_COLLECTION; rangSkin++) {
              for (let rangFamilier = 1; rangFamilier <= RANG_MAX_COLLECTION; rangFamilier++) {
                const c = collectionAvec({
                  skins: skin ? [[skin, rangSkin]] : [],
                  familiers: familier ? [[familier, rangFamilier]] : [],
                  heros,
                });
                const h = bonusDeCollection(c, heros, null).heros;
                const total = entiers(h);
                expect(total, `${heros} ${String(skin)} ${String(familier)}`).toBeLessThanOrEqual(PLAFOND_BONUS_ENTIERS);
                for (const valeur of Object.values(h)) {
                  expect(valeur).toBeLessThanOrEqual(0.1);
                  expect(valeur).toBeGreaterThan(0);
                }
                if (total === PLAFOND_BONUS_ENTIERS) plafonne++;
                combinaisons++;
              }
            }
          }
        }
      }
      // Toute la collection au maximum, équipée partout.
      for (const heros of IDS_HEROS) {
        const tout = collectionVide();
        for (const id of IDS_SKINS) {
          tout.possedes[id] = RANG_MAX_COLLECTION;
          const def = DEFS_SKINS[id];
          tout.equipes.skins[def.cible.type === 'tour' ? def.cible.famille : def.cible.heros] = id;
        }
        for (const id of IDS_FAMILIERS) tout.possedes[id] = RANG_MAX_COLLECTION;
        for (const id of IDS_FAMILIERS) {
          tout.equipes.familiers[heros] = id;
          const b = bonusDeCollection(tout, heros, null);
          for (const famille of FAMILLES_BASE) expect(entiers(b.tours[famille])).toBeLessThanOrEqual(PLAFOND_BONUS_ENTIERS);
          expect(entiers(b.heros)).toBeLessThanOrEqual(PLAFOND_BONUS_ENTIERS);
          combinaisons++;
        }
      }
      expect(combinaisons).toBeGreaterThan(5000);
      // Le plafond joue vraiment dans le catalogue (sinon le test ne prouverait rien).
      expect(plafonne).toBeGreaterThan(0);
    });

    it('chaque bonus individuel respecte la table des raretés et reste dans les 10 %', () => {
      for (const id of IDS_SKINS) {
        const def = DEFS_SKINS[id];
        const base = BONUS_SKIN_POURCENT[def.rarete];
        expect(base).toBeLessThanOrEqual(5);
        expect(CATALOGUE[id].rarete).toBe(def.rarete);
      }
      for (const id of IDS_FAMILIERS) expect(BONUS_FAMILIER_POURCENT[DEFS_FAMILIERS[id].rarete]).toBeLessThanOrEqual(4);
    });
  });

  it('les trois avatars et les six disciples sont couverts par le catalogue de skins', () => {
    for (const heros of IDS_HEROS) expect(IDS_SKINS).toContain(`skin_${heros}`);
    expect(AVATARS).toHaveLength(3);
  });

  it('le type du défi accepté est celui de la sauvegarde', () => {
    const defis: (IdDefi | null)[] = [null, 'heroique', 'fer'];
    for (const defi of defis) expect(() => bonusDeCollection(collectionVide(), 'charlie', defi)).not.toThrow();
  });
});
