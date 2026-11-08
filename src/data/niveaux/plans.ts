// Les plans des niveaux des 11 régions livrées (les 10 de l'histoire, puis la région 11 d'après l'histoire), dans l'ordre (indice 0 = région 1). Sans les vagues : ce fichier sert aussi à
// `npm run niveaux`, qui les génère.
import type { PlanNiveau } from './plan-niveau';
import { PLANS_REGION1 } from './plan-region1';
import { PLANS_REGION2 } from './plan-region2';
import { PLANS_REGION3 } from './plan-region3';
import { PLANS_REGION4 } from './plan-region4';
import { PLANS_REGION5 } from './plan-region5';
import { PLANS_REGION6 } from './plan-region6';
import { PLANS_REGION7 } from './plan-region7';
import { PLANS_REGION8 } from './plan-region8';
import { PLANS_REGION9 } from './plan-region9';
import { PLANS_REGION10 } from './plan-region10';
import { PLANS_REGION11 } from './plan-region11';

export const PLANS_REGIONS: readonly (readonly PlanNiveau[])[] = [PLANS_REGION1, PLANS_REGION2, PLANS_REGION3, PLANS_REGION4, PLANS_REGION5, PLANS_REGION6, PLANS_REGION7, PLANS_REGION8, PLANS_REGION9, PLANS_REGION10, PLANS_REGION11];
