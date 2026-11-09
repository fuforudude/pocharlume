// Lecture des sorties JSON de `gh` pour `npm run ci:attendre` (tools/ci/attendre.ts), sans effet de bord.

export interface Run {
  readonly id: number;
  readonly sha: string;
  readonly statut: string;
  readonly conclusion: string;
  readonly url: string;
}

function estObjet(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function texte(x: unknown): string {
  return typeof x === 'string' ? x : '';
}

function lireJson(sortie: string): unknown {
  try {
    return JSON.parse(sortie);
  } catch {
    return null;
  }
}

/** Le premier run de `gh run list --json databaseId,headSha,status,conclusion,url`, ou `null`. */
export function lireRun(sortie: string): Run | null {
  const liste = lireJson(sortie);
  if (!Array.isArray(liste)) return null;
  const premier: unknown = liste[0];
  if (!estObjet(premier) || typeof premier['databaseId'] !== 'number') return null;
  return { id: premier['databaseId'], sha: texte(premier['headSha']), statut: texte(premier['status']), conclusion: texte(premier['conclusion']), url: texte(premier['url']) };
}

/** Statut d'un run et de ses jobs, lu dans `gh run view --json status,jobs`. */
export interface EtatRun {
  readonly statut: string;
  readonly jobs: readonly { readonly nom: string; readonly statut: string }[];
}

/** L'état du run, ou `null` si la sortie n'a pas de statut. */
export function lireEtatRun(sortie: string): EtatRun | null {
  const donnees = lireJson(sortie);
  if (!estObjet(donnees) || typeof donnees['status'] !== 'string') return null;
  const jobs = Array.isArray(donnees['jobs']) ? (donnees['jobs'] as unknown[]).filter(estObjet) : [];
  return { statut: donnees['status'], jobs: jobs.map((job) => ({ nom: texte(job['name']), statut: texte(job['status']) })) };
}

const LIBELLES: Readonly<Record<string, string>> = {
  success: 'réussi',
  failure: 'ÉCHEC',
  cancelled: 'annulé',
  skipped: 'sauté',
  timed_out: 'TROP LONG',
  neutral: 'neutre',
  action_required: 'en attente',
};

/** Une ligne par job de `gh run view --json jobs`, et si tout a réussi (ou a été sauté). */
export function resumerJobs(sortie: string): { lignes: string[]; reussi: boolean } {
  const donnees = lireJson(sortie);
  const jobs = estObjet(donnees) && Array.isArray(donnees['jobs']) ? (donnees['jobs'] as unknown[]).filter(estObjet) : [];
  const lignes = jobs.map((job) => {
    const conclusion = texte(job['conclusion']);
    const libelle = conclusion === '' ? texte(job['status']) || '?' : (LIBELLES[conclusion] ?? conclusion);
    return `  ${libelle.padEnd(8)} ${texte(job['name'])}`;
  });
  const reussi = jobs.length > 0 && jobs.every((job) => ['success', 'skipped'].includes(texte(job['conclusion'])));
  return { lignes, reussi };
}
