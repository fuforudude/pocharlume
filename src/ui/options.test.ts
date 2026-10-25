// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Depot, Session, StockageMemoire } from '../save';
import { afficherOptions } from './options';

afterEach(() => {
  document.body.replaceChildren();
});

async function ouvrirSession(): Promise<Session> {
  return Session.ouvrir(new Depot(new StockageMemoire()));
}

describe('options par-dessus un écran', () => {
  it('Échap les ferme même quand le focus n’est pas dedans', async () => {
    const surFermer = vi.fn();
    afficherOptions(document.body, await ouvrirSession(), surFermer);
    (document.activeElement as HTMLElement | null)?.blur();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(surFermer).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ecran.options')).toBeNull();
  });

  it('une fois fermées, elles n’écoutent plus le clavier', async () => {
    const surFermer = vi.fn();
    afficherOptions(document.body, await ouvrirSession(), surFermer);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(surFermer).toHaveBeenCalledTimes(1);
  });

  it('les touches pressées dans les options ne remontent pas à l’écran dessous', async () => {
    afficherOptions(document.body, await ouvrirSession(), vi.fn());
    const dessous = vi.fn();
    window.addEventListener('keydown', dessous);
    document.querySelector('.ecran.options button')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(dessous).not.toHaveBeenCalled();
    window.removeEventListener('keydown', dessous);
  });
});
