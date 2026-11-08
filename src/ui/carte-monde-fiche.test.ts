// @vitest-environment happy-dom
// La fiche d'un niveau (choix du dieu, du héros et des objets emportés) et la barre de la carte (monnaies, accès aux
// écrans des héros et de la boutique). Le rendu Canvas est remplacé par une doublure ; la session est un faux qui
// accepte tout (ou refuse, selon le test) et garde ses appels.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIEUX } from '../data/dieux';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { sauvegardeVide, type RaisonChoix, type RaisonEquipement, type Sauvegarde } from '../save';
import { DELAI_SURVOL_MS, fermerBulle } from './bulle';
import { afficherCarteMonde, type OptionsCarteMonde } from './carte-monde';

vi.mock('../render/carte-monde', () => ({
  RenduCarteMonde: class {
    camera = { deplacer: vi.fn(), debutPincement: vi.fn(), pincement: vi.fn(), molette: vi.fn(), decalageX: 0, decalageY: 0, vueL: 512, vueH: 288 };
    ratio = 1;
    rayonToucher = 20;
    cadrer = vi.fn();
    definirMargeHaut = vi.fn();
    centrerSur = vi.fn();
    redimensionner = vi.fn();
    dessiner = vi.fn();
    enMondeX = (x: number): number => x;
    enMondeY = (y: number): number => y;
  },
}));

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;

type Succes = { ok: true; sauvegarde: Sauvegarde; ecrite: boolean };

/** Une session qui accepte tout et garde les appels : la fiche lui envoie ses choix (héros, objets). */
function fausseSession(sauvegarde: Sauvegarde) {
  const accepte = (): Promise<Succes> => Promise.resolve({ ok: true, sauvegarde, ecrite: true });
  return {
    sauvegarde,
    choisirHeros: vi.fn<(dieu: string, heros: string) => Promise<Succes | { ok: false; raison: RaisonChoix }>>(accepte),
    equiperObjets: vi.fn<(objets: readonly string[]) => Promise<Succes | { ok: false; raison: RaisonEquipement }>>(accepte),
  };
}

/** Le joueur a gagné 5 étoiles, recruté Suie et acheté quelques objets. */
function sauvegardeGarnie(): Sauvegarde {
  const s = sauvegardeVide();
  return {
    ...s,
    progression: { niveauMax: 3, etoiles: { '1': { matou: 3 }, '2': { matou: 2 } } },
    meta: {
      ...s.meta,
      monnaies: { aretes: 120, braises: 7 },
      heros: { ...s.meta.heros, suie: { xp: 400, competences: {} } },
      objets: { ...s.meta.objets, sablier: 1, fiole_soufre: 2 },
    },
  };
}

function monter(sauvegarde: Sauvegarde = sauvegardeVide(), supplement: Partial<OptionsCarteMonde> = {}) {
  const session = fausseSession(sauvegarde);
  const surLancer = vi.fn();
  const surHeros = vi.fn();
  const surBoutique = vi.fn();
  afficherCarteMonde(document.body, {
    atlas: ATLAS,
    session,
    difficulte: 'matou',
    surLancer,
    surOptions: vi.fn(),
    surHeros,
    surBoutique,
    surRetour: vi.fn(),
    ...supplement,
  });
  return { session, surLancer, surHeros, surBoutique };
}

function appuyer(touche: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: touche, bubbles: true }));
}

function parTitre(titre: string): HTMLButtonElement {
  const trouve = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.title === titre || b.title.startsWith(`${titre} :`));
  if (!trouve) throw new Error(`Bouton introuvable : ${titre}`);
  return trouve;
}

function parTexte(texte: string): HTMLButtonElement {
  const trouve = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === texte);
  if (!trouve) throw new Error(`Bouton introuvable : ${texte}`);
  return trouve;
}

/** Laisse les promesses de la session (déjà résolues) se terminer. */
async function attendre(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const message = (): string => document.querySelector('.choix-message')?.textContent ?? '';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (): number => 1);
  vi.stubGlobal('cancelAnimationFrame', (): void => undefined);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('carte du monde : monnaies et accès aux écrans', () => {
  it('montre les arêtes, les braises et les étoiles à dépenser', () => {
    monter(sauvegardeGarnie());
    const puces = [...document.querySelectorAll('.carte-monnaies .puce')].map((p) => p.getAttribute('aria-label') ?? '');
    expect(puces).toHaveLength(3);
    expect(puces[0]).toBe(t('monnaie.aretes', { n: 120 }));
    expect(puces[1]).toBe(t('monnaie.braises', { n: 7 }));
    expect(puces[2]).toContain(t('monnaie.etoiles', { n: 5 }));
  });

  it('« Héros » et « Boutique » appellent leur écran', () => {
    const { surHeros, surBoutique } = monter();
    parTexte(t('carte.heros')).click();
    parTexte(t('carte.boutique')).click();
    expect(surHeros).toHaveBeenCalledTimes(1);
    expect(surBoutique).toHaveBeenCalledTimes(1);
  });
});

