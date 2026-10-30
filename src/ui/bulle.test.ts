// @vitest-environment happy-dom
// La bulle de description : survol à la souris (après un court délai), appui long au doigt (sans déclencher l'action de
// l'élément), focus clavier, fermeture, accessibilité et placement toujours entièrement à l'écran.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIEUX } from '../data/dieux';
import { ENNEMIS } from '../data/ennemis';
import { TOURS } from '../data/tours';
import { tCle } from '../i18n';
import {
  attacherBulle,
  brancherBulles,
  BulleSurCarte,
  DELAI_APPUI_LONG_MS,
  DELAI_SURVOL_MS,
  fermerBulle,
  MARGE_BULLE,
  placerBulle,
} from './bulle';
import type { ContenuBulle } from './bulle-contenus';
import { SEUIL_GLISSEMENT } from './gestes';

const CONTENU: ContenuBulle = {
  titre: 'Clocher des Archers',
  sousTitre: 'Archers',
  lignes: [{ libelle: 'Portée', valeur: '3,5 case(s)' }],
  notes: ['Une note'],
  texte: 'Un peu de lore.',
};

function pointeur(cible: EventTarget, type: string, pointerType: string, x = 10, y = 10, pointerId = 1): void {
  cible.dispatchEvent(new PointerEvent(type, { pointerId, pointerType, clientX: x, clientY: y, button: 0, bubbles: type !== 'pointerenter' && type !== 'pointerleave' }));
}

function bulleVisible(): HTMLElement | null {
  const noeud = document.querySelector<HTMLElement>('.bulle');
  return noeud && !noeud.hidden ? noeud : null;
}

let bouton: HTMLButtonElement;
let action: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.replaceChildren();
  bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.title = 'Construire';
  bouton.setAttribute('aria-label', 'Construire');
  action = vi.fn<() => void>();
  bouton.addEventListener('click', action);
  document.body.append(bouton);
  attacherBulle(bouton, () => CONTENU);
});

afterEach(() => {
  fermerBulle();
  vi.useRealTimers();
});

/** Un toucher complet : appui, attente, relâché, puis le clic que le navigateur envoie. */
function toucher(cible: HTMLElement, duree: number): void {
  pointeur(cible, 'pointerdown', 'touch');
  vi.advanceTimersByTime(duree);
  pointeur(cible, 'pointerup', 'touch');
  cible.click();
}

