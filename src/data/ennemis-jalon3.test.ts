// Données des ennemis et boss des régions 2 à 5 (jalon 3) : ids, cohérence des mécaniques, valeurs de départ.
import { describe, expect, it } from 'vitest';
import type { ActionEnnemi, DefEnnemi } from '../engine/definitions';
import { fr } from '../i18n/fr';
import { ENNEMIS } from './ennemis';
import { menaceEnnemi } from './equilibrage';
import { REGLES } from './regles';

const table: Readonly<Record<string, DefEnnemi>> = ENNEMIS;

const REGIONS: Readonly<Record<number, { ennemis: readonly string[]; boss: string }>> = {
  2: { ennemis: ['glaneur', 'corbeau_noir', 'epouvantail'], boss: 'la_faim' },
  3: { ennemis: ['porteur_torche', 'chasseur_sorcieres', 'delateur'], boss: 'juge_flammes' },
  4: { ennemis: ['noyeur', 'pelerin_voile', 'sangsue'], boss: 'dame_puits' },
  5: { ennemis: ['rat_peste', 'pestifere', 'medecin_peste'], boss: 'mere_rats' },
};

function actions(def: DefEnnemi): ActionEnnemi[] {
  const pouvoirs = def.pouvoirs;
  return [...(pouvoirs?.paliers ?? []).flatMap((p) => p.actions), ...(pouvoirs?.periodiques ?? []).flatMap((p) => p.actions)];
}

