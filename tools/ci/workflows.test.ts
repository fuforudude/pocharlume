// Le workflow des tests distants découpe l'équilibrage par région comme celui du déploiement : une région ajoutée
// d'un côté doit l'être de l'autre. Il ne tourne jamais sur main (le déploiement s'en charge).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function lire(nom: string): string {
  return readFileSync(new URL(`../../.github/workflows/${nom}`, import.meta.url), 'utf8');
}

function regions(flux: string): number[] {
  const matrice = /region:\s*\[([^\]]*)\]/.exec(flux)?.[1] ?? '';
  return matrice.split(',').map((r) => Number(r.trim()));
}

describe('workflow des tests distants', () => {
  const tests = lire('tests.yml');

  it('a la même matrice de régions que le déploiement', () => {
    const deploiement = regions(lire('deploiement.yml'));
    expect(deploiement.length).toBeGreaterThan(0);
    expect(regions(tests)).toEqual(deploiement);
  });

  it('part sur tout push sauf main, et à la demande', () => {
    expect(tests).toMatch(/branches-ignore:\s*\[main\]/);
    expect(tests).toContain('workflow_dispatch:');
  });

  it('annule le run précédent de la même branche', () => {
    expect(tests).toMatch(/group:\s*tests-\$\{\{ github\.ref \}\}/);
    expect(tests).toMatch(/cancel-in-progress:\s*true/);
  });
});
