// @vitest-environment happy-dom
// La boucle d'une partie (lancerNiveau) avec un faux requestAnimationFrame : le temps ne passe que quand le test
// l'ordonne. Le rendu Canvas et l'atlas sont remplacés par des doublures (happy-dom n'a pas de Canvas 2D) ; le
// moteur, le HUD, les écrans de pause et de fin, les gestes et le clavier sont les vrais.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { VERSION_DONNEES } from '../data/version';
import { casesLibres, centreCase, creerPartie, deserialiser, serialiser, step, validerAction } from '../engine';
import type { Action, ConfigPartie, EtatPartie } from '../engine';
import { t } from '../i18n';
import { graineSuivante, lancerNiveau, type OptionsPartie, type PartieEnCours, type ResultatPartie } from './partie';

const rendu = vi.hoisted(() => ({
  /** Le cinquième argument (skins et familier équipés) de chaque `new Rendu(…)`. */
  collections: [] as unknown[],
  apresPas: vi.fn(),
  synchroniser: vi.fn(),
  dessiner: vi.fn(),
  definirMarges: vi.fn(),
}));

const son = vi.hoisted(() => ({
  jouerEvenements: vi.fn(),
  jouerInterface: vi.fn(),
}));

vi.mock('../audio', () => ({
  audio: { jouerEvenements: son.jouerEvenements },
  jouerInterface: son.jouerInterface,
}));

vi.mock('../render/atlas', () => ({
  chargerAtlas: () =>
    Promise.resolve({
      iconeUrl: () => 'icone.png',
      sprite: () => undefined,
      animation: () => undefined,
      dessiner: () => undefined,
    }),
}));

// Un tuile = 16 pixels CSS, sans décalage : le test touche un point de la carte en multipliant ses tuiles par 16.
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
    apresPas = rendu.apresPas;
    synchroniser = rendu.synchroniser;
    dessiner = rendu.dessiner;
    definirMarges = rendu.definirMarges;
    constructor(_canvas: unknown, _atlas: unknown, _carte: unknown, _visuel: unknown, collection?: unknown) {
      rendu.collections.push(collection);
    }
    redimensionner = vi.fn();
    enTuilesX = (x: number): number => x / 16;
    enTuilesY = (y: number): number => y / 16;
    enCssX = (x: number): number => x * 16;
    enCssY = (y: number): number => y * 16;
  },
}));

const NIVEAU = REGION1[0];
if (!NIVEAU) throw new Error('niveau 1 absent');
/** Une case libre du niveau 1 où toutes les familles se construisent (un chemin est à portée de la caserne), et son centre. */
const ESSAI = creerPartie(NIVEAU.niveau, { graine: 1, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES });
const CASE = casesLibres(ESSAI).find((c) => validerAction(ESSAI, { type: 'construire', ...c, tour: 'caserne' }) === null);
if (!CASE) throw new Error('aucune case libre');
const CENTRE = centreCase(CASE.cx, CASE.cy);
const CONFIG: ConfigPartie = { graine: 7, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };
const IMAGE_MS = 50;

// --- Horloge et requestAnimationFrame factices ---

let horloge = 0;
let prochainId = 0;
let file = new Map<number, FrameRequestCallback>();

/** Joue `n` images de `IMAGE_MS` millisecondes chacune. */
function images(n: number): void {
  for (let i = 0; i < n; i++) {
    horloge += IMAGE_MS;
    const rappels = [...file.values()];
    file = new Map();
    for (const rappel of rappels) rappel(horloge);
  }
}

/** Joue des images jusqu'à ce que la condition soit vraie (au plus `max`). */
function imagesJusqua(condition: () => boolean, max = 2000): void {
  for (let i = 0; i < max && !condition(); i++) images(1);
  expect(condition()).toBe(true);
}

// --- Montage ---

let parties: PartieEnCours[] = [];
let fins: ResultatPartie[] = [];
let vagues: number[] = [];

async function demarrer(options: OptionsPartie = {}, config: ConfigPartie = CONFIG): Promise<PartieEnCours> {
  const partie = await lancerNiveau(NIVEAU as NonNullable<typeof NIVEAU>, config, (r) => { fins.push(r); }, {
    parent: document.body,
    surDemarrage: (p) => { parties.push(p); },
    surVague: (etat) => { vagues.push(etat.vagues.lancees); },
    ...options,
  });
  return partie;
}

