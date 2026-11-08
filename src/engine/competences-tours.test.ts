// Compétences des spécialisations : 16 compétences de 3 rangs achetées en partie avec des arêtes.
import { describe, expect, it } from 'vitest';
import { COMPETENCES_TOURS } from '../data/competences-tours';
import { DIEUX } from '../data/dieux';
import { TOURS } from '../data/tours';
import { ce, CONFIG, avancerSecondes, compter, configDe, construireTour, ennemiFixe, evenementsPendant, partieEssai } from './aides.test-utils';
import type { DefNiveauTour, IdFamille, Voie } from './definitions';
import type { EtatPartie } from './etat';
import { appliquerAction, coutCompetence, validerAction } from './partie';
import { blesserUnite } from './unites';

type Verif = (avant: DefNiveauTour, apres: DefNiveauTour, rang: 1 | 2 | 3) => void;

const nombre = (a: readonly number[], rang: number): number => a[rang - 1] ?? Number.NaN;

const effet = (def: DefNiveauTour, type: string, dansSoldats = false) => (dansSoldats ? def.soldats?.effets : def.effets)?.find((e) => e.type === type);

/** Pour chaque compétence : l'effet principal visible dans les stats de la tour à chaque rang. */
const CAS: readonly (readonly [IdFamille, Voie, string, Verif])[] = [
  ['caserne', 'A', 'benediction', (_, b, r) => { expect(b.soldats?.capacites?.regeneration).toBeCloseTo(nombre([1, 2.5, 4], r), 5); }],
  ['caserne', 'A', 'mur', (a, b, r) => { expect((b.soldats?.pv ?? 0) / (a.soldats?.pv ?? 1)).toBeCloseTo((1.25 + nombre([0.15, 0.3, 0.5], r)) / 1.25, 5); }],
  ['caserne', 'B', 'entailles_profondes', (a, b, r) => {
    expect(effet(b, 'saignement', true)?.valeur).toBe(nombre([4, 6, 8], r));
    expect(effet(b, 'saignement', true)?.valeur).toBeGreaterThan(effet(a, 'saignement', true)?.valeur ?? 0);
  }],
  ['caserne', 'B', 'frenesie', (a, b, r) => { expect((a.soldats?.cadence ?? 0) / (b.soldats?.cadence ?? 1)).toBeCloseTo(1 + nombre([0.1, 0.2, 0.35], r), 5); }],
  ['tir', 'A', 'venin_noir', (_, b, r) => { expect(effet(b, 'poison')?.valeur).toBe(nombre([8, 11, 15], r)); }],
  ['tir', 'A', 'oeil_de_lynx', (a, b, r) => { expect(b.portee - a.portee).toBeCloseTo(nombre([0.4, 0.8, 1.2], r), 5); }],
  ['tir', 'B', 'tir_a_la_tete', (a, b, r) => { expect((b.critique?.chance ?? 0) - (a.critique?.chance ?? 0)).toBeCloseTo(nombre([0.1, 0.2, 0.3], r), 5); }],
  ['tir', 'B', 'carreau_perforant', (_, b, r) => { expect(b.ignoreArmure).toBeCloseTo(nombre([0.25, 0.5, 0.75], r), 5); }],
  ['magie', 'A', 'rayon_concentre', (a, b, r) => { expect(b.degats[1] / a.degats[1]).toBeCloseTo(1 + nombre([0.15, 0.3, 0.5], r), 5); }],
  ['magie', 'A', 'braise_tenace', (_, b, r) => { expect(effet(b, 'brulure')?.valeur).toBe(nombre([5, 8, 12], r)); }],
  ['magie', 'B', 'legion', (a, b, r) => { expect((b.spectres?.max ?? 0) - (a.spectres?.max ?? 0)).toBe(r); }],
  ['magie', 'B', 'os_durcis', (a, b, r) => { expect((b.spectres?.pv ?? 0) / (a.spectres?.pv ?? 1)).toBeCloseTo(1 + nombre([0.25, 0.5, 0.8], r), 5); }],
  ['artillerie', 'A', 'nappe_de_soufre', (a, b, r) => {
    expect(a.nappe).toBeNull();
    expect(b.nappe?.rayon).toBe(nombre([1, 1.2, 1.4], r));
    expect(b.nappe?.duree).toBe(nombre([3, 5, 7], r));
  }],
  ['artillerie', 'A', 'charge_lourde', (a, b, r) => {
    expect(b.degats[1] / a.degats[1]).toBeCloseTo(1 + nombre([0.15, 0.3, 0.5], r), 5);
    expect(b.zone - a.zone).toBeCloseTo(nombre([0, 0.1, 0.2], r), 5);
  }],
  ['artillerie', 'B', 'chaines_longues', (a, b, r) => { expect((b.chaine?.nombre ?? 0) - (a.chaine?.nombre ?? 0)).toBe(r); }],
  ['artillerie', 'B', 'entraves', (_, b, r) => {
    expect(effet(b, 'ralentissement')?.valeur).toBe(nombre([0.4, 0.3, 0.2], r));
    expect(effet(b, 'ralentissement')?.duree).toBe(nombre([2.5, 3, 3.5], r));
  }],
];

