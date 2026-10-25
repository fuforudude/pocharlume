// Bandes du Matou : le bot soigneux gagne tout mais pas sans perdre de vies (au moins une vie sur la moitié des
// niveaux) et sans laisser d'arêtes inutilisées (moins de 250 par niveau), le bot naïf gagne entre 30 et 70 %,
// le héros seul ne gagne jamais, et la difficulté monte du niveau 1 au niveau 10.
import { beforeAll, describe, expect, it } from 'vitest';
import { ecartsCourbe, ecartsMatou, ecartsSansDefense } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegion1 } from './bandes.test-utils';

let evaluations: Evaluation[] = [];
beforeAll(() => {
  evaluations = evaluerRegion1('matou');
}, DELAI_EVALUATION);

describe('bandes en Matou', () => {
  it('le soigneux gagne tout en perdant des vies sans laisser d’arêtes, le naïf gagne entre 30 et 70 %', () => {
    expect(ecartsMatou(evaluations)).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux', () => {
    expect(ecartsSansDefense(evaluations)).toEqual([]);
  });

  it('la difficulté monte : les vies restantes du bot naïf baissent (corrélation de rang ≤ −0,6), le niveau 10 est parmi les plus durs', () => {
    expect(ecartsCourbe(evaluations)).toEqual([]);
  });
});
