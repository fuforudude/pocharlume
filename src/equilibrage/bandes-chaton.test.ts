// Bandes du Chaton (spec, « Système d'équilibrage ») sur chacune des régions 1 à 11 : le bot naïf gagne tous les niveaux, et le héros
// seul ne suffit pas à partir du niveau 2.
import { beforeAll, describe, expect, it } from 'vitest';
import { ecartsChaton, ecartsSelonRegion, ecartsSansDefense } from './bandes';
import type { Evaluation } from './campagne';
import { CAMPAGNE_DES_BANDES, DELAI_EVALUATION, evaluerRegions, REGIONS_DES_BANDES } from './bandes.test-utils';

let parRegion: Evaluation[][] = [];
beforeAll(async () => {
  parRegion = await evaluerRegions('chaton', ['naif', 'inactif']);
}, DELAI_EVALUATION);

describe.each(REGIONS_DES_BANDES)(`bandes en Chaton, ${CAMPAGNE_DES_BANDES}, région %i`, (region) => {
  it('le bot naïf gagne 100 % des niveaux', () => {
    expect(ecartsSelonRegion(region, ecartsChaton(parRegion[region - 1] ?? []), CAMPAGNE_DES_BANDES)).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux à partir du niveau 2', () => {
    expect(ecartsSelonRegion(region, ecartsSansDefense(parRegion[region - 1] ?? []), CAMPAGNE_DES_BANDES)).toEqual([]);
  });
});
