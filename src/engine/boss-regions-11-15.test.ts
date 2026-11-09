// Mécaniques des boss des régions 11 à 15 (après l'histoire, docs/specs/2026-11-08-apres-histoire-gimmicks.md), jouées avec les
// valeurs des données sur la carte d'essai : les niveaux de ces régions n'existent pas encore.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { avancerSecondes, compter, construireTour, ennemiDonnees, ennemisDe, evenementsPendant, partieEssai, tourDe } from './aides.test-utils';
import { infligerDegats } from './degats';
import type { Ennemi, EtatPartie, Unite } from './etat';
import { step } from './partie';
import { enPas } from './temps';

/** Une caserne sur la case d'essai 0 dont les soldats ont pris leur place. */
function partieAvecCaserne(): EtatPartie {
  const etat = partieEssai();
  construireTour(etat, 0, 'caserne');
  avancerSecondes(etat, 2);
  return etat;
}

function unSoldat(etat: EtatPartie): Unite {
  const u = etat.unites.find((s) => s.genre === 'soldat' && !s.mort);
  if (!u) throw new Error('pas de soldat');
  return u;
}

/** Le Passeur des données, increvable et inoffensif ; immobile sauf si `surcharges` donne une vitesse. */
function passeur(etat: EtatPartie, x: number, surcharges: Parameters<typeof ennemiDonnees>[3] = {}): Ennemi {
  return ennemiDonnees(etat, 'passeur', x, { pv: 1e9, degats: [0, 0], ...surcharges });
}

const PEAGE = ENNEMIS.passeur.pouvoirs?.vol?.aretes ?? 0;

describe('Le Passeur (région 11) : boss du niveau 110, cohérent avec le Soleil Blême', () => {
  it('est un boss de la robustesse du boss de la région 10, insensible à l’étourdissement', () => {
    const p = ENNEMIS.passeur;
    expect(p.boss).toBe(true);
    expect(p.insensibleEtourdissement).toBe(true);
    // 15 000 PV, un peu moins que le Soleil Blême : le niveau 110 compte trois chemins et le Radeau (équilibrage de la région 11).
    expect(p.pv).toBeGreaterThanOrEqual(ENNEMIS.soleil_bleme.pv * 0.9);
    expect(p.pv).toBeLessThanOrEqual(ENNEMIS.soleil_bleme.pv * 1.25);
    expect(p.prime).toBeGreaterThan(ENNEMIS.soleil_bleme.prime);
    expect(p.coutVies).toBe(ENNEMIS.soleil_bleme.coutVies);
    expect(PEAGE).toBe(100);
  });
});

describe('Le Passeur : le prix du passage', () => {
  it('au premier soldat qui lui barre la route, il prend son péage en arêtes et passe sans s’arrêter', () => {
    const etat = partieAvecCaserne();
    const avant = etat.aretes;
    const soldat = unSoldat(etat);
    const boss = passeur(etat, soldat.x - 1, { vitesse: ENNEMIS.passeur.vitesse });
    for (let i = 0; i < 30 * 20 && !boss.vole; i++) step(etat);
    expect(boss.vole).toBe(true);
    expect(boss.butin).toBe(PEAGE);
    expect(etat.aretes).toBe(avant - PEAGE);
    expect(boss.bloqueur).toBe(-1);
    expect(boss.charge).toBeGreaterThan(0);
    expect(boss.chargeVitesse).toBe(ENNEMIS.passeur.pouvoirs?.vol?.vitesse);
  });

  it('tué, il rend le péage avec sa prime', () => {
    const etat = partieAvecCaserne();
    const soldat = unSoldat(etat);
    const boss = passeur(etat, soldat.x - 1, { vitesse: ENNEMIS.passeur.vitesse });
    for (let i = 0; i < 30 * 20 && !boss.vole; i++) step(etat);
    const apres = etat.aretes;
    // Pas pendant une plongée : les dégâts ne passeraient pas.
    boss.invulnerable = 0;
    infligerDegats(etat, boss, 1e12, 'pur');
    expect(etat.aretes).toBe(apres + boss.prime + PEAGE);
  });

  it('sans soldat sur sa route, il prend le péage à la sortie, et le joueur le perd', () => {
    const etat = partieEssai();
    const avant = etat.aretes;
    passeur(etat, 29, { vitesse: 2 });
    const vus = evenementsPendant(etat, 4);
    expect(compter(vus, 'vol')).toBe(1);
    expect(etat.aretes).toBe(avant - PEAGE);
  });
});

describe('Le Passeur : il plonge sous l’eau grise toutes les 12 s', () => {
  it('devient intouchable 2 s, puis remonte 3 tuiles plus loin', () => {
    const etat = partieEssai();
    const boss = passeur(etat, 10);
    avancerSecondes(etat, 11.8);
    expect(boss.invulnerable).toBe(0);
    avancerSecondes(etat, 0.4);
    expect(boss.invulnerable).toBeGreaterThan(0);
    expect(infligerDegats(etat, boss, 100, 'pur')).toBe(0);
    avancerSecondes(etat, 2.2);
    expect(boss.invulnerable).toBe(0);
    expect(boss.distance).toBeCloseTo(13, 3);
  });
});

describe('Le Passeur : à 66 et 33 % de PV, les corbeaux', () => {
  /** Passeur à 4 tuiles des tours des cases 1 et 3 au plus ; deux tours à geler. */
  function partiePasseur(): { etat: EtatPartie; boss: Ennemi } {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    construireTour(etat, 3, 'tir');
    const boss = passeur(etat, 13, { furtif: true });
    return { etat, boss };
  }

  it('sous 66 % : 4 Corbeaux Noirs s’abattent et les 2 tours les plus proches sont gelées 3 s', () => {
    const { etat, boss } = partiePasseur();
    boss.pv = boss.pvMax * 0.65;
    step(etat);
    expect(ennemisDe(etat, 'corbeau_noir')).toHaveLength(4);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'appel', typeEnnemi: 'corbeau_noir', nombre: 4 }));
    for (const i of [1, 3]) expect(tourDe(etat, i)?.gel ?? 0).toBeGreaterThan(enPas(3) - 3);
  });

  it('chaque seuil ne vaut qu’une fois ; le seuil de 33 % en appelle 4 de plus', () => {
    const { etat, boss } = partiePasseur();
    boss.pv = boss.pvMax * 0.65;
    avancerSecondes(etat, 1);
    boss.pv = boss.pvMax * 0.6;
    avancerSecondes(etat, 1);
    expect(ennemisDe(etat, 'corbeau_noir')).toHaveLength(4);
    boss.pv = boss.pvMax * 0.3;
    step(etat);
    expect(ennemisDe(etat, 'corbeau_noir')).toHaveLength(8);
    expect(boss.palier).toBe(2);
  });
});
