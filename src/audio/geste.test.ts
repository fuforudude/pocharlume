// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELAI_CURSEUR_MS, installerGestes } from './geste';
import type { IdSon } from './table';

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});

function cible(): { debloquer: ReturnType<typeof vi.fn<() => void>>; jouer: ReturnType<typeof vi.fn<(id: IdSon) => boolean>> } {
  return { debloquer: vi.fn<() => void>(), jouer: vi.fn<(id: IdSon) => boolean>(() => true) };
}

describe('gestes et son', () => {
  it('débloque l\'audio au premier geste (clic, touche, relâchement)', () => {
    const c = cible();
    const retirer = installerGestes(c);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    document.dispatchEvent(new Event('pointerup'));
    document.dispatchEvent(new Event('touchend'));
    expect(c.debloquer).toHaveBeenCalledTimes(3);
    retirer();
  });

  it('un clic sur un bouton joue « clic », même si le bouton arrête la propagation', () => {
    const c = cible();
    const retirer = installerGestes(c);
    const b = document.createElement('button');
    b.addEventListener('click', (e) => { e.stopPropagation(); });
    const icone = document.createElement('span');
    b.append(icone);
    document.body.append(b);
    icone.click();
    expect(c.jouer).toHaveBeenCalledWith('clic');
    retirer();
  });

  it('un bouton grisé est muet (le jeu joue « refus » de son côté) et le reste de la page aussi', () => {
    const c = cible();
    const retirer = installerGestes(c);
    const b = document.createElement('button');
    b.setAttribute('aria-disabled', 'true');
    const vide = document.createElement('div');
    document.body.append(b, vide);
    b.click();
    vide.click();
    expect(c.jouer).not.toHaveBeenCalled();
    retirer();
  });

  it('un curseur de volume relâché fait entendre un clic, après le délai qui laisse enregistrer le réglage', () => {
    vi.useFakeTimers();
    const c = cible();
    const retirer = installerGestes(c);
    const curseur = document.createElement('input');
    curseur.type = 'range';
    const texte = document.createElement('input');
    document.body.append(curseur, texte);
    texte.dispatchEvent(new Event('change', { bubbles: true }));
    curseur.dispatchEvent(new Event('change', { bubbles: true }));
    expect(c.jouer).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DELAI_CURSEUR_MS);
    expect(c.jouer).toHaveBeenCalledTimes(1);
    retirer();
  });

  it('retirer les écouteurs les coupe', () => {
    const c = cible();
    installerGestes(c)();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(c.debloquer).not.toHaveBeenCalled();
  });
});
