// `npm run balance` : rejoue les 100 niveaux des régions 1 à 10 dans les trois difficultés et les deux défis avec chacun des trois
// dieux (son avatar, sans amélioration ni objet) et les bots (naïf, soigneux, sans défense ; le soigneux seul pour les défis) sur
// toutes les graines d'évaluation, plus, pour la région 1, les vérifications supplémentaires (disciples, arbre au maximum, héros
// de niveau 10, soigneux sans tour divine). Écrit balance-report.md à la racine et affiche les écarts aux bandes cibles. Code de
// sortie 1 si une bande imposée d'une région (1 à 10) ou de l'infini n'est pas respectée.
// Les tâches (niveau, difficulté, dieu ou profil) se calculent dans un petit nombre de fils qui restent en vie et les prennent
// une à une ; le résultat ne dépend pas de leur ordre d'arrivée (les évaluations sont remises dans l'ordre avant la rédaction).
//
// Mise au point : `npm run balance -- --dieux=plume,pollen --difficultes=matou --graines=5 --entrainement=1 --detail`
// (`--entrainement=1` reproduit les tests des bandes) ne joue que les bandes demandées, affiche un résumé compact (`--detail` : niveau par niveau, avec sorts lancés et tour divine) et
// n'écrit pas le rapport. `--difficultes=heroique,fer` joue les défis. `--niveaux=11-20` (ou `--niveaux=3,12,40-42`) limite les
// niveaux joués ; sans lui, la mise au point porte sur la région 1.
import { writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { correlationDeRang, courbeDifficulte, ecartsImposes, nomDuDieu, verifierBandes } from '../../src/equilibrage/bandes.ts';
import {
  DEFIS_EVALUES,
  DIEUX_EVALUES,
  DIFFICULTES_EVALUEES,
  estDefi,
  GRAINES_ENTRAINEMENT,
  GRAINES_EVALUATION,
  synthetiser,
  trouver,
  type Evaluation,
  type EvaluationProfil,
} from '../../src/equilibrage/campagne.ts';
import { profilProgression, profilsDisciples, profilSansTourDivine } from '../../src/equilibrage/profils.ts';
import { CARTES_INFINI_AUTRES, CARTES_INFINI_REGION1, ecartsInfini, mediane, redigerInfini, type MesureInfini } from '../../src/equilibrage/infini.ts';
import { redigerRapport } from '../../src/equilibrage/rapport.ts';
import { ecartsDeLaRegion, evaluationsDeRegion, redigerDefis, redigerRegions } from '../../src/equilibrage/rapport-regions.ts';
import type { TacheBandes, TacheInfini, TacheProfil } from './travailleur.ts';

const SORTIE = fileURLToPath(new URL('../../balance-report.md', import.meta.url));
const TRAVAILLEUR = new URL('./travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../niveaux/enregistrer.ts', import.meta.url))).href;

type Tache = TacheBandes | TacheProfil | TacheInfini;

const options = new Map<string, string>();
for (const argument of process.argv.slice(2)) {
  const [cle, valeur] = argument.replace(/^--/, '').split('=');
  options.set(cle ?? '', valeur ?? '');
}
const liste = (cle: string, tout: readonly string[]): readonly string[] => (options.has(cle) ? (options.get(cle) ?? '').split(',') : tout);
const dieuxVoulus = liste('dieux', DIEUX_EVALUES);
const difficultesVoulues = liste('difficultes', [...DIFFICULTES_EVALUEES, ...DEFIS_EVALUES]);
const graines = Number(options.get('graines') ?? GRAINES_EVALUATION.length);
const entrainement = Number(options.get('entrainement') ?? GRAINES_ENTRAINEMENT.length);
const profilsVoulus = (options.get('profils') ?? '').split(',').filter((x) => x !== '');
const miseAuPoint = ['dieux', 'difficultes', 'graines', 'entrainement', 'profils', 'niveaux', 'infini'].some((cle) => options.has(cle));
/** `11-20` ou `3,12,40-42` : la liste des numéros de campagne voulus. */
function lireNiveaux(texte: string): number[] {
  return texte.split(',').flatMap((morceau) => {
    const [debut, fin] = morceau.split('-').map(Number);
    return Array.from({ length: (fin ?? debut ?? 0) - (debut ?? 0) + 1 }, (_, i) => (debut ?? 0) + i);
  });
}
const NIVEAUX_REGION1 = CAMPAGNE.slice(0, 10).map((n) => n.numero);
const numeros = options.has('infini') && !options.has('niveaux')
  ? []
  : options.has('niveaux')
  ? lireNiveaux(options.get('niveaux') ?? '').filter((n) => CAMPAGNE.some((c) => c.numero === n))
  : miseAuPoint
    ? NIVEAUX_REGION1
    : CAMPAGNE.map((n) => n.numero);
