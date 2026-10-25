// Bandes du Matou : le bot soigneux gagne tout, le bot naïf entre 50 et 90 %, le héros seul ne gagne jamais,
// et la difficulté monte du niveau 1 au niveau 10.
import { beforeAll, describe, expect, it } from 'vitest';
import { correlationDeRang, courbeDifficulte, ecartsMatou, ecartsSansDefense } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegion1 } from './bandes.test-utils';

let evaluations: Evaluation[] = [];
beforeAll(() => {
  evaluations = evaluerRegion1('matou');
}, DELAI_EVALUATION);

describe('bandes en Matou', () => {
  it('le bot soigneux gagne 100 % des niveaux, le bot naïf entre 50 et 90 %, et tous les niveaux ne se gagnent pas sans perte', () => {
    expect(ecartsMatou(evaluations)).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux', () => {
    expect(ecartsSansDefense(evaluations)).toEqual([]);
  });

  it('la difficulté monte : les vies restantes du bot naïf baissent globalement, le niveau 10 est le plus dur', () => {
    const courbe = courbeDifficulte(evaluations);
    expect(courbe.length).toBe(10);
    expect(correlationDeRang(courbe)).toBeLessThanOrEqual(-0.6);
    const dernier = courbe[9]?.vies ?? 0;
    const premiers = courbe.slice(0, 5).map((c) => c.vies);
    expect(dernier).toBeLessThan(Math.min(...premiers));
  });
});
