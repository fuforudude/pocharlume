// Défis Héroïque et Fer (jalon 3) : règles dans le moteur, validation de la config, rétrocompatibilité.
import { describe, expect, it } from 'vitest';
import { DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { REGLES } from '../data/regles';
import { ce, CONFIG, avancerSecondes, configDe, niveauEssai } from './aides.test-utils';
import { verifierConfig } from './config';
import type { Niveau, Vague } from './definitions';
import type { ConfigPartie } from './etat';
import { appliquerAction, creerPartie, deserialiser, rejouer, serialiser, step, validerAction } from './partie';

function groupe(ennemi: string, nombre: number, delai = 0, elite?: boolean) {
  return { ennemi, nombre, intervalle: 0.5, chemin: 0, delai, ...(elite === undefined ? {} : { elite }) };
}

const VAGUES: Vague[] = [
  { paquets: [groupe('paysan_affame', 4), groupe('mendiant', 2, 1)] },
  { paquets: [groupe('chien_errant', 3), groupe('paysan_affame', 7, 2)] },
  { paquets: [groupe('boucher_vaudrelle', 1)] },
];

function niveauFer(vagues: readonly Vague[] = VAGUES, familles: readonly [string, string] = ['caserne', 'tir'], aretes = 5000): Niveau {
  return { ...niveauEssai(vagues, aretes), defiFer: { familles } };
}

function config(surcharges: Partial<ConfigPartie>): ConfigPartie {
  return { ...CONFIG, ...surcharges };
}

describe('défi Héroïque', () => {
  it('1 vie, et tous les groupes (boss exceptés) en élite', () => {
    const etat = creerPartie(niveauEssai(VAGUES), config({ defi: 'heroique' }));
    expect(etat.vies).toBe(1);
    expect(etat.viesDepart).toBe(1);
    const groupes = etat.niveau.vagues.flatMap((v) => v.paquets);
    expect(groupes.filter((p) => !ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss).every((p) => p.elite === true)).toBe(true);
    expect(groupes.filter((p) => ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss).every((p) => p.elite !== true)).toBe(true);
  });

  it('les ennemis qui apparaissent sont des élites', () => {
    const etat = creerPartie(niveauEssai(VAGUES), config({ defi: 'heroique' }));
    appliquerAction(etat, { type: 'appelerVague' });
    avancerSecondes(etat, 1);
    expect(etat.ennemis.length).toBeGreaterThan(0);
    expect(etat.ennemis.every((e) => e.elite)).toBe(true);
  });

  it('une seule vie : la première fuite est la défaite', () => {
    const etat = creerPartie(niveauEssai([{ paquets: [groupe('mendiant', 1)] }]), config({ defi: 'heroique' }));
    appliquerAction(etat, { type: 'appelerVague' });
    avancerSecondes(etat, 60);
    expect(etat.statut).toBe('defaite');
  });

  it('ne modifie pas le niveau donné', () => {
    const niveau = niveauEssai(VAGUES);
    creerPartie(niveau, config({ defi: 'heroique' }));
    expect(niveau.vagues.flatMap((v) => v.paquets).some((p) => 'elite' in p)).toBe(false);
  });
});

describe('défi Fer : une seule vague', () => {
  it('fusionne toutes les vagues en une, effectifs multipliés (REGLES.fer) arrondis au-dessus, boss à 1', () => {
    const eff = (n: number): number => Math.ceil(n * REGLES.fer.facteurEffectifs - 1e-9);
    const etat = creerPartie(niveauFer(), config({ defi: 'fer' }));
    expect(etat.niveau.vagues).toHaveLength(1);
    const paquets = etat.niveau.vagues[0]?.paquets ?? [];
    expect(paquets.map((p) => [p.ennemi, p.nombre])).toEqual([
      ['paysan_affame', eff(4)],
      ['mendiant', eff(2)],
      ['chien_errant', eff(3)],
      ['paysan_affame', eff(7)],
      ['boucher_vaudrelle', 1],
    ]);
    // Les délais propres de chaque groupe sont gardés.
    expect(paquets.map((p) => p.delai)).toEqual([0, 1, 0, 2, 0]);
  });

  it('toute la vague apparaît d’un coup et la victoire vient quand tout est mort', () => {
    const etat = creerPartie(niveauFer([{ paquets: [groupe('mendiant', 2)] }, { paquets: [groupe('mendiant', 2)] }]), config({ defi: 'fer' }));
    expect(etat.vagues.prochaine).toBeGreaterThan(0);
    appliquerAction(etat, { type: 'appelerVague' });
    expect(etat.vagues.lancees).toBe(1);
    expect(etat.vagues.prochaine).toBe(-1);
    avancerSecondes(etat, 3);
    expect(etat.ennemis).toHaveLength(2 * Math.ceil(2 * REGLES.fer.facteurEffectifs - 1e-9));
  });

  it('seules les deux familles du niveau sont constructibles', () => {
    const etat = creerPartie(niveauFer(), config({ defi: 'fer' }));
    expect(validerAction(etat, { type: 'construire', ...ce(0), tour: 'caserne' })).toBeNull();
    expect(validerAction(etat, { type: 'construire', ...ce(0), tour: 'tir' })).toBeNull();
    expect(validerAction(etat, { type: 'construire', ...ce(0), tour: 'magie' })).toBe('famille_interdite');
    expect(validerAction(etat, { type: 'construire', ...ce(0), tour: 'artillerie' })).toBe('famille_interdite');
    expect(appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'magie' })).toEqual({ ok: false, raison: 'famille_interdite' });
    expect(etat.tours).toHaveLength(0);
  });

  it('la tour divine est permise si la famille de son dieu l’est', () => {
    // Charlie : caserne ; Plume : tir ; Pollen : artillerie.
    const peutConstruire = (dieu: string, familles: readonly [string, string]): boolean => {
      const etat = creerPartie(niveauFer(VAGUES, familles), configDe(dieu, { defi: 'fer' }));
      return validerAction(etat, { type: 'construire', ...ce(0), tour: 'divine' }) === null;
    };
    expect(peutConstruire('charlie', ['caserne', 'magie'])).toBe(true);
    expect(peutConstruire('charlie', ['tir', 'magie'])).toBe(false);
    expect(peutConstruire('plume', ['tir', 'artillerie'])).toBe(true);
    expect(peutConstruire('plume', ['caserne', 'magie'])).toBe(false);
    expect(peutConstruire('pollen', ['artillerie', 'caserne'])).toBe(true);
    expect(peutConstruire('pollen', ['tir', 'magie'])).toBe(false);
  });

  it('hors défi Fer, toutes les familles sont constructibles même sur un niveau qui a des familles imposées', () => {
    const etat = creerPartie(niveauFer(), CONFIG);
    expect(validerAction(etat, { type: 'construire', ...ce(0), tour: 'magie' })).toBeNull();
    expect(etat.niveau.vagues).toHaveLength(VAGUES.length);
  });

  it('refuse un niveau sans familles imposées, ou avec des familles invalides', () => {
    expect(() => creerPartie(niveauEssai(VAGUES), config({ defi: 'fer' }))).toThrow('Fer');
    expect(() => creerPartie(niveauFer(VAGUES, ['caserne', 'caserne']), config({ defi: 'fer' }))).toThrow('famille');
    expect(() => creerPartie(niveauFer(VAGUES, ['caserne', 'dragon']), config({ defi: 'fer' }))).toThrow('dragon');
  });
});

