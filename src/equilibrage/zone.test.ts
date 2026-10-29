// La zone redevient une stratégie (jalon 5), mesurée par `mesurerZone` (zone.ts) sur un échantillon de niveaux, les trois dieux, avec
// 45 % des arêtes de départ en Vieux Sage (sans cela le soigneux gagne presque tout et les compositions ne se distinguent pas).
// Tolérances, sur des taux moyens de 18 à 54 parties par composition : « au moins autant » se lit « pas plus de 6 points de moins », et
// « gagne plus » se lit « au moins 10 points de plus ». La zone, en horde, doit valoir au moins 20 points.
import { beforeAll, describe, expect, it } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { DIEUX_EVALUES } from './campagne';
import { COMPOSITIONS, mesurerZone, type Composition } from './zone';

const PART_ARETES = 0.45;
/** Niveaux ordinaires (1 à 3 : régions 1, 2 et 3) et niveaux de horde, un échantillon de la campagne. */
const NIVEAUX_ORDINAIRES = [5, 8, 14, 18, 25];
const NIVEAUX_HORDE = [7, 13, 17];
const GRAINES = [101, 102, 103, 104, 105, 106];

function moyennes(niveaux: readonly number[]): Record<Composition, number> {
  const taux: Record<Composition, number[]> = { sansZone: [], zoneSeule: [], caserne: [], casernePlusZone: [] };
  for (const numero of niveaux) {
    const niveau = CAMPAGNE[numero - 1];
    if (!niveau) throw new Error(`Niveau ${String(numero)} absent`);
    for (const dieu of DIEUX_EVALUES) {
      for (const m of mesurerZone(niveau.niveau, { dieu, difficulte: 'vieux_sage', partAretes: PART_ARETES, graines: GRAINES, grainesEntrainement: [9001] })) taux[m.composition].push(m.tauxVictoire);
    }
  }
  const moyenne = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  return Object.fromEntries(COMPOSITIONS.map((c) => [c, moyenne(taux[c])])) as Record<Composition, number>;
}

let ordinaires: Record<Composition, number>;
let hordes: Record<Composition, number>;
beforeAll(() => {
  ordinaires = moyennes(NIVEAUX_ORDINAIRES);
  hordes = moyennes(NIVEAUX_HORDE);
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
