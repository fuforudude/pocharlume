// @vitest-environment happy-dom
// L'écran des héros et la boutique, avec une vraie session (stockage en mémoire) : un geste de l'écran change la
// sauvegarde, un refus est dit et ne change rien. Aucun Canvas : les écrans sont en DOM.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFS_META } from '../data/heros';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Depot, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { afficherBoutique } from './boutique';
import { afficherEcranHeros } from './ecran-heros';

const son = vi.hoisted(() => ({ jouerInterface: vi.fn() }));
vi.mock('../audio', () => ({ jouerInterface: son.jouerInterface }));

const ATLAS = { iconeUrl: () => 'icone.png' } as unknown as AtlasRendu;

async function ouvrir(sauvegarde: Sauvegarde): Promise<Session> {
  const session = await Session.ouvrir(new Depot(new StockageMemoire()), null, { defs: DEFS_META, verrou: null });
  await session.appliquerImport(sauvegarde);
  return session;
}

function avec(changements: (s: Sauvegarde) => Sauvegarde): Sauvegarde {
  return changements(sauvegardeVide());
}

function parTitre(titre: string): HTMLButtonElement {
  const trouve = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.title === titre || b.getAttribute('aria-label') === titre);
  if (!trouve) throw new Error(`Bouton introuvable : ${titre}`);
  return trouve;
}

function parTexte(texte: string): HTMLButtonElement {
  const trouve = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === texte);
  if (!trouve) throw new Error(`Bouton introuvable : ${texte}`);
  return trouve;
}

const message = (): string => document.querySelector('.meta-message')?.textContent ?? '';

/** Attend que la session ait fini d'écrire et que l'écran se soit redessiné. */
async function attendre(): Promise<void> {
  await vi.waitFor(() => {
    expect(true).toBe(true);
  });
  await new Promise((resolve) => setTimeout(resolve, 5));
}

afterEach(() => {
  document.body.replaceChildren();
});

beforeEach(() => {
  document.body.replaceChildren();
  son.jouerInterface.mockClear();
});