// En mise au point, les défis ne se jouent que sur demande (`--difficultes=heroique,fer`).
const difficultesJouees = miseAuPoint && !options.has('difficultes') ? difficultesVoulues.filter((d) => !estDefi(d)) : difficultesVoulues;

const debut = performance.now();
const taches: Tache[] = numeros.flatMap((numero) =>
  difficultesJouees.flatMap((difficulte) => dieuxVoulus.map((dieu): Tache => ({ type: 'bandes', numero, difficulte, dieu, graines, entrainement }))),
);
// Vérifications supplémentaires : toutes dans le rapport complet, au choix (`--profils=disciples,progression,divine`) en mise au point.
const complet = !miseAuPoint;
const deuxBots = ['naif', 'soigneux'] as const;
// Les vérifications supplémentaires ne portent que sur la région 1.
for (const numero of numeros.filter((n) => NIVEAUX_REGION1.includes(n))) {
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

// Mode infini : tout dans le rapport complet ; en mise au point seulement sur demande (`--infini` ou `--infini=chaumes,gue`, avec
// `--dieux=` et `--graines=`), sans les bandes de la campagne (`--difficultes=` vide ne joue rien d'autre : `--niveaux=0`).
const cartesInfini = [...CARTES_INFINI_REGION1, ...CARTES_INFINI_AUTRES];
if (!miseAuPoint || options.has('infini')) {
  const voulues = options.get('infini') ? (options.get('infini') ?? '').split(',') : cartesInfini.map((c) => c.id);
  for (const carte of cartesInfini.filter((c) => voulues.includes(c.id))) {
    for (const dieu of dieuxVoulus) for (const bot of deuxBots) taches.push({ type: 'infini', bot, dieu, carte, graines });
  }
}

const resultats = new Map<number, (Evaluation | EvaluationProfil | MesureInfini)[]>();
let suivante = 0;
let terminees = 0;

/** Un fil qui reste en vie et prend les tâches une à une : démarrer un fil et charger le jeu coûte autant qu'une évaluation. */
function boucle(): Promise<void> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, { execArgv: ['--import', CROCHET] });
    let courante = -1;
    const donner = (): void => {
      const i = suivante++;
      if (i >= taches.length) {
        void fil.terminate().then(() => {
          resolve();
        });
        return;
      }
      courante = i;
      fil.postMessage(taches[i]);
    };
    fil.on('message', (evaluations: (Evaluation | EvaluationProfil | MesureInfini)[]) => {
      resultats.set(courante, evaluations);
      terminees++;
      process.stdout.write(`\r${String(terminees)}/${String(taches.length)} tâches calculées`);
      donner();
    });
    fil.once('error', reject);
    donner();
  });
}

await Promise.all(Array.from({ length: Math.min(availableParallelism(), taches.length) }, boucle));
process.stdout.write('\r' + ' '.repeat(50) + '\r');

const evaluations: Evaluation[] = [];
const profils: EvaluationProfil[] = [];
const mesuresInfini: MesureInfini[] = [];
taches.forEach((tache, i) => {
  for (const e of resultats.get(i) ?? []) {
    if (tache.type === 'bandes') evaluations.push(e as Evaluation);
    else if (tache.type === 'infini') mesuresInfini.push(e as MesureInfini);
    else profils.push(e as EvaluationProfil);
  }
});

/** Les écarts aux bandes de toutes les régions évaluées (1 à 10), ceux de la région 1 avec la puissance des tours. */
function ecartsDeTout(): string[] {
  const regions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((r) => evaluationsDeRegion(evaluations, r).length > 0);
  return [
    ...regions.flatMap((r) => (r === 1 ? verifierBandes(evaluationsDeRegion(evaluations, 1)) : ecartsDeLaRegion(evaluations, r))),
    ...ecartsInfini(mesuresInfini),
  ];
}

