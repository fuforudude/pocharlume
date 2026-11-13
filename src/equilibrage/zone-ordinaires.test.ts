// La zone redevient une stratégie (jalon 5), niveaux ordinaires. Mesure par `moyennesZone` (zone.ts) : taux de victoire du soigneux, trois
// dieux, avec 45 % des arêtes de départ en Vieux Sage (sans cela le soigneux gagne presque tout et les compositions ne se distinguent
// pas). Tolérances, sur des taux moyens de 144 parties par composition (8 niveaux, 3 dieux, 6 graines) : « ne gagne pas plus » se lit « pas plus de 6 points de plus »,
// « gagne plus » se lit « au moins 10 points de plus ». Un fichier à part de la horde pour que Vitest les joue en parallèle. Lourd (environ 4 minutes seul) : hors de `npm run test`
// (exclu dans vite.config.ts), il ne tourne que par `npm run test:equilibrage`.
import { beforeAll, describe, expect, it } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { DELAI_EVALUATION } from './bandes.test-utils';
import { DIEUX_EVALUES } from './campagne';
import { moyennesZone, NIVEAUX_ZONE_ORDINAIRES, type Composition } from './zone';

let moyennes: Record<Composition, number>;
beforeAll(() => {
  moyennes = moyennesZone(NIVEAUX_ZONE_ORDINAIRES, (n) => CAMPAGNE[n - 1]?.niveau, DIEUX_EVALUES);
}, DELAI_EVALUATION);

describe('la zone dans les niveaux ordinaires', () => {
  it('l’échantillon ne compte aucun niveau de horde', () => {
    expect(NIVEAUX_ZONE_ORDINAIRES.every((n) => CAMPAGNE[n - 1]?.horde === false)).toBe(true);
  });

  it('sans caserne, la composition avec zone ne gagne pas plus que sans zone (à 6 points près)', () => {
    expect(moyennes.zoneSeule).toBeLessThanOrEqual(moyennes.sansZone + 0.06);
  });

  it('avec caserne, bloquer puis frapper en zone gagne plus que sans zone (au moins 10 points)', () => {
    expect(moyennes.casernePlusZone).toBeGreaterThanOrEqual(moyennes.caserne + 0.1);
  });
});
