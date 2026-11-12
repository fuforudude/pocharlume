// @vitest-environment happy-dom
// L'écran Bestiaire : onglets, ennemis rencontrés détaillés et les autres en « ??? », tours verrouillées selon la campagne, chiffres des
// données, fermeture au clavier ; la fiche « Nouvel ennemi » ; l'option des fiches dans les Options.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { TOURS } from '../data/tours';
import type { IdCampagne } from '../engine/definitions';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Depot, rencontrerEnnemis, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { afficherBestiaire } from './bestiaire';
import { afficherNouvelEnnemi } from './nouvel-ennemi';
import { afficherOptions } from './options';

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png`, sprite: () => undefined } as unknown as AtlasRendu;

afterEach(() => {
  document.body.replaceChildren();
});

function avec(sauvegarde: Sauvegarde, onglet?: 'ennemis' | 'tours', campagne?: IdCampagne) {
  const surFermer = vi.fn();
  const ecran = afficherBestiaire(document.body, { atlas: ATLAS, session: { sauvegarde }, surFermer, ...(onglet ? { onglet } : {}), ...(campagne ? { campagne } : {}) });
  return { ecran, surFermer };
}

function tuileEnnemi(id: string): HTMLButtonElement {
  const b = document.querySelector<HTMLButtonElement>(`.bestiaire-tuile[data-ennemi="${id}"]`);
  if (!b) throw new Error(`tuile absente : ${id}`);
  return b;
}

function tuileTour(id: string): HTMLButtonElement {
  const b = document.querySelector<HTMLButtonElement>(`.bestiaire-tuile[data-tour="${id}"]`);
  if (!b) throw new Error(`tuile absente : ${id}`);
  return b;
}

const detail = (): string => document.querySelector('.bestiaire-detail')?.textContent ?? '';

describe('onglet Ennemis', () => {
  it('liste tous les ennemis des données, une tuile chacun', () => {
    avec(sauvegardeVide());
    const ids = [...document.querySelectorAll<HTMLElement>('.bestiaire-tuile')].map((b) => b.dataset.ennemi);
    expect([...ids].sort()).toEqual(Object.keys(ENNEMIS).filter((id) => !id.startsWith('moderne_')).sort());
  });

  it('le Bestiaire de l’histoire ne montre aucun ennemi du DLC', () => {
    avec(sauvegardeVide());
    expect(document.querySelectorAll('.bestiaire-tuile[data-ennemi^="moderne_"]')).toHaveLength(0);
    expect(document.querySelector('.bestiaire-compte')?.textContent).toBe(t('bestiaire.compte_ennemis', { n: 0, m: Object.keys(ENNEMIS).filter((id) => !id.startsWith('moderne_')).length }));
  });

  it('un ennemi jamais rencontré reste « ??? » : ni nom, ni chiffres', () => {
    avec(sauvegardeVide());
    tuileEnnemi('paysan_affame').click();
    expect(detail()).toContain(t('bestiaire.inconnu'));
    expect(detail()).not.toContain(tCle(ENNEMIS.paysan_affame.nom));
    expect(tuileEnnemi('paysan_affame').dataset.rencontre).toBe('false');
    expect(tuileEnnemi('paysan_affame').getAttribute('aria-label')).toBe(t('bestiaire.inconnu_libelle'));
  });

  it('un ennemi rencontré montre nom, chiffres des données, particularités, comment le contrer et lore', () => {
    avec(rencontrerEnnemis(sauvegardeVide(), ['epouvantail']).sauvegarde);
    tuileEnnemi('epouvantail').click();
    const texte = detail();
    expect(texte).toContain(tCle(ENNEMIS.epouvantail.nom));
    expect(texte).toContain(String(ENNEMIS.epouvantail.pv));
    expect(texte).toContain(t('bestiaire.particularites'));
    expect(texte).toContain(t('bestiaire.contrer'));
    expect(texte).toContain(t('bestiaire.contre.relevement'));
    expect(texte).toContain(tCle('ennemi.epouvantail.desc'));
  });

  it('ouvre sur la fiche du premier ennemi rencontré, et compte les rencontrés', () => {
    avec(rencontrerEnnemis(sauvegardeVide(), ['glaneur']).sauvegarde);
    expect(detail()).toContain(tCle(ENNEMIS.glaneur.nom));
    expect(document.querySelector('.bestiaire-compte')?.textContent).toBe(t('bestiaire.compte_ennemis', { n: 1, m: Object.keys(ENNEMIS).filter((id) => !id.startsWith('moderne_')).length }));
  });

  it('les ennemis sont rangés par région, avec un titre par région', () => {
    avec(sauvegardeVide());
    const titres = [...document.querySelectorAll('.bestiaire-groupe-titre')].map((x) => x.textContent);
    expect(titres[0]).toContain('1');
    expect(titres.length).toBeGreaterThan(5);
  });
});

describe('onglet Tours', () => {
  it('change d’onglet et liste les familles avec niveaux 1 à 3 et spécialisations, puis la tour divine de chaque dieu', () => {
    avec(sauvegardeVide());
    document.querySelector<HTMLButtonElement>('.bestiaire-onglets [data-onglet="tours"]')?.click();
    const ids = [...document.querySelectorAll<HTMLElement>('.bestiaire-tuile')].map((b) => b.dataset.tour);
    for (const famille of ['caserne', 'tir', 'magie', 'artillerie']) {
      for (const suffixe of ['1', '2', '3', '4A', '4B']) expect(ids).toContain(`${famille}-${suffixe}`);
    }
    expect(ids.filter((i) => i?.startsWith('divine-'))).toHaveLength(3);
  });

  it('montre verrouillé ce que la campagne n’a pas ouvert, et ouvert ce qu’elle a ouvert', () => {
    avec(sauvegardeVide(), 'tours');
    expect(tuileTour('caserne-1').dataset.verrouillee).toBe('false');
    expect(tuileTour('caserne-2').dataset.verrouillee).toBe('true');
    expect(tuileTour('divine-plume').dataset.verrouillee).toBe('true');
    tuileTour('caserne-3').click();
    expect(detail()).toContain(t('bestiaire.tour_verrouillee'));
    expect(detail()).toContain(t('bestiaire.tour_verrou_detail', { n: 4 }));
  });

  it('une tour ouverte affiche les chiffres des données', () => {
    const s = sauvegardeVide();
    avec({ ...s, progression: { ...s.progression, niveauMax: 11 } }, 'tours');
    tuileTour('tir-1').click();
    const [min, max] = TOURS.tir.niveaux[0].degats;
    expect(detail()).toContain(tCle(TOURS.tir.niveaux[0].nom));
    expect(detail()).toContain(`${String(min)} à ${String(max)}`);
    expect(document.querySelectorAll('.bestiaire-tuile[data-verrouillee="true"]')).toHaveLength(0);
  });
});

describe('fermeture', () => {
  it('Échap ferme l’écran une seule fois, le bouton aussi, et les touches ne remontent pas', () => {
    const { surFermer } = avec(sauvegardeVide());
    const dessous = vi.fn();
    window.addEventListener('keydown', dessous);
    document.querySelector('.ecran.bestiaire button')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(dessous).not.toHaveBeenCalled();
    window.removeEventListener('keydown', dessous);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(surFermer).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ecran.bestiaire')).toBeNull();
  });

  it('le bouton Fermer appelle surFermer', () => {
    const { surFermer } = avec(sauvegardeVide());
    document.querySelector<HTMLButtonElement>('.bestiaire-entete .bouton:not(.onglet)')?.click();
    expect(surFermer).toHaveBeenCalledTimes(1);
  });
});

describe('fiche « Nouvel ennemi »', () => {
  it('montre le nom, ce qu’il fait et comment le contrer, et ne se referme qu’une fois', () => {
    const surFermer = vi.fn();
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const f = afficherNouvelEnnemi(document.body, { atlas: ATLAS, id: 'corbeau_noir', surFermer });
    expect(f.racine.textContent).toContain(t('bestiaire.nouveau_titre'));
    expect(f.racine.textContent).toContain(tCle(ENNEMIS.corbeau_noir.nom));
    expect(f.racine.textContent).toContain(t('bulle.ennemi.volant'));
    expect(f.racine.querySelector('.contrer')?.textContent).toContain(tCle('famille.tir'));
    // Pas de tableau de chiffres : la fiche est courte.
    expect(f.racine.querySelector('.fiche-ennemi-chiffres')).toBeNull();
    f.fermer();
    f.fermer();
    expect(surFermer).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.nouvel-ennemi')).toBeNull();
    vi.restoreAllMocks();
  });
});

describe('option des fiches dans les Options', () => {
  it('s’affiche activée par défaut, se coupe et se rallume, et le choix reste dans la sauvegarde', async () => {
    const session = await Session.ouvrir(new Depot(new StockageMemoire()));
    afficherOptions(document.body, session, vi.fn());
    const oui = document.querySelector<HTMLButtonElement>('[data-fiches="true"]');
    const non = document.querySelector<HTMLButtonElement>('[data-fiches="false"]');
    if (!oui || !non) throw new Error('boutons absents');
    expect(oui.getAttribute('aria-checked')).toBe('true');
    non.click();
    expect(non.getAttribute('aria-checked')).toBe('true');
    expect(oui.getAttribute('aria-checked')).toBe('false');
    await vi.waitFor(() => { expect(session.sauvegarde.meta.bestiaire.fiches).toBe(false); });
    oui.click();
    await vi.waitFor(() => { expect(session.sauvegarde.meta.bestiaire.fiches).toBe(true); });
  });
});

describe('Bestiaire du DLC « Temps modernes »', () => {
  it('liste les ennemis du DLC, avec leur image, et aucun ennemi de l’histoire', () => {
    avec(sauvegardeVide(), undefined, 'moderne');
    const ids = [...document.querySelectorAll<HTMLElement>('.bestiaire-tuile')].map((b) => b.dataset.ennemi);
    expect([...ids].sort()).toEqual(Object.keys(ENNEMIS).filter((id) => id.startsWith('moderne_')).sort());
    for (const b of document.querySelectorAll<HTMLElement>('.bestiaire-tuile')) {
      expect(b.querySelector('img')?.getAttribute('src'), b.dataset.ennemi).toBe(`${(b.dataset.ennemi ?? '').replaceAll('_', '-')}.png`);
    }
    expect(document.querySelector('.bestiaire-compte')?.textContent).toBe(t('bestiaire.compte_ennemis', { n: 0, m: 17 }));
  });

  it('un ennemi du DLC rencontré a sa fiche', () => {
    avec(rencontrerEnnemis(sauvegardeVide(), ['moderne_gendarme']).sauvegarde, undefined, 'moderne');
    expect(detail()).toContain(tCle(ENNEMIS.moderne_gendarme.nom));
    tuileEnnemi('moderne_crs').click();
    expect(detail()).toContain(t('bestiaire.inconnu'));
  });

  it('les tours sont toutes ouvertes dans le DLC et portent leur capacité ; dans l’histoire, pas de ligne « Capacité DLC »', () => {
    avec(sauvegardeVide(), 'tours', 'moderne');
    expect(document.querySelectorAll('.bestiaire-tuile[data-verrouillee="true"]')).toHaveLength(0);
    tuileTour('tir-2').click();
    expect(detail()).toContain(t('bulle.tour.capacite_dlc'));
    expect(detail()).toContain('Renvoi');
    document.body.replaceChildren();
    avec({ ...sauvegardeVide(), progression: { ...sauvegardeVide().progression, niveauMax: 11 } }, 'tours');
    tuileTour('tir-2').click();
    expect(detail()).not.toContain(t('bulle.tour.capacite_dlc'));
    expect(detail()).not.toContain('Renvoi');
  });
});