describe('fiche de niveau : dieu, héros et objets', () => {
  it('propose trois dieux et les trois héros du dieu choisi, les disciples pas recrutés verrouillés', () => {
    monter();
    appuyer('Enter');
    expect(document.querySelectorAll('.choix-dieu')).toHaveLength(3);
    const heros = [...document.querySelectorAll('.choix-heros')];
    expect(heros).toHaveLength(3);
    // Le Colosse est le choix de départ : son avatar est possédé, ses deux disciples sont verrouillés.
    expect(heros.map((h) => h.classList.contains('verrouille'))).toEqual([false, true, true]);
    expect(heros[0]?.classList.contains('actif')).toBe(true);
  });

  it('choisir un autre dieu mémorise son avatar et montre ses héros', async () => {
    const { session } = monter();
    appuyer('Enter');
    parTitre('L’Ombre').click();
    await attendre();
    expect(session.choisirHeros).toHaveBeenCalledWith('plume', 'plume');
    const noms = [...document.querySelectorAll('.choix-heros')].map((h) => h.getAttribute('aria-label'));
    expect(noms).toEqual(['Nielle, Souffle-Lampes', 'Suie : 30 braises', 'Corbeau : 30 braises']);
  });

  it('toucher un disciple pas recruté n’appelle pas la session et dit où l’acheter', () => {
    const { session } = monter();
    appuyer('Enter');
    parTitre('Mastoc').click();
    expect(session.choisirHeros).not.toHaveBeenCalled();
    expect(message()).toContain('30');
  });

  it('un disciple recruté se choisit', () => {
    const { session } = monter(sauvegardeGarnie());
    appuyer('Enter');
    parTitre('L’Ombre').click();
    parTitre('Suie').click();
    expect(session.choisirHeros).toHaveBeenLastCalledWith('plume', 'suie');
  });

  it('les objets du stock se mettent dans les emplacements sans dépasser le stock, et se retirent', () => {
    const { session } = monter(sauvegardeGarnie());
    appuyer('Enter');
    // Fiole de Soufre (2 en stock) et Sablier (1) : les deux seuls objets possédés.
    expect(document.querySelectorAll('.choix-objet')).toHaveLength(2);
    parTitre(t('fiche.objet_ajouter', { nom: 'Fiole de Soufre', n: 2 })).click();
    expect(session.equiperObjets).toHaveBeenLastCalledWith(['fiole_soufre']);
    parTitre(t('fiche.objet_ajouter', { nom: 'Fiole de Soufre', n: 2 })).click();
    expect(session.equiperObjets).toHaveBeenLastCalledWith(['fiole_soufre', 'fiole_soufre']);
    parTitre(t('fiche.objet_ajouter', { nom: 'Fiole de Soufre', n: 2 })).click();
    expect(message()).toBe(t('fiche.objet_stock_vide', { nom: 'Fiole de Soufre' }));
    parTitre(t('fiche.objet_retirer', { nom: 'Fiole de Soufre' })).click();
    expect(session.equiperObjets).toHaveBeenLastCalledWith(['fiole_soufre']);
  });

  it('au plus trois objets', () => {
    const { session } = monter(sauvegardeGarnie());
    appuyer('Enter');
    parTitre(t('fiche.objet_ajouter', { nom: 'Fiole de Soufre', n: 2 })).click();
    parTitre(t('fiche.objet_ajouter', { nom: 'Fiole de Soufre', n: 2 })).click();
    parTitre(t('fiche.objet_ajouter', { nom: 'Sablier', n: 1 })).click();
    expect(session.equiperObjets).toHaveBeenLastCalledWith(['fiole_soufre', 'fiole_soufre', 'sablier']);
    session.equiperObjets.mockClear();
    parTitre(t('fiche.objet_ajouter', { nom: 'Sablier', n: 1 })).click();
    expect(session.equiperObjets).not.toHaveBeenCalled();
    expect(message()).toBe(t('fiche.objets_pleins'));
  });

  it('sans objet en stock, la fiche renvoie à la boutique', () => {
    monter();
    appuyer('Enter');
    expect(document.querySelectorAll('.choix-objet')).toHaveLength(0);
    expect(document.querySelector('.choix-fiche')?.textContent).toContain(t('fiche.sans_objet'));
  });

  it('« Lancer » transmet le dieu, le héros et les objets choisis', async () => {
    const { surLancer } = monter(sauvegardeGarnie());
    appuyer('Enter');
    parTitre('L’Ombre').click();
    parTitre('Suie').click();
    parTitre(t('fiche.objet_ajouter', { nom: 'Sablier', n: 1 })).click();
    await attendre();
    parTexte(t('fiche.lancer')).click();
    expect(surLancer).toHaveBeenCalledTimes(1);
    expect(surLancer.mock.calls[0]?.[2]).toEqual({ dieu: 'plume', heros: 'suie', objets: ['sablier'] });
  });

  it('un refus de la session est dit et le choix précédent revient', async () => {
    const session = fausseSession(sauvegardeGarnie());
    session.choisirHeros.mockImplementation(() => Promise.resolve({ ok: false, raison: 'heros_non_possede' }));
    afficherCarteMonde(document.body, {
      atlas: ATLAS,
      session,
      difficulte: 'matou',
      surLancer: vi.fn(),
      surOptions: vi.fn(),
      surHeros: vi.fn(),
      surBoutique: vi.fn(),
      surRetour: vi.fn(),
    });
    appuyer('Enter');
    parTitre('L’Ombre').click();
    await attendre();
    expect(message()).toBe(t('meta.refus.heros_non_possede'));
    expect(document.querySelector('.choix-dieu.actif')?.getAttribute('aria-label')).toBe('Le Colosse');
  });

  it('un choix mémorisé qui ne tient plus (objet épuisé) est corrigé à l’ouverture', () => {
    const s = sauvegardeGarnie();
    const memorise: Sauvegarde = { ...s, meta: { ...s.meta, choix: { dieu: 'plume', heros: 'corbeau', objets: ['herbe_sabbat', 'sablier'] } } };
    const { surLancer } = monter(memorise);
    appuyer('Enter');
    parTexte(t('fiche.lancer')).click();
    // Corbeau n'est pas recruté (retour à l'avatar), l'herbe n'est plus en stock (retirée), le sablier l'est.
    expect(surLancer.mock.calls[0]?.[2]).toEqual({ dieu: 'plume', heros: 'plume', objets: ['sablier'] });
  });
});

