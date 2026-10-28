import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { IDS_SKINS, spritesDuSkin } from './palettes-skins';

// Une tour posée tient dans 28 px de large (la case en fait 32) : il reste un écart visible entre deux tours voisines.
// Les skins sont des palettes (pas de nouveaux sprites) : leur largeur est celle des sprites qu'ils habillent.
const LARGEUR_MAX = 28;
const TOLERANCE_CENTRAGE = 2;

interface CadreJson { dx: number; largeur: number }
interface SpriteJson { ancre: { x: number }; animations: Record<string, { cadres: CadreJson[] }> }

const SPRITES = (JSON.parse(readFileSync('public/sprites/atlas.json', 'utf8')) as { sprites: Record<string, SpriteJson> }).sprites;
const TOURS = Object.entries(SPRITES).filter(([nom]) => nom.startsWith('tour-'));

/** Étendue opaque (contour compris) sur toutes les animations et tous les cadres, relative à l'ancre. */
function etendue(sprite: SpriteJson): { gauche: number; droite: number } {
  const cadres = Object.values(sprite.animations).flatMap((a) => a.cadres);
  return {
    gauche: Math.min(...cadres.map((c) => c.dx)) - sprite.ancre.x,
    droite: Math.max(...cadres.map((c) => c.dx + c.largeur)) - sprite.ancre.x,
  };
}

describe('largeur des tours posées', () => {
  it('trouve les tours communes, les spécialisations et les tours divines', () => {
    expect(TOURS.length).toBeGreaterThanOrEqual(23);
    for (const nom of ['tour-artillerie-1', 'tour-caserne-3', 'tour-atelier', 'tour-sanctuaire', 'tour-totem']) {
      expect(SPRITES[nom], nom).toBeDefined();
    }
  });

  it(`aucune tour ne dépasse ${String(LARGEUR_MAX)} px de large (tous cadres, toutes animations, contour compris)`, () => {
    for (const [nom, sprite] of TOURS) {
      const { gauche, droite } = etendue(sprite);
      expect(droite - gauche, nom).toBeLessThanOrEqual(LARGEUR_MAX);
    }
  });

  it('chaque tour reste centrée à 2 px près', () => {
    for (const [nom, sprite] of TOURS) {
      const { gauche, droite } = etendue(sprite);
      expect(Math.abs(gauche + droite) / 2, nom).toBeLessThanOrEqual(TOLERANCE_CENTRAGE);
    }
  });

  it('les sprites habillés par les skins de tours sont tous pris en compte et respectent la même largeur', () => {
    for (const id of IDS_SKINS) {
      for (const nom of spritesDuSkin(id)) {
        if (!nom.startsWith('tour-')) continue;
        const sprite = SPRITES[nom];
        expect(sprite, nom).toBeDefined();
        if (!sprite) continue;
        const { gauche, droite } = etendue(sprite);
        expect(droite - gauche, `${id} / ${nom}`).toBeLessThanOrEqual(LARGEUR_MAX);
      }
    }
  });
});
