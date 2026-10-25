// Bandes du Vieux Sage : le bot soigneux gagne au moins 80 % des parties, le héros seul ne gagne jamais.
import { beforeAll, describe, expect, it } from 'vitest';
import { ecartsSansDefense, ecartsVieuxSage } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegion1 } from './bandes.test-utils';

let evaluations: Evaluation[] = [];
beforeAll(() => {
  evaluations = evaluerRegion1('vieux_sage');
}, DELAI_EVALUATION);

describe('bandes en Vieux Sage', () => {
  it('le bot soigneux gagne au moins 80 % des niveaux', () => {
    expect(ecartsVieuxSage(evaluations)).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux', () => {
    expect(ecartsSansDefense(evaluations)).toEqual([]);
  });
});
