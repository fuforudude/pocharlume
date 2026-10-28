// Session et méta-progression : transactions écrites aussitôt, et deux onglets sur un même stockage.
//
// Règle testée : le stockage fait foi. Chaque opération est rejouée sur le contenu frais du stockage, sous verrou, puis
// écrite. Un achat fait depuis une vue périmée est donc revalidé : il ne duplique rien (les arêtes et les braises ne se
// dépensent qu'une fois) et n'en efface aucun autre (les achats de l'autre onglet sont gardés).
import { describe, expect, it, vi } from 'vitest';
import { VERSION_DONNEES } from '../data/version';
import type { ConfigPartie } from '../engine/etat';
import { DEFS_TEST, StockageTruque } from './aides.test-utils';
import type { CanalSauvegarde } from './canal';
import { CLE_SAUVEGARDE, Depot } from './depot';
import { sauvegardeVide, type Meta, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { Session } from './session';
import { StockageMemoire, type Stockage } from './stockage';
import { etoilesDisponibles } from './transactions';
import { creerVerrouMemoire, type VerrouSauvegarde } from './verrou';

const CONFIG: ConfigPartie = { graine: 11, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

/** Une sauvegarde de départ : `niveaux` niveaux à 3 étoiles, de quoi dépenser. */
function depart(opts: { niveaux?: number; aretes?: number; braises?: number; meta?: Partial<Meta> } = {}): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= (opts.niveaux ?? 0); n++) s = enregistrerVictoire(s, n, 'matou', 3);
  return { ...s, meta: { ...s.meta, ...opts.meta, monnaies: { aretes: opts.aretes ?? 0, braises: opts.braises ?? 0 } } };
}

interface Poste {
  stockage: Stockage;
  verrou: VerrouSauvegarde | null;
}

/** Un stockage déjà rempli, et le verrou que les onglets se partagent. */
async function poste(initiale: Sauvegarde, avecVerrou = true, stockage: Stockage = new StockageMemoire()): Promise<Poste> {
  expect(await new Depot(stockage).enregistrer(initiale)).toBe(true);
  return { stockage, verrou: avecVerrou ? creerVerrouMemoire() : null };
}

/** Un onglet : une session neuve sur le stockage du poste. */
function onglet(p: Poste, canal: CanalSauvegarde | null = null): Promise<Session> {
  return Session.ouvrir(new Depot(p.stockage), canal, { verrou: p.verrou, defs: DEFS_TEST });
}

async function stockee(p: Poste): Promise<Sauvegarde> {
  return (await onglet(p)).sauvegarde;
}

