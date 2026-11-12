// @vitest-environment happy-dom
// Le menu en cercle du HUD et le déblocage progressif : un bouton verrouillé montre le cadenas et la pastille du niveau de
// campagne qui l'ouvre, sans prix, et se refait quand l'élément change d'état.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { creerPartie } from '../engine';
import { CONFIG, ct } from '../engine/aides.test-utils';
import type { EtatPartie } from '../engine';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Hud, type CommandesHud } from './hud';
import { elementsCaseVide, type ElementMenu } from './menu-cercle';

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;

function commandes(): CommandesHud {
  return {
    appelerVague: vi.fn(),
    changerVitesse: vi.fn(),
    basculerPause: vi.fn(),
    basculerSort: vi.fn(),
    basculerObjet: vi.fn(),
    basculerHeros: vi.fn(),
    choisirElement: vi.fn(),
    survolerElement: vi.fn(),
  };
}

/** Le niveau 1 de la campagne, joué sous le numéro `numero`. */
function partie(numero: number): EtatPartie {
  const niveau = REGION1[0]?.niveau;
  if (!niveau) throw new Error('niveau 1 absent');
  const etat = creerPartie({ ...niveau, numero }, CONFIG);
  etat.aretes = 5000;
  return etat;
}

function monter(etat: EtatPartie): Hud {
  return new Hud(document.body, ATLAS, etat, commandes(), new AbortController().signal);
}

function boutonDivine(): HTMLButtonElement {
  const divine = [...document.querySelectorAll<HTMLButtonElement>('.element-menu')].at(-1);
  if (!divine) throw new Error('bouton de la tour divine absent');
  return divine;
}

/** Les éléments de la case de test 0, constructible sur la carte du niveau 1. */
function elements(etat: EtatPartie): ElementMenu[] {
  return elementsCaseVide(etat, ct(0));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('menu du HUD : élément pas encore débloqué', () => {
  it('cadenas, pastille du niveau qui l’ouvre, pas de prix, libellé qui le dit', () => {
    const etat = partie(1);
    const hud = monter(etat);
    hud.placerMenu(elements(etat), 1, 200, 200, 800, 600, 64);
    const divine = boutonDivine();
    expect(divine.classList.contains('verrouille')).toBe(true);
    expect(divine.classList.contains('grise')).toBe(true);
    expect(divine.querySelector('img.cadenas')?.getAttribute('src')).toBe('icone-cadenas.png');
    expect(divine.querySelector('.pastille-niveau')?.textContent).toBe('10');
    expect(divine.querySelector('.prix')).toBeNull();
    const nom = tCle('tour.totem_du_colosse');
    expect(divine.getAttribute('aria-label')).toBe(t('menu.non_debloque', { nom: t('menu.construire', { nom }), n: 10 }));
    // Les tours ouvertes gardent leur prix et n'ont ni cadenas ni pastille.
    const tir = document.querySelectorAll<HTMLButtonElement>('.element-menu')[1];
    expect(tir?.querySelector('.prix')).not.toBeNull();
    expect(tir?.querySelector('.cadenas, .pastille-niveau')).toBeNull();
  });

  it('se refait quand l’élément se débloque : le cadenas part, le prix revient', () => {
    const etat = partie(1);
    const hud = monter(etat);
    hud.placerMenu(elements(etat), 1, 200, 200, 800, 600, 64);
    expect(boutonDivine().querySelector('.cadenas')).not.toBeNull();

    const ouvert = partie(10);
    hud.placerMenu(elements(ouvert), 2, 200, 200, 800, 600, 64);
    const divine = boutonDivine();
    expect(divine.classList.contains('verrouille')).toBe(false);
    expect(divine.querySelector('.cadenas, .pastille-niveau')).toBeNull();
    expect(divine.querySelector('.prix')?.textContent).toBe('400');

    // Et l'inverse : de nouveau verrouillé, sous un autre numéro.
    hud.placerMenu(elements(partie(4)), 3, 200, 200, 800, 600, 64);
    expect(boutonDivine().querySelector('.pastille-niveau')?.textContent).toBe('10');
    expect(boutonDivine().querySelector('.prix')).toBeNull();
  });
});

describe('portrait du héros dans le HUD', () => {
  const atlasAvec = (sprites: readonly string[]): AtlasRendu => ({
    iconeUrl: (nom: string) => `${nom}.png`,
    sprite: (nom: string) => (sprites.includes(nom) ? {} : undefined),
  }) as unknown as AtlasRendu;
  const visage = (): string | null | undefined => document.querySelector('.portrait img.visage')?.getAttribute('src');
  const monterAvec = (etat: EtatPartie, atlas: AtlasRendu): void => {
    new Hud(document.body, atlas, etat, commandes(), new AbortController().signal);
  };
  const moderne = (): EtatPartie => {
    const base = partie(1);
    return { ...base, niveau: { ...base.niveau, campagne: 'moderne' } };
  };

  it('dans le DLC, le portrait suit le sprite en jeu : l’étudiant', () => {
    const etat = moderne();
    const id = etat.config.heros;
    monterAvec(etat, atlasAvec([`moderne-heros-${id.replaceAll('_', '-')}`]));
    expect(visage()).toBe(`moderne-heros-${id.replaceAll('_', '-')}.png`);
  });

  it('dans le DLC sans atlas du DLC, le portrait garde le sprite de base', () => {
    monterAvec(moderne(), atlasAvec([]));
    expect(visage()).not.toContain('moderne-heros');
  });

  it('dans l’histoire, le portrait reste celui de l’histoire', () => {
    monterAvec(partie(1), atlasAvec(['moderne-heros-charlie', 'moderne-heros-brise-os']));
    expect(visage()).not.toContain('moderne-heros');
  });
});
