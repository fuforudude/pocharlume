// Évaluation des régions partagée par les tests des bandes (un fichier de test par difficulté, plus un pour les défis, pour que
// Vitest les joue en parallèle). Suffixe .test-utils.ts : jamais importé par le jeu.
// Chaque région, difficulté et dieu se calcule dans un fil à part (comme `npm run balance`) : le résultat ne dépend pas de l'ordre
// d'arrivée, et le temps d'un fichier est celui d'un seul fil.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { DIEUX_EVALUES, GRAINES_ENTRAINEMENT, GRAINES_EVALUATION, type Evaluation, type IdBot } from './campagne';
import { lireCampagne, regionsDe, type CampagneEvaluee } from './rapport-regions';

/**
 * Graines des tests : les dix de `npm run balance`, avec ses deux graines d'entraînement (mêmes résultats que le rapport).
 * Le coût est tenu par le parallélisme : un fil par région, dieu et difficulté.
 */
export const GRAINES_TEST = GRAINES_EVALUATION;

/**
 * La campagne que testent les bandes : l'histoire par défaut, ou le DLC avec `BANDES_CAMPAGNE=moderne` (ses trois régions, numéros 1
 * à 30 dans sa campagne, mêmes bandes). Le DLC reste hors de la suite par défaut (`npm run test` ne joue que l'histoire) : ses bandes
 * se jouent à la demande, `BANDES_CAMPAGNE=moderne BANDES_REGIONS=2 npx vitest run src/equilibrage/bandes-chaton.test.ts …`.
 */
export const CAMPAGNE_DES_BANDES: CampagneEvaluee = lireCampagne(process.env['BANDES_CAMPAGNE']);

/**
 * Les régions que testent les bandes : toutes celles de la campagne testée (`regionsDe`), ou celles de `BANDES_REGIONS` (ex. `3`
 * ou `1,2`). La CI de déploiement s'en sert pour jouer une région par machine : sur 2 cœurs, toutes d'un coup dépassent le quart
 * d'heure. Une valeur invalide est refusée plutôt que de laisser passer des tests qui n'évaluent rien.
 */
export const REGIONS_DES_BANDES: readonly number[] = lireRegions(process.env['BANDES_REGIONS'], CAMPAGNE_DES_BANDES);

export function lireRegions(valeur: string | undefined, campagne: CampagneEvaluee = 'histoire'): readonly number[] {
  const toutes = regionsDe(campagne);
  if (valeur === undefined || valeur.trim() === '') return toutes;
  const regions = valeur.split(',').map((morceau) => Number(morceau.trim()));
  if (regions.some((r) => !toutes.includes(r))) {
    const derniere = String(toutes[toutes.length - 1] ?? 1);
    throw new Error(`BANDES_REGIONS invalide : « ${valeur} » (attendu : numéros de région de 1 à ${derniere}, séparés par des virgules)`);
  }
  return [...new Set(regions)];
}

const TRAVAILLEUR = new URL('./bandes.travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../../tools/niveaux/enregistrer.ts', import.meta.url))).href;

function evaluerDieu(region: number, difficulte: string, dieu: string, bots?: readonly IdBot[]): Promise<Evaluation[]> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, {
      workerData: { campagne: CAMPAGNE_DES_BANDES, region, difficulte, dieu, graines: [...GRAINES_TEST], grainesEntrainement: [...GRAINES_ENTRAINEMENT], bots: bots ? [...bots] : undefined },
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
 * Évalue les 10 niveaux d'une région (de la campagne testée) dans une difficulté (ou un défi : `heroique`, `fer`) pour les trois dieux, sur les graines
 * de test. Les dieux sont calculés en parallèle.
 */
export async function evaluerRegion(region: number, difficulte: string, bots?: readonly IdBot[]): Promise<Evaluation[]> {
  return (await Promise.all(DIEUX_EVALUES.map((dieu) => evaluerDieu(region, difficulte, dieu, bots)))).flat();
}

/** Les évaluations de chaque région évaluée (indice 0 = région 1, vide pour une région non évaluée), calculées en parallèle. */
export async function evaluerRegions(difficulte: string, bots?: readonly IdBot[]): Promise<Evaluation[][]> {
  const parRegion: Evaluation[][] = regionsDe(CAMPAGNE_DES_BANDES).map(() => []);
  await Promise.all(
    REGIONS_DES_BANDES.map(async (region) => {
      parRegion[region - 1] = await evaluerRegion(region, difficulte, bots);
    }),
  );
  return parRegion;
}

/** Marge de temps pour une évaluation complète : environ 3 min 30 sur une machine libre, bien plus quand des simulations tournent à côté. */
export const DELAI_EVALUATION = 900_000;
