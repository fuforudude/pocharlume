// Job `choisir` de .github/workflows/tests.yml : lit le quota de minutes Actions du compte et écrit `runner=vps` ou
// `runner=ubuntu-latest` dans $GITHUB_OUTPUT, avec un mot dans $GITHUB_STEP_SUMMARY. Le calcul est dans quota.ts
// (testé) ; ici seulement l'appel à l'API et l'écriture des sorties. N'échoue jamais : au pire, GitHub par défaut.
// Variables : QUOTA_GITHUB (jeton, secret), PROPRIETAIRE (compte GitHub), MINUTES_INCLUSES (variable du dépôt, facultative).
// Lancé par Node 24 directement (types effacés) : aucune dépendance, pas besoin de `npm ci`.
import { appendFileSync } from 'node:fs';
import { choisirRunner, minutesIncluses, type Choix, type ReponseApi } from './quota.ts';

async function appeler(jeton: string, proprietaire: string): Promise<ReponseApi> {
  const maintenant = new Date();
  const url = `https://api.github.com/users/${encodeURIComponent(proprietaire)}/settings/billing/usage?year=${String(maintenant.getUTCFullYear())}&month=${String(maintenant.getUTCMonth() + 1)}`;
  try {
    const reponse = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${jeton}`, 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(20_000),
    });
    return { statut: reponse.status, corps: await reponse.text() };
  } catch (erreur) {
    return { erreur: erreur instanceof Error ? erreur.message : String(erreur) };
  }
}

function ecrire(variable: string, texte: string): void {
  const fichier = process.env[variable];
  if (fichier) appendFileSync(fichier, texte);
  else process.stdout.write(texte);
}

let choix: Choix;
try {
  const jeton = (process.env['QUOTA_GITHUB'] ?? '').trim();
  const proprietaire = (process.env['PROPRIETAIRE'] ?? '').trim();
  const quota = minutesIncluses(process.env['MINUTES_INCLUSES']);
  const reponse = jeton !== '' && proprietaire !== '' ? await appeler(jeton, proprietaire) : null;
  choix = choisirRunner({ jetonPresent: jeton !== '', minutesIncluses: quota, reponse: jeton !== '' && proprietaire === '' ? { erreur: 'PROPRIETAIRE vide' } : reponse });
} catch (erreur) {
  choix = { runner: 'ubuntu-latest', restant: null, avertissement: `Erreur du script de choix (${erreur instanceof Error ? erreur.message : String(erreur)}) : les jobs partent sur GitHub.` };
}

ecrire('GITHUB_OUTPUT', `runner=${choix.runner}\n`);
const machine = choix.runner === 'vps' ? 'le VPS (runner auto-hébergé `vps`)' : 'GitHub (`ubuntu-latest`)';
const part = choix.restant === null ? '' : ` Minutes Actions restantes ce mois : ${String(Math.round(choix.restant * 100))} %.`;
ecrire('GITHUB_STEP_SUMMARY', `${choix.avertissement === null ? '' : `> [!WARNING]\n> ${choix.avertissement}\n\n`}Les jobs partent sur ${machine}.${part}\n`);
if (choix.avertissement !== null) console.log(`::warning title=Quota de minutes::${choix.avertissement}`);
console.log(`runner=${choix.runner}`);
