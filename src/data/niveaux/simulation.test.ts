// Les 10 niveaux de la région 1 sont jouables de bout en bout : un plan de construction automatique gagne en
// Matou, et sans aucune tour on perd. Ce n'est pas le réglage fin de la difficulté (le simulateur de la
// tâche 9 s'en charge), seulement la garantie qu'un niveau n'est ni impossible ni gagné d'avance.
import { describe, expect, it } from 'vitest';
import { rejouer, serialiser } from '../../engine/partie';
import { CONFIG_MATOU, jouer, planDeConstruction } from './bot.test-utils';
import { REGION1 } from './region1';

describe('les niveaux de la région 1 se jouent', () => {
  for (const campagne of REGION1) {
    it(`niveau ${String(campagne.numero)} : un plan de construction raisonnable gagne en Matou, quelle que soit la graine`, () => {
      for (const graine of [7, 8, 9]) {
        const bilan = jouer(campagne.niveau, planDeConstruction(campagne.niveau), { ...CONFIG_MATOU, graine });
        expect(bilan.statut, `graine ${String(graine)}`).toBe('victoire');
        expect(bilan.etoiles).toBeGreaterThanOrEqual(1);
      }
    });

    it(`niveau ${String(campagne.numero)} : sans aucune tour, on perd en Matou`, () => {
      expect(jouer(campagne.niveau, null).statut).toBe('defaite');
    });
  }

  it('la partie est rejouable à l’identique à partir de son journal', () => {
    const campagne = REGION1[4];
    if (!campagne) throw new Error('niveau 5 absent');
    const bilan = jouer(campagne.niveau, planDeConstruction(campagne.niveau));
    expect(bilan.etat.journal.length).toBeGreaterThan(8);
    const rejoue = rejouer(campagne.niveau, CONFIG_MATOU, bilan.etat.journal);
    expect(serialiser(rejoue)).toBe(serialiser(bilan.etat));
  });
});
