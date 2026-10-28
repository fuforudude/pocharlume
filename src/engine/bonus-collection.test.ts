// Bonus de collection dans ConfigPartie (jalon 3) : validation, application aux tours et au héros, ignorés en Fer.
import { describe, expect, it } from 'vitest';
import { HEROS } from '../data/heros';
import { REGLES } from '../data/regles';
import { TOURS } from '../data/tours';
import { CONFIG, configDe, construireTour, heros, niveauEssai, tourDe } from './aides.test-utils';
import { verifierConfig } from './config';
import type { Niveau } from './definitions';
import type { BonusCollection, ConfigPartie, EtatPartie } from './etat';
import { creerPartie } from './partie';

const VIDE: BonusCollection = { tours: {}, heros: {} };

function partie(bonus: BonusCollection, surcharges: Partial<ConfigPartie> = {}, niveau: Niveau = niveauEssai()): EtatPartie {
  return creerPartie(niveau, { ...CONFIG, bonus, ...surcharges });
}

function tour(etat: EtatPartie, i: number) {
  const t = tourDe(etat, i);
  if (!t) throw new Error('pas de tour');
  return t;
}

describe('validation du bonus', () => {
  const refus = (bonus: unknown): string | null => verifierConfig({ ...CONFIG, bonus });

  it('accepte l’absence de bonus, un bonus vide et des bonus raisonnables', () => {
    expect(verifierConfig(CONFIG)).toBeNull();
    expect(refus(VIDE)).toBeNull();
    expect(refus({ tours: { tir: { degats: 0.05, cadence: 0.05 }, caserne: { pvSoldats: 0.1 } }, heros: { pv: 0.04, degats: 0.03, cadence: 0.02, regeneration: 0.01 } })).toBeNull();
    expect(refus({ tours: {}, heros: { pv: 0.1 } })).toBeNull();
  });

  it('accepte exactement +10 % par tour ou pour le héros, même avec les erreurs d’arrondi des flottants', () => {
    expect(refus({ tours: { tir: { degats: 0.05, cadence: 0.05 } }, heros: {} })).toBeNull();
    expect(refus({ tours: { magie: { degats: 0.01, cadence: 0.02, portee: 0.03, pvSoldats: 0.04 } }, heros: {} })).toBeNull();
    expect(refus({ tours: {}, heros: { pv: 0.01, degats: 0.02, cadence: 0.03, regeneration: 0.04 } })).toBeNull();
    expect(refus({ tours: {}, heros: { pv: 0.1 * 1.25 * 0.8 } })).toBeNull();
  });

  it('refuse un total au-dessus de +10 % pour une tour', () => {
    expect(refus({ tours: { tir: { degats: 0.06, cadence: 0.05 } }, heros: {} })).toContain('tir');
    expect(refus({ tours: { caserne: { pvSoldats: 0.101 } }, heros: {} })).not.toBeNull();
    expect(refus({ tours: { artillerie: { degats: 0.05, cadence: 0.03, portee: 0.03 } }, heros: {} })).not.toBeNull();
  });

  it('refuse un total au-dessus de +10 % pour le héros', () => {
    expect(refus({ tours: {}, heros: { pv: 0.06, degats: 0.05 } })).toContain('héros');
    expect(refus({ tours: {}, heros: { regeneration: 0.2 } })).not.toBeNull();
  });

  it('le plafond est celui des règles', () => {
    expect(REGLES.plafondBonus).toBe(0.1);
  });

  it('refuse ce qui n’a pas la forme attendue', () => {
    for (const mauvais of [null, 3, 'x', [], { tours: [] }, { tours: {}, heros: [] }, { tours: { dragon: { degats: 0.01 } }, heros: {} }, { tours: { tir: { magie: 0.01 } }, heros: {} }, { tours: {}, heros: { mana: 0.01 } }, { tours: {}, heros: {}, secret: 1 }]) {
      expect(refus(mauvais), JSON.stringify(mauvais)).not.toBeNull();
    }
    for (const valeur of [-0.01, Number.NaN, Infinity, '0.05', null, true]) {
      expect(refus({ tours: { tir: { degats: valeur } }, heros: {} }), String(valeur)).not.toBeNull();
      expect(refus({ tours: {}, heros: { pv: valeur } }), String(valeur)).not.toBeNull();
    }
  });

  it('refuse des noms de la chaîne de prototypes', () => {
    expect(refus({ tours: { constructor: { degats: 0.01 } }, heros: {} })).not.toBeNull();
    expect(refus({ tours: { tir: { toString: 0.01 } }, heros: {} })).not.toBeNull();
    expect(refus(JSON.parse('{"tours": {"__proto__": {"degats": 0.01}}, "heros": {}}'))).not.toBeNull();
  });
});

