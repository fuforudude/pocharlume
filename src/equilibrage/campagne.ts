// Évaluation d'une région : chaque niveau est rejoué dans chaque difficulté par les bots, sur plusieurs
// graines, et les résultats sont résumés (taux de victoire, vies restantes, arêtes inutilisées, vague la plus
// meurtrière…). Le rapport (`npm run balance`) et le test des bandes lisent les mêmes évaluations.
import type { DefiPartie } from '../engine';
import type { NiveauCampagne } from '../data/visuel';
import { creerBotNaif } from './bot-naif';
import { creerBotSoigneux, optimiserBot, type VarianteSoigneux } from './bot-soigneux';
import { BOT_INACTIF, jouerPartie, type Joueur, type ResultatPartie } from './simulation';

export type IdBot = 'naif' | 'soigneux' | 'inactif';

/** Graines des parties évaluées : jamais utilisées pour l'entraînement du bot soigneux. */
export const GRAINES_EVALUATION: readonly number[] = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
/** Graines d'entraînement de la recherche du bot soigneux. */
export const GRAINES_ENTRAINEMENT: readonly number[] = [9001, 9002];
/** Le héros seul est évalué sur peu de graines : il ne change presque rien d'une partie à l'autre. */
export const GRAINES_SANS_DEFENSE: readonly number[] = [101, 102, 103];

export const DIFFICULTES_EVALUEES = ['chaton', 'matou', 'vieux_sage'] as const;
export type DifficulteEvaluee = (typeof DIFFICULTES_EVALUEES)[number];

/** Les dieux évalués, chacun avec son avatar, sans amélioration ni objet. */
export const DIEUX_EVALUES = ['plume', 'charlie', 'pollen'] as const;

/** Les défis évalués (jalon 3) : le bot soigneux seul les joue, avec les règles de Matou. */
export const DEFIS_EVALUES = ['heroique', 'fer'] as const;

/** Vrai pour un défi (`heroique`, `fer`) dans la liste des « difficultés » évaluées. */
export function estDefi(difficulte: string): difficulte is DefiPartie {
  return difficulte === 'heroique' || difficulte === 'fer';
}

export interface Evaluation {
  readonly dieu: string;
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
  /** Dieux évalués (tous par défaut), chacun joué avec son avatar. */
  readonly dieux?: readonly string[];
  /** Graines des parties des bots naïf et soigneux. */
  readonly graines?: readonly number[];
  readonly grainesEntrainement?: readonly number[];
  readonly grainesSansDefense?: readonly number[];
  /** Bots évalués (les trois par défaut ; un défi ne se joue qu'avec le soigneux). Les tests des bandes imposées n'évaluent que ce dont ils jugent. */
  readonly bots?: readonly IdBot[];
  /** Rappel après chaque niveau et difficulté, pour afficher l'avancement. */
  readonly progression?: (niveau: number, difficulte: string, dieu: string) => void;
}

/** Évalue les trois bots sur chaque niveau et chaque difficulté demandés. */
export function evaluerCampagne(o: OptionsCampagne): Evaluation[] {
  const graines = o.graines ?? GRAINES_EVALUATION;
  const entrainement = o.grainesEntrainement ?? GRAINES_ENTRAINEMENT;
  const sansDefense = o.grainesSansDefense ?? GRAINES_SANS_DEFENSE;
  const voulus = o.bots ?? ['naif', 'soigneux', 'inactif'];
  const evaluations: Evaluation[] = [];
  for (const campagne of o.niveaux) {
    for (const difficulte of o.difficultes ?? DIFFICULTES_EVALUEES) {
      for (const dieu of o.dieux ?? DIEUX_EVALUES) {
        const { niveau } = campagne;
        const base = { dieu, niveau: campagne.numero, difficulte };
        // Un défi se joue avec les règles de Matou et le seul bot soigneux (qui cherche sa variante pour ce défi).
        const defi = estDefi(difficulte) ? { defi: difficulte } : {};
        const regles = estDefi(difficulte) ? 'matou' : difficulte;
        if (!estDefi(difficulte) && voulus.includes('naif')) {
          evaluations.push({
            ...base,
            bot: 'naif',
            parties: graines.map((graine) => jouerPartie(niveau, creerBotNaif({ graine: graine * 31 + 7 }), { graine, difficulte, dieu })),
          });
        }
        if (voulus.includes('soigneux')) {
          const { variante } = optimiserBot(niveau, regles, entrainement, { dieu, ...defi });
          evaluations.push({
            ...base,
            bot: 'soigneux',
            variante,
            parties: graines.map((graine) => jouerPartie(niveau, creerBotSoigneux({ variante }), { graine, difficulte: regles, dieu, ...defi })),
          });
        }
        if (!estDefi(difficulte) && voulus.includes('inactif')) {
          evaluations.push({
            ...base,
            bot: 'inactif',
            parties: sansDefense.map((graine) => jouerPartie(niveau, BOT_INACTIF, { graine, difficulte, dieu })),
          });
        }
        o.progression?.(campagne.numero, difficulte, dieu);
      }
    }
  }
  return evaluations;
}

