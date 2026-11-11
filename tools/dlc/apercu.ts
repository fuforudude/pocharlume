// `npm run dlc:apercu` : aperçus des skins du DLC « Temps modernes ».
// Lit art/dlc-moderne/**/*.txt (hors atlas du jeu) et écrit, pour chaque skin déclaré par `#: id | nom | original`,
// dans docs/dlc-moderne/apercus/ (agrandi ×6) :
//   <id>.png et <id>-original.png                           la pose de repos (premier cadre) ;
//   <id>--<animation>.gif et <id>--<animation>-original.gif chaque animation, à sa cadence, en boucle (une animation
//                                                           jouée une fois finit sur une courte pause) ;
// puis l'index docs/dlc-moderne/index.json, et la liste des écarts d'animations avec les originaux.
// La planche des tours se compose ensuite avec : python tools/dlc/planche.py tour docs/dlc-moderne/planche-tours.png
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RACINE, lireSources } from '../art/construire.ts';
import { decoderPng, encoderPng, type Image } from '../art/png.ts';
import { encoderGif } from './gif.ts';
import { FACTEUR, PAUSE_UNIQUE, decrireEcart, estBloquant, estEcart, rendreApercus, type ImageAnimee, type SourceDlc } from './skins.ts';

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

/** Écrit le GIF et renvoie son chemin relatif à docs/dlc-moderne/ (null sans animation). */
function ecrireGif(animee: ImageAnimee | null, nom: string): string | null {
  if (!animee) return null;
  writeFileSync(join(DOSSIER_APERCUS, nom), encoderGif(animee.images));
  return `apercus/${nom}`;
}

let gifs = 0;
const index = apercus.map((a) => {
  const { id, nom, original, fichier } = a.entete;
  writeFileSync(join(DOSSIER_APERCUS, `${id}.png`), encoderPng(a.skin));
  if (a.original) writeFileSync(join(DOSSIER_APERCUS, `${id}-original.png`), encoderPng(a.original));
  const animations = a.animations.map((an) => {
    const gif = ecrireGif(an.skin, `${id}--${an.nom}.gif`);
    const gifOriginal = ecrireGif(an.original, `${id}--${an.nom}-original.gif`);
    gifs += (gif ? 1 : 0) + (gifOriginal ? 1 : 0);
    return { nom: an.nom, boucle: (an.skin ?? an.original)?.boucle ?? true, gif, gifOriginal };
  });
  return {
    id,
    nom,
    categorie: a.categorie,
    original: original?.base ?? null,
    apercu: `apercus/${id}.png`,
    apercuOriginal: a.original ? `apercus/${id}-original.png` : null,
    source: fichier,
    animations,
    complet: !a.ecarts.some(estBloquant),
  };
});
writeFileSync(join(DOSSIER_DOCS, 'index.json'), `${JSON.stringify({ facteur: FACTEUR, pauseUnique: PAUSE_UNIQUE, skins: index }, null, 1)}\n`);

const ecarts = apercus.flatMap((a) => a.ecarts.filter(estEcart));
const incomplets = index.filter((s) => !s.complet).length;
console.log(`${String(index.length)} skins (${String(dlc.length)} sources) : poses et ${String(gifs)} GIF ×${String(FACTEUR)} dans `
  + `docs/dlc-moderne/apercus/, index dans docs/dlc-moderne/index.json, en ${String(Math.round(performance.now() - debut))} ms.`);
if (ecarts.length > 0) {
  console.log(`\n${String(incomplets)} skin(s) aux animations incomplètes ; écarts avec les originaux (✗ bloquant, ~ cadence) :`);
  for (const e of ecarts) console.log(`  ${estBloquant(e) ? '✗' : '~'} ${decrireEcart(e)}`);
} else {
  console.log('Tous les skins ont les animations de leur original.');
}
