// @vitest-environment happy-dom
// La fiche d'un niveau (choix du dieu, du héros et des objets emportés) et la barre de la carte (monnaies, accès aux
// écrans des héros et de la boutique). Le rendu Canvas est remplacé par une doublure ; la session est un faux qui
// accepte tout (ou refuse, selon le test) et garde ses appels.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { sauvegardeVide, type RaisonChoix, type RaisonEquipement, type Sauvegarde } from '../save';
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

const ATLAS = { iconeUrl: () => 'icone.png' } as unknown as AtlasRendu;

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
    // Charlie est le choix de départ : son avatar est possédé, ses deux disciples sont verrouillés.
    expect(heros.map((h) => h.classList.contains('verrouille'))).toEqual([false, true, true]);
    expect(heros[0]?.classList.contains('actif')).toBe(true);
  });

  it('choisir un autre dieu mémorise son avatar et montre ses héros', async () => {
    const { session } = monter();
    appuyer('Enter');
    parTitre('Plume').click();
    await attendre();
    expect(session.choisirHeros).toHaveBeenCalledWith('plume', 'plume');
    const noms = [...document.querySelectorAll('.choix-heros')].map((h) => h.getAttribute('aria-label'));
    expect(noms).toEqual(['Plume, l’Ombre Première', 'Suie : 30 braises', 'Corbeau : 30 braises']);
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
    parTitre('Plume').click();
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
    parTitre('Plume').click();
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
    parTitre('Plume').click();
    await attendre();
    expect(message()).toBe(t('meta.refus.heros_non_possede'));
    expect(document.querySelector('.choix-dieu.actif')?.getAttribute('aria-label')).toBe('Charlie');
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
