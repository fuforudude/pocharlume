import { describe, expect, it } from 'vitest';
import { calculerChemin, distanceAuxChemins, pointSurChemin } from './chemins';

const enL = calculerChemin({ points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }] });

describe('chemins en polylignes', () => {
  it('précalcule les longueurs cumulées et la longueur totale', () => {
    expect(enL.cumul).toEqual([0, 4, 7]);
    expect(enL.longueur).toBe(7);
    expect(enL.dirX).toEqual([1, 0]);
    expect(enL.dirY).toEqual([0, 1]);
  });

  it('donne le point à une distance parcourue, y compris après un virage', () => {
    expect(pointSurChemin(enL, 0)).toEqual({ x: 0, y: 0 });
    expect(pointSurChemin(enL, 2.5)).toEqual({ x: 2.5, y: 0 });
    expect(pointSurChemin(enL, 5)).toEqual({ x: 4, y: 1 });
    expect(pointSurChemin(enL, 99)).toEqual({ x: 4, y: 3 });
  });

  it('mesure la distance d’un point au chemin le plus proche', () => {
    const droit = calculerChemin({ points: [{ x: 0, y: 10 }, { x: 10, y: 10 }] });
    expect(distanceAuxChemins([enL, droit], 2, 1)).toBeCloseTo(1);
    expect(distanceAuxChemins([enL, droit], 5, 9)).toBeCloseTo(1);
    expect(distanceAuxChemins([enL, droit], 6, 2)).toBeCloseTo(2);
  });
});
