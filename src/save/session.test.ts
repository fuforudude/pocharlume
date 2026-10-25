import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { VERSION_DONNEES } from '../data/version';
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import { appliquerAction, avancer, creerPartie, serialiser, step } from '../engine/partie';
import { CLE_SAUVEGARDE, Depot } from './depot';
import { etoilesDe, meilleuresEtoiles, niveauDebloque, totalEtoiles } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';

const CONFIG: ConfigPartie = { graine: 11, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

async function ouvrir(stockage = new StockageMemoire()): Promise<{ session: Session; stockage: StockageMemoire }> {
  return { session: await Session.ouvrir(new Depot(stockage)), stockage };
}

/** Relit le stockage comme le ferait un nouveau démarrage. */
async function rouvrir(stockage: StockageMemoire): Promise<Session> {
  return Session.ouvrir(new Depot(stockage));
}

function niveau(numero: number): EtatPartie {
  const campagne = REGION1[numero - 1];
  if (!campagne) throw new Error(`niveau ${String(numero)} absent`);
  return creerPartie(campagne.niveau, CONFIG);
}

function jusquaVague(etat: EtatPartie, n: number): void {
  appliquerAction(etat, { type: 'construire', socle: 0, tour: 'tir' });
  while (etat.vagues.lancees < n && etat.statut === 'en_cours') step(etat);
}

describe('victoire', () => {
  it('enregistre les étoiles, débloque le niveau suivant et survit à un rechargement', async () => {
    const { session, stockage } = await ouvrir();
    expect(niveauDebloque(session.sauvegarde, 2)).toBe(false);
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 2, config: CONFIG });
    expect(etoilesDe(session.sauvegarde, 1, 'matou')).toBe(2);
    expect(niveauDebloque(session.sauvegarde, 2)).toBe(true);

    const relue = await rouvrir(stockage);
    expect(relue.sauvegarde.progression).toEqual(session.sauvegarde.progression);
    expect(totalEtoiles(relue.sauvegarde)).toBe(2);
  });

  it('garde le meilleur résultat par difficulté, sans jamais le baisser', async () => {
    const { session } = await ouvrir();
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: CONFIG });
    expect(etoilesDe(session.sauvegarde, 1, 'matou')).toBe(3);
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: { ...CONFIG, difficulte: 'chaton' } });
    expect(etoilesDe(session.sauvegarde, 1, 'chaton')).toBe(1);
    expect(etoilesDe(session.sauvegarde, 1, 'matou')).toBe(3);
    expect(meilleuresEtoiles(session.sauvegarde, 1)).toBe(3);
  });

  it('ne débloque rien pour un niveau verrouillé ni pour une difficulté inconnue', async () => {
    const { session } = await ouvrir();
    await session.terminerPartie({ niveau: 5, statut: 'victoire', etoiles: 3, config: CONFIG });
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: { ...CONFIG, difficulte: 'dieu' } });
    expect(session.sauvegarde.progression).toEqual({ niveauMax: 1, etoiles: {} });
  });

  it('efface la partie en cours', async () => {
    const { session, stockage } = await ouvrir();
    const etat = niveau(1);
    jusquaVague(etat, 1);
    await session.rangerPartie(etat, 1);
    expect(session.sauvegarde.partie).not.toBeNull();
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    expect(session.sauvegarde.partie).toBeNull();
    expect((await rouvrir(stockage)).partieAReprendre()).toBeNull();
  });
});

describe('défaite', () => {
  it('ne change pas la progression mais efface la partie en cours', async () => {
    const { session } = await ouvrir();
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: CONFIG });
    const progression = structuredClone(session.sauvegarde.progression);
    const etat = niveau(2);
    jusquaVague(etat, 1);
    await session.rangerPartie(etat, 2);
    await session.terminerPartie({ niveau: 2, statut: 'defaite', etoiles: 0, config: CONFIG });
    expect(session.sauvegarde.progression).toEqual(progression);
    expect(session.sauvegarde.partie).toBeNull();
  });
});

