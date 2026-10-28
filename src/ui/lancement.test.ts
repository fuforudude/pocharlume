// Lancement d'une partie : la config composée d'après la sauvegarde et le choix de la fiche doit être acceptée par le
// moteur, et les objets emportés sont débités du stock au lancement (puis rendus en fin de partie enregistrée).
// Tests d'intégration entre la couche sauvegarde (qui compose, débite) et le moteur (qui valide).
import { describe, expect, it, vi } from 'vitest';
import { DEFS_META } from '../data/heros';
import { creerPartie } from '../engine';
import { niveauEssai } from '../engine/aides.test-utils';
import { t } from '../i18n';
import { Depot, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { creerVerrouMemoire } from '../save/verrou';
import { configDeRelance, configDuChoix, debiterAuLancement, relancerAvecDebit } from './lancement';

function avecStock(objets: Partial<Sauvegarde['meta']['objets']>): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, meta: { ...s.meta, objets: { ...s.meta.objets, ...objets } } };
}

async function ouvrir(sauvegarde: Sauvegarde, stockage = new StockageMemoire()): Promise<Session> {
  const session = await Session.ouvrir(new Depot(stockage), null, { defs: DEFS_META, verrou: creerVerrouMemoire() });
  await session.appliquerImport(sauvegarde);
  return session;
}

describe('configDuChoix et le moteur', () => {
  it('un même objet sur plusieurs emplacements donne une config que creerPartie accepte', () => {
    const s = avecStock({ herbe_sabbat: 3, sablier: 2 });
    const r = configDuChoix(s, { dieu: 'charlie', heros: 'charlie', objets: ['herbe_sabbat', 'herbe_sabbat', 'sablier'] }, 'matou', 7);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.config.objets).toEqual(['herbe_sabbat', 'herbe_sabbat', 'sablier']);
    const etat = creerPartie(niveauEssai(), r.config);
    expect(etat.config.objets).toEqual(['herbe_sabbat', 'herbe_sabbat', 'sablier']);
    expect(etat.objetsUtilises).toEqual([false, false, false]);
  });

  it('trois fois le même objet est accepté aussi', () => {
    const s = avecStock({ sablier: 3 });
    const r = configDuChoix(s, { dieu: 'plume', heros: 'plume', objets: ['sablier', 'sablier', 'sablier'] }, 'chaton', 1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(() => creerPartie(niveauEssai(), r.config)).not.toThrow();
  });

  it('le repli « Rejouer » garde les doublons tant que le stock les couvre', () => {
    const s = avecStock({ sablier: 2 });
    const precedente = configDuChoix(s, { dieu: 'charlie', heros: 'charlie', objets: ['sablier', 'sablier'] }, 'matou', 1);
    expect(precedente.ok).toBe(true);
    if (!precedente.ok) return;
    const relance = configDeRelance(s, precedente.config, 99);
    expect(relance.objets).toEqual(['sablier', 'sablier']);
    expect(() => creerPartie(niveauEssai(), relance)).not.toThrow();
  });
});

