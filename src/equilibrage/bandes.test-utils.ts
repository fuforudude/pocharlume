// Évaluation des régions partagée par les tests des bandes (un fichier de test par difficulté, plus un pour les défis, pour que
// Vitest les joue en parallèle). Suffixe .test-utils.ts : jamais importé par le jeu.
// Chaque région, difficulté et dieu se calcule dans un fil à part (comme `npm run balance`) : le résultat ne dépend pas de l'ordre
// d'arrivée, et le temps d'un fichier est celui d'un seul fil.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { DIEUX_EVALUES, GRAINES_ENTRAINEMENT, GRAINES_EVALUATION, type Evaluation } from './campagne';

/**
 * Graines des tests : les dix de `npm run balance`, avec ses deux graines d'entraînement (mêmes résultats que le rapport).
 * Le coût est tenu par le parallélisme : un fil par région, dieu et difficulté.
 */
export const GRAINES_TEST = GRAINES_EVALUATION;

/** Les régions dont les bandes s'imposent (jalon 3 : les cinq premières). */
export const REGIONS_EVALUEES = [1, 2, 3, 4, 5] as const;

const TRAVAILLEUR = new URL('./bandes.travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../../tools/niveaux/enregistrer.ts', import.meta.url))).href;

function evaluerDieu(region: number, difficulte: string, dieu: string): Promise<Evaluation[]> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, {
      workerData: { region, difficulte, dieu, graines: [...GRAINES_TEST], grainesEntrainement: [...GRAINES_ENTRAINEMENT] },
      execArgv: ['--import', CROCHET],
    });
    fil.once('message', (evaluations: Evaluation[]) => {
      resolve(evaluations);
    });
    fil.once('error', reject);
    fil.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Fil de ${dieu} (région ${String(region)}, ${difficulte}) arrêté avec le code ${String(code)}`));
    });
  });
}

/**
 * Évalue les 10 niveaux d'une région dans une difficulté (ou un défi : `heroique`, `fer`) pour les trois dieux, sur les graines
 * de test. Les dieux sont calculés en parallèle.
 */
export async function evaluerRegion(region: number, difficulte: string): Promise<Evaluation[]> {
  return (await Promise.all(DIEUX_EVALUES.map((dieu) => evaluerDieu(region, difficulte, dieu)))).flat();
}

/** Les évaluations de chaque région évaluée (indice 0 = région 1), toutes calculées en parallèle. */
export async function evaluerRegions(difficulte: string): Promise<Evaluation[][]> {
  return Promise.all(REGIONS_EVALUEES.map((region) => evaluerRegion(region, difficulte)));
}

/** Marge de temps pour une évaluation complète (les parties se jouent en quelques secondes ; le test s'arrête avant). */
export const DELAI_EVALUATION = 300_000;
