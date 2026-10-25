import { describe, expect, it } from 'vitest';
import type { AnimationAtlas } from '../../tools/art/atlas.ts';
import { CADRE_VIDE, cadreA, dureeAnimation, estTerminee, indiceCadre } from './animations';

function anim(durees: number[], boucle: boolean): AnimationAtlas {
  return { boucle, cadres: durees.map((duree, i) => ({ x: i, y: 0, largeur: 1, hauteur: 1, dx: 0, dy: 0, duree })) };
}

describe('animations', () => {
  it('additionne les durées des cadres', () => {
    expect(dureeAnimation(anim([100, 50, 150], true))).toBe(300);
    expect(dureeAnimation(anim([], true))).toBe(0);
  });

  it('choisit le cadre selon le temps écoulé, durées inégales comprises', () => {
    const a = anim([100, 50, 150], false);
    expect(indiceCadre(a, 0)).toBe(0);
    expect(indiceCadre(a, 99)).toBe(0);
    expect(indiceCadre(a, 100)).toBe(1);
    expect(indiceCadre(a, 149)).toBe(1);
    expect(indiceCadre(a, 150)).toBe(2);
    expect(indiceCadre(a, 299)).toBe(2);
  });

  it('boucle : repart du début après la dernière durée, même pour un temps négatif', () => {
    const a = anim([100, 100], true);
    expect(indiceCadre(a, 200)).toBe(0);
    expect(indiceCadre(a, 350)).toBe(1);
    expect(indiceCadre(a, -50)).toBe(1);
  });

  it('sans boucle : reste sur le dernier cadre une fois finie', () => {
    const a = anim([100, 100], false);
    expect(indiceCadre(a, 5000)).toBe(1);
    expect(estTerminee(a, 199)).toBe(false);
    expect(estTerminee(a, 200)).toBe(true);
    expect(estTerminee(anim([100], true), 1e9)).toBe(false);
  });

  it('un seul cadre, ou une animation vide : jamais d’erreur', () => {
    expect(indiceCadre(anim([100], true), 12345)).toBe(0);
    expect(cadreA(anim([], true), 10)).toBe(CADRE_VIDE);
    expect(cadreA(anim([100, 100], true), 150).x).toBe(1);
  });
});
