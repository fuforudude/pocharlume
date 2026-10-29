import { describe, expect, it } from 'vitest';
import { cellule, Historique, lire, poser, segment } from './pixels.ts';

describe('modèle de pixels', () => {
  it('lit les cellules hors grille comme transparentes', () => {
    expect(lire(['ab'], 1, 0)).toBe('b');
    expect(lire(['ab'], 5, 3)).toBe('.');
    expect(lire(['ab'], -1, 0)).toBe('.');
  });

  it('pose une lettre et étend la grille vers la droite et le bas', () => {
    expect(poser(['ab'], 0, 0, 'c')).toEqual(['cb']);
    expect(poser(['ab'], 3, 2, 'c')).toEqual(['ab', '', '...c']);
  });

  it('ne change rien si la lettre est déjà là ou si la cellule est hors d\'atteinte', () => {
    expect(poser(['ab'], 0, 0, 'a')).toBeNull();
    expect(poser([], 2, 2, '.')).toBeNull();
    expect(poser(['ab'], -1, 0, 'c')).toBeNull();
  });

  it('trace un segment sans trou', () => {
    expect(segment(0, 0, 4, 2)).toEqual([[0, 0], [1, 1], [2, 1], [3, 2], [4, 2]]);
    expect(segment(2, 2, 2, 2)).toEqual([[2, 2]]);
    expect(segment(3, 0, 0, 0)).toHaveLength(4);
  });

  it('retrouve la cellule sous un point', () => {
    expect(cellule(25, 9, 12)).toEqual([2, 0]);
  });

  it('annule et rétablit coup par coup', () => {
    const h = new Historique();
    h.enregistrer({ id: 'a', avant: ['x'], apres: ['y'] });
    h.enregistrer({ id: 'a', avant: ['y'], apres: ['z'] });
    expect(h.annuler()?.avant).toEqual(['y']);
    expect(h.peutRefaire()).toBe(true);
    expect(h.refaire()?.apres).toEqual(['z']);
    h.annuler();
    h.enregistrer({ id: 'a', avant: ['y'], apres: ['w'] });
    expect(h.peutRefaire()).toBe(false);
    expect(h.annuler()?.apres).toEqual(['w']);
    expect(h.annuler()?.apres).toEqual(['y']);
    expect(h.annuler()).toBeUndefined();
  });
});
