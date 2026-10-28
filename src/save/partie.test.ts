import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import type { EtatPartie } from '../engine/etat';
import { premiereCaseLibre } from '../engine/aides.test-utils';
import { appliquerAction, creerPartie, serialiser, step } from '../engine/partie';
import { Depot } from './depot';
import { enregistrerVictoire } from './progression';
import { sauvegardeVide } from './format';
import { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
import { StockageMemoire } from './stockage';
import { VERSION_DONNEES } from '../data/version';
import { validerSauvegarde } from './validation';

const CONFIG = { graine: 5, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

function niveau1(): EtatPartie {
  const campagne = REGION1[0];
  if (!campagne) throw new Error('niveau 1 absent');
  return creerPartie(campagne.niveau, CONFIG);
}

/** Avance jusqu'à ce que `n` vagues soient lancées. */
function jusquaVague(etat: EtatPartie, n: number): void {
  appliquerAction(etat, { type: 'construire', ...premiereCaseLibre(etat), tour: 'tir' });
  while (etat.vagues.lancees < n && etat.statut === 'en_cours') step(etat);
}

describe('partie en cours', () => {
  it('prend l’instantané juste après le lancement d’une vague, avec son numéro', () => {
    const etat = niveau1();
    expect(partieEnCours(etat, 1)).toBeNull(); // aucune vague lancée
    jusquaVague(etat, 1);
    const p = partieEnCours(etat, 1);
    expect(p).toMatchObject({ niveau: 1, vague: 1, config: CONFIG });
    expect(p?.etat).toBe(serialiser(etat));
    jusquaVague(etat, 3);
    expect(partieEnCours(etat, 1)?.vague).toBe(3);
  });

  it('ne copie pas la config par référence', () => {
    const etat = niveau1();
    jusquaVague(etat, 1);
    const p = partieEnCours(etat, 1);
    if (!p) throw new Error('pas de partie');
    p.config.graine = 999;
    expect(etat.config.graine).toBe(5);
  });

  it('refuse un numéro de niveau invalide et une partie finie', () => {
    const etat = niveau1();
    jusquaVague(etat, 1);
    for (const n of [0, 101, 1.5, Number.NaN]) expect(partieEnCours(etat, n)).toBeNull();
    etat.statut = 'defaite';
    expect(partieEnCours(etat, 1)).toBeNull();
  });

  it('la partie rangée dans une sauvegarde est valide, survit au stockage et reprend à l’identique', async () => {
    const etat = niveau1();
    jusquaVague(etat, 2);
    const partie = partieEnCours(etat, 1);
    if (!partie) throw new Error('pas de partie');
    const s = avecPartieEnCours(sauvegardeVide(), partie);
    expect(validerSauvegarde(JSON.parse(JSON.stringify(s))).ok).toBe(true);

    const stockage = new StockageMemoire();
    await new Depot(stockage).enregistrer(s);
    const relue = (await new Depot(stockage).charger()).sauvegarde.partie;
    expect(relue).toEqual(partie);
    if (!relue) throw new Error('pas de partie relue');
    expect(relue.vague).toBe(2);

    // « Reprendre à la vague 2 » : l'état relu est celui du moment de l'instantané, et la suite est la même.
    const reprise = reprendrePartie(relue);
    if (!reprise) throw new Error('reprise impossible');
    expect(serialiser(reprise)).toBe(serialiser(etat));
    for (let i = 0; i < 600; i++) {
      step(etat);
      step(reprise);
    }
    expect(serialiser(reprise)).toBe(serialiser(etat));
  });

  it('refuse de reprendre une partie illisible, incohérente ou d’une autre version des données', () => {
    const etat = niveau1();
    jusquaVague(etat, 1);
    const bonne = partieEnCours(etat, 1);
    if (!bonne) throw new Error('pas de partie');
    expect(reprendrePartie(bonne)).not.toBeNull();
    expect(reprendrePartie({ ...bonne, etat: '{"pas":"un état"}' })).toBeNull();
    expect(reprendrePartie({ ...bonne, etat: '{abîmé' })).toBeNull();
    expect(reprendrePartie({ ...bonne, vague: 4 })).toBeNull();
    expect(reprendrePartie({ ...bonne, config: { ...bonne.config, dieu: 'autre' } })).toBeNull();
    const autreVersion = JSON.parse(bonne.etat) as { versionDonnees: number };
    autreVersion.versionDonnees = VERSION_DONNEES + 1;
    expect(reprendrePartie({ ...bonne, etat: JSON.stringify(autreVersion) })).toBeNull();
    const terminee = JSON.parse(bonne.etat) as { statut: string };
    terminee.statut = 'victoire';
    expect(reprendrePartie({ ...bonne, etat: JSON.stringify(terminee) })).toBeNull();
  });

  it('une victoire effacerait la partie en cours : le dépôt garde le reste de la progression', () => {
    const etat = niveau1();
    jusquaVague(etat, 1);
    const partie = partieEnCours(etat, 1);
    let s = avecPartieEnCours(sauvegardeVide(), partie);
    s = avecPartieEnCours(enregistrerVictoire(s, 1, 'matou', 3), null);
    expect(s.partie).toBeNull();
    expect(s.progression.niveauMax).toBe(2);
  });
});
