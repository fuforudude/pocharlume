// @vitest-environment happy-dom
// L'écran des caisses, avec une vraie session (stockage en mémoire) et un hasard à la main : les chances, la garantie restante,
// l'ouverture et sa révélation, le doublon, les refus, et la protection contre le double clic.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFS_META } from '../data/heros';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, ECLATS_DOUBLON, PRIX_CAISSE, RARETES } from '../data/meta';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Depot, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { afficherCaisses } from './caisses';

const son = vi.hoisted(() => ({ jouerInterface: vi.fn() }));
vi.mock('../audio', () => ({ jouerInterface: son.jouerInterface }));

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;

/** Un jet toujours à zéro : la rareté la plus commune, le premier objet de la caisse (ou, sous garantie, le premier Épique). */
const JET_ZERO = (): number => 0;

async function ouvrir(sauvegarde: Sauvegarde, aleatoire: (() => number) | null = JET_ZERO): Promise<Session> {
  const session = await Session.ouvrir(new Depot(new StockageMemoire()), null, { defs: DEFS_META, verrou: null, aleatoire });
  await session.appliquerImport(sauvegarde);
  return session;
}

function riche(braises = 100, collection: Partial<Sauvegarde['meta']['collection']> = {}): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, meta: { ...s.meta, monnaies: { aretes: 0, braises }, collection: { ...s.meta.collection, ...collection } } };
}

const message = (): string => document.querySelector('.meta-message')?.textContent ?? '';
const monnaies = (): string => document.querySelector('.meta-monnaies')?.textContent ?? '';
const caisse = (type: string): Element | null => document.querySelector(`.caisse[data-type="${type}"]`);
const boutonOuvrir = (type: string): HTMLButtonElement => {
  const b = document.querySelector<HTMLButtonElement>(`[data-cle="ouvrir:${type}"]`);
  if (!b) throw new Error(`bouton absent : ${type}`);
  return b;
};
const revelation = (): Element | null => document.querySelector('.revelation');

