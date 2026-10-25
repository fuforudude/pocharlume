// Les 10 niveaux de la région 1 sont jouables de bout en bout : le bot soigneux du simulateur gagne en Matou,
// et sans aucune tour on perd. Le réglage fin de la difficulté (bandes de victoire de chaque bot dans chaque
// difficulté) est vérifié par src/equilibrage/bandes-*.test.ts ; ici, seulement la garantie qu'un niveau n'est
// ni impossible ni gagné d'avance.
import { describe, expect, it } from 'vitest';
import { rejouer, serialiser } from '../../engine/partie';
import { creerBotSoigneux } from '../../equilibrage/bot-soigneux';
import { jouerPartie } from '../../equilibrage/simulation';
import { CONFIG_MATOU, jouer, planDeConstruction } from './bot.test-utils';
import { REGION1 } from './region1';

describe('les niveaux de la région 1 se jouent', () => {
  for (const campagne of REGION1) {
    it(`niveau ${String(campagne.numero)} : le bot soigneux gagne en Matou, quelle que soit la graine`, () => {
      for (const graine of [7, 8, 9]) {
        const bilan = jouerPartie(campagne.niveau, creerBotSoigneux(), { graine, difficulte: 'matou' });
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