describe('bonus d’une famille de tours', () => {
  it('dégâts : la tour de base et sa spécialisation les reçoivent, pas les autres familles', () => {
    const etat = partie({ tours: { tir: { degats: 0.1 } }, heros: {} });
    construireTour(etat, 0, 'tir');
    construireTour(etat, 1, 'tir', 'B');
    construireTour(etat, 2, 'magie');
    const base = tour(etat, 0).stats;
    const spe = tour(etat, 1).stats;
    expect(base.degats[0]).toBeCloseTo(TOURS.tir.niveaux[0].degats[0] * 1.1, 6);
    expect(base.degats[1]).toBeCloseTo(TOURS.tir.niveaux[0].degats[1] * 1.1, 6);
    expect(spe.degats[0]).toBeCloseTo(TOURS.tir.specialisations.B.degats[0] * 1.1, 6);
    expect(tour(etat, 2).stats.degats).toEqual(TOURS.magie.niveaux[0].degats);
  });

  it('cadence : un tir plus rapide ; portée : un tir plus loin', () => {
    const etat = partie({ tours: { tir: { cadence: 0.05, portee: 0.04 } }, heros: {} });
    construireTour(etat, 0, 'tir');
    const s = tour(etat, 0).stats;
    expect(s.cadence).toBeCloseTo(TOURS.tir.niveaux[0].cadence / 1.05, 6);
    expect(s.portee).toBeCloseTo(TOURS.tir.niveaux[0].portee * 1.04, 6);
  });

  it('suit la tour quand elle monte de niveau et se spécialise', () => {
    const etat = partie({ tours: { artillerie: { degats: 0.08 } }, heros: {} });
    construireTour(etat, 0, 'artillerie', 'A');
    expect(tour(etat, 0).stats.degats[0]).toBeCloseTo(TOURS.artillerie.specialisations.A.degats[0] * 1.08, 6);
    expect(tour(etat, 0).stats.zone).toBe(TOURS.artillerie.specialisations.A.zone);
  });

  it('caserne : PV, dégâts et cadence des soldats', () => {
    // Plume n'a pas de bonus de caserne (celui de Charlie s'ajouterait).
    const etat = creerPartie(niveauEssai(), { ...configDe('plume'), bonus: { tours: { caserne: { pvSoldats: 0.06, degats: 0.02, cadence: 0.02 } }, heros: {} } });
    construireTour(etat, 0, 'caserne');
    const soldats = tour(etat, 0).stats.soldats;
    const base = TOURS.caserne.niveaux[0].soldats;
    expect(soldats?.pv).toBeCloseTo((base?.pv ?? 0) * 1.06, 6);
    expect(soldats?.degats[0]).toBeCloseTo((base?.degats[0] ?? 0) * 1.02, 6);
    expect(soldats?.cadence).toBeCloseTo((base?.cadence ?? 0) / 1.02, 6);
    // Les soldats déjà là prennent les nouvelles stats.
    expect(etat.unites.filter((u) => u.genre === 'soldat').every((u) => u.pv === soldats?.pv)).toBe(true);
  });

  it('s’ajoute au bonus du dieu', () => {
    const etat = creerPartie(niveauEssai(), { ...configDe('plume'), bonus: { tours: { tir: { cadence: 0.1 } }, heros: {} } });
    construireTour(etat, 0, 'tir');
    expect(tour(etat, 0).stats.cadence).toBeCloseTo(TOURS.tir.niveaux[0].cadence / 1.6 / 1.1, 6);
  });

  it('ne touche pas la tour divine', () => {
    const tout = { degats: 0.025, cadence: 0.025, portee: 0.025, pvSoldats: 0.025 };
    const avec = creerPartie(niveauEssai(), { ...CONFIG, bonus: { tours: { caserne: tout, tir: tout, magie: tout, artillerie: tout }, heros: {} } });
    const sans = creerPartie(niveauEssai(), CONFIG);
    construireTour(avec, 0, 'divine');
    construireTour(sans, 0, 'divine');
    expect(tour(avec, 0).stats).toEqual(tour(sans, 0).stats);
  });

  it('un bonus vide ne change rien du tout', () => {
    const avec = partie(VIDE);
    const sans = creerPartie(niveauEssai(), CONFIG);
    for (const etat of [avec, sans]) {
      construireTour(etat, 0, 'caserne', 'A');
      construireTour(etat, 1, 'tir', 'A');
    }
    expect(avec.tours.map((t) => t.stats)).toEqual(sans.tours.map((t) => t.stats));
  });
});

