// Évaluation de la région 1 partagée par les tests des bandes (un fichier de test par difficulté, pour que
// Vitest les joue en parallèle). Suffixe .test-utils.ts : jamais importé par le jeu.
import { REGION1 } from '../data/niveaux/region1';
import { evaluerCampagne, type Evaluation } from './campagne';

/** Évalue les 10 niveaux de la région 1 dans une difficulté, sur toutes les graines d'évaluation. */
export function evaluerRegion1(difficulte: string): Evaluation[] {
  return evaluerCampagne({ niveaux: REGION1, difficultes: [difficulte] });
}

/** Marge de temps pour une évaluation complète (les parties se jouent en quelques secondes). */
export const DELAI_EVALUATION = 180_000;
