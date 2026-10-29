import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { fr } from '../i18n/fr';
import { cleParoleBoss } from './parole-boss';

describe('cleParoleBoss', () => {
  const niveau = REGION1.find((n) => n.boss);
  it('rend la parole de la région pour la vague du boss, rien pour les autres', () => {
    expect(niveau).toBeDefined();
    if (!niveau) return;
    const vagues = niveau.niveau.vagues;
    const indices = vagues.map((_, i) => cleParoleBoss(vagues, i, 1, true)).flatMap((c, i) => (c ? [i] : []));
    expect(indices.length).toBeGreaterThan(0);
    expect(cleParoleBoss(vagues, indices[0] ?? 0, 1, true)).toBe('boss.r1.parole');
    expect(cleParoleBoss(vagues, indices[0] ?? 0, 1, false)).toBeNull();
    expect(cleParoleBoss(vagues, 999, 1, true)).toBeNull();
    expect(indices.length).toBeLessThan(vagues.length);
  });
});

describe('paroles', () => {
  it('chaque région a la sienne dans les textes', () => {
    for (let n = 1; n <= 10; n++) expect(fr).toHaveProperty(`boss.r${String(n)}.parole`);
  });
});
