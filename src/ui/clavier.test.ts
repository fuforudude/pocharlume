import { describe, expect, it } from 'vitest';
import { commandeClavier } from './clavier';

const touche = (key: string, code = '', extra: Record<string, boolean> = {}): ReturnType<typeof commandeClavier> =>
  commandeClavier({ key, code, ...extra });

describe('commandeClavier', () => {
  it('1 à 5 choisissent la tour dans l’ordre du menu, par touche physique (AZERTY compris)', () => {
    expect(touche('1', 'Digit1')).toEqual({ type: 'tour', famille: 'caserne' });
    expect(touche('&', 'Digit1')).toEqual({ type: 'tour', famille: 'caserne' });
    expect(touche('2', 'Digit2')).toEqual({ type: 'tour', famille: 'tir' });
    expect(touche('3', 'Numpad3')).toEqual({ type: 'tour', famille: 'magie' });
    expect(touche('4', 'Digit4')).toEqual({ type: 'tour', famille: 'artillerie' });
    expect(touche('5', 'Digit5')).toEqual({ type: 'tour', famille: 'divine' });
    expect(touche('6', 'Digit6')).toBeNull();
    expect(touche('0', 'Digit0')).toBeNull();
  });

  it('Q et W lancent les sorts 1 et 2, en minuscule comme en majuscule', () => {
    expect(touche('q', 'KeyQ')).toEqual({ type: 'sort', emplacement: 0 });
    expect(touche('W', 'KeyW')).toEqual({ type: 'sort', emplacement: 1 });
  });

  it('E sélectionne le héros, Espace appelle la vague, P met en pause, F change la vitesse', () => {
    expect(touche('e')).toEqual({ type: 'heros' });
    expect(touche(' ', 'Space')).toEqual({ type: 'vague' });
    expect(touche('p')).toEqual({ type: 'pause' });
    expect(touche('F')).toEqual({ type: 'vitesse' });
  });

  it('Échap annule', () => {
    expect(touche('Escape', 'Escape')).toEqual({ type: 'annuler' });
  });

  it('laisse au navigateur les combinaisons avec Ctrl, Alt et Méta', () => {
    expect(touche('p', 'KeyP', { ctrlKey: true })).toBeNull();
    expect(touche('f', 'KeyF', { metaKey: true })).toBeNull();
    expect(touche('1', 'Digit1', { altKey: true })).toBeNull();
  });

  it('ignore les autres touches', () => {
    expect(touche('a', 'KeyA')).toBeNull();
    expect(touche('Enter', 'Enter')).toBeNull();
    expect(touche('Shift', 'ShiftLeft')).toBeNull();
  });
});
