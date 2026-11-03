// @vitest-environment happy-dom
// Les panneaux d'entrée dans une vraie partie (lancerNiveau) : leurs pastilles ne captent jamais le toucher, un toucher court
// atteint la case dessous, et leur bulle s'ouvre depuis le canvas (survol de la souris, appui long du doigt).
// Le rendu Canvas et l'atlas sont remplacés par des doublures, comme dans bulles-partie.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { REGION1 } from '../data/niveaux/region1';
import { VERSION_DONNEES } from '../data/version';
import { casesLibres, centreCase, creerPartie, validerAction } from '../engine';
import type { ConfigPartie } from '../engine';
import { tCle } from '../i18n';
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

describe('pastilles des panneaux d’entrée', () => {
  /** Fait couvrir par la première pastille le rectangle de la case de construction CASE (1 tuile = 16 px). */
  function recouvrirCase(): HTMLElement {
    const puce = document.querySelector<HTMLElement>('.puce-ennemi[data-type]');
    if (!puce) throw new Error('pastille absente');
    const gauche = CENTRE.x * 16 - 12;
    const haut = CENTRE.y * 16 - 12;
    puce.getBoundingClientRect = (): DOMRect => ({ left: gauche, top: haut, right: gauche + 24, bottom: haut + 24, width: 24, height: 24, x: gauche, y: haut, toJSON: () => ({}) });
    return puce;
  }

  it('ne captent pas le toucher : un toucher court sur une pastille ouvre le menu de la case dessous', async () => {
    const partie = await demarrer();
    const puce = recouvrirCase();
    expect(puce.style.pointerEvents).not.toBe('auto');
    toucher(canvas(), CENTRE.x * 16, CENTRE.y * 16, 50);
    images(1);
    expect(partie.mode.type).toBe('menu');
    expect(bulle()).toBeNull();
  });

  it('un appui long sur une pastille ouvre la bulle de l’ennemi sans agir sur la case', async () => {
    const partie = await demarrer();
    const puce = recouvrirCase();
    const type = puce.dataset['type'] ?? '';
    toucher(canvas(), CENTRE.x * 16, CENTRE.y * 16, DELAI_APPUI_LONG_MS);
    images(1);
    expect(bulle()?.textContent).toContain(tCle(ENNEMIS[type as keyof typeof ENNEMIS].nom));
    expect(partie.mode.type).not.toBe('menu');
  });

  it('au survol de la souris, la bulle de l’ennemi s’ouvre après le délai, depuis le canvas', async () => {
    await demarrer();
    const puce = recouvrirCase();
    const type = puce.dataset['type'] ?? '';
    pointeur(canvas(), 'pointermove', 'mouse', CENTRE.x * 16, CENTRE.y * 16);
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulle()?.textContent).toContain(tCle(ENNEMIS[type as keyof typeof ENNEMIS].nom));
  });
});
