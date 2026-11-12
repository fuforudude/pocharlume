// @vitest-environment happy-dom
// L'onglet « Temps modernes » de la collection : les skins du DLC (obtenus, portés, à porter) et les titres.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFS_META } from '../data/heros';
import { DEFS_SKINS_MODERNES, DEFS_TITRES_MODERNES } from '../data/recompenses-moderne';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Depot, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { afficherCollection } from './collection';

vi.mock('../audio', () => ({ jouerInterface: vi.fn() }));

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;

async function monter(sauvegarde: Sauvegarde): Promise<Session> {
  const session = await Session.ouvrir(new Depot(new StockageMemoire()), null, { defs: DEFS_META, verrou: null });
  await session.appliquerImport(sauvegarde);
  afficherCollection(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCaisses: vi.fn(), onglet: 'moderne' });
  return session;
}

function avec(collection: Partial<Sauvegarde['moderne']['collection']>, titres: string[] = []): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, moderne: { ...s.moderne, titres, collection: { ...s.moderne.collection, ...collection } } };
}

const carte = (id: string): Element | null => document.querySelector(`.objet-moderne[data-id="${id}"]`);
const attendre = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));

beforeEach(() => {
  document.body.replaceChildren();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('collection : onglet Temps modernes', () => {
  it('montre tous les skins du DLC, en silhouette ceux qu’on n’a pas, et le compte', async () => {
    await monter(avec({ skinsTours: ['skin_moderne_tir'] }));
    expect(document.querySelectorAll('.objet-moderne')).toHaveLength(DEFS_SKINS_MODERNES.length);
    expect(carte('skin_moderne_tir')?.classList.contains('silhouette')).toBe(false);
    expect(carte('skin_moderne_magie')?.classList.contains('silhouette')).toBe(true);
    expect(document.querySelector('.collection-compte')?.textContent).toBe(t('collection.possedes', { n: 1, m: DEFS_SKINS_MODERNES.length }));
    expect(document.querySelector('[data-cle="onglet:moderne"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('porter puis retirer un skin du DLC l’écrit dans la sauvegarde', async () => {
    const session = await monter(avec({ skinsTours: ['skin_moderne_divine_plume'] }));
    document.querySelector<HTMLButtonElement>('[data-cle="porter:skin_moderne_divine_plume"]')?.click();
    await attendre();
    expect(session.sauvegarde.moderne.collection.equipes).toEqual({ divine_plume: 'skin_moderne_divine_plume' });
    expect(carte('skin_moderne_divine_plume')?.classList.contains('equipe')).toBe(true);
    document.querySelector<HTMLButtonElement>('[data-cle="porter:skin_moderne_divine_plume"]')?.click();
    await attendre();
    expect(session.sauvegarde.moderne.collection.equipes).toEqual({});
  });

  it('un skin de héros pas recruté ne se porte pas : pas de bouton, une explication', async () => {
    await monter(avec({ skinsHeros: ['skin_moderne_mastoc'] }));
    expect(document.querySelector('[data-cle="porter:skin_moderne_mastoc"]')).toBeNull();
    expect(carte('skin_moderne_mastoc')?.textContent).toContain(t('collection.moderne_herosabsent'));
  });

  it('liste les titres : obtenus, et la condition des autres', async () => {
    await monter(avec({}, ['fac_occupee']));
    const titres = [...document.querySelectorAll('.titre-moderne')];
    expect(titres).toHaveLength(DEFS_TITRES_MODERNES.length);
    expect(titres[0]?.textContent).toBe(t('moderne.titre.fac_occupee') + t('collection.titre_obtenu'));
    expect(titres[2]?.textContent).toBe(t('moderne.titre.prefecture_tombee') + t('moderne.titre.prefecture_tombee.condition'));
  });
});