describe('bonus du héros', () => {
  it('PV, dégâts, cadence et régénération', () => {
    const etat = partie({ tours: {}, heros: { pv: 0.04, degats: 0.03, cadence: 0.02, regeneration: 0.01 } });
    const h = heros(etat).stats;
    const base = HEROS.charlie;
    expect(h.pv).toBe(Math.round(base.pv * 1.04));
    expect(h.degats[0]).toBeCloseTo(base.degats[0] * 1.03, 6);
    expect(h.degats[1]).toBeCloseTo(base.degats[1] * 1.03, 6);
    expect(h.cadence).toBeCloseTo(base.cadence / 1.02, 6);
    expect(h.capacites?.regeneration).toBeCloseTo(0.01 * REGLES.regenerationBonusHeros, 6);
    expect(heros(etat).pv).toBe(h.pv);
  });

  it('une héroïne qui tire reçoit aussi les dégâts et la cadence sur son tir', () => {
    const etat = creerPartie(niveauEssai(), { ...configDe('pollen'), bonus: { tours: {}, heros: { degats: 0.1 } } });
    const sans = creerPartie(niveauEssai(), configDe('pollen'));
    const tir = heros(etat).stats.capacites?.distance;
    const tirSans = heros(sans).stats.capacites?.distance;
    expect(tirSans).toBeDefined();
    expect(tir?.degats[0]).toBeCloseTo((tirSans?.degats[0] ?? 0) * 1.1, 6);
  });

  it('un bonus vide ne change rien', () => {
    expect(heros(partie(VIDE)).stats).toEqual(heros(creerPartie(niveauEssai(), CONFIG)).stats);
  });
});

describe('défis et bonus', () => {
  const niveauFer: Niveau = { ...niveauEssai(), defiFer: { familles: ['caserne', 'tir'] } };
  const bonus: BonusCollection = { tours: { tir: { degats: 0.1 }, caserne: { pvSoldats: 0.1 } }, heros: { pv: 0.1 } };

  it('en Fer, le bonus est ignoré : mêmes stats qu’avec un bonus vide', () => {
    const avec = partie(bonus, { defi: 'fer' }, niveauFer);
    const sans = partie(VIDE, { defi: 'fer' }, niveauFer);
    for (const etat of [avec, sans]) {
      construireTour(etat, 0, 'tir');
      construireTour(etat, 1, 'caserne');
    }
    expect(avec.tours.map((t) => t.stats)).toEqual(sans.tours.map((t) => t.stats));
    expect(heros(avec).stats).toEqual(heros(sans).stats);
  });

  it('en Héroïque, le bonus s’applique', () => {
    const etat = partie(bonus, { defi: 'heroique' });
    construireTour(etat, 0, 'tir');
    expect(tour(etat, 0).stats.degats[0]).toBeCloseTo(TOURS.tir.niveaux[0].degats[0] * 1.1, 6);
    expect(heros(etat).stats.pv).toBe(Math.round(HEROS.charlie.pv * 1.1));
  });

  it('la config rangée est une copie : la modifier ensuite ne change pas la partie', () => {
    const config: ConfigPartie = { ...CONFIG, bonus: { tours: { tir: { degats: 0.05 } }, heros: { pv: 0.05 } } };
    const etat = creerPartie(niveauEssai(), config);
    if (config.bonus?.tours.tir) config.bonus.tours.tir.degats = 0.1;
    if (config.bonus) config.bonus.heros.pv = 0.1;
    expect(etat.config.bonus).toEqual({ tours: { tir: { degats: 0.05 } }, heros: { pv: 0.05 } });
  });
});
