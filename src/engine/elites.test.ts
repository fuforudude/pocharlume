// Élites : règle générique appliquée à un groupe marqué `elite` dans une vague (jalon 3).
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { REGLES } from '../data/regles';
import { CONFIG, avancerSecondes, ennemiDonnees, ennemiEssai, niveauEssai } from './aides.test-utils';
import { ajusterMontant } from './argent';
import { infligerDegats } from './degats';
import type { Vague } from './definitions';
import { ajouterEnnemi } from './ennemis';
import { appliquerAction, creerPartie, step } from './partie';

const VAGUE_MIXTE: Vague = {
  paquets: [
    { ennemi: 'paysan_affame', nombre: 2, intervalle: 0, chemin: 0, delai: 0, elite: true },
    { ennemi: 'paysan_affame', nombre: 1, intervalle: 0, chemin: 0, delai: 0 },
  ],
};

describe('élites', () => {
  it('un groupe marqué élite apparaît en élite, les autres restent ordinaires', () => {
    const etat = creerPartie(niveauEssai([VAGUE_MIXTE]), CONFIG);
    appliquerAction(etat, { type: 'appelerVague' });
    step(etat);
    expect(etat.ennemis.map((e) => e.elite)).toEqual([true, true, false]);
  });

  it('PV ×1,8, un palier d’armure et de résistance de plus, prime ×1,5, une vie de plus', () => {
    const etat = creerPartie(niveauEssai([VAGUE_MIXTE]), CONFIG);
    appliquerAction(etat, { type: 'appelerVague' });
    step(etat);
    const [elite, , ordinaire] = etat.ennemis;
    if (!elite || !ordinaire) throw new Error('ennemis manquants');
    expect(elite.pvMax).toBeCloseTo(ordinaire.pvMax * REGLES.elite.facteurPv, 6);
    expect(elite.pv).toBe(elite.pvMax);
    expect(elite.armure).toBe(0.3);
    expect(elite.resistance).toBe(0.3);
    expect(ordinaire.armure).toBe(0);
    expect(elite.prime).toBe(ajusterMontant(ordinaire.prime, REGLES.elite.facteurPrime));
    expect(elite.prime).toBeGreaterThan(ordinaire.prime);
    expect(elite.coutVies).toBe(ordinaire.coutVies + 1);
    // Le type reste celui de l'ennemi : le rendu choisit le sprite `<id>-elite` d'après `elite`.
    expect(elite.type).toBe('paysan_affame');
  });

  it('monte d’un palier à chaque fois et plafonne à 90 %', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    const paliers = (armure: number, resistance: number) => {
      const e = ajouterEnnemi(etat, ennemiEssai({ armure, resistance }), 'paysan_affame', 0, 0, true);
      return [e.armure, e.resistance];
    };
    expect(paliers(0, 0)).toEqual([0.3, 0.3]);
    expect(paliers(0.3, 0.6)).toEqual([0.6, 0.9]);
    expect(paliers(0.6, 0.9)).toEqual([0.9, 0.9]);
    expect(paliers(0.9, 0.9)).toEqual([0.9, 0.9]);
  });

  it('un élite qui s’échappe coûte une vie de plus', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    ajouterEnnemi(etat, ennemiEssai({ coutVies: 1 }), 'paysan_affame', 0, 29.99, true);
    const avant = etat.vies;
    step(etat);
    expect(etat.vies).toBe(avant - 2);
  });

  it('un élite tué verse sa prime majorée', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    const e = ajouterEnnemi(etat, ennemiEssai({ prime: 10 }), 'paysan_affame', 0, 2, true);
    const avant = etat.aretes;
    infligerDegats(etat, e, 1e9, 'pur');
    expect(etat.aretes).toBe(avant + ajusterMontant(ajusterMontant(10, 0.7), 1.5));
  });

  it('une élite subit ses protections plus fortes', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    const e = ajouterEnnemi(etat, ennemiEssai({ pv: 1e6 }), 'paysan_affame', 0, 2, true);
    expect(infligerDegats(etat, e, 100, 'physique')).toBeCloseTo(70, 6);
    expect(infligerDegats(etat, e, 100, 'magique')).toBeCloseTo(70, 6);
  });

  it('un boss ne devient jamais élite', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    const normal = ajouterEnnemi(etat, ENNEMIS.boucher_vaudrelle, 'boucher_vaudrelle', 0, 0);
    const marque = ajouterEnnemi(etat, ENNEMIS.boucher_vaudrelle, 'boucher_vaudrelle', 0, 0, true);
    expect(marque.elite).toBe(false);
    expect(marque.pvMax).toBe(normal.pvMax);
    expect(marque.armure).toBe(normal.armure);
    expect(marque.coutVies).toBe(normal.coutVies);
    expect(marque.prime).toBe(normal.prime);
  });

  it('garde ses mécaniques d’élite : un Épouvantail élite se relève avec 40 % de ses PV élevés', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    const e = ennemiDonnees(etat, 'epouvantail', 10, {}, 0, true);
    expect(e.pvMax).toBeCloseTo(ENNEMIS.epouvantail.pv * 1.08 * 1.8, 6);
    infligerDegats(etat, e, 1e9, 'pur');
    expect(e.vivant).toBe(true);
    expect(e.pv).toBeCloseTo(e.pvMax * 0.4, 6);
  });

  it('suit la vague jusqu’au bout sans changer l’aléatoire des ennemis ordinaires', () => {
    const sans: Vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 3, intervalle: 0.5, chemin: 0, delai: 0 }] };
    const avec: Vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 3, intervalle: 0.5, chemin: 0, delai: 0, elite: true }] };
    const jouer = (vague: Vague) => {
      const etat = creerPartie(niveauEssai([vague]), CONFIG);
      appliquerAction(etat, { type: 'appelerVague' });
      avancerSecondes(etat, 2);
      return etat.ennemis.map((e) => e.decalage);
    };
    expect(jouer(avec)).toEqual(jouer(sans));
  });
});
