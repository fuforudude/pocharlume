// Format de la sauvegarde : le document unique que le jeu écrit dans le stockage. Versionné dès la v1 : un
// changement de format ajoute une migration (migrations.ts), il ne casse jamais une sauvegarde existante.
//
// Historique :
// - v1 : étoiles sans distinction de difficulté, volumes en fractions (0 à 1), pas de vitesse par défaut.
//        (Format du prototype du jalon 1, gardé en fixture pour tester la chaîne de migrations.)
// - v2 : étoiles par niveau et par difficulté, volumes en pourcentages entiers, vitesse par défaut.
// - v3 : méta-progression (`meta`) : arêtes et braises, héros possédés avec leur expérience et leurs compétences,
//        rangs de l'arbre d'améliorations, stock d'objets, dernier choix de dieu, de héros et d'objets.
// - v4 : (dans `meta`) région la plus haute ouverte, défis réussis par niveau, collection (objets possédés et rangs, éclats,
//        compteurs de garantie par caisse, skins et familiers équipés).
// - v5 : (dans `meta`) mode infini : record par carte (dernière vague terminée) et paliers déjà payés.
import { AVATARS, BRANCHES_ARBRE, coutCumuleArbre, IDS_OBJETS, type IdBranche, type IdDefi, type IdDieu, type IdHeros, type IdObjet, type PalierInfini } from '../data/meta';
import type { ConfigPartie } from '../engine/etat';
import { collectionVide, type Collection } from '../meta/collection';

export const VERSION_SAUVEGARDE = 5;

/** Nombre de niveaux de la campagne (10 régions de 10 niveaux). */
export const NOMBRE_NIVEAUX = 100;

/** Difficultés, dans l'ordre d'affichage. Mêmes clés que src/data/difficultes.ts (vérifié par un test). */
export const DIFFICULTES_SAUVEGARDE = ['chaton', 'matou', 'vieux_sage'] as const;
export type DifficulteSauvegarde = (typeof DIFFICULTES_SAUVEGARDE)[number];

export type Etoiles = 1 | 2 | 3;
export type VitesseJeu = 1 | 2;

/** Meilleures étoiles d'un niveau, par difficulté (absente = jamais réussi dans cette difficulté). */
export type EtoilesNiveau = Partial<Record<DifficulteSauvegarde, Etoiles>>;

export interface Progression {
  /** Plus grand numéro de niveau jouable (1 à 100) : réussir le niveau N débloque N + 1. */
  niveauMax: number;
  /** Clé : numéro du niveau en chiffres ("1" à "100"). Seuls les niveaux réussis y figurent. */
  etoiles: Record<string, EtoilesNiveau>;
}

export interface Reglages {
  /** Volume des bruitages, entier de 0 à 100. */
  son: number;
  /** Volume de la musique, entier de 0 à 100. */
  musique: number;
  /** Vitesse de jeu choisie par défaut au lancement d'un niveau. */
  vitesse: VitesseJeu;
}

/**
 * Partie interrompue, pour « Reprendre à la vague N ». L'état est pris juste après le lancement de la vague
 * `vague` (voir `partieEnCours` dans partie.ts).
 */
export interface PartieEnCours {
  /** Numéro du niveau de campagne (1 à 100). */
  niveau: number;
  config: ConfigPartie;
  /** `serialiser(etat)` du moteur, au début de la vague. */
  etat: string;
  /** Numéro (à partir de 1) de la vague qui vient de commencer. */
  vague: number;
}

export interface Monnaies {
  /** Arêtes hors partie : achètent les objets consommables. */
  aretes: number;
  /** Braises : achètent les disciples. */
  braises: number;
}

/** Ce que la sauvegarde retient d'un héros possédé. */
export interface ProgressionHeros {
  /** Expérience gagnée (le niveau s'en déduit avec les seuils de `src/data/heros.ts`). */
  xp: number;
  /** Rang (1 à 3) de chaque compétence où un point est placé. Une compétence sans point est absente. */
  competences: Record<string, number>;
}

/** Le dernier choix du joueur avant un niveau, proposé de nouveau la fois suivante. */
export interface ChoixPartie {
  dieu: IdDieu;
  heros: IdHeros;
  /** Objets emportés (3 au plus, un par emplacement ; un même objet peut occuper plusieurs emplacements). */
  objets: IdObjet[];
}

