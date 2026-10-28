// Session et collection : caisses, rangs, achats précis et équipement écrits aussitôt, rejoués sous verrou sur le stockage
// quand deux onglets travaillent ensemble, et le tirage reste celui qui a été écrit.
import { describe, expect, it } from 'vitest';
import { objetsDeCaisse } from '../data/collection';
import { BRAISES_DEFI, CAISSES_AVANT_GARANTIE, ECLATS_DOUBLON, PRIX_CAISSE, PRIX_ECLATS_OBJET, coutRangEclats } from '../data/meta';
import { VERSION_DONNEES } from '../data/version';
import type { ConfigPartie } from '../engine/etat';
import { sourceConstante, sourceGraine, sourceListe } from '../meta/aides.test-utils';
import type { SourceAleatoire } from '../meta/aleatoire';
import { collectionVide, type Collection } from '../meta/collection';
import { DEFS_TEST, StockageTruque } from './aides.test-utils';
import { CLE_SAUVEGARDE, Depot } from './depot';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { Session } from './session';
import { StockageMemoire, type Stockage } from './stockage';
import { creerVerrouMemoire, type VerrouSauvegarde } from './verrou';

function depart(options: { braises?: number; eclats?: number; collection?: Partial<Collection>; niveaux?: number } = {}): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= (options.niveaux ?? 0); n++) s = enregistrerVictoire(s, n, 'matou', 3);
  return {
    ...s,
    meta: {
      ...s.meta,
      monnaies: { aretes: 0, braises: options.braises ?? 0 },
      collection: { ...collectionVide(), ...options.collection, eclats: options.eclats ?? 0 },
    },
  };
}

interface Poste {
  stockage: Stockage;
  verrou: VerrouSauvegarde;
}

async function poste(initiale: Sauvegarde, stockage: Stockage = new StockageMemoire()): Promise<Poste> {
  expect(await new Depot(stockage).enregistrer(initiale)).toBe(true);
  return { stockage, verrou: creerVerrouMemoire() };
}

function onglet(p: Poste, aleatoire: SourceAleatoire | null = sourceConstante(0)): Promise<Session> {
  return Session.ouvrir(new Depot(p.stockage), null, { verrou: p.verrou, defs: DEFS_TEST, aleatoire });
}

async function stockee(p: Poste): Promise<Sauvegarde> {
  return (await onglet(p)).sauvegarde;
}

