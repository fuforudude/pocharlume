// @vitest-environment happy-dom
// L'écran de la carte du monde : clavier, mise en pause sous les options, confirmation avant d'écraser une partie en
// cours. Le rendu Canvas est remplacé par une doublure (happy-dom n'a pas de Canvas 2D).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtlasRendu } from '../render/atlas';
import { sauvegardeVide } from '../save';
import { t } from '../i18n';
import { afficherCarteMonde, type EcranCarteMonde, type OptionsCarteMonde } from './carte-monde';

const rendu = vi.hoisted(() => ({ dessiner: vi.fn() }));

vi.mock('../render/carte-monde', () => ({
  RenduCarteMonde: class {
    camera = { deplacer: vi.fn(), debutPincement: vi.fn(), pincement: vi.fn(), molette: vi.fn(), decalageX: 0, decalageY: 0, vueL: 512, vueH: 288 };
    ratio = 1;
    rayonToucher = 20;
    cadrer = vi.fn();
    centrerSur = vi.fn();
    redimensionner = vi.fn();
    dessiner = rendu.dessiner;
    enMondeX = (x: number): number => x;
    enMondeY = (y: number): number => y;
  },
}));

const ATLAS = { iconeUrl: () => 'icone.png' } as unknown as AtlasRendu;

let file = new Map<number, FrameRequestCallback>();
let prochainId = 0;

function images(n: number): void {
  for (let i = 0; i < n; i++) {
    const rappels = [...file.values()];
    file = new Map();
    for (const rappel of rappels) rappel(i * 16);
  }
}

function appuyer(touche: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: touche, bubbles: true }));
}

function fiche(): Element | null {
  return document.querySelector('.ecran.fiche');
}

function confirmation(): Element | null {
  return document.querySelector('.ecran.confirmation');
}

function bouton(texte: string): HTMLButtonElement {
  const trouve = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === texte);
  if (!trouve) throw new Error(`Bouton introuvable : ${texte}`);
  return trouve;
}

interface Montage {
  readonly ecran: EcranCarteMonde;
  readonly surLancer: ReturnType<typeof vi.fn>;
  readonly surRetour: ReturnType<typeof vi.fn>;
}

function monter(supplement: Partial<OptionsCarteMonde> = {}): Montage {
  const surLancer = vi.fn();
  const surRetour = vi.fn();
  const ecran = afficherCarteMonde(document.body, {
    atlas: ATLAS,
    session: { sauvegarde: sauvegardeVide(), choisirHeros: vi.fn(), equiperObjets: vi.fn() },
    difficulte: 'matou',
    surLancer,
    surOptions: vi.fn(),
    surHeros: vi.fn(),
    surBoutique: vi.fn(),
    surRetour,
    ...supplement,
  });
  return { ecran, surLancer, surRetour };
}

beforeEach(() => {
  file = new Map();
  prochainId = 0;
  rendu.dessiner.mockClear();
  vi.stubGlobal('requestAnimationFrame', (rappel: FrameRequestCallback): number => {
    prochainId++;
    file.set(prochainId, rappel);
    return prochainId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number): void => { file.delete(id); });
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('carte du monde : clavier', () => {
  it('Entrée ouvre la fiche du niveau sélectionné, Échap la ferme, puis Échap quitte la carte', () => {
    const { surRetour } = monter();
    appuyer('Enter');
    expect(fiche()).not.toBeNull();
    appuyer('Escape');
    expect(fiche()).toBeNull();
    expect(surRetour).not.toHaveBeenCalled();
    appuyer('Escape');
    expect(surRetour).toHaveBeenCalledTimes(1);
  });
});

describe('carte du monde : suspendue sous les options', () => {
  it('ignore le clavier : Entrée n’ouvre pas de fiche cachée, Échap ne quitte pas la carte', () => {
    const { ecran, surRetour } = monter();
    ecran.suspendre(true);
    appuyer('Enter');
    appuyer(' ');
    appuyer('ArrowRight');
    appuyer('Escape');
    appuyer('Backspace');
    expect(fiche()).toBeNull();
    expect(surRetour).not.toHaveBeenCalled();
    ecran.suspendre(false);
    appuyer('Enter');
    expect(fiche()).not.toBeNull();
  });

  it('arrête sa boucle de dessin, et la reprend ensuite', () => {
    const { ecran } = monter();
    images(3);
    expect(rendu.dessiner).toHaveBeenCalledTimes(3);
    ecran.suspendre(true);
    images(5);
    expect(rendu.dessiner).toHaveBeenCalledTimes(3);
    expect(file.size).toBe(0);
    ecran.suspendre(false);
    images(2);
    expect(rendu.dessiner).toHaveBeenCalledTimes(5);
  });

  it('suspendre ou reprendre une carte arrêtée ne relance rien', () => {
    const { ecran } = monter();
    ecran.arreter();
    ecran.suspendre(false);
    ecran.suspendre(true);
    ecran.suspendre(false);
    images(2);
    expect(rendu.dessiner).not.toHaveBeenCalled();
  });
});

describe('carte du monde : lancer un niveau', () => {
  it('lance tout de suite quand aucune partie n’est en cours', () => {
    const { surLancer } = monter();
    appuyer('Enter');
    bouton(t('fiche.lancer')).click();
    expect(surLancer).toHaveBeenCalledTimes(1);
    expect(confirmation()).toBeNull();
  });

  it('avec une partie en cours reprenable, prévient qu’elle sera perdue et attend la confirmation', () => {
    const { surLancer } = monter({ partieEnCours: { niveau: 3, vague: 4 } });
    appuyer('Enter');
    bouton(t('fiche.lancer')).click();
    expect(surLancer).not.toHaveBeenCalled();
    const avertissement = confirmation();
    expect(avertissement).not.toBeNull();
    expect(avertissement?.textContent).toContain(t('lancer.perte_titre'));
    expect(avertissement?.textContent).toContain(t('lancer.perte_detail', { n: 3, m: 4 }));
    bouton(t('lancer.confirmer')).click();
    expect(surLancer).toHaveBeenCalledTimes(1);
  });

  it('annuler garde la carte et la fiche, sans rien lancer', () => {
    const { surLancer, surRetour } = monter({ partieEnCours: { niveau: 3, vague: 4 } });
    appuyer('Enter');
    bouton(t('fiche.lancer')).click();
    bouton(t('lancer.annuler')).click();
    expect(confirmation()).toBeNull();
    expect(fiche()).not.toBeNull();
    expect(surLancer).not.toHaveBeenCalled();
    expect(surRetour).not.toHaveBeenCalled();
  });

  it('Échap ferme seulement l’avertissement', () => {
    const { surLancer, surRetour } = monter({ partieEnCours: { niveau: 3, vague: 4 } });
    appuyer('Enter');
    bouton(t('fiche.lancer')).click();
    appuyer('Escape');
    expect(confirmation()).toBeNull();
    expect(fiche()).not.toBeNull();
    expect(surLancer).not.toHaveBeenCalled();
    expect(surRetour).not.toHaveBeenCalled();
  });
});
