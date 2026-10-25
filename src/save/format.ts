// Format de la sauvegarde : le document unique que le jeu écrit dans le stockage. Versionné dès la v1 : un
// changement de format ajoute une migration (migrations.ts), il ne casse jamais une sauvegarde existante.
//
// Historique :
// - v1 : étoiles sans distinction de difficulté, volumes en fractions (0 à 1), pas de vitesse par défaut.
//        (Format du prototype du jalon 1, gardé en fixture pour tester la chaîne de migrations.)
// - v2 : étoiles par niveau et par difficulté, volumes en pourcentages entiers, vitesse par défaut.
import type { ConfigPartie } from '../engine/etat';

export const VERSION_SAUVEGARDE = 2;

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

export interface Sauvegarde {
  version: typeof VERSION_SAUVEGARDE;
  progression: Progression;
  reglages: Reglages;
  partie: PartieEnCours | null;
}

export const REGLAGES_PAR_DEFAUT: Readonly<Reglages> = { son: 80, musique: 60, vitesse: 1 };

/** Sauvegarde d'un nouveau joueur : le niveau 1 est ouvert, rien n'est réussi. */
export function sauvegardeVide(): Sauvegarde {
  return {
    version: VERSION_SAUVEGARDE,
    progression: { niveauMax: 1, etoiles: {} },
    reglages: { ...REGLAGES_PAR_DEFAUT },
    partie: null,
  };
}
