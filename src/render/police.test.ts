import { describe, expect, it } from 'vitest';
import { dessinerNombre, largeurNombre } from './police';

/** Faux contexte qui note les pixels peints. */
function faux(): { ctx: CanvasRenderingContext2D; pixels: Set<string> } {
  const pixels = new Set<string>();
  const ctx = { fillRect: (x: number, y: number) => pixels.add(`${String(x)},${String(y)}`) } as unknown as CanvasRenderingContext2D;
  return { ctx, pixels };
}

describe('police en pixels', () => {
  it('mesure la largeur : 4 pixels par glyphe moins l’espace final', () => {
    expect(largeurNombre(0, false)).toBe(3);
    expect(largeurNombre(7, false)).toBe(3);
    expect(largeurNombre(10, false)).toBe(7);
    expect(largeurNombre(150, true)).toBe(15);
  });

  it('dessine le 1 : 8 pixels, ni plus ni moins', () => {
    const { ctx, pixels } = faux();
    dessinerNombre(ctx, 1, 10, 20, false);
    expect(pixels.size).toBe(8);
    expect(pixels.has('11,20')).toBe(true);
  });

  it('dessine le 8 : 13 pixels', () => {
    const { ctx, pixels } = faux();
    dessinerNombre(ctx, 8, 0, 0, false);
    expect(pixels.size).toBe(13);
  });

  it('place les chiffres suivants quatre pixels plus loin et le plus avant', () => {
    const { ctx, pixels } = faux();
    dessinerNombre(ctx, 11, 0, 0, true);
    expect(pixels.has('5,0')).toBe(true);
    expect(pixels.has('9,0')).toBe(true);
    expect(pixels.has('1,2')).toBe(true);
  });

  it('un nombre négatif ou fractionnaire s’affiche comme un entier positif', () => {
    const a = faux();
    const b = faux();
    dessinerNombre(a.ctx, -5, 0, 0, false);
    dessinerNombre(b.ctx, 0, 0, 0, false);
    expect(a.pixels).toEqual(b.pixels);
    const c = faux();
    const d = faux();
    dessinerNombre(c.ctx, 6.9, 0, 0, false);
    dessinerNombre(d.ctx, 6, 0, 0, false);
    expect(c.pixels).toEqual(d.pixels);
  });
});
