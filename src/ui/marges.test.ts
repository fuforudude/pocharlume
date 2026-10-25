import { describe, expect, it } from 'vitest';
import { calculerMarges, type Rectangle } from './marges';

const ECRAN = { largeur: 844, hauteur: 390 };
const SANS_ENCOCHE = { haut: 0, bas: 0, gauche: 0, droite: 0 };

function rect(gauche: number, haut: number, droite: number, bas: number): Rectangle {
  return { left: gauche, top: haut, right: droite, bottom: bas };
}

describe('calculerMarges', () => {
  it('la barre du haut recouvre le haut de l’écran jusqu’à son bord bas', () => {
    const m = calculerMarges(ECRAN, [rect(6, 6, 200, 50), rect(700, 6, 838, 50)], [], SANS_ENCOCHE);
    expect(m.haut).toBe(50);
    expect(m.bas).toBe(0);
  });

  it('les boutons du bas recouvrent le bas de l’écran depuis le plus haut d’entre eux', () => {
    const m = calculerMarges(ECRAN, [], [rect(6, 330, 200, 384), rect(700, 312, 838, 384)], SANS_ENCOCHE);
    expect(m.bas).toBe(390 - 312);
    expect(m.haut).toBe(0);
  });

  it('l’encoche et les zones système comptent, même sans bouton', () => {
    const m = calculerMarges(ECRAN, [], [], { haut: 0, bas: 21, gauche: 47, droite: 47 });
    expect(m).toEqual({ haut: 0, bas: 21, gauche: 47, droite: 47 });
  });

  it('prend le plus grand de la zone sûre et de la barre', () => {
    const m = calculerMarges(ECRAN, [rect(0, 0, 100, 30)], [], { haut: 44, bas: 0, gauche: 0, droite: 0 });
    expect(m.haut).toBe(44);
  });

  it('une marge ne dépasse jamais 40 % de l’écran, pour qu’il reste de la carte à voir', () => {
    const m = calculerMarges(ECRAN, [rect(0, 0, 844, 380)], [rect(0, 10, 844, 390)], SANS_ENCOCHE);
    expect(m.haut).toBeCloseTo(390 * 0.4, 6);
    expect(m.bas).toBeCloseTo(390 * 0.4, 6);
  });

  it('ignore un rectangle vide, hors écran ou invalide', () => {
    const m = calculerMarges(ECRAN, [rect(0, 0, 0, 0), rect(0, Number.NaN, 10, Number.NaN), rect(0, -20, 50, -5)], [rect(0, 500, 10, 520)], SANS_ENCOCHE);
    expect(m).toEqual({ haut: 0, bas: 0, gauche: 0, droite: 0 });
  });
});
