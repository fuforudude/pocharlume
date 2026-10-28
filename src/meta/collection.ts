// Ce que la sauvegarde retient de la collection d'un joueur (format v4, `meta.collection`) et ses lectures pures.
// Ce fichier ne connaît ni le stockage ni la session : `src/save/` s'en sert pour le format, la validation et les
// transactions.
import {
  cibleDuSkin,
  CIBLES_SKIN,
  DEFS_SKINS,
  estIdSkin,
  type FamilleBase,
  type IdCollection,
  type IdFamilier,
  type IdSkin,
} from '../data/collection';
import { type IdHeros, type TypeCaisse } from '../data/meta';

/** Où se porte un skin : sur une tour de base (« tir ») ou sur un héros (« suie »). */
export type CibleSkin = FamilleBase | IdHeros;

export interface Collection {
  /** Objets possédés avec leur rang (1 à 5). Un objet absent n'est pas possédé. */
  possedes: Partial<Record<IdCollection, number>>;
  /** Éclats des doublons, à dépenser en rangs ou en achats précis. */
  eclats: number;
  /** Caisses de chaque type ouvertes de suite sans Épique ni mieux (0 à 9 : à 9, la caisse suivante est garantie). */
  garanties: Record<TypeCaisse, number>;
  equipes: {
    /** Un skin par emplacement (tour de base ou héros). */
    skins: Partial<Record<CibleSkin, IdSkin>>;
    /** Un familier par héros. */
    familiers: Partial<Record<IdHeros, IdFamilier>>;
  };
}

export function collectionVide(): Collection {
  return { possedes: {}, eclats: 0, garanties: { skins: 0, familiers: 0 }, equipes: { skins: {}, familiers: {} } };
}

/** Rang d'un objet possédé, ou 0 s'il ne l'est pas. */
export function rangDe(collection: Collection, id: IdCollection): number {
  return Object.hasOwn(collection.possedes, id) ? (collection.possedes[id] ?? 0) : 0;
}

/** Le skin équipé à cet emplacement, ou null. */
export function skinEquipe(collection: Collection, cible: CibleSkin): IdSkin | null {
  return Object.hasOwn(collection.equipes.skins, cible) ? (collection.equipes.skins[cible] ?? null) : null;
}

/** Le familier équipé sur ce héros, ou null. */
export function familierEquipe(collection: Collection, heros: IdHeros): IdFamilier | null {
  return Object.hasOwn(collection.equipes.familiers, heros) ? (collection.equipes.familiers[heros] ?? null) : null;
}

/** Ce skin peut-il se porter à cet emplacement (la tour de base ou le héros pour lequel il est fait) ? */
export function emplacementAcceptable(cible: string, id: string): boolean {
  return CIBLES_SKIN.includes(cible) && estIdSkin(id) && cibleDuSkin(DEFS_SKINS[id]) === cible;
}