describe('transactions de la session', () => {
  it('un achat est écrit aussitôt et survit à un redémarrage', async () => {
    const p = await poste(depart({ braises: 100, aretes: 500 }));
    const s = await onglet(p);
    const achat = await s.acheterDisciple('suie');
    expect(achat).toMatchObject({ ok: true, ecrite: true });
    expect(s.sauvegarde.meta.monnaies.braises).toBe(70);
    expect((await s.acheterObjet('sablier', 2)).ok).toBe(true);
    const relue = await stockee(p);
    expect(relue.meta.heros.suie).toEqual({ xp: 0, competences: {} });
    expect(relue.meta.objets.sablier).toBe(2);
    expect(relue.meta.monnaies).toEqual({ aretes: 300, braises: 70 });
  });

  it('un refus ne change rien et n’écrit rien', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ braises: 10 }), true, stockage);
    const s = await onglet(p);
    const ecritures = stockage.ecritures;
    const avant = stockage.donnees.get(CLE_SAUVEGARDE);
    expect(await s.acheterDisciple('suie')).toEqual({ ok: false, raison: 'braises_insuffisantes' });
    expect(await s.acheterObjet('sablier')).toEqual({ ok: false, raison: 'aretes_insuffisantes' });
    expect(await s.acheterRangArbre('tir')).toEqual({ ok: false, raison: 'etoiles_insuffisantes' });
    expect(await s.equiperObjets(['sablier'])).toEqual({ ok: false, raison: 'objet_hors_stock' });
    expect(await s.choisirHeros('plume', 'suie')).toEqual({ ok: false, raison: 'heros_non_possede' });
    expect(await s.reinitialiserArbre()).toEqual({ ok: false, raison: 'rien_a_reinitialiser' });
    expect(stockage.ecritures).toBe(ecritures);
    expect(stockage.donnees.get(CLE_SAUVEGARDE)).toBe(avant);
    expect(s.sauvegarde.meta.monnaies.braises).toBe(10);
  });

  it('arbre : achat puis réinitialisation, étoiles rendues', async () => {
    const p = await poste(depart({ niveaux: 4 }));
    const s = await onglet(p);
    await s.acheterRangArbre('caserne');
    await s.acheterRangArbre('caserne');
    await s.acheterRangArbre('sorts');
    expect(etoilesDisponibles(s.sauvegarde)).toBe(12 - 4);
    expect((await stockee(p)).meta.arbre).toMatchObject({ caserne: 2, sorts: 1 });
    expect(await s.reinitialiserArbre()).toMatchObject({ ok: true });
    expect(etoilesDisponibles(await stockee(p))).toBe(12);
  });

  it('compétences : placer, refuser au-delà des points, redistribuer', async () => {
    const heros = { plume: { xp: 0, competences: {} }, charlie: { xp: 250, competences: {} }, pollen: { xp: 0, competences: {} } }; // Charlie niveau 3
    const p = await poste(depart({ meta: { heros } }));
    const s = await onglet(p);
    await s.repartirPoint('charlie', 'charlie_a');
    await s.repartirPoint('charlie', 'charlie_a');
    await s.repartirPoint('charlie', 'charlie_b');
    expect(await s.repartirPoint('charlie', 'charlie_c')).toEqual({ ok: false, raison: 'plus_de_points' });
    expect(await s.repartirPoint('charlie', 'charlie_ultime')).toEqual({ ok: false, raison: 'niveau_insuffisant' });
    expect((await stockee(p)).meta.heros.charlie?.competences).toEqual({ charlie_a: 2, charlie_b: 1 });
    await s.reinitialiserPoints('charlie');
    expect((await stockee(p)).meta.heros.charlie?.competences).toEqual({});
  });

  it('placer un point demande les définitions des héros', async () => {
    const p = await poste(depart());
    const sans = await Session.ouvrir(new Depot(p.stockage), null, { verrou: p.verrou });
    expect(await sans.repartirPoint('charlie', 'charlie_a')).toEqual({ ok: false, raison: 'definitions_absentes' });
  });

  it('la fin d’une partie rapporte arêtes, braises et expérience au héros joué, et rend le bilan', async () => {
    const p = await poste(depart());
    const s = await onglet(p);
    const fin = await s.enregistrerFin({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG, heros: 'charlie' });
    expect(fin).toMatchObject({ ecrite: true, refus: null, bilan: { aretes: 81, braises: 7, xp: 120, nouvellesEtoiles: 3, heros: 'charlie' } });
    const relue = await stockee(p);
    expect(relue.meta.monnaies).toEqual({ aretes: 81, braises: 7 });
    expect(relue.meta.heros.charlie?.xp).toBe(120);
    expect(relue.progression.niveauMax).toBe(2);
  });

  it('le héros et les objets de la fin de partie peuvent venir de la config du moteur', async () => {
    // Stock d'après le lancement : les deux fioles emportées sont déjà débitées.
    const stock = { fiole_soufre: 0, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 };
    const p = await poste(depart({ meta: { objets: stock } }));
    const s = await onglet(p);
    const config = { ...CONFIG, heros: 'plume', objets: ['fiole_soufre', 'fiole_soufre'] };
    await s.enregistrerFin({ niveau: 1, statut: 'defaite', etoiles: 0, config, objetsUtilises: ['fiole_soufre'] });
    const relue = await stockee(p);
    expect(relue.meta.heros.plume?.xp).toBe(60);
    expect(relue.meta.objets.fiole_soufre).toBe(1); // la fiole utilisée est perdue, l'autre est rendue
  });

  it('lancerPartie débite les objets emportés sous verrou ; le second onglet, à stock épuisé, est refusé', async () => {
    const stock = { fiole_soufre: 2, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 };
    const p = await poste(depart({ meta: { objets: stock } }));
    const a = await onglet(p);
    const b = await onglet(p);
    expect(await a.lancerPartie(['fiole_soufre', 'fiole_soufre'])).toMatchObject({ ok: true });
    expect(await b.lancerPartie(['fiole_soufre'])).toEqual({ ok: false, raison: 'objet_hors_stock' });
    expect((await stockee(p)).meta.objets.fiole_soufre).toBe(0);
  });

  it('un abandon rend les objets non utilisés mais n’efface pas une partie sauvegardée plus ancienne', async () => {
    const stock = { fiole_soufre: 0, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 };
    const ancienne = { niveau: 3, config: { ...CONFIG, graine: 999 }, etat: '{"version":1}', vague: 2 };
    const p = await poste({ ...depart({ niveaux: 3, meta: { objets: stock } }), partie: ancienne });
    const s = await onglet(p);
    await s.enregistrerFin({ niveau: 3, statut: 'abandon', etoiles: 0, config: { ...CONFIG, graine: 5, objets: ['sablier'] } });
    const relue = await stockee(p);
    expect(relue.meta.objets.sablier).toBe(1);
    expect(relue.partie).toEqual(ancienne);
    // Abandonner la partie qui est justement celle de la sauvegarde l'efface.
    await s.enregistrerFin({ niveau: 3, statut: 'abandon', etoiles: 0, config: { ...CONFIG, graine: 999 } });
    expect((await stockee(p)).partie).toBeNull();
  });

  it('une écriture qui lève ne casse pas la file : l’opération suivante passe', async () => {
    const p = await poste(depart({ braises: 100 }));
    let echecs = 1;
    const verrou: VerrouSauvegarde = {
      executer: (travail) => (echecs-- > 0 ? Promise.reject(new Error('verrou indisponible')) : (p.verrou ?? creerVerrouMemoire()).executer(travail)),
    };
    const s = await Session.ouvrir(new Depot(p.stockage), null, { verrou, defs: DEFS_TEST });
    await expect(s.acheterDisciple('suie')).rejects.toThrow('verrou indisponible');
    const suivant = await s.acheterDisciple('corbeau');
    expect(suivant).toMatchObject({ ok: true });
    const relue = await stockee(p);
    expect(relue.meta.heros.corbeau).toBeDefined();
    // L'achat dont l'écriture avait levé reste en attente et part avec l'écriture qui a réussi.
    expect(relue.meta.heros.suie).toBeDefined();
    expect(relue.meta.monnaies.braises).toBe(40);
  });

  it('surChangement prévient à chaque changement de la sauvegarde, jusqu’à ce qu’on retire l’écouteur', async () => {
    const p = await poste(depart({ braises: 100 }));
    const s = await onglet(p);
    const appels = vi.fn();
    const retirer = s.surChangement(appels);
    await s.acheterDisciple('suie');
    expect(appels).toHaveBeenCalled();
    const n = appels.mock.calls.length;
    retirer();
    await s.acheterDisciple('corbeau');
    expect(appels).toHaveBeenCalledTimes(n);
  });

  it('une fin de partie refusée (héros non possédé) efface quand même la partie et ne donne rien', async () => {
    const p = await poste(depart());
    const s = await onglet(p);
    const fin = await s.enregistrerFin({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG, heros: 'suie' });
    expect(fin).toMatchObject({ ecrite: true, bilan: null, refus: 'heros_non_possede' });
    expect((await stockee(p)).meta.monnaies).toEqual({ aretes: 0, braises: 0 });
  });

  it('terminerPartie garde son comportement : booléen, victoire enregistrée', async () => {
    const p = await poste(depart());
    const s = await onglet(p);
    expect(await s.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 2, config: CONFIG })).toBe(true);
    expect((await stockee(p)).progression.niveauMax).toBe(2);
  });
});