describe('survol à la souris', () => {
  it('ouvre la bulle après le délai, pas avant, et la ferme en quittant l’élément', () => {
    pointeur(bouton, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS - 1);
    expect(bulleVisible()).toBeNull();
    vi.advanceTimersByTime(1);
    const bulle = bulleVisible();
    expect(bulle?.textContent).toContain(CONTENU.titre);
    expect(bulle?.textContent).toContain('3,5 case(s)');
    expect(bulle?.textContent).toContain(CONTENU.texte);
    pointeur(bouton, 'pointerleave', 'mouse');
    expect(bulleVisible()).toBeNull();
  });

  it('quitter avant le délai n’ouvre rien', () => {
    pointeur(bouton, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS / 2);
    pointeur(bouton, 'pointerleave', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulleVisible()).toBeNull();
  });

  it('remplace l’info-bulle native : plus de title, le libellé reste', () => {
    expect(bouton.hasAttribute('title')).toBe(false);
    expect(bouton.getAttribute('aria-label')).toBe('Construire');
  });

  it('un clic de souris garde son effet et referme la bulle', () => {
    pointeur(bouton, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    pointeur(bouton, 'pointerdown', 'mouse');
    bouton.click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(bulleVisible()).toBeNull();
  });
});

describe('appui long au doigt', () => {
  it('ouvre la bulle après le délai et n’exécute pas l’action', () => {
    pointeur(bouton, 'pointerdown', 'touch');
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS - 1);
    expect(bulleVisible()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(bulleVisible()).not.toBeNull();
    pointeur(bouton, 'pointerup', 'touch');
    bouton.click();
    expect(action).not.toHaveBeenCalled();
    // La bulle reste ouverte doigt levé, pour être lue.
    expect(bulleVisible()).not.toBeNull();
  });

  it('se ferme au prochain toucher, qui garde son effet', () => {
    toucher(bouton, DELAI_APPUI_LONG_MS);
    expect(bulleVisible()).not.toBeNull();
    toucher(bouton, 50);
    expect(bulleVisible()).toBeNull();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('le prochain toucher ailleurs ferme aussi la bulle', () => {
    toucher(bouton, DELAI_APPUI_LONG_MS);
    pointeur(document.body, 'pointerdown', 'touch', 300, 300, 2);
    expect(bulleVisible()).toBeNull();
  });

  it('un toucher court garde son effet, sans bulle', () => {
    toucher(bouton, DELAI_APPUI_LONG_MS - 100);
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS);
    expect(action).toHaveBeenCalledTimes(1);
    expect(bulleVisible()).toBeNull();
  });

  it('un doigt qui glisse (défilement) n’ouvre rien', () => {
    pointeur(bouton, 'pointerdown', 'touch', 10, 10);
    pointeur(bouton, 'pointermove', 'touch', 10, 10 + SEUIL_GLISSEMENT + 1);
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS * 2);
    expect(bulleVisible()).toBeNull();
  });

  it('un appui annulé par le système n’ouvre rien', () => {
    pointeur(bouton, 'pointerdown', 'touch');
    pointeur(bouton, 'pointercancel', 'touch');
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS * 2);
    expect(bulleVisible()).toBeNull();
  });

  it('empêche le menu contextuel du système pendant l’appui', () => {
    pointeur(bouton, 'pointerdown', 'touch');
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS);
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    bouton.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(true);
  });

  it('un appui long sur un élément sans contenu n’exécute pas non plus l’action (clic d’iOS avalé)', () => {
    const vide = document.createElement('button');
    const actionVide = vi.fn<() => void>();
    vide.addEventListener('click', actionVide);
    document.body.append(vide);
    attacherBulle(vide, () => null);
    toucher(vide, DELAI_APPUI_LONG_MS);
    expect(bulleVisible()).toBeNull();
    expect(actionVide).not.toHaveBeenCalled();
    toucher(vide, 50);
    expect(actionVide).toHaveBeenCalledTimes(1);
  });

  it('une touche du clavier après un appui long sans clic laisse passer l’activation suivante', () => {
    pointeur(bouton, 'pointerdown', 'touch');
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS);
    pointeur(bouton, 'pointercancel', 'touch');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    bouton.click();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('l’élément ne garde pas le focus après un appui long, et la bulle reste ouverte', () => {
    pointeur(bouton, 'pointerdown', 'touch');
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS);
    pointeur(bouton, 'pointerup', 'touch');
    // Le navigateur donne le focus au bouton touché juste avant le clic.
    bouton.focus();
    bouton.click();
    expect(document.activeElement).not.toBe(bouton);
    expect(bulleVisible()).not.toBeNull();
    expect(action).not.toHaveBeenCalled();
  });
});

