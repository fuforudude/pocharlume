// @vitest-environment happy-dom
// La fiche d'un niveau montre ses ennemis (icônes tirées de ses vagues figées, « nouveau » signalé, bulle au survol) et la barre de la
// carte a son bouton Bestiaire. Le rendu Canvas est remplacé par une doublure, comme dans carte-monde-fiche.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { rencontrerEnnemis, sauvegardeVide, type Sauvegarde } from '../save';
import { DELAI_SURVOL_MS, fermerBulle } from './bulle';
import { ennemisDuNiveau } from './bestiaire-logique';
import { afficherCarteMonde, type OptionsCarteMonde } from './carte-monde';

vi.mock('../render/carte-monde', () => ({
  RenduCarteMonde: class {
    camera = { deplacer: vi.fn(), debutPincement: vi.fn(), pincement: vi.fn(), molette: vi.fn(), decalageX: 0, decalageY: 0, vueL: 512, vueH: 288 };
    ratio = 1;
    rayonToucher = 20;
    cadrer = vi.fn();
    centrerSur = vi.fn();
    redimensionner = vi.fn();
    dessiner = vi.fn();
    enMondeX = (x: number): number => x;
    enMondeY = (y: number): number => y;
  },
}));

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;
const NIVEAU1 = REGION1[0];
if (!NIVEAU1) throw new Error('niveau 1 absent');
const IDS = ennemisDuNiveau(NIVEAU1.niveau);

function monter(sauvegarde: Sauvegarde, supplement: Partial<OptionsCarteMonde> = {}) {
  afficherCarteMonde(document.body, {
    atlas: ATLAS,
    session: { sauvegarde, choisirHeros: vi.fn(), equiperObjets: vi.fn() },
    difficulte: 'matou',
    surLancer: vi.fn(),
    surOptions: vi.fn(),
    surHeros: vi.fn(),
    surBoutique: vi.fn(),
    surRetour: vi.fn(),
    ...supplement,
  });
}

function ouvrirFiche(): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (): number => 1);
  vi.stubGlobal('cancelAnimationFrame', (): void => undefined);
});

afterEach(() => {
  fermerBulle();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fiche d’un niveau : ses ennemis', () => {
  it('montre une icône par ennemi des vagues du niveau, tous « nouveau » pour un joueur qui n’en a rencontré aucun', () => {
    monter(sauvegardeVide());
    ouvrirFiche();
    const icones = [...document.querySelectorAll<HTMLElement>('.ennemi-niveau')];
    expect(icones.map((i) => i.dataset.ennemi)).toEqual(IDS);
    expect(icones.every((i) => i.classList.contains('nouveau'))).toBe(true);
    expect(document.querySelectorAll('.ennemi-niveau-nouveau')).toHaveLength(IDS.length);
  });

  it('ne signale plus « nouveau » ceux déjà rencontrés', () => {
    const premier = IDS[0] ?? '';
    monter(rencontrerEnnemis(sauvegardeVide(), [premier]).sauvegarde);
    ouvrirFiche();
    const icones = [...document.querySelectorAll<HTMLElement>('.ennemi-niveau')];
    expect(icones[0]?.classList.contains('nouveau')).toBe(false);
    expect(icones[0]?.getAttribute('aria-label')).toBe(tCle(`ennemi.${premier}`));
    expect(icones.slice(1).every((i) => i.classList.contains('nouveau'))).toBe(true);
  });

  it('chaque icône a la bulle de son ennemi (PV de la difficulté cochée)', () => {
    vi.useFakeTimers();
    monter(sauvegardeVide());
    ouvrirFiche();
    const icone = document.querySelector<HTMLElement>('.ennemi-niveau');
    if (!icone) throw new Error('icône absente');
    icone.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', bubbles: true }));
    vi.advanceTimersByTime(DELAI_SURVOL_MS + 10);
    expect(document.body.textContent).toContain(tCle(`ennemi.${IDS[0] ?? ''}`));
    expect(document.querySelector('.bulle')).not.toBeNull();
  });

  it('chaque icône est focusable au clavier (la bulle s’ouvre au focus) et porte un libellé', () => {
    monter(sauvegardeVide());
    ouvrirFiche();
    const icones = [...document.querySelectorAll<HTMLElement>('.ennemi-niveau')];
    expect(icones.length).toBeGreaterThan(0);
    for (const i of icones) {
      expect(i.tabIndex, i.dataset.ennemi).toBeGreaterThanOrEqual(0);
      expect(i.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('la rangée disparaît avec la fiche', () => {
    monter(sauvegardeVide());
    ouvrirFiche();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('.ennemis-niveau')).toBeNull();
  });
});

describe('barre de la carte : Bestiaire', () => {
  it('le bouton appelle surBestiaire ; sans callback, il n’y en a pas', () => {
    const surBestiaire = vi.fn();
    monter(sauvegardeVide(), { surBestiaire });
    const b = [...document.querySelectorAll<HTMLButtonElement>('.carte-barre button')].find((x) => x.textContent === t('bestiaire.bouton'));
    b?.click();
    expect(surBestiaire).toHaveBeenCalledTimes(1);
    document.body.replaceChildren();
    monter(sauvegardeVide());
    expect([...document.querySelectorAll('.carte-barre button')].some((x) => x.textContent === t('bestiaire.bouton'))).toBe(false);
  });
});
