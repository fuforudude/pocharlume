// Fil de calcul du test des bandes de l'infini (voir bandes-infini.test.ts) : une mesure (bot, dieu, carte) sur les graines données.
import { parentPort, workerData } from 'node:worker_threads';
import { mesurerInfini, type CarteInfini } from './infini';

const { bot, dieu, carte, graines } = workerData as { bot: 'naif' | 'soigneux'; dieu: string; carte: CarteInfini; graines: number[] };
parentPort?.postMessage(mesurerInfini(bot, dieu, carte, graines));