describe('accessibilité', () => {
  it('la bulle est un role tooltip, liée à l’élément par aria-describedby tant qu’elle est ouverte', () => {
    pointeur(bouton, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    const bulle = bulleVisible();
    expect(bulle?.getAttribute('role')).toBe('tooltip');
    expect(bulle?.id).not.toBe('');
    expect(bouton.getAttribute('aria-describedby')).toBe(bulle?.id);
    pointeur(bouton, 'pointerleave', 'mouse');
    expect(bouton.hasAttribute('aria-describedby')).toBe(false);
  });

  it('s’ouvre au focus clavier et se ferme quand le focus part ou à Échap', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    bouton.focus();
    expect(bulleVisible()).not.toBeNull();
    bouton.blur();
    expect(bulleVisible()).toBeNull();
    bouton.focus();
    expect(bulleVisible()).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(bulleVisible()).toBeNull();
  });

  it('le focus donné par un clic (souris ou doigt) n’ouvre pas la bulle', () => {
    pointeur(bouton, 'pointerdown', 'mouse');
    bouton.focus();
    expect(bulleVisible()).toBeNull();
  });

  it('seuls Tab et les flèches comptent comme navigation au clavier', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    pointeur(document.body, 'pointerdown', 'mouse', 0, 0, 3);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    bouton.focus();
    expect(bulleVisible()).toBeNull();
    bouton.blur();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    bouton.focus();
    expect(bulleVisible()).not.toBeNull();
  });

  it('un élément qui ne prend pas le focus le reçoit (tabindex 0), sauf s’il est décoratif', () => {
    const carte = document.createElement('div');
    document.body.append(carte);
    attacherBulle(carte, () => CONTENU);
    expect(carte.tabIndex).toBe(0);
    const icone = document.createElement('img');
    document.body.append(icone);
    attacherBulle(icone, () => CONTENU, { focus: false });
    expect(icone.hasAttribute('tabindex')).toBe(false);
  });
});

describe('contenu et cycle de vie', () => {
  it('sans contenu (null), rien ne s’ouvre', () => {
    const vide = document.createElement('button');
    document.body.append(vide);
    attacherBulle(vide, () => null);
    pointeur(vide, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulleVisible()).toBeNull();
  });

  it('se met à jour pendant qu’elle est ouverte (PV qui baissent) et se ferme si l’élément quitte la page', () => {
    let pv = 40;
    const portrait = document.createElement('button');
    document.body.append(portrait);
    attacherBulle(portrait, () => ({ ...CONTENU, lignes: [{ libelle: 'PV', valeur: String(pv) }] }));
    pointeur(portrait, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulleVisible()?.textContent).toContain('40');
    pv = 12;
    vi.advanceTimersByTime(500);
    expect(bulleVisible()?.textContent).toContain('12');
    portrait.remove();
    vi.advanceTimersByTime(500);
    expect(bulleVisible()).toBeNull();
  });

  it('un signal annulé détache la bulle et la ferme', () => {
    const controleur = new AbortController();
    const autre = document.createElement('button');
    document.body.append(autre);
    attacherBulle(autre, () => CONTENU, { signal: controleur.signal });
    pointeur(autre, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulleVisible()).not.toBeNull();
    controleur.abort();
    expect(bulleVisible()).toBeNull();
    pointeur(autre, 'pointerenter', 'mouse');
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulleVisible()).toBeNull();
  });
});

describe('éléments décrits par des attributs (nouvelles découvertes, fiche d’un niveau)', () => {
  it('data-bulle-tour et data-bulle-ennemi reçoivent la bulle de la tour ou de l’ennemi ; une valeur inconnue est ignorée', () => {
    const racine = document.createElement('div');
    racine.innerHTML =
      '<span data-bulle-tour="tir:4:B">a</span><span data-bulle-tour="divine:pollen">b</span><span data-bulle-ennemi="mendiant">c</span>' +
      '<span data-bulle-tour="tir:9">d</span><span data-bulle-tour="dragon">e</span><span data-bulle-ennemi="licorne">f</span>';
    document.body.append(racine);
    brancherBulles(racine);
    const [specialisation, divine, ennemi, ...inconnus] = [...racine.querySelectorAll<HTMLElement>('span')];
    const titre = (element: HTMLElement | undefined): string | null => {
      if (!element) return null;
      pointeur(element, 'pointerenter', 'mouse');
      vi.advanceTimersByTime(DELAI_SURVOL_MS);
      const texte = bulleVisible()?.querySelector('.bulle-titre')?.textContent ?? null;
      pointeur(element, 'pointerleave', 'mouse');
      return texte;
    };
    expect(titre(specialisation)).toBe(tCle(TOURS.tir.specialisations.B.nom));
    expect(titre(divine)).toBe(tCle(DIEUX.pollen.tourDivine.nom));
    expect(titre(ennemi)).toBe(tCle(ENNEMIS.mendiant.nom));
    for (const element of inconnus) expect(titre(element)).toBeNull();
  });
});

