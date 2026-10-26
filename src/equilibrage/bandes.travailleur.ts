// Fil de calcul des tests des bandes (voir bandes.test-utils.ts) : évalue la région 1 dans une difficulté pour un dieu.
// Chargé par Node seul (avec le crochet de tools/niveaux/enregistrer.ts), comme les fils de `npm run balance`.
import { parentPort, workerData } from 'node:worker_threads';
import { REGION1 } from '../data/niveaux/region1';
import { evaluerCampagne } from './campagne';

const { difficulte, dieu, graines, grainesEntrainement } = workerData as {
  difficulte: string;
  dieu: string;
  graines: number[];
  grainesEntrainement: number[];
};
parentPort?.postMessage(evaluerCampagne({ niveaux: REGION1, difficultes: [difficulte], dieux: [dieu], graines, grainesEntrainement }));
