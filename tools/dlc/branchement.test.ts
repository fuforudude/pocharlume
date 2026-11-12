// Branchement des skins ennemis du DLC « Temps modernes » sur les données : chaque skin ennemi déclaré `#: id | nom | original`
// (art/dlc-moderne/ennemis/*.txt) est un ennemi de src/data/ennemis.ts (`moderne-x` → `moderne_x`) qui reprend le pouvoir de son
// original (mêmes pouvoirs, volant, furtif, boss), sauf ce que la spec change (tir de LBD au lieu de la mise à feu au contact).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../../src/data/ennemis.ts';
import type { DefEnnemi } from '../../src/engine/definitions.ts';
import { RACINE } from '../art/construire.ts';
import { lireEntetes } from './skins.ts';

const table: Readonly<Record<string, DefEnnemi>> = ENNEMIS;
const dossier = join(RACINE, 'art', 'dlc-moderne', 'ennemis');
const entetes = readdirSync(dossier)
  .filter((f) => f.endsWith('.txt'))
  .sort()
  .flatMap((f) => lireEntetes(readFileSync(join(dossier, f), 'utf8'), `art/dlc-moderne/ennemis/${f}`));

const id = (sprite: string): string => sprite.replaceAll('-', '_');

describe('skins ennemis du DLC branchés sur les données', () => {
  it('chaque skin ennemi est un ennemi des données (les deux boss du DLC compris)', () => {
    expect(entetes.length).toBe(17);
    for (const e of entetes) expect(Object.hasOwn(table, id(e.id)), e.id).toBe(true);
  });

  it('chacun reprend le rôle de l’original noté dans sa source', () => {
    for (const e of entetes) {
      if (!e.original) continue;
      const d = table[id(e.id)];
      const o = table[id(e.original.base)];
      expect(o, e.original.base).toBeDefined();
      if (!d || !o) continue;
      expect([d.volant, d.furtif, d.boss], e.id).toEqual([o.volant, o.furtif, o.boss]);
      const changes = id(e.id) === 'moderne_tireur_lbd' ? ['periodiques'] : [];
      for (const pouvoir of Object.keys(o.pouvoirs ?? {})) {
        if (changes.includes(pouvoir)) continue;
        expect(Object.keys(d.pouvoirs ?? {}), `${e.id} garde ${pouvoir}`).toContain(pouvoir);
      }
    }
  });
});
