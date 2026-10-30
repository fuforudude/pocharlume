// @vitest-environment happy-dom
// Les bulles de description dans une vraie partie (lancerNiveau) : menu de construction, portrait du héros, ennemis du
// canvas. Un appui long n'exécute jamais l'action, un toucher court garde la sienne, la partie ne se met pas en pause.
// Le rendu Canvas et l'atlas sont remplacés par des doublures, comme dans partie-boucle.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { HEROS } from '../data/heros';
import { REGION1 } from '../data/niveaux/region1';
import { TOURS } from '../data/tours';
import { VERSION_DONNEES } from '../data/version';
import { ajouterEnnemi, casesLibres, centreCase, creerPartie, validerAction } from '../engine';
import type { Action, ConfigPartie } from '../engine';
import { t, tCle } from '../i18n';
import { DELAI_APPUI_LONG_MS, DELAI_SURVOL_MS, fermerBulle } from './bulle';
import { lancerNiveau, type PartieEnCours } from './partie';

vi.mock('../audio', () => ({
  audio: { jouerEvenements: vi.fn() },
  jouerInterface: vi.fn(),
}));

vi.mock('../render/atlas', () => ({
  chargerAtlas: () => Promise.resolve({ iconeUrl: () => 'icone.png', sprite: () => undefined, animation: () => undefined, dessiner: () => undefined }),
}));

// Une tuile = 16 pixels CSS, sans décalage.
vi.mock('../render/rendu', () => ({
  Surbrillance: class {
    cx = -1;
    cy = -1;
    portee = 0;
    heros = false;
    sortRayon = 0;
    curseurX = 0;
    curseurY = 0;
    curseurActif = false;
  },
  Rendu: class {
    camera = { deplacer: vi.fn(), debutPincement: vi.fn(), pincement: vi.fn(), molette: vi.fn() };
    ratio = 1;
    pixelsCssParTuile = 16;
    apresPas = vi.fn();
    synchroniser = vi.fn();
    dessiner = vi.fn();
    definirMarges = vi.fn();
    redimensionner = vi.fn();
    enTuilesX = (x: number): number => x / 16;
    enTuilesY = (y: number): number => y / 16;
    enCssX = (x: number): number => x * 16;
    enCssY = (y: number): number => y * 16;
  },
}));

const NIVEAU = REGION1[0];
if (!NIVEAU) throw new Error('niveau 1 absent');
const CONFIG: ConfigPartie = { graine: 7, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };
const ESSAI = creerPartie(NIVEAU.niveau, CONFIG);
const CASE = casesLibres(ESSAI).find((c) => validerAction(ESSAI, { type: 'construire', ...c, tour: 'tir' }) === null);
if (!CASE) throw new Error('aucune case libre');
const CENTRE = centreCase(CASE.cx, CASE.cy);

let horloge = 0;
let file = new Map<number, FrameRequestCallback>();
let prochainId = 0;
let parties: PartieEnCours[] = [];

function images(n: number): void {
  for (let i = 0; i < n; i++) {
    horloge += 50;
    const rappels = [...file.values()];
    file = new Map();
    for (const rappel of rappels) rappel(horloge);
  }
}

async function demarrer(): Promise<PartieEnCours> {
  const partie = await lancerNiveau(NIVEAU as NonNullable<typeof NIVEAU>, CONFIG, () => undefined, { parent: document.body });
  parties.push(partie);
  images(1);
  return partie;
}

function canvas(): HTMLCanvasElement {
  const c = document.querySelector('canvas');
  if (!c) throw new Error('canvas absent');
  return c;
}

function pointeur(cible: EventTarget, type: string, pointerType: string, x: number, y: number, buttons = 0): void {
  cible.dispatchEvent(new PointerEvent(type, { pointerId: 1, pointerType, clientX: x, clientY: y, button: 0, buttons, bubbles: true }));
}

/** Un toucher du doigt sur l'élément ou le canvas, qui dure `duree` ms, puis le clic que le navigateur envoie. */
function toucher(cible: HTMLElement, x: number, y: number, duree: number): void {
  pointeur(cible, 'pointerdown', 'touch', x, y, 1);
  vi.advanceTimersByTime(duree);
  pointeur(cible, 'pointerup', 'touch', x, y);
  cible.click();
}

function bulle(): HTMLElement | null {
  const noeud = document.querySelector<HTMLElement>('.bulle');
  return noeud && !noeud.hidden ? noeud : null;
}

function boutonTir(): HTMLButtonElement {
  const def = TOURS.tir.niveaux[0];
  const trouve = [...document.querySelectorAll<HTMLButtonElement>('.element-menu')].find((b) => b.getAttribute('aria-label') === t('menu.construire', { nom: tCle(def.nom) }));
  if (!trouve) throw new Error('Bouton « construire : tir » introuvable');
  return trouve;
}

