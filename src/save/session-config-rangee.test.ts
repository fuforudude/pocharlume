// Une partie rangée avec un bonus de collection ou un défi doit pouvoir être sauvegardée, relue et reprise, et une
// opération refusée par la validation ne doit jamais bloquer les écritures suivantes.
import { describe, expect, it } from 'vitest';
import { VERSION_DONNEES } from '../data/version';
import { REGION1 } from '../data/niveaux/region1';
import { premiereCaseLibre } from '../engine/aides.test-utils';
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import { appliquerAction, creerPartie, step } from '../engine/partie';
import { Depot } from './depot';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { creerVerrouMemoire } from './verrou';

const BASE: ConfigPartie = {
  graine: 12,
  difficulte: 'matou',
  dieu: 'charlie',
  heros: 'charlie',
  niveauHeros: 1,
  competencesHeros: {},
  ameliorations: {},
  objets: [],
  versionDonnees: VERSION_DONNEES,
};
const BONUS = { tours: { tir: { degats: 0.05 } }, heros: {} };

const CAS: readonly [string, Partial<ConfigPartie>][] = [
  ['partie normale avec skin équipé', { bonus: BONUS }],
  ['défi Fer', { defi: 'fer' }],
  ['défi Héroïque, collection vide', { defi: 'heroique' }],
  ['partie infinie avec skin', { bonus: BONUS, infini: { region: 1 } }],
];

function partieA(config: ConfigPartie): EtatPartie {
  const niveau = REGION1[0];
  if (!niveau) throw new Error('niveau 1 absent');
  const etat = creerPartie(niveau.niveau, config);
  appliquerAction(etat, { type: 'construire', ...premiereCaseLibre(etat), tour: 'tir' });
  while (etat.vagues.lancees < 1 && etat.statut === 'en_cours') step(etat);
  return etat;
}

function ouverte(): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= 10; n++) s = enregistrerVictoire(s, n, 'matou', 1);
  return s;
}

async function session(): Promise<{ stockage: StockageMemoire; session: Session }> {
  const stockage = new StockageMemoire();
  await new Depot(stockage).enregistrer(ouverte());
  return { stockage, session: await Session.ouvrir(new Depot(stockage), null, { verrou: creerVerrouMemoire() }) };
}

describe('session : parties rangées avec défi ou bonus', () => {
  it.each(CAS)('%s : rangée, écriture suivante possible, reprise relue', async (_nom, extra) => {
    const { stockage, session: s } = await session();
    const etat = partieA({ ...BASE, ...extra });
    const carte = extra.infini ? 'chaumes' : undefined;
    expect([etat.statut, etat.vagues.lancees]).toEqual(['en_cours', 1]);
    expect(await s.rangerPartie(etat, 1, carte)).toBe(true);
    expect(await s.changerReglages({ son: 0 })).toBe(true);
    const relue = await Session.ouvrir(new Depot(stockage), null, { verrou: null });
    expect(relue.partieAReprendre()).toMatchObject({ niveau: 1, vague: 1 });
    expect(relue.sauvegarde.partie).not.toBeNull();
  });
});

describe('session : une opération refusée par la validation', () => {
  it('est abandonnée et ne bloque pas les écritures suivantes', async () => {
    const { stockage, session: s } = await session();
    const etat = partieA(BASE);
    etat.config.heros = 'heros_inconnu';
    expect(await s.rangerPartie(etat, 1)).toBe(false);
    expect(s.sauvegarde.partie).toBeNull();
    expect(await s.changerReglages({ son: 10 })).toBe(true);
    const relue = await Session.ouvrir(new Depot(stockage), null, { verrou: null });
    expect(relue.sauvegarde.reglages.son).toBe(10);
  });
});
