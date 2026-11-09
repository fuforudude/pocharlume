// Délais de `npm run ci:attendre` (tools/ci/attendre.ts), sans effet de bord : l'heure est passée en argument.
// `timeout-minutes` d'un job ne compte que son exécution, pas l'attente d'une machine : un job envoyé sur le runner du
// VPS hors ligne reste en file jusqu'à 24 h. ci:attendre s'arrête donc de lui-même, avec un avertissement, quand
// aucune machine n'a pris de job depuis 15 min, et dans tous les cas après 6 h (au-delà de la plus longue passe).
import type { EtatRun } from './resultats.ts';

export type { EtatRun } from './resultats.ts';

/** Jobs en file sans aucun job en cours pendant ce temps : on suppose qu'aucune machine ne viendra. */
export const ATTENTE_MACHINE_MAX_MS = 15 * 60_000;
/** Borne totale de l'attente. */
export const ATTENTE_TOTALE_MAX_MS = 6 * 60 * 60_000;

export interface Suivi {
  /** Début de l'attente (ms). */
  readonly debut: number;
  /** Depuis quand des jobs attendent une machine sans qu'aucun ne tourne, `null` si ce n'est pas le cas. */
  readonly sansMachineDepuis: number | null;
}

export type Decision = 'continuer' | 'termine' | 'sans-machine' | 'trop-long';

const EN_FILE = new Set(['queued', 'waiting', 'pending', 'requested']);

export function commencerSuivi(maintenant: number): Suivi {
  return { debut: maintenant, sansMachineDepuis: null };
}

/** Met le suivi à jour avec l'état observé du run et dit s'il faut continuer d'attendre. */
export function suivre(suivi: Suivi, etat: EtatRun, maintenant: number): { suivi: Suivi; decision: Decision } {
  if (etat.statut === 'completed') return { suivi, decision: 'termine' };
  const enCours = etat.jobs.some((job) => job.statut === 'in_progress');
  const enFile = etat.jobs.some((job) => EN_FILE.has(job.statut)) || (etat.jobs.length === 0 && EN_FILE.has(etat.statut));
  const sansMachineDepuis = enFile && !enCours ? (suivi.sansMachineDepuis ?? maintenant) : null;
  const suite: Suivi = { debut: suivi.debut, sansMachineDepuis };
  if (maintenant - suivi.debut >= ATTENTE_TOTALE_MAX_MS) return { suivi: suite, decision: 'trop-long' };
  if (sansMachineDepuis !== null && maintenant - sansMachineDepuis >= ATTENTE_MACHINE_MAX_MS) return { suivi: suite, decision: 'sans-machine' };
  return { suivi: suite, decision: 'continuer' };
}

/** L'avertissement affiché quand aucune machine ne prend les jobs. */
export function messageSansMachine(branche: string, run: number): string {
  return [
    `Aucune machine n’a pris de job depuis ${String(ATTENTE_MACHINE_MAX_MS / 60_000)} min : runner du VPS hors ligne ?`,
    'Annuler le run bloqué, puis le relancer sur GitHub :',
    `  gh run cancel ${String(run)}`,
    `  gh workflow run tests.yml --ref ${branche} -f machine=github`,
    `  (ajouter -f equilibrage=true pour la passe d’équilibrage), puis relancer npm run ci:attendre.`,
    'Côté VPS (auteur) : systemctl status github-runner.',
  ].join('\n');
}
