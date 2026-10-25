// `npm run balance` : rejoue les 10 niveaux de la région 1 dans les trois difficultés avec les bots (naïf,
// soigneux, sans défense) sur toutes les graines d'évaluation, écrit balance-report.md à la racine et affiche
// les écarts aux bandes cibles. Code de sortie 1 si une bande n'est pas respectée.
// Chaque couple (niveau, difficulté) se calcule dans un fil à part ; le résultat ne dépend pas de leur ordre
// d'arrivée (les évaluations sont remises dans l'ordre avant la rédaction).
import { writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import { verifierBandes } from '../../src/equilibrage/bandes.ts';
import { DIFFICULTES_EVALUEES, GRAINES_EVALUATION, type Evaluation } from '../../src/equilibrage/campagne.ts';
import { redigerRapport } from '../../src/equilibrage/rapport.ts';

const SORTIE = fileURLToPath(new URL('../../balance-report.md', import.meta.url));
const TRAVAILLEUR = new URL('./travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../niveaux/enregistrer.ts', import.meta.url))).href;

interface Tache {
  readonly numero: number;
  readonly difficulte: string;
}

function calculer(tache: Tache): Promise<Evaluation[]> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, { workerData: tache, execArgv: ['--import', CROCHET] });
    fil.once('message', (evaluations: Evaluation[]) => {
      resolve(evaluations);
    });
    fil.once('error', reject);
    fil.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Fil du niveau ${String(tache.numero)} (${tache.difficulte}) arrêté avec le code ${String(code)}`));
    });
  });
}

const debut = performance.now();
const taches: Tache[] = REGION1.flatMap((n) => DIFFICULTES_EVALUEES.map((difficulte) => ({ numero: n.numero, difficulte })));
const resultats = new Map<number, Evaluation[]>();
let prochaine = 0;
let terminees = 0;

async function boucle(): Promise<void> {
  for (let i = prochaine++; i < taches.length; i = prochaine++) {
    const tache = taches[i];
    if (!tache) return;
    resultats.set(i, await calculer(tache));
    terminees++;
    process.stdout.write(`\r${String(terminees)}/${String(taches.length)} niveaux × difficultés calculés`);
  }
}

await Promise.all(Array.from({ length: Math.min(availableParallelism(), taches.length) }, boucle));
process.stdout.write('\r' + ' '.repeat(50) + '\r');

const evaluations = taches.flatMap((_, i) => resultats.get(i) ?? []);
writeFileSync(SORTIE, redigerRapport(evaluations, GRAINES_EVALUATION.length));
const ecarts = verifierBandes(evaluations);
console.log(`balance-report.md écrit en ${String(Math.round((performance.now() - debut) / 100) / 10)} s.`);
if (ecarts.length === 0) {
  console.log('Toutes les bandes sont respectées.');
} else {
  console.log(`${String(ecarts.length)} écart(s) aux bandes :`);
  for (const e of ecarts) console.log(`- ${e}`);
  process.exitCode = 1;
}
