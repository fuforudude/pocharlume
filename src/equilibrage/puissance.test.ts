import { describe, expect, it } from 'vitest';
import { DIEUX } from '../data/dieux';
import { dpsEfficace, EQUILIBRAGE } from '../data/equilibrage';
import { ecartsPuissance } from './bandes';
import { dpsDivine, puissancesDivines, puissancesParPalier, toursHorsTolerance } from './puissance';

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

describe('puissance des tours divines', () => {
  it('chaque dieu a sa tour divine à 400 arêtes, comparée aux tours communes de coût voisin', () => {
    const divines = puissancesDivines();
    expect(divines.map((d) => d.dieu).sort()).toEqual(['charlie', 'plume', 'pollen']);
    for (const d of divines) {
      expect(d.cout).toBe(400);
      expect(d.puissance, d.dieu).toBeGreaterThan(0);
      expect(d.reference, d.dieu).toBeGreaterThan(0);
      // Tours communes de coût cumulé entre 280 et 520 : les niveaux 3 de caserne, de tir (340) et de magie (500), le niveau 2
      // d'artillerie (325).
      expect(d.tours.length, d.dieu).toBeGreaterThanOrEqual(2);
      for (const t of d.tours) expect(Math.abs(t.coutCumule - 400)).toBeLessThanOrEqual(120);
    }
  });

  it('dpsDivine compte l’onde du Totem, les tourelles et les pièges de l’Atelier, ce que la formule des tours communes ignore', () => {
    const [plume, charlie, pollen] = [DIEUX.plume.tourDivine, DIEUX.charlie.tourDivine, DIEUX.pollen.tourDivine];
    const moyenne = (def: typeof plume): number => dpsEfficace(def).reduce((a, b) => a + b, 0) / dpsEfficace(def).length;
    expect(dpsDivine(charlie)).toBeGreaterThan(moyenne(charlie));
    expect(dpsDivine(pollen)).toBeGreaterThan(moyenne(pollen));
    expect(moyenne(pollen)).toBe(0);
    // Le Sanctuaire n'a ni onde ni atelier : ses assassins comptent comme des soldats.
    expect(dpsDivine(plume)).toBeCloseTo(moyenne(plume), 9);
  });
});
