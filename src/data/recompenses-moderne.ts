// Ce que le DLC « Temps modernes » peut faire gagner : les identifiants de skins (tours, héros) et de titres qui existent. La tâche
// « récompenses » (spec du DLC) les remplit. Tant que `CATALOGUE_MODERNE` est `null`, aucun identifiant n'est jugé inconnu.
export interface CatalogueModerne {
  readonly skinsTours: readonly string[];
  readonly skinsHeros: readonly string[];
  readonly titres: readonly string[];
}

export const CATALOGUE_MODERNE: CatalogueModerne | null = null;
