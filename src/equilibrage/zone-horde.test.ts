// La zone dans les niveaux de horde (jalon 5) : la composition avec zone gagne nettement plus que sans (au moins 20 points). Même mesure
// que zone-ordinaires.test.ts (`moyennesZone`, zone.ts), sur les niveaux de horde de l'échantillon.
import { beforeAll, describe, expect, it } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { DELAI_EVALUATION } from './bandes.test-utils';
import { DIEUX_EVALUES } from './campagne';
import { moyennesZone, NIVEAUX_ZONE_HORDE, type Composition } from './zone';

let moyennes: Record<Composition, number>;
beforeAll(() => {
  moyennes = moyennesZone(NIVEAUX_ZONE_HORDE, (n) => CAMPAGNE[n - 1]?.niveau, DIEUX_EVALUES);
}, DELAI_EVALUATION);

describe('la zone dans les niveaux de horde', () => {
  it('l’échantillon ne compte que des niveaux de horde', () => {
    expect(NIVEAUX_ZONE_HORDE.every((n) => CAMPAGNE[n - 1]?.horde === true)).toBe(true);
  });

  it('la composition avec zone gagne nettement plus que sans (au moins 20 points)', () => {
    expect(moyennes.zoneSeule).toBeGreaterThanOrEqual(moyennes.sansZone + 0.2);
  });
});
