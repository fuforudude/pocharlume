// Le cœur de l'atelier doit pouvoir être copié tel quel dans un autre dépôt : aucun de ses fichiers n'importe hors de
// son dossier, ni ne nomme un chemin du projet qui l'héberge. Seuls les modules de Node et les paquets nus sont permis.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const DOSSIER = import.meta.dirname;
const PAQUETS_PERMIS = new Set(['vite', 'vitest']);

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    if (nom === 'node_modules') return [];
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

function imports(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1] ?? '');
}

describe('cœur de l\'atelier autonome', () => {
  const sources = fichiers(DOSSIER).filter((f) => /\.(ts|html|css)$/.test(f));

  it('trouve des fichiers à vérifier', () => {
    expect(sources.length).toBeGreaterThan(10);
  });

  it('n\'importe rien hors de son dossier', () => {
    const problemes: string[] = [];
    for (const f of sources.filter((s) => s.endsWith('.ts'))) {
      for (const spec of imports(readFileSync(f, 'utf8'))) {
        if (spec.startsWith('node:')) continue;
        if (spec.startsWith('.')) {
          const cible = resolve(join(f, '..'), spec);
          if (relative(DOSSIER, cible).startsWith('..')) problemes.push(`${relative(DOSSIER, f)} importe ${spec}`);
        } else if (!PAQUETS_PERMIS.has(spec)) {
          problemes.push(`${relative(DOSSIER, f)} importe le paquet ${spec}`);
        }
      }
    }
    expect(problemes).toEqual([]);
  });

  it('ne cite aucun chemin du projet hôte', () => {
    const interdits = /(\bsrc\/|\btools\/(?!atelier)|\bpublic\/|pocharlume|art\/sprites)/i;
    const problemes: string[] = [];
    for (const f of sources) {
      if (f.endsWith('.test.ts')) continue;
      readFileSync(f, 'utf8').split('\n').forEach((ligne, i) => {
        if (interdits.test(ligne)) problemes.push(`${relative(DOSSIER, f)}:${String(i + 1)} ${ligne.trim()}`);
      });
    }
    expect(problemes).toEqual([]);
  });
});
