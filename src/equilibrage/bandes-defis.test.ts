// Bandes des défis (jalon 3) sur chacune des régions 1 à 11 : le bot soigneux, avec les règles de Matou, réussit entre 40 et 90 % des
// parties de chaque défi (Héroïque : 1 vie et des groupes d'élite ; Fer : toutes les vagues en une et deux familles de tours),
// tous niveaux et trois dieux confondus.
import { beforeAll, describe, expect, it } from 'vitest';
import { ecartsDefis, ecartsSelonRegion } from './bandes';
import { DEFIS_EVALUES, type Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegions, REGIONS_DES_BANDES } from './bandes.test-utils';

const parDefi = new Map<string, Evaluation[][]>();
beforeAll(async () => {
  const [heroique, fer] = await Promise.all(DEFIS_EVALUES.map((defi) => evaluerRegions(defi)));
  parDefi.set('heroique', heroique ?? []);
  parDefi.set('fer', fer ?? []);
}, DELAI_EVALUATION);

describe.each(REGIONS_DES_BANDES)('bandes des défis, région %i', (region) => {
  it.each(DEFIS_EVALUES)('le soigneux réussit entre 40 et 90 %% des parties du défi %s', (defi) => {
    expect(ecartsSelonRegion(region, ecartsDefis(parDefi.get(defi)?.[region - 1] ?? []))).toEqual([]);
  });
});