/** Une partie sauvegardée au début de sa première vague, relue comme le fait `reprendrePartie`. */
function etatRepris(): EtatPartie {
  const etat = creerPartie(NIVEAU?.niveau as NonNullable<typeof NIVEAU>['niveau'], CONFIG);
  while (etat.vagues.lancees < 1) step(etat);
  return deserialiser(serialiser(etat));
}

function appuyer(touche: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: touche, code: touche.length === 1 ? `Key${touche.toUpperCase()}` : touche, bubbles: true }));
}

function boutonDe(selecteur: string): HTMLButtonElement {
  const noeud = document.querySelector<HTMLButtonElement>(selecteur);
  if (!noeud) throw new Error(`Bouton introuvable : ${selecteur}`);
  return noeud;
}

function boutonTexte(texte: string): HTMLButtonElement {
  const trouve = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === texte && !b.closest('[hidden]'));
  if (!trouve) throw new Error(`Bouton introuvable : ${texte}`);
  return trouve;
}

function reprendre(): void {
  boutonTexte(t('pause.reprendre')).click();
}

function messageAffiche(): string {
  return document.querySelector('.hud .message')?.textContent ?? '';
}

/** Un toucher du canvas à un point de la carte (tuiles). */
function toucherCarte(x: number, y: number): void {
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('canvas absent');
  const evenement = (type: string): PointerEvent =>
    new PointerEvent(type, { pointerId: 1, pointerType: 'touch', clientX: x * 16, clientY: y * 16, button: 0, bubbles: true });
  canvas.dispatchEvent(evenement('pointerdown'));
  canvas.dispatchEvent(evenement('pointerup'));
}

function journalDe(partie: PartieEnCours, type: Action['type']): number {
  return partie.etat.journal.filter((e) => e.action.type === type).length;
}

const CONSTRUIRE: Action = { type: 'construire', ...CASE, tour: 'tir' };