describe('les défis se jouent avec les règles de Matou', () => {
  it.each(['chaton', 'vieux_sage'])('config en %s : vies, PV, primes et arêtes de Matou', (difficulte) => {
    for (const defi of ['heroique', 'fer'] as const) {
      const niveau = defi === 'fer' ? niveauFer([{ paquets: [groupe('paysan_affame', 1)] }], ['caserne', 'tir'], 1000) : niveauEssai([{ paquets: [groupe('paysan_affame', 1)] }], 1000);
      const etat = creerPartie(niveau, config({ defi, difficulte }));
      const facteurAretes = defi === 'fer' ? REGLES.fer.facteurAretes : REGLES.heroique.facteurAretes;
      expect(etat.aretes).toBe(Math.round((1000 * Math.round(DIFFICULTES.matou.aretesDepart * facteurAretes * 100)) / 100));
      if (defi === 'fer') expect(etat.vies).toBe(DIFFICULTES.matou.vies);
      appliquerAction(etat, { type: 'appelerVague' });
      step(etat);
      const e = etat.ennemis[0];
      const facteurElite = defi === 'heroique' ? REGLES.elite.facteurPv : 1;
      expect(e?.pvMax).toBeCloseTo(ENNEMIS.paysan_affame.pv * DIFFICULTES.matou.pvEnnemis * facteurElite, 6);
    }
  });

  it('sans défi, la difficulté de la config s’applique', () => {
    const etat = creerPartie(niveauEssai(), config({ difficulte: 'vieux_sage' }));
    expect(etat.vies).toBe(DIFFICULTES.vieux_sage.vies);
  });
});

