// Toutes les cartes du DLC « Temps modernes », par identifiant : celles de chaque région (cartes-moderne-r<N>.ts) réunies, pour que les
// plans (plan-moderne-r<N>.ts) et l'assemblage (assemblage-moderne.ts) désignent une carte de n'importe quelle région.
import { CARTES_MODERNE_R1, type CarteModerne } from './cartes-moderne-r1';
import { CARTES_MODERNE_R3 } from './cartes-moderne-r3';

export const CARTES_MODERNE = { ...CARTES_MODERNE_R1, ...CARTES_MODERNE_R3 } as const satisfies Record<string, CarteModerne>;

export type IdCarteModerne = keyof typeof CARTES_MODERNE;
