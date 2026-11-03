// Exporte, à la taille réelle, le premier cadre de repos de chaque sprite de tour (avec le chat tireur posé au point
// `tireur` pour le Clocher des Archers), plus les sprites de art/propositions/*.txt (maquettes, hors atlas du jeu).
// Usage : node tools/art/planche-tours.ts <dossier-de-sortie>
// La planche annotée est ensuite composée par tools/art/planche-tours.py (noms sous les sprites).
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { poser } from './apercu.ts';
import { RACINE, lireSources } from './construire.ts';
import { dessinerSprites, type SpriteDessine } from './dessin.ts';
import { lireSprites } from './format.ts';
import { decoderPng, encoderPng, nouvelleImage } from './png.ts';

const sortie = process.argv[2];
if (!sortie) throw new Error('usage : node tools/art/planche-tours.ts <dossier-de-sortie>');
mkdirSync(sortie, { recursive: true });

const { sprites: sources, palettes } = lireSources();
const dossierProps = join(RACINE, 'art', 'propositions');
let fichiers: string[] = [];
try { fichiers = readdirSync(dossierProps).filter((f) => f.endsWith('.txt')).sort(); } catch { /* pas de propositions */ }
const propositions = fichiers.flatMap((f) => lireSprites(readFileSync(join(dossierProps, f), 'utf8'), `art/propositions/${f}`));
const planches = new Map<string, ReturnType<typeof decoderPng>>();
const sprites = dessinerSprites({
  sprites: [...sources, ...propositions],
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
const parNom = new Map(sprites.map((s) => [s.nom, s]));

/** Marge haute pour le chat tireur qui dépasse du cadre de la tour. */
const MARGE = 16;

function tireurDe(nom: string): SpriteDessine | undefined {
  if (!nom.includes('tour-tir')) return undefined;
  if (nom.endsWith('guetteurs')) return parNom.get('guetteur-chat');
  if (nom.endsWith('beffroi')) return parNom.get('arbaletrier-chat');
  return parNom.get('archer-chat');
}

const index: Record<string, { ancre: readonly [number, number]; largeur: number; hauteur: number; cadres: number }> = {};
for (const s of sprites) {
  if (!s.nom.includes('tour-')) continue;
  if (s.categorie !== 'tour' && !s.nom.startsWith('prop-')) continue;
  const repos = s.anims.find((a) => a.nom === 'repos') ?? s.anims[0];
  if (!repos) continue;
  const tireur = tireurDe(s.nom);
  const point = s.points.get('tireur');
  repos.cadres.forEach((c, i) => {
    const image = nouvelleImage(s.largeur, s.hauteur + MARGE);
    poser(image, c.couche, 0, MARGE);
    const ct = tireur?.anims.find((a) => a.nom === 'repos')?.cadres[0]?.couche;
    if (tireur && ct && point) poser(image, ct, point[0] - tireur.ancre[0], MARGE + point[1] - tireur.ancre[1]);
    writeFileSync(join(sortie, `${s.nom}.${String(i)}.png`), encoderPng(image));
  });
  index[s.nom] = { ancre: [s.ancre[0], s.ancre[1] + MARGE], largeur: s.largeur, hauteur: s.hauteur + MARGE, cadres: repos.cadres.length };
}
for (const tuile of ['herbe-1', 'herbe-2', 'herbe-3']) {
  const c = parNom.get(tuile)?.anims[0]?.cadres[0]?.couche;
  if (c) {
    const image = nouvelleImage(c.largeur, c.hauteur);
    poser(image, c, 0, 0);
    writeFileSync(join(sortie, `${tuile}.png`), encoderPng(image));
  }
}
writeFileSync(join(sortie, 'index.json'), JSON.stringify(index, null, 1));
console.log(`${String(Object.keys(index).length)} sprites de tours exportés dans ${sortie}.`);