describe('validation de la config : défi', () => {
  const refus = (surcharges: Record<string, unknown>): string | null => verifierConfig({ ...CONFIG, ...surcharges });

  it('accepte l’absence de défi, null, heroique et fer', () => {
    expect(verifierConfig(CONFIG)).toBeNull();
    for (const defi of [null, 'heroique', 'fer']) expect(refus({ defi }), String(defi)).toBeNull();
  });

  it('refuse un défi inconnu', () => {
    for (const defi of ['facile', '', 'Fer', 3, true, {}, []]) expect(refus({ defi }), JSON.stringify(defi)).not.toBeNull();
  });

  it('refuse un défi avec des objets, accepte un défi sans objet', () => {
    expect(refus({ defi: 'heroique', objets: ['sablier'] })).toContain('objet');
    expect(refus({ defi: 'fer', objets: ['fiole_soufre', 'sablier'] })).toContain('objet');
    expect(refus({ defi: 'fer', objets: [] })).toBeNull();
    expect(refus({ defi: null, objets: ['sablier'] })).toBeNull();
  });

  it('creerPartie lève la raison du refus', () => {
    expect(() => creerPartie(niveauFer(), config({ defi: 'fer', objets: ['sablier'] }))).toThrow('objet');
  });
});

describe('rétrocompatibilité : une config sans defi ni bonus', () => {
  it('est valide, se lit comme sans défi et sans bonus, et reste rangée telle quelle dans l’état', () => {
    const ancienne = { ...CONFIG };
    expect('defi' in ancienne).toBe(false);
    expect('bonus' in ancienne).toBe(false);
    expect(verifierConfig(ancienne)).toBeNull();
    const etat = creerPartie(niveauEssai(), ancienne);
    expect(etat.config).toEqual(CONFIG);
    expect(Object.hasOwn(etat.config, 'defi')).toBe(false);
    expect(Object.hasOwn(etat.config, 'bonus')).toBe(false);
  });

  it('defi null et bonus vide, donnés explicitement, ne changent pas non plus la config rangée', () => {
    const etat = creerPartie(niveauEssai(), config({ defi: null, bonus: { tours: {}, heros: {} } }));
    expect(etat.config).toEqual(CONFIG);
  });

  it('un défi et un bonus donnés sont rangés dans l’état', () => {
    const bonus = { tours: { tir: { degats: 0.05 } }, heros: {} };
    const etat = creerPartie(niveauFer(), config({ defi: 'fer', bonus }));
    expect(etat.config.defi).toBe('fer');
    expect(etat.config.bonus).toEqual(bonus);
  });

  it('se rejoue comme avant : mêmes parties avec defi null et bonus vide', () => {
    const journalDe = (c: ConfigPartie): string => {
      const etat = creerPartie(niveauEssai(VAGUES), c);
      appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'caserne' });
      appliquerAction(etat, { type: 'appelerVague' });
      avancerSecondes(etat, 20);
      return JSON.stringify([etat.ennemis, etat.unites, etat.aretes, etat.vies, etat.rng]);
    };
    expect(journalDe(config({ defi: null, bonus: { tours: {}, heros: {} } }))).toBe(journalDe(CONFIG));
  });
});

describe('rejeu et sérialisation des défis', () => {
  it.each(['heroique', 'fer'] as const)('un défi %s se rejoue à l’identique', (defi) => {
    const c = config({ defi, bonus: { tours: { caserne: { pvSoldats: 0.05 } }, heros: { pv: 0.05 } } });
    const niveau = niveauFer([{ paquets: [groupe('paysan_affame', 4), groupe('mendiant', 3, 1)] }], ['caserne', 'tir']);
    const etat = creerPartie(niveau, c);
    appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'caserne' });
    appliquerAction(etat, { type: 'appelerVague' });
    avancerSecondes(etat, 10);
    expect(etat.statut).toBe('en_cours');
    const rejoue = rejouer(niveau, c, etat.journal, etat.pas);
    expect(serialiser(rejoue)).toBe(serialiser(etat));
    expect(serialiser(deserialiser(serialiser(etat)))).toBe(serialiser(etat));
  });
});