async function attendre(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

beforeEach(() => {
  document.body.replaceChildren();
  son.jouerInterface.mockClear();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('écran des caisses', () => {
  it('montre les deux caisses avec leur prix, les cinq chances lues dans meta.ts et la garantie restante', async () => {
    const session = await ouvrir(riche());
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    // Les deux caisses de l'histoire, puis celle du DLC.
    expect(document.querySelectorAll('.caisse')).toHaveLength(3);
    for (const type of ['skins', 'familiers']) {
      const c = caisse(type);
      expect(c?.textContent).toContain(t('caisses.prix', { n: PRIX_CAISSE }));
      const chances = [...(c?.querySelectorAll('.chance') ?? [])].map((x) => x.textContent);
      expect(chances).toEqual(RARETES.map((r) => t('caisses.chance', { rarete: t(`rarete.${r}`), n: CHANCES_RARETE[r] })));
      expect(c?.querySelector('.garantie')?.textContent).toContain(t('caisses.garantie', { n: CAISSES_AVANT_GARANTIE }));
    }
    // Braises, éclats, badges.
    expect(monnaies()).toBe('10000');
  });

  it('la garantie dit « à la prochaine caisse » quand le compteur est à 9, par type de caisse', async () => {
    const session = await ouvrir(riche(100, { garanties: { skins: 4, familiers: 9 } }));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    expect(caisse('skins')?.querySelector('.garantie')?.textContent).toContain(t('caisses.garantie', { n: 6 }));
    expect(caisse('familiers')?.querySelector('.garantie')?.textContent).toContain(t('caisses.garantie_une'));
  });

  it('ouvrir une caisse débite 20 braises, révèle l’objet, l’ajoute à la collection et avance la garantie', async () => {
    const session = await ouvrir(riche(45));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    boutonOuvrir('skins').click();
    await attendre();
    expect(session.sauvegarde.meta.monnaies.braises).toBe(25);
    expect(session.sauvegarde.meta.collection.possedes).toEqual({ skin_caserne_1: 1 });
    const r = revelation();
    expect(r).not.toBeNull();
    expect(r?.textContent).toContain('Grenier de Paille');
    expect(r?.textContent).toContain(t('rarete.commun'));
    expect(r?.textContent).toContain(t('caisses.resultat_nouveau', { nom: 'Grenier de Paille' }));
    expect(r?.classList.contains('rarete-commun')).toBe(true);
    expect(son.jouerInterface).toHaveBeenCalledWith('achat');
    // Le fond a suivi : braises à jour, garantie avancée (un Commun de plus sans Épique).
    expect(monnaies()).toBe('2500');
    expect(caisse('skins')?.querySelector('.garantie')?.textContent).toContain(t('caisses.garantie', { n: CAISSES_AVANT_GARANTIE - 1 }));
    expect(caisse('familiers')?.querySelector('.garantie')?.textContent).toContain(t('caisses.garantie', { n: CAISSES_AVANT_GARANTIE }));
  });

  it('« Continuer » ferme la révélation et rend le focus à la caisse', async () => {
    const session = await ouvrir(riche());
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    boutonOuvrir('familiers').click();
    await attendre();
    (revelation()?.querySelector('button') as HTMLButtonElement).click();
    expect(revelation()).toBeNull();
    expect(document.activeElement).toBe(boutonOuvrir('familiers'));
  });

  it('Échap ferme la révélation d’abord, l’écran ensuite', async () => {
    const session = await ouvrir(riche());
    const surFermer = vi.fn();
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer, surCollection: vi.fn() });
    boutonOuvrir('skins').click();
    await attendre();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(revelation()).toBeNull();
    expect(surFermer).not.toHaveBeenCalled();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(surFermer).toHaveBeenCalledTimes(1);
  });

  it('un doublon donne des éclats, affichés, et ne change pas la liste des objets', async () => {
    const session = await ouvrir(riche(100, { possedes: { skin_caserne_1: 1 } }));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    boutonOuvrir('skins').click();
    await attendre();
    const r = revelation();
    expect(r?.textContent).toContain(t('caisses.resultat_doublon', { nom: 'Grenier de Paille' }));
    expect(r?.textContent).toContain(t('caisses.resultat_eclats', { n: ECLATS_DOUBLON.commun }));
    expect(session.sauvegarde.meta.collection.eclats).toBe(ECLATS_DOUBLON.commun);
    expect(Object.keys(session.sauvegarde.meta.collection.possedes)).toEqual(['skin_caserne_1']);
    expect(monnaies()).toBe(`${String(100 - PRIX_CAISSE)}${String(ECLATS_DOUBLON.commun)}0`);
  });

  it('à la garantie, la révélation est un Épique ou mieux et le dit', async () => {
    const session = await ouvrir(riche(100, { garanties: { skins: 9, familiers: 0 } }));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    boutonOuvrir('skins').click();
    await attendre();
    const r = revelation();
    expect(r?.classList.contains('rarete-epique')).toBe(true);
    expect(r?.textContent).toContain(t('caisses.resultat_garantie'));
    expect(session.sauvegarde.meta.collection.garanties.skins).toBe(0);
    expect(caisse('skins')?.querySelector('.garantie')?.textContent).toContain(t('caisses.garantie', { n: CAISSES_AVANT_GARANTIE }));
  });

  it('sans assez de braises : refus lisible, rien n’est débité ni ouvert', async () => {
    const session = await ouvrir(riche(PRIX_CAISSE - 1));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    expect(boutonOuvrir('skins').classList.contains('grise')).toBe(true);
    boutonOuvrir('skins').click();
    await attendre();
    expect(message()).toBe(t('meta.refus.braises_insuffisantes'));
    expect(revelation()).toBeNull();
    expect(session.sauvegarde.meta.monnaies.braises).toBe(PRIX_CAISSE - 1);
    expect(session.sauvegarde.meta.collection.possedes).toEqual({});
    expect(son.jouerInterface).toHaveBeenCalledWith('refus');
  });

  it('double clic : une seule caisse s’ouvre, un seul débit', async () => {
    const session = await ouvrir(riche(100));
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    const b = boutonOuvrir('skins');
    b.click();
    b.click();
    boutonOuvrir('familiers').click();
    await attendre();
    expect(session.sauvegarde.meta.monnaies.braises).toBe(100 - PRIX_CAISSE);
    expect(document.querySelectorAll('.revelation')).toHaveLength(1);
  });

  it('sans source de hasard sur la plateforme, la caisse est refusée avec sa phrase', async () => {
    const session = await ouvrir(riche(100), null);
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    boutonOuvrir('skins').click();
    await attendre();
    expect(message()).toBe(t('collection.refus.aleatoire_indisponible'));
    expect(session.sauvegarde.meta.monnaies.braises).toBe(100);
  });

  it('une écriture qui lève est dite, sans exception ni révélation', async () => {
    const session = await ouvrir(riche(100));
    vi.spyOn(session, 'ouvrirCaisse').mockRejectedValue(new Error('verrou indisponible'));
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCollection: vi.fn() });
    boutonOuvrir('skins').click();
    await attendre();
    expect(message()).toBe(t('erreur.sauvegarde'));
    expect(revelation()).toBeNull();
    erreurs.mockRestore();
  });

  it('« Collection » et « Fermer » appellent leur rappel', async () => {
    const session = await ouvrir(riche());
    const surCollection = vi.fn();
    const surFermer = vi.fn();
    afficherCaisses(document.body, { atlas: ATLAS, session, surFermer, surCollection });
    [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === t('caisses.collection'))?.click();
    expect(surCollection).toHaveBeenCalledTimes(1);
    [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === t('caisses.fermer'))?.click();
    expect(surFermer).toHaveBeenCalledTimes(1);
  });
});
