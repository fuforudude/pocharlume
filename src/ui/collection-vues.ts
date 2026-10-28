// Ce que les écrans des caisses et de la collection montrent, calculé d'après la sauvegarde. Fonctions pures, sans DOM :
// les règles (prix, chances, bonus, plafond) sont dans src/data/meta.ts et src/meta/, ici on ne fait que les lire.
import {
  CATALOGUE,
  cibleDuSkin,
  FAMILLES_BASE,
  IDS_FAMILIERS,
  IDS_SKINS,
  type FamilleBase,
  type IdCollection,
  type IdFamilier,
  type IdSkin,
} from '../data/collection';
import {
  BONUS_FAMILIER_POURCENT,
  BONUS_SKIN_POURCENT,
  bonusEnEntiers,
  CAISSES_AVANT_GARANTIE,
  CHANCES_RARETE,
  coutRangEclats,
  ECHELLE_BONUS,
  IDS_HEROS,
  PLAFOND_BONUS_POURCENT,
  PRIX_CAISSE,
  PRIX_ECLATS_OBJET,
  RANG_MAX_COLLECTION,
  RARETES,
  TYPES_CAISSE,
  type IdHeros,
  type Rarete,
  type TypeCaisse,
} from '../data/meta';
import { bonusDeCollection } from '../meta/bonus';
import { emplacementAcceptable, familierEquipe, rangDe, skinEquipe } from '../meta/collection';
import { iconeFamille, portraitHeros } from '../render/habillage';
import type { Sauvegarde } from '../save';

// --- Caisses --------------------------------------------------------------------------------------------------

export interface VueCaisse {
  readonly type: TypeCaisse;
  readonly prix: number;
  /** Les chances affichées : celles du tirage (`CHANCES_RARETE`), de la plus commune à la plus rare. */
  readonly chances: readonly { readonly rarete: Rarete; readonly pourcent: number }[];
  /** Caisses de ce type ouvertes de suite sans Épique ni mieux (0 à 9). */
  readonly compteur: number;
  /** Dans combien de caisses, celle-ci comprise, un Épique ou mieux est garanti : 10 au départ, 1 quand le compteur est à 9. */
  readonly avantGarantie: number;
  /** Les braises couvrent le prix (côté interface ; la transaction a le dernier mot). */
  readonly peutPayer: boolean;
}

export function vueCaisses(s: Sauvegarde): VueCaisse[] {
  return TYPES_CAISSE.map((type) => {
    const compteur = s.meta.collection.garanties[type];
    return {
      type,
      prix: PRIX_CAISSE,
      chances: RARETES.map((rarete) => ({ rarete, pourcent: CHANCES_RARETE[rarete] })),
      compteur,
      avantGarantie: Math.max(1, CAISSES_AVANT_GARANTIE - compteur),
      peutPayer: s.meta.monnaies.braises >= PRIX_CAISSE,
    };
  });
}

// --- Objets de la collection ----------------------------------------------------------------------------------

export interface VueObjetCollection {
  readonly id: IdCollection;
  readonly genre: 'skin' | 'familier';
  readonly rarete: Rarete;
  /** Stat améliorée (`pvSoldats`, `degats`, `cadence`…) : la clé de texte est `stat.<stat>`. */
  readonly stat: string;
  readonly possede: boolean;
  /** Rang 1 à 5, 0 si l'objet n'est pas possédé. */
  readonly rang: number;
  readonly rangMax: number;
  /** Bonus du rang actuel (du rang 1 pour un objet pas possédé), en pourcents. */
  readonly bonusPourcent: number;
  /** Éclats du rang suivant, null si l'objet n'est pas possédé ou au rang maximal. */
  readonly coutMonter: number | null;
  readonly peutMonter: boolean;
  /** Éclats de l'achat direct, null si l'objet est déjà possédé. */
  readonly prixAchat: number | null;
  readonly peutAcheter: boolean;
  /** Où on peut le porter : l'emplacement d'un skin (tour de base ou héros), les héros recrutés pour un familier. */
  readonly porteurs: readonly string[];
  /** Ceux qui le portent en ce moment, parmi `porteurs`. */
  readonly equipeSur: readonly string[];
}

/** Bonus d'un objet à ce rang, en pourcents (exact : calculé en entiers de 1/100 000 puis ramené). */
function bonusDe(id: IdCollection, rang: number): number {
  const def = CATALOGUE[id];
  const base = def.genre === 'skin' ? BONUS_SKIN_POURCENT[def.rarete] : BONUS_FAMILIER_POURCENT[def.rarete];
  return bonusEnEntiers(base, Math.max(1, rang)) / (ECHELLE_BONUS / 100);
}

/** Les héros recrutés, dans l'ordre des dieux (avatar, puis ses disciples). */
function herosRecrutes(s: Sauvegarde): IdHeros[] {
  return IDS_HEROS.filter((h) => Object.hasOwn(s.meta.heros, h));
}

