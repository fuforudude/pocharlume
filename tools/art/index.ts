// `npm run art` : régénère public/sprites/atlas.png et atlas.json depuis art/, puis les aperçus agrandis.
// Option `--sans-apercu` pour n'écrire que l'atlas.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { plancheGenerale, plancheSprite } from './apercu.ts';
import { construire, DOSSIER_SORTIE, RACINE } from './construire.ts';
import { encoderPng } from './png.ts';
import { planScene } from './scene.ts';

const debut = performance.now();
const resultat = construire();
mkdirSync(DOSSIER_SORTIE, { recursive: true });
writeFileSync(join(DOSSIER_SORTIE, 'atlas.png'), resultat.png);
writeFileSync(join(DOSSIER_SORTIE, 'atlas.json'), resultat.texteJson);

const cadres = resultat.sprites.reduce((n, s) => n + s.anims.reduce((m, a) => m + a.cadres.length, 0), 0);
console.log(`Atlas : ${String(resultat.sprites.length)} sprites, ${String(cadres)} cadres, `
  + `${String(resultat.image.largeur)}×${String(resultat.image.hauteur)} px, ${String(Math.round(resultat.png.length / 1024))} Ko.`);

if (!process.argv.includes('--sans-apercu')) {
  const dossier = join(RACINE, 'art', 'apercu');
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  for (const s of resultat.sprites) writeFileSync(join(dossier, `${s.nom}.png`), encoderPng(plancheSprite(s)));
  writeFileSync(join(dossier, '_tout.png'), encoderPng(plancheGenerale(resultat.sprites)));
  writeFileSync(join(dossier, '_scene.png'), encoderPng(planScene(resultat.sprites)));
  console.log(`Aperçus agrandis dans art/apercu/ (_tout.png, _scene.png et une planche par sprite).`);
}
console.log(`Terminé en ${String(Math.round(performance.now() - debut))} ms.`);
