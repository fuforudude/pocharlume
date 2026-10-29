// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { indicationsTouchesVisibles, installerIndicationsClavier } from './indications-clavier';

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

describe('installerIndicationsClavier', () => {
  const fenetre = (tactile: boolean): Window => {
    const f = new EventTarget() as unknown as Window;
    Object.assign(f, { matchMedia: () => ({ matches: tactile, addEventListener: () => undefined, removeEventListener: () => undefined }) });
    return f;
  };

  it('pose l’attribut sur un appareil tactile puis le retire à la première touche', () => {
    const doc = document.implementation.createHTMLDocument('');
    const f = fenetre(true);
    const retirer = installerIndicationsClavier(doc, f);
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(true);
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified' }));
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(true);
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(false);
    retirer();
  });

  it('ne pose rien avec une souris', () => {
    const doc = document.implementation.createHTMLDocument('');
    installerIndicationsClavier(doc, fenetre(false));
    expect(doc.documentElement.hasAttribute('data-sans-clavier')).toBe(false);
  });
});
