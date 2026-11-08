// La campagne des régions 1 à 10 : 100 niveaux numérotés de 1 à 100, assemblés depuis leur plan (plans.ts), leur carte
// (cartes-toutes.ts) et leurs vagues figées (vagues-region<N>.ts, générées par `npm run niveaux`). La région 1 est aussi
// exportée par region1.ts avec son niveau de test.
import type { Vague } from '../../engine/definitions';
import type { NiveauCampagne } from '../visuel';
import { assemblerNiveau } from './assemblage';
import type { PlanNiveau } from './plan-niveau';
import { PLANS_REGIONS } from './plans';
import { REGION1, TEXTES_REGION1, type TextesNiveau } from './region1';
import { VAGUES_REGION1 } from './vagues-region1';
import { VAGUES_REGION2 } from './vagues-region2';
import { VAGUES_REGION3 } from './vagues-region3';
import { VAGUES_REGION4 } from './vagues-region4';
import { VAGUES_REGION5 } from './vagues-region5';
import { VAGUES_REGION6 } from './vagues-region6';
import { VAGUES_REGION7 } from './vagues-region7';
import { VAGUES_REGION8 } from './vagues-region8';
import { VAGUES_REGION9 } from './vagues-region9';
import { VAGUES_REGION10 } from './vagues-region10';

/** Les vagues figées de chaque région, dans l'ordre de leurs plans (indice 0 = région 1). */
export const VAGUES_REGIONS: readonly (readonly (readonly Vague[])[])[] = [
  VAGUES_REGION1,
  VAGUES_REGION2,
  VAGUES_REGION3,
  VAGUES_REGION4,
  VAGUES_REGION5,
  VAGUES_REGION6,
  VAGUES_REGION7,
  VAGUES_REGION8,
  VAGUES_REGION9,
  VAGUES_REGION10,
];

export function construireRegion(plans: readonly PlanNiveau[], vagues: readonly (readonly Vague[])[]): readonly NiveauCampagne[] {
  return plans.map((plan, i) => {
    const vaguesDuNiveau = vagues[i];
    if (!vaguesDuNiveau) throw new Error(`Vagues figées manquantes pour le niveau ${String(plan.numero)} : relancer npm run niveaux`);
    return assemblerNiveau(plan, vaguesDuNiveau);
  });
}

/** Les niveaux de chaque région, dans l'ordre (indice 0 = région 1), chacun avec son numéro de campagne. */
export const REGIONS: readonly (readonly NiveauCampagne[])[] = PLANS_REGIONS.map((plans, i) => (i === 0 ? REGION1 : construireRegion(plans, VAGUES_REGIONS[i] ?? [])));

/** Les 100 niveaux des régions 1 à 10, dans l'ordre. */
export const CAMPAGNE: readonly NiveauCampagne[] = REGIONS.flat();

/** Le niveau de campagne de ce numéro (1 à 150), ou `undefined`. */
export function niveauDeCampagne(numero: number): NiveauCampagne | undefined {
  return CAMPAGNE[numero - 1];
}

export const TEXTES_REGIONS: readonly (readonly TextesNiveau[])[] = PLANS_REGIONS.map((plans, i) =>
  i === 0 ? TEXTES_REGION1 : plans.map((p) => ({ numero: p.numero, nom: p.nom, ambiance: p.ambiance })),
);
