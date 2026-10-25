// Session : lecture en échec au démarrage, deux onglets sur le même stockage, canal de diffusion entre onglets.
import { describe, expect, it } from 'vitest';
import { VERSION_DONNEES } from '../data/version';
import type { ConfigPartie } from '../engine/etat';
import { StockageTruque } from './aides.test-utils';
import type { CanalSauvegarde } from './canal';
import { CLE_SAUVEGARDE, Depot } from './depot';
import { sauvegardeVide } from './format';
import { enregistrerVictoire, etoilesDe } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';

const CONFIG: ConfigPartie = { graine: 11, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };
const CHATON: ConfigPartie = { ...CONFIG, difficulte: 'chaton' };

function rouvrir(stockage: StockageTruque | StockageMemoire): Promise<Session> {
  return Session.ouvrir(new Depot(stockage));
}

/** La progression d'un joueur qui revient : niveaux 1 à 4 réussis. */
function progressionAvancee() {
  let s = sauvegardeVide();
  s = enregistrerVictoire(s, 1, 'matou', 3);
  s = enregistrerVictoire(s, 2, 'matou', 2);
  s = enregistrerVictoire(s, 3, 'chaton', 3);
  s = enregistrerVictoire(s, 4, 'matou', 1);
  return s;
}

describe('lecture en échec au démarrage', () => {
  it('une victoire ne détruit pas la progression existante quand le stockage répond de nouveau', async () => {
    const stockage = new StockageTruque();
    await new Depot(stockage).enregistrer(progressionAvancee());
    stockage.panneLecture = true;
    const session = await rouvrir(stockage);
    expect(session.origine).toBe('indisponible');
    expect(session.sauvegarde.progression.niveauMax).toBe(1);

    stockage.panneLecture = false;
    await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: CHATON });

    const relue = await rouvrir(stockage);
    expect(relue.sauvegarde.progression.niveauMax).toBe(5);
    expect(etoilesDe(relue.sauvegarde, 1, 'matou')).toBe(3);
    expect(etoilesDe(relue.sauvegarde, 3, 'chaton')).toBe(3);
    expect(etoilesDe(relue.sauvegarde, 1, 'chaton')).toBe(1);
    // La session elle-même montre maintenant la progression retrouvée.
    expect(session.sauvegarde.progression).toEqual(relue.sauvegarde.progression);
  });

  it('si la relecture échoue encore, la sauvegarde existante n’est pas écrasée', async () => {
    const stockage = new StockageTruque();
    await new Depot(stockage).enregistrer(progressionAvancee());
    const avant = stockage.donnees.get(CLE_SAUVEGARDE);
    stockage.panneLecture = true;
    const session = await rouvrir(stockage);
    const ecrituresAvant = stockage.ecritures;

    expect(await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG })).toBe(false);
    expect(await session.changerReglages({ son: 10 })).toBe(false);
    expect(stockage.ecritures).toBe(ecrituresAvant);
    expect(stockage.donnees.get(CLE_SAUVEGARDE)).toBe(avant);
    // Le jeu continue avec la sauvegarde en mémoire.
    expect(etoilesDe(session.sauvegarde, 1, 'matou')).toBe(3);

    // Dès que le stockage répond, ce qui est en mémoire est fusionné à ce qui existe, puis écrit.
    stockage.panneLecture = false;
    expect(await session.changerReglages({ vitesse: 2 })).toBe(true);
    const relue = await rouvrir(stockage);
    expect(relue.sauvegarde.progression.niveauMax).toBe(5);
    expect(relue.sauvegarde.reglages.vitesse).toBe(2);
  });

  it('un stockage vide qui répond de nouveau reçoit simplement la sauvegarde de la session', async () => {
    const stockage = new StockageTruque();
    stockage.panneLecture = true;
    const session = await rouvrir(stockage);
    stockage.panneLecture = false;
    expect(await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 2, config: CONFIG })).toBe(true);
    expect((await rouvrir(stockage)).sauvegarde.progression.niveauMax).toBe(2);
  });

  it('une sauvegarde lue normalement reste écrite même si une relecture échoue ensuite', async () => {
    const stockage = new StockageTruque();
    const session = await rouvrir(stockage);
    stockage.panneLecture = true;
    expect(await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 2, config: CONFIG })).toBe(true);
    stockage.panneLecture = false;
    expect((await rouvrir(stockage)).sauvegarde.progression.niveauMax).toBe(2);
  });

  it('un contenu devenu illisible n’est pas écrasé', async () => {
    const stockage = new StockageTruque();
    const session = await rouvrir(stockage);
    stockage.donnees.set(CLE_SAUVEGARDE, '{pas du json');
    expect(await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 2, config: CONFIG })).toBe(false);
    expect(stockage.donnees.get(CLE_SAUVEGARDE)).toBe('{pas du json');
  });
});