describe('bulle sur la carte (ennemis)', () => {
  const ancre = { left: 100, top: 100, right: 110, bottom: 110 };

  it('survol : s’ouvre après le délai sur la même cible, se ferme quand la souris la quitte', () => {
    const carte = new BulleSurCarte(document.body);
    carte.survoler({ cle: 7, ancre: () => ancre, fabriquer: () => CONTENU });
    vi.advanceTimersByTime(DELAI_SURVOL_MS - 1);
    carte.survoler({ cle: 7, ancre: () => ancre, fabriquer: () => CONTENU });
    expect(bulleVisible()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(bulleVisible()).not.toBeNull();
    carte.survoler(null);
    expect(bulleVisible()).toBeNull();
    carte.detruire();
  });

  it('suit la cible qui bouge : la bulle est replacée à la relecture', () => {
    const carte = new BulleSurCarte(document.body);
    let x = 100;
    carte.survoler({ cle: 7, ancre: () => ({ left: x, top: 300, right: x + 10, bottom: 310 }), fabriquer: () => CONTENU });
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    const avant = bulleVisible()?.style.left;
    x = 400;
    vi.advanceTimersByTime(300);
    expect(bulleVisible()?.style.left).not.toBe(avant);
    carte.detruire();
  });

  it('refermée d’elle-même, la même cible survolée de nouveau rouvre la bulle', () => {
    const carte = new BulleSurCarte(document.body);
    let dessous = true;
    const cible = { cle: 7, ancre: () => ancre, fabriquer: () => (dessous ? CONTENU : null) };
    carte.survoler(cible);
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    dessous = false;
    vi.advanceTimersByTime(300);
    expect(bulleVisible()).toBeNull();
    dessous = true;
    carte.survoler(cible);
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulleVisible()).not.toBeNull();
    carte.detruire();
  });

  it('appui long : ouvre si une cible est sous le doigt ; prévient l’appelant dans tous les cas', () => {
    const carte = new BulleSurCarte(document.body);
    const pris = vi.fn();
    carte.appuyer(1, 50, 50, () => ({ ancre: () => ancre, fabriquer: () => CONTENU }), pris);
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS);
    expect(pris).toHaveBeenCalledWith(1);
    expect(bulleVisible()).not.toBeNull();
    carte.relacher(1);
    pointeur(document.body, 'pointerdown', 'touch', 0, 0, 2);
    expect(bulleVisible()).toBeNull();

    // Sans cible : pas de bulle, mais l'appui long ne doit pas se finir en toucher.
    const rien = vi.fn();
    carte.appuyer(3, 50, 50, () => null, rien);
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS);
    expect(rien).toHaveBeenCalledWith(3);
    expect(bulleVisible()).toBeNull();
    carte.detruire();
  });

  it('un second doigt (pincement) ou un glissement annule l’appui long', () => {
    const carte = new BulleSurCarte(document.body);
    const pris = vi.fn();
    const chercher = (): { ancre: () => typeof ancre; fabriquer: () => ContenuBulle } => ({ ancre: () => ancre, fabriquer: () => CONTENU });
    carte.appuyer(1, 50, 50, chercher, pris);
    carte.appuyer(2, 90, 50, chercher, pris);
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS * 2);
    carte.relacher(1);
    carte.relacher(2);
    carte.appuyer(4, 50, 50, chercher, pris);
    carte.bouger(4, 50 + SEUIL_GLISSEMENT + 2, 50);
    vi.advanceTimersByTime(DELAI_APPUI_LONG_MS * 2);
    expect(pris).not.toHaveBeenCalled();
    expect(bulleVisible()).toBeNull();
    carte.detruire();
  });

  it('se ferme quand la cible disparaît (ennemi mort)', () => {
    const carte = new BulleSurCarte(document.body);
    let vivant = true;
    carte.survoler({ cle: 7, ancre: () => ancre, fabriquer: () => (vivant ? CONTENU : null) });
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    expect(bulleVisible()).not.toBeNull();
    vivant = false;
    vi.advanceTimersByTime(500);
    expect(bulleVisible()).toBeNull();
    carte.detruire();
  });
});

