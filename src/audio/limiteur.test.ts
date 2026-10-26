import { describe, expect, it } from 'vitest';
import { FENETRE_MS, Limiteur, PLAFOND_PAR_PRIORITE } from './limiteur';

describe('limiteur de sons', () => {
  it('refuse une instance de plus du même son dans la fenêtre de 80 ms', () => {
    const l = new Limiteur();
    expect(l.autoriser('tir', 'basse', 2, 0)).toBe(true);
    expect(l.autoriser('tir', 'basse', 2, 10)).toBe(true);
    expect(l.autoriser('tir', 'basse', 2, 20)).toBe(false);
  });

  it("un autre son passe tant que le plafond total n'est pas atteint", () => {
    const l = new Limiteur();
    l.autoriser('tir', 'basse', 1, 0);
    expect(l.autoriser('coup', 'basse', 1, 0)).toBe(true);
  });

  it('rouvre la fenêtre une fois les 80 ms écoulées', () => {
    const l = new Limiteur();
    expect(l.autoriser('tir', 'basse', 1, 100)).toBe(true);
    expect(l.autoriser('tir', 'basse', 1, 100 + FENETRE_MS - 1)).toBe(false);
    expect(l.autoriser('tir', 'basse', 1, 100 + FENETRE_MS)).toBe(true);
  });

  it("un son refusé n'est pas compté", () => {
    const l = new Limiteur();
    l.autoriser('tir', 'basse', 1, 0);
    l.autoriser('tir', 'basse', 1, 5);
    expect(l.compte).toBe(1);
  });

  it('les sons importants passent quand les sons ordinaires ont saturé la fenêtre', () => {
    const l = new Limiteur();
    for (let i = 0; i < PLAFOND_PAR_PRIORITE.basse; i++) expect(l.autoriser(`bruit${String(i)}`, 'basse', 1, 0)).toBe(true);
    expect(l.autoriser('autre', 'basse', 1, 0)).toBe(false);
    expect(l.autoriser('autre', 'normale', 1, 0)).toBe(true);
    for (let i = 0; i < PLAFOND_PAR_PRIORITE.normale; i++) l.autoriser(`n${String(i)}`, 'normale', 1, 0);
    expect(l.autoriser('autre2', 'normale', 1, 0)).toBe(false);
    expect(l.autoriser('vague', 'haute', 1, 0)).toBe(true);
  });

  it('même un son important ne dépasse pas son plafond total', () => {
    const l = new Limiteur();
    for (let i = 0; i < PLAFOND_PAR_PRIORITE.haute; i++) expect(l.autoriser(`h${String(i)}`, 'haute', 1, 0)).toBe(true);
    expect(l.autoriser('trop', 'haute', 1, 0)).toBe(false);
  });

  it("une horloge qui recule repart d'une fenêtre vide", () => {
    const l = new Limiteur();
    l.autoriser('tir', 'basse', 1, 5000);
    expect(l.autoriser('tir', 'basse', 1, 100)).toBe(true);
  });
});
