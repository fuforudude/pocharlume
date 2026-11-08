// Assemblage d'un niveau : le trajet d'un radeau est interdit à la construction.
import { describe, expect, it } from 'vitest';
import type { GimmickRadeau } from '../../engine/definitions';
import { casesDuTrajet } from '../../engine/gimmicks/radeau';
import { assemblerNiveau } from './assemblage';
import { PLANS_REGIONS } from './plans';
import { VAGUES_REGION1 } from './vagues-region1';

const PLAN = PLANS_REGIONS[0]?.[0];
const VAGUES = VAGUES_REGION1[0];
const RADEAU: GimmickRadeau = { type: 'radeau', trajet: [{ cx: 1, cy: 1 }, { cx: 6, cy: 1 }], vitesse: 0.5, places: [{ dx: -2, dy: 0 }, { dx: 0, dy: 0 }, { dx: 2, dy: 0 }] };
const cle = (c: { cx: number; cy: number }): string => `${String(c.cx)},${String(c.cy)}`;

describe('assemblage : radeau', () => {
  it('ajoute les cases du trajet aux cases interdites, sans doublon', () => {
    if (!PLAN || !VAGUES) throw new Error('plan ou vagues de la région 1 absents');
    const sans = assemblerNiveau(PLAN, VAGUES).niveau.casesInterdites;
    const avec = assemblerNiveau({ ...PLAN, gimmick: RADEAU }, VAGUES).niveau.casesInterdites;
    const interdites = avec.map(cle);
    expect(new Set(interdites).size).toBe(interdites.length);
    for (const c of casesDuTrajet(RADEAU)) expect(interdites).toContain(cle(c));
    for (const c of sans) expect(interdites).toContain(cle(c));
  });

  it('ne change rien sans radeau', () => {
    if (!PLAN || !VAGUES) throw new Error('plan ou vagues de la région 1 absents');
    const a = assemblerNiveau(PLAN, VAGUES).niveau.casesInterdites;
    const b = assemblerNiveau({ ...PLAN, gimmick: { type: 'corbeaux', couloirs: [{ cy: 2 }] } }, VAGUES).niveau.casesInterdites;
    expect(b).toEqual(a);
  });
});