describe('ouvrir une caisse', () => {
  it('débite les braises, écrit l’objet obtenu et rend le tirage', async () => {
    const p = await poste(depart({ braises: 45 }));
    const s = await onglet(p, sourceListe([0, 0]));
    const r = await s.ouvrirCaisse('skins');
    if (!r.ok) throw new Error(r.raison);
    expect(r.ecrite).toBe(true);
    const attendu = objetsDeCaisse('skins', 'commun')[0];
    expect(r.detail).toMatchObject({ id: attendu, rarete: 'commun', nouveau: true, eclats: 0, garantie: false, braises: PRIX_CAISSE });
    const relue = await stockee(p);
    expect(relue.meta.monnaies.braises).toBe(25);
    expect(attendu && relue.meta.collection.possedes[attendu]).toBe(1);
    expect(relue.meta.collection.garanties).toEqual({ skins: 1, familiers: 0 });
  });

  it('ne consomme que deux nombres du hasard par caisse, même rejouée sur le stockage', async () => {
    const p = await poste(depart({ braises: 40 }));
    const s = await onglet(p, sourceListe([0.7, 0, 0.9, 0]));
    expect((await s.ouvrirCaisse('familiers')).ok).toBe(true);
    expect((await s.ouvrirCaisse('familiers')).ok).toBe(true);
    // La source de test n'a que 4 nombres et lève au cinquième : deux caisses, deux nombres chacune, pas un de plus.
    const relue = await stockee(p);
    expect(relue.meta.monnaies.braises).toBe(0);
    expect(Object.keys(relue.meta.collection.possedes)).toHaveLength(2);
  });

  it('un doublon se change en éclats, selon la rareté', async () => {
    const id = objetsDeCaisse('skins', 'epique')[0];
    if (!id) throw new Error('aucun épique');
    const p = await poste(depart({ braises: 20, eclats: 10, collection: { possedes: { [id]: 2 } } }));
    const s = await onglet(p, sourceListe([0.9, 0]));
    const r = await s.ouvrirCaisse('skins');
    expect(r.ok && r.detail).toMatchObject({ id, nouveau: false, eclats: ECLATS_DOUBLON.epique });
    const relue = await stockee(p);
    expect(relue.meta.collection.eclats).toBe(10 + ECLATS_DOUBLON.epique);
    expect(relue.meta.collection.possedes[id]).toBe(2);
  });

  it('refuse sans braises ou pour un type inconnu : rien n’est écrit', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ braises: PRIX_CAISSE - 1 }), stockage);
    const s = await onglet(p, sourceGraine(1));
    const ecritures = stockage.ecritures;
    const avant = stockage.donnees.get(CLE_SAUVEGARDE);
    expect(await s.ouvrirCaisse('skins')).toEqual({ ok: false, raison: 'braises_insuffisantes' });
    expect(await s.ouvrirCaisse('autre')).toEqual({ ok: false, raison: 'type_inconnu' });
    expect(stockage.ecritures).toBe(ecritures);
    expect(stockage.donnees.get(CLE_SAUVEGARDE)).toBe(avant);
  });

  it('sans source aléatoire (plateforme sans crypto), les caisses sont refusées au lieu d’être tirées avec un hasard faible', async () => {
    const p = await poste(depart({ braises: 100 }));
    const s = await onglet(p, null);
    expect(await s.ouvrirCaisse('skins')).toEqual({ ok: false, raison: 'aleatoire_indisponible' });
    expect((await stockee(p)).meta.monnaies.braises).toBe(100);
  });

  it('par défaut, le hasard vient de crypto.getRandomValues', async () => {
    const p = await poste(depart({ braises: 100 }));
    const s = await Session.ouvrir(new Depot(p.stockage), null, { verrou: p.verrou });
    const r = await s.ouvrirCaisse('familiers');
    expect(r.ok).toBe(true);
    expect((await stockee(p)).meta.monnaies.braises).toBe(80);
  });

  it(`la caisse numéro ${String(CAISSES_AVANT_GARANTIE)} sans Épique en donne un, à travers la session et le stockage`, async () => {
    const p = await poste(depart({ braises: PRIX_CAISSE * CAISSES_AVANT_GARANTIE }));
    const s = await onglet(p, sourceConstante(0));
    const raretes: string[] = [];
    for (let i = 0; i < CAISSES_AVANT_GARANTIE; i++) {
      const r = await s.ouvrirCaisse('skins');
      if (!r.ok) throw new Error(r.raison);
      raretes.push(r.detail.rarete);
    }
    expect(raretes.slice(-1)).toEqual(['epique']);
    expect(raretes.slice(0, -1).every((r) => r === 'commun')).toBe(true);
    expect((await stockee(p)).meta.collection.garanties.skins).toBe(0);
  });

  describe('deux onglets', () => {
    it('avec 20 braises, une seule des deux caisses réussit : rien n’est débité deux fois', async () => {
      const p = await poste(depart({ braises: PRIX_CAISSE }));
      const a = await onglet(p, sourceConstante(0));
      const b = await onglet(p, sourceConstante(0.7));
      const [ra, rb] = await Promise.all([a.ouvrirCaisse('skins'), b.ouvrirCaisse('familiers')]);
      expect([ra.ok, rb.ok].filter(Boolean)).toHaveLength(1);
      const refusee = ra.ok ? rb : ra;
      expect(refusee).toEqual({ ok: false, raison: 'braises_insuffisantes' });
      const relue = await stockee(p);
      expect(relue.meta.monnaies.braises).toBe(0);
      expect(Object.keys(relue.meta.collection.possedes)).toHaveLength(1);
    });

    it('avec 40 braises, les deux caisses réussissent et se cumulent', async () => {
      const p = await poste(depart({ braises: 2 * PRIX_CAISSE }));
      const a = await onglet(p, sourceConstante(0));
      const b = await onglet(p, sourceConstante(0));
      const [ra, rb] = await Promise.all([a.ouvrirCaisse('skins'), b.ouvrirCaisse('familiers')]);
      expect(ra.ok && rb.ok).toBe(true);
      const relue = await stockee(p);
      expect(relue.meta.monnaies.braises).toBe(0);
      expect(relue.meta.collection.garanties).toEqual({ skins: 1, familiers: 1 });
      expect(Object.keys(relue.meta.collection.possedes)).toHaveLength(2);
    });

    it('la garantie se juge sur le stockage : une vue périmée ne l’esquive pas, ni ne la double', async () => {
      // Les deux onglets voient 8 caisses sans Épique. L'onglet A ouvre la 9e ; B, avec sa vue périmée, ouvre alors la 10e.
      const p = await poste(depart({ braises: 2 * PRIX_CAISSE, collection: { garanties: { skins: CAISSES_AVANT_GARANTIE - 2, familiers: 0 } } }));
      const a = await onglet(p, sourceConstante(0));
      const b = await onglet(p, sourceConstante(0));
      const ra = await a.ouvrirCaisse('skins');
      const rb = await b.ouvrirCaisse('skins');
      if (!ra.ok || !rb.ok) throw new Error('les deux caisses devaient réussir');
      expect(ra.detail.rarete).toBe('commun');
      // B pensait ouvrir une 9e caisse commune ; sur le stockage c'est la 10e : l'Épique garanti est servi, et rendu tel quel.
      expect(rb.detail.rarete).toBe('epique');
      expect(rb.detail.garantie).toBe(true);
      expect((await stockee(p)).meta.collection.garanties.skins).toBe(0);
    });

    it('un objet obtenu par l’autre onglet devient un doublon : éclats, pas deux exemplaires', async () => {
      const p = await poste(depart({ braises: 2 * PRIX_CAISSE }));
      const a = await onglet(p, sourceConstante(0));
      const b = await onglet(p, sourceConstante(0));
      const ra = await a.ouvrirCaisse('skins');
      const rb = await b.ouvrirCaisse('skins');
      expect(ra.ok && ra.detail.nouveau).toBe(true);
      expect(rb.ok && rb.detail.nouveau).toBe(false);
      expect(rb.ok && rb.detail.eclats).toBe(ECLATS_DOUBLON.commun);
      const relue = await stockee(p);
      expect(relue.meta.collection.eclats).toBe(ECLATS_DOUBLON.commun);
      expect(Object.values(relue.meta.collection.possedes)).toEqual([1]);
    });
  });

  it('écriture impossible : la caisse reste en mémoire, `ecrite` est faux, et la même caisse est écrite avec la suivante', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ braises: 60 }), stockage);
    const s = await onglet(p, sourceListe([0.7, 0, 0, 0]));
    stockage.panneEcriture = true;
    const premiere = await s.ouvrirCaisse('skins');
    if (!premiere.ok) throw new Error(premiere.raison);
    expect(premiere.ecrite).toBe(false);
    expect(premiere.detail.rarete).toBe('rare');
    expect(s.sauvegarde.meta.monnaies.braises).toBe(40);
    stockage.panneEcriture = false;
    const seconde = await s.ouvrirCaisse('skins');
    if (!seconde.ok) throw new Error(seconde.raison);
    expect(seconde.ecrite).toBe(true);
    const relue = await stockee(p);
    expect(relue.meta.monnaies.braises).toBe(20);
    expect(Object.keys(relue.meta.collection.possedes)).toHaveLength(2);
    expect(relue.meta.collection.possedes[premiere.detail.id]).toBe(1);
  });
});