function journal(partie: PartieEnCours, type: Action['type']): number {
  return partie.etat.journal.filter((e) => e.action.type === type).length;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  horloge = 0;
  prochainId = 0;
  file = new Map();
  parties = [];
  vi.stubGlobal('requestAnimationFrame', (rappel: FrameRequestCallback): number => {
    prochainId++;
    file.set(prochainId, rappel);
    return prochainId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number): void => { file.delete(id); });
  vi.spyOn(performance, 'now').mockImplementation(() => horloge);
  const proto = HTMLElement.prototype as unknown as { setPointerCapture?: (id: number) => void };
  proto.setPointerCapture ??= (): void => undefined;
});

afterEach(() => {
  for (const partie of parties) partie.arreter();
  fermerBulle();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('menu de construction', () => {
  it('l’appui long montre la tour sans la construire ; le toucher court construit toujours', async () => {
    const partie = await demarrer();
    toucher(canvas(), CENTRE.x * 16, CENTRE.y * 16, 50);
    images(1);
    const tir = boutonTir();
    toucher(tir, 0, 0, DELAI_APPUI_LONG_MS);
    expect(bulle()?.textContent).toContain(tCle(TOURS.tir.niveaux[0].nom));
    images(3);
    expect(journal(partie, 'construire')).toBe(0);
    expect(partie.mode.type).toBe('menu');

    toucher(boutonTir(), 0, 0, 50);
    expect(bulle()).toBeNull();
    images(3);
    expect(journal(partie, 'construire')).toBe(1);
  });

  it('au survol de la souris, la bulle s’ouvre après le délai', async () => {
    await demarrer();
    toucher(canvas(), CENTRE.x * 16, CENTRE.y * 16, 50);
    images(1);
    const tir = boutonTir();
    tir.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulle()?.textContent).toContain(t('bulle.role.tir'));
  });
});

describe('portrait du héros', () => {
  it('l’appui long décrit le héros sans le sélectionner', async () => {
    const partie = await demarrer();
    const portrait = document.querySelector<HTMLButtonElement>('.bouton.portrait');
    if (!portrait) throw new Error('portrait absent');
    toucher(portrait, 0, 0, DELAI_APPUI_LONG_MS);
    expect(bulle()?.textContent).toContain(tCle(HEROS.charlie.role));
    expect(partie.mode.type).toBe('libre');
    toucher(portrait, 0, 0, 50);
    expect(partie.mode.type).toBe('heros');
  });
});

describe('ennemis sur la carte', () => {
  it('survol à la souris : nom et PV de l’ennemi, et la partie continue', async () => {
    const partie = await demarrer();
    const e = ajouterEnnemi(partie.etat, ENNEMIS.paysan_affame, 'paysan_affame', 0, 4);
    pointeur(canvas(), 'pointermove', 'mouse', e.x * 16, (e.y - 0.5) * 16);
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    const texte = bulle()?.textContent ?? '';
    expect(texte).toContain(tCle(ENNEMIS.paysan_affame.nom));
    expect(texte).toContain(t('bulle.pv_valeur', { n: Math.round(e.pv), m: Math.round(e.pvMax) }));
    const pas = partie.etat.pas;
    images(5);
    expect(partie.etat.pas).toBeGreaterThan(pas);
    // La souris quitte l'ennemi : la bulle se ferme.
    pointeur(canvas(), 'pointermove', 'mouse', 0, 0);
    expect(bulle()).toBeNull();
  });

  it('appui long sur un ennemi : sa bulle, et le relâché ne donne aucun ordre au héros sélectionné', async () => {
    const partie = await demarrer();
    const portrait = document.querySelector<HTMLButtonElement>('.bouton.portrait');
    portrait?.click();
    expect(partie.mode.type).toBe('heros');
    const e = ajouterEnnemi(partie.etat, ENNEMIS.mendiant, 'mendiant', 0, 4);
    toucher(canvas(), e.x * 16, (e.y - 0.5) * 16, DELAI_APPUI_LONG_MS);
    expect(bulle()?.textContent).toContain(tCle(ENNEMIS.mendiant.nom));
    images(3);
    expect(journal(partie, 'deplacerHeros')).toBe(0);
    expect(partie.mode.type).toBe('heros');
    // Le toucher suivant ferme la bulle et garde son effet : l'ordre part.
    toucher(canvas(), e.x * 16, (e.y - 0.5) * 16, 50);
    expect(bulle()).toBeNull();
    images(3);
    expect(journal(partie, 'deplacerHeros')).toBe(1);
  });
});
