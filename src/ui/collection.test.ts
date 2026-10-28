// @vitest-environment happy-dom
// L'écran de la collection, avec une vraie session (stockage en mémoire) : objets possédés et silhouettes, rareté, rang, bonus,
// monter un rang, acheter un objet précis, équiper un skin ou un familier, et le total de bonus d'un porteur avec son plafond.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFS_META } from '../data/heros';
import { PLAFOND_BONUS_POURCENT, PRIX_ECLATS_OBJET } from '../data/meta';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { Depot, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { afficherCollection } from './collection';

const son = vi.hoisted(() => ({ jouerInterface: vi.fn() }));
vi.mock('../audio', () => ({ jouerInterface: son.jouerInterface }));

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;

async function ouvrir(sauvegarde: Sauvegarde): Promise<Session> {
  const session = await Session.ouvrir(new Depot(new StockageMemoire()), null, { defs: DEFS_META, verrou: null });
  await session.appliquerImport(sauvegarde);
  return session;
}

function avec(collection: Partial<Sauvegarde['meta']['collection']>, heros: string[] = []): Sauvegarde {
  const s = sauvegardeVide();
  return {
    ...s,
    meta: {
      ...s.meta,
      heros: { ...s.meta.heros, ...Object.fromEntries(heros.map((h) => [h, { xp: 0, competences: {} }])) },
      collection: { ...s.meta.collection, ...collection },
    },
  };
}

const message = (): string => document.querySelector('.meta-message')?.textContent ?? '';
const carte = (id: string): HTMLElement => {
  const c = document.querySelector<HTMLElement>(`.objet-collection[data-id="${id}"]`);
  if (!c) throw new Error(`carte absente : ${id}`);
  return c;
};
const bouton = (cle: string): HTMLButtonElement => {
  const b = document.querySelector<HTMLButtonElement>(`[data-cle="${cle}"]`);
  if (!b) throw new Error(`bouton absent : ${cle}`);
  return b;
};
const onglet = (nom: string): void => { bouton(`onglet:${nom}`).click(); };

async function attendre(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

async function monter(sauvegarde: Sauvegarde, rappels: { surCaisses?: () => void } = {}): Promise<Session> {
  const session = await ouvrir(sauvegarde);
  afficherCollection(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCaisses: rappels.surCaisses ?? vi.fn() });
  return session;
}

beforeEach(() => {
  document.body.replaceChildren();
  son.jouerInterface.mockClear();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('collection : liste', () => {
  it('montre les 21 skins, les possédés en couleur et les autres en silhouette, avec rareté, rang et bonus', async () => {
    await monter(avec({ possedes: { skin_tir_2: 3 } }));
    expect(document.querySelectorAll('.objet-collection')).toHaveLength(21);
    const possede = carte('skin_tir_2');
    expect(possede.classList.contains('silhouette')).toBe(false);
    expect(possede.classList.contains('rarete-rare')).toBe(true);
    expect(possede.textContent).toContain('Clocher Givré');
    expect(possede.textContent).toContain(t('rarete.rare'));
    expect(possede.textContent).toContain(t('collection.rang', { n: 3, m: 5 }));
    // Rare : base 2 %, rang 3 : × 1,5 = 3 %, sur la portée.
    expect(possede.textContent).toContain(t('collection.bonus_objet', { n: '3', stat: 'Portée' }));
    const absent = carte('skin_caserne_1');
    expect(absent.classList.contains('silhouette')).toBe(true);
    expect(absent.querySelector('img.icone')?.classList.contains('silhouette')).toBe(true);
    expect(absent.textContent).toContain(t('collection.verrouille'));
    expect(absent.textContent).toContain(t('collection.bonus_objet_pas_possede', { n: '1', stat: 'PV des soldats' }));
  });

  it('le compte des objets possédés est donné pour chaque onglet', async () => {
    await monter(avec({ possedes: { skin_tir_2: 1, skin_caserne_1: 1, familier_rat: 1 } }));
    expect(document.querySelector('.collection-compte')?.textContent).toBe(t('collection.possedes', { n: 2, m: 21 }));
    onglet('familiers');
    expect(document.querySelectorAll('.objet-collection')).toHaveLength(12);
    expect(document.querySelector('.collection-compte')?.textContent).toBe(t('collection.possedes', { n: 1, m: 12 }));
  });

  it('monnaies : les éclats sont dans la barre du haut', async () => {
    await monter(avec({ eclats: 77 }));
    expect(document.querySelector('.meta-monnaies')?.textContent).toBe('0' + '77');
  });
});

describe('collection : monter un rang et acheter', () => {
  it('monter du rang 2 au rang 3 coûte 40 éclats', async () => {
    const session = await monter(avec({ possedes: { skin_tir_2: 2 }, eclats: 100 }));
    expect(bouton('monter:skin_tir_2').textContent).toContain('40');
    bouton('monter:skin_tir_2').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.possedes.skin_tir_2).toBe(3);
    expect(session.sauvegarde.meta.collection.eclats).toBe(60);
    expect(message()).toBe(t('collection.monte', { nom: 'Clocher Givré', n: 3 }));
    expect(carte('skin_tir_2').textContent).toContain(t('collection.rang', { n: 3, m: 5 }));
    expect(son.jouerInterface).toHaveBeenCalledWith('achat');
  });

  it('pas assez d’éclats : refus lisible, rien ne change', async () => {
    const session = await monter(avec({ possedes: { skin_tir_2: 2 }, eclats: 39 }));
    expect(bouton('monter:skin_tir_2').classList.contains('grise')).toBe(true);
    bouton('monter:skin_tir_2').click();
    await attendre();
    expect(message()).toBe(t('collection.refus.eclats_insuffisants'));
    expect(session.sauvegarde.meta.collection.possedes.skin_tir_2).toBe(2);
    expect(session.sauvegarde.meta.collection.eclats).toBe(39);
    expect(son.jouerInterface).toHaveBeenCalledWith('refus');
  });

  it('au rang maximal, plus de bouton de montée', async () => {
    await monter(avec({ possedes: { skin_tir_2: 5 }, eclats: 9999 }));
    expect(document.querySelector('[data-cle="monter:skin_tir_2"]')).toBeNull();
    expect(carte('skin_tir_2').textContent).toContain(t('collection.rang_max'));
  });

  it('un objet pas possédé s’achète au prix de sa rareté, au rang 1', async () => {
    const session = await monter(avec({ eclats: 400 }));
    expect(bouton('acheter:skin_caserne_3').textContent).toContain(String(PRIX_ECLATS_OBJET.epique));
    bouton('acheter:skin_caserne_3').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.possedes.skin_caserne_3).toBe(1);
    expect(session.sauvegarde.meta.collection.eclats).toBe(400 - PRIX_ECLATS_OBJET.epique);
    expect(message()).toBe(t('collection.achete', { nom: 'Grenier des Veilleurs' }));
    expect(carte('skin_caserne_3').classList.contains('silhouette')).toBe(false);
    expect(document.querySelector('[data-cle="acheter:skin_caserne_3"]')).toBeNull();
  });

  it('acheter sans assez d’éclats est refusé et ne débite rien', async () => {
    const session = await monter(avec({ eclats: PRIX_ECLATS_OBJET.epique - 1 }));
    bouton('acheter:skin_caserne_3').click();
    await attendre();
    expect(message()).toBe(t('collection.refus.eclats_insuffisants'));
    expect(session.sauvegarde.meta.collection.eclats).toBe(PRIX_ECLATS_OBJET.epique - 1);
    expect(session.sauvegarde.meta.collection.possedes).toEqual({});
  });

  it('double clic : un seul rang monté, un seul débit', async () => {
    const session = await monter(avec({ possedes: { skin_tir_2: 1 }, eclats: 100 }));
    const b = bouton('monter:skin_tir_2');
    b.click();
    b.click();
    await attendre();
    expect(session.sauvegarde.meta.collection.possedes.skin_tir_2).toBe(2);
    expect(session.sauvegarde.meta.collection.eclats).toBe(80);
  });
});

describe('collection : équiper', () => {
  it('équiper un skin le pose sur sa tour ; le retirer le déséquipe', async () => {
    const session = await monter(avec({ possedes: { skin_tir_1: 1 } }));
    expect(bouton('equiper:skin_tir_1').textContent).toBe(t('collection.equiper'));
    bouton('equiper:skin_tir_1').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.skins).toEqual({ tir: 'skin_tir_1' });
    expect(message()).toBe(t('collection.equipe_ok', { nom: 'Clocher de Suie', porteur: 'Tir' }));
    expect(carte('skin_tir_1').classList.contains('equipe')).toBe(true);
    expect(bouton('equiper:skin_tir_1').textContent).toBe(t('collection.retirer'));
    bouton('equiper:skin_tir_1').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.skins).toEqual({});
    expect(message()).toBe(t('collection.retire_ok', { nom: 'Clocher de Suie', porteur: 'Tir' }));
  });

  it('un autre skin de la même tour remplace le premier', async () => {
    const session = await monter(avec({ possedes: { skin_tir_1: 1, skin_tir_2: 1 }, equipes: { skins: { tir: 'skin_tir_1' }, familiers: {} } }));
    bouton('equiper:skin_tir_2').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.skins).toEqual({ tir: 'skin_tir_2' });
    expect(carte('skin_tir_1').classList.contains('equipe')).toBe(false);
    expect(carte('skin_tir_2').classList.contains('equipe')).toBe(true);
  });

  it('le skin d’un héros pas recruté est refusé avec sa raison', async () => {
    const session = await monter(avec({ possedes: { skin_suie: 1 } }));
    bouton('equiper:skin_suie').click();
    await attendre();
    expect(message()).toBe(t('meta.refus.heros_non_possede'));
    expect(session.sauvegarde.meta.collection.equipes.skins).toEqual({});
  });

  it('un familier se porte sur un héros recruté au choix : un seul par héros, le même sur plusieurs', async () => {
    const session = await monter(avec({ possedes: { familier_rat: 1, familier_chouette: 1 } }, ['suie']));
    onglet('familiers');
    bouton('porteurs:familier_rat').click();
    bouton('porteur:familier_rat:plume').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.familiers).toEqual({ plume: 'familier_rat' });
    // Le même familier sur un second héros.
    bouton('porteur:familier_rat:suie').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.familiers).toEqual({ plume: 'familier_rat', suie: 'familier_rat' });
    // Un autre familier sur Plume remplace le premier : un seul familier par héros.
    bouton('porteurs:familier_chouette').click();
    bouton('porteur:familier_chouette:plume').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.familiers).toEqual({ plume: 'familier_chouette', suie: 'familier_rat' });
    // Reprendre le même porteur le déséquipe.
    bouton('porteur:familier_chouette:plume').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.familiers).toEqual({ suie: 'familier_rat' });
  });

  it('seuls les héros recrutés sont proposés pour un familier', async () => {
    await monter(avec({ possedes: { familier_rat: 1 } }));
    onglet('familiers');
    bouton('porteurs:familier_rat').click();
    expect([...document.querySelectorAll('[data-cle^="porteur:familier_rat:"]')].map((b) => (b as HTMLElement).dataset.cle)).toEqual([
      'porteur:familier_rat:plume',
      'porteur:familier_rat:charlie',
      'porteur:familier_rat:pollen',
    ]);
  });

  it('un familier pas possédé ne s’équipe pas : il s’achète', async () => {
    await monter(avec({}));
    onglet('familiers');
    expect(document.querySelector('[data-cle="porteurs:familier_rat"]')).toBeNull();
    expect(document.querySelector('[data-cle="acheter:familier_rat"]')).not.toBeNull();
  });
});

