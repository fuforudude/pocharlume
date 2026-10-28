import { describe, expect, it } from 'vitest';
import { Camera, TUILE } from './camera';
import { zoomPourCase } from './zoom-tactile';

const CASE_PX = 2 * TUILE;

describe('zoomPourCase : zoom entier qui donne 44 px CSS à une case', () => {
  it('812×375 à 1 pixel par pixel CSS : zoom 2 (64 px)', () => {
    expect(zoomPourCase(1, 44)).toBe(2);
  });

  it('téléphone à 2,625 et à 3 pixels par pixel CSS', () => {
    expect(zoomPourCase(2.625, 44)).toBe(4);
    expect(zoomPourCase(3, 44)).toBe(5);
  });

  it('garantit toujours la taille demandée, quel que soit le ratio', () => {
    for (const ratio of [1, 1.25, 1.5, 2, 2.25, 2.625, 3, 3.5, 4]) {
      const zoom = zoomPourCase(ratio, 44);
      expect((zoom * CASE_PX) / ratio).toBeGreaterThanOrEqual(44);
      expect(Number.isInteger(zoom)).toBe(true);
      // Le plus petit zoom entier qui convient : un de moins serait trop petit.
      expect(((zoom - 1) * CASE_PX) / ratio).toBeLessThan(44);
    }
  });

  it('ratio ou taille invalides : zoom 1', () => {
    expect(zoomPourCase(0, 44)).toBe(1);
    expect(zoomPourCase(Number.NaN, 44)).toBe(1);
    expect(zoomPourCase(2, -3)).toBe(1);
  });
});

describe('Camera : plancher de zoom', () => {
  it('812×375 (ratio 1) : le zoom initial de 2 fait déjà des cases de 64 px', () => {
    const c = new Camera(512, 288);
    c.definirPlancherZoom(zoomPourCase(1, 44));
    c.redimensionner(812, 375);
    expect(c.zoom).toBe(2);
    expect(c.zoomMin).toBe(2);
  });

  it('téléphone 2436×1125 (ratio 3) : le plus petit zoom est 5, la case fait 53 px CSS, et on ne peut pas dézoomer', () => {
    const c = new Camera(512, 288);
    c.definirPlancherZoom(zoomPourCase(3, 44));
    c.redimensionner(2436, 1125);
    expect(c.zoomMin).toBe(5);
    expect(c.zoom).toBe(5);
    expect(c.zoomMax).toBe(8);
    expect(c.definirZoom(3, 0, 0)).toBe(false);
    expect(c.zoom).toBe(5);
  });

  it('sans plancher, le comportement ne change pas', () => {
    const c = new Camera(512, 288);
    c.redimensionner(2436, 1125);
    expect(c.zoomMin).toBe(3);
  });

  it('le plancher tient après une rotation ou un redimensionnement', () => {
    const c = new Camera(512, 288);
    c.definirPlancherZoom(5);
    c.redimensionner(2436, 1125);
    c.redimensionner(1125, 2436);
    expect(c.zoom).toBeGreaterThanOrEqual(5);
  });
});