describe('rangs, achats précis, équipement', () => {
  it('monter un rang retire 20 × rang éclats et s’écrit', async () => {
    const p = await poste(depart({ eclats: 100, collection: { possedes: { skin_tir_1: 2 } } }));
    const s = await onglet(p);
    expect(await s.monterRang('skin_tir_1')).toMatchObject({ ok: true, ecrite: true });
    const relue = await stockee(p);
    expect(relue.meta.collection.possedes.skin_tir_1).toBe(3);
    expect(relue.meta.collection.eclats).toBe(100 - coutRangEclats(2));
  });

  it('refuse sans assez d’éclats, au rang maximal, ou pour un objet qu’on n’a pas', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ eclats: 10, collection: { possedes: { skin_tir_1: 1, skin_tir_2: 5 } } }), stockage);
    const s = await onglet(p);
    const ecritures = stockage.ecritures;
    expect(await s.monterRang('skin_tir_1')).toEqual({ ok: false, raison: 'eclats_insuffisants' });
    expect(await s.monterRang('skin_tir_2')).toEqual({ ok: false, raison: 'rang_max' });
    expect(await s.monterRang('skin_magie_1')).toEqual({ ok: false, raison: 'non_possede' });
    expect(await s.monterRang('inconnu')).toEqual({ ok: false, raison: 'objet_inconnu' });
    expect(stockage.ecritures).toBe(ecritures);
  });

  it('monter un rang vise le rang vu : si l’autre onglet l’a déjà monté, refus modifie_ailleurs et rien n’est débité deux fois', async () => {
    const p = await poste(depart({ eclats: 500, collection: { possedes: { skin_tir_1: 1 } } }));
    const a = await onglet(p);
    const b = await onglet(p);
    expect((await a.monterRang('skin_tir_1')).ok).toBe(true);
    expect(await b.monterRang('skin_tir_1')).toEqual({ ok: false, raison: 'modifie_ailleurs' });
    const relue = await stockee(p);
    expect(relue.meta.collection.possedes.skin_tir_1).toBe(2);
    expect(relue.meta.collection.eclats).toBe(500 - coutRangEclats(1));
  });

  it('acheter un objet précis retire ses éclats ; deux onglets ne l’achètent pas deux fois', async () => {
    const prix = PRIX_ECLATS_OBJET.rare;
    const p = await poste(depart({ eclats: 2 * prix }));
    const a = await onglet(p);
    const b = await onglet(p);
    const [ra, rb] = await Promise.all([a.acheterObjetPrecis('skin_tir_2'), b.acheterObjetPrecis('skin_tir_2')]);
    expect([ra.ok, rb.ok].filter(Boolean)).toHaveLength(1);
    expect(ra.ok ? rb : ra).toEqual({ ok: false, raison: 'deja_possede' });
    const relue = await stockee(p);
    expect(relue.meta.collection.eclats).toBe(prix);
    expect(relue.meta.collection.possedes.skin_tir_2).toBe(1);
  });

  it('équipe puis déséquipe un skin et un familier, écrit et relu', async () => {
    const p = await poste(depart({ collection: { possedes: { skin_tir_1: 1, familier_rat: 1 } } }));
    const s = await onglet(p);
    expect((await s.equiperSkin('tir', 'skin_tir_1')).ok).toBe(true);
    expect((await s.equiperFamilier('charlie', 'familier_rat')).ok).toBe(true);
    expect((await stockee(p)).meta.collection.equipes).toEqual({ skins: { tir: 'skin_tir_1' }, familiers: { charlie: 'familier_rat' } });
    expect((await s.equiperSkin('tir', null)).ok).toBe(true);
    expect((await s.equiperFamilier('charlie', null)).ok).toBe(true);
    expect((await stockee(p)).meta.collection.equipes).toEqual({ skins: {}, familiers: {} });
    expect(await s.equiperSkin('magie', 'skin_tir_1')).toEqual({ ok: false, raison: 'emplacement_invalide' });
    expect(await s.equiperFamilier('suie', 'familier_rat')).toEqual({ ok: false, raison: 'heros_non_possede' });
  });
});

