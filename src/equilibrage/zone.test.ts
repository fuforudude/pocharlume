// La zone redevient une stratégie (jalon 5), mesurée par `mesurerZone` (zone.ts) sur un échantillon de niveaux, les trois dieux, avec
// 45 % des arêtes de départ en Vieux Sage (sans cela le soigneux gagne presque tout et les compositions ne se distinguent pas).
// Tolérances, sur des taux moyens de 18 à 54 parties par composition : « au moins autant » se lit « pas plus de 6 points de moins », et
// « gagne plus » se lit « au moins 10 points de plus ». La zone, en horde, doit valoir au moins 20 points.
import { beforeAll, describe, expect, it } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { DIEUX_EVALUES } from './campagne';
import { moyennesZone, NIVEAUX_ZONE_HORDE as NIVEAUX_HORDE, NIVEAUX_ZONE_ORDINAIRES as NIVEAUX_ORDINAIRES, type Composition } from './zone';

let ordinaires: Record<Composition, number>;
let hordes: Record<Composition, number>;
beforeAll(() => {
  const niveauDe = (n: number) => CAMPAGNE[n - 1]?.niveau;
  ordinaires = moyennesZone(NIVEAUX_ORDINAIRES, niveauDe, DIEUX_EVALUES);
  hordes = moyennesZone(NIVEAUX_HORDE, niveauDe, DIEUX_EVALUES);
}, 600_000);

describe('ce que vaut la zone', () => {
  it('niveaux ordinaires, sans caserne : la composition avec zone ne gagne pas plus que sans zone (à 6 points près)', () => {
    expect(NIVEAUX_ORDINAIRES.every((n) => CAMPAGNE[n - 1]?.horde === false)).toBe(true);
    expect(ordinaires.zoneSeule).toBeLessThanOrEqual(ordinaires.sansZone + 0.06);
  });

  it('niveaux ordinaires, avec caserne : bloquer puis frapper en zone gagne plus que sans zone (au moins 10 points)', () => {
    expect(ordinaires.casernePlusZone).toBeGreaterThanOrEqual(ordinaires.caserne + 0.1);
  });

  it('niveaux de horde : la composition avec zone gagne nettement plus que sans (au moins 20 points)', () => {
    expect(NIVEAUX_HORDE.every((n) => CAMPAGNE[n - 1]?.horde === true)).toBe(true);
    expect(hordes.zoneSeule).toBeGreaterThanOrEqual(hordes.sansZone + 0.2);
  });
});
