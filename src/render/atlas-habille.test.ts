import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AtlasJson } from '../../tools/art/atlas.ts';
import { sourceHabille } from './atlas';
import { IDS_SKINS, spritesDuSkin, zoneDuSprite } from './palettes-skins';

const atlas = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as AtlasJson;
const cadre = { x: 130, y: 220, largeur: 12, hauteur: 14, dx: 3, dy: 5, duree: 100 };

describe('sprite habillé : cadre source dans la copie recolorée', () => {
  const zone = { x: 100, y: 200, largeur: 80, hauteur: 40 };

  it('une copie de la zone : le cadre garde sa place relative à la zone', () => {
    expect(sourceHabille(zone, cadre, false)).toEqual({ x: 30, y: 20 });
  });

  it('la copie retournée : le cadre est lu symétriquement, de la droite vers la gauche', () => {
    expect(sourceHabille(zone, cadre, true)).toEqual({ x: 80 - 30 - 12, y: 20 });
  });

  it('chaque cadre de chaque sprite de skin tient dans la zone de son sprite, normal comme retourné', () => {
    for (const id of IDS_SKINS) {
      for (const nom of spritesDuSkin(id)) {
        const sprite = atlas.sprites[nom];
        expect(sprite, nom).toBeDefined();
        if (!sprite) continue;
        const z = zoneDuSprite(sprite);
        for (const anim of Object.values(sprite.animations)) {
          for (const c of anim.cadres) {
            for (const miroir of [false, true]) {
              const s = sourceHabille(z, c, miroir);
              expect(s.x, `${nom} ${String(miroir)}`).toBeGreaterThanOrEqual(0);
              expect(s.y, nom).toBeGreaterThanOrEqual(0);
              expect(s.x + c.largeur, nom).toBeLessThanOrEqual(z.largeur);
              expect(s.y + c.hauteur, nom).toBeLessThanOrEqual(z.hauteur);
            }
          }
        }
      }
    }
  });
});
