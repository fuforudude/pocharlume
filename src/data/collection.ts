// Catalogue de la collection (caisses du jalon 3) : 21 skins (3 par tour de base, 1 par héros) et 12 familiers. Chaque
// objet a une rareté et une stat ; son bonus (rareté, rang, plafond) se calcule avec les règles de `meta.ts`, qui fait
// foi pour les prix et les pourcentages. Les noms et descriptions sont des clés de `src/i18n/fr-collection.ts`.
// Les stats portent les noms du contrat de bonus de la config de partie (`bonus` de `ConfigPartie`).
import { IDS_HEROS, RARETES, type IdHeros, type Rarete, type TypeCaisse } from './meta';

/** Les quatre tours de base, qui portent un skin chacune (il vaut pour leurs spécialisations). */
export const FAMILLES_BASE = ['caserne', 'tir', 'magie', 'artillerie'] as const;
export type FamilleBase = (typeof FAMILLES_BASE)[number];

/** Stats qu'un skin de tour peut améliorer, et celles qu'un skin de héros ou un familier peut améliorer. */
export type StatTour = 'degats' | 'cadence' | 'portee' | 'pvSoldats';
export type StatHeros = 'pv' | 'degats' | 'cadence' | 'regeneration';

export const IDS_SKINS = [
  'skin_caserne_1', 'skin_caserne_2', 'skin_caserne_3',
  'skin_tir_1', 'skin_tir_2', 'skin_tir_3',
  'skin_magie_1', 'skin_magie_2', 'skin_magie_3',
  'skin_artillerie_1', 'skin_artillerie_2', 'skin_artillerie_3',
  'skin_plume', 'skin_charlie', 'skin_pollen',
  'skin_suie', 'skin_corbeau', 'skin_mastoc', 'skin_brise_os', 'skin_rouage', 'skin_lanterne',
] as const;
export type IdSkin = (typeof IDS_SKINS)[number];

export const IDS_FAMILIERS = [
  'familier_rat', 'familier_crapaud', 'familier_escargot',
  'familier_chouette', 'familier_luciole', 'familier_lezard',
  'familier_chauve_souris', 'familier_araignee', 'familier_furet',
  'familier_corneille', 'familier_papillon_nuit',
  'familier_salamandre',
] as const;
export type IdFamilier = (typeof IDS_FAMILIERS)[number];

export type IdCollection = IdSkin | IdFamilier;

interface Commun {
  readonly nom: string;
  readonly description: string;
  readonly rarete: Rarete;
}

export type DefSkin = Commun & { readonly genre: 'skin'; readonly id: IdSkin } & (
    | { readonly cible: { readonly type: 'tour'; readonly famille: FamilleBase }; readonly stat: StatTour }
    | { readonly cible: { readonly type: 'heros'; readonly heros: IdHeros }; readonly stat: StatHeros }
  );

export interface DefFamilier extends Commun {
  readonly genre: 'familier';
  readonly id: IdFamilier;
  /** Un familier suit n'importe quel héros ; c'est le héros qui le porte (un par héros). */
  readonly stat: StatHeros;
}

export type DefCollection = DefSkin | DefFamilier;

function skinDeTour(id: IdSkin, famille: FamilleBase, rarete: Rarete, stat: StatTour): DefSkin {
  return { genre: 'skin', id, nom: `collection.${id}`, description: `collection.${id}.desc`, rarete, cible: { type: 'tour', famille }, stat };
}

function skinDeHeros(id: IdSkin, heros: IdHeros, rarete: Rarete, stat: StatHeros): DefSkin {
  return { genre: 'skin', id, nom: `collection.${id}`, description: `collection.${id}.desc`, rarete, cible: { type: 'heros', heros }, stat };
}

function familier(id: IdFamilier, rarete: Rarete, stat: StatHeros): DefFamilier {
  return { genre: 'familier', id, nom: `collection.${id}`, description: `collection.${id}.desc`, rarete, stat };
}

