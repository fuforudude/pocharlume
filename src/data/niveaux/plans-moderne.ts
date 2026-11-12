// Les plans de tous les niveaux livrés du DLC « Temps modernes » et leurs vagues figées, alignés (même indice), dans l'ordre des numéros :
// pour les vérifications qui parcourent tout le DLC (corrections-fac.test.ts, outils).
import type { Vague } from '../../engine/definitions';
import { PLANS_MODERNE_R1, type PlanNiveauModerne } from './plan-moderne-r1';
import { PLANS_MODERNE_R2 } from './plan-moderne-r2';
import { PLANS_MODERNE_R3 } from './plan-moderne-r3';
import { VAGUES_MODERNE_R1 } from './vagues-moderne-r1';
import { VAGUES_MODERNE_R2 } from './vagues-moderne-r2';
import { VAGUES_MODERNE_R3 } from './vagues-moderne-r3';

export const PLANS_MODERNE: readonly PlanNiveauModerne<string>[] = [...PLANS_MODERNE_R1, ...PLANS_MODERNE_R2, ...PLANS_MODERNE_R3];
export const VAGUES_MODERNE: readonly (readonly Vague[])[] = [...VAGUES_MODERNE_R1, ...VAGUES_MODERNE_R2, ...VAGUES_MODERNE_R3];
