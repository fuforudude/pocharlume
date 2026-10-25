// `npm run balance` : rejoue les 10 niveaux de la région 1 dans les trois difficultés avec les bots (naïf,
// soigneux, sans défense) sur toutes les graines d'évaluation, écrit balance-report.md à la racine et affiche
// les écarts aux bandes cibles. Code de sortie 1 si une bande n'est pas respectée.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import { verifierBandes } from '../../src/equilibrage/bandes.ts';
import { evaluerCampagne, GRAINES_EVALUATION } from '../../src/equilibrage/campagne.ts';
import { redigerRapport } from '../../src/equilibrage/rapport.ts';

const SORTIE = fileURLToPath(new URL('../../balance-report.md', import.meta.url));

const debut = performance.now();
const evaluations = evaluerCampagne({
  niveaux: REGION1,
  progression: (niveau, difficulte) => {
    process.stdout.write(`\rniveau ${String(niveau)} (${difficulte})        `);
  },
});
process.stdout.write('\r' + ' '.repeat(40) + '\r');

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
