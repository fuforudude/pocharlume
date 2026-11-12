// L'apparence que le rendu donne aux tours et au héros d'une partie : les skins équipés et le familier du héros joué, et les skins du DLC
// portés (ils habillent aussi l'histoire). Elle ne dépend pas du défi : en Fer le bonus de la collection est ignoré (config.bonus), mais
// les skins restent visibles.
import type { IdCampagne } from '../engine/definitions';
import { FAMILLES_BASE } from '../data/collection';
import type { Collection } from '../meta/collection';
import { campagneDApparence } from '../render/habillage';
import type { OptionsCollection } from '../render/rendu';

/** Ce que le joueur a équipé, tel que la sauvegarde le range (`meta.collection.equipes`). */
export type Equipes = Collection['equipes'];

/** Les skins du DLC portés, tels que la sauvegarde les range (`moderne.collection.equipes`). */
export type SkinsModernes = Readonly<Record<string, string>>;

/**
 * Les `OptionsCollection` du rendu pour une partie jouée avec `heros` : tous les skins équipés (par tour de base ou par
 * héros ; le rendu ne garde que ceux qui habillent une tour ou le héros de la partie) et le familier de ce héros seulement,
 * plus les skins du DLC portés s'il y en a. Sans équipement (`undefined`), tout est dessiné avec les sprites de base.
 */
export function apparenceDeLaPartie(equipes: Equipes | undefined, heros: string, skinsModernes: SkinsModernes = {}): OptionsCollection {
  const modernes = Object.keys(skinsModernes).length > 0 ? { skinsModernes: { ...skinsModernes } } : {};
  if (!equipes) return { skins: {}, familier: null, ...modernes };
  const familier = Object.hasOwn(equipes.familiers, heros) ? (equipes.familiers[heros as keyof Equipes['familiers']] ?? null) : null;
  return { skins: { ...equipes.skins }, familier, ...modernes };
}

/**
 * La campagne de l'atlas à charger : celle de la partie, ou `moderne` si un skin du DLC porté sert dans cette partie de l'histoire,
 * c'est-à-dire s'il habille l'une des 4 familles de tours, la tour divine du dieu joué ou le héros joué (un skin porté ailleurs ne
 * justifie pas le téléchargement).
 */
export function campagneDeLAtlas(campagne: IdCampagne, skinsModernes: SkinsModernes | undefined, dieu: string, heros: string): IdCampagne {
  if (campagne === 'moderne' || !skinsModernes) return campagne;
  const cibles = [...FAMILLES_BASE, `divine_${dieu}`, heros];
  return cibles.some((cible) => campagneDApparence(campagne, skinsModernes, cible) === 'moderne') ? 'moderne' : campagne;
}
