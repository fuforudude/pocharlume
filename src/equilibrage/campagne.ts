// Évaluation d'une région : chaque niveau est rejoué dans chaque difficulté par les bots, sur plusieurs
// graines, et les résultats sont résumés (taux de victoire, vies restantes, arêtes inutilisées, vague la plus
// meurtrière…). Le rapport (`npm run balance`) et le test des bandes lisent les mêmes évaluations.
import type { NiveauCampagne } from '../data/visuel';
import { creerBotNaif } from './bot-naif';
import { creerBotSoigneux, optimiserBot, type VarianteSoigneux } from './bot-soigneux';
import { BOT_INACTIF, jouerPartie, type ResultatPartie } from './simulation';

export type IdBot = 'naif' | 'soigneux' | 'inactif';

/** Graines des parties évaluées : jamais utilisées pour l'entraînement du bot soigneux. */
export const GRAINES_EVALUATION: readonly number[] = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
/** Graines d'entraînement de la recherche du bot soigneux. */
export const GRAINES_ENTRAINEMENT: readonly number[] = [9001, 9002];
/** Le héros seul est évalué sur peu de graines : il ne change presque rien d'une partie à l'autre. */
export const GRAINES_SANS_DEFENSE: readonly number[] = [101, 102, 103];

export const DIFFICULTES_EVALUEES = ['chaton', 'matou', 'vieux_sage'] as const;
export type DifficulteEvaluee = (typeof DIFFICULTES_EVALUEES)[number];

export interface Evaluation {
  readonly niveau: number;
  readonly difficulte: string;
  readonly bot: IdBot;
  readonly parties: readonly ResultatPartie[];
  /** Variante retenue par la recherche du bot soigneux. */
  readonly variante?: VarianteSoigneux;
}

export interface OptionsCampagne {
  readonly niveaux: readonly NiveauCampagne[];
  readonly difficultes?: readonly string[];
  /** Graines des parties des bots naïf et soigneux. */
  readonly graines?: readonly number[];
  readonly grainesEntrainement?: readonly number[];
  readonly grainesSansDefense?: readonly number[];
  /** Rappel après chaque niveau et difficulté, pour afficher l'avancement. */
  readonly progression?: (niveau: number, difficulte: string) => void;
}

/** Évalue les trois bots sur chaque niveau et chaque difficulté demandés. */
export function evaluerCampagne(o: OptionsCampagne): Evaluation[] {
  const graines = o.graines ?? GRAINES_EVALUATION;
  const entrainement = o.grainesEntrainement ?? GRAINES_ENTRAINEMENT;
  const sansDefense = o.grainesSansDefense ?? GRAINES_SANS_DEFENSE;
  const evaluations: Evaluation[] = [];
  for (const campagne of o.niveaux) {
    for (const difficulte of o.difficultes ?? DIFFICULTES_EVALUEES) {
      const { niveau } = campagne;
      const base = { niveau: campagne.numero, difficulte };
      evaluations.push({
        ...base,
        bot: 'naif',
        parties: graines.map((graine) => jouerPartie(niveau, creerBotNaif({ graine: graine * 31 + 7 }), { graine, difficulte })),
      });
      const { variante } = optimiserBot(niveau, difficulte, entrainement);
      evaluations.push({
        ...base,
        bot: 'soigneux',
        variante,
        parties: graines.map((graine) => jouerPartie(niveau, creerBotSoigneux({ variante }), { graine, difficulte })),
      });
      evaluations.push({
        ...base,
        bot: 'inactif',
        parties: sansDefense.map((graine) => jouerPartie(niveau, BOT_INACTIF, { graine, difficulte })),
      });
      o.progression?.(campagne.numero, difficulte);
    }
  }
  return evaluations;
}

export interface Synthese {
  readonly parties: number;
  readonly victoires: number;
  /** Part de parties gagnées, de 0 à 1. */
  readonly tauxVictoire: number;
  /** Vies restantes moyennes sur toutes les parties (0 pour une défaite). */
  readonly viesMoyennes: number;
  /** Au moins une vie perdue dans au moins une partie gagnée ou perdue. */
  readonly aPerduDesVies: boolean;
  readonly aretesFinMoyennes: number;
  readonly secondesMoyennes: number;
  /** Vague (à partir de 1) où l'on perd le plus de vies, ou null si l'on n'en perd jamais. */
  readonly vagueMeurtriere: number | null;
  /** Vies perdues en moyenne dans cette vague. */
  readonly viesPerduesVagueMeurtriere: number;
}

function moyenne(valeurs: readonly number[]): number {
  return valeurs.length === 0 ? 0 : valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
}

export function synthetiser(parties: readonly ResultatPartie[]): Synthese {
  const victoires = parties.filter((p) => p.statut === 'victoire').length;
  const nombreDeVagues = Math.max(0, ...parties.map((p) => p.viesPerduesParVague.length));
  const parVague = Array.from({ length: nombreDeVagues }, (_, i) => moyenne(parties.map((p) => p.viesPerduesParVague[i] ?? 0)));
  const pire = Math.max(0, ...parVague);
  return {
    parties: parties.length,
    victoires,
    tauxVictoire: parties.length === 0 ? 0 : victoires / parties.length,
    viesMoyennes: moyenne(parties.map((p) => p.vies)),
    aPerduDesVies: parties.some((p) => p.vies < p.viesDepart),
    aretesFinMoyennes: moyenne(parties.map((p) => p.aretesFin)),
    secondesMoyennes: moyenne(parties.map((p) => p.secondes)),
    vagueMeurtriere: pire > 0 ? parVague.indexOf(pire) + 1 : null,
    viesPerduesVagueMeurtriere: pire,
  };
}

export function trouver(evaluations: readonly Evaluation[], niveau: number, difficulte: string, bot: IdBot): Evaluation | undefined {
  return evaluations.find((e) => e.niveau === niveau && e.difficulte === difficulte && e.bot === bot);
}

/** Toutes les parties d'un bot dans une difficulté, tous niveaux confondus. */
export function partiesDe(evaluations: readonly Evaluation[], difficulte: string, bot: IdBot): ResultatPartie[] {
  return evaluations.filter((e) => e.difficulte === difficulte && e.bot === bot).flatMap((e) => [...e.parties]);
}