describe('fiche de niveau : nouvelles découvertes', () => {
  it('niveau 1 : les quatre tours de base, repérables par leurs data-attributs, avant « Lancer »', () => {
    monter();
    appuyer('Enter');
    const encadre = document.querySelector<HTMLElement>('.decouvertes');
    expect(encadre?.querySelector('.decouvertes-titre')?.textContent).toBe(t('fiche.decouvertes'));
    expect(encadre?.dataset.niveau).toBe('1');
    const elements = [...document.querySelectorAll<HTMLElement>('.decouverte')];
    expect(elements.map((e) => `${e.dataset.tour ?? ''}-${e.dataset.palier ?? ''}`)).toEqual(['caserne-1', 'tir-1', 'magie-1', 'artillerie-1']);
    expect(elements.every((e) => e.dataset.niveau === '1' && e.querySelector('img') && e.querySelector('.decouverte-apport')?.textContent)).toBe(true);
    // L'encadré vient avant les boutons « Lancer » et « Fermer ».
    const lancer = parTexte(t('fiche.lancer'));
    expect(encadre && encadre.compareDocumentPosition(lancer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('niveau 10 : la tour divine suit le dieu choisi dans la fiche (icône et bulle)', async () => {
    const s = sauvegardeVide();
    monter({ ...s, progression: { niveauMax: 10, etoiles: {} } });
    for (let n = 1; n < 10; n++) appuyer('ArrowRight');
    appuyer('Enter');
    expect(document.querySelector('.fiche-numero')?.textContent).toBe(t('accueil.niveau', { n: 10 }));
    const divine = (): HTMLElement | null => document.querySelector<HTMLElement>('.decouverte[data-tour="divine"]');
    expect(divine()?.querySelector('img')?.getAttribute('src')).toBe('tour-totem.png');
    expect(divine()?.textContent).toContain(String(DIEUX.charlie.tourDivine.cout));

    parTitre('L’Ombre').click();
    await attendre();
    expect(document.querySelectorAll('.decouvertes')).toHaveLength(1);
    expect(divine()?.querySelector('img')?.getAttribute('src')).toBe('tour-sanctuaire.png');
    vi.useFakeTimers();
    try {
      divine()?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', bubbles: true }));
      vi.advanceTimersByTime(DELAI_SURVOL_MS);
      const bulle = document.querySelector<HTMLElement>('.bulle');
      expect(bulle && !bulle.hidden).toBe(true);
      expect(bulle?.textContent).toContain(tCle(DIEUX.plume.tourDivine.nom));
    } finally {
      fermerBulle();
      vi.useRealTimers();
    }
  });

  it('un niveau qui n’apporte rien de neuf n’a pas d’encadré', () => {
    const s = sauvegardeVide();
    monter({ ...s, progression: { niveauMax: 11, etoiles: {} }, meta: { ...s.meta, regionMax: 2 } });
    appuyer('Enter');
    expect(document.querySelector('.fiche-numero')?.textContent).toBe(t('accueil.niveau', { n: 11 }));
    expect(document.querySelector('.decouvertes')).toBeNull();
  });
});
