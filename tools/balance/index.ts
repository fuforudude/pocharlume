// `npm run balance` : rejoue les 10 niveaux de la région 1 dans les trois difficultés avec chacun des trois dieux
// (son avatar, sans amélioration ni objet) et les bots (naïf, soigneux, sans défense) sur toutes les graines
// d'évaluation, plus les vérifications supplémentaires (disciples, arbre au maximum, héros de niveau 10, soigneux sans
// tour divine). Écrit balance-report.md à la racine et affiche les écarts aux bandes cibles. Code de sortie 1 si une
// bande n'est pas respectée.
// Chaque tâche (niveau, difficulté, dieu ou profil) se calcule dans un fil à part ; le résultat ne dépend pas de leur
// ordre d'arrivée (les évaluations sont remises dans l'ordre avant la rédaction).
//
// Mise au point : `npm run balance -- --dieux=plume,pollen --difficultes=matou --graines=5 --entrainement=1 --detail`
// (`--entrainement=1` reproduit les tests des bandes) ne joue que les bandes demandées, affiche un résumé compact (`--detail` : niveau par niveau, avec sorts lancés et tour divine) et
// n'écrit pas le rapport.
import { writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import { correlationDeRang, courbeDifficulte, nomDuDieu, verifierBandes } from '../../src/equilibrage/bandes.ts';
import {
  DIEUX_EVALUES,
  DIFFICULTES_EVALUEES,
  GRAINES_ENTRAINEMENT,
  GRAINES_EVALUATION,
  synthetiser,
  trouver,
  type Evaluation,
  type EvaluationProfil,
} from '../../src/equilibrage/campagne.ts';
import { profilProgression, profilsDisciples, profilSansTourDivine } from '../../src/equilibrage/profils.ts';
import { redigerRapport } from '../../src/equilibrage/rapport.ts';
import type { TacheBandes, TacheProfil } from './travailleur.ts';

const SORTIE = fileURLToPath(new URL('../../balance-report.md', import.meta.url));
const TRAVAILLEUR = new URL('./travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../niveaux/enregistrer.ts', import.meta.url))).href;

type Tache = TacheBandes | TacheProfil;

