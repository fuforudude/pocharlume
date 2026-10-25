// Évaluation de la région 1 partagée par les tests des bandes (un fichier de test par difficulté, pour que
// Vitest les joue en parallèle). Suffixe .test-utils.ts : jamais importé par le jeu.
import { REGION1 } from '../data/niveaux/region1';
import { evaluerCampagne, GRAINES_EVALUATION, type Evaluation } from './campagne';

/**
 * Graines des tests : les cinq premières des dix de `npm run balance`, pour tenir dans le temps d'un `npm test`.
 * L'ensemble complet est vérifié par `npm run balance`.
 */
export const GRAINES_TEST = GRAINES_EVALUATION.slice(0, 5);

/** Évalue les 10 niveaux de la région 1 dans une difficulté, sur les graines de test (entraînement du soigneux sur une seule graine). */
export function evaluerRegion1(difficulte: string): Evaluation[] {
  return evaluerCampagne({ niveaux: REGION1, difficultes: [difficulte], graines: GRAINES_TEST, grainesEntrainement: [9001] });
}

/** Marge de temps pour une évaluation complète (les parties se jouent en quelques secondes). */
export const DELAI_EVALUATION = 180_000;
