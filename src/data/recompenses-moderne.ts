// Récompenses du DLC « Temps modernes » (spec du 2026-11-12, tâche 6) : les badges, monnaie gagnée seulement en jouant le DLC (jamais
// avec de l'argent réel) ; la caisse « Temps modernes », ouverte avec des badges, sur le modèle des caisses actuelles (mêmes raretés,
// mêmes chances affichées, même garantie, doublons en éclats) ; ses skins de tours et de héros, apparence seulement, portables aussi
// dans l'histoire ; et les titres de collection. Les chiffres (badges, prix, raretés) sont des propositions à valider en revue.
// Les noms sont des clés de `src/i18n/fr-recompenses-moderne.ts`.
import { NIVEAU_MAX_MODERNE } from './campagnes';
import { FAMILLES_BASE, type FamilleBase } from './collection';
import { IDS_DEFIS, IDS_DIEUX, IDS_HEROS, NIVEAUX_PAR_REGION, RARETES, type IdDefi, type IdDieu, type IdHeros, type Rarete } from './meta';

/** Les identifiants que le DLC peut faire gagner : ce que la normalisation d'une sauvegarde importée garde. */
export interface CatalogueModerne {
  readonly skinsTours: readonly string[];
  readonly skinsHeros: readonly string[];
  readonly titres: readonly string[];
}

// --- Skins ----------------------------------------------------------------------------------------------------

/** Où se porte un skin du DLC : une tour de base, la tour divine d'un dieu (`divine_plume`), ou un héros. */
export type CibleSkinModerne = FamilleBase | `divine_${IdDieu}` | IdHeros;

export interface DefSkinModerne {
  readonly id: string;
  /** Clé de texte du nom. */
  readonly nom: string;
  readonly rarete: Rarete;
  readonly cible:
    | { readonly type: 'tour'; readonly famille: FamilleBase }
    | { readonly type: 'divine'; readonly dieu: IdDieu }
    | { readonly type: 'heros'; readonly heros: IdHeros };
}

function skinTour(famille: FamilleBase, rarete: Rarete): DefSkinModerne {
  const id = `skin_moderne_${famille}`;
  return { id, nom: `moderne.skin.${id}`, rarete, cible: { type: 'tour', famille } };
}

function skinDivine(dieu: IdDieu, rarete: Rarete): DefSkinModerne {
  const id = `skin_moderne_divine_${dieu}`;
  return { id, nom: `moderne.skin.${id}`, rarete, cible: { type: 'divine', dieu } };
}

function skinHeros(heros: IdHeros, rarete: Rarete): DefSkinModerne {
  const id = `skin_moderne_${heros}`;
  return { id, nom: `moderne.skin.${id}`, rarete, cible: { type: 'heros', heros } };
}

/**
 * Les 16 skins de la caisse, dans l'ordre d'affichage. Raretés proposées : les quatre tours de base en Commun (on les voit tout le
 * temps), les trois avatars en Rare, les tours divines et les disciples « intermédiaires » en Épique, Mastoc et Brise-Os en Légendaire,
 * Lanterne en Mythique (mêmes paliers que leurs skins de la caisse de skins).
 */
export const DEFS_SKINS_MODERNES: readonly DefSkinModerne[] = [
  skinTour('caserne', 'commun'),
  skinTour('tir', 'commun'),
  skinTour('magie', 'commun'),
  skinTour('artillerie', 'commun'),
  skinDivine('plume', 'epique'),
  skinDivine('charlie', 'epique'),
  skinDivine('pollen', 'epique'),
  skinHeros('plume', 'rare'),
  skinHeros('charlie', 'rare'),
  skinHeros('pollen', 'rare'),
  skinHeros('suie', 'epique'),
  skinHeros('corbeau', 'epique'),
  skinHeros('rouage', 'epique'),
  skinHeros('mastoc', 'legendaire'),
  skinHeros('brise_os', 'legendaire'),
  skinHeros('lanterne', 'mythique'),
];

const PAR_ID: ReadonlyMap<string, DefSkinModerne> = new Map(DEFS_SKINS_MODERNES.map((d) => [d.id, d]));