describe('fin de partie avec défi et boss', () => {
  const CONFIG: ConfigPartie = { graine: 1, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

  it('un défi réussi (la config porte `defi`) rapporte ses braises une seule fois', async () => {
    const p = await poste(depart({ niveaux: 3 }));
    const s = await onglet(p);
    const config = { ...CONFIG, defi: 'heroique' } as ConfigPartie;
    const r1 = await s.enregistrerFin({ niveau: 2, statut: 'victoire', etoiles: 3, config });
    expect(r1.bilan).toMatchObject({ braises: BRAISES_DEFI, defiReussi: 'heroique' });
    const r2 = await s.enregistrerFin({ niveau: 2, statut: 'victoire', etoiles: 3, config });
    expect(r2.bilan?.braises).toBe(0);
    const relue = await stockee(p);
    expect(relue.meta.monnaies.braises).toBe(BRAISES_DEFI);
    expect(relue.meta.defis).toEqual({ '2': { heroique: true } });
  });

  it('`defi` donné à la main prime sur celui de la config', async () => {
    const p = await poste(depart({ niveaux: 3 }));
    const s = await onglet(p);
    const r = await s.enregistrerFin({ niveau: 2, statut: 'victoire', etoiles: 3, config: CONFIG, defi: 'fer' });
    expect(r.bilan?.defiReussi).toBe('fer');
  });

  it('un défi sur un niveau sans 3 étoiles est refusé : la partie en cours est effacée, les gains non donnés', async () => {
    const p = await poste(depart({ niveaux: 1 }));
    const s = await onglet(p);
    const r = await s.enregistrerFin({ niveau: 2, statut: 'victoire', etoiles: 3, config: { ...CONFIG, defi: 'fer' } as ConfigPartie });
    expect(r).toMatchObject({ bilan: null, refus: 'niveau_invalide' });
    expect((await stockee(p)).meta.defis).toEqual({});
  });

  it('le boss de la région 2 offre un disciple et ouvre la région 3, deux onglets ne l’offrent pas deux fois', async () => {
    const p = await poste(depart({ niveaux: 19 }));
    const a = await onglet(p);
    const b = await onglet(p);
    const [ra, rb] = await Promise.all([
      a.enregistrerFin({ niveau: 20, statut: 'victoire', etoiles: 3, config: CONFIG }),
      b.enregistrerFin({ niveau: 20, statut: 'victoire', etoiles: 3, config: CONFIG }),
    ]);
    const offerts = [ra.bilan?.discipleOffert, rb.bilan?.discipleOffert].filter((d) => d !== undefined);
    expect(offerts).toEqual(['suie']);
    const relue = await stockee(p);
    expect(Object.keys(relue.meta.heros).sort()).toEqual(['charlie', 'plume', 'pollen', 'suie']);
    expect(relue.meta.regionMax).toBe(3);
  });
});
