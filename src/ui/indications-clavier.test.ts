// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { estFrappeDeRaccourci, indicationsTouchesVisibles, installerIndicationsClavier, type FrappeLue } from './indications-clavier';

describe('indicationsTouchesVisibles', () => {
  it('montre les touches sur un ordinateur', () => {
    expect(indicationsTouchesVisibles(false, false)).toBe(true);
  });
  it('les cache sur un appareil tactile sans clavier', () => {
    expect(indicationsTouchesVisibles(true, false)).toBe(false);
  });
  it('les rend dès qu’une touche est pressée sur un appareil tactile', () => {
    expect(indicationsTouchesVisibles(true, true)).toBe(true);
  });
});

const FRAPPE: FrappeLue = { key: 'e', code: 'KeyE', isTrusted: true, isComposing: false, keyCode: 69, ctrlKey: false, altKey: false, metaKey: false, dansUnChamp: false };

describe('estFrappeDeRaccourci', () => {
  it('accepte une vraie frappe d’un raccourci du jeu', () => {
    expect(estFrappeDeRaccourci(FRAPPE)).toBe(true);
    expect(estFrappeDeRaccourci({ ...FRAPPE, key: ' ', code: 'Space' })).toBe(true);
  });
  it('refuse un événement fabriqué, une composition, le code 229 et un champ de saisie', () => {
    expect(estFrappeDeRaccourci({ ...FRAPPE, isTrusted: false })).toBe(false);
    expect(estFrappeDeRaccourci({ ...FRAPPE, isComposing: true })).toBe(false);
    expect(estFrappeDeRaccourci({ ...FRAPPE, keyCode: 229 })).toBe(false);
    expect(estFrappeDeRaccourci({ ...FRAPPE, dansUnChamp: true })).toBe(false);
  });
  it('refuse une touche qui n’est pas un raccourci du jeu, ou une combinaison avec Ctrl', () => {
    expect(estFrappeDeRaccourci({ ...FRAPPE, key: 'x', code: 'KeyX' })).toBe(false);
    expect(estFrappeDeRaccourci({ ...FRAPPE, key: 'Unidentified', code: '' })).toBe(false);
    expect(estFrappeDeRaccourci({ ...FRAPPE, ctrlKey: true })).toBe(false);
  });
});

describe('installerIndicationsClavier', () => {
  const fenetre = (tactile: boolean): Window => {
    const f = new EventTarget() as unknown as Window;
    Object.assign(f, { matchMedia: () => ({ matches: tactile, addEventListener: () => undefined, removeEventListener: () => undefined }) });
    return f;
  };

  it('pose l’attribut sur un appareil tactile puis le retire à la première touche', () => {
    const doc = document.implementation.createHTMLDocument('');
    const f = fenetre(true);
    const retirer = installerIndicationsClavier(doc, f, false);
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(true);
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(true);
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(false);
    retirer();
  });

  it('ignore un événement fabriqué et une frappe dans un champ de saisie', () => {
    const doc = document.implementation.createHTMLDocument('');
    const f = fenetre(true);
    installerIndicationsClavier(doc, f);
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(true);
    const champ = document.createElement('input');
    const g = fenetre(true);
    installerIndicationsClavier(doc, g, false);
    const e = new KeyboardEvent('keydown', { key: 'e' });
    Object.defineProperty(e, 'target', { value: champ });
    g.dispatchEvent(e);
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(true);
  });

  it('ne pose rien avec une souris', () => {
    const doc = document.implementation.createHTMLDocument('');
    installerIndicationsClavier(doc, fenetre(false), false);
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(false);
  });
});
