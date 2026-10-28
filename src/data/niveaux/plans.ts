// Les plans des niveaux des 5 régions, dans l'ordre (indice 0 = région 1). Sans les vagues : ce fichier sert aussi à
// `npm run niveaux`, qui les génère.
import type { PlanNiveau } from './plan-niveau';
import { PLANS_REGION1 } from './plan-region1';
import { PLANS_REGION2 } from './plan-region2';
import { PLANS_REGION3 } from './plan-region3';
import { PLANS_REGION4 } from './plan-region4';
import { PLANS_REGION5 } from './plan-region5';

export const PLANS_REGIONS: readonly (readonly PlanNiveau[])[] = [PLANS_REGION1, PLANS_REGION2, PLANS_REGION3, PLANS_REGION4, PLANS_REGION5];
