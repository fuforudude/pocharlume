// `npm run balance` : rejoue les 10 niveaux de la région 1 dans les trois difficultés avec chacun des trois dieux
// (son avatar, sans amélioration ni objet) et les bots (naïf, soigneux, sans défense) sur toutes les graines
// d'évaluation, écrit balance-report.md à la racine et affiche les écarts aux bandes cibles. Code de sortie 1 si
// une bande n'est pas respectée.
// Chaque triplet (niveau, difficulté, dieu) se calcule dans un fil à part ; le résultat ne dépend pas de leur ordre
// d'arrivée (les évaluations sont remises dans l'ordre avant la rédaction).
import { writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import { nomDuDieu, verifierBandes } from '../../src/equilibrage/bandes.ts';
import { DIEUX_EVALUES, DIFFICULTES_EVALUEES, GRAINES_EVALUATION, synthetiser, trouver, type Evaluation } from '../../src/equilibrage/campagne.ts';
import { redigerRapport } from '../../src/equilibrage/rapport.ts';

const SORTIE = fileURLToPath(new URL('../../balance-report.md', import.meta.url));
const TRAVAILLEUR = new URL('./travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../niveaux/enregistrer.ts', import.meta.url))).href;

interface Tache {
  readonly numero: number;
  readonly difficulte: string;
  readonly dieu: string;
  readonly graines: number;
}

// Options de mise au point : `--dieux=plume,pollen --difficultes=matou --graines=5 --detail`. Avec l'une des trois
// premières, on n'écrit pas le rapport : on affiche seulement un résumé compact de ce qui a été calculé.
const options = new Map(process.argv.slice(2).map((a) => { const [cle, valeur] = a.replace(/^--/, '').split('='); return [cle ?? '', valeur ?? ''] as const; }));
const filtre = (cle: string, tout: readonly string[]): readonly string[] => (options.has(cle) ? (options.get(cle) ?? '').split(',') : tout);
const dieuxVoulus = filtre('dieux', DIEUX_EVALUES);
const difficultesVoulues = filtre('difficultes', DIFFICULTES_EVALUEES);
const nombreDeGraines = Number(options.get('graines') ?? GRAINES_EVALUATION.length);
const miseAuPoint = options.has('dieux') || options.has('difficultes') || options.has('graines');

function calculer(tache: Tache): Promise<Evaluation[]> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, { workerData: tache, execArgv: ['--import', CROCHET] });
    fil.once('message', (evaluations: Evaluation[]) => {
      resolve(evaluations);
    });
    fil.once('error', reject);
    fil.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Fil du niveau ${String(tache.numero)} (${tache.difficulte}, ${tache.dieu}) arrêté avec le code ${String(code)}`));
    });
  });
}

const debut = performance.now();
const taches: Tache[] = REGION1.flatMap((n) =>
  difficultesVoulues.flatMap((difficulte) => dieuxVoulus.map((dieu) => ({ numero: n.numero, difficulte, dieu, graines: nombreDeGraines }))),
);
const resultats = new Map<number, Evaluation[]>();
let prochaine = 0;
let terminees = 0;

async function boucle(): Promise<void> {
  for (let i = prochaine++; i < taches.length; i = prochaine++) {
    const tache = taches[i];
    if (!tache) return;
    resultats.set(i, await calculer(tache));
    terminees++;
    process.stdout.write(`\r${String(terminees)}/${String(taches.length)} niveaux × difficultés × dieux calculés`);
  }
}

await Promise.all(Array.from({ length: Math.min(availableParallelism(), taches.length) }, boucle));
process.stdout.write('\r' + ' '.repeat(50) + '\r');

const evaluations = taches.flatMap((_, i) => resultats.get(i) ?? []);

if (miseAuPoint) {
  const un = (x: number): string => (Math.round(x * 10) / 10).toFixed(1);
  for (const difficulte of difficultesVoulues) {
    for (const dieu of dieuxVoulus) {
      const parBot = (bot: 'naif' | 'soigneux'): ReturnType<typeof synthetiser> =>
        synthetiser(evaluations.filter((e) => e.dieu === dieu && e.difficulte === difficulte && e.bot === bot).flatMap((e) => [...e.parties]));
      const s = parBot('soigneux');
      const n = parBot('naif');
      console.log(
        `${difficulte.padEnd(10)} ${nomDuDieu(dieu).padEnd(8)} soigneux ${String(Math.round(s.tauxVictoire * 100)).padStart(3)} % vies ${un(s.viesMoyennes).padStart(4)} | naïf ${String(Math.round(n.tauxVictoire * 100)).padStart(3)} % vies ${un(n.viesMoyennes).padStart(4)}`,
      );
      if (options.has('detail')) {
        for (const niveau of REGION1.map((c) => c.numero)) {
          const es = trouver(evaluations, niveau, difficulte, 'soigneux', dieu);
          const en = trouver(evaluations, niveau, difficulte, 'naif', dieu);
          if (!es || !en) continue;
          const ss = synthetiser(es.parties);
          const sn = synthetiser(en.parties);
          const sorts = [0, 1].map((k) => es.parties.reduce((a, p) => a + (p.sorts[k] ?? 0), 0) / es.parties.length);
          const divine = es.parties.filter((p) => p.tourDivine).length;
          console.log(
            `   niv ${String(niveau).padStart(2)} soig ${String(Math.round(ss.tauxVictoire * 100)).padStart(3)} % vies ${un(ss.viesMoyennes).padStart(4)} aretes ${String(Math.round(ss.aretesFinMoyennes)).padStart(4)} sorts ${un(sorts[0] ?? 0)}/${un(sorts[1] ?? 0)} divine ${String(divine)}/${String(es.parties.length)} | naïf ${String(Math.round(sn.tauxVictoire * 100)).padStart(3)} % vies ${un(sn.viesMoyennes).padStart(4)}`,
          );
        }
      }
    }
  }
  console.log(`${String(Math.round((performance.now() - debut) / 100) / 10)} s.`);
  process.exit(0);
}

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
