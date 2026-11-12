// Point d'entrée des badges du DLC « Temps modernes » : ce qu'une partie du DLC rapporte en badges (la monnaie du DLC, jamais dans
// `meta.monnaies`). La fin de partie (`enregistrerFinDePartie`, transactions.ts) l'appelle à chaque victoire ou défi du DLC et ajoute
// le résultat à `moderne.badges`.

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
 * Badges gagnés par cette victoire. TODO (agent des récompenses) : première victoire, étoiles, défis, boss. Vide pour l'instant :
 * le DLC ne rapporte aucun badge tant que ce n'est pas rempli.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- le paramètre est la signature à remplir
export function badgesDeLaVictoire(victoire: VictoireModerne): number {
  return 0;
}
