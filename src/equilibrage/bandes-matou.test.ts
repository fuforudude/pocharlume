// Bandes du Matou, pour chacun des trois dieux avec son avatar : le bot soigneux gagne tout mais pas sans perdre de vies
// (au moins une vie sur la moitié des niveaux) et sans laisser d'arêtes inutilisées (moins de 250 par niveau), le bot
// naïf gagne entre 30 et 70 %, le héros seul ne gagne jamais, la difficulté monte du niveau 1 au niveau 10, et les
// vies restantes du soigneux ne diffèrent pas de plus de 3 d'un dieu à l'autre.
import { beforeAll, describe, expect, it } from 'vitest';
import { ecartsBloquants, ecartsCourbe, ecartsEntreDieux, ecartsMatou, ecartsSansDefense } from './bandes';
import type { Evaluation } from './campagne';
import { DELAI_EVALUATION, evaluerRegion1 } from './bandes.test-utils';

let evaluations: Evaluation[] = [];
beforeAll(async () => {
  evaluations = await evaluerRegion1('matou');
}, DELAI_EVALUATION);

describe('bandes en Matou', () => {
  it('le soigneux gagne tout en perdant des vies sans laisser d’arêtes, le naïf gagne entre 30 et 70 %', () => {
    expect(ecartsBloquants(ecartsMatou(evaluations))).toEqual([]);
  });

  it('les trois dieux se valent : au plus 3 vies d’écart de vies restantes moyennes du soigneux', () => {
    expect(ecartsBloquants(ecartsEntreDieux(evaluations))).toEqual([]);
  });

  it('sans défense, on perd tous les niveaux', () => {
    expect(ecartsSansDefense(evaluations)).toEqual([]);
  });

  it('la difficulté monte : les vies restantes du bot naïf baissent (corrélation de rang ≤ −0,6), le niveau 10 est parmi les plus durs', () => {
    expect(ecartsBloquants(ecartsCourbe(evaluations))).toEqual([]);
  });
});
