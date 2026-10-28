import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { decoderPng } from '../../tools/art/png.ts';
import type { AtlasJson } from './atlas';
import {
  appliquerPalette, CONTOUR, extraireZone, IDS_SKINS, imageDuSkin, PALETTES_SKINS, spritesDuSkin, zoneDuSprite,
  type ImageDonnees,
} from './palettes-skins';

const atlasJson = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as AtlasJson;
let atlas: ImageDonnees;

beforeAll(() => {
  const png = decoderPng(readFileSync('public/sprites/atlas.png'));
  atlas = { width: png.largeur, height: png.hauteur, data: new Uint8ClampedArray(png.pixels) };
});

/** Image de 4 pixels : rouge opaque, vert opaque, rouge transparent, bleu à demi transparent. */
function petiteImage(): ImageDonnees {
  return {
    width: 4,
    height: 1,
    data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 255, 0, 0, 0, 0, 0, 255, 128]),
  };
}

describe('appliquerPalette', () => {
  it('remplace les couleurs exactes, garde l’alpha et les autres couleurs, sans toucher aux pixels transparents', () => {
    const sortie = appliquerPalette(petiteImage(), { ff0000: '112233', '0000ff': 'aabbcc' });
    expect([...sortie.data]).toEqual([0x11, 0x22, 0x33, 255, 0, 255, 0, 255, 255, 0, 0, 0, 0xaa, 0xbb, 0xcc, 128]);
    expect([sortie.width, sortie.height]).toEqual([4, 1]);
  });

  it('ne modifie jamais l’image source', () => {
    const source = petiteImage();
    const avant = [...source.data];
    appliquerPalette(source, { ff0000: '000000' });
    expect([...source.data]).toEqual(avant);
  });

  it('est pure : mêmes entrées, même sortie, et une table vide rend une copie identique', () => {
    const a = appliquerPalette(petiteImage(), { ff0000: '010203' });
    const b = appliquerPalette(petiteImage(), { ff0000: '010203' });
    expect([...a.data]).toEqual([...b.data]);
    const copie = appliquerPalette(petiteImage(), {});
    expect([...copie.data]).toEqual([...petiteImage().data]);
    expect(copie.data).not.toBe(petiteImage().data);
  });
});