/** Le skin du DLC de cet identifiant, ou undefined (jamais un nom hérité d'Object). */
export function defSkinModerne(id: string): DefSkinModerne | undefined {
  return PAR_ID.get(id);
}

export function estIdSkinModerne(x: unknown): x is string {
  return typeof x === 'string' && PAR_ID.has(x);
}

/** L'emplacement d'un skin du DLC : `tir`, `divine_plume`, `suie`. */
export function cibleDuSkinModerne(def: DefSkinModerne): CibleSkinModerne {
  if (def.cible.type === 'tour') return def.cible.famille;
  if (def.cible.type === 'divine') return `divine_${def.cible.dieu}`;
  return def.cible.heros;
}

/** Les emplacements, dans l'ordre : tours de base, tours divines, héros. */
export const CIBLES_SKIN_MODERNE: readonly CibleSkinModerne[] = [...FAMILLES_BASE, ...IDS_DIEUX.map((d) => `divine_${d}` as const), ...IDS_HEROS];

/** Le skin `skin` du DLC se porte-t-il sur `cible` ? */
export function skinModerneAcceptable(cible: string, skin: string): boolean {
  const def = defSkinModerne(skin);
  return def !== undefined && cibleDuSkinModerne(def) === cible;
}

// --- Titres ---------------------------------------------------------------------------------------------------

export type ConditionTitre =
  | { readonly type: 'niveau'; readonly niveau: number }
  | { readonly type: 'toutes_etoiles' }
  | { readonly type: 'tous_defis' };

export interface DefTitre {
  readonly id: string;
  /** Clés de texte du nom et de la condition (affichée tant que le titre n'est pas obtenu). */
  readonly nom: string;
  readonly condition: string;
  readonly regle: ConditionTitre;
}

function titre(id: string, regle: ConditionTitre): DefTitre {
  return { id, nom: `moderne.titre.${id}`, condition: `moderne.titre.${id}.condition`, regle };
}

/** Les titres, dans l'ordre d'affichage : les trois boss, puis les 3 étoiles partout, puis tous les défis. */
export const DEFS_TITRES_MODERNES: readonly DefTitre[] = [
  titre('fac_occupee', { type: 'niveau', niveau: NIVEAUX_PAR_REGION }),
  titre('cortege_de_tete', { type: 'niveau', niveau: 2 * NIVEAUX_PAR_REGION }),
  titre('prefecture_tombee', { type: 'niveau', niveau: 3 * NIVEAUX_PAR_REGION }),
  titre('mention_tres_bien', { type: 'toutes_etoiles' }),
  titre('greve_generale', { type: 'tous_defis' }),
];

export const CATALOGUE_MODERNE: CatalogueModerne = {
  skinsTours: DEFS_SKINS_MODERNES.filter((d) => d.cible.type !== 'heros').map((d) => d.id),
  skinsHeros: DEFS_SKINS_MODERNES.filter((d) => d.cible.type === 'heros').map((d) => d.id),
  titres: DEFS_TITRES_MODERNES.map((d) => d.id),
};

// --- Badges ---------------------------------------------------------------------------------------------------

/**
 * Badges gagnés en jouant le DLC (proposition à valider en revue), sur le modèle des braises des niveaux 101 à 150 : la première
 * victoire d'un niveau, une prime de plus à celle d'un boss (niveaux 10, 20, 30), la première fois que les 3 étoiles sont atteintes,
 * la première réussite de chaque défi. Tout le DLC avec ses 60 défis : 30 × 20 + 3 × 40 + 30 × 10 + 60 × 20 = 2 220 badges.
 */
export const BADGES_MODERNE = { premiereVictoire: 20, boss: 40, troisEtoiles: 10, defi: 20 } as const;

/** Prix d'une caisse « Temps modernes », en badges : 2 220 / 15 = 148 caisses, la moyenne qu'il faut pour finir la collection. */
export const PRIX_CAISSE_MODERNE = 15;

/** Ce que les règles des badges et des titres lisent de la campagne du DLC (la forme de `moderne.progression.etoiles` et `moderne.defis`). */
export interface EtatRecompensesModerne {
  readonly etoiles: Readonly<Record<string, Readonly<Partial<Record<string, number>>>>>;
  readonly defis: Readonly<Record<string, Readonly<Partial<Record<IdDefi, true>>>>>;
}