if (miseAuPoint) {
  const un = (x: number): string => (Math.round(x * 10) / 10).toFixed(1);
  const pct = (x: number): string => String(Math.round(x * 100)).padStart(3);
  for (const difficulte of difficultesJouees) {
    for (const dieu of dieuxVoulus) {
      const parBot = (bot: 'naif' | 'soigneux'): ReturnType<typeof synthetiser> =>
        synthetiser(evaluations.filter((e) => e.dieu === dieu && e.difficulte === difficulte && e.bot === bot).flatMap((e) => [...e.parties]));
      const s = parBot('soigneux');
      const n = parBot('naif');
      const naif = estDefi(difficulte) ? '' : ` | naïf ${pct(n.tauxVictoire)} % vies ${un(n.viesMoyennes).padStart(4)}`;
      console.log(`${difficulte.padEnd(10)} ${nomDuDieu(dieu).padEnd(8)} soigneux ${pct(s.tauxVictoire)} % vies ${un(s.viesMoyennes).padStart(4)}${naif}`);
      if (difficulte === 'matou') {
        const courbe = courbeDifficulte(evaluations, 'matou', dieu);
        console.log(`   courbe du naïf (vies par niveau) : ${courbe.map((c) => un(c.vies)).join(' ')} | rho ${un(correlationDeRang(courbe))}`);
      }
      if (!options.has('detail')) continue;
      for (const niveau of numeros) {
        const es = trouver(evaluations, niveau, difficulte, 'soigneux', dieu);
        const en = trouver(evaluations, niveau, difficulte, 'naif', dieu);
        if (!es || (!en && !estDefi(difficulte))) continue;
        const ss = synthetiser(es.parties);
        const sn = en ? synthetiser(en.parties) : undefined;
        const sorts = [0, 1].map((k) => es.parties.reduce((a, p) => a + (p.sorts[k] ?? 0), 0) / es.parties.length);
        const divine = es.parties.filter((p) => p.tourDivine).length;
        const naifNiveau = sn ? ` | naïf ${pct(sn.tauxVictoire)} % vies ${un(sn.viesMoyennes).padStart(4)}` : '';
        console.log(
          `   niv ${String(niveau).padStart(2)} soig ${pct(ss.tauxVictoire)} % vies ${un(ss.viesMoyennes).padStart(4)} aretes ${String(Math.round(ss.aretesFinMoyennes)).padStart(4)} ` +
            `sorts ${un(sorts[0] ?? 0)}/${un(sorts[1] ?? 0)} divine ${String(divine)}/${String(es.parties.length)}${naifNiveau}`,
        );
      }
    }
  }
  // Défis : part de réussites du soigneux par région et par défi (bande 40 à 90 %), trois dieux ensemble.
  for (const defi of difficultesJouees.filter(estDefi)) {
    const parRegion = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((r) => {
      const deLaRegion = evaluationsDeRegion(evaluations, r).filter((e) => e.difficulte === defi && e.bot === 'soigneux');
      return deLaRegion.length === 0 ? [] : [`R${String(r)} ${pct(synthetiser(deLaRegion.flatMap((e) => [...e.parties])).tauxVictoire)} %`];
    });
    if (parRegion.length > 0) console.log(`défi ${defi} par région : ${parRegion.join(' | ')}`);
  }
  // Écarts aux bandes : tous si l'on a joué tous les dieux et toutes les difficultés, sinon seulement ceux des dieux joués.
  if (!options.has('difficultes')) {
    const complets = dieuxVoulus.length === DIEUX_EVALUES.length;
    const ecarts = ecartsDeTout().filter((e) => complets || dieuxVoulus.some((d) => e.includes(`(${nomDuDieu(d)})`)));
    console.log(ecarts.length === 0 ? 'Toutes les bandes sont respectées.' : [`${String(ecarts.length)} écart(s) aux bandes :`, ...ecarts.map((e) => `- ${e}`)].join('\n'));
  }
  for (const m of mesuresInfini) console.log(`infini ${m.bot.padEnd(8)} ${m.dieu.padEnd(8)} ${m.carte.id.padEnd(10)} médiane ${String(mediane(m.vagues)).padStart(3)} : ${m.vagues.join(' ')}`);
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
  // Rapport principal : région 1, comme avant ; puis les régions 2 à 10 et les défis des dix régions.
  const region1 = evaluationsDeRegion(evaluations, 1);
  writeFileSync(
    SORTIE,
    `${redigerRapport(region1, graines, profils).trimEnd()}

${redigerRegions(evaluations, [2, 3, 4, 5, 6, 7, 8, 9, 10]).trimEnd()}

${redigerDefis(evaluations, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).trimEnd()}

${redigerInfini(mesuresInfini).trimEnd()}
`,
  );
  const ecarts = ecartsDeTout();
  const imposes = ecartsImposes(ecarts);
  console.log(`balance-report.md écrit en ${String(Math.round((performance.now() - debut) / 100) / 10)} s.`);
  if (ecarts.length === 0) {
    console.log('Toutes les bandes des régions 1 à 10 et des défis sont respectées.');
  } else {
    const suspendus = ecarts.filter((e) => !imposes.includes(e));
    console.log(`${String(imposes.length)} écart(s) aux bandes imposées${imposes.length === 0 ? '' : ' :'}`);
    for (const e of imposes) console.log(`- ${e}`);
    if (suspendus.length > 0) {
      console.log(`${String(suspendus.length)} écart(s) aux bandes suspendues (Matou, Vieux Sage : voir bandes.ts, ils ne bloquent pas) :`);
      for (const e of suspendus) console.log(`- ${e}`);
    }
    if (imposes.length > 0) process.exitCode = 1;
  }
}
