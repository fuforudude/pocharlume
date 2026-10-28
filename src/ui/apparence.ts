// L'apparence que le rendu donne aux tours et au héros d'une partie : les skins équipés et le familier du héros joué.
// Elle ne dépend pas du défi : en Fer le bonus de la collection est ignoré (config.bonus), mais les skins restent visibles.
import type { Collection } from '../meta/collection';
import type { OptionsCollection } from '../render/rendu';

/** Ce que le joueur a équipé, tel que la sauvegarde le range (`meta.collection.equipes`). */
export type Equipes = Collection['equipes'];

/**
 * Les `OptionsCollection` du rendu pour une partie jouée avec `heros` : tous les skins équipés (par tour de base ou par
 * héros ; le rendu ne garde que ceux qui habillent une tour ou le héros de la partie) et le familier de ce héros seulement.
 * Sans équipement (`undefined`), tout est dessiné avec les sprites de base.
 */
export function apparenceDeLaPartie(equipes: Equipes | undefined, heros: string): OptionsCollection {
  if (!equipes) return { skins: {}, familier: null };
  const familier = Object.hasOwn(equipes.familiers, heros) ? (equipes.familiers[heros as keyof Equipes['familiers']] ?? null) : null;
  return { skins: { ...equipes.skins }, familier };
}