describe('objets débités au lancement', () => {
  const choix = { dieu: 'charlie', heros: 'charlie', objets: ['sablier', 'sablier', 'fiole_soufre'] } as const;

  async function lancee(stock: Partial<Sauvegarde['meta']['objets']>) {
    const session = await ouvrir(avecStock(stock));
    const r = configDuChoix(session.sauvegarde, { ...choix, objets: [...choix.objets] }, 'matou', 5);
    if (!r.ok) throw new Error(r.raison);
    return { session, config: r.config };
  }

  it('le stock est débité de tous les objets emportés dès le lancement', async () => {
    const { session, config } = await lancee({ sablier: 4, fiole_soufre: 1, herbe_sabbat: 2 });
    expect(await debiterAuLancement(session, config)).toEqual({ ok: true });
    expect(session.sauvegarde.meta.objets).toEqual({ fiole_soufre: 0, herbe_sabbat: 2, griffe_renfort: 0, sablier: 2 });
  });

  it('refusé si le stock ne couvre plus le choix (entamé par un autre onglet) : rien n’est débité', async () => {
    const stockage = new StockageMemoire();
    const a = await ouvrir(avecStock({ sablier: 2, fiole_soufre: 1 }), stockage);
    const verrou = creerVerrouMemoire();
    const b = await Session.ouvrir(new Depot(stockage), null, { defs: DEFS_META, verrou });
    // L'autre onglet lance une partie avec les deux sabliers entre-temps.
    const autre = await Session.ouvrir(new Depot(stockage), null, { defs: DEFS_META, verrou: null });
    expect((await autre.lancerPartie(['sablier', 'sablier'])).ok).toBe(true);
    const r = configDuChoix(a.sauvegarde, { ...choix, objets: [...choix.objets] }, 'matou', 5);
    if (!r.ok) throw new Error(r.raison);
    const debit = await debiterAuLancement(b, r.config);
    expect(debit).toEqual({ ok: false, refus: t('fiche.lancement_refuse', { raison: t('meta.refus.objet_hors_stock') }) });
    const relue = await Session.ouvrir(new Depot(stockage), null, { defs: DEFS_META, verrou: null });
    expect(relue.sauvegarde.meta.objets).toEqual({ fiole_soufre: 1, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 });
  });

  it('une écriture qui lève ne démarre pas la partie : le refus est dit, sans exception', async () => {
    const session = await ouvrir(avecStock({ sablier: 3, fiole_soufre: 1 }));
    const casse = vi.spyOn(session, 'lancerPartie').mockRejectedValue(new Error('verrou indisponible'));
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const r = configDuChoix(session.sauvegarde, { ...choix, objets: [...choix.objets] }, 'matou', 5);
    if (!r.ok) throw new Error(r.raison);
    expect(await debiterAuLancement(session, r.config)).toEqual({ ok: false, refus: t('erreur.sauvegarde') });
    casse.mockRestore();
    erreurs.mockRestore();
  });

  it('« Rejouer » : le repli sur la config précédente est lui aussi refusé quand le stock ne la couvre plus', async () => {
    const { session, config } = await lancee({ sablier: 2, fiole_soufre: 1 });
    expect(await debiterAuLancement(session, config)).toEqual({ ok: true }); // stock : 0, 0
    // La partie est perdue sans rien utiliser : les objets sont rendus.
    await session.enregistrerFin({ niveau: 1, statut: 'defaite', etoiles: 0, config });
    expect(session.sauvegarde.meta.objets).toMatchObject({ sablier: 2, fiole_soufre: 1 });
    // Quelqu'un vide le stock avant le « Rejouer » : on ne peut pas relancer avec les mêmes objets.
    await session.lancerPartie(['sablier', 'sablier']);
    const r = await relancerAvecDebit(session, config, 77);
    // La relance se compose d'après le stock d'aujourd'hui : elle part sans les sabliers, qui n'existent plus.
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.config.objets).toEqual(['fiole_soufre']);
    expect(session.sauvegarde.meta.objets.fiole_soufre).toBe(0);
  });

  it('« Rejouer » : un repli qui garde des objets hors stock est refusé par le débit', async () => {
    // Config qui ne se recompose plus (difficulté inconnue) : configDeRelance retombe sur la config précédente, objets compris.
    const { session, config } = await lancee({ sablier: 2, fiole_soufre: 1 });
    await debiterAuLancement(session, config); // stock : 0 sablier, 0 fiole
    const impossible = { ...config, difficulte: 'dieu' };
    expect(configDeRelance(session.sauvegarde, impossible, 5).objets).toEqual(['sablier', 'sablier', 'fiole_soufre']);
    const r = await relancerAvecDebit(session, impossible, 5);
    expect(r).toEqual({ ok: false, refus: t('fiche.lancement_refuse', { raison: t('meta.refus.objet_hors_stock') }) });
    expect(session.sauvegarde.meta.objets).toMatchObject({ sablier: 0, fiole_soufre: 0 });
  });

  it('le cycle complet : débit au lancement, objets utilisés consommés, les autres rendus à la fin', async () => {
    const { session, config } = await lancee({ sablier: 3, fiole_soufre: 2 });
    await debiterAuLancement(session, config);
    expect(session.sauvegarde.meta.objets).toMatchObject({ sablier: 1, fiole_soufre: 1 });
    const fin = await session.enregistrerFin({ niveau: 1, statut: 'victoire', etoiles: 3, config, objetsUtilises: ['sablier'] });
    expect(fin.bilan).toMatchObject({ objetsConsommes: ['sablier'], objetsRendus: ['sablier', 'fiole_soufre'] });
    expect(session.sauvegarde.meta.objets).toMatchObject({ sablier: 2, fiole_soufre: 2 });
  });

  it('abandon : aucune expérience ni récompense, les objets non utilisés sont rendus', async () => {
    const { session, config } = await lancee({ sablier: 3, fiole_soufre: 2 });
    await debiterAuLancement(session, config);
    const avant = session.sauvegarde;
    const fin = await session.enregistrerFin({ niveau: 1, statut: 'abandon', etoiles: 0, config, objetsUtilises: ['fiole_soufre'] });
    expect(fin.bilan).toMatchObject({ aretes: 0, braises: 0, xp: 0, nouvellesEtoiles: 0, objetsConsommes: ['fiole_soufre'] });
    const apres = session.sauvegarde;
    expect(apres.meta.heros).toEqual(avant.meta.heros);
    expect(apres.meta.monnaies).toEqual(avant.meta.monnaies);
    expect(apres.progression).toEqual(avant.progression);
    expect(apres.meta.objets).toMatchObject({ sablier: 3, fiole_soufre: 1 });
  });
});
