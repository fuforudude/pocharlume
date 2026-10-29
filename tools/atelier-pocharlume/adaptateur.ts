// Adaptateur Pocharlume pour l'atelier : branche les sprites, la palette et les cartes du jeu sur le cœur générique
// (tools/atelier). Écriture limitée aux sources graphiques et aux fichiers de données des cartes.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { Adaptateur, ResultatApres } from '../atelier/types.ts';
import { moduleCartes } from './cartes.ts';
import { modulePalette } from './palette.ts';
import { fileUnique } from './file-unique.ts';
import { moduleSprites } from './sprites.ts';

/** Où l'atelier a le droit d'écrire dans Pocharlume. */
export const ECRITURE_PERMISE: readonly string[] = ['art/', 'src/data/niveaux/cartes.ts', 'src/data/niveaux/cartes-region*.ts'];

/** Reconstruit l'atlas (public/sprites/) sans toucher aux aperçus de art/apercu/ (`--sans-apercu`). */
function reconstruireAtlas(racine: string): Promise<ResultatApres> {
  return new Promise((resoudre) => {
    const enfant = spawn(process.execPath, [join(racine, 'tools', 'art', 'index.ts'), '--sans-apercu'], { cwd: racine, windowsHide: true });
    let sortie = '';
    enfant.stdout.on('data', (m: Buffer) => { sortie += m.toString(); });
    enfant.stderr.on('data', (m: Buffer) => { sortie += m.toString(); });
    enfant.on('error', (e) => { resoudre({ ok: false, message: `Atlas non reconstruit : ${e.message}` }); });
    enfant.on('close', (code) => {
      const derniere = sortie.trim().split('\n').find((l) => l.startsWith('Atlas')) ?? sortie.trim().split('\n')[0] ?? '';
      resoudre(code === 0 ? { ok: true, message: `atlas reconstruit (${derniere})` } : { ok: false, message: `Reconstruction de l'atlas échouée : ${sortie.trim().slice(0, 300)}` });
    });
  });
}

export function adaptateurPocharlume(racine: string): Adaptateur {
  // Une reconstruction à la fois : deux enregistrements rapprochés n'écrivent pas l'atlas en même temps.
  const reconstruire = fileUnique(() => reconstruireAtlas(racine));
  return {
    nom: 'Pocharlume',
    racine,
    ecriturePermise: ECRITURE_PERMISE,
    sprites: moduleSprites(racine),
    palette: modulePalette(racine),
    cartes: moduleCartes(racine),
    apresEcriture: (chemins) => (chemins.some((c) => c.startsWith('art/')) ? reconstruire() : Promise.resolve({ ok: true, message: 'carte enregistrée' })),
  };
}
