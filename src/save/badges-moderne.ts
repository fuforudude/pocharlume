// Point d'entrée des badges du DLC « Temps modernes » : ce qu'une partie du DLC rapporte en badges (la monnaie du DLC, jamais dans
// `meta.monnaies`). La fin de partie (`enregistrerFinDePartie`, transactions.ts) l'appelle à chaque victoire ou défi du DLC et ajoute
// le résultat à `moderne.badges`. Les montants sont ceux de `src/data/recompenses-moderne.ts` (`BADGES_MODERNE`), seule table.
import { badgesDesFaits } from '../data/recompenses-moderne';

/** Ce que la fin de partie sait d'une victoire ou d'un défi du DLC, de quoi calculer les badges. */
export interface VictoireModerne {
  /** Numéro du niveau dans le DLC (1 à 30). */
  readonly numero: number;
  /** Vrai : c'est le boss de sa région (niveaux 10, 20, 30). */
  readonly boss: boolean;
  /** Première victoire ordinaire sur ce niveau (aucune étoile avant). */
  readonly premiereVictoire: boolean;
  /** Meilleures étoiles du niveau avant et après la partie (toutes difficultés confondues). */
  readonly etoilesAvant: number;
  readonly etoilesApres: number;
  /** Défi réussi pour la première fois sur ce niveau, ou null. */
  readonly defiReussi: string | null;
}

/**
 * Badges gagnés par cette victoire : la première victoire, la prime du boss (à sa première victoire seulement), les 3 étoiles la première
 * fois, un défi réussi la première fois. C'est la seule règle des badges (il n'y en a pas d'autre dans `src/data/`) : les montants viennent de
 * `badgesDesFaits`, et `src/save/recompenses-fin-moderne.test.ts` en fige le total (2 220) en enchaînant de vraies fins de partie.
 */
export function badgesDeLaVictoire(victoire: VictoireModerne): number {
  return badgesDesFaits({
    premiereVictoire: victoire.premiereVictoire,
    boss: victoire.boss && victoire.premiereVictoire,
    troisEtoiles: victoire.etoilesAvant < 3 && victoire.etoilesApres >= 3,
    defi: victoire.defiReussi !== null,
  });
}
