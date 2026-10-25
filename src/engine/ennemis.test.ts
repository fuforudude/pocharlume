import { describe, expect, it } from 'vitest';
import { DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { REGLES } from '../data/regles';
import { CONFIG, avancerPas, avancerSecondes, ennemiEssai, niveauEssai } from './aides.test-utils';
import { appliquerEffet, infligerDegats } from './degats';
import { ajouterEnnemi } from './ennemis';
import type { Evenement } from './evenements';
import { appliquerAction, creerPartie, step } from './partie';

function partieVide(difficulte = 'matou') {
  return creerPartie(niveauEssai(), { ...CONFIG, difficulte });
}

describe('déplacement des ennemis', () => {
  it('avance le long du chemin à sa vitesse', () => {
    const etat = partieVide();
    const e = ajouterEnnemi(etat, ennemiEssai({ vitesse: 0.9 }), 'paysan_affame', 0, 0);
    avancerSecondes(etat, 1);
    expect(e.distance).toBeCloseTo(0.9, 6);
    expect(e.x).toBeCloseTo(0.9, 6);
    expect(Math.abs(e.y - 5)).toBeLessThanOrEqual(REGLES.decalageLateralMax);
  });

  it('suit son propre chemin quand la carte en a plusieurs', () => {
    const etat = partieVide();
    const e = ajouterEnnemi(etat, ennemiEssai(), 'paysan_affame', 1, 3);
    step(etat);
    expect(Math.abs(e.y - 12)).toBeLessThanOrEqual(REGLES.decalageLateralMax);
  });

  it('coûte des vies et disparaît en atteignant la sortie', () => {
    const etat = partieVide();
    const e = ajouterEnnemi(etat, ennemiEssai({ coutVies: 3 }), 'paysan_affame', 0, 29.99);
    step(etat);
    expect(etat.vies).toBe(17);
    expect(etat.ennemis).not.toContain(e);
    expect(etat.evenements).toContainEqual({ type: 'fuite', ennemi: e.id, vies: 3 });
  });
});

describe('dégâts et protections', () => {
  it('réduit le physique par l’armure, le magique par la résistance, jamais le pur', () => {
    const etat = partieVide();
    const e = ajouterEnnemi(etat, ennemiEssai({ pv: 1000, armure: 0.6, resistance: 0.3 }), 'paysan_affame', 0, 0);
    expect(infligerDegats(etat, e, 100, 'physique')).toBeCloseTo(40);
    expect(infligerDegats(etat, e, 100, 'magique')).toBeCloseTo(70);
    expect(infligerDegats(etat, e, 100, 'pur')).toBe(100);
    expect(e.pv).toBeCloseTo(1000 - 210);
  });

  it('tue l’ennemi, verse sa prime selon la difficulté et le retire à la fin du pas', () => {
    const etat = partieVide('chaton');
    const e = ajouterEnnemi(etat, ennemiEssai({ prime: 10 }), 'paysan_affame', 0, 2);
    const avant = etat.aretes;
    infligerDegats(etat, e, 1000, 'pur');
    expect(e.vivant).toBe(false);
    const prime = Math.round(10 * DIFFICULTES.chaton.primes);
    expect(etat.aretes).toBe(avant + prime);
    expect(etat.evenements).toContainEqual({ type: 'mort', ennemi: e.id, typeEnnemi: 'paysan_affame', x: e.x, y: e.y, prime });
    infligerDegats(etat, e, 1000, 'pur');
    expect(etat.aretes).toBe(avant + prime);
    step(etat);
    expect(etat.ennemis).not.toContain(e);
  });
});

describe('effets', () => {
  it('ralentit pendant la durée de l’effet', () => {
    const etat = partieVide();
    const e = ajouterEnnemi(etat, ennemiEssai({ vitesse: 1 }), 'paysan_affame', 0, 0);
    appliquerEffet(etat, e, { type: 'ralentissement', chance: 1, duree: 1, valeur: 0.5 });
    avancerSecondes(etat, 1);
    expect(e.distance).toBeCloseTo(0.5, 6);
    avancerSecondes(etat, 1);
    expect(e.distance).toBeCloseTo(1.5, 6);
  });

  it('étourdit (arrêt complet), sauf les ennemis insensibles', () => {
    const etat = partieVide();
    const e = ajouterEnnemi(etat, ennemiEssai({ vitesse: 1 }), 'paysan_affame', 0, 0);
    const boss = ajouterEnnemi(etat, ennemiEssai({ vitesse: 1, insensibleEtourdissement: true }), 'boucher_vaudrelle', 0, 0);
    const etourdi = { type: 'etourdissement', chance: 1, duree: 1, valeur: 0 } as const;
    appliquerEffet(etat, e, etourdi);
    appliquerEffet(etat, boss, etourdi);
    avancerSecondes(etat, 1);
    expect(e.distance).toBe(0);
    expect(boss.distance).toBeCloseTo(1, 6);
  });

  it('brûle, saigne et empoisonne en dégâts purs par seconde, sans cumul', () => {
    for (const type of ['brulure', 'saignement', 'poison'] as const) {
      const etat = partieVide();
      const e = ajouterEnnemi(etat, ennemiEssai({ pv: 100, armure: 0.9, vitesse: 0 }), 'paysan_affame', 0, 0);
      appliquerEffet(etat, e, { type, chance: 1, duree: 3, valeur: 4 });
      appliquerEffet(etat, e, { type, chance: 1, duree: 2, valeur: 2 });
      avancerSecondes(etat, 5);
      expect(e.pv).toBeCloseTo(100 - 12, 6);
    }
  });

  it('respecte la chance d’application', () => {
    const etat = partieVide();
    let touches = 0;
    for (let i = 0; i < 1000; i++) {
      const e = ajouterEnnemi(etat, ennemiEssai(), 'paysan_affame', 0, 0);
      appliquerEffet(etat, e, { type: 'etourdissement', chance: 0.25, duree: 1, valeur: 0 });
      if (e.effetsPas[1] !== 0) touches++;
    }
    expect(touches).toBeGreaterThan(200);
    expect(touches).toBeLessThan(300);
  });
});

describe('attaques des ennemis', () => {
  it('attaque à distance une unité alliée à portée', () => {
    const etat = partieVide();
    appliquerAction(etat, { type: 'construire', socle: 0, tour: 'caserne' });
    avancerSecondes(etat, 2);
    const tireur = ennemiEssai({ vitesse: 0, distance: { portee: 4, degats: [5, 5], cadence: 1, typeDegats: 'physique' } });
    const e = ajouterEnnemi(etat, tireur, 'paysan_affame', 0, 1.5);
    step(etat);
    const blesses = etat.unites.filter((u) => u.genre === 'soldat' && u.pv < u.stats.pv);
    expect(blesses).toHaveLength(1);
    expect(blesses[0]?.pv).toBeCloseTo((blesses[0]?.stats.pv ?? 0) - 5);
    expect(etat.evenements).toContainEqual({ type: 'coup_ennemi', ennemi: e.id, unite: blesses[0]?.id, distance: true });
  });

  it('frappe au corps-à-corps le soldat qui le bloque', () => {
    const etat = partieVide();
    appliquerAction(etat, { type: 'construire', socle: 0, tour: 'caserne' });
    avancerSecondes(etat, 2);
    ajouterEnnemi(etat, ennemiEssai({ pv: 10000, degats: [3, 3] }), 'paysan_affame', 0, 4);
    avancerSecondes(etat, 3);
    expect(etat.unites.some((u) => u.genre === 'soldat' && u.pv < u.stats.pv)).toBe(true);
  });

  it('le Boucher dévore de temps en temps le soldat qui le bloque', () => {
    const etat = partieVide();
    appliquerAction(etat, { type: 'construire', socle: 0, tour: 'caserne' });
    avancerSecondes(etat, 2);
    const boucher = ajouterEnnemi(etat, ENNEMIS.boucher_vaudrelle, 'boucher_vaudrelle', 0, 4.5);
    const vus: Evenement[] = [];
    for (let i = 0; i < 12 * 30; i++) {
      step(etat);
      vus.push(...etat.evenements);
    }
    const devores = vus.filter((ev) => ev.type === 'devore');
    expect(devores.length).toBeGreaterThanOrEqual(1);
    expect(devores[0]).toMatchObject({ ennemi: boucher.id });
  });
});

describe('effets dans le temps', () => {
  it('finit chaque effet après sa durée exacte en pas', () => {
    const etat = partieVide();
    const e = ajouterEnnemi(etat, ennemiEssai({ vitesse: 1 }), 'paysan_affame', 0, 0);
    appliquerEffet(etat, e, { type: 'etourdissement', chance: 1, duree: 0.5, valeur: 0 });
    avancerPas(etat, 15);
    expect(e.distance).toBe(0);
    avancerPas(etat, 1);
    expect(e.distance).toBeGreaterThan(0);
  });
});
