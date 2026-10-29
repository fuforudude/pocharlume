// Reprise d'une partie infinie : l'instantané porte sa carte, la validation la vérifie, la session la rend et l'efface à la fin.
import { describe, expect, it } from 'vitest';
import { VERSION_DONNEES } from '../data/version';
import { REGION1 } from '../data/niveaux/region1';
import { premiereCaseLibre } from '../engine/aides.test-utils';
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import { appliquerAction, creerPartie, serialiser, step } from '../engine/partie';
import { Depot } from './depot';
import { sauvegardeVide, type Sauvegarde } from './format';
import { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
import { enregistrerVictoire } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { validerSauvegarde } from './validation';
import { creerVerrouMemoire } from './verrou';

const CONFIG: ConfigPartie = {
  graine: 9,
  difficulte: 'matou',
  dieu: 'charlie',
  heros: 'charlie',
  niveauHeros: 1,
  competencesHeros: {},
  ameliorations: {},
  objets: [],
  versionDonnees: VERSION_DONNEES,
  defi: null,
  bonus: { tours: {}, heros: {} },
  infini: { region: 1 },
};

function niveau1() {
  const niveau = REGION1[0];
  if (!niveau) throw new Error('niveau 1 absent');
  return niveau.niveau;
}

function jusquaVague(config: ConfigPartie, n: number): EtatPartie {
  const etat = creerPartie(niveau1(), config);
  appliquerAction(etat, { type: 'construire', ...premiereCaseLibre(etat), tour: 'tir' });
  while (etat.vagues.lancees < n && etat.statut === 'en_cours') step(etat);
  return etat;
}

const infinie = (): EtatPartie => jusquaVague(CONFIG, 2);

function ouverte(): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= 10; n++) s = enregistrerVictoire(s, n, 'matou', 1);
  return s;
}

describe('partie infinie en cours', () => {
  it("l'instantané porte sa carte ; sans carte, ou une carte en campagne, il est refusé", () => {
    const etat = infinie();
    expect(partieEnCours(etat, 1, 'chaumes')).toMatchObject({ niveau: 1, vague: 2, carte: 'chaumes', config: { infini: { region: 1 } } });
    expect(partieEnCours(etat, 1)).toBeNull();
    expect(partieEnCours(etat, 1, 'Pas Valide')).toBeNull();
    const campagne = jusquaVague({ ...CONFIG, infini: null }, 1);
    expect(partieEnCours(campagne, 1, 'chaumes')).toBeNull();
    expect(partieEnCours(campagne, 1)?.carte).toBeUndefined();
  });

  it("la config de l'instantané n'est pas partagée avec l'état", () => {
    const etat = infinie();
    const p = partieEnCours(etat, 1, 'chaumes');
    if (!p?.config.infini) throw new Error('pas de partie infinie');
    p.config.infini.region = 4;
    expect(etat.config.infini?.region).toBe(1);
  });

  it("survit au stockage, se valide et reprend à l'identique", async () => {
    const etat = infinie();
    const partie = partieEnCours(etat, 1, 'chaumes');
    if (!partie) throw new Error('pas de partie');
    const s = avecPartieEnCours(ouverte(), partie);
    expect(validerSauvegarde(JSON.parse(JSON.stringify(s))).ok).toBe(true);
    const stockage = new StockageMemoire();
    await new Depot(stockage).enregistrer(s);
    const relue = (await new Depot(stockage).charger()).sauvegarde.partie;
    expect(relue).toEqual(partie);
    if (!relue) throw new Error('pas de partie relue');
    const reprise = reprendrePartie(relue);
    if (!reprise) throw new Error('reprise impossible');
    expect(reprise.config.infini).toEqual({ region: 1 });
    for (let i = 0; i < 900; i++) {
      step(etat);
      step(reprise);
    }
    expect(serialiser(reprise)).toBe(serialiser(etat));
  });

  it('la validation refuse les incohérences : carte sans infini, infini sans carte, région ou carte invalide, mode fermé', () => {
    const partie = partieEnCours(infinie(), 1, 'chaumes');
    if (!partie) throw new Error('pas de partie');
    const valide = (p: unknown, base: Sauvegarde = ouverte()): boolean => validerSauvegarde(JSON.parse(JSON.stringify({ ...base, partie: p }))).ok;
    expect(valide(partie)).toBe(true);
    expect(valide({ ...partie, carte: undefined })).toBe(false);
    expect(valide({ ...partie, carte: 'Pas Valide' })).toBe(false);
    expect(valide({ ...partie, carte: 3 })).toBe(false);
    expect(valide({ ...partie, config: { ...partie.config, infini: { region: 11 } } })).toBe(false);
    expect(valide({ ...partie, config: { ...partie.config, infini: { region: 1, autre: 1 } } })).toBe(false);
    expect(valide({ ...partie, config: { ...partie.config, defi: 'fer' } })).toBe(false);
    const sansInfini: Record<string, unknown> = { ...partie.config };
    delete sansInfini.infini;
    expect(valide({ ...partie, config: sansInfini })).toBe(false); // carte sans mode infini
    expect(valide(partie, sauvegardeVide())).toBe(false); // mode infini pas ouvert
    // Au-delà de 1000 vagues, seule une partie infinie est valide.
    expect(valide({ ...partie, vague: 1500 })).toBe(true);
    expect(valide({ ...partie, vague: 0 })).toBe(false);
    expect(valide({ ...partie, vague: 10_000 })).toBe(false);
  });

  it("refuse de reprendre une partie dont la carte ou la région ne correspondent plus à l'état", () => {
    const partie = partieEnCours(infinie(), 1, 'chaumes');
    if (!partie) throw new Error('pas de partie');
    expect(reprendrePartie(partie)).not.toBeNull();
    const sansCarte: Record<string, unknown> = { ...partie };
    delete sansCarte.carte;
    expect(reprendrePartie(sansCarte as unknown as typeof partie)).toBeNull();
    expect(reprendrePartie({ ...partie, config: { ...partie.config, infini: { region: 2 } } })).toBeNull();
  });
});

