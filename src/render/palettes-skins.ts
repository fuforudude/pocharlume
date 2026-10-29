// Skins : ce sont des palettes, pas de nouveaux sprites. Un skin est une table de substitutions de couleurs (RRGGBB exact)
// appliquée au sprite de base : le rendu recolore une copie de l'atlas (ou seulement la zone d'un sprite) et dessine les
// cadres du sprite dans cette copie. Rien ici ne dépend du DOM : les images sont de simples { width, height, data } (c'est
// la forme d'un `ImageData`), ce qui permet de tout tester sous Node. Le branchement dans l'interface et le rendu
// (choix du skin porté par une tour ou un héros) viendra avec les écrans de collection.
import type { SpriteAtlas } from './atlas';

/** Couleur au format `rrggbb` (minuscules, sans #). */
export type CouleurHex = string;
/** Substitutions : couleur de base vers couleur du skin. Les couleurs absentes ne changent pas ; le contour (2b2928) non plus. */
export type Substitutions = Readonly<Record<CouleurHex, CouleurHex>>;

/** Une image RVBA : la forme d'un `ImageData` du navigateur. */
export interface ImageDonnees {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray | Uint8Array;
}

/** Rectangle de l'atlas, en pixels. */
export interface Zone {
  readonly x: number;
  readonly y: number;
  readonly largeur: number;
  readonly hauteur: number;
}

export type FamilleSkin = 'caserne' | 'tir' | 'magie' | 'artillerie';
export type IdHerosSkin = 'plume' | 'charlie' | 'pollen' | 'suie' | 'corbeau' | 'mastoc' | 'brise_os' | 'rouage' | 'lanterne';

export interface DefSkin {
  /** Ce que le skin habille : la tour de base d'une famille (et ses spécialisations) ou un héros. */
  readonly cible: { readonly type: 'tour'; readonly famille: FamilleSkin } | { readonly type: 'heros'; readonly heros: IdHerosSkin };
  readonly substitutions: Substitutions;
}

/** Couleur du contour d'un pixel : jamais recolorée, pour que tous les sprites gardent le même trait. */
export const CONTOUR: CouleurHex = '2b2928';

/** Sprites d'une famille de tours : ses trois niveaux et ses deux spécialisations (voir `spriteTour`). */
export const SPRITES_FAMILLE: Readonly<Record<FamilleSkin, readonly string[]>> = {
  caserne: ['tour-caserne-1', 'tour-caserne-2', 'tour-caserne-3', 'tour-caserne-cloitre', 'tour-caserne-ecorcheurs'],
  tir: ['tour-tir-1', 'tour-tir-2', 'tour-tir-3', 'tour-tir-guetteurs', 'tour-tir-beffroi'],
  magie: ['tour-magie-1', 'tour-magie-2', 'tour-magie-3', 'tour-magie-oracle', 'tour-magie-necromancien'],
  artillerie: ['tour-artillerie-1', 'tour-artillerie-2', 'tour-artillerie-3', 'tour-artillerie-mortier', 'tour-artillerie-baliste'],
};

/** Sprite de chaque héros (voir `SPRITES_UNITES` : Charlie garde son nom historique). */
export const SPRITE_HEROS: Readonly<Record<IdHerosSkin, string>> = {
  plume: 'heros-plume',
  charlie: 'charlie',
  pollen: 'heros-pollen',
  suie: 'heros-suie',
  corbeau: 'heros-corbeau',
  mastoc: 'heros-mastoc',
  brise_os: 'heros-brise-os',
  rouage: 'heros-rouage',
  lanterne: 'heros-lanterne',
};

const tour = (famille: FamilleSkin, substitutions: Substitutions): DefSkin => ({ cible: { type: 'tour', famille }, substitutions });
const heros = (id: IdHerosSkin, substitutions: Substitutions): DefSkin => ({ cible: { type: 'heros', heros: id }, substitutions });

