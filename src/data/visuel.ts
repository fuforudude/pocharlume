// Habillage d'une carte : ce que le rendu dessine en plus de ce que le moteur simule.
// Le moteur ne lit jamais ce fichier. Coordonnées en tuiles, comme la carte du moteur.

import type { Niveau } from '../engine/definitions';

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
}

/** Un niveau de campagne : la partie simulée, son habillage et sa place dans la région. */
export interface NiveauCampagne {
  readonly numero: number; // 1 à 100
  readonly niveau: Niveau;
  readonly visuel: VisuelCarte;
  readonly boss: boolean;
  /** Niveau de horde (jalon 5) : beaucoup d'ennemis faibles et serrés, là où la zone brille. */
  readonly horde: boolean;
}