function calculer(tache: Tache): Promise<(Evaluation | EvaluationProfil)[]> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, { workerData: tache, execArgv: ['--import', CROCHET] });
    fil.once('message', (evaluations: (Evaluation | EvaluationProfil)[]) => {
      resolve(evaluations);
    });
    fil.once('error', reject);
    fil.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Fil du niveau ${String(tache.numero)} (${tache.difficulte}) arrêté avec le code ${String(code)}`));
    });
  });
}

const options = new Map<string, string>();
for (const argument of process.argv.slice(2)) {
  const [cle, valeur] = argument.replace(/^--/, '').split('=');
  options.set(cle ?? '', valeur ?? '');
}
const liste = (cle: string, tout: readonly string[]): readonly string[] => (options.has(cle) ? (options.get(cle) ?? '').split(',') : tout);
const dieuxVoulus = liste('dieux', DIEUX_EVALUES);
const difficultesVoulues = liste('difficultes', DIFFICULTES_EVALUEES);
const graines = Number(options.get('graines') ?? GRAINES_EVALUATION.length);
const entrainement = Number(options.get('entrainement') ?? GRAINES_ENTRAINEMENT.length);
const profilsVoulus = (options.get('profils') ?? '').split(',').filter((x) => x !== '');
const miseAuPoint = ['dieux', 'difficultes', 'graines', 'entrainement', 'profils'].some((cle) => options.has(cle));
const numeros = REGION1.map((n) => n.numero);

const debut = performance.now();
const taches: Tache[] = numeros.flatMap((numero) =>
  difficultesVoulues.flatMap((difficulte) => dieuxVoulus.map((dieu): Tache => ({ type: 'bandes', numero, difficulte, dieu, graines, entrainement }))),
);
// Vérifications supplémentaires : toutes dans le rapport complet, au choix (`--profils=disciples,progression,divine`) en mise au point.
const complet = !miseAuPoint;
const deuxBots = ['naif', 'soigneux'] as const;
for (const numero of numeros) {
  if (complet || profilsVoulus.includes('disciples')) {
    for (const profil of profilsDisciples().filter((p) => complet || dieuxVoulus.includes(p.dieu))) {
      taches.push({ type: 'profil', numero, profil, difficulte: 'matou', graines, bots: deuxBots });
    }
  }
  for (const dieu of DIEUX_EVALUES.filter((d) => complet || dieuxVoulus.includes(d))) {
    if (complet || profilsVoulus.includes('progression')) {
      for (const id of ['arbre', 'heros10', 'tout'] as const) {
        taches.push({ type: 'profil', numero, profil: profilProgression(dieu, id), difficulte: 'vieux_sage', graines, bots: deuxBots });
      }
    }
    if (complet || profilsVoulus.includes('divine')) {
      for (const difficulte of ['matou', 'vieux_sage']) {
        taches.push({ type: 'profil', numero, difficulte, graines, bots: ['soigneux'], profil: profilSansTourDivine(dieu) });
      }
    }
  }
}

const resultats = new Map<number, (Evaluation | EvaluationProfil)[]>();
let prochaine = 0;
let terminees = 0;

async function boucle(): Promise<void> {
  for (let i = prochaine++; i < taches.length; i = prochaine++) {
    const tache = taches[i];
    if (!tache) return;
    resultats.set(i, await calculer(tache));
    terminees++;
    process.stdout.write(`\r${String(terminees)}/${String(taches.length)} tâches calculées`);
  }
}

await Promise.all(Array.from({ length: Math.min(availableParallelism(), taches.length) }, boucle));
process.stdout.write('\r' + ' '.repeat(50) + '\r');

const evaluations: Evaluation[] = [];
const profils: EvaluationProfil[] = [];
taches.forEach((tache, i) => {
  for (const e of resultats.get(i) ?? []) {
    if (tache.type === 'bandes') evaluations.push(e);
    else profils.push(e as EvaluationProfil);
  }
});

if (miseAuPoint) {
  const un = (x: number): string => (Math.round(x * 10) / 10).toFixed(1);
  const pct = (x: number): string => String(Math.round(x * 100)).padStart(3);
  for (const difficulte of difficultesVoulues) {
    for (const dieu of dieuxVoulus) {
      const parBot = (bot: 'naif' | 'soigneux'): ReturnType<typeof synthetiser> =>
        synthetiser(evaluations.filter((e) => e.dieu === dieu && e.difficulte === difficulte && e.bot === bot).flatMap((e) => [...e.parties]));
      const s = parBot('soigneux');
      const n = parBot('naif');
      console.log(
        `${difficulte.padEnd(10)} ${nomDuDieu(dieu).padEnd(8)} soigneux ${pct(s.tauxVictoire)} % vies ${un(s.viesMoyennes).padStart(4)} | naïf ${pct(n.tauxVictoire)} % vies ${un(n.viesMoyennes).padStart(4)}`,
      );
      if (difficulte === 'matou') {
        const courbe = courbeDifficulte(evaluations, 'matou', dieu);
        console.log(`   courbe du naïf (vies par niveau) : ${courbe.map((c) => un(c.vies)).join(' ')} | rho ${un(correlationDeRang(courbe))}`);
      }
      if (!options.has('detail')) continue;
      for (const niveau of numeros) {
        const es = trouver(evaluations, niveau, difficulte, 'soigneux', dieu);
        const en = trouver(evaluations, niveau, difficulte, 'naif', dieu);
        if (!es || !en) continue;
        const ss = synthetiser(es.parties);
        const sn = synthetiser(en.parties);
        const sorts = [0, 1].map((k) => es.parties.reduce((a, p) => a + (p.sorts[k] ?? 0), 0) / es.parties.length);
        const divine = es.parties.filter((p) => p.tourDivine).length;
        console.log(
          `   niv ${String(niveau).padStart(2)} soig ${pct(ss.tauxVictoire)} % vies ${un(ss.viesMoyennes).padStart(4)} aretes ${String(Math.round(ss.aretesFinMoyennes)).padStart(4)} ` +
            `sorts ${un(sorts[0] ?? 0)}/${un(sorts[1] ?? 0)} divine ${String(divine)}/${String(es.parties.length)} | naïf ${pct(sn.tauxVictoire)} % vies ${un(sn.viesMoyennes).padStart(4)}`,
        );
      }
    }
  }
  // Écarts aux bandes : tous si l'on a joué tous les dieux et toutes les difficultés, sinon seulement ceux des dieux joués.
  if (!options.has('difficultes')) {
    const complets = dieuxVoulus.length === DIEUX_EVALUES.length;
    const ecarts = verifierBandes(evaluations).filter((e) => complets || dieuxVoulus.some((d) => e.includes(`(${nomDuDieu(d)})`)));
    console.log(ecarts.length === 0 ? 'Toutes les bandes sont respectées.' : [`${String(ecarts.length)} écart(s) aux bandes :`, ...ecarts.map((e) => `- ${e}`)].join('\n'));
  }
  const groupes = new Map<string, EvaluationProfil[]>();
  for (const e of profils) groupes.set(`${e.profil}|${e.dieu}|${e.difficulte}|${e.bot}`, [...(groupes.get(`${e.profil}|${e.dieu}|${e.difficulte}|${e.bot}`) ?? []), e]);
  for (const [clef, liste] of groupes) {
    const [profil, dieu, difficulte, bot] = clef.split('|');
    const s = synthetiser(liste.flatMap((e) => [...e.parties]));
    const avatar = synthetiser(evaluations.filter((e) => e.dieu === dieu && e.difficulte === difficulte && e.bot === bot).flatMap((e) => [...e.parties]));
    const ecartAvatar = evaluations.length > 0 ? ` (écart à l'avatar ${un(s.viesMoyennes - avatar.viesMoyennes)})` : '';
    console.log(`profil ${(profil ?? '').padEnd(10)} ${nomDuDieu(dieu ?? '').padEnd(8)} ${(difficulte ?? '').padEnd(10)} ${(bot ?? '').padEnd(8)} victoires ${pct(s.tauxVictoire)} % vies ${un(s.viesMoyennes).padStart(4)}${ecartAvatar}`);
  }
  console.log(`${String(Math.round((performance.now() - debut) / 100) / 10)} s.`);
} else {
  writeFileSync(SORTIE, redigerRapport(evaluations, graines, profils));
  const ecarts = verifierBandes(evaluations);
  console.log(`balance-report.md écrit en ${String(Math.round((performance.now() - debut) / 100) / 10)} s.`);
  if (ecarts.length === 0) {
    console.log('Toutes les bandes sont respectées.');
  } else {
    console.log(`${String(ecarts.length)} écart(s) aux bandes :`);
    for (const e of ecarts) console.log(`- ${e}`);
    process.exitCode = 1;
  }
}