/** Les 21 skins du catalogue : 3 par famille de tour de base (12) et 1 par héros (9). */
export const PALETTES_SKINS = {
  // Caserne (bois, chaume, pierre) : toit rouge sang, pierre chaulée et ardoise, ébène et or.
  skin_caserne_1: tour('caserne', {
    '9a9058': 'c04030', '6e6a40': '7a2018', '901000': 'dfc76f', '5a1a14': 'b8a870', '705030': '5a3a30', '623f2a': '4a2a24',
  }),
  skin_caserne_2: tour('caserne', {
    '3e3b39': '67625a', '4e4b49': '8a8478', '67625a': 'aea696', '8a8478': 'd8d0b0', '9a9058': '5a7b94', '6e6a40': '3e5870',
  }),
  skin_caserne_3: tour('caserne', {
    '705030': '3b2a20', '623f2a': '2e2420', '3b2a20': '1c1614', 'b07040': 'dfc76f', '9a9058': 'dfc76f', '6e6a40': 'b8a870',
  }),
  // Tour de tir : toits couverts de mousse, rouge et or, glace.
  skin_tir_1: tour('tir', {
    '3e3b39': '4a4a2c', '171412': '2e3020', '8a8478': '9a9058', '67625a': '6e6a40', '4e4b49': '3a3c24',
  }),
  skin_tir_2: tour('tir', {
    '3e3b39': '901000', '171412': '5a1a14', '4e4b49': 'c83018', '8a8478': 'dfc76f', '67625a': 'b07040',
  }),
  skin_tir_3: tour('tir', {
    '3e3b39': '5a7b94', '171412': '2a4058', '8a8478': 'b5d6de', '67625a': '8cadc6', '4e4b49': '45607a', '45424c': '3a5068',
  }),
  // Tour de magie : flamme bleue, améthyste, spectre vert (la lueur et la pierre changent).
  skin_magie_1: tour('magie', {
    'e09128': '4058c0', 'f0d50a': '6098e8', 'f7f757': 'b5d6de', '6e2c12': '24305a', '3e3b39': '2a4058', '67625a': '5a7b94', '8a8478': '8cadc6',
  }),
  skin_magie_2: tour('magie', {
    'e09128': '8a5ac8', 'f0d50a': 'c0a0f0', 'f7f757': 'e4f0f4', '6e2c12': '3a1a5a', '3e3b39': '2e2640', '67625a': '5a4a70', '8a8478': '8a7aa0',
  }),
  skin_magie_3: tour('magie', {
    'e09128': '5e8a4a', 'f0d50a': 'c8e4ec', 'f7f757': 'e5e9de', '6e2c12': '2e3020', '8a8478': '8e9a6a', '67625a': '5a6a3a', '3e3b39': '2e3020',
  }),
  // Artillerie (bois et fer) : bois noir, bronze, acier bleu.
  skin_artillerie_1: tour('artillerie', {
    '705030': '3b2a20', '623f2a': '2e2420', '3b2a20': '1c1614', 'b07040': '623f2a', 'c88850': '8a5a30', 'e8d0a0': 'c88850',
  }),
  skin_artillerie_2: tour('artillerie', {
    '3e3b39': '623f2a', '4e4b49': '8a5a30', '67625a': 'b07040', '8a8478': 'e09128',
  }),
  skin_artillerie_3: tour('artillerie', {
    '3e3b39': '3a4a68', '4e4b49': '45607a', '67625a': '5a7b94', '8a8478': '8cadc6',
  }),
  // Héros : un pelage ou une tenue autre que celle d'origine.
  skin_plume: heros('plume', { '171412': 'd8d8e4', '45424c': 'f0f0f4', '67636f': 'a8a8b8', '948f9a': 'b8b4c0', 'e4f0f4': '6098e8' }),
  skin_charlie: heros('charlie', { '623f2a': 'b07040', '705030': 'c88850' }),
  skin_pollen: heros('pollen', { '623f2a': '24305a', 'b07040': '4058c0', '705030': '2a3a80', 'e8d0a0': 'b5d6de' }),
  skin_suie: heros('suie', { '3e3b39': '3b2a20', '45424c': '6e2c12', '67636f': 'c83018', '948f9a': 'e09128' }),
  skin_corbeau: heros('corbeau', { '171412': 'e5e9de', 'e5e9de': '171412', '45424c': 'aea696' }),
  skin_mastoc: heros('mastoc', { '9c8660': '623f2a', 'c8ac80': 'b07040', '6e5c3e': '3b2a20', '705030': '3a2a20' }),
  skin_brise_os: heros('brise_os', { '705030': '45424c', '623f2a': '3e3b39', 'c83018': 'f0d50a', 'e5e9de': 'c8e4ec' }),
  skin_rouage: heros('rouage', { '8a7550': 'b07040', 'dfc76f': 'e09128', '8cadc6': 'dfc76f', '6e5a3c': '623f2a', '623f2a': '8a3a1a', 'e8d0a0': 'c88850' }),
  skin_lanterne: heros('lanterne', { 'e5e9de': 'c8e4ec', 'd8d0b0': '7f9aa8', 'b8a870': '5e8a4a', 'aea696': '8a8478', '3b2a20': '2e3a2a' }),
} as const satisfies Record<string, DefSkin>;