function propre<T>(objet: Readonly<Record<string, T>>, cle: string): T | undefined {
  return Object.hasOwn(objet, cle) ? objet[cle] : undefined;
}

function meilleuresEtoiles(etat: EtatRecompensesModerne, niveau: number): number {
  const parDifficulte = propre(etat.etoiles, String(niveau));
  if (!parDifficulte) return 0;
  return Math.max(0, ...Object.keys(parDifficulte).map((d) => propre(parDifficulte, d) ?? 0));
}

function defiReussi(etat: EtatRecompensesModerne, niveau: number, defi: IdDefi): boolean {
  const defis = propre(etat.defis, String(niveau));
  return defis !== undefined && Object.hasOwn(defis, defi) && defis[defi] === true;
}

/** Ce qu'une victoire a accompli pour la première fois, tel que la fin de partie le sait déjà. */
export interface FaitsVictoireModerne {
  /** Première victoire ordinaire du niveau. */
  readonly premiereVictoire: boolean;
  /** Première victoire ordinaire d'un boss (niveaux 10, 20, 30). */
  readonly boss: boolean;
  /** 3 étoiles atteintes pour la première fois. */
  readonly troisEtoiles: boolean;
  /** Défi réussi pour la première fois. */
  readonly defi: boolean;
}

/** Badges de ces faits : la seule table de montants (`BADGES_MODERNE`). La règle d'une victoire (quels faits) est dans `badgesDeLaVictoire` de `src/save/badges-moderne.ts`, la seule que la fin de partie appelle. */
export function badgesDesFaits(faits: FaitsVictoireModerne): number {
  return (
    (faits.premiereVictoire ? BADGES_MODERNE.premiereVictoire : 0) +
    (faits.boss ? BADGES_MODERNE.boss : 0) +
    (faits.troisEtoiles ? BADGES_MODERNE.troisEtoiles : 0) +
    (faits.defi ? BADGES_MODERNE.defi : 0)
  );
}

/** Tous les badges que le DLC peut rapporter : chaque niveau gagné à 3 étoiles, ses deux défis réussis. */
export function badgesDuDlcComplet(): number {
  const boss = Math.floor(NIVEAU_MAX_MODERNE / NIVEAUX_PAR_REGION);
  return (
    NIVEAU_MAX_MODERNE * (BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.troisEtoiles + IDS_DEFIS.length * BADGES_MODERNE.defi) +
    boss * BADGES_MODERNE.boss
  );
}

// --- Caisse ---------------------------------------------------------------------------------------------------

/** Les skins que la caisse peut donner à cette rareté, dans l'ordre du catalogue. */
export function skinsCaisseModerne(rarete: Rarete): readonly string[] {
  return DEFS_SKINS_MODERNES.filter((d) => d.rarete === rarete).map((d) => d.id);
}

/** Les raretés que la caisse peut donner (toutes : un test vérifie qu'aucune n'est vide, le tirage ne tombe jamais sur une vide). */
export function raretesCaisseModerne(): readonly Rarete[] {
  return RARETES.filter((rarete) => skinsCaisseModerne(rarete).length > 0);
}

// --- Titres mérités -------------------------------------------------------------------------------------------

function titreMerite(regle: ConditionTitre, etat: EtatRecompensesModerne): boolean {
  switch (regle.type) {
    case 'niveau':
      return meilleuresEtoiles(etat, regle.niveau) > 0;
    case 'toutes_etoiles':
      for (let n = 1; n <= NIVEAU_MAX_MODERNE; n++) if (meilleuresEtoiles(etat, n) < 3) return false;
      return true;
    case 'tous_defis':
      for (let n = 1; n <= NIVEAU_MAX_MODERNE; n++) if (!IDS_DEFIS.every((d) => defiReussi(etat, n, d))) return false;
      return true;
  }
}

/** Les titres que cette campagne du DLC mérite, dans l'ordre alphabétique (la forme de `moderne.titres`). */
export function titresMerites(etat: EtatRecompensesModerne): string[] {
  return DEFS_TITRES_MODERNES.filter((d) => titreMerite(d.regle, etat)).map((d) => d.id).sort();
}