beforeEach(() => {
  horloge = 0;
  prochainId = 0;
  file = new Map();
  parties = [];
  fins = [];
  vagues = [];
  rendu.collections.length = 0;
  for (const spy of [rendu.apresPas, rendu.synchroniser, rendu.dessiner, rendu.definirMarges, ...Object.values(son)]) spy.mockClear();
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
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('action du joueur', () => {
  it('à vitesse ×1, une action n’est appliquée qu’une fois', async () => {
    const partie = await demarrer();
    partie.envoyer(CONSTRUIRE);
    images(10);
    expect(journalDe(partie, 'construire')).toBe(1);
    expect(partie.etat.tours).toHaveLength(1);
  });

  it('à vitesse ×2 (plusieurs pas par image), une action n’est appliquée qu’une fois', async () => {
    const partie = await demarrer({ vitesse: 2 });
    partie.envoyer(CONSTRUIRE);
    images(10);
    expect(journalDe(partie, 'construire')).toBe(1);
    expect(partie.etat.tours).toHaveLength(1);
    // Plusieurs pas ont bien été simulés dans la même image.
    expect(partie.mesures.pasSimules).toBeGreaterThan(10);
  });

  it('pendant la pause, l’action reste dans la file puis est appliquée une seule fois à la reprise', async () => {
    const partie = await demarrer();
    images(2);
    appuyer('p');
    const pasEnPause = partie.etat.pas;
    partie.envoyer(CONSTRUIRE);
    images(10);
    expect(partie.etat.pas).toBe(pasEnPause);
    expect(journalDe(partie, 'construire')).toBe(0);
    appuyer('p');
    images(10);
    expect(journalDe(partie, 'construire')).toBe(1);
    expect(partie.etat.tours).toHaveLength(1);
  });

  it('deux demandes d’appel de vague dans la même image n’en font qu’une, sans message de refus', async () => {
    await demarrer();
    const appel = boutonDe('.bouton.vague');
    appel.click();
    appel.click();
    images(3);
    expect(parties[0] && journalDe(parties[0], 'appelerVague')).toBe(1);
    expect(messageAffiche()).toBe('');
  });
});

describe('vagues', () => {
  it('surVague est appelée une fois par vague lancée, dans l’ordre', async () => {
    const partie = await demarrer({ vitesse: 2 });
    imagesJusqua(() => partie.etat.vagues.lancees >= 3);
    expect(vagues).toEqual([1, 2, 3].slice(0, vagues.length));
    expect(vagues).toHaveLength(partie.etat.vagues.lancees);
  });
});

describe('reprise', () => {
  it('une partie reprise démarre en pause : rien ne bouge tant que le joueur n’a pas repris', async () => {
    const reprise = etatRepris();
    const pas = reprise.pas;
    const partie = await demarrer({ reprise }, reprise.config);
    images(20);
    expect(partie.etat.pas).toBe(pas);
    expect(document.querySelector<HTMLElement>('.ecran.pause')?.hidden).toBe(false);
    reprendre();
    images(5);
    expect(partie.etat.pas).toBeGreaterThan(pas);
  });

  it('ne rejoue pas les événements du pas sauvegardé : le suivi est synchronisé sans effets', async () => {
    const reprise = etatRepris();
    // Le pas sauvegardé contient l'événement de lancement de la vague.
    expect(reprise.evenements.some((e) => e.type === 'vague')).toBe(true);
    await demarrer({ reprise }, reprise.config);
    expect(rendu.synchroniser).toHaveBeenCalledTimes(1);
    expect(rendu.apresPas).not.toHaveBeenCalled();
    reprendre();
    images(3);
    expect(rendu.apresPas).toHaveBeenCalled();
  });
});

describe('fin de partie', () => {
  it('surFin est appelée une seule fois, même après l’écran de fin', async () => {
    const partie = await demarrer();
    partie.etat.vies = 0;
    imagesJusqua(() => fins.length > 0);
    images(100);
    expect(fins).toHaveLength(1);
    expect(fins[0]?.statut).toBe('defaite');
    expect(document.querySelector('.ecran.fin')).not.toBeNull();
  });

  it('« Rejouer » repart d’une partie neuve avec une autre graine', async () => {
    const partie = await demarrer();
    imagesJusqua(() => partie.etat.vagues.lancees >= 1);
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    boutonTexte(t('fin.rejouer')).click();
    await vi.waitFor(() => { expect(parties).toHaveLength(2); });
    const neuve = parties[1];
    expect(neuve).toBeDefined();
    expect(neuve?.etat).not.toBe(partie.etat);
    expect(neuve?.etat.pas).toBe(0);
    expect(neuve?.etat.vagues.lancees).toBe(0);
    expect(neuve?.etat.vies).toBe(neuve?.etat.viesDepart);
    expect(neuve?.etat.config.graine).toBe(graineSuivante(CONFIG.graine));
    expect(document.querySelectorAll('.partie')).toHaveLength(1);
  });

  it('« Rejouer » après une partie reprise lance une partie neuve, pas la reprise', async () => {
    const reprise = etatRepris();
    const partie = await demarrer({ reprise }, reprise.config);
    reprendre();
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    boutonTexte(t('fin.rejouer')).click();
    await vi.waitFor(() => { expect(parties).toHaveLength(2); });
    const neuve = parties[1];
    expect(neuve?.etat.pas).toBe(0);
    expect(neuve?.etat.vagues.lancees).toBe(0);
    expect(neuve?.etat.config.graine).toBe(graineSuivante(reprise.config.graine));
    // Une partie neuve ne démarre pas en pause.
    images(5);
    expect(neuve?.etat.pas).toBeGreaterThan(0);
  });
});

describe('son', () => {
  it('transmet au son les événements de chaque pas, avec l’état de la partie', async () => {
    const partie = await demarrer();
    imagesJusqua(() => partie.etat.vagues.lancees >= 1);
    expect(son.jouerEvenements).toHaveBeenCalled();
    expect(son.jouerEvenements.mock.calls.every(([, etat]) => etat === partie.etat)).toBe(true);
    const types = son.jouerEvenements.mock.calls.flatMap((appel) => (appel[0] as readonly { type: string }[]).map((e) => e.type));
    expect(types).toContain('vague');
  });

  it('joue « refus » quand un geste est refusé, et pas quand il passe', async () => {
    const partie = await demarrer();
    expect(son.jouerInterface).not.toHaveBeenCalled();
    const sort = partie.etat.sorts[0];
    if (!sort) throw new Error('pas de sort');
    sort.recharge = 100;
    boutonDe('.bouton.sort').click();
    expect(son.jouerInterface).toHaveBeenCalledWith('refus');
  });
});

describe('retour visible des gestes refusés', () => {
  it('un sort en recharge affiche pourquoi', async () => {
    const partie = await demarrer();
    const sort = partie.etat.sorts[0];
    if (!sort) throw new Error('pas de sort');
    sort.recharge = 100;
    boutonDe('.bouton.sort').click();
    expect(messageAffiche()).toBe(t('refus.sort_en_recharge'));
  });

  it('un choix grisé du menu d’une case affiche pourquoi', async () => {
    const partie = await demarrer();
    partie.etat.aretes = 0;
    toucherCarte(CENTRE.x, CENTRE.y);
    images(2);
    expect(partie.mode.type).toBe('menu');
    const choix = document.querySelector<HTMLButtonElement>('.element-menu.grise');
    expect(choix).not.toBeNull();
    choix?.click();
    expect(messageAffiche()).toBe(t('refus.aretes_insuffisantes'));
  });

  it('en défi Fer, le menu d’une case ne propose que les familles du niveau, et une touche interdite dit pourquoi', async () => {
    const avecFer = { ...NIVEAU, niveau: { ...NIVEAU.niveau, defiFer: { familles: ['tir', 'magie'] as [string, string] } } };
    const partie = await lancerNiveau(avecFer, { ...CONFIG, defi: 'fer', bonus: { tours: {}, heros: {} } }, () => undefined, {
      parent: document.body,
      surDemarrage: (p) => { parties.push(p); },
    });
    partie.etat.aretes = 5000;
    toucherCarte(CENTRE.x, CENTRE.y);
    images(2);
    expect(partie.mode.type).toBe('menu');
    const libelles = [...document.querySelectorAll('.element-menu')].map((e) => e.getAttribute('aria-label') ?? '');
    expect(libelles).toHaveLength(2);
    // Touche 4 : artillerie, interdite par ce défi.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '4', code: 'Digit4', bubbles: true }));
    images(1);
    expect(messageAffiche()).toBe(t('refus.famille_interdite'));
  });

  it('un ordre au héros hors du chemin affiche pourquoi', async () => {
    const partie = await demarrer();
    boutonDe('.bouton.portrait').click();
    expect(partie.mode.type).toBe('heros');
    const loin = pointHorsChemin(partie.etat);
    toucherCarte(loin.x, loin.y);
    expect(messageAffiche()).toBe(t('refus.hors_chemin'));
    // On reste en visée pour retoucher ailleurs.
    expect(partie.mode.type).toBe('heros');
  });

  it('un sort lancé hors du chemin affiche pourquoi', async () => {
    const partie = await demarrer();
    // Les Renforts (touche W) ne se lancent que sur le chemin.
    appuyer('w');
    expect(partie.mode.type).toBe('sort');
    const loin = pointHorsChemin(partie.etat, { type: 'lancerSort', emplacement: 1, x: 0, y: 0 });
    toucherCarte(loin.x, loin.y);
    expect(messageAffiche()).toBe(t('refus.hors_chemin'));
    expect(partie.mode.type).toBe('sort');
  });
});

/** Un point de la carte que le moteur refuse parce qu'il est loin du chemin. */
function pointHorsChemin(etat: EtatPartie, modele: Action = { type: 'deplacerHeros', x: 0, y: 0 }): { x: number; y: number } {
  for (let y = 0.5; y < etat.niveau.carte.hauteur; y += 1) {
    for (let x = 0.5; x < etat.niveau.carte.largeur; x += 1) {
      const action = { ...modele, x, y } as Action;
      if (validerAction(etat, action) === 'hors_chemin') return { x, y };
    }
  }
  throw new Error('aucun point hors chemin');
}

describe('objets emportés', () => {
  const AVEC_OBJETS: ConfigPartie = { ...CONFIG, objets: ['herbe_sabbat', 'fiole_soufre'] };

  it('le HUD montre un bouton par objet emporté, avec sa touche', async () => {
    await demarrer({}, AVEC_OBJETS);
    const boutons = [...document.querySelectorAll('.bouton.objet')];
    expect(boutons).toHaveLength(2);
    expect(boutons.map((b) => b.querySelector('.touche')?.textContent)).toEqual(['A', 'Z']);
    expect(boutons[0]?.getAttribute('aria-label')).toBe(t('hud.objet', { nom: 'Herbe de Sabbat' }));
  });

  it('sans objet emporté, aucun bouton d’objet', async () => {
    await demarrer();
    expect(document.querySelectorAll('.bouton.objet')).toHaveLength(0);
  });

  it('un objet global (Herbe de Sabbat) s’utilise d’un toucher sur son bouton, sans toucher la carte ; il est ensuite grisé', async () => {
    const partie = await demarrer({}, AVEC_OBJETS);
    partie.etat.vies = partie.etat.viesDepart - 3;
    boutonDe('.bouton.objet').click();
    expect(partie.mode.type).toBe('libre');
    images(3);
    expect(journalDe(partie, 'utiliserObjet')).toBe(1);
    expect(partie.etat.objetsUtilises).toEqual([true, false]);
    // L'Herbe de Sabbat rend 5 vies sans dépasser les vies de départ.
    expect(partie.etat.vies).toBe(partie.etat.viesDepart);
    expect(document.querySelector('.bouton.objet')?.classList.contains('grise')).toBe(true);
    // Un second essai est refusé avec sa raison, sans autre action au journal.
    boutonDe('.bouton.objet').click();
    expect(messageAffiche()).toBe(t('refus.objet_utilise'));
    expect(journalDe(partie, 'utiliserObjet')).toBe(1);
  });

  it('l’Herbe de Sabbat avec les vies pleines est refusée, dite, et n’est pas consommée', async () => {
    const partie = await demarrer({}, AVEC_OBJETS);
    boutonDe('.bouton.objet').click();
    images(2);
    expect(messageAffiche()).toBe(t('refus.vies_pleines'));
    expect(journalDe(partie, 'utiliserObjet')).toBe(0);
    expect(partie.etat.objetsUtilises).toEqual([false, false]);
  });

  it('un objet ciblé (Fiole de Soufre) : toucher l’objet puis un point de la carte l’utilise', async () => {
    const partie = await demarrer({}, AVEC_OBJETS);
    const boutons = document.querySelectorAll<HTMLButtonElement>('.bouton.objet');
    boutons[1]?.click();
    expect(partie.mode).toEqual({ type: 'objet', emplacement: 1 });
    toucherCarte(10, 5);
    images(3);
    expect(journalDe(partie, 'utiliserObjet')).toBe(1);
    expect(partie.etat.objetsUtilises).toEqual([false, true]);
  });

  it('les touches A (objet global, direct) et Z (objet ciblé, en visée) ; Échap annule la visée', async () => {
    const partie = await demarrer({}, AVEC_OBJETS);
    appuyer('a');
    expect(partie.mode.type).toBe('libre');
    expect(messageAffiche()).toBe(t('refus.vies_pleines'));
    appuyer('z');
    expect(partie.mode).toEqual({ type: 'objet', emplacement: 1 });
    images(1);
    expect(document.querySelector('.invite')?.textContent).toBe(t('invite.objet', { nom: 'Fiole de Soufre' }));
    appuyer('Escape');
    expect(partie.mode.type).toBe('libre');
    appuyer('r');
    expect(messageAffiche()).toBe(t('refus.objet_inconnu'));
  });

  it('surObjet est appelé juste après chaque utilisation, avec l’objet déjà marqué utilisé (pour sauvegarder la partie)', async () => {
    const vus: boolean[][] = [];
    const surObjet = vi.fn((etat: EtatPartie) => { vus.push([...etat.objetsUtilises]); });
    const partie = await demarrer({ surObjet }, { ...CONFIG, objets: ['sablier', 'fiole_soufre'] });
    images(2);
    expect(surObjet).not.toHaveBeenCalled();
    partie.envoyer({ type: 'utiliserObjet', emplacement: 0, x: 5, y: 5 });
    images(2);
    expect(surObjet).toHaveBeenCalledTimes(1);
    expect(vus).toEqual([[true, false]]);
    // Un objet refusé n'est pas un objet utilisé.
    partie.envoyer({ type: 'utiliserObjet', emplacement: 0, x: 5, y: 5 });
    images(2);
    expect(surObjet).toHaveBeenCalledTimes(1);
    partie.envoyer({ type: 'utiliserObjet', emplacement: 1, x: 5, y: 5 });
    images(2);
    expect(vus).toEqual([[true, false], [true, true]]);
  });
});

describe('butin et abandon', () => {
  const BILAN = {
    aretes: 48,
    braises: 2,
    xp: 120,
    nouvellesEtoiles: 3,
    heros: 'charlie' as const,
    niveauHeros: { avant: 1, apres: 2 },
    objetsConsommes: ['sablier' as const],
    objetsRendus: [],
  };

  it('l’écran de fin montre le butin que surFin promet : arêtes, braises, expérience, niveau gagné, objets consommés', async () => {
    const partie = await lancerNiveau(NIVEAU, CONFIG, () => Promise.resolve({ bilan: BILAN, refus: null }), { parent: document.body });
    parties.push(partie);
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    await vi.waitFor(() => { expect(document.querySelectorAll('.bilan-ligne').length).toBeGreaterThan(0); });
    const lignes = [...document.querySelectorAll('.bilan-ligne')].map((l) => l.textContent);
    expect(lignes).toEqual([
      t('fin.bilan_aretes', { n: 48 }),
      t('fin.bilan_braises', { n: 2 }),
      t('fin.bilan_xp', { n: 120, nom: 'Charlie, le Colosse' }),
      t('fin.bilan_niveau', { nom: 'Charlie, le Colosse', n: 2 }),
      t('fin.bilan_objets', { noms: 'Sablier' }),
    ]);
  });

  it('un butin refusé est dit, sans bloquer l’écran de fin', async () => {
    const partie = await lancerNiveau(NIVEAU, CONFIG, () => Promise.resolve({ bilan: null, refus: 'objets_invalides' as const }), { parent: document.body });
    parties.push(partie);
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    await vi.waitFor(() => { expect(document.querySelector('.bilan-refus')).not.toBeNull(); });
    expect(document.querySelector('.bilan-refus')?.textContent).toContain(t('meta.refus.objets_invalides'));
    expect(boutonTexte(t('fin.rejouer'))).toBeDefined();
  });

  it('la défaite et la victoire donnent à surFin les objets utilisés', async () => {
    const partie = await demarrer({}, { ...CONFIG, objets: ['herbe_sabbat', 'sablier'] });
    partie.envoyer({ type: 'utiliserObjet', emplacement: 1, x: 5, y: 5 });
    images(2);
    partie.etat.vies = 0;
    imagesJusqua(() => fins.length > 0);
    expect(fins[0]?.objetsUtilises).toEqual(['sablier']);
  });

  it('« Quitter » depuis la pause pendant la partie rend un abandon (pas une défaite) à enregistrer, avec les objets utilisés', async () => {
    const surQuitter = vi.fn();
    const partie = await demarrer({ surQuitter }, { ...CONFIG, objets: ['sablier', 'fiole_soufre'] });
    partie.envoyer({ type: 'utiliserObjet', emplacement: 0, x: 5, y: 5 });
    images(2);
    appuyer('p');
    boutonTexte(t('fin.quitter')).click();
    expect(surQuitter).toHaveBeenCalledTimes(1);
    const abandon = surQuitter.mock.calls[0]?.[0] as ResultatPartie | null;
    expect(abandon).toMatchObject({ statut: 'abandon', etoiles: 0, objetsUtilises: ['sablier'], niveau: NIVEAU.numero });
    expect(abandon?.config.objets).toEqual(['sablier', 'fiole_soufre']);
    expect(fins).toHaveLength(0);
  });

  it('« Rejouer » asynchrone : l’écran de fin attend la config, et reste en place si le lancement est refusé', async () => {
    let repondre: (config: ConfigPartie | null) => void = () => undefined;
    const nouvelleConfig = vi.fn(() => new Promise<ConfigPartie | null>((resolve) => { repondre = resolve; }));
    const partie = await demarrer({ nouvelleConfig }, CONFIG);
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    boutonTexte(t('fin.rejouer')).click();
    boutonTexte(t('fin.rejouer')).click(); // un second toucher ne relance pas une seconde fois
    expect(nouvelleConfig).toHaveBeenCalledTimes(1);
    expect(parties).toHaveLength(1);
    repondre(null);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(parties).toHaveLength(1);
    expect(document.querySelector('.ecran.fin')).not.toBeNull();
    // Une fois la réponse rendue, on peut réessayer, et une config acceptée relance.
    boutonTexte(t('fin.rejouer')).click();
    expect(nouvelleConfig).toHaveBeenCalledTimes(2);
    repondre({ ...CONFIG, graine: 123 });
    await vi.waitFor(() => { expect(parties).toHaveLength(2); });
    expect(parties[1]?.etat.config.graine).toBe(123);
  });

  it('« Quitter » après la fin ne rend rien à enregistrer : surFin l’a déjà fait', async () => {
    const surQuitter = vi.fn();
    const partie = await demarrer({ surQuitter });
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    boutonTexte(t('fin.quitter')).click();
    expect(surQuitter).toHaveBeenCalledWith(null);
    expect(fins).toHaveLength(1);
  });

  it('« Rejouer » demande la config de la nouvelle tentative à nouvelleConfig', async () => {
    const nouvelleConfig = vi.fn((precedente: ConfigPartie): ConfigPartie => ({ ...precedente, graine: 999, objets: [] }));
    const partie = await demarrer({ nouvelleConfig }, { ...CONFIG, objets: ['sablier'] });
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    boutonTexte(t('fin.rejouer')).click();
    await vi.waitFor(() => { expect(parties).toHaveLength(2); });
    expect(nouvelleConfig).toHaveBeenCalledTimes(1);
    expect(parties[1]?.etat.config).toMatchObject({ graine: 999, objets: [] });
  });
});

describe('apparence : skins équipés et familier du héros', () => {
  const EQUIPES = {
    skins: { tir: 'skin_tir_2', charlie: 'skin_charlie' },
    familiers: { charlie: 'familier_rat', suie: 'familier_chouette' },
  } as const;

  it('le rendu reçoit les skins équipés et le familier du héros joué', async () => {
    await demarrer({ equipes: EQUIPES });
    expect(rendu.collections).toEqual([{ skins: { tir: 'skin_tir_2', charlie: 'skin_charlie' }, familier: 'familier_rat' }]);
  });

  it('sans équipement donné, rien n’est habillé', async () => {
    await demarrer();
    expect(rendu.collections).toEqual([{ skins: {}, familier: null }]);
  });

  it('en défi Fer, l’apparence reste : seul le bonus est ignoré', async () => {
    const avecFer = { ...NIVEAU, niveau: { ...NIVEAU.niveau, defiFer: { familles: ['tir', 'caserne'] as [string, string] } } };
    const partie = await lancerNiveau(avecFer, { ...CONFIG, defi: 'fer', bonus: { tours: {}, heros: {} } }, () => undefined, {
      parent: document.body,
      surDemarrage: (p) => { parties.push(p); },
      equipes: EQUIPES,
    });
    expect(partie.etat.config.defi).toBe('fer');
    expect(rendu.collections[0]).toMatchObject({ familier: 'familier_rat', skins: { tir: 'skin_tir_2' } });
  });

  it('« Rejouer » garde l’apparence', async () => {
    const partie = await demarrer({ equipes: EQUIPES });
    partie.etat.vies = 0;
    imagesJusqua(() => document.querySelector('.ecran.fin') !== null);
    boutonTexte(t('fin.rejouer')).click();
    await vi.waitFor(() => { expect(parties).toHaveLength(2); });
    expect(rendu.collections).toHaveLength(2);
    expect(rendu.collections[1]).toEqual(rendu.collections[0]);
  });
});
