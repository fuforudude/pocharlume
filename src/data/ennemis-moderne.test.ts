// Les ennemis du DLC « Temps modernes » en données (docs/specs/2026-11-12-dlc-temps-modernes-campagne.md, tâche 2) : chacun reprend le
// pouvoir de l'ennemi d'origine noté dans sa source (art/dlc-moderne/ennemis/*.txt, vérifié par tools/dlc/branchement.test.ts), avec
// des valeurs de l'après-histoire ; trois mécaniques nouvelles ; deux boss hors de tout plan de vagues.
import { describe, expect, it } from 'vitest';
import type { ActionEnnemi, DefEnnemi } from '../engine/definitions';
import { fr } from '../i18n/fr';
import { ENNEMIS } from './ennemis';
import { menaceEnnemi } from './equilibrage';
import { CAMPAGNE } from './niveaux/campagne';

const table: Readonly<Record<string, DefEnnemi>> = ENNEMIS;

/** Les 15 ennemis du DLC et l'ennemi du jeu dont chacun reprend le rôle (champ `original` de sa source). */
const ORIGINAUX_MODERNES: Readonly<Record<string, string>> = {
  moderne_gendarme: 'paysan_affame',
  moderne_crs: 'fantassin',
  moderne_gendarme_mobile: 'chasseur_sorcieres',
  moderne_bouclier_anti_emeute: 'porte_herse',
  moderne_tireur_lbd: 'fagotier',
  moderne_grenadier_lacrymo: 'pestifere',
  moderne_bac: 'delateur',
  moderne_commissaire: 'porte_banniere',
  moderne_bravm: 'chevalier',
  moderne_cavalier_monte: 'cavalier',
  moderne_drone: 'corbeau_noir',
  moderne_helicoptere: 'ange_cendre',
  moderne_canon_a_eau: 'gargouille',
  moderne_centaure: 'garde_royal',
  moderne_prefet: 'roi_fou',
};

const BOSS_MODERNES = ['moderne_commissaire_boss', 'moderne_centaure_boss', 'moderne_prefet'] as const;

function def(id: string): DefEnnemi {
  const d = table[id];
  if (!d) throw new Error(`ennemi inconnu ${id}`);
  return d;
}

function actions(d: DefEnnemi): ActionEnnemi[] {
  return [...(d.pouvoirs?.paliers ?? []).flatMap((p) => p.actions), ...(d.pouvoirs?.periodiques ?? []).flatMap((p) => p.actions)];
}

