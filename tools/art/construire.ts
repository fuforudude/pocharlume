// Lit toutes les sources graphiques du dépôt et produit l'atlas en mémoire (sans rien écrire).
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { construireAtlas, serialiserAtlas, type AtlasJson } from './atlas.ts';
import { dessinerSprites, type SpriteDessine } from './dessin.ts';
import { lirePalette, lireSprites, type SpriteSource } from './format.ts';
import { decoderPng, encoderPng, type Image } from './png.ts';

export const RACINE = join(import.meta.dirname, '..', '..');
export const DOSSIER_SORTIE = join(RACINE, 'public', 'sprites');

export interface Construction {
  readonly sprites: readonly SpriteDessine[];
  readonly image: Image;
  readonly png: Uint8Array;
  readonly json: AtlasJson;
  readonly texteJson: string;
}

function fichiersTexte(dossier: string): string[] {
  return readdirSync(dossier).filter((f) => f.endsWith('.txt')).sort();
}

export function lireSources(racine = RACINE): { sprites: SpriteSource[]; palettes: Map<string, Map<string, string>> } {
  const palettes = new Map<string, Map<string, string>>();
  const dossierPalettes = join(racine, 'art', 'palettes');
  for (const f of fichiersTexte(dossierPalettes)) {
    palettes.set(basename(f, '.txt'), lirePalette(readFileSync(join(dossierPalettes, f), 'utf8'), `art/palettes/${f}`));
  }
  const dossierSprites = join(racine, 'art', 'sprites');
  const sprites = fichiersTexte(dossierSprites)
    .flatMap((f) => lireSprites(readFileSync(join(dossierSprites, f), 'utf8'), `art/sprites/${f}`));
  return { sprites, palettes };
}

export function construire(racine = RACINE): Construction {
  const { sprites: sources, palettes } = lireSources(racine);
  const planches = new Map<string, Image>();
  const sprites = dessinerSprites({
    sprites: sources,
    palettes,
    planche: (chemin) => {
      let image = planches.get(chemin);
      if (!image) {
        image = decoderPng(readFileSync(join(racine, 'art', 'minifolks', chemin)));
        planches.set(chemin, image);
      }
      return image;
    },
  });
  const { image, json } = construireAtlas(sprites);
  return { sprites, image, png: encoderPng(image), json, texteJson: serialiserAtlas(json) };
}

/** Sources du DLC « Temps modernes » (fichiers .txt de art/dlc-moderne/ et de ses sous-dossiers), dans l'ordre des chemins. */
export function lireSourcesModernes(racine = RACINE): SpriteSource[] {
  const dossier = join(racine, 'art', 'dlc-moderne');
  return readdirSync(dossier, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.txt'))
    .sort()
    .flatMap((f) => {
      const chemin = join(dossier, f);
      return lireSprites(readFileSync(chemin, 'utf8'), relative(racine, chemin).replaceAll('\\', '/'));
    });
}

/** Nom de la planche du DLC « Temps modernes » dans public/sprites/ (son JSON : `atlas-moderne.json`). */
export const IMAGE_MODERNE = 'atlas-moderne.png';

/**
 * L'atlas à part du DLC « Temps modernes » : les sprites validés de art/dlc-moderne/ (skins des tours et leurs tireurs, ennemis, boss),
 * seuls, sur leur propre planche, chargée par le jeu seulement pour une partie de cette campagne. Les sprites du jeu servent de
 * références (cadres repris) sans entrer dans cette planche.
 */
export function construireModerne(racine = RACINE): Construction {
  const { sprites: jeu, palettes } = lireSources(racine);
  const modernes = lireSourcesModernes(racine);
  const noms = new Set(modernes.map((s) => s.nom));
  const planches = new Map<string, Image>();
  const sprites = dessinerSprites({
    sprites: [...jeu, ...modernes],
    palettes,
    planche: (chemin) => {
      let image = planches.get(chemin);
      if (!image) {
        image = decoderPng(readFileSync(join(racine, 'art', 'minifolks', chemin)));
        planches.set(chemin, image);
      }
      return image;
    },
    garder: (nom) => noms.has(nom),
  });
  const { image, json } = construireAtlas(sprites, IMAGE_MODERNE);
  return { sprites, image, png: encoderPng(image), json, texteJson: serialiserAtlas(json) };
}

/**
 * Illustrations plein cadre (art/illustrations/*.txt, même format que les sprites, une par fichier) : elles ne vont pas dans
 * l'atlas (trop grandes) mais en PNG séparés dans public/illustrations/ (voir `npm run art`).
 */
export function construireIllustrations(racine = RACINE): SpriteDessine[] {
  const dossier = join(racine, 'art', 'illustrations');
  let fichiers: string[];
  try { fichiers = fichiersTexte(dossier); } catch { return []; }
  const palettes = lireSources(racine).palettes;
  const sprites = fichiers.flatMap((f) => lireSprites(readFileSync(join(dossier, f), 'utf8'), `art/illustrations/${f}`));
  return dessinerSprites({ sprites, palettes, planche: () => { throw new Error('une illustration n’utilise pas de planche Minifolks'); } });
}
