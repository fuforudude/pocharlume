// Fil de calcul de `npm run balance` : évalue un niveau dans une difficulté avec un dieu et renvoie les évaluations
// au fil principal (tools/balance/index.ts).
import { parentPort, workerData } from 'node:worker_threads';
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import { evaluerCampagne, GRAINES_EVALUATION } from '../../src/equilibrage/campagne.ts';

const { numero, difficulte, dieu, graines } = workerData as { numero: number; difficulte: string; dieu: string; graines: number };
const campagne = REGION1.find((n) => n.numero === numero);
if (!campagne) throw new Error(`Niveau ${String(numero)} introuvable`);
parentPort?.postMessage(evaluerCampagne({ niveaux: [campagne], difficultes: [difficulte], dieux: [dieu], graines: graines <= GRAINES_EVALUATION.length ? GRAINES_EVALUATION.slice(0, graines) : Array.from({ length: graines }, (_, i) => 101 + i) }));