describe('écran des héros', () => {
  it('montre le héros du dernier choix, ses quatre compétences, son niveau, et verrouille l’ultime avant le niveau 6', async () => {
    const session = await ouvrir(sauvegardeVide());
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    expect(document.querySelector('.heros-detail .nom')?.textContent).toBe('Gond, le Portier');
    expect(document.querySelector('.heros-detail .niveau')?.textContent).toBe(t('heros.niveau', { n: 1 }));
    const cartes = [...document.querySelectorAll('.competence')];
    expect(cartes).toHaveLength(4);
    expect(cartes[3]?.classList.contains('ultime')).toBe(true);
    expect(cartes[3]?.classList.contains('verrouillee')).toBe(true);
    expect(cartes[3]?.textContent).toContain(t('heros.niveau_requis', { n: 6 }));
    expect(cartes[3]?.querySelector('button.placer')).toBeNull();
    expect(cartes[0]?.querySelector('button.placer')).not.toBeNull();
  });

  it('la liste montre les trois héros du dieu, les disciples pas recrutés verrouillés', async () => {
    const session = await ouvrir(sauvegardeVide());
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    const lignes = [...document.querySelectorAll('.ligne-heros')];
    expect(lignes.map((l) => l.classList.contains('verrouille'))).toEqual([false, true, true]);
    expect(document.querySelectorAll('.onglet-dieu')).toHaveLength(3);
  });

  it('placer un point met un rang, retire un point à placer ; reprendre les points les rend', async () => {
    const session = await ouvrir(sauvegardeVide());
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    expect(document.querySelector('.heros-actions .points')?.textContent).toBe(t('heros.points', { n: 1 }));
    parTitre(t('heros.placer', { nom: 'Poigne de fer' })).click();
    await attendre();
    expect(session.sauvegarde.meta.heros.charlie?.competences).toEqual({ poigne_de_fer: 1 });
    expect(document.querySelector('.heros-actions .points')?.textContent).toBe(t('heros.points', { n: 0 }));
    expect(document.querySelectorAll('.competence')[0]?.textContent).toContain(t('heros.rang', { n: 1, m: 3 }));

    // Plus de point : un second geste est refusé, avec sa raison.
    parTitre(t('heros.placer', { nom: 'Peau épaisse' })).click();
    await attendre();
    expect(message()).toBe(t('meta.refus.plus_de_points'));
    expect(session.sauvegarde.meta.heros.charlie?.competences).toEqual({ poigne_de_fer: 1 });

    parTexte(t('heros.reinitialiser')).click();
    await attendre();
    expect(session.sauvegarde.meta.heros.charlie?.competences).toEqual({});
    expect(document.querySelector('.heros-actions .points')?.textContent).toBe(t('heros.points', { n: 1 }));
  });

  it('un disciple pas recruté s’achète 30 braises après confirmation', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, monnaies: { aretes: 0, braises: 45 } } })));
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre('Mastoc').click();
    expect(document.querySelector('.heros-detail .niveau')).toBeNull();
    parTitre(t('heros.acheter', { n: 30 })).click();
    // Rien n'est débité avant la confirmation.
    expect(document.querySelector('.ecran.confirmation')?.textContent).toContain(t('heros.confirmer_titre', { nom: 'Mastoc' }));
    expect(document.querySelector('.ecran.confirmation')?.textContent).toContain(t('heros.confirmer_detail', { n: 30, m: 15 }));
    expect(session.sauvegarde.meta.monnaies.braises).toBe(45);
    parTexte(t('heros.confirmer')).click();
    await attendre();
    expect(session.sauvegarde.meta.monnaies.braises).toBe(15);
    expect(session.sauvegarde.meta.heros.mastoc).toEqual({ xp: 0, competences: {} });
    expect(message()).toBe(t('heros.recrute', { nom: 'Mastoc' }));
    // Recruté : le héros montre maintenant son niveau.
    expect(document.querySelector('.heros-detail .niveau')?.textContent).toBe(t('heros.niveau', { n: 1 }));
    expect(document.querySelector('.meta-monnaies')?.textContent).toBe('15');
  });

  it('avec moins de 30 braises, « Recruter » est désactivé et dit ce qui manque : pas de confirmation, rien n’est débité', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, monnaies: { aretes: 0, braises: 29 } } })));
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre('Mastoc').click();
    const recruter = parTitre(t('heros.acheter', { n: 30 }));
    expect(recruter.disabled).toBe(true);
    expect(document.querySelector('.heros-actions .manque-braises')?.textContent).toBe(t('heros.manque_braises', { n: 1 }));
    recruter.click();
    await attendre();
    expect(document.querySelector('.ecran.confirmation')).toBeNull();
    expect(session.sauvegarde.meta.monnaies.braises).toBe(29);
    expect(session.sauvegarde.meta.heros.mastoc).toBeUndefined();
  });

  it('avec 30 braises, « Recruter » est actif et ne parle d’aucun manque', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, monnaies: { aretes: 0, braises: 30 } } })));
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre('Mastoc').click();
    expect(parTitre(t('heros.acheter', { n: 30 })).disabled).toBe(false);
    expect(document.querySelector('.manque-braises')).toBeNull();
  });

  it('un geste dont l’écriture lève dit l’erreur au lieu de laisser un rejet orphelin, et l’écran reste utilisable', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, monnaies: { aretes: 90, braises: 60 } } })));
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const casse = vi.spyOn(session, 'acheterDisciple').mockRejectedValueOnce(new Error('écriture impossible'));
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre('Mastoc').click();
    parTitre(t('heros.acheter', { n: 30 })).click();
    parTexte(t('heros.confirmer')).click();
    await attendre();
    expect(message()).toBe(t('erreur.sauvegarde'));
    expect(son.jouerInterface).toHaveBeenCalledWith('refus');
    // Le geste suivant passe.
    parTitre(t('heros.acheter', { n: 30 })).click();
    parTexte(t('heros.confirmer')).click();
    await attendre();
    expect(message()).toBe(t('heros.recrute', { nom: 'Mastoc' }));
    casse.mockRestore();
    erreurs.mockRestore();
  });

  it('la boutique aussi dit l’erreur d’une écriture qui lève', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, monnaies: { aretes: 200, braises: 0 } } })));
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(session, 'acheterObjet').mockRejectedValueOnce(new Error('écriture impossible'));
    afficherBoutique(document.body, { atlas: ATLAS, session, onglet: 'objets', surFermer: vi.fn() });
    document.querySelector<HTMLButtonElement>('[data-cle="objet:sablier"]')?.click();
    await attendre();
    expect(message()).toBe(t('erreur.sauvegarde'));
    erreurs.mockRestore();
  });

  it('le bouton de placement affiche le texte « + » venu de la table des textes', async () => {
    const session = await ouvrir(sauvegardeVide());
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    const plus = document.querySelector('[data-cle^="placer:"]');
    expect(plus?.textContent).toBe(t('heros.plus'));
  });

  it('annuler la confirmation ne débite rien', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, monnaies: { aretes: 0, braises: 45 } } })));
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre('Mastoc').click();
    parTitre(t('heros.acheter', { n: 30 })).click();
    parTexte(t('heros.annuler')).click();
    await attendre();
    expect(session.sauvegarde.meta.monnaies.braises).toBe(45);
    expect(document.querySelector('.ecran.confirmation')).toBeNull();
  });

  it('une compétence se place sur un héros d’un autre dieu, et l’ultime est ouverte au niveau 6', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, heros: { ...s.meta.heros, plume: { xp: 1800, competences: {} } } } })));
    afficherEcranHeros(document.body, { atlas: ATLAS, session, heros: 'plume', surFermer: vi.fn() });
    expect(document.querySelector('.heros-detail .nom')?.textContent).toBe('Nielle, Souffle-Lampes');
    expect(document.querySelector('.heros-detail .niveau')?.textContent).toBe(t('heros.niveau', { n: 7 }));
    const ultime = document.querySelectorAll('.competence')[3];
    expect(ultime?.classList.contains('verrouillee')).toBe(false);
    parTitre(t('heros.placer', { nom: 'Ombre prêtée' })).click();
    await attendre();
    expect(session.sauvegarde.meta.heros.plume?.competences).toEqual({ ombre_premiere: 1 });
  });

  it('Échap ferme l’écran et rappelle surFermer', async () => {
    const session = await ouvrir(sauvegardeVide());
    const surFermer = vi.fn();
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(surFermer).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ecran-heros')).toBeNull();
  });
});