describe('ennemis des régions 2 à 5', () => {
  it('les 12 ennemis et 4 boss ont les ids attendus (les sprites en dépendent)', () => {
    for (const { ennemis, boss } of Object.values(REGIONS)) {
      for (const id of ennemis) expect(Object.hasOwn(ENNEMIS, id), id).toBe(true);
      expect(table[boss]?.boss, boss).toBe(true);
    }
    expect(Object.keys(ENNEMIS)).toHaveLength(4 + 12 + 4);
    expect(Object.values(ENNEMIS).filter((e) => e.boss)).toHaveLength(5);
  });

  it('chaque ennemi a un nom traduit, des valeurs saines et une prime', () => {
    for (const [id, def] of Object.entries(table)) {
      expect(Object.hasOwn(fr, def.nom), id).toBe(true);
      expect(def.pv, id).toBeGreaterThan(0);
      expect(def.vitesse, id).toBeGreaterThan(0);
      expect(def.coutVies, id).toBeGreaterThanOrEqual(1);
      expect(def.prime, id).toBeGreaterThan(0);
      expect(def.cadence, id).toBeGreaterThan(0);
      expect(def.degats[1], id).toBeGreaterThanOrEqual(def.degats[0]);
    }
  });

  it('les mécaniques correspondent à la spec', () => {
    expect(ENNEMIS.glaneur.distance?.portee).toBe(2);
    expect(ENNEMIS.corbeau_noir.volant).toBe(true);
    expect(ENNEMIS.epouvantail.pouvoirs?.relevement).toMatchObject({ fois: 1, pv: 0.4 });
    expect(ENNEMIS.porteur_torche.pouvoirs?.brulure?.duree).toBe(3);
    expect(ENNEMIS.chasseur_sorcieres.armure).toBe(0.3);
    expect(ENNEMIS.chasseur_sorcieres.pouvoirs?.degatsHeros).toBe(2);
    expect(ENNEMIS.delateur.furtif).toBe(true);
    expect(ENNEMIS.noyeur.pouvoirs?.noyade?.delai).toBe(3);
    expect(ENNEMIS.pelerin_voile.resistance).toBe(0.6);
    expect(ENNEMIS.sangsue.pouvoirs).toMatchObject({ essaim: 6, drain: { degats: 1 } });
    expect(ENNEMIS.rat_peste.pouvoirs?.essaim).toBe(8);
    expect(ENNEMIS.rat_peste.coutVies).toBe(1);
    expect(ENNEMIS.pestifere.pouvoirs?.nuage?.duree).toBe(3);
    expect(ENNEMIS.medecin_peste.pouvoirs?.soin).toMatchObject({ quantite: 0.05, cadence: 4 });
  });

  it('les boss ont les paliers et cadences de la spec', () => {
    expect(ENNEMIS.la_faim.pouvoirs?.paliers?.map((p) => p.pv)).toEqual([0.75, 0.5, 0.25]);
    expect(ENNEMIS.la_faim.pouvoirs?.paliers?.[0]?.actions[0]).toMatchObject({ type: 'affamer', cadence: 0.3, duree: 5 });
    expect(ENNEMIS.juge_flammes.pouvoirs?.periodiques?.[0]).toMatchObject({ cadence: 12, actions: [{ type: 'desactiver_tour', duree: 4 }] });
    expect(ENNEMIS.juge_flammes.pouvoirs?.paliers?.[0]).toMatchObject({ pv: 0.5, actions: [{ type: 'invoquer', ennemi: 'porteur_torche', nombre: 3 }] });
    expect(ENNEMIS.dame_puits.pouvoirs?.paliers?.map((p) => p.pv)).toEqual([0.66, 0.33]);
    for (const palier of ENNEMIS.dame_puits.pouvoirs?.paliers ?? []) {
      expect(palier.actions).toEqual([
        { type: 'plonger', duree: 3, saut: 3 },
        { type: 'invoquer', ennemi: 'sangsue', nombre: 6, ecart: expect.any(Number) as number },
      ]);
    }
    expect(ENNEMIS.mere_rats.pouvoirs?.periodiques?.[0]).toMatchObject({ cadence: 6, actions: [{ type: 'invoquer', ennemi: 'rat_peste', nombre: 4 }] });
  });

  it('les paliers sont décroissants, entre 0 et 1, et les ennemis appelés existent', () => {
    for (const [id, def] of Object.entries(table)) {
      const pvs = (def.pouvoirs?.paliers ?? []).map((p) => p.pv);
      expect(pvs, id).toEqual([...pvs].sort((a, b) => b - a));
      for (const pv of pvs) {
        expect(pv, id).toBeGreaterThan(0);
        expect(pv, id).toBeLessThan(1);
      }
      for (const periodique of def.pouvoirs?.periodiques ?? []) expect(periodique.cadence, id).toBeGreaterThan(0);
      for (const action of actions(def)) {
        if (action.type === 'invoquer') {
          expect(Object.hasOwn(ENNEMIS, action.ennemi), `${id} appelle ${action.ennemi}`).toBe(true);
          expect(table[action.ennemi]?.boss, action.ennemi).toBe(false);
          expect(action.nombre).toBeGreaterThan(0);
        }
      }
    }
  });

  it('les pouvoirs ont des valeurs cohérentes', () => {
    for (const [id, def] of Object.entries(table)) {
      const p = def.pouvoirs;
      if (!p) continue;
      if (p.essaim !== undefined) expect(Number.isInteger(p.essaim) && p.essaim >= 2, id).toBe(true);
      if (p.relevement) {
        expect(p.relevement.fois, id).toBeGreaterThanOrEqual(1);
        expect(p.relevement.pv, id).toBeGreaterThan(0);
        expect(p.relevement.pv, id).toBeLessThanOrEqual(1);
      }
      if (p.soin) expect(p.soin.quantite, id).toBeGreaterThan(0);
      if (p.drain) expect(p.drain.soin, id).toBeLessThanOrEqual(1);
    }
  });

  it('seuls les boss sont des boss, et ils valent des vies et une prime bien supérieures', () => {
    const ordinaires = Object.values(table).filter((e) => !e.boss);
    const boss = Object.values(table).filter((e) => e.boss);
    const meilleure = Math.max(...ordinaires.map((e) => e.prime));
    for (const b of boss) {
      expect(b.prime).toBeGreaterThan(5 * meilleure);
      expect(b.coutVies).toBeGreaterThan(Math.max(...ordinaires.map((e) => e.coutVies)));
      expect(b.insensibleEtourdissement).toBe(true);
    }
  });

  it('la menace des ennemis ordinaires reste dans l’ordre de grandeur de la région 1', () => {
    const reference = menaceEnnemi(ENNEMIS.paysan_affame);
    for (const [id, def] of Object.entries(table)) {
      if (def.boss) continue;
      const menace = menaceEnnemi(def);
      expect(menace, id).toBeGreaterThan(reference / 4);
      expect(menace, id).toBeLessThan(reference * 5);
    }
  });

  it('les règles des élites sont celles de la spec', () => {
    expect(REGLES.elite).toEqual({ facteurPv: 1.4, facteurPrime: 1.5, viesEnPlus: 0 });
    expect(REGLES.heroique.vies).toBe(1);
    expect(REGLES.fer.facteurEffectifs).toBe(1);
    expect(REGLES.plafondBonus).toBe(0.1);
  });
});