/**
 * Une façon de jouer évaluée à part des bandes : un héros (avatar ou disciple), un niveau de héros et ses compétences,
 * un arbre d'améliorations, ou le soigneux privé de la tour divine. Sert aux vérifications supplémentaires du rapport.
 */
export interface Profil extends Joueur {
  readonly id: string;
  readonly dieu: string;
  /** Faux : le soigneux n'a pas de tour divine (il dépense ses 400 arêtes en tours communes). */
  readonly tourDivine?: boolean;
}

export interface EvaluationProfil {
  readonly profil: string;
  readonly dieu: string;
  readonly heros: string;
  readonly niveau: number;
  readonly difficulte: string;
  readonly bot: 'naif' | 'soigneux';
  readonly parties: readonly ResultatPartie[];
}

export interface OptionsProfil {
  readonly graines?: readonly number[];
  readonly grainesEntrainement?: readonly number[];
  /** Les bots joués (les deux par défaut). */
  readonly bots?: readonly ('naif' | 'soigneux')[];
}

/** Évalue un niveau dans une difficulté pour un profil, avec le bot naïf et/ou le bot soigneux (même recherche de variante que les bandes). */
export function evaluerProfil(campagne: NiveauCampagne, difficulte: string, profil: Profil, o: OptionsProfil = {}): EvaluationProfil[] {
  const graines = o.graines ?? GRAINES_EVALUATION;
  const entrainement = o.grainesEntrainement ?? GRAINES_ENTRAINEMENT;
  const { id, ...joueur } = profil;
  const { niveau } = campagne;
  const base = { profil: id, dieu: profil.dieu, heros: profil.heros ?? profil.dieu, niveau: campagne.numero, difficulte };
  const evaluations: EvaluationProfil[] = [];
  for (const bot of o.bots ?? ['naif', 'soigneux']) {
    if (bot === 'naif') {
      const parties = graines.map((graine) => jouerPartie(niveau, creerBotNaif({ graine: graine * 31 + 7 }), { ...joueur, graine, difficulte }));
      evaluations.push({ ...base, bot, parties });
    } else {
      const options = profil.tourDivine === undefined ? {} : { tourDivine: profil.tourDivine };
      const { variante } = optimiserBot(niveau, difficulte, entrainement, joueur, options);
      const parties = graines.map((graine) => jouerPartie(niveau, creerBotSoigneux({ ...options, variante }), { ...joueur, graine, difficulte }));
      evaluations.push({ ...base, bot, parties });
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
  /** Vies perdues en moyenne par partie (vies de départ moins vies restantes ; une défaite compte toutes les vies). */
  readonly viesPerduesMoyennes: number;
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
    viesPerduesMoyennes: moyenne(parties.map((p) => p.viesDepart - p.vies)),
    aPerduDesVies: parties.some((p) => p.vies < p.viesDepart),
    aretesFinMoyennes: moyenne(parties.map((p) => p.aretesFin)),
    secondesMoyennes: moyenne(parties.map((p) => p.secondes)),
    vagueMeurtriere: pire > 0 ? parVague.indexOf(pire) + 1 : null,
    viesPerduesVagueMeurtriere: pire,
  };
}

export function trouver(evaluations: readonly Evaluation[], niveau: number, difficulte: string, bot: IdBot, dieu?: string): Evaluation | undefined {
  return evaluations.find((e) => e.niveau === niveau && e.difficulte === difficulte && e.bot === bot && (dieu === undefined || e.dieu === dieu));
}

/** Les dieux présents dans les évaluations, dans l'ordre où ils apparaissent. */
export function dieuxDe(evaluations: readonly Evaluation[]): string[] {
  return [...new Set(evaluations.map((e) => e.dieu))];
}

/** Les évaluations d'un seul dieu. */
export function duDieu(evaluations: readonly Evaluation[], dieu: string): Evaluation[] {
  return evaluations.filter((e) => e.dieu === dieu);
}

/** Toutes les parties d'un bot dans une difficulté, tous niveaux confondus (d'un seul dieu si `dieu` est donné). */
export function partiesDe(evaluations: readonly Evaluation[], difficulte: string, bot: IdBot, dieu?: string): ResultatPartie[] {
  return evaluations
    .filter((e) => e.difficulte === difficulte && e.bot === bot && (dieu === undefined || e.dieu === dieu))
    .flatMap((e) => [...e.parties]);
}
