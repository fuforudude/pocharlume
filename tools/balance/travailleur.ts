// Fil de calcul de `npm run balance` : évalue des niveaux dans une difficulté (pour un dieu, ou pour un profil de
// vérification supplémentaire) et renvoie les évaluations au fil principal (tools/balance/index.ts). Un fil reste en vie et
// traite les tâches qu'on lui envoie l'une après l'autre : démarrer un fil et charger le jeu coûte autant qu'une évaluation.
import { parentPort } from 'node:worker_threads';
import { niveauDeCampagne } from '../../src/data/niveaux/campagne.ts';
import {
  evaluerCampagne,
  evaluerProfil,
  GRAINES_ENTRAINEMENT,
  GRAINES_EVALUATION,
  type Evaluation,
  type EvaluationProfil,
  type Profil,
} from '../../src/equilibrage/campagne.ts';

export interface TacheBandes {
  readonly type: 'bandes';
  readonly numero: number;
  readonly difficulte: string;
  readonly dieu: string;
  readonly graines: number;
  /** Nombre de graines d'entraînement de la recherche du soigneux (2 par défaut, 1 comme les tests des bandes). */
  readonly entrainement: number;
}

export interface TacheProfil {
  readonly type: 'profil';
  readonly numero: number;
  readonly difficulte: string;
  readonly profil: Profil;
  readonly graines: number;
  readonly bots: readonly ('naif' | 'soigneux')[];
}

function calculer(tache: TacheBandes | TacheProfil): (Evaluation | EvaluationProfil)[] {
  const campagne = niveauDeCampagne(tache.numero);
  if (!campagne) throw new Error(`Niveau ${String(tache.numero)} introuvable`);
  const graines =
    tache.graines <= GRAINES_EVALUATION.length ? GRAINES_EVALUATION.slice(0, tache.graines) : Array.from({ length: tache.graines }, (_, i) => 101 + i);
  return tache.type === 'bandes'
    ? evaluerCampagne({ niveaux: [campagne], difficultes: [tache.difficulte], dieux: [tache.dieu], graines, grainesEntrainement: GRAINES_ENTRAINEMENT.slice(0, tache.entrainement) })
    : evaluerProfil(campagne, tache.difficulte, tache.profil, { graines, bots: tache.bots });
}

parentPort?.on('message', (tache: TacheBandes | TacheProfil) => {
  parentPort?.postMessage(calculer(tache));
});
