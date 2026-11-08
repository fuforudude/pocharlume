// Bandes du Vieux Sage sur chacune des régions 1 à 11, pour chacun des trois dieux avec son avatar : le bot soigneux gagne entre 60 et
// 85 % des parties, sans plus de 10 points d'écart d'un dieu à l'autre, et le héros seul ne gagne jamais.
import { beforeAll, describe, expect, it } from 'vitest';
import { SUSPENDUES_IMPOSEES, ecartsBloquants, ecartsSelonRegion, ecartsEntreDieux, ecartsSansDefense, ecartsVieuxSage } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegions, REGIONS_EVALUEES } from './bandes.test-utils';

let parRegion: Evaluation[][] = [];
// Les bandes de cette difficulté sont suspendues (bandes.ts) : sans `BANDES_SUSPENDUES_IMPOSEES=1`, seul le héros sans défense est joué.
beforeAll(async () => {
  parRegion = await evaluerRegions('vieux_sage', SUSPENDUES_IMPOSEES ? undefined : ['inactif']);
}, DELAI_EVALUATION);

describe.each(REGIONS_EVALUEES)('bandes en Vieux Sage, région %i', (region) => {
  it.skipIf(!SUSPENDUES_IMPOSEES)('le bot soigneux gagne entre 60 et 85 % des niveaux', () => {
    expect(ecartsSelonRegion(region, ecartsBloquants(ecartsVieuxSage(parRegion[region - 1] ?? [])))).toEqual([]);
  });

  it.skipIf(!SUSPENDUES_IMPOSEES)('aucun dieu ne dépasse de plus de 10 points le taux de victoire des autres', () => {
    expect(ecartsSelonRegion(region, ecartsBloquants(ecartsEntreDieux(parRegion[region - 1] ?? [])))).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux', () => {
    expect(ecartsSelonRegion(region, ecartsSansDefense(parRegion[region - 1] ?? []))).toEqual([]);
  });
});
