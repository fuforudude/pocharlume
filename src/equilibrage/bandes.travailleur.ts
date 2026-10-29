// Fil de calcul des tests des bandes (voir bandes.test-utils.ts) : évalue les 10 niveaux d'une région dans une difficulté (ou un
// défi) pour un dieu. Chargé par Node seul (avec le crochet de tools/niveaux/enregistrer.ts), comme les fils de `npm run balance`.
import { parentPort, workerData } from 'node:worker_threads';
import { REGIONS } from '../data/niveaux/campagne';
import { evaluerCampagne, type IdBot } from './campagne';

const { region, difficulte, dieu, graines, grainesEntrainement, bots } = workerData as {
  region: number;
  difficulte: string;
  dieu: string;
  graines: number[];
  grainesEntrainement: number[];
  bots: IdBot[] | undefined;
};
const niveaux = REGIONS[region - 1];
if (!niveaux) throw new Error(`Région ${String(region)} inconnue`);
parentPort?.postMessage(evaluerCampagne({ niveaux, difficultes: [difficulte], dieux: [dieu], graines, grainesEntrainement, ...(bots ? { bots } : {}) }));
