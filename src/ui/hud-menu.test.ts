// @vitest-environment happy-dom
// Le menu en cercle du HUD et le déblocage progressif : un bouton verrouillé montre le cadenas et la pastille du niveau de
// campagne qui l'ouvre, sans prix, et se refait quand l'élément change d'état.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { REGION1 } from '../data/niveaux/region1';
import { appliquerAction, creerPartie } from '../engine';
import type { LieuTour } from '../engine';
import { CONFIG, ct } from '../engine/aides.test-utils';
import type { EtatPartie } from '../engine';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Hud, type CommandesHud } from './hud';
import { elementsCaseVide, elementsMenu, type ElementMenu } from './menu-cercle';

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

<<<<<<< HEAD
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
=======
describe('menu du HUD : changement de lieu à contenu identique', () => {
  /** Le lieu visé par l'action du bouton `i`, tel que le HUD le transmet à `choisirElement`. */
  function lieuVise(cmd: CommandesHud, i: number): LieuTour | undefined {
    const bouton = document.querySelectorAll<HTMLButtonElement>('.element-menu')[i];
    if (!bouton) throw new Error('bouton absent');
    bouton.click();
    const choisir = vi.mocked(cmd.choisirElement);
    const action = choisir.mock.calls.at(-1)?.[0].action;
    if (!action || !('cx' in action || 'place' in action)) return undefined;
    return action.place !== undefined ? { place: action.place } : { cx: action.cx, cy: action.cy };
  }

  function monterAvec(etat: EtatPartie): { hud: Hud; cmd: CommandesHud } {
    const cmd = commandes();
    return { hud: new Hud(document.body, ATLAS, etat, cmd, new AbortController().signal), cmd };
  }

  it('deux cases vides : le bouton construit sur la dernière case touchée', () => {
    const etat = partie(10);
    const { hud, cmd } = monterAvec(etat);
    const a = { cx: ct(0).cx, cy: ct(0).cy };
    const b = { cx: ct(1).cx, cy: ct(1).cy };
    hud.placerMenu(elementsMenu(etat, a), 1, 200, 200, 800, 600, 64);
    const avant = document.querySelectorAll('.element-menu')[1];
    hud.placerMenu(elementsMenu(etat, b), 2, 300, 300, 800, 600, 64);
    // Même nœud : le menu n'a pas été reconstruit, ce sont bien les éléments qui ont été repris.
    expect(document.querySelectorAll('.element-menu')[1]).toBe(avant);
    expect(lieuVise(cmd, 1)).toEqual(b);
  });

  it('deux places du radeau identiques : le bouton vise la dernière place touchée', () => {
    const niveau = CAMPAGNE[105]?.niveau;
    if (niveau?.gimmick?.type !== 'radeau') throw new Error('niveau 106 sans radeau');
    const etat = creerPartie({ ...niveau, numero: 106 }, CONFIG);
    etat.aretes = 5000;
    const { hud, cmd } = monterAvec(etat);
    hud.placerMenu(elementsCaseVide(etat, { place: 0 }), 1, 200, 200, 800, 600, 64);
    hud.placerMenu(elementsCaseVide(etat, { place: 1 }), 2, 300, 300, 800, 600, 64);
    expect(lieuVise(cmd, 1)).toEqual({ place: 1 });
  });

  it('deux tours identiques : vendre ou améliorer vise la dernière tour touchée', () => {
    const etat = partie(10);
    const a = { cx: ct(0).cx, cy: ct(0).cy };
    const b = { cx: ct(1).cx, cy: ct(1).cy };
    for (const lieu of [a, b]) {
      expect(appliquerAction(etat, { type: 'construire', tour: 'tir', ...lieu }).ok).toBe(true);
    }
    const { hud, cmd } = monterAvec(etat);
    hud.placerMenu(elementsMenu(etat, a), 1, 200, 200, 800, 600, 64);
    const avant = [...document.querySelectorAll('.element-menu')];
    hud.placerMenu(elementsMenu(etat, b), 2, 300, 300, 800, 600, 64);
    const apres = [...document.querySelectorAll('.element-menu')];
    expect(apres.length).toBe(avant.length);
    apres.forEach((noeud, i) => {
      expect(noeud).toBe(avant[i]);
    });
    for (let i = 0; i < apres.length; i++) expect(lieuVise(cmd, i)).toEqual(b);
  });

  it('même prix mais icône et libellé différents : le bouton montre la nouvelle tour', () => {
    const etat = partie(10);
    const { hud } = monterAvec(etat);
    const a = elementsMenu(etat, { cx: ct(0).cx, cy: ct(0).cy });
    hud.placerMenu(a, 1, 200, 200, 800, 600, 64);
    const autre = a.map((e, i) => (i === 1 ? { ...e, icone: 'tour-autre', libelle: 'Autre tour' } : e));
    hud.placerMenu(autre, 2, 200, 200, 800, 600, 64);
    const bouton = document.querySelectorAll<HTMLButtonElement>('.element-menu')[1];
    expect(bouton?.querySelector('img.icone')?.getAttribute('src')).toBe('tour-autre.png');
    expect(bouton?.getAttribute('aria-label')).toBe('Autre tour');
    // Même icône, libellé seul différent : mis à jour en place.
    const libelle = autre.map((e, i) => (i === 1 ? { ...e, libelle: 'Encore une autre' } : e));
    hud.placerMenu(libelle, 3, 200, 200, 800, 600, 64);
    expect(document.querySelectorAll('.element-menu')[1]).toBe(bouton);
    expect(bouton?.getAttribute('aria-label')).toBe('Encore une autre');
  });

  it('un bouton survolé pendant le changement de case renvoie le survol du nouvel élément', () => {
    const etat = partie(10);
    const { hud, cmd } = monterAvec(etat);
    const a = { cx: ct(0).cx, cy: ct(0).cy };
    const b = { cx: ct(1).cx, cy: ct(1).cy };
    hud.placerMenu(elementsMenu(etat, a), 1, 200, 200, 800, 600, 64);
    const bouton = document.querySelectorAll<HTMLButtonElement>('.element-menu')[1];
    bouton?.focus();
    expect(document.activeElement).toBe(bouton);
    const nouveaux = elementsMenu(etat, b);
    hud.placerMenu(nouveaux, 2, 300, 300, 800, 600, 64);
    expect(document.querySelectorAll('.element-menu')[1]).toBe(bouton);
    const dernier = vi.mocked(cmd.survolerElement).mock.calls.at(-1)?.[0];
    expect(dernier).toBe(nouveaux[1]);
  });

  it('deux mises à jour en place au même contenu ne réécrivent ni texte ni libellé', () => {
    const etat = partie(10);
    const { hud } = monterAvec(etat);
    const liste = elementsMenu(etat, { cx: ct(0).cx, cy: ct(0).cy });
    hud.placerMenu(liste, 1, 200, 200, 800, 600, 64);
    const prix = document.querySelector('.element-menu .prix span:not(.arete)');
    const texte = prix?.firstChild;
    expect(texte).not.toBeNull();
    const observateur = new MutationObserver(() => undefined);
    const cible = document.querySelector('.element-menu');
    if (!cible || !prix) throw new Error('bouton absent');
    observateur.observe(cible, { subtree: true, characterData: true, childList: true, attributes: true });
    hud.placerMenu([...liste], 2, 200, 200, 800, 600, 64);
    hud.placerMenu([...liste], 3, 200, 200, 800, 600, 64);
    expect(observateur.takeRecords()).toEqual([]);
    expect(prix.firstChild).toBe(texte);
    observateur.disconnect();
  });

  it('fermer puis rouvrir : boutons retirés, survol effacé, puis boutons recréés', () => {
    const etat = partie(10);
    const { hud, cmd } = monterAvec(etat);
    const liste = elementsMenu(etat, { cx: ct(0).cx, cy: ct(0).cy });
    hud.placerMenu(liste, 1, 200, 200, 800, 600, 64);
    const avant = document.querySelectorAll('.element-menu')[0];
    expect(avant).toBeDefined();
    vi.mocked(cmd.survolerElement).mockClear();
    hud.placerMenu(null, 2, 200, 200, 800, 600, 64);
    expect(document.querySelectorAll('.element-menu').length).toBe(0);
    expect(cmd.survolerElement).toHaveBeenCalledWith(null);
    hud.placerMenu(liste, 1, 200, 200, 800, 600, 64);
    const apres = document.querySelectorAll('.element-menu');
    expect(apres.length).toBe(liste.length);
    expect(apres[0]).not.toBe(avant);
>>>>>>> origin/main
  });
});