describe('partie en cours', () => {
  it('ne range rien avant le lancement de la première vague', async () => {
    const { session, stockage } = await ouvrir();
    expect(await session.rangerPartie(niveau(1), 1)).toBe(false);
    expect(session.sauvegarde.partie).toBeNull();
    expect(await stockage.get(CLE_SAUVEGARDE)).toBeNull();
  });

  it('une reprise redonne un état identique à celui enregistré, puis la même suite de partie', async () => {
    const { session, stockage } = await ouvrir();
    const etat = niveau(1);
    jusquaVague(etat, 2);
    await session.rangerPartie(etat, 1);
    const octetsEnregistres = serialiser(etat);

    const reprise = (await rouvrir(stockage)).partieAReprendre();
    if (!reprise) throw new Error('rien à reprendre');
    expect(reprise.niveau).toBe(1);
    expect(reprise.vague).toBe(2);
    expect(serialiser(reprise.etat)).toBe(octetsEnregistres);

    // La partie reprise et la partie d'origine se déroulent ensuite à l'identique.
    for (let i = 0; i < 600; i++) {
      avancer(etat, []);
      avancer(reprise.etat, []);
    }
    expect(serialiser(reprise.etat)).toBe(serialiser(etat));
  });

  it('la dernière vague lancée remplace l’instantané précédent', async () => {
    const { session } = await ouvrir();
    const etat = niveau(1);
    jusquaVague(etat, 1);
    await session.rangerPartie(etat, 1);
    jusquaVague(etat, 2);
    await session.rangerPartie(etat, 1);
    expect(session.partieAReprendre()?.vague).toBe(2);
  });

  it('l’abandon oublie la partie, aussi après rechargement', async () => {
    const { session, stockage } = await ouvrir();
    const etat = niveau(1);
    jusquaVague(etat, 1);
    await session.rangerPartie(etat, 1);
    await session.effacerPartie();
    expect(session.partieAReprendre()).toBeNull();
    expect((await rouvrir(stockage)).partieAReprendre()).toBeNull();
  });

  it('une partie qu’on ne sait plus relire n’est pas proposée et est oubliée', async () => {
    const { session, stockage } = await ouvrir();
    const etat = niveau(1);
    jusquaVague(etat, 1);
    await session.rangerPartie(etat, 1);
    const brut = JSON.parse((await stockage.get(CLE_SAUVEGARDE)) ?? '{}') as { partie: { etat: string } };
    brut.partie.etat = '{"version":-1}';
    await stockage.set(CLE_SAUVEGARDE, JSON.stringify(brut));

    const relue = await rouvrir(stockage);
    expect(relue.partieAReprendre()).toBeNull();
    expect(relue.sauvegarde.partie).toBeNull();
  });
});

describe('réglages', () => {
  it('sont gardés d’un démarrage à l’autre, les valeurs hors bornes sont ignorées', async () => {
    const { session, stockage } = await ouvrir();
    await session.changerReglages({ son: 30, musique: 0, vitesse: 2 });
    await session.changerReglages({ son: 150 });
    const relue = await rouvrir(stockage);
    expect(relue.sauvegarde.reglages).toEqual({ son: 30, musique: 0, vitesse: 2 });
  });
});

describe('export et import', () => {
  async function profilJoue(): Promise<{ session: Session; stockage: StockageMemoire }> {
    const profil = await ouvrir();
    await profil.session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    await profil.session.terminerPartie({ niveau: 2, statut: 'victoire', etoiles: 2, config: { ...CONFIG, difficulte: 'vieux_sage' } });
    await profil.session.changerReglages({ son: 10, musique: 20, vitesse: 2 });
    return profil;
  }

  it('importer le code d’un profil sur un profil vide redonne la même progression', async () => {
    const source = await profilJoue();
    const code = await source.session.exporter();

    const vide = await ouvrir();
    const lu = await vide.session.importer(code);
    if (!lu.ok) throw new Error(lu.detail);
    // Lire un code ne change encore rien.
    expect(vide.session.sauvegarde.progression.niveauMax).toBe(1);
    await vide.session.appliquerImport(lu.sauvegarde);

    expect(vide.session.sauvegarde.progression).toEqual(source.session.sauvegarde.progression);
    expect(vide.session.sauvegarde.reglages).toEqual(source.session.sauvegarde.reglages);
    const relue = await rouvrir(vide.stockage);
    expect(relue.sauvegarde.progression).toEqual(source.session.sauvegarde.progression);
  });

  it('un import appliqué abandonne la partie en cours', async () => {
    const source = await profilJoue();
    const code = await source.session.exporter();
    const cible = await ouvrir();
    const etat = niveau(1);
    jusquaVague(etat, 1);
    await cible.session.rangerPartie(etat, 1);
    const lu = await cible.session.importer(code);
    if (!lu.ok) throw new Error(lu.detail);
    await cible.session.appliquerImport(lu.sauvegarde);
    expect(cible.session.sauvegarde.partie).toBeNull();
  });

  it('un code refusé ne modifie ni la session ni le stockage', async () => {
    const source = await profilJoue();
    const code = await source.session.exporter();
    const cible = await profilJoue();
    const avant = await cible.stockage.get(CLE_SAUVEGARDE);
    const progression = structuredClone(cible.session.sauvegarde);

    const mauvais = ['', '   ', 'bonjour', 'PCH1.z.abc.00000000', `${code.slice(0, -3)}000`, code.slice(0, 30), 'x'.repeat(20_000)];
    for (const texte of mauvais) {
      const resultat = await cible.session.importer(texte);
      expect(resultat.ok, texte.slice(0, 20)).toBe(false);
    }
    expect(cible.session.sauvegarde).toEqual(progression);
    expect(await cible.stockage.get(CLE_SAUVEGARDE)).toBe(avant);
  });

  it('rend une raison distincte pour un code vide, mal formé ou tronqué', async () => {
    const { session } = await ouvrir();
    const code = await session.exporter();
    const raison = async (texte: string): Promise<string> => {
      const r = await session.importer(texte);
      return r.ok ? 'ok' : r.raison;
    };
    expect(await raison('')).toBe('vide');
    expect(await raison('bonjour')).toBe('format');
    expect(await raison(code.slice(0, -1))).toBe('somme');
    expect(await raison(code)).toBe('ok');
  });
});
