// @vitest-environment happy-dom
// Clavier et accessibilité du Bestiaire et de l'option des fiches : piège à focus, flèches des onglets et du groupe Oui/Non, aria-controls,
// libellés distincts pour les trois niveaux d'une tour.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Depot, sauvegardeVide, Session, StockageMemoire } from '../save';
import { afficherBestiaire } from './bestiaire';
import { afficherOptions } from './options';

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png`, sprite: () => undefined } as unknown as AtlasRendu;

afterEach(() => {
  document.body.replaceChildren();
});

function ouvrir(onglet?: 'ennemis' | 'tours') {
  const surFermer = vi.fn();
  const ecran = afficherBestiaire(document.body, { atlas: ATLAS, session: { sauvegarde: sauvegardeVide() }, surFermer, ...(onglet ? { onglet } : {}) });
  return { ecran, surFermer };
}

const touche = (cible: Element, key: string, shiftKey = false): KeyboardEvent => {
  const e = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  cible.dispatchEvent(e);
  return e;
};

describe('piège à focus du Bestiaire', () => {
  it('Tab sur le dernier bouton revient au premier, Maj+Tab sur le premier va au dernier : jamais hors de l’écran', () => {
    const { ecran } = ouvrir();
    const boutons = [...ecran.racine.querySelectorAll<HTMLElement>('button')];
    const premier = boutons[0];
    const dernier = boutons[boutons.length - 1];
    if (!premier || !dernier) throw new Error('pas de boutons');
    dernier.focus();
    expect(touche(dernier, 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(premier);
    premier.focus();
    expect(touche(premier, 'Tab', true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dernier);
  });

  it('un focus qui s’échappe (bouton dessous) revient dans l’écran', () => {
    const { ecran } = ouvrir();
    const dessous = document.createElement('button');
    document.body.append(dessous);
    dessous.focus();
    expect(ecran.racine.contains(document.activeElement)).toBe(true);
  });

  it('fermé, il ne retient plus le focus', () => {
    const { ecran } = ouvrir();
    ecran.arreter();
    const dessous = document.createElement('button');
    document.body.append(dessous);
    dessous.focus();
    expect(document.activeElement).toBe(dessous);
  });
});

describe('onglets', () => {
  it('portent aria-controls vers le panneau, et les flèches gauche et droite passent de l’un à l’autre', () => {
    const { ecran } = ouvrir();
    const ennemis = ecran.racine.querySelector<HTMLElement>('[data-onglet="ennemis"]');
    const tours = ecran.racine.querySelector<HTMLElement>('[data-onglet="tours"]');
    if (!ennemis || !tours) throw new Error('onglets absents');
    const panneau = ecran.racine.querySelector('#' + (ennemis.getAttribute('aria-controls') ?? 'x'));
    expect(panneau).not.toBeNull();
    expect(tours.getAttribute('aria-controls')).toBe(ennemis.getAttribute('aria-controls'));
    touche(ennemis, 'ArrowRight');
    expect(tours.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tours);
    touche(tours, 'ArrowLeft');
    expect(ennemis.getAttribute('aria-selected')).toBe('true');
  });
});

describe('tours : niveaux distincts', () => {
  it('les tuiles des niveaux 1 à 3 d’une famille ont des libellés différents (aria-label compris), et la fiche dit le niveau', () => {
    const s = sauvegardeVide();
    afficherBestiaire(document.body, { atlas: ATLAS, session: { sauvegarde: { ...s, progression: { ...s.progression, niveauMax: 11 } } }, surFermer: vi.fn(), onglet: 'tours' });
    const libelles = ['tir-1', 'tir-2', 'tir-3', 'tir-4A', 'tir-4B'].map((id) => document.querySelector(`.bestiaire-tuile[data-tour="${id}"]`)?.getAttribute('aria-label') ?? '');
    expect(new Set(libelles).size).toBe(5);
    expect(libelles[2]).toContain(t('bestiaire.tour_niveau', { n: 3 }));
    document.querySelector<HTMLElement>('.bestiaire-tuile[data-tour="tir-2"]')?.click();
    expect(document.querySelector('.fiche-tour-precision')?.textContent).toBe(t('bestiaire.tour_niveau', { n: 2 }));
  });
});

describe('option des fiches : groupe radio', () => {
  it('les flèches passent de Oui à Non et inversement', async () => {
    const session = await Session.ouvrir(new Depot(new StockageMemoire()));
    afficherOptions(document.body, session, vi.fn());
    const oui = document.querySelector<HTMLElement>('[data-fiches="true"]');
    const non = document.querySelector<HTMLElement>('[data-fiches="false"]');
    if (!oui || !non) throw new Error('boutons absents');
    oui.focus();
    touche(oui, 'ArrowRight');
    expect(non.getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(non);
    touche(non, 'ArrowLeft');
    expect(oui.getAttribute('aria-checked')).toBe('true');
    await vi.waitFor(() => { expect(session.sauvegarde.meta.bestiaire.fiches).toBe(true); });
  });
});