describe('deux onglets : les achats ne se dupliquent pas et ne se perdent pas', () => {
  it('chaque onglet achète un disciple différent avec de quoi payer les deux : les deux sont gardés', async () => {
    const p = await poste(depart({ braises: 60 }));
    const a = await onglet(p);
    const b = await onglet(p);
    expect(await a.acheterDisciple('suie')).toMatchObject({ ok: true });
    expect(await b.acheterDisciple('mastoc')).toMatchObject({ ok: true });
    const relue = await stockee(p);
    expect(Object.keys(relue.meta.heros).sort()).toEqual(['charlie', 'mastoc', 'plume', 'pollen', 'suie']);
    expect(relue.meta.monnaies.braises).toBe(0);
    // Le second onglet voit aussi l'achat du premier.
    expect(b.sauvegarde.meta.heros.suie).toBeDefined();
  });

  it('avec de quoi payer un seul des deux, le second achat est refusé et rien n’est débité deux fois', async () => {
    const p = await poste(depart({ braises: 30 }));
    const a = await onglet(p);
    const b = await onglet(p);
    expect(await a.acheterDisciple('suie')).toMatchObject({ ok: true });
    // B croit encore avoir 30 braises : son clic est revalidé sur le contenu frais.
    expect(b.sauvegarde.meta.monnaies.braises).toBe(30);
    expect(await b.acheterDisciple('mastoc')).toEqual({ ok: false, raison: 'braises_insuffisantes' });
    const relue = await stockee(p);
    expect(Object.keys(relue.meta.heros).sort()).toEqual(['charlie', 'plume', 'pollen', 'suie']);
    expect(relue.meta.monnaies.braises).toBe(0);
    // Et B, détrompé, montre maintenant l'état réel.
    expect(b.sauvegarde.meta.monnaies.braises).toBe(0);
    expect(b.sauvegarde.meta.heros.suie).toBeDefined();
    expect(b.sauvegarde.meta.heros.mastoc).toBeUndefined();
  });

  it('le même disciple acheté dans les deux onglets n’est payé qu’une fois', async () => {
    const p = await poste(depart({ braises: 90 }));
    const a = await onglet(p);
    const b = await onglet(p);
    expect(await a.acheterDisciple('suie')).toMatchObject({ ok: true });
    expect(await b.acheterDisciple('suie')).toEqual({ ok: false, raison: 'deja_possede' });
    expect((await stockee(p)).meta.monnaies.braises).toBe(60);
  });

  it('des objets achetés dans les deux onglets s’additionnent, les arêtes se soustraient deux fois', async () => {
    const p = await poste(depart({ aretes: 600 }));
    const a = await onglet(p);
    const b = await onglet(p);
    await a.acheterObjet('sablier', 2);
    await b.acheterObjet('sablier', 3);
    await b.acheterObjet('fiole_soufre');
    const relue = await stockee(p);
    expect(relue.meta.objets).toMatchObject({ sablier: 5, fiole_soufre: 1 });
    expect(relue.meta.monnaies.aretes).toBe(600 - 500 - 60);
  });

  it('le stock plafonné à 10 vaut pour l’ensemble des onglets', async () => {
    const p = await poste(depart({ aretes: 2000 }));
    const a = await onglet(p);
    const b = await onglet(p);
    await a.acheterObjet('sablier', 7);
    expect(await b.acheterObjet('sablier', 7)).toEqual({ ok: false, raison: 'stock_plein' });
    const relue = await stockee(p);
    expect(relue.meta.objets.sablier).toBe(7);
    expect(relue.meta.monnaies.aretes).toBe(2000 - 700);
  });

  it('achats lancés en même temps dans les deux onglets : même résultat', async () => {
    const p = await poste(depart({ braises: 60, aretes: 300 }));
    const a = await onglet(p);
    const b = await onglet(p);
    const resultats = await Promise.all([a.acheterDisciple('suie'), b.acheterDisciple('corbeau'), a.acheterObjet('sablier'), b.acheterObjet('sablier')]);
    expect(resultats.every((r) => r.ok)).toBe(true);
    const relue = await stockee(p);
    expect(Object.keys(relue.meta.heros).sort()).toEqual(['charlie', 'corbeau', 'plume', 'pollen', 'suie']);
    expect(relue.meta.objets.sablier).toBe(2);
    expect(relue.meta.monnaies).toEqual({ aretes: 100, braises: 0 });
  });

  it.skipIf(!('locks' in navigator))('avec le verrou Web Locks du navigateur (celui par défaut), les achats simultanés sont justes aussi', async () => {
    const stockage = new StockageMemoire();
    await new Depot(stockage).enregistrer(depart({ braises: 60 }));
    const a = await Session.ouvrir(new Depot(stockage), null);
    const b = await Session.ouvrir(new Depot(stockage), null);
    const resultats = await Promise.all([a.acheterDisciple('suie'), b.acheterDisciple('mastoc'), a.acheterObjet('sablier').then(() => a.changerReglages({ son: 9 }))]);
    expect(resultats[0].ok && resultats[1].ok).toBe(true);
    const relue = (await Session.ouvrir(new Depot(stockage), null)).sauvegarde;
    expect(Object.keys(relue.meta.heros)).toHaveLength(5);
    expect(relue.meta.monnaies.braises).toBe(0);
    expect(relue.reglages.son).toBe(9);
  });

  it('achats simultanés qui ne tiennent pas tous : un seul passe', async () => {
    const p = await poste(depart({ braises: 30 }));
    const a = await onglet(p);
    const b = await onglet(p);
    const [ra, rb] = await Promise.all([a.acheterDisciple('suie'), b.acheterDisciple('mastoc')]);
    expect([ra.ok, rb.ok].filter(Boolean)).toHaveLength(1);
    const relue = await stockee(p);
    expect(Object.keys(relue.meta.heros)).toHaveLength(4);
    expect(relue.meta.monnaies.braises).toBe(0);
  });

  it('un rang de l’arbre acheté dans les deux onglets depuis la même vue n’est acheté et payé qu’une fois', async () => {
    const p = await poste(depart({ niveaux: 4 }));
    const a = await onglet(p);
    const b = await onglet(p);
    expect(await a.acheterRangArbre('tir')).toMatchObject({ ok: true });
    // B voulait « le rang 1 de tir » : il est déjà pris, B n’achète pas le rang 2 par surprise.
    expect(await b.acheterRangArbre('tir')).toEqual({ ok: false, raison: 'modifie_ailleurs' });
    const relue = await stockee(p);
    expect(relue.meta.arbre.tir).toBe(1);
    expect(etoilesDisponibles(relue)).toBe(11);
    // Dans une autre branche, B achète sans conflit.
    expect(await b.acheterRangArbre('magie')).toMatchObject({ ok: true });
    expect((await stockee(p)).meta.arbre).toMatchObject({ tir: 1, magie: 1 });
  });

  it('un point de compétence placé dans les deux onglets depuis la même vue n’est dépensé qu’une fois', async () => {
    const heros = { plume: { xp: 0, competences: {} }, charlie: { xp: 250, competences: {} }, pollen: { xp: 0, competences: {} } };
    const p = await poste(depart({ meta: { heros } }));
    const a = await onglet(p);
    const b = await onglet(p);
    await a.repartirPoint('charlie', 'charlie_a');
    expect(await b.repartirPoint('charlie', 'charlie_a')).toEqual({ ok: false, raison: 'modifie_ailleurs' });
    expect((await stockee(p)).meta.heros.charlie?.competences).toEqual({ charlie_a: 1 });
  });

  it('deux victoires du même niveau : l’étoile n’est « nouvelle » qu’une fois, les arêtes de rejeu s’ajoutent', async () => {
    const p = await poste(depart());
    const a = await onglet(p);
    const b = await onglet(p);
    const fa = await a.enregistrerFin({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    const fb = await b.enregistrerFin({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    expect(fa.bilan).toMatchObject({ aretes: 81, braises: 7, nouvellesEtoiles: 3 });
    expect(fb.bilan).toMatchObject({ aretes: 12, braises: 0, nouvellesEtoiles: 0 });
    const relue = await stockee(p);
    expect(relue.meta.monnaies).toEqual({ aretes: 93, braises: 7 });
    expect(relue.progression.etoiles['1']).toEqual({ matou: 3 });
  });

  it('un onglet qui ne fait que changer un réglage n’efface pas les achats de l’autre', async () => {
    const p = await poste(depart({ braises: 30, aretes: 100 }));
    const a = await onglet(p);
    const b = await onglet(p);
    await a.acheterDisciple('suie');
    await a.acheterObjet('fiole_soufre');
    await b.changerReglages({ son: 5 });
    const relue = await stockee(p);
    expect(relue.reglages.son).toBe(5);
    expect(relue.meta.heros.suie).toBeDefined();
    expect(relue.meta.objets.fiole_soufre).toBe(1);
    expect(relue.meta.monnaies).toEqual({ aretes: 40, braises: 0 });
  });

  it('des achats et des choix croisés entre les deux onglets se retrouvent tous', async () => {
    const p = await poste(depart({ aretes: 200 }));
    const a = await onglet(p);
    const b = await onglet(p);
    await a.acheterObjet('sablier');
    await b.equiperObjets([]);
    await b.acheterObjet('fiole_soufre');
    // A équipe le sablier qu'il a acheté : il est bien dans le stock frais, avec la fiole de B.
    await a.equiperObjets(['sablier']);
    const relue = await stockee(p);
    expect(relue.meta.objets).toMatchObject({ sablier: 1, fiole_soufre: 1 });
    expect(relue.meta.choix.objets).toEqual(['sablier']);
    expect(relue.meta.monnaies.aretes).toBe(40);
  });

  it('sans verrou (navigateur ancien), des opérations qui ne se chevauchent pas restent justes', async () => {
    const p = await poste(depart({ braises: 60 }), false);
    const a = await onglet(p);
    const b = await onglet(p);
    await a.acheterDisciple('suie');
    await b.acheterDisciple('mastoc');
    const relue = await stockee(p);
    expect(Object.keys(relue.meta.heros)).toHaveLength(5);
    expect(relue.meta.monnaies.braises).toBe(0);
  });

  it('un import dans un onglet fait foi : l’achat de l’autre se rejoue par-dessus, sans rien ressusciter', async () => {
    const source = depart({ braises: 90 });
    const p = await poste(depart({ braises: 30 }));
    const a = await onglet(p);
    const b = await onglet(p);
    const code = await (await Session.ouvrir(new Depot((await poste(source)).stockage), null, { verrou: null })).exporter();
    const lu = await a.importer(code);
    if (!lu.ok) throw new Error(lu.detail);
    await a.appliquerImport(lu.sauvegarde);
    expect(await b.acheterDisciple('suie')).toMatchObject({ ok: true });
    expect((await stockee(p)).meta.monnaies.braises).toBe(60);
  });
});

describe('écriture qui échoue', () => {
  it('l’achat reste en mémoire, il est écrit avec la prochaine écriture réussie, une seule fois', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ braises: 100, aretes: 200 }), true, stockage);
    const s = await onglet(p);
    stockage.panneEcriture = true;
    expect(await s.acheterDisciple('suie')).toMatchObject({ ok: true, ecrite: false });
    expect(s.sauvegarde.meta.heros.suie).toBeDefined();
    expect(s.sauvegarde.meta.monnaies.braises).toBe(70);
    stockage.panneEcriture = false;
    expect(await s.acheterObjet('sablier')).toMatchObject({ ok: true, ecrite: true });
    const relue = await stockee(p);
    expect(relue.meta.heros.suie).toBeDefined();
    expect(relue.meta.objets.sablier).toBe(1);
    expect(relue.meta.monnaies).toEqual({ aretes: 100, braises: 70 });
    expect(s.sauvegarde.meta.monnaies).toEqual({ aretes: 100, braises: 70 });
  });

  it('un achat en attente ne passe pas si un autre onglet a entre-temps pris l’argent', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ braises: 30 }), true, stockage);
    const a = await onglet(p);
    const b = await onglet(p);
    stockage.panneEcriture = true;
    expect(await a.acheterDisciple('suie')).toMatchObject({ ok: true, ecrite: false });
    stockage.panneEcriture = false;
    expect(await b.acheterDisciple('mastoc')).toMatchObject({ ok: true });
    // L'achat de A, jamais écrit, se rejoue sur le contenu frais : plus de braises, il est refusé.
    expect(await a.changerReglages({ son: 1 })).toBe(true);
    const relue = await stockee(p);
    expect(relue.meta.heros.mastoc).toBeDefined();
    expect(relue.meta.heros.suie).toBeUndefined();
    expect(relue.meta.monnaies.braises).toBe(0);
  });

  it('lecture qui échoue après un démarrage normal : on sait ce que contient le stockage, l’achat s’écrit quand même', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ braises: 100 }), true, stockage);
    const s = await onglet(p);
    stockage.panneLecture = true;
    const ecritures = stockage.ecritures;
    expect(await s.acheterDisciple('suie')).toMatchObject({ ok: true, ecrite: true });
    expect(stockage.ecritures).toBe(ecritures + 1);
    stockage.panneLecture = false;
    expect((await stockee(p)).meta.monnaies.braises).toBe(70);
  });
});

/** Deux extrémités d'un canal de diffusion en mémoire. */
function canaux(): [CanalSauvegarde, CanalSauvegarde] {
  let versB: (() => void) | null = null;
  let versA: (() => void) | null = null;
  return [
    { publier: () => { versB?.(); }, ecouter: (rappel) => { versA = rappel; }, fermer: () => { versA = null; } },
    { publier: () => { versA?.(); }, ecouter: (rappel) => { versB = rappel; }, fermer: () => { versB = null; } },
  ];
}

describe('canal entre onglets', () => {
  it('un achat dans un onglet met à jour la vue de l’autre, sans rien écrire', async () => {
    const stockage = new StockageTruque();
    const p = await poste(depart({ braises: 60 }), true, stockage);
    const [canalA, canalB] = canaux();
    const a = await onglet(p, canalA);
    const b = await onglet(p, canalB);
    await a.acheterDisciple('suie');
    const ecritures = stockage.ecritures;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(b.sauvegarde.meta.monnaies.braises).toBe(30);
    expect(b.sauvegarde.meta.heros.suie).toBeDefined();
    expect(stockage.ecritures).toBe(ecritures);
  });
});