describe('imageDuSkin (cache)', () => {
  it('ne recolore qu’une fois par image, skin et zone, et partage le résultat', () => {
    const image = petiteImage();
    const a = imageDuSkin(image, 'skin_caserne_1');
    expect(a).not.toBeNull();
    expect(imageDuSkin(image, 'skin_caserne_1')).toBe(a);
    expect(imageDuSkin(image, 'skin_caserne_2')).not.toBe(a);
    const zone = { x: 1, y: 0, largeur: 2, hauteur: 1 };
    const z = imageDuSkin(image, 'skin_caserne_1', zone);
    expect(z).not.toBe(a);
    expect(imageDuSkin(image, 'skin_caserne_1', zone)).toBe(z);
    expect([z?.width, z?.height]).toEqual([2, 1]);
    // Une autre image d'atlas a son propre cache.
    expect(imageDuSkin(petiteImage(), 'skin_caserne_1')).not.toBe(a);
  });

  it('renvoie null pour un skin inconnu (y compris les noms de l’objet prototype)', () => {
    expect(imageDuSkin(petiteImage(), 'skin_inconnu')).toBeNull();
    expect(imageDuSkin(petiteImage(), 'constructor')).toBeNull();
    expect(imageDuSkin(petiteImage(), 'toString')).toBeNull();
  });

  it('extrait une zone en laissant transparent ce qui dépasse de l’image', () => {
    const z = extraireZone(petiteImage(), { x: 3, y: 0, largeur: 2, hauteur: 2 });
    expect([...z.data]).toEqual([0, 0, 255, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('catalogue des palettes', () => {
  it('compte les 21 skins : 3 par famille de tour de base et 1 par héros', () => {
    expect([...IDS_SKINS].sort()).toEqual([
      ...[1, 2, 3].flatMap((n) => ['artillerie', 'caserne', 'magie', 'tir'].map((f) => `skin_${f}_${String(n)}`)),
      'skin_brise_os', 'skin_charlie', 'skin_corbeau', 'skin_lanterne', 'skin_mastoc', 'skin_pollen', 'skin_plume', 'skin_rouage', 'skin_suie',
    ].sort());
  });

  it('écrit toutes les couleurs en rrggbb minuscules, sans jamais recolorer le contour ni substituer une couleur par elle-même', () => {
    for (const [id, def] of Object.entries(PALETTES_SKINS)) {
      for (const [de, vers] of Object.entries(def.substitutions)) {
        expect(de, id).toMatch(/^[0-9a-f]{6}$/);
        expect(vers, id).toMatch(/^[0-9a-f]{6}$/);
        expect(de, `${id} : le contour ne change pas`).not.toBe(CONTOUR);
        expect(vers, id).not.toBe(de);
      }
    }
  });

  it('habille des sprites qui existent dans l’atlas', () => {
    for (const id of IDS_SKINS) {
      const noms = spritesDuSkin(id);
      expect(noms.length, id).toBeGreaterThanOrEqual(1);
      for (const nom of noms) expect(atlasJson.sprites, `${id} : ${nom}`).toHaveProperty([nom]);
    }
  });

  it('chaque skin change réellement ses sprites : ses couleurs de base y sont et plus de 5 % des pixels opaques changent', () => {
    // Pixels opaques de chaque sprite (une seule extraction par sprite, partagée entre les skins).
    const lus = new Map<string, { source: ImageDonnees; hex: (string | null)[] }>();
    const lire = (nom: string): { source: ImageDonnees; hex: (string | null)[] } | null => {
      const sprite = atlasJson.sprites[nom];
      if (!sprite) return null;
      let lu = lus.get(nom);
      if (!lu) {
        const source = extraireZone(atlas, zoneDuSprite(sprite));
        const hex: (string | null)[] = [];
        for (let i = 0; i < source.data.length; i += 4) {
          hex.push((source.data[i + 3] ?? 0) === 0 ? null : [0, 1, 2].map((k) => (source.data[i + k] ?? 0).toString(16).padStart(2, '0')).join(''));
        }
        lu = { source, hex };
        lus.set(nom, lu);
      }
      return lu;
    };
    for (const id of IDS_SKINS) {
      const { substitutions } = PALETTES_SKINS[id];
      const presentes = new Set<string>();
      let opaques = 0;
      let changes = 0;
      for (const nom of spritesDuSkin(id)) {
        const lu = lire(nom);
        if (!lu) continue;
        for (const hex of lu.hex) {
          if (hex === null) continue;
          opaques++;
          presentes.add(hex);
          if (Object.hasOwn(substitutions, hex)) changes++;
        }
      }
      // Chaque clé de la palette doit servir quelque part dans les sprites habillés (sinon la ligne est morte).
      for (const de of Object.keys(substitutions)) expect(presentes.has(de), `${id} : ${de} absent des sprites`).toBe(true);
      expect(changes / opaques, id).toBeGreaterThan(0.05);
    }
  }, 30_000);

  it('donne des rendus différents aux trois skins d’une même famille', () => {
    for (const famille of ['caserne', 'tir', 'magie', 'artillerie']) {
      const sprite = atlasJson.sprites[`tour-${famille}-2`];
      expect(sprite).toBeDefined();
      if (!sprite) continue;
      const zone = zoneDuSprite(sprite);
      const empreintes = [1, 2, 3].map((n) => {
        const image = imageDuSkin(atlas, `skin_${famille}_${String(n)}`, zone);
        return Buffer.from(image?.data ?? []).toString('base64');
      });
      expect(new Set(empreintes).size, famille).toBe(3);
      expect(empreintes).not.toContain(Buffer.from(extraireZone(atlas, zone).data).toString('base64'));
    }
  });

  it('zoneDuSprite couvre tous les cadres d’un sprite', () => {
    const sprite = atlasJson.sprites['tour-tir-1'];
    expect(sprite).toBeDefined();
    if (!sprite) return;
    const zone = zoneDuSprite(sprite);
    for (const anim of Object.values(sprite.animations)) {
      for (const c of anim.cadres) {
        expect(c.x).toBeGreaterThanOrEqual(zone.x);
        expect(c.y).toBeGreaterThanOrEqual(zone.y);
        expect(c.x + c.largeur).toBeLessThanOrEqual(zone.x + zone.largeur);
        expect(c.y + c.hauteur).toBeLessThanOrEqual(zone.y + zone.hauteur);
      }
    }
  });
});
