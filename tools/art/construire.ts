// Lit toutes les sources graphiques du dépôt et produit l'atlas en mémoire (sans rien écrire).
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
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