describe('collection : équipement et plafond de bonus', () => {
  it('liste les quatre tours et les héros recrutés, avec leur skin, leur familier et le total de leur bonus', async () => {
    await monter(avec({
      possedes: { skin_plume: 2, familier_chouette: 1, skin_tir_1: 1 },
      equipes: { skins: { plume: 'skin_plume', tir: 'skin_tir_1' }, familiers: { plume: 'familier_chouette' } },
    }));
    onglet('equipement');
    expect(document.querySelectorAll('.porteur')).toHaveLength(7);
    const plume = document.querySelector<HTMLElement>('.porteur[data-id="plume"]');
    expect(plume?.textContent).toContain('Manteau d’Ombre');
    expect(plume?.textContent).toContain('Chouette Aveugle');
    // Skin Rare rang 2 : 2,5 %, familier Rare rang 1 : 1,5 % : 4 % au total.
    expect(plume?.textContent).toContain(t('collection.bonus_total', { n: '4', m: PLAFOND_BONUS_POURCENT }));
    expect(document.querySelector('.porteur[data-id="tir"]')?.textContent).toContain(t('collection.bonus_total', { n: '1', m: PLAFOND_BONUS_POURCENT }));
    expect(document.querySelector('.porteur[data-id="magie"]')?.textContent).toContain(t('collection.bonus_aucun', { m: PLAFOND_BONUS_POURCENT }));
  });

  it('au-delà de +10 %, le total est celui du plafond et l’écran le dit', async () => {
    await monter(avec({
      possedes: { skin_lanterne: 5, familier_salamandre: 5 },
      equipes: { skins: { lanterne: 'skin_lanterne' }, familiers: { lanterne: 'familier_salamandre' } },
    }, ['lanterne']));
    onglet('equipement');
    const lanterne = document.querySelector<HTMLElement>('.porteur[data-id="lanterne"]');
    expect(lanterne?.textContent).toContain(t('collection.bonus_total_plafonne', { n: '10', m: PLAFOND_BONUS_POURCENT }));
    expect(lanterne?.classList.contains('plafonne')).toBe(true);
  });

  it('retirer un skin ou un familier depuis la liste des porteurs', async () => {
    const session = await monter(avec({
      possedes: { skin_plume: 1, familier_chouette: 1 },
      equipes: { skins: { plume: 'skin_plume' }, familiers: { plume: 'familier_chouette' } },
    }));
    onglet('equipement');
    bouton('retirer-skin:plume').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.skins).toEqual({});
    bouton('retirer-familier:plume').click();
    await attendre();
    expect(session.sauvegarde.meta.collection.equipes.familiers).toEqual({});
    expect(document.querySelector('[data-cle="retirer-skin:plume"]')).toBeNull();
  });
});

describe('collection : navigation', () => {
  it('« Caisses » appelle son rappel', async () => {
    const surCaisses = vi.fn();
    await monter(avec({}), { surCaisses });
    [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === t('collection.caisses'))?.click();
    expect(surCaisses).toHaveBeenCalledTimes(1);
  });

  it('une écriture qui lève est dite, sans exception', async () => {
    const session = await ouvrir(avec({ possedes: { skin_tir_1: 1 } }));
    vi.spyOn(session, 'equiperSkin').mockRejectedValue(new Error('verrou indisponible'));
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    afficherCollection(document.body, { atlas: ATLAS, session, surFermer: vi.fn(), surCaisses: vi.fn() });
    bouton('equiper:skin_tir_1').click();
    await attendre();
    expect(message()).toBe(t('erreur.sauvegarde'));
    erreurs.mockRestore();
  });
});
