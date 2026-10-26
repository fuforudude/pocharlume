// Bandes du Vieux Sage, pour chacun des trois dieux avec son avatar : le bot soigneux gagne entre 60 et 85 % des parties,
// sans plus de 10 points d'écart d'un dieu à l'autre, et le héros seul ne gagne jamais.
import { beforeAll, describe, expect, it } from 'vitest';
import { ecartsEntreDieux, ecartsSansDefense, ecartsVieuxSage } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegion1 } from './bandes.test-utils';

let evaluations: Evaluation[] = [];
beforeAll(async () => {
  evaluations = await evaluerRegion1('vieux_sage');
}, DELAI_EVALUATION);

describe('bandes en Vieux Sage', () => {
  it('le bot soigneux gagne entre 60 et 85 % des niveaux', () => {
    expect(ecartsVieuxSage(evaluations)).toEqual([]);
  });

  it('aucun dieu ne dépasse de plus de 10 points le taux de victoire des autres', () => {
    expect(ecartsEntreDieux(evaluations)).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux', () => {
    expect(ecartsSansDefense(evaluations)).toEqual([]);
  });
});
