// `npm run sons -- <dossier>` : recopie les bruitages du catalogue dans public/sons/ depuis les packs Kenney extraits.
// <dossier> contient les trois packs, chacun dans `<pack>/Audio/` ou `kenney_<pack>/Audio/` (l'archive extraite telle
// quelle). Les fichiers sont lus, jamais exécutés. Le dossier public/sons/ est commité : le build ne lance pas ce script.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOGUE } from './catalogue.ts';

export const DOSSIER_SONS = join(import.meta.dirname, '..', '..', 'public', 'sons');

function chercher(racine: string, pack: string, source: string): string | null {
  for (const dossier of [pack, `kenney_${pack}`]) {
    const chemin = join(racine, dossier, 'Audio', `${source}.ogg`);
    if (existsSync(chemin)) return chemin;
  }
  return null;
}

function principal(): void {
  const racine = process.argv[2];
  if (!racine) {
    console.error('Usage : npm run sons -- <dossier des packs Kenney extraits>');
    process.exitCode = 1;
    return;
  }
  mkdirSync(DOSSIER_SONS, { recursive: true });
  let octets = 0;
  for (const entree of CATALOGUE) {
    const source = chercher(racine, entree.pack, entree.source);
    if (!source) {
      console.error(`Introuvable : ${entree.pack}/Audio/${entree.source}.ogg`);
      process.exitCode = 1;
      return;
    }
    const cible = join(DOSSIER_SONS, `${entree.nom}.ogg`);
    copyFileSync(source, cible);
    octets += statSync(cible).size;
  }
  console.log(`${String(CATALOGUE.length)} sons copiés dans public/sons/ (${String(Math.round(octets / 1024))} Ko).`);
}

if (process.argv[1] && import.meta.filename === process.argv[1]) principal();
