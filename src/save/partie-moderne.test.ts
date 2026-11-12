// La partie en cours porte sa campagne (sauvegarde v9, champ facultatif `campagne`, absent = histoire) : une partie du DLC se range, se
// valide contre la progression du DLC, se relit et se reprend dans le DLC ; une partie de l'histoire n'a pas le champ.
import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { premiereCaseLibre } from '../engine/aides.test-utils';
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import { appliquerAction, creerPartie, serialiser, step } from '../engine/partie';
import { VERSION_DONNEES } from '../data/version';
import { moderneParDefaut, sauvegardeVide, type PartieEnCours, type Sauvegarde } from './format';
import { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
import { StockageMemoire } from './stockage';
import { Depot } from './depot';
import { Session } from './session';
import { validerSauvegarde } from './validation';

const CONFIG: ConfigPartie = { graine: 5, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

/** Une partie du niveau 1 de l'histoire, ou de ce même plan rangé comme le niveau `numero` du DLC. */
function partie(campagne: 'histoire' | 'moderne', numero = 1): EtatPartie {
  const base = REGION1[0]?.niveau;
  if (!base) throw new Error('niveau 1 absent');
  const niveau = campagne === 'moderne' ? { ...base, campagne: 'moderne' as const, numero } : base;
  const etat = creerPartie(niveau, CONFIG);
  appliquerAction(etat, { type: 'construire', ...premiereCaseLibre(etat), tour: 'tir' });
  while (etat.vagues.lancees < 1 && etat.statut === 'en_cours') step(etat);
  return etat;
}

function rangee(etat: EtatPartie, numero: number): PartieEnCours {
  const p = partieEnCours(etat, numero);
  if (!p) throw new Error('pas de partie');
  return p;
}

/** La sauvegarde du DLC débloqué jusqu'au niveau `niveauMax`, avec cette partie rangée. */
function sauvegardeAvec(p: PartieEnCours, niveauMaxModerne = 1): Sauvegarde {
  const base = avecPartieEnCours(sauvegardeVide(), p);
  const etoiles: Sauvegarde['progression']['etoiles'] = {};
  for (let n = 1; n < niveauMaxModerne; n++) etoiles[String(n)] = { matou: 1 };
  return { ...base, moderne: { ...moderneParDefaut(), progression: { niveauMax: niveauMaxModerne, etoiles } } };
}

const viaJson = (s: Sauvegarde): unknown => JSON.parse(JSON.stringify(s));

describe('partie du DLC rangée dans la sauvegarde', () => {
  it('une partie de l’histoire n’a pas de champ `campagne`, une partie du DLC a `moderne`', () => {
    expect(Object.hasOwn(rangee(partie('histoire'), 1), 'campagne')).toBe(false);
    expect(rangee(partie('moderne'), 1).campagne).toBe('moderne');
  });

  it('une partie du DLC est valide si le niveau est ouvert dans la progression du DLC, pas dans celle de l’histoire', () => {
    const p = rangee(partie('moderne', 5), 5);
    // Un nouveau joueur : l'histoire n'a que le niveau 1 d'ouvert, mais le DLC est ouvert jusqu'au niveau 5.
    expect(validerSauvegarde(viaJson(sauvegardeAvec(p, 5))).ok).toBe(true);
    // Le DLC n'est ouvert que jusqu'au niveau 4 : la partie du niveau 5 est refusée.
    expect(validerSauvegarde(viaJson(sauvegardeAvec(p, 4))).ok).toBe(false);
  });

  it('la progression de l’histoire ne suffit pas à ouvrir un niveau du DLC, et inversement', () => {
    const moderne = rangee(partie('moderne', 5), 5);
    const histoireOuverte = { ...sauvegardeAvec(moderne, 1), progression: { niveauMax: 20, etoiles: {} } };
    const refus = validerSauvegarde(viaJson(histoireOuverte));
    expect(refus.ok).toBe(false);
    const histoire = rangee(partie('histoire'), 1);
    expect(validerSauvegarde(viaJson(sauvegardeAvec(histoire, 1))).ok).toBe(true);
    // Une partie de l'histoire au niveau 5 reste soumise à la progression de l'histoire, pas à celle du DLC.
    const niveau5 = { ...histoire, niveau: 5 };
    expect(validerSauvegarde(viaJson(sauvegardeAvec(niveau5, 9))).ok).toBe(false);
  });

  it('refuse un niveau du DLC au-delà de 30, une campagne inconnue ou écrite « histoire », et une partie infinie du DLC', () => {
    const p = rangee(partie('moderne'), 1);
    expect(validerSauvegarde(viaJson(sauvegardeAvec({ ...p, niveau: 31 }, 30))).ok).toBe(false);
    for (const campagne of ['histoire', 'autre', 3, null]) {
      expect(validerSauvegarde(viaJson(sauvegardeAvec({ ...p, campagne } as unknown as PartieEnCours))).ok, String(campagne)).toBe(false);
    }
    const infinie = { ...p, carte: 'amphi', config: { ...p.config, infini: { region: 1 } } };
    expect(validerSauvegarde(viaJson(sauvegardeAvec(infinie, 30))).ok).toBe(false);
  });

  it('une partie de l’histoire sans `campagne` (sauvegarde déjà rangée) se valide comme avant', () => {
    const p = rangee(partie('histoire'), 1);
    const s = viaJson(sauvegardeAvec(p)) as { partie: Record<string, unknown> };
    expect(Object.hasOwn(s.partie, 'campagne')).toBe(false);
    expect(validerSauvegarde(s).ok).toBe(true);
  });

  it('se relit et se reprend dans le DLC, à l’identique', async () => {
    const etat = partie('moderne', 3);
    const p = rangee(etat, 3);
    const stockage = new StockageMemoire();
    await new Depot(stockage).enregistrer(sauvegardeAvec(p, 3));
    const relue = (await new Depot(stockage).charger()).sauvegarde.partie;
    expect(relue).toEqual(p);
    if (!relue) throw new Error('pas de partie relue');
    const reprise = reprendrePartie(relue);
    expect(reprise && serialiser(reprise)).toBe(serialiser(etat));
    expect(reprise?.niveau.campagne).toBe('moderne');
  });

  it('refuse de reprendre une partie dont la campagne n’est pas celle de l’état', () => {
    const histoire = rangee(partie('histoire'), 1);
    expect(reprendrePartie(histoire)).not.toBeNull();
    expect(reprendrePartie({ ...histoire, campagne: 'moderne' })).toBeNull();
    const moderne = rangee(partie('moderne'), 1);
    expect(reprendrePartie(moderne)).not.toBeNull();
    const sans: PartieEnCours = { ...moderne };
    delete sans.campagne;
    expect(reprendrePartie(sans)).toBeNull();
  });

  it('la session propose de reprendre la partie du DLC, avec sa campagne', async () => {
    const stockage = new StockageMemoire();
    await new Depot(stockage).enregistrer(sauvegardeAvec(rangee(partie('moderne', 3), 3), 3));
    const session = await Session.ouvrir(new Depot(stockage), null, { verrou: null });
    expect(session.partieAReprendre()).toMatchObject({ niveau: 3, campagne: 'moderne' });
  });
});
