// @vitest-environment happy-dom
// La caisse « Temps modernes » dans l'écran des caisses : solde de badges, prix, chances, garantie, ouverture et révélation, refus.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFS_META } from '../data/heros';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, ECLATS_DOUBLON, RARETES } from '../data/meta';
import { PRIX_CAISSE_MODERNE, skinsCaisseModerne } from '../data/recompenses-moderne';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Depot, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { afficherCaisses } from './caisses';

const son = vi.hoisted(() => ({ jouerInterface: vi.fn() }));
vi.mock('../audio', () => ({ jouerInterface: son.jouerInterface }));

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;

async function ouvrir(sauvegarde: Sauvegarde): Promise<Session> {
  const session = await Session.ouvrir(new Depot(new StockageMemoire()), null, { defs: DEFS_META, verrou: null, aleatoire: () => 0 });
  await session.appliquerImport(sauvegarde);
  return session;
}

function avecBadges(badges: number, collection: Partial<Sauvegarde['moderne']['collection']> = {}): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, moderne: { ...s.moderne, badges, collection: { ...s.moderne.collection, ...collection } } };
}

const carte = (): Element | null => document.querySelector('.caisse[data-type="moderne"]');
const bouton = (): HTMLButtonElement => {
  const b = document.querySelector<HTMLButtonElement>('[data-cle="ouvrir:moderne"]');
  if (!b) throw new Error('bouton absent');
  return b;
};
const attendre = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));

beforeEach(() => {
  document.body.replaceChildren();
  son.jouerInterface.mockClear();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('caisse Temps modernes', () => {
  it('montre le solde de badges, le prix en badges, les chances et la garantie', async () => {
    const session = await ouvrir(avecBadges(37, { garantie: 9 }));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    expect(document.querySelector('.meta-monnaies')?.lastElementChild?.getAttribute('aria-label')).toBe(t('monnaie.badges', { n: 37 }));
    // Le solde s'écrit à côté du jeton, pas dedans.
    expect(document.querySelector('.meta-monnaies')?.lastElementChild?.querySelector('span')?.textContent).toBe('37');
    expect(document.querySelector('.meta-monnaies .jeton-badge')?.textContent).toBe('');
    expect(carte()?.textContent).toContain(t('caisses.prix_badges', { n: PRIX_CAISSE_MODERNE }));
    expect([...(carte()?.querySelectorAll('.chance') ?? [])].map((x) => x.textContent)).toEqual(
      RARETES.map((r) => t('caisses.chance', { rarete: t(`rarete.${r}`), n: CHANCES_RARETE[r] })),
    );
    expect(carte()?.querySelector('.garantie')?.textContent).toContain(t('caisses.garantie_une'));
    expect(carte()?.textContent).toContain(t('caisses.badges_gagnes'));
    expect(CAISSES_AVANT_GARANTIE).toBe(10);
  });

  it('ouvrir débite les badges et révèle le skin du DLC ; un doublon donne des éclats', async () => {
    const session = await ouvrir(avecBadges(2 * PRIX_CAISSE_MODERNE));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    bouton().click();
    await attendre();
    const nom = tCle(`moderne.skin.${skinsCaisseModerne('commun')[0] ?? ''}`);
    expect(document.querySelector('.revelation .nom-revele')?.textContent).toBe(nom);
    expect(document.querySelector('.revelation .objet-revele img')?.getAttribute('src')).toBe('moderne-caserne-3.png');
    expect(session.sauvegarde.moderne.badges).toBe(PRIX_CAISSE_MODERNE);
    document.querySelector<HTMLButtonElement>('.revelation .bouton')?.click();
    bouton().click();
    await attendre();
    expect(document.querySelector('.revelation .eclats-gagnes')?.textContent).toContain(t('caisses.resultat_eclats', { n: ECLATS_DOUBLON.commun }));
    expect(session.sauvegarde.meta.collection.eclats).toBe(ECLATS_DOUBLON.commun);
  });

  it('sans assez de badges : refus dit, rien d’ouvert, le bouton est grisé', async () => {
    const session = await ouvrir(avecBadges(PRIX_CAISSE_MODERNE - 1));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    expect(bouton().classList.contains('grise')).toBe(true);
    bouton().click();
    await attendre();
    expect(document.querySelector('.revelation')).toBeNull();
    expect(document.querySelector('.meta-message')?.textContent).toBe(t('collection.refus.badges_insuffisants'));
  });

  it('redessine quand l’atlas du DLC est chargé', async () => {
    const session = await ouvrir(avecBadges(0));
    let charge: () => void = () => undefined;
    const chargerAtlasModerne = vi.fn(() => new Promise<void>((resolve) => { charge = resolve; }));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn(), chargerAtlasModerne });
    const avant = carte();
    charge();
    await attendre();
    expect(chargerAtlasModerne).toHaveBeenCalledOnce();
    expect(carte()).not.toBe(avant);
  });
});
