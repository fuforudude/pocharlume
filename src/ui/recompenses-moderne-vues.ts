// Ce que les écrans des caisses et de la collection montrent des récompenses du DLC « Temps modernes », calculé d'après la sauvegarde.
// Fonctions pures, sans DOM : les règles (prix, chances, garantie) sont dans src/data/, ici on ne fait que les lire.
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, IDS_HEROS, RARETES, type Rarete } from '../data/meta';
import { cibleDuSkinModerne, DEFS_SKINS_MODERNES, DEFS_TITRES_MODERNES, PRIX_CAISSE_MODERNE, type DefSkinModerne } from '../data/recompenses-moderne';
import { spriteHerosModerne, spriteTour } from '../render/habillage';
import type { Sauvegarde } from '../save';

export interface VueCaisseModerne {
  readonly prix: number;
  /** Solde de badges. */
  readonly badges: number;
  /** Les chances affichées : celles du tirage, de la plus commune à la plus rare. */
  readonly chances: readonly { readonly rarete: Rarete; readonly pourcent: number }[];
  readonly compteur: number;
  /** Dans combien de caisses, celle-ci comprise, un Épique ou mieux est garanti. */
  readonly avantGarantie: number;
  readonly peutPayer: boolean;
  /** Skins du DLC obtenus, sur le total du catalogue. */
  readonly possedes: number;
  readonly total: number;
}

function obtenus(s: Sauvegarde): readonly string[] {
  return [...s.moderne.collection.skinsTours, ...s.moderne.collection.skinsHeros];
}

export function vueCaisseModerne(s: Sauvegarde): VueCaisseModerne {
  const compteur = s.moderne.collection.garantie;
  const liste = obtenus(s);
  return {
    prix: PRIX_CAISSE_MODERNE,
    badges: s.moderne.badges,
    chances: RARETES.map((rarete) => ({ rarete, pourcent: CHANCES_RARETE[rarete] })),
    compteur,
    avantGarantie: Math.max(1, CAISSES_AVANT_GARANTIE - compteur),
    peutPayer: s.moderne.badges >= PRIX_CAISSE_MODERNE,
    possedes: DEFS_SKINS_MODERNES.filter((d) => liste.includes(d.id)).length,
    total: DEFS_SKINS_MODERNES.length,
  };
}

export interface VueSkinModerne {
  readonly id: string;
  /** Clé de texte du nom. */
  readonly nom: string;
  readonly rarete: Rarete;
  readonly genre: DefSkinModerne['cible']['type'];
  /** Emplacement : `tir`, `divine_plume`, `suie`. */
  readonly cible: string;
  readonly possede: boolean;
  /** Porté sur son emplacement en ce moment. */
  readonly porte: boolean;
  /** Possédé et portable (un skin de héros demande le héros recruté). */
  readonly peutPorter: boolean;
  /** Sprite de l'atlas du DLC qui le représente. */
  readonly sprite: string;
}

/** Le sprite du DLC qui représente un skin : la tour au niveau 3, la tour divine du dieu, le héros. */
export function spriteDuSkinModerne(def: DefSkinModerne): string {
  if (def.cible.type === 'tour') return spriteTour(def.cible.famille, 3, null, 'charlie', 'moderne');
  if (def.cible.type === 'divine') return spriteTour('divine', 1, null, def.cible.dieu, 'moderne');
  return spriteHerosModerne(def.cible.heros);
}

export function vueSkinsModernes(s: Sauvegarde): VueSkinModerne[] {
  const liste = obtenus(s);
  const equipes = s.moderne.collection.equipes;
  return DEFS_SKINS_MODERNES.map((def) => {
    const cible = cibleDuSkinModerne(def);
    const possede = liste.includes(def.id);
    const heros = (IDS_HEROS as readonly string[]).includes(cible);
    return {
      id: def.id,
      nom: def.nom,
      rarete: def.rarete,
      genre: def.cible.type,
      cible,
      possede,
      porte: Object.hasOwn(equipes, cible) && equipes[cible] === def.id,
      peutPorter: possede && (!heros || Object.hasOwn(s.meta.heros, cible)),
      sprite: spriteDuSkinModerne(def),
    };
  });
}

export interface VueTitreModerne {
  readonly id: string;
  readonly nom: string;
  readonly condition: string;
  readonly obtenu: boolean;
}

export function vueTitresModernes(s: Sauvegarde): VueTitreModerne[] {
  return DEFS_TITRES_MODERNES.map((def) => ({ id: def.id, nom: def.nom, condition: def.condition, obtenu: s.moderne.titres.includes(def.id) }));
}
