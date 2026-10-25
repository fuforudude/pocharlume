// Bandes du Chaton (spec, « Système d'équilibrage ») : le bot naïf gagne tous les niveaux, et le héros seul
// ne suffit pas à partir du niveau 2.
import { beforeAll, describe, expect, it } from 'vitest';
import { ecartsChaton, ecartsSansDefense } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegion1 } from './bandes.test-utils';

let evaluations: Evaluation[] = [];
beforeAll(() => {
  evaluations = evaluerRegion1('chaton');
}, DELAI_EVALUATION);

describe('bandes en Chaton', () => {
  it('le bot naïf gagne 100 % des niveaux', () => {
    expect(ecartsChaton(evaluations)).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux à partir du niveau 2', () => {
    expect(ecartsSansDefense(evaluations)).toEqual([]);
  });
});
