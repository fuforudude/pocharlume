// La campagne « Temps modernes » (le DLC) : 3 régions de 10 niveaux, numérotés de 1 à 30 dans leur campagne. Vide pour l'instant :
// l'agent du contenu remplira `CAMPAGNE_MODERNE` (niveaux assemblés, chacun avec `campagne: 'moderne'` ici et dans `niveau`), puis
// les nœuds, le tracé et les textes de chaque région de la carte du monde. Tant qu'une région n'a pas ses 10 niveaux, ses 10 nœuds,
// son tracé et ses textes, la carte du DLC l'annonce « à venir » (src/ui/regions-monde.ts), sans planter.
import type { Point } from '../../engine/definitions';
import { NIVEAUX_PAR_REGION } from '../meta';
import { NOMBRE_REGIONS_MODERNE } from '../campagnes';
import type { NiveauCampagne } from '../visuel';
import type { NoeudNiveau } from './carte-du-monde';
import type { TextesNiveau } from './region1';

/** Les niveaux du DLC, dans l'ordre (indice 0 = niveau 1). */
export const CAMPAGNE_MODERNE: readonly NiveauCampagne[] = [];

/** Les niveaux de chaque région du DLC (indice 0 = la Fac), d'après leur numéro. */
export const REGIONS_MODERNE: readonly (readonly NiveauCampagne[])[] = Array.from({ length: NOMBRE_REGIONS_MODERNE }, (_, i) =>
  CAMPAGNE_MODERNE.filter((n) => Math.floor((n.numero - 1) / NIVEAUX_PAR_REGION) === i),
);

/** Nœuds de la carte du monde de chaque région du DLC (numéros 1 à 10 dans la région) : vides tant que le contenu n'est pas livré. */
export const NOEUDS_REGIONS_MODERNE: readonly (readonly NoeudNiveau[])[] = [[], [], []];
/** Tracé de la route de chaque région du DLC (9 tronçons par région livrée). */
export const TRACES_REGIONS_MODERNE: readonly (readonly (readonly Point[])[])[] = [[], [], []];
/** Nom et phrase d'ambiance de chaque niveau, par région (numéros du DLC, 1 à 30). */
export const TEXTES_REGIONS_MODERNE: readonly (readonly TextesNiveau[])[] = [[], [], []];

/** Le niveau du DLC de ce numéro (1 à 30), ou `undefined` s'il n'est pas livré. */
export function niveauModerne(numero: number): NiveauCampagne | undefined {
  return CAMPAGNE_MODERNE.find((n) => n.numero === numero);
}
