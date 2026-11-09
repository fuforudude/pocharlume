// `npm run ci:attendre` : attend la fin du dernier run de .github/workflows/tests.yml pour la branche courante,
// affiche le résultat de chaque job et télécharge les artefacts dans ci-artefacts/<numéro du run>/ (ignoré par git).
// Code de sortie 0 si tous les jobs ont réussi (ou ont été sautés), 1 sinon. S'arrête de lui-même (code 2) si aucune
// machine ne prend les jobs pendant 15 min (runner du VPS hors ligne) ou après 6 h d'attente : voir attente.ts.
// Prérequis : l'outil `gh`, installé et connecté par l'auteur (voir infra/vps/README.md).
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { setTimeout as attendre } from 'node:timers/promises';
import { commencerSuivi, messageSansMachine, suivre, ATTENTE_TOTALE_MAX_MS } from './attente.ts';
import { lireEtatRun, lireRun, resumerJobs, type Run } from './resultats.ts';

const WORKFLOW = 'tests.yml';
const DOSSIER = 'ci-artefacts';

function lancer(commande: string, args: readonly string[], afficher = false): SpawnSyncReturns<string> {
  return spawnSync(commande, args, { encoding: 'utf8', stdio: afficher ? 'inherit' : 'pipe', shell: false });
}

function arreter(message: string): never {
  console.error(message);
  process.exit(1);
}

/** Fin de l'attente sans résultat (pas un échec des tests) : code 2. */
function arreterAttente(message: string): never {
  console.error(`
${message}`);
  process.exit(2);
}

const version = lancer('gh', ['--version']);
if (version.error) {
  arreter(
    [
      'L’outil gh (GitHub CLI) est introuvable.',
      'Installation : `winget install --id GitHub.cli` (Windows), `sudo apt install gh` (Ubuntu) ou https://cli.github.com,',
      'puis `gh auth login` (GitHub.com, HTTPS, connexion par le navigateur).',
    ].join('\n'),
  );
}
if (lancer('gh', ['auth', 'status']).status !== 0) {
  arreter('gh n’est pas connecté à GitHub : lancer `gh auth login` (GitHub.com, HTTPS, connexion par le navigateur).');
}

const branche = lancer('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
const tete = lancer('git', ['rev-parse', 'HEAD']).stdout.trim();
if (branche === '' || branche === 'HEAD') arreter('Pas de branche courante (HEAD détachée ?) : se placer sur la branche poussée.');
if (branche === 'main') arreter('Sur main, c’est deploiement.yml qui tourne, pas tests.yml : `gh run list --workflow deploiement.yml`.');

function dernierRun(): Run | null {
  const liste = lancer('gh', ['run', 'list', '--workflow', WORKFLOW, '--branch', branche, '--limit', '1', '--json', 'databaseId,headSha,status,conclusion,url']);
  return liste.status === 0 ? lireRun(liste.stdout) : null;
}

// GitHub met quelques secondes à créer le run après un push : on attend celui du commit local, une minute au plus.
let run = dernierRun();
for (let essai = 0; essai < 12 && run?.sha !== tete; essai++) {
  if (essai === 0) console.log(`En attente du run de ${tete.slice(0, 7)} sur ${branche}…`);
  await attendre(5000);
  run = dernierRun();
}
if (run === null) arreter(`Aucun run de ${WORKFLOW} pour la branche ${branche}. La branche est-elle poussée (\`git push -u origin ${branche}\`) ?`);
if (run.sha !== tete) console.log(`Attention : le dernier run porte sur ${run.sha.slice(0, 7)}, pas sur le commit local ${tete.slice(0, 7)} (pas encore poussé ?).`);

console.log(`Run ${String(run.id)} : ${run.url}`);
// Attente par interrogations successives (pas `gh run watch`, qui attendrait jusqu'à 24 h un job sans machine).
const id = run.id;
let suivi = commencerSuivi(Date.now());
let dernier = '';
for (;;) {
  const vueEtat = lancer('gh', ['run', 'view', String(id), '--json', 'status,jobs']);
  const etat = vueEtat.status === 0 ? lireEtatRun(vueEtat.stdout) : null;
  if (etat !== null) {
    const pas = suivre(suivi, etat, Date.now());
    suivi = pas.suivi;
    if (pas.decision === 'termine') break;
    if (pas.decision === 'sans-machine') arreterAttente(messageSansMachine(branche, id));
    if (pas.decision === 'trop-long') arreterAttente(`Attente arrêtée après ${String(ATTENTE_TOTALE_MAX_MS / 3_600_000)} h : le run ${String(id)} n’est pas terminé (${run.url}).`);
    const ligne = etat.jobs.map((job) => `${job.nom} : ${job.statut}`).join(' | ') || etat.statut;
    if (ligne !== dernier) console.log(`[${new Date().toLocaleTimeString('fr-FR')}] ${ligne}`);
    dernier = ligne;
  } else if (Date.now() - suivi.debut >= ATTENTE_TOTALE_MAX_MS) {
    arreterAttente(`Attente arrêtée : impossible de lire l’état du run ${String(id)} avec gh.`);
  }
  await attendre(30_000);
}

const vue = lancer('gh', ['run', 'view', String(run.id), '--json', 'jobs']);
const resume = resumerJobs(vue.stdout);
console.log(`\nRésultat par job :\n${resume.lignes.join('\n')}`);

const dossier = `${DOSSIER}/${String(run.id)}`;
const telechargement = lancer('gh', ['run', 'download', String(run.id), '--dir', dossier]);
if (telechargement.status === 0) console.log(`\nArtefacts dans ${dossier}/`);
else console.log(`\nPas d’artefact téléchargé (${(telechargement.stderr || telechargement.stdout).trim() || 'aucun'}).`);

console.log(resume.reussi ? '\nTout est vert.' : `\nÉchec : détail avec \`gh run view ${String(run.id)} --log-failed\`.`);
process.exit(resume.reussi ? 0 : 1);
