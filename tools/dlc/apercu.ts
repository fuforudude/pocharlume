// `npm run dlc:apercu` : aperçus des skins du DLC « Temps modernes ».
// Lit art/dlc-moderne/**/*.txt (hors atlas du jeu), écrit pour chaque skin déclaré par `#: id | nom | original`
// docs/dlc-moderne/apercus/<id>.png (agrandi ×6) et <id>-original.png, puis l'index docs/dlc-moderne/index.json.
// La planche des tours se compose ensuite avec : python tools/dlc/planche.py tour docs/dlc-moderne/planche-tours.png
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RACINE, lireSources } from '../art/construire.ts';
import { decoderPng, encoderPng, type Image } from '../art/png.ts';
import { FACTEUR, rendreApercus, type SourceDlc } from './skins.ts';

const DOSSIER_SOURCES = join(RACINE, 'art', 'dlc-moderne');
const DOSSIER_DOCS = join(RACINE, 'docs', 'dlc-moderne');
const DOSSIER_APERCUS = join(DOSSIER_DOCS, 'apercus');

const debut = performance.now();
const dlc: SourceDlc[] = readdirSync(DOSSIER_SOURCES, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.txt'))
  .sort()
  .map((f) => {
    const chemin = join(DOSSIER_SOURCES, f);
    return { texte: readFileSync(chemin, 'utf8'), fichier: relative(RACINE, chemin).replaceAll('\\', '/') };
  });

const { sprites: jeu, palettes } = lireSources();
const planches = new Map<string, Image>();
const apercus = rendreApercus({
  jeu,
  dlc,
  palettes,
  planche: (chemin) => {
    let image = planches.get(chemin);
    if (!image) {
      image = decoderPng(readFileSync(join(RACINE, 'art', 'minifolks', chemin)));
      planches.set(chemin, image);
    }
    return image;
  },
});

rmSync(DOSSIER_APERCUS, { recursive: true, force: true });
mkdirSync(DOSSIER_APERCUS, { recursive: true });
const index = apercus.map((a) => {
  const { id, nom, original, fichier } = a.entete;
  writeFileSync(join(DOSSIER_APERCUS, `${id}.png`), encoderPng(a.skin));
  if (a.original) writeFileSync(join(DOSSIER_APERCUS, `${id}-original.png`), encoderPng(a.original));
  return {
    id,
    nom,
    categorie: a.categorie,
    original: original?.base ?? null,
    apercu: `apercus/${id}.png`,
    apercuOriginal: a.original ? `apercus/${id}-original.png` : null,
    source: fichier,
  };
});
writeFileSync(join(DOSSIER_DOCS, 'index.json'), `${JSON.stringify({ facteur: FACTEUR, skins: index }, null, 1)}\n`);
console.log(`${String(index.length)} skins (${String(dlc.length)} sources) : aperçus ×${String(FACTEUR)} dans docs/dlc-moderne/apercus/, `
  + `index dans docs/dlc-moderne/index.json, en ${String(Math.round(performance.now() - debut))} ms.`);