describe('deux onglets sur le même stockage', () => {
  it('un onglet ancien n’efface pas une victoire faite dans l’autre', async () => {
    const stockage = new StockageMemoire();
    const a = await rouvrir(stockage);
    const b = await rouvrir(stockage);
    await a.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    await a.terminerPartie({ niveau: 2, statut: 'victoire', etoiles: 2, config: CONFIG });
    expect(b.sauvegarde.progression.niveauMax).toBe(1);

    // L'onglet B ne sait rien de A : il change un réglage, puis gagne le niveau 1 dans une autre difficulté.
    await b.changerReglages({ son: 5 });
    await b.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: CHATON });

    const relue = await rouvrir(stockage);
    expect(relue.sauvegarde.progression.niveauMax).toBe(3);
    expect(etoilesDe(relue.sauvegarde, 1, 'matou')).toBe(3);
    expect(etoilesDe(relue.sauvegarde, 2, 'matou')).toBe(2);
    expect(etoilesDe(relue.sauvegarde, 1, 'chaton')).toBe(1);
    expect(relue.sauvegarde.reglages.son).toBe(5);
    // B a aussi retrouvé la progression de A dans sa session.
    expect(b.sauvegarde.progression.niveauMax).toBe(3);
  });

  it('garde la meilleure note de chaque onglet pour un même niveau et une même difficulté', async () => {
    const stockage = new StockageMemoire();
    const a = await rouvrir(stockage);
    const b = await rouvrir(stockage);
    await a.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    await b.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: CONFIG });
    expect(etoilesDe((await rouvrir(stockage)).sauvegarde, 1, 'matou')).toBe(3);
  });

  it('les écritures d’une même session lancées sans attendre se rangent dans l’ordre', async () => {
    const stockage = new StockageMemoire();
    const a = await rouvrir(stockage);
    await Promise.all([
      a.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG }),
      a.changerReglages({ vitesse: 2 }),
      a.terminerPartie({ niveau: 2, statut: 'victoire', etoiles: 2, config: CONFIG }),
      a.changerReglages({ son: 40 }),
    ]);
    const relue = (await rouvrir(stockage)).sauvegarde;
    expect(relue.progression.niveauMax).toBe(3);
    expect(etoilesDe(relue, 2, 'matou')).toBe(2);
    expect(relue.reglages).toMatchObject({ vitesse: 2, son: 40 });
  });

  it('un import remplace la progression : la fusion ne l’annule pas', async () => {
    const source = await rouvrir(new StockageMemoire());
    await source.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: CHATON });
    const code = await source.exporter();

    const stockage = new StockageMemoire();
    const cible = await rouvrir(stockage);
    await cible.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    await cible.terminerPartie({ niveau: 2, statut: 'victoire', etoiles: 3, config: CONFIG });
    const lu = await cible.importer(code);
    if (!lu.ok) throw new Error(lu.detail);
    await cible.appliquerImport(lu.sauvegarde);
    expect((await rouvrir(stockage)).sauvegarde.progression).toEqual(source.sauvegarde.progression);
  });
});

/** Deux extrémités d'un canal de diffusion en mémoire : un message publié par l'une arrive à l'autre. */
function canaux(): [CanalSauvegarde, CanalSauvegarde & { fermes: number }] {
  let versB: (() => void) | null = null;
  let versA: (() => void) | null = null;
  const a: CanalSauvegarde = {
    publier: () => { versB?.(); },
    ecouter: (rappel) => { versA = rappel; },
    fermer: () => { versA = null; },
  };
  const b = {
    fermes: 0,
    publier: () => { versA?.(); },
    ecouter: (rappel: () => void) => { versB = rappel; },
    fermer() {
      this.fermes++;
      versB = null;
    },
  };
  return [a, b];
}

/** Laisse passer les relectures asynchrones déclenchées par un message. */
async function laisserPasser(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('canal de diffusion entre onglets', () => {
  it('une victoire dans un onglet rafraîchit la session de l’autre, sans rien écrire', async () => {
    const stockage = new StockageTruque();
    const [canalA, canalB] = canaux();
    const a = await Session.ouvrir(new Depot(stockage), canalA);
    const b = await Session.ouvrir(new Depot(stockage), canalB);
    await a.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    const ecritures = stockage.ecritures;
    await laisserPasser();
    expect(b.sauvegarde.progression.niveauMax).toBe(2);
    expect(etoilesDe(b.sauvegarde, 1, 'matou')).toBe(3);
    expect(stockage.ecritures).toBe(ecritures);
  });

  it('fermer la session ferme son canal', async () => {
    const [, canalB] = canaux();
    const b = await Session.ouvrir(new Depot(new StockageMemoire()), canalB);
    b.fermer();
    expect(canalB.fermes).toBe(1);
  });

  it('sans canal (navigateur ancien), tout marche', async () => {
    const session = await rouvrir(new StockageMemoire());
    expect(await session.terminerPartie({ niveau: 1, statut: 'victoire', etoiles: 1, config: CONFIG })).toBe(true);
    session.fermer();
  });
});
