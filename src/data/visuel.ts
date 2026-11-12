// Habillage d'une carte : ce que le rendu dessine en plus de ce que le moteur simule.
// Le moteur ne lit jamais ce fichier. Coordonnées en tuiles, comme la carte du moteur.

import type { IdCampagne, Niveau } from '../engine/definitions';
import type { StatueCarte } from './niveaux/statues';

/** Un élément de décor, posé par son ancre (le pied) au point (x, y). */
export interface Decor {
  readonly sprite: string; // nom dans public/sprites/atlas.json (catégorie decor ou tuile)
  readonly x: number;
  readonly y: number;
  readonly miroir?: boolean;
}

/** Un rectangle de sol (en tuiles entières) qui remplace l'herbe par un autre revêtement. */
export interface ZoneSol {
  readonly sol: 'boue' | 'paves';
  readonly x: number;
  readonly y: number;
  readonly largeur: number;
  readonly hauteur: number;
}

/**
 * Jeux de tuiles du DLC « Temps modernes » : au-delà des régions de l'histoire, le `region` du visuel d'une carte du DLC désigne son jeu
 * (tuiles préfixées, dans l'atlas du DLC, art/dlc-moderne/decor/). Les régions 1 à 15 gardent leurs noms (`herbe-1`, `r2-herbe-1`…).
 */
export const REGION_VISUELLE_FAC = 101;
export const PREFIXES_TUILES_MODERNE: Readonly<Record<number, string>> = { [REGION_VISUELLE_FAC]: 'moderne-fac' };

/** Un étudiant figurant de la mise en scène vivante, sur une case (cases de la grille, toujours interdites à la construction). */
export interface CaseScene {
  readonly cx: number;
  readonly cy: number;
}

/**
 * Mise en scène vivante d'une carte du DLC (rendu seulement, src/render/scene-vivante.ts) : des groupes d'étudiants en décor qui scandent,
 * des banderoles tendues entre deux montants, des fumigènes d'ambiance. Les cases des groupes et des banderoles sont interdites à la
 * construction (elles comptent comme un grand décor, à l'assemblage) ; les fumigènes ne bloquent rien.
 */
export interface SceneVivante {
  readonly groupes: readonly CaseScene[];
  /** Banderole posée sur `largeur` cases à partir de (cx, cy), vers l'est. */
  readonly banderoles: readonly (CaseScene & { readonly largeur: number; readonly couleur: number })[];
  /** Fumigène : point du sol en tuiles, couleur (indice de la palette des fumées du rendu). */
  readonly fumigenes: readonly { readonly x: number; readonly y: number; readonly couleur: number }[];
}

export interface VisuelCarte {
  /** 1 à 15 pour l'histoire, `REGION_VISUELLE_FAC`… pour le DLC : choisit le jeu de tuiles. */
  readonly region: number;
  readonly zones: readonly ZoneSol[];
  readonly decor: readonly Decor[];
  /** Mise en scène vivante (DLC) ; absente = aucune. */
  readonly scene?: SceneVivante;
  /**
   * La vieille statue cachée de la carte (son sprite est déjà dans `decor`) : l'interface la rend touchable pendant la partie.
   * Absente d'une carte sans inscription (niveau de test).
   */
  readonly statue?: StatueCarte;
}

/** Un niveau de campagne : la partie simulée, son habillage et sa place dans la région. */
export interface NiveauCampagne {
  /** Numéro dans sa campagne : 1 à 150 pour l'histoire, 1 à 30 pour Temps modernes. */
  readonly numero: number;
  /** Campagne du niveau ; absente = l'histoire. Un niveau du DLC porte `moderne`, ici et dans `niveau.campagne`. */
  readonly campagne?: IdCampagne;
  readonly niveau: Niveau;
  readonly visuel: VisuelCarte;
  readonly boss: boolean;
  /** Niveau de horde (jalon 5) : beaucoup d'ennemis faibles et serrés, là où la zone brille. */
  readonly horde: boolean;
}
