// Évaluation de la région 1 partagée par les tests des bandes (un fichier de test par difficulté, pour que
// Vitest les joue en parallèle). Suffixe .test-utils.ts : jamais importé par le jeu.
// Les trois dieux d'une difficulté se calculent chacun dans un fil à part (comme `npm run balance`) : le résultat ne
// dépend pas de l'ordre d'arrivée, et le temps d'un fichier est celui d'un seul dieu.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { DIEUX_EVALUES, GRAINES_ENTRAINEMENT, GRAINES_EVALUATION, type Evaluation } from './campagne';

/**
 * Graines des tests : les dix de `npm run balance`, avec ses deux graines d'entraînement (mêmes résultats que le rapport).
 * Le coût est tenu par le parallélisme : un fil par dieu et par difficulté, trois difficultés en parallèle.
 */
export const GRAINES_TEST = GRAINES_EVALUATION;

const TRAVAILLEUR = new URL('./bandes.travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../../tools/niveaux/enregistrer.ts', import.meta.url))).href;

function evaluerDieu(difficulte: string, dieu: string): Promise<Evaluation[]> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, {
      workerData: { difficulte, dieu, graines: [...GRAINES_TEST], grainesEntrainement: [...GRAINES_ENTRAINEMENT] },
      execArgv: ['--import', CROCHET],
    });
    fil.once('message', (evaluations: Evaluation[]) => {
      resolve(evaluations);
    });
    fil.once('error', reject);
    fil.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Fil de ${dieu} (${difficulte}) arrêté avec le code ${String(code)}`));
    });
  });
}

/**
 * Évalue les 10 niveaux de la région 1 dans une difficulté pour les trois dieux, sur les graines de test.
 * Les dieux sont calculés en parallèle.
 */
export async function evaluerRegion1(difficulte: string): Promise<Evaluation[]> {
  return (await Promise.all(DIEUX_EVALUES.map((dieu) => evaluerDieu(difficulte, dieu)))).flat();
}

/** Marge de temps pour une évaluation complète (les parties se jouent en quelques secondes). */
export const DELAI_EVALUATION = 180_000;
