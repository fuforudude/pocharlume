// Fil de calcul des tests des bandes (voir bandes.test-utils.ts) : évalue les 10 niveaux d'une région dans une difficulté (ou un
// défi) pour un dieu, dans l'histoire ou le DLC (`campagne`). Chargé par Node seul (avec le crochet de tools/niveaux/enregistrer.ts), comme les fils de `npm run balance`.
import { parentPort, workerData } from 'node:worker_threads';
import { REGIONS } from '../data/niveaux/campagne';
import { REGIONS_MODERNE } from '../data/niveaux/campagne-moderne';
import { evaluerCampagne, type IdBot } from './campagne';

const { campagne, region, difficulte, dieu, graines, grainesEntrainement, bots } = workerData as {
  campagne: 'histoire' | 'moderne';
  region: number;
  difficulte: string;
  dieu: string;
  graines: number[];
  grainesEntrainement: number[];
  bots: IdBot[] | undefined;
};
const niveaux = (campagne === 'moderne' ? REGIONS_MODERNE : REGIONS)[region - 1];
if (!niveaux) throw new Error(`Région ${String(region)} inconnue (campagne ${campagne})`);
parentPort?.postMessage(evaluerCampagne({ niveaux, difficultes: [difficulte], dieux: [dieu], graines, grainesEntrainement, ...(bots ? { bots } : {}) }));
