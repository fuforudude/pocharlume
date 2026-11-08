// Mode infini à la vague 100 : l'état sérialisé tient dans la sauvegarde (TAILLE_MAX_ETAT) et le nombre d'ennemis vivants reste borné.
// Mesure de l'infini (bandes) : voir bandes-infini.test.ts.
import { describe, expect, it } from 'vitest';
import { INFINI } from '../data/infini';
import { avancer, creerPartie, serialiser } from '../engine';
import { lancerVague } from '../engine/vagues';
import { niveauDeCampagne } from '../data/niveaux/campagne';
import { TAILLE_MAX_ETAT } from '../save/validation';
import { configPartie } from './simulation';

describe('partie infinie à la vague 100', () => {
  it.each([1, 6, 10, 11])('région %i : l’état sérialisé reste sous la taille maximale et les ennemis vivants restent bornés', (region) => {
    const campagne = niveauDeCampagne(region === 1 ? 1 : region * 10 - 9);
    if (!campagne) throw new Error('niveau introuvable');
    const etat = creerPartie(campagne.niveau, configPartie({ graine: 11, difficulte: 'matou', infini: { region } }));
    etat.vagues.lancees = 99;
    lancerVague(etat, 0);
    let maxVivants = 0;
    // Les 200 ennemis de la vague 100 arrivent en quelques minutes : on avance jusqu'à la fin de la partie ou à 10 minutes de jeu.
    for (let i = 0; i < 30 * 600 && etat.statut === 'en_cours'; i++) {
      avancer(etat, []);
      if (i % 30 === 0) maxVivants = Math.max(maxVivants, etat.ennemis.filter((e) => e.vivant).length);
    }
    expect(serialiser(etat).length).toBeLessThan(TAILLE_MAX_ETAT);
    expect(maxVivants).toBeLessThanOrEqual(2 * INFINI.ennemisMaxParVague);
  });
});
