import { describe, expect, it } from 'vitest';
import { fileUnique } from './file-unique.ts';

describe('file des reconstructions', () => {
  it('une seule tâche à la fois, et une seule relance pour les demandes arrivées pendant', async () => {
    let actives = 0;
    let maximum = 0;
    let lancees = 0;
    const portes: (() => void)[] = [];
    const tache = fileUnique(async () => {
      lancees++;
      actives++;
      maximum = Math.max(maximum, actives);
      await new Promise<void>((ok) => { portes.push(ok); });
      actives--;
      return lancees;
    });
    const premiere = tache();
    const b = tache();
    const c = tache();
    const d = tache();
    expect(lancees).toBe(1);
    portes[0]?.();
    await premiere;
    await new Promise((ok) => { setTimeout(ok, 5); });
    expect(lancees).toBe(2);
    portes[1]?.();
    expect(await Promise.all([b, c, d])).toEqual([2, 2, 2]);
    expect(maximum).toBe(1);
    // Après la fin, une nouvelle demande relance normalement.
    const e = tache();
    await new Promise((ok) => { setTimeout(ok, 5); });
    portes[2]?.();
    expect(await e).toBe(3);
  });

  it('une tâche en échec n\'empêche pas la relance suivante', async () => {
    let n = 0;
    const tache = fileUnique(() => (++n === 1 ? Promise.reject(new Error('échec')) : Promise.resolve(n)));
    const a = tache();
    const b = tache();
    await expect(a).rejects.toThrow('échec');
    expect(await b).toBe(2);
  });
});
