// Élites selon la difficulté : en Vieux Sage, les dernières vagues sont jouées en élite (hors boss) ; jamais en Chaton
// ni en Matou. Le nombre de vagues vient de `Difficulte.vaguesElites` (src/data/difficultes.ts).
import { describe, expect, it } from 'vitest';
import { DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { CONFIG, avancerSecondes, configDe, niveauEssai } from './aides.test-utils';
import type { Paquet, Vague } from './definitions';
import { appliquerAction, creerPartie } from './partie';

function groupe(ennemi: string, nombre: number, delai = 0): Paquet {
  return { ennemi, nombre, intervalle: 0.5, chemin: 0, delai };
}

const VAGUES: Vague[] = [
  { paquets: [groupe('paysan_affame', 3)] },
  { paquets: [groupe('mendiant', 3), groupe('paysan_affame', 2, 2)] },
  { paquets: [groupe('chien_errant', 4)] },
  { paquets: [groupe('paysan_affame', 5), groupe('boucher_vaudrelle', 1, 8)] },
];

function elites(vagues: readonly Vague[]): boolean[][] {
  return vagues.map((v) => v.paquets.map((p) => p.elite === true));
}

describe('élites selon la difficulté', () => {
  it('les valeurs : aucune vague d’élite en Chaton et en Matou, les deux dernières en Vieux Sage', () => {
    expect(DIFFICULTES.chaton.vaguesElites).toBe(0);
    expect(DIFFICULTES.matou.vaguesElites).toBe(0);
    expect(DIFFICULTES.vieux_sage.vaguesElites).toBe(2);
  });

  it.each(['chaton', 'matou'])('en %s, aucun groupe n’est d’élite', (difficulte) => {
    const etat = creerPartie(niveauEssai(VAGUES), { ...CONFIG, difficulte });
    expect(elites(etat.niveau.vagues).flat().some(Boolean)).toBe(false);
  });

  it('en Vieux Sage, les groupes des deux dernières vagues sont d’élite, le boss excepté', () => {
    const etat = creerPartie(niveauEssai(VAGUES), { ...CONFIG, difficulte: 'vieux_sage' });
    expect(elites(etat.niveau.vagues)).toEqual([[false], [false, false], [true], [true, false]]);
    const boss = etat.niveau.vagues[3]?.paquets.find((p) => ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss);
    expect(boss?.elite).toBeUndefined();
  });

  it('un niveau plus court que le nombre de vagues d’élite est entièrement en élite', () => {
    const etat = creerPartie(niveauEssai([VAGUES[0] ?? { paquets: [] }]), { ...CONFIG, difficulte: 'vieux_sage' });
    expect(elites(etat.niveau.vagues)).toEqual([[true]]);
  });

  it('les ennemis qui apparaissent sont ordinaires dans les premières vagues et d’élite dans les dernières', () => {
    const etat = creerPartie(niveauEssai(VAGUES), { ...CONFIG, difficulte: 'vieux_sage' });
    appliquerAction(etat, { type: 'appelerVague' });
    avancerSecondes(etat, 1);
    expect(etat.ennemis.length).toBeGreaterThan(0);
    expect(etat.ennemis.every((e) => !e.elite)).toBe(true);
    avancerSecondes(etat, 5);
    appliquerAction(etat, { type: 'appelerVague' });
    avancerSecondes(etat, 5);
    appliquerAction(etat, { type: 'appelerVague' });
    avancerSecondes(etat, 1);
    expect(etat.vagues.lancees).toBe(3);
    expect(etat.ennemis.some((e) => e.elite)).toBe(true);
  });

  it('un niveau marqué sans élites reste ordinaire en Vieux Sage, mais pas en Héroïque', () => {
    const niveau = { ...niveauEssai(VAGUES), sansElites: true };
    const sage = creerPartie(niveau, { ...CONFIG, difficulte: 'vieux_sage' });
    expect(elites(sage.niveau.vagues).flat().some(Boolean)).toBe(false);
    const heroique = creerPartie(niveau, configDe('charlie', { difficulte: 'vieux_sage', defi: 'heroique' }));
    expect(elites(heroique.niveau.vagues)[0]).toEqual([true]);
  });

  it('ne modifie pas le niveau donné', () => {
    const niveau = niveauEssai(VAGUES);
    creerPartie(niveau, { ...CONFIG, difficulte: 'vieux_sage' });
    expect(niveau.vagues.flatMap((v) => v.paquets).some((p) => 'elite' in p)).toBe(false);
  });

  it('un défi garde les règles de Matou : le Fer n’a pas d’élite, l’Héroïque les a toutes', () => {
    const fer = creerPartie({ ...niveauEssai(VAGUES), defiFer: { familles: ['caserne', 'tir'] } }, configDe('charlie', { difficulte: 'vieux_sage', defi: 'fer' }));
    expect(elites(fer.niveau.vagues).flat().some(Boolean)).toBe(false);
    const heroique = creerPartie(niveauEssai(VAGUES), configDe('charlie', { difficulte: 'vieux_sage', defi: 'heroique' }));
    expect(elites(heroique.niveau.vagues)).toEqual([[true], [true, true], [true], [true, false]]);
  });
});
