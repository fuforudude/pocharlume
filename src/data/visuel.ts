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

export interface VisuelCarte {
  readonly region: number; // 1 à 10, choisit le jeu de tuiles
  readonly zones: readonly ZoneSol[];
  readonly decor: readonly Decor[];
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