function tourSpecialisee(famille: IdFamille, voie: Voie, config = CONFIG): EtatPartie {
  const etat = partieEssai(config, 20000);
  construireTour(etat, 0, famille, voie);
  return etat;
}

describe('compétences des spécialisations (16)', () => {
  it('couvre exactement les 16 compétences des données', () => {
    const ids = Object.values(COMPETENCES_TOURS).flatMap((l) => l.map((c) => c.id));
    expect(CAS.map(([, , id]) => id).sort()).toEqual([...ids].sort());
  });

  it.each(CAS)('%s %s : %s, rang par rang', (famille, voie, id, verifier) => {
    const etat = tourSpecialisee(famille, voie);
    const tour = etat.tours[0];
    if (!tour) throw new Error('pas de tour');
    const defs = TOURS[famille].specialisations[voie].competences;
    const competence = defs.find((c) => c.id === id);
    if (!competence) throw new Error(`compétence ${id} absente`);
    const indice = defs.indexOf(competence);
    const avant = tour.stats;
    expect(tour.rangs).toEqual([0, 0]);
    for (const rang of [1, 2, 3] as const) {
      const aretes = etat.aretes;
      const cumul = tour.coutCumule;
      const cout = competence.cout[rang - 1] ?? Number.NaN;
      expect(coutCompetence(etat, ce(0), id)).toBe(cout);
      expect(appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: id })).toEqual({ ok: true });
      expect(etat.aretes).toBe(aretes - cout);
      expect(tour.coutCumule).toBe(cumul + cout);
      expect(tour.rangs[indice]).toBe(rang);
      expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'competence_tour', tour: tour.id, ...ce(0), place: -1, competence: id, rang }));
      verifier(avant, tour.stats, rang);
    }
    expect(tour.rangs[1 - indice]).toBe(0);
    expect(appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: id })).toEqual({ ok: false, raison: 'competence_au_maximum' });
    expect(coutCompetence(etat, ce(0), id)).toBeUndefined();
  });

  it('les deux compétences d’une tour s’ajoutent', () => {
    const etat = tourSpecialisee('artillerie', 'A');
    for (const id of ['charge_lourde', 'nappe_de_soufre']) appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: id });
    const stats = etat.tours[0]?.stats;
    expect(stats?.nappe?.rayon).toBe(1);
    expect(stats?.degats[1]).toBeCloseTo(TOURS.artillerie.specialisations.A.degats[1] * 1.15, 5);
  });
});

