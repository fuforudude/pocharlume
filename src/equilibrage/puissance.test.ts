import { describe, expect, it } from 'vitest';
import { EQUILIBRAGE } from '../data/equilibrage';
import { ecartsPuissance } from './bandes';
import { puissancesParPalier, toursHorsTolerance } from './puissance';

describe('puissance des tours par palier de coût', () => {
  it('aucune tour commune n’est hors de ±15 % de la moyenne de son palier', () => {
    expect(ecartsPuissance()).toEqual([]);
    expect(toursHorsTolerance()).toEqual([]);
  });

  it('couvre 4 tours aux paliers 1 à 3 et 8 spécialisations au palier 4, dont les écarts se compensent', () => {
    const tours = puissancesParPalier();
    for (const palier of [1, 2, 3, 4]) {
      const groupe = tours.filter((t) => t.palier === palier);
      expect(groupe.length).toBe(palier === 4 ? 8 : 4);
      expect(groupe.reduce((a, t) => a + t.ecart, 0)).toBeCloseTo(0, 9);
      for (const t of groupe) expect(Math.abs(t.ecart)).toBeLessThanOrEqual(EQUILIBRAGE.tolerancePuissance);
    }
  });
});
