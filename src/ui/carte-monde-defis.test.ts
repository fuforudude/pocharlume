import { describe, expect, it, vi } from 'vitest';
import type { AtlasRendu } from '../render/atlas';
import { dessinerIconesDefis } from './carte-monde-defis';
import type { VueNoeud } from './carte-monde-logique';

function noeud(numero: number, x: number, y: number, visible: boolean, defis: VueNoeud['defis']): VueNoeud {
  return { numero, x, y, boss: false, visible, clignote: false, reussi: true, etoiles: 3, defis };
}

const CAMERA = { zoom: 2, decalageX: 10, decalageY: 20 };
const SPRITE = { ancre: { x: 8, y: 8 } };
const CADRE = { x: 0, y: 0, largeur: 16, hauteur: 16, dx: 0, dy: 0 };

function atlasTruque() {
  const dessinerEchelle = vi.fn();
  const atlas = {
    sprite: (nom: string) => (nom.startsWith('icone-defi') ? { ...SPRITE, nom } : undefined),
    cadre: () => CADRE,
    dessinerEchelle,
  } as unknown as AtlasRendu;
  return { atlas, dessinerEchelle };
}

describe('icônes des défis sur la carte', () => {
  it('pose une icône par défi réussi sur un nœud visible, à l’échelle de la caméra', () => {
    const { atlas, dessinerEchelle } = atlasTruque();
    dessinerIconesDefis({} as CanvasRenderingContext2D, atlas, CAMERA, [noeud(1, 100, 120, true, { heroique: true, fer: true })]);
    expect(dessinerEchelle).toHaveBeenCalledTimes(2);
    const appels = dessinerEchelle.mock.calls as unknown[][];
    // Échelle de la caméra, position en pixels d'écran : (x + décalage de l'icône − décalage de la vue) × zoom.
    expect(appels.map((a) => a[5])).toEqual([2, 2]);
    const [gauche, droite] = appels as [number[], number[]];
    expect(gauche[3]).toBeLessThan(droite[3] ?? 0);
    expect(gauche[3]).toBe((100 - 11 - CAMERA.decalageX) * CAMERA.zoom);
    expect(gauche[4]).toBe(droite[4]);
  });

  it('ne dessine rien sans défi réussi, ni sur un nœud caché', () => {
    const { atlas, dessinerEchelle } = atlasTruque();
    dessinerIconesDefis({} as CanvasRenderingContext2D, atlas, CAMERA, [noeud(1, 100, 120, true, {}), noeud(2, 140, 120, false, { fer: true })]);
    expect(dessinerEchelle).not.toHaveBeenCalled();
  });

  it('saute une icône absente de l’atlas sans lever d’exception', () => {
    const atlas = { sprite: () => undefined, cadre: () => undefined, dessinerEchelle: vi.fn() } as unknown as AtlasRendu;
    expect(() => { dessinerIconesDefis({} as CanvasRenderingContext2D, atlas, CAMERA, [noeud(1, 100, 120, true, { heroique: true })]); }).not.toThrow();
  });
});