describe('boutique', () => {
  const riche = (): Sauvegarde =>
    avec((s) => ({
      ...s,
      progression: { niveauMax: 4, etoiles: { '1': { matou: 3 }, '2': { matou: 3 }, '3': { matou: 3 } } },
      meta: { ...s.meta, monnaies: { aretes: 130, braises: 0 } },
    }));

  it('l’arbre montre six branches de cinq rangs avec leur coût, et les étoiles à dépenser', async () => {
    const session = await ouvrir(riche());
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    expect(document.querySelectorAll('.branche')).toHaveLength(6);
    expect(document.querySelectorAll('.branche')[0]?.querySelectorAll('.pastilles i')).toHaveLength(5);
    expect(document.querySelector('.meta-monnaies')?.textContent).toBe('1309');
  });

  it('acheter un rang retire les étoiles ; réinitialiser les rend toutes après confirmation', async () => {
    const session = await ouvrir(riche());
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre(t('boutique.acheter_rang', { n: 1, nom: 'Les Griffes' })).click();
    await attendre();
    expect(session.sauvegarde.meta.arbre.caserne).toBe(1);
    parTitre(t('boutique.acheter_rang', { n: 2, nom: 'Les Griffes' })).click();
    await attendre();
    expect(session.sauvegarde.meta.arbre.caserne).toBe(2);
    // 9 étoiles gagnées, 1 + 2 dépensées : 6 disponibles.
    expect(document.querySelectorAll('.meta-monnaies .puce')[1]?.getAttribute('aria-label')).toBe(t('monnaie.etoiles', { n: 6 }));

    parTexte(t('boutique.reinitialiser')).click();
    expect(document.querySelector('.ecran.confirmation')?.textContent).toContain(t('boutique.reinit_detail', { n: 3 }));
    expect(session.sauvegarde.meta.arbre.caserne).toBe(2);
    parTexte(t('boutique.reinit_confirmer')).click();
    await attendre();
    expect(session.sauvegarde.meta.arbre.caserne).toBe(0);
    expect(document.querySelectorAll('.meta-monnaies .puce')[1]?.getAttribute('aria-label')).toBe(t('monnaie.etoiles', { n: 9 }));
  });

  it('on ne dépense pas plus d’étoiles qu’on n’en a gagné', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, progression: { niveauMax: 2, etoiles: { '1': { matou: 1 } } } })));
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre(t('boutique.acheter_rang', { n: 1, nom: 'Les Griffes' })).click();
    await attendre();
    expect(session.sauvegarde.meta.arbre.caserne).toBe(1);
    parTitre(t('boutique.acheter_rang', { n: 2, nom: 'Les Griffes' })).click();
    await attendre();
    expect(message()).toBe(t('meta.refus.etoiles_insuffisantes'));
    expect(session.sauvegarde.meta.arbre.caserne).toBe(1);
  });

  it('l’onglet des objets montre prix et stock ; acheter retire des arêtes et remplit le stock', async () => {
    const session = await ouvrir(riche());
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), onglet: 'objets' });
    expect(document.querySelectorAll('.objet')).toHaveLength(4);
    expect(document.querySelectorAll('.objet')[0]?.textContent).toContain(t('boutique.stock', { n: 0, m: 10 }));
    parTitre(t('boutique.acheter_objet', { nom: 'Fiole de Soufre' })).click();
    await attendre();
    expect(session.sauvegarde.meta.objets.fiole_soufre).toBe(1);
    expect(session.sauvegarde.meta.monnaies.aretes).toBe(70);
    expect(document.querySelectorAll('.objet')[0]?.textContent).toContain(t('boutique.stock', { n: 1, m: 10 }));
  });

  it('refuse un objet trop cher ou un stock plein, sans rien débiter', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, meta: { ...s.meta, monnaies: { aretes: 90, braises: 0 }, objets: { ...s.meta.objets, herbe_sabbat: 10 } } })));
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), onglet: 'objets' });
    parTitre(t('boutique.acheter_objet', { nom: 'Sablier' })).click();
    await attendre();
    expect(message()).toBe(t('meta.refus.aretes_insuffisantes'));
    parTitre(t('boutique.acheter_objet', { nom: 'Herbe de Sabbat' })).click();
    await attendre();
    expect(message()).toBe(t('meta.refus.stock_plein'));
    expect(session.sauvegarde.meta.monnaies.aretes).toBe(90);
  });

  it('passer d’un onglet à l’autre', async () => {
    const session = await ouvrir(riche());
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    expect(document.querySelector('.arbre')).not.toBeNull();
    parTexte(t('boutique.onglet_objets')).click();
    expect(document.querySelector('.arbre')).toBeNull();
    expect(document.querySelector('.objets')).not.toBeNull();
  });
});

