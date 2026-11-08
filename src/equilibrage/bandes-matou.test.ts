// Bandes du Matou sur chacune des régions 1 à 11, pour chacun des trois dieux avec son avatar : le bot soigneux gagne tout mais pas
// sans perdre de vies (au moins une vie sur la moitié des niveaux) et sans laisser d'arêtes inutilisées (moins de 250 par niveau), le
// bot naïf gagne entre 30 et 70 %, le héros seul ne gagne jamais, la difficulté monte du niveau 1 au niveau 10 de la région, et les
// vies restantes du soigneux ne diffèrent pas de plus de 3 d'un dieu à l'autre.
import { beforeAll, describe, expect, it } from 'vitest';
import { SUSPENDUES_IMPOSEES, ecartsBloquants, ecartsCourbe, ecartsSelonRegion, ecartsEntreDieux, ecartsMatou, ecartsSansDefense } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegions, REGIONS_EVALUEES } from './bandes.test-utils';

let parRegion: Evaluation[][] = [];
// Les bandes de cette difficulté sont suspendues (bandes.ts) : sans `BANDES_SUSPENDUES_IMPOSEES=1`, seul le héros sans défense est joué.
beforeAll(async () => {
  parRegion = await evaluerRegions('matou', SUSPENDUES_IMPOSEES ? undefined : ['inactif']);
}, DELAI_EVALUATION);

describe.each(REGIONS_EVALUEES)('bandes en Matou, région %i', (region) => {
  it.skipIf(!SUSPENDUES_IMPOSEES)('le soigneux gagne tout en perdant des vies sans laisser d’arêtes, le naïf gagne entre 30 et 70 %', () => {
    expect(ecartsSelonRegion(region, ecartsBloquants(ecartsMatou(parRegion[region - 1] ?? [])))).toEqual([]);
  });

  it.skipIf(!SUSPENDUES_IMPOSEES)('les trois dieux se valent : au plus 3 vies d’écart de vies restantes moyennes du soigneux', () => {
    expect(ecartsSelonRegion(region, ecartsBloquants(ecartsEntreDieux(parRegion[region - 1] ?? [])))).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux', () => {
    expect(ecartsSelonRegion(region, ecartsSansDefense(parRegion[region - 1] ?? []))).toEqual([]);
  });

  it.skipIf(!SUSPENDUES_IMPOSEES)('la difficulté monte : les vies restantes du bot naïf baissent (corrélation de rang ≤ −0,6), le niveau 10 est parmi les plus durs', () => {
    expect(ecartsSelonRegion(region, ecartsBloquants(ecartsCourbe(parRegion[region - 1] ?? [])))).toEqual([]);
  });
});
