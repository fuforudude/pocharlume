import { describe, expect, it } from 'vitest';
import { creerGenerateur, tirer, tirerEntre } from './aleatoire';

function suite(graine: number, n: number): number[] {
  const g = creerGenerateur(graine);
  return Array.from({ length: n }, () => tirer(g));
}

describe('générateur à graine', () => {
  it('donne la même suite pour la même graine', () => {
    expect(suite(1234, 50)).toEqual(suite(1234, 50));
  });

  it('donne des suites différentes pour des graines différentes', () => {
    expect(suite(1, 10)).not.toEqual(suite(2, 10));
  });

  it('tire dans [0, 1) avec une moyenne proche de 0,5', () => {
    const valeurs = suite(99, 10000);
    expect(valeurs.every((v) => v >= 0 && v < 1)).toBe(true);
    const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
    expect(moyenne).toBeGreaterThan(0.48);
    expect(moyenne).toBeLessThan(0.52);
  });

  it('garde son état dans un entier non signé de 32 bits, sérialisable', () => {
    const g = creerGenerateur(-5);
    for (let i = 0; i < 100; i++) {
      tirer(g);
      expect(Number.isInteger(g.rng)).toBe(true);
      expect(g.rng).toBeGreaterThanOrEqual(0);
      expect(g.rng).toBeLessThan(4294967296);
    }
    const copie = JSON.parse(JSON.stringify(g)) as typeof g;
    expect(tirer(copie)).toBe(tirer(g));
  });

  it('tire un nombre dans une fourchette', () => {
    const g = creerGenerateur(7);
    for (let i = 0; i < 1000; i++) {
      const v = tirerEntre(g, 3, 5);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThan(5);
    }
    expect(tirerEntre(g, 4, 4)).toBe(4);
  });
});