describe('boutique : accès aux caisses et à la collection', () => {
  it('« Caisses » et « Collection » appellent leur écran, sur les deux onglets', async () => {
    const session = await ouvrir(sauvegardeVide());
    const surCaisses = vi.fn();
    const surCollection = vi.fn();
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCaisses, surCollection });
    for (const onglet of ['arbre', 'objets']) {
      document.querySelector<HTMLButtonElement>(`[data-cle="onglet:${onglet}"]`)?.click();
      parTexte(t('caisses.titre')).click();
      parTexte(t('collection.titre')).click();
    }
    expect(surCaisses).toHaveBeenCalledTimes(2);
    expect(surCollection).toHaveBeenCalledTimes(2);
  });

  it('sans rappel donné, ces boutons n’existent pas', async () => {
    const session = await ouvrir(sauvegardeVide());
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    expect([...document.querySelectorAll('button')].some((b) => b.textContent === t('caisses.titre'))).toBe(false);
  });
});

describe('sons d’interface des achats', () => {
  it('un achat de disciple, de rang d’arbre ou d’objet réussi sonne « achat » ; un refus sonne « refus »', async () => {
    const session = await ouvrir(avec((s) => ({ ...s, progression: { niveauMax: 2, etoiles: { '1': { matou: 2 } } }, meta: { ...s.meta, monnaies: { aretes: 99, braises: 30 } } })));
    afficherBoutique(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre(t('boutique.acheter_rang', { n: 1, nom: 'Les Griffes' })).click();
    await attendre();
    expect(son.jouerInterface).toHaveBeenLastCalledWith('achat');
    parTexte(t('boutique.onglet_objets')).click();
    parTitre(t('boutique.acheter_objet', { nom: 'Sablier' })).click();
    await attendre();
    expect(son.jouerInterface).toHaveBeenLastCalledWith('refus');
    parTitre(t('boutique.acheter_objet', { nom: 'Fiole de Soufre' })).click();
    await attendre();
    expect(son.jouerInterface).toHaveBeenLastCalledWith('achat');
    document.body.replaceChildren();

    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre('Mastoc').click();
    parTitre(t('heros.acheter', { n: 30 })).click();
    parTexte(t('heros.confirmer')).click();
    await attendre();
    expect(son.jouerInterface).toHaveBeenLastCalledWith('achat');
  });

  it('placer un point ou reprendre les points ne sonne pas comme un achat', async () => {
    const session = await ouvrir(sauvegardeVide());
    afficherEcranHeros(document.body, { atlas: ATLAS, session, surFermer: vi.fn() });
    parTitre(t('heros.placer', { nom: 'Poigne de fer' })).click();
    await attendre();
    expect(son.jouerInterface).not.toHaveBeenCalledWith('achat');
  });
});