describe('achat d’une compétence : refus', () => {
  it('exige une tour, une spécialisation, une compétence connue et assez d’arêtes', () => {
    const etat = partieEssai(CONFIG, 20000);
    const acheter = { type: 'ameliorerCompetence', ...ce(0), competence: 'mur' } as const;
    expect(appliquerAction(etat, acheter)).toEqual({ ok: false, raison: 'case_vide' });
    construireTour(etat, 0, 'caserne');
    expect(appliquerAction(etat, acheter)).toEqual({ ok: false, raison: 'specialisation_requise' });
    appliquerAction(etat, { type: 'ameliorer', ...ce(0) });
    appliquerAction(etat, { type: 'ameliorer', ...ce(0) });
    appliquerAction(etat, { type: 'specialiser', ...ce(0), voie: 'A' });
    expect(appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: 'frenesie' })).toEqual({ ok: false, raison: 'competence_inconnue' });
    for (const nom of ['', 'constructor', '__proto__', 'toString']) {
      expect(appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: nom }), nom).toEqual({ ok: false, raison: 'competence_inconnue' });
    }
    etat.aretes = 10;
    expect(appliquerAction(etat, acheter)).toEqual({ ok: false, raison: 'aretes_insuffisantes' });
    expect(etat.tours[0]?.rangs).toEqual([0, 0]);
    expect(validerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: 3 } as never)).toBe('action_invalide');
    expect(validerAction(etat, { type: 'ameliorerCompetence', cx: 0.5, cy: 0, competence: 'mur' } as never)).toBe('action_invalide');
  });

  it('un niveau inférieur à la spécialisation n’a pas de compétence à acheter', () => {
    const etat = partieEssai(CONFIG, 20000);
    construireTour(etat, 0, 'tir');
    expect(appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: 'tir_a_la_tete' })).toEqual({ ok: false, raison: 'specialisation_requise' });
  });

  it('la remise de Pollen sur l’artillerie vaut aussi pour les compétences', () => {
    const etat = tourSpecialisee('artillerie', 'A', configDe('pollen'));
    const prix = TOURS.artillerie.specialisations.A.competences[1]?.cout[0] ?? 0;
    expect(coutCompetence(etat, ce(0), 'charge_lourde')).toBe(Math.round(prix * (1 + DIEUX.pollen.bonus.prix)));
  });

  it('le prix des compétences entre dans la valeur de revente', () => {
    const etat = tourSpecialisee('caserne', 'A');
    const avant = etat.tours[0]?.coutCumule ?? 0;
    appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: 'mur' });
    expect(etat.tours[0]?.coutCumule).toBe(avant + COMPETENCES_TOURS.caserneA[1].cout[0]);
  });
});

describe('compétences en jeu', () => {
  it('Nappe de soufre : l’impact laisse une zone qui brûle les ennemis qui y restent', () => {
    const avec = tourSpecialisee('artillerie', 'A');
    appliquerAction(avec, { type: 'ameliorerCompetence', ...ce(0), competence: 'nappe_de_soufre' });
    const e = ennemiFixe(avec, 7);
    const vus = evenementsPendant(avec, 10);
    expect(compter(vus.filter((v) => v.type === 'zone'), 'zone')).toBeGreaterThan(0);
    expect(compter(vus, 'zone_fin')).toBeGreaterThan(0);
    // La brûlure se prolonge hors de l'impact.
    const sans = tourSpecialisee('artillerie', 'A');
    const f = ennemiFixe(sans, 7);
    evenementsPendant(sans, 10);
    expect(e.pvMax - e.pv).toBeGreaterThan(f.pvMax - f.pv);
  });

  it('Bénédiction : les soldats blessés se régénèrent', () => {
    const etat = tourSpecialisee('caserne', 'A');
    appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: 'benediction' });
    const soldat = etat.unites.find((u) => u.genre === 'soldat');
    if (!soldat) throw new Error('pas de soldat');
    blesserUnite(etat, soldat, 40, 'pur');
    const avant = soldat.pv;
    avancerSecondes(etat, 5);
    expect(soldat.pv).toBeCloseTo(Math.min(soldat.stats.pv, avant + 5), 1);
  });

  it('Légion : le nécromancien peut relever plus de spectres à la fois', () => {
    const etat = tourSpecialisee('magie', 'B');
    for (let i = 0; i < 3; i++) appliquerAction(etat, { type: 'ameliorerCompetence', ...ce(0), competence: 'legion' });
    expect(etat.tours[0]?.stats.spectres?.max).toBe(6);
  });
});