export type IdSkin = keyof typeof PALETTES_SKINS;
export const IDS_SKINS = Object.keys(PALETTES_SKINS) as IdSkin[];

export function estSkinConnu(id: string): id is IdSkin {
  return Object.hasOwn(PALETTES_SKINS, id);
}

/** Les sprites de l'atlas que le skin habille (à dessiner depuis la copie recolorée). */
export function spritesDuSkin(id: IdSkin): readonly string[] {
  const { cible }: DefSkin = PALETTES_SKINS[id];
  return cible.type === 'tour' ? SPRITES_FAMILLE[cible.famille] : [SPRITE_HEROS[cible.heros]];
}

function versNombre(hex: CouleurHex): number {
  return Number.parseInt(hex, 16);
}

/**
 * Applique des substitutions à une image : chaque pixel dont la couleur (RVB) est une clé prend la couleur associée,
 * l'alpha et tous les autres pixels sont gardés. Renvoie une nouvelle image, la source n'est jamais modifiée.
 * Pure : même image et mêmes substitutions, même résultat.
 */
export function appliquerPalette(image: ImageDonnees, substitutions: Substitutions): ImageDonnees {
  const table = new Map<number, number>();
  for (const [de, vers] of Object.entries(substitutions)) table.set(versNombre(de), versNombre(vers));
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) === 0) continue;
    const cle = ((data[i] ?? 0) << 16) | ((data[i + 1] ?? 0) << 8) | (data[i + 2] ?? 0);
    const nouvelle = table.get(cle);
    if (nouvelle === undefined) continue;
    data[i] = (nouvelle >> 16) & 0xff;
    data[i + 1] = (nouvelle >> 8) & 0xff;
    data[i + 2] = nouvelle & 0xff;
  }
  return { width: image.width, height: image.height, data };
}

/** Copie d'une zone de l'image (hors image : transparent). */
export function extraireZone(image: ImageDonnees, zone: Zone): ImageDonnees {
  const data = new Uint8ClampedArray(zone.largeur * zone.hauteur * 4);
  for (let y = 0; y < zone.hauteur; y++) {
    for (let x = 0; x < zone.largeur; x++) {
      const sx = zone.x + x;
      const sy = zone.y + y;
      if (sx < 0 || sy < 0 || sx >= image.width || sy >= image.height) continue;
      const s = (sy * image.width + sx) * 4;
      data.set(image.data.subarray(s, s + 4), (y * zone.largeur + x) * 4);
    }
  }
  return { width: zone.largeur, height: zone.hauteur, data };
}

/** Plus petit rectangle de l'atlas qui contient tous les cadres d'un sprite (avec et sans contour). */
export function zoneDuSprite(sprite: SpriteAtlas): Zone {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const animations of [sprite.animations, sprite.sansContour ?? {}]) {
    for (const anim of Object.values(animations)) {
      for (const c of anim.cadres) {
        x0 = Math.min(x0, c.x);
        y0 = Math.min(y0, c.y);
        x1 = Math.max(x1, c.x + c.largeur);
        y1 = Math.max(y1, c.y + c.hauteur);
      }
    }
  }
  return { x: x0, y: y0, largeur: x1 - x0, hauteur: y1 - y0 };
}

/** Copies déjà recolorées : par image d'atlas (libérées avec elle), puis par skin et zone. */
const CACHE = new WeakMap<object, Map<string, ImageDonnees>>();

function cleCache(id: string, zone: Zone | undefined): string {
  return zone ? `${id}@${String(zone.x)},${String(zone.y)},${String(zone.largeur)},${String(zone.hauteur)}` : id;
}

/**
 * Image d'atlas recolorée avec la palette d'un skin, calculée une seule fois par image, skin et zone (le résultat est
 * partagé : on ne le modifie pas). Avec `zone`, seule cette partie de l'atlas est copiée et recolorée (les coordonnées des
 * cadres se lisent alors en retranchant `zone.x` et `zone.y`) : un sprite coûte quelques ko, pas l'atlas entier.
 * Renvoie null pour un skin inconnu.
 */
export function imageDuSkin(atlas: ImageDonnees, id: string, zone?: Zone): ImageDonnees | null {
  if (!estSkinConnu(id)) return null;
  let parSkin = CACHE.get(atlas);
  if (!parSkin) {
    parSkin = new Map();
    CACHE.set(atlas, parSkin);
  }
  const cle = cleCache(id, zone);
  const connue = parSkin.get(cle);
  if (connue) return connue;
  const source = zone ? extraireZone(atlas, zone) : atlas;
  const resultat = appliquerPalette(source, PALETTES_SKINS[id].substitutions);
  parSkin.set(cle, resultat);
  return resultat;
}