describe('les 15 ennemis du DLC reprennent leur original', () => {
  it('tous existent, avec un nom traduit et une phrase de lore', () => {
    for (const id of [...Object.keys(ORIGINAUX_MODERNES), ...BOSS_MODERNES]) {
      const d = def(id);
      expect(d.nom, id).toBe(`ennemi.${id}`);
      expect(Object.hasOwn(fr, d.nom), id).toBe(true);
      expect(Object.hasOwn(fr, `ennemi.${id}.desc`), id).toBe(true);
    }
    expect(Object.keys(table).filter((id) => id.startsWith('moderne_'))).toHaveLength(17);
  });

  it('chacun garde le rôle de l’original : volant, furtif, boss, protections et chaque pouvoir', () => {
    for (const [id, original] of Object.entries(ORIGINAUX_MODERNES)) {
      const d = def(id);
      const o = def(original);
      expect([d.volant, d.furtif, d.boss, d.insensibleEtourdissement], id).toEqual([o.volant, o.furtif, o.boss, o.insensibleEtourdissement]);
      expect([d.armure, d.resistance], id).toEqual([o.armure, o.resistance]);
      expect(d.vitesse, id).toBe(o.vitesse);
      expect(Object.keys(d.pouvoirs ?? {}), id).toEqual(expect.arrayContaining(Object.keys(o.pouvoirs ?? {}).filter((k) => k !== 'periodiques' || id !== 'moderne_tireur_lbd')));
    }
  });

  it('des valeurs de l’après-histoire : au moins les PV et la prime de l’original', () => {
    for (const [id, original] of Object.entries(ORIGINAUX_MODERNES)) {
      expect(def(id).pv, id).toBeGreaterThanOrEqual(def(original).pv);
      expect(def(id).prime, id).toBeGreaterThanOrEqual(def(original).prime);
    }
  });

  it('la menace de chacun reste entre 1 et 3 fois celle de son original (le binôme compte double)', () => {
    for (const [id, original] of Object.entries(ORIGINAUX_MODERNES)) {
      const rapport = menaceEnnemi(def(id)) / menaceEnnemi(def(original));
      expect(rapport, id).toBeGreaterThanOrEqual(1);
      expect(rapport, id).toBeLessThanOrEqual(3);
    }
  });

  it('une BRAV-M pèse deux fois son équivalent seul : le binôme double la menace', () => {
    const bravm = def('moderne_bravm');
    const pouvoirs = { ...bravm.pouvoirs } as { binome?: unknown };
    delete pouvoirs.binome;
    const seule = { ...bravm, pouvoirs } as DefEnnemi;
    expect(menaceEnnemi(bravm)).toBeCloseTo(2 * menaceEnnemi(seule));
  });

  it('les boss pèsent bien plus que n’importe quel ennemi ordinaire du DLC', () => {
    const ordinaires = Object.keys(ORIGINAUX_MODERNES).filter((id) => !def(id).boss).map((id) => menaceEnnemi(def(id)));
    for (const id of BOSS_MODERNES) expect(menaceEnnemi(def(id)), id).toBeGreaterThan(10 * Math.max(...ordinaires));
  });

  it('les trois mécaniques nouvelles sont portées par le canon à eau, le tireur de LBD et la BRAV-M', () => {
    expect(actions(def('moderne_canon_a_eau')).some((a) => a.type === 'repousser')).toBe(true);
    // Le tireur de LBD est le Fagotier « à distance et par projectile » : son tir remplace la mise à feu au contact.
    expect(actions(def('moderne_tireur_lbd')).map((a) => a.type)).toEqual(['tirer_tour']);
    expect(def('moderne_bravm').pouvoirs?.binome).toBeDefined();
  });
});

describe('boss du DLC', () => {
  it('le commissaire et le Centaure ont une version boss, plus le préfet ; tous valent bien plus qu’un ordinaire du DLC', () => {
    const ordinaires = Object.keys(ORIGINAUX_MODERNES).filter((id) => !def(id).boss).map(def);
    const prime = Math.max(...ordinaires.map((d) => d.prime));
    for (const id of BOSS_MODERNES) {
      const d = def(id);
      expect(d.boss, id).toBe(true);
      expect(d.insensibleEtourdissement, id).toBe(true);
      expect(d.prime, id).toBeGreaterThan(5 * prime);
      expect(d.coutVies, id).toBeGreaterThan(1);
      expect(d.pouvoirs?.paliers?.length ?? 0, id).toBeGreaterThan(0);
    }
    expect(def('moderne_commissaire_boss').pv).toBeGreaterThan(def('moderne_commissaire').pv * 20);
    expect(def('moderne_centaure_boss').pv).toBeGreaterThan(def('moderne_centaure').pv * 20);
  });

  it('leurs capacités réutilisent les actions existantes et appellent des ennemis du DLC', () => {
    const nouvelles = new Set(['repousser', 'tirer_tour']);
    for (const id of BOSS_MODERNES) {
      for (const a of actions(def(id))) {
        expect(nouvelles.has(a.type), `${id} : ${a.type}`).toBe(false);
        if (a.type === 'invoquer') expect(a.ennemi.startsWith('moderne_'), `${id} appelle ${a.ennemi}`).toBe(true);
      }
    }
  });

  it('aucun ennemi du DLC n’est dans un plan de vagues (l’agent du contenu les placera)', () => {
    const places = new Set(CAMPAGNE.flatMap((n) => n.niveau.vagues.flatMap((v) => v.paquets.map((p) => p.ennemi))));
    for (const id of Object.keys(table).filter((x) => x.startsWith('moderne_'))) expect(places.has(id), id).toBe(false);
  });
});