export const DEFS_SKINS: Readonly<Record<IdSkin, DefSkin>> = {
  skin_caserne_1: skinDeTour('skin_caserne_1', 'caserne', 'commun', 'pvSoldats'),
  skin_caserne_2: skinDeTour('skin_caserne_2', 'caserne', 'rare', 'degats'),
  skin_caserne_3: skinDeTour('skin_caserne_3', 'caserne', 'epique', 'cadence'),
  skin_tir_1: skinDeTour('skin_tir_1', 'tir', 'commun', 'cadence'),
  skin_tir_2: skinDeTour('skin_tir_2', 'tir', 'rare', 'portee'),
  skin_tir_3: skinDeTour('skin_tir_3', 'tir', 'legendaire', 'degats'),
  skin_magie_1: skinDeTour('skin_magie_1', 'magie', 'commun', 'degats'),
  skin_magie_2: skinDeTour('skin_magie_2', 'magie', 'epique', 'portee'),
  skin_magie_3: skinDeTour('skin_magie_3', 'magie', 'legendaire', 'cadence'),
  skin_artillerie_1: skinDeTour('skin_artillerie_1', 'artillerie', 'commun', 'portee'),
  skin_artillerie_2: skinDeTour('skin_artillerie_2', 'artillerie', 'rare', 'cadence'),
  skin_artillerie_3: skinDeTour('skin_artillerie_3', 'artillerie', 'epique', 'degats'),
  skin_plume: skinDeHeros('skin_plume', 'plume', 'rare', 'cadence'),
  skin_charlie: skinDeHeros('skin_charlie', 'charlie', 'rare', 'pv'),
  skin_pollen: skinDeHeros('skin_pollen', 'pollen', 'rare', 'degats'),
  skin_suie: skinDeHeros('skin_suie', 'suie', 'epique', 'degats'),
  skin_corbeau: skinDeHeros('skin_corbeau', 'corbeau', 'epique', 'cadence'),
  skin_mastoc: skinDeHeros('skin_mastoc', 'mastoc', 'legendaire', 'pv'),
  skin_brise_os: skinDeHeros('skin_brise_os', 'brise_os', 'legendaire', 'degats'),
  skin_rouage: skinDeHeros('skin_rouage', 'rouage', 'epique', 'cadence'),
  skin_lanterne: skinDeHeros('skin_lanterne', 'lanterne', 'mythique', 'regeneration'),
};

export const DEFS_FAMILIERS: Readonly<Record<IdFamilier, DefFamilier>> = {
  familier_rat: familier('familier_rat', 'commun', 'pv'),
  familier_crapaud: familier('familier_crapaud', 'commun', 'regeneration'),
  familier_escargot: familier('familier_escargot', 'commun', 'pv'),
  familier_chouette: familier('familier_chouette', 'rare', 'cadence'),
  familier_luciole: familier('familier_luciole', 'rare', 'regeneration'),
  familier_lezard: familier('familier_lezard', 'rare', 'degats'),
  familier_chauve_souris: familier('familier_chauve_souris', 'epique', 'cadence'),
  familier_araignee: familier('familier_araignee', 'epique', 'degats'),
  familier_furet: familier('familier_furet', 'epique', 'pv'),
  familier_corneille: familier('familier_corneille', 'legendaire', 'degats'),
  familier_papillon_nuit: familier('familier_papillon_nuit', 'legendaire', 'regeneration'),
  familier_salamandre: familier('familier_salamandre', 'mythique', 'degats'),
};

/** Tout le catalogue, par id. */
export const CATALOGUE: Readonly<Record<IdCollection, DefCollection>> = { ...DEFS_SKINS, ...DEFS_FAMILIERS };
export const IDS_COLLECTION: readonly IdCollection[] = [...IDS_SKINS, ...IDS_FAMILIERS];

export function estIdSkin(x: unknown): x is IdSkin {
  return typeof x === 'string' && (IDS_SKINS as readonly string[]).includes(x);
}

export function estIdFamilier(x: unknown): x is IdFamilier {
  return typeof x === 'string' && (IDS_FAMILIERS as readonly string[]).includes(x);
}

export function estIdCollection(x: unknown): x is IdCollection {
  return estIdSkin(x) || estIdFamilier(x);
}

/** Les emplacements où un skin se porte : une des quatre tours de base, ou un héros. */
export const CIBLES_SKIN: readonly string[] = [...FAMILLES_BASE, ...IDS_HEROS];

/** L'emplacement d'un skin : la famille de la tour (« tir ») ou le héros (« suie »). */
export function cibleDuSkin(def: DefSkin): string {
  return def.cible.type === 'tour' ? def.cible.famille : def.cible.heros;
}

/** Les objets qu'une caisse peut donner à cette rareté, dans l'ordre du catalogue. */
export function objetsDeCaisse(type: TypeCaisse, rarete: Rarete): readonly IdCollection[] {
  const ids: readonly IdCollection[] = type === 'skins' ? IDS_SKINS : IDS_FAMILIERS;
  return ids.filter((id) => CATALOGUE[id].rarete === rarete);
}

/** Les raretés que la caisse peut donner (toutes, vérifié par un test : le tirage n'a jamais de rareté vide). */
export function raretesDeCaisse(type: TypeCaisse): readonly Rarete[] {
  return RARETES.filter((rarete) => objetsDeCaisse(type, rarete).length > 0);
}

/** Le type de caisse qui donne cet objet. */
export function caisseDe(id: IdCollection): TypeCaisse {
  return CATALOGUE[id].genre === 'skin' ? 'skins' : 'familiers';
}