export function vueObjetsCollection(s: Sauvegarde, genre: 'skin' | 'familier'): VueObjetCollection[] {
  const collection = s.meta.collection;
  const recrutes = herosRecrutes(s);
  const ids: readonly IdCollection[] = genre === 'skin' ? IDS_SKINS : IDS_FAMILIERS;
  return ids.map((id) => {
    const def = CATALOGUE[id];
    const rang = rangDe(collection, id);
    const possede = rang > 0;
    const coutMonter = possede && rang < RANG_MAX_COLLECTION ? coutRangEclats(rang) : null;
    const prixAchat = possede ? null : PRIX_ECLATS_OBJET[def.rarete];
    let porteurs: readonly string[];
    let equipeSur: string[];
    if (def.genre === 'skin') {
      const cible = cibleDuSkin(def);
      porteurs = [cible];
      equipeSur = skinEquipe(collection, cible as FamilleBase | IdHeros) === id ? [cible] : [];
    } else {
      porteurs = recrutes;
      equipeSur = recrutes.filter((h) => familierEquipe(collection, h) === id);
    }
    return {
      id,
      genre: def.genre,
      rarete: def.rarete,
      stat: def.stat,
      possede,
      rang,
      rangMax: RANG_MAX_COLLECTION,
      bonusPourcent: bonusDe(id, rang),
      coutMonter,
      peutMonter: coutMonter !== null && collection.eclats >= coutMonter,
      prixAchat,
      peutAcheter: prixAchat !== null && collection.eclats >= prixAchat,
      porteurs,
      equipeSur,
    };
  });
}

// --- Porteurs et plafond --------------------------------------------------------------------------------------

export interface VuePorteur {
  /** Une tour de base (`tir`) ou un héros recruté (`suie`). */
  readonly id: FamilleBase | IdHeros;
  readonly genre: 'tour' | 'heros';
  readonly skin: IdSkin | null;
  readonly familier: IdFamilier | null;
  /** Somme des bonus de ce qu'il porte, avant le plafond. */
  readonly brutPourcent: number;
  /** Ce que la partie donnera : le brut, ramené au plafond de +10 % (valeur que calcule `bonusDeCollection`). */
  readonly totalPourcent: number;
  /** Le brut dépasse le plafond. */
  readonly plafonne: boolean;
}

/** Arrondi à 3 décimales : les bonus se calculent en entiers de 1/100 000, la fraction du plafond n'a pas de flottant à nettoyer. */
function arrondi(x: number): number {
  return Math.round(x * 1000) / 1000;
}

/** Les quatre tours de base puis les héros recrutés, avec ce qu'ils portent et le total de leur bonus. */
export function vuePorteurs(s: Sauvegarde): VuePorteur[] {
  const collection = s.meta.collection;
  const porteurs: VuePorteur[] = [];
  const valideSkin = (cible: string): IdSkin | null => {
    const id = skinEquipe(collection, cible as FamilleBase | IdHeros);
    return id !== null && rangDe(collection, id) > 0 && emplacementAcceptable(cible, id) ? id : null;
  };
  for (const famille of FAMILLES_BASE) {
    const skin = valideSkin(famille);
    const brut = skin === null ? 0 : bonusDe(skin, rangDe(collection, skin));
    const fractions = bonusDeCollection(collection, 'charlie', null).tours[famille] ?? {};
    const total = arrondi(Object.values(fractions).reduce<number>((somme, v) => somme + v, 0) * 100);
    porteurs.push({ id: famille, genre: 'tour', skin, familier: null, brutPourcent: brut, totalPourcent: total, plafonne: brut > PLAFOND_BONUS_POURCENT });
  }
  for (const heros of herosRecrutes(s)) {
    const skin = valideSkin(heros);
    const brutSkin = skin === null ? 0 : bonusDe(skin, rangDe(collection, skin));
    const familierId = familierEquipe(collection, heros);
    const familier = familierId !== null && rangDe(collection, familierId) > 0 ? familierId : null;
    const brutFamilier = familier === null ? 0 : bonusDe(familier, rangDe(collection, familier));
    const brut = arrondi(brutSkin + brutFamilier);
    const fractions = bonusDeCollection(collection, heros, null).heros;
    const total = arrondi(Object.values(fractions).reduce<number>((somme, v) => somme + v, 0) * 100);
    porteurs.push({ id: heros, genre: 'heros', skin, familier, brutPourcent: brut, totalPourcent: total, plafonne: brut > PLAFOND_BONUS_POURCENT });
  }
  return porteurs;
}

// --- Petits formats -------------------------------------------------------------------------------------------

/** Un pourcentage à la française, à deux décimales au plus : « 1,5 », « 1,25 », « 10 » (9,999 s'affiche « 10 »). */
export function formaterPourcent(valeur: number): string {
  return String(Math.round(valeur * 100) / 100).replace('.', ',');
}

/** Nom du sprite de l'atlas qui représente un objet : la tour ou le portrait que le skin habille, le sprite du familier. */
export function spriteDeCollection(id: IdCollection): string {
  const def = CATALOGUE[id];
  if (def.genre === 'familier') return `familier-${id.slice('familier_'.length).replaceAll('_', '-')}`;
  return def.cible.type === 'tour' ? iconeFamille(def.cible.famille) : portraitHeros(def.cible.heros);
}
