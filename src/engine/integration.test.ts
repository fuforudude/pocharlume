// Partie complète sur le niveau de test, par l'API publique : une défense raisonnable gagne, rien ne perd.
import { describe, expect, it } from 'vitest';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import { CONFIG } from './aides.test-utils';
import { appliquerAction, creerPartie, rejouer, serialiser, step, validerAction, type Action, type EtatPartie } from './index';

/** Plan fixe d'un joueur raisonnable : il exécute la prochaine étape dès qu'il en a les moyens. */
const PLAN: readonly Action[] = [
  { type: 'construire', socle: 1, tour: 'caserne' },
  { type: 'construire', socle: 0, tour: 'tir' },
  { type: 'construire', socle: 2, tour: 'tir' },
  { type: 'construire', socle: 4, tour: 'magie' },
  { type: 'ameliorer', socle: 0 },
  { type: 'ameliorer', socle: 2 },
  { type: 'construire', socle: 3, tour: 'artillerie' },
  { type: 'construire', socle: 5, tour: 'tir' },
  { type: 'ameliorer', socle: 1 },
  { type: 'ameliorer', socle: 4 },
  { type: 'ameliorer', socle: 0 },
  { type: 'ameliorer', socle: 2 },
  { type: 'ameliorer', socle: 1 },
  { type: 'ameliorer', socle: 3 },
  { type: 'ameliorer', socle: 5 },
  { type: 'specialiser', socle: 0, voie: 'B' },
  { type: 'specialiser', socle: 1, voie: 'A' },
  { type: 'ameliorer', socle: 4 },
  { type: 'specialiser', socle: 4, voie: 'A' },
];

function jouerAvecPlan(): EtatPartie {
  const etat = creerPartie(NIVEAU_TEST, CONFIG);
  let etape = 0;
  appliquerAction(etat, { type: 'deplacerHeros', x: 18, y: 13 });
  while (etat.statut === 'en_cours' && etat.pas < 30 * 60 * 15) {
    const action = PLAN[etape];
    if (action && validerAction(etat, action) === null) {
      appliquerAction(etat, action);
      etape++;
    }
    const sort = { type: 'lancerSort', emplacement: 0, x: 12, y: 8 } as const;
    if (etat.ennemis.length > 8 && validerAction(etat, sort) === null) appliquerAction(etat, sort);
    step(etat);
  }
  return etat;
}

describe('partie complète sur le niveau de test', () => {
  it('une défense raisonnable gagne avec des étoiles', () => {
    const etat = jouerAvecPlan();
    expect(etat.statut).toBe('victoire');
    expect(etat.etoiles).toBeGreaterThanOrEqual(1);
  });

  it('sans défense, la partie est perdue', () => {
    const etat = rejouer(NIVEAU_TEST, CONFIG, []);
    expect(etat.statut).toBe('defaite');
  });

  it('la partie jouée se rejoue à l’identique depuis son journal', () => {
    const etat = jouerAvecPlan();
    expect(serialiser(rejouer(NIVEAU_TEST, CONFIG, etat.journal))).toBe(serialiser(etat));
  });
});