/** Défis réussis sur un niveau (chacun a rapporté ses braises, une seule fois). */
export type DefisNiveau = Partial<Record<IdDefi, true>>;

/**
 * Mode infini. Le record est la dernière vague terminée sur une carte (clé : identifiant de la carte) ; seules les cartes
 * jouées y figurent. Les paliers payés sont globaux, toutes cartes confondues, rangés dans l'ordre croissant : chacun
 * n'a rapporté ses arêtes et ses braises qu'une fois.
 */
export interface Infini {
  records: Record<string, number>;
  paliers: PalierInfini[];
}

/**
 * Méta-progression. Les étoiles dépensées dans l'arbre ne sont pas stockées : on retient les rangs, et les étoiles
 * disponibles se déduisent (étoiles gagnées moins coût des rangs), si bien qu'une réinitialisation les rend toutes.
 */
export interface Meta {
  monnaies: Monnaies;
  /** Héros possédés (les trois avatars dès le départ). Un héros absent n'est pas possédé. */
  heros: Partial<Record<IdHeros, ProgressionHeros>>;
  /** Rang (0 à 5) de chaque branche de l'arbre. */
  arbre: Record<IdBranche, number>;
  /** Stock de chaque objet consommable (0 à 10). */
  objets: Record<IdObjet, number>;
  choix: ChoixPartie;
  /**
   * Plus haute région ouverte (1 à 10) : la région r + 1 s'ouvre quand le boss de la région r est battu. Toujours égale
   * à `regionOuverte(progression.niveauMax)` (la validation le vérifie) ; rangée pour que l'interface la lise sans calcul.
   */
  regionMax: number;
  /** Défis réussis, par numéro de niveau en chiffres. Seul un niveau à 3 étoiles peut en avoir. */
  defis: Record<string, DefisNiveau>;
  collection: Collection;
  infini: Infini;
}

export interface Sauvegarde {
  version: typeof VERSION_SAUVEGARDE;
  progression: Progression;
  reglages: Reglages;
  meta: Meta;
  partie: PartieEnCours | null;
}

export const REGLAGES_PAR_DEFAUT: Readonly<Reglages> = { son: 80, musique: 60, vitesse: 1 };

/** Méta-progression d'un nouveau joueur : rien en poche, les trois avatars, Charlie au choix. */
export function metaParDefaut(): Meta {
  const heros: Meta['heros'] = {};
  for (const avatar of AVATARS) heros[avatar] = { xp: 0, competences: {} };
  return {
    monnaies: { aretes: 0, braises: 0 },
    heros,
    arbre: Object.fromEntries(BRANCHES_ARBRE.map((b) => [b, 0])) as Record<IdBranche, number>,
    objets: Object.fromEntries(IDS_OBJETS.map((o) => [o, 0])) as Record<IdObjet, number>,
    choix: { dieu: 'charlie', heros: 'charlie', objets: [] },
    regionMax: 1,
    defis: {},
    collection: collectionVide(),
    infini: { records: {}, paliers: [] },
  };
}

/** Sauvegarde d'un nouveau joueur : le niveau 1 est ouvert, rien n'est réussi. */
export function sauvegardeVide(): Sauvegarde {
  return {
    version: VERSION_SAUVEGARDE,
    progression: { niveauMax: 1, etoiles: {} },
    reglages: { ...REGLAGES_PAR_DEFAUT },
    meta: metaParDefaut(),
    partie: null,
  };
}

/** Total des étoiles gagnées : meilleur résultat par niveau, toutes difficultés confondues (300 au plus). */
export function etoilesGagnees(progression: Progression): number {
  let total = 0;
  for (const niveau of Object.values(progression.etoiles)) {
    total += Math.max(0, ...DIFFICULTES_SAUVEGARDE.map((d) => niveau[d] ?? 0));
  }
  return total;
}

/** Étoiles dépensées par les rangs de l'arbre (le rang n d'une branche a coûté 1 + 2 + … + n). */
export function etoilesDepensees(arbre: Readonly<Record<IdBranche, number>>): number {
  return BRANCHES_ARBRE.reduce((somme, branche) => somme + coutCumuleArbre(arbre[branche]), 0);
}