describe("session : reprise et fin d'une partie infinie", () => {
  async function ouvrirSession(initiale: Sauvegarde): Promise<Session> {
    const stockage = new StockageMemoire();
    await new Depot(stockage).enregistrer(initiale);
    return Session.ouvrir(new Depot(stockage), null, { verrou: creerVerrouMemoire() });
  }

  it('range la partie avec sa carte et la propose à la reprise', async () => {
    const session = await ouvrirSession(ouverte());
    expect(await session.rangerPartie(infinie(), 1, 'chaumes')).toBe(true);
    const reprise = session.partieAReprendre();
    expect(reprise).toMatchObject({ niveau: 1, vague: 2, carte: 'chaumes' });
    expect(reprise?.etat.config.infini).toEqual({ region: 1 });
  });

  it('la fin de la partie infinie enregistre le record et efface sa partie sauvegardée, pas celle d’une autre graine', async () => {
    const session = await ouvrirSession(ouverte());
    await session.rangerPartie(infinie(), 1, 'chaumes');
    const autre = await session.enregistrerFinInfini({ carte: 'chaumes', vague: 3 }, CONFIG.graine + 1);
    expect(autre.ok && autre.detail.nouveauRecord).toBe(true);
    expect(session.sauvegarde.partie).not.toBeNull();
    const fin = await session.enregistrerFinInfini({ carte: 'chaumes', vague: 4 }, CONFIG.graine);
    expect(fin.ok).toBe(true);
    expect(session.sauvegarde.partie).toBeNull();
    expect(session.sauvegarde.meta.infini.records).toEqual({ chaumes: 4 });
  });

  it("une partie de campagne sauvegardée n'est pas effacée par la fin d'une partie infinie", async () => {
    const session = await ouvrirSession(ouverte());
    const campagne = jusquaVague({ ...CONFIG, infini: null }, 1);
    await session.rangerPartie(campagne, 2);
    await session.enregistrerFinInfini({ carte: 'chaumes', vague: 2 }, CONFIG.graine);
    expect(session.sauvegarde.partie?.niveau).toBe(2);
  });

  /** Une partie infinie arrivée à la vague 35 (rien d'ouvert : la dernière vague terminée est la 35e). */
  function vague35(): EtatPartie {
    const etat = infinie();
    etat.vagues.lancees = 35;
    etat.vagues.paquets = [];
    etat.ennemis = [];
    return etat;
  }

  it('range le record et les paliers atteints dès le rangement, payés une seule fois', async () => {
    const session = await ouvrirSession(ouverte());
    expect(await session.rangerPartie(vague35(), 1, 'chaumes')).toBe(true);
    expect(session.sauvegarde.meta.infini).toEqual({ records: { chaumes: 35 }, paliers: [10, 20, 30] });
    const aretes = session.sauvegarde.meta.monnaies.aretes;
    expect(aretes).toBeGreaterThan(0);
    await session.rangerPartie(vague35(), 1, 'chaumes');
    expect(session.sauvegarde.meta.monnaies.aretes).toBe(aretes);
  });

  it("un niveau de campagne lancé par-dessus une partie infinie fermée à la vague 35 garde le record", async () => {
    const session = await ouvrirSession(ouverte());
    await session.rangerPartie(vague35(), 1, 'chaumes');
    await session.rangerPartie(jusquaVague({ ...CONFIG, infini: null }, 1), 2);
    expect(session.sauvegarde.partie?.carte).toBeUndefined();
    expect(session.sauvegarde.meta.infini.records).toEqual({ chaumes: 35 });
    expect(session.sauvegarde.meta.infini.paliers).toEqual([10, 20, 30]);
  });

  it('une partie infinie oubliée (autres données de jeu) garde son record', async () => {
    const session = await ouvrirSession(ouverte());
    await session.rangerPartie(vague35(), 1, 'chaumes');
    const examen = session.examinerPartie();
    expect(examen.reprise).not.toBeNull();
    // Les données de jeu ont changé : l'état ne se relit plus, la partie est oubliée.
    const stockage = new StockageMemoire();
    const depot = new Depot(stockage);
    const sauve = session.sauvegarde;
    const partie = sauve.partie;
    if (!partie) throw new Error('pas de partie');
    await depot.enregistrer({ ...sauve, partie: { ...partie, config: { ...partie.config, versionDonnees: partie.config.versionDonnees + 1 } } });
    const autre = await Session.ouvrir(depot, null, { verrou: null });
    expect(autre.examinerPartie().oubliee).toBe(true);
    await autre.effacerPartie();
    expect(autre.sauvegarde.meta.infini.records).toEqual({ chaumes: 35 });
  });

  it("le bilan de fin compte ce que le rangement a déjà payé", async () => {
    const session = await ouvrirSession(ouverte());
    await session.rangerPartie(vague35(), 1, 'chaumes');
    const fin = await session.enregistrerFinInfini({ carte: 'chaumes', vague: 36 }, CONFIG.graine);
    if (!fin.ok) throw new Error('fin refusée');
    expect(fin.detail).toMatchObject({ record: 36, recordPrecedent: 0, nouveauRecord: true, paliersPayes: [10, 20, 30] });
    expect(fin.detail.aretes).toBe(session.sauvegarde.meta.monnaies.aretes);
  });
});
