// @vitest-environment happy-dom
// L'écran de secours « Notes » : touche de secours, bascule éditeur ↔ jeu, pause du jeu, isolement du clavier, mémoire.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLE_NOTES, EVENEMENT_SECOURS, estToucheDeSecours, installerNotes, memoireNotes, type MemoireNotes } from './notes';

const touche = (key: string, extra: Partial<Record<'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey', boolean>> & { code?: string } = {}) => ({
  key,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
  ...extra,
});

describe('estToucheDeSecours', () => {
  it('reconnaît F2 seule et Ctrl+Maj+Espace', () => {
    expect(estToucheDeSecours(touche('F2'))).toBe(true);
    expect(estToucheDeSecours(touche(' ', { ctrlKey: true, shiftKey: true, code: 'Space' }))).toBe(true);
  });

  it('refuse les autres touches et les combinaisons voisines', () => {
    expect(estToucheDeSecours(touche('F3'))).toBe(false);
    expect(estToucheDeSecours(touche(' ', { code: 'Space' }))).toBe(false);
    expect(estToucheDeSecours(touche('F2', { ctrlKey: true }))).toBe(false);
    expect(estToucheDeSecours(touche('F2', { shiftKey: true }))).toBe(false);
    expect(estToucheDeSecours(touche('F2', { altKey: true }))).toBe(false);
    expect(estToucheDeSecours(touche(' ', { ctrlKey: true, code: 'Space' }))).toBe(false);
    expect(estToucheDeSecours(touche('p'))).toBe(false);
  });
});

describe('memoireNotes', () => {
  it('relit ce qui a été écrit, dans le stockage', () => {
    const donnees = new Map<string, string>();
    const stockage = { getItem: (c: string) => donnees.get(c) ?? null, setItem: (c: string, v: string) => void donnees.set(c, v) };
    const memoire = memoireNotes(stockage);
    expect(memoire.lire()).toBe('');
    memoire.ecrire('bonjour');
    expect(donnees.get(CLE_NOTES)).toBe('bonjour');
    expect(memoireNotes(stockage).lire()).toBe('bonjour');
  });

  it('garde le texte en mémoire quand le stockage refuse', () => {
    const refus = {
      getItem: (): string | null => {
        throw new Error('bloqué');
      },
      setItem: (): void => {
        throw new Error('bloqué');
      },
    };
    const memoire = memoireNotes(refus);
    expect(memoire.lire()).toBe('');
    memoire.ecrire('toujours là');
    expect(memoire.lire()).toBe('toujours là');
  });
});

describe('installerNotes', () => {
  let app: HTMLElement;
  let memoire: MemoireNotes;
  let ecrit: string;
  let fin: AbortController;

  beforeEach(() => {
    document.body.replaceChildren();
    app = document.createElement('div');
    app.id = 'app';
    document.body.append(app);
    fin = new AbortController();
    ecrit = 'note de départ';
    memoire = { lire: () => ecrit, ecrire: (texte) => { ecrit = texte; } };
  });
  afterEach(() => {
    fin.abort();
    vi.restoreAllMocks();
  });

  const frapper = (cible: EventTarget, init: KeyboardEventInit): KeyboardEvent => {
    const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    cible.dispatchEvent(e);
    return e;
  };

  it('affiche l’éditeur d’abord, le jeu caché, l’onglet nommé Notes', () => {
    const ecran = installerNotes(app, memoire, fin.signal);
    expect(ecran.estAffiche()).toBe(true);
    expect(app.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.notes')?.hidden).toBe(false);
    expect(document.querySelector<HTMLTextAreaElement>('.notes-texte')?.value).toBe('note de départ');
    expect(document.title).toBe('Notes');
  });

  it('F2 bascule vers le jeu puis revient aux notes, sans répétition de la touche tenue', () => {
    const ecran = installerNotes(app, memoire, fin.signal);
    frapper(document.body, { key: 'F2' });
    expect(ecran.estAffiche()).toBe(false);
    expect(app.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.notes')?.hidden).toBe(true);
    frapper(document.body, { key: 'F2', repeat: true });
    expect(ecran.estAffiche()).toBe(false);
    frapper(document.body, { key: ' ', code: 'Space', ctrlKey: true, shiftKey: true });
    expect(ecran.estAffiche()).toBe(true);
    expect(app.hidden).toBe(true);
  });

  it('prévient le jeu à chaque affichage de l’éditeur', () => {
    const recus: boolean[] = [];
    document.addEventListener(EVENEMENT_SECOURS, (e) => recus.push((e as CustomEvent<{ notes: boolean }>).detail.notes), { signal: fin.signal });
    installerNotes(app, memoire, fin.signal);
    frapper(document.body, { key: 'F2' });
    frapper(document.body, { key: 'F2' });
    expect(recus).toEqual([true, false, true]);
  });

  it('ne laisse passer aucune touche tapée dans l’éditeur jusqu’aux commandes du jeu', () => {
    installerNotes(app, memoire, fin.signal);
    const vues: string[] = [];
    window.addEventListener('keydown', (e) => vues.push(e.key), { signal: fin.signal });
    document.addEventListener('keydown', (e) => vues.push(e.key), { signal: fin.signal });
    const zone = document.querySelector<HTMLTextAreaElement>('.notes-texte');
    if (!zone) throw new Error('éditeur absent');
    frapper(zone, { key: 'p' });
    frapper(zone, { key: ' ', code: 'Space' });
    expect(vues).toEqual([]);
  });

  it('ne laisse pas non plus passer une touche quand le focus est ailleurs que dans l’éditeur', () => {
    installerNotes(app, memoire, fin.signal);
    const vues: string[] = [];
    document.addEventListener('keydown', (e) => vues.push(e.key), { signal: fin.signal });
    frapper(document.body, { key: 'q' });
    expect(vues).toEqual([]);
  });

  it('enregistre ce qui est tapé', () => {
    installerNotes(app, memoire, fin.signal);
    const zone = document.querySelector<HTMLTextAreaElement>('.notes-texte');
    if (!zone) throw new Error('éditeur absent');
    zone.value = 'nouveau texte';
    zone.dispatchEvent(new Event('input', { bubbles: true }));
    expect(ecrit).toBe('nouveau texte');
  });
});
