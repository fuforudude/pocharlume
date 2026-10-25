import { describe, expect, it } from 'vitest';
import { graineSuivante } from './partie';

describe('graineSuivante', () => {
  it('donne une graine entière positive, différente de la précédente et reproductible', () => {
    const suite = [1, 123456789, 0xffffffff].map(graineSuivante);
    for (const [i, graine] of [1, 123456789, 0xffffffff].entries()) {
      expect(Number.isInteger(suite[i])).toBe(true);
      expect(suite[i]).toBeGreaterThanOrEqual(0);
      expect(suite[i]).not.toBe(graine);
      expect(graineSuivante(graine)).toBe(suite[i]);
    }
  });

  it('enchaîne des graines toutes différentes sur une série de tentatives', () => {
    const vues = new Set<number>();
    let graine = 42;
    for (let i = 0; i < 1000; i++) {
      graine = graineSuivante(graine);
      vues.add(graine);
    }
    expect(vues.size).toBe(1000);
  });
});