describe('placement dans l’écran', () => {
  const SANS_ZONE = { haut: 0, bas: 0, gauche: 0, droite: 0 };
  const ENCOCHE = { haut: 0, bas: 21, gauche: 44, droite: 44 };
  const ECRANS = [
    { largeur: 740, hauteur: 360 },
    { largeur: 1280, hauteur: 720 },
  ];

  /** La bulle placée tient entièrement dans l'écran, zones sûres et marge comprises. */
  function dansLEcran(ecran: { largeur: number; hauteur: number }, zones: typeof SANS_ZONE, taille: { largeur: number; hauteur: number }, ancre: { left: number; top: number; right: number; bottom: number }): void {
    const p = placerBulle(ancre, taille, ecran, zones);
    const largeur = Math.min(taille.largeur, p.largeurMax);
    const hauteur = Math.min(taille.hauteur, p.hauteurMax);
    expect(p.x).toBeGreaterThanOrEqual(zones.gauche + MARGE_BULLE);
    expect(p.y).toBeGreaterThanOrEqual(zones.haut + MARGE_BULLE);
    expect(p.x + largeur).toBeLessThanOrEqual(ecran.largeur - zones.droite - MARGE_BULLE);
    expect(p.y + hauteur).toBeLessThanOrEqual(ecran.hauteur - zones.bas - MARGE_BULLE);
  }

  it('reste dans l’écran depuis les quatre coins, le centre et les bords, à 740×360 et 1280×720', () => {
    for (const ecran of ECRANS) {
      for (const zones of [SANS_ZONE, ENCOCHE]) {
        for (const taille of [{ largeur: 260, hauteur: 140 }, { largeur: 320, hauteur: 300 }]) {
          for (const [x, y] of [[0, 0], [ecran.largeur, 0], [0, ecran.hauteur], [ecran.largeur, ecran.hauteur], [ecran.largeur / 2, ecran.hauteur / 2], [ecran.largeur / 2, 2], [2, ecran.hauteur / 2]] as const) {
            dansLEcran(ecran, zones, taille, { left: x - 20, top: y - 20, right: x + 20, bottom: y + 20 });
          }
        }
      }
    }
  });

  it('une bulle plus grande que l’écran est bornée à la place disponible', () => {
    const ecran = { largeur: 740, hauteur: 360 };
    const p = placerBulle({ left: 300, top: 150, right: 340, bottom: 190 }, { largeur: 2000, hauteur: 900 }, ecran, ENCOCHE);
    expect(p.largeurMax).toBe(740 - 44 - 44 - 2 * MARGE_BULLE);
    expect(p.hauteurMax).toBe(360 - 21 - 2 * MARGE_BULLE);
    dansLEcran(ecran, ENCOCHE, { largeur: 2000, hauteur: 900 }, { left: 300, top: 150, right: 340, bottom: 190 });
  });

  it('se place au-dessus de l’élément s’il y a la place, sinon en dessous, centrée sur lui', () => {
    const ecran = { largeur: 1280, hauteur: 720 };
    const taille = { largeur: 200, hauteur: 100 };
    const enBas = placerBulle({ left: 600, top: 600, right: 640, bottom: 640 }, taille, ecran, SANS_ZONE);
    expect(enBas.y + taille.hauteur).toBeLessThanOrEqual(600);
    expect(enBas.x + taille.largeur / 2).toBe(620);
    const enHaut = placerBulle({ left: 600, top: 10, right: 640, bottom: 50 }, taille, ecran, SANS_ZONE);
    expect(enHaut.y).toBeGreaterThanOrEqual(50);
  });
});
