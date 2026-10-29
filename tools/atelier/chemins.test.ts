import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ecrireFichiers, ErreurChemin, estPermis, normaliser, verifierChemin } from './chemins.ts';

let racine = '';
beforeEach(() => {
  racine = mkdtempSync(join(tmpdir(), 'atelier-'));
  mkdirSync(join(racine, 'art'));
  mkdirSync(join(racine, 'src'));
});
afterEach(() => { rmSync(racine, { recursive: true, force: true }); });

const PERMIS = ['art/', 'src/cartes*.ts'];

describe('chemins d\'écriture', () => {
  it('normalise et refuse les chemins dangereux', () => {
    expect(normaliser('art\\a/./b.txt')).toBe('art/a/b.txt');
    for (const mauvais of ['', '../x', 'art/../../x', '/etc/passwd', 'C:\\x', 'C:x', 'art/\0x']) {
      expect(() => normaliser(mauvais), mauvais).toThrow(ErreurChemin);
    }
  });

  it('reconnaît dossiers, fichiers et motifs', () => {
    expect(estPermis('art/sprites/a.txt', PERMIS)).toBe(true);
    expect(estPermis('src/cartes-a.ts', PERMIS)).toBe(true);
    expect(estPermis('src/cartes/sous.ts', PERMIS)).toBe(false);
    expect(estPermis('src/main.ts', PERMIS)).toBe(false);
    expect(estPermis('artefact/a.txt', PERMIS)).toBe(false);
    expect(estPermis('package.json', PERMIS)).toBe(false);
  });

  it('écrit dans les dossiers permis seulement, tout ou rien', () => {
    expect(ecrireFichiers(racine, [{ chemin: 'art/a.txt', contenu: 'x' }], PERMIS)).toEqual(['art/a.txt']);
    expect(readFileSync(join(racine, 'art', 'a.txt'), 'utf8')).toBe('x');
    expect(() => ecrireFichiers(racine, [{ chemin: 'art/b.txt', contenu: 'y' }, { chemin: 'package.json', contenu: '{}' }], PERMIS)).toThrow(ErreurChemin);
    expect(() => readFileSync(join(racine, 'art', 'b.txt'))).toThrow();
    expect(() => verifierChemin(racine, 'art/../src/x.ts', PERMIS)).toThrow(ErreurChemin);
  });

  it('ne réécrit pas un fichier inchangé', () => {
    writeFileSync(join(racine, 'art', 'a.txt'), 'x');
    expect(ecrireFichiers(racine, [{ chemin: 'art/a.txt', contenu: 'x' }], PERMIS)).toEqual([]);
  });

  it('refuse un lien symbolique qui sort du dossier permis', () => {
    const dehors = mkdtempSync(join(tmpdir(), 'dehors-'));
    try {
      try { symlinkSync(dehors, join(racine, 'art', 'lien'), 'junction'); } catch { return; }
      expect(() => ecrireFichiers(racine, [{ chemin: 'art/lien/vol.txt', contenu: 'x' }], PERMIS)).toThrow(ErreurChemin);
    } finally {
      rmSync(dehors, { recursive: true, force: true });
    }
  });
});

describe('écriture atomique', () => {
  it('si un renommage ou une écriture échoue, aucun fichier du lot n\'est modifié et aucun temporaire ne reste', () => {
    writeFileSync(join(racine, 'art', 'a.txt'), 'avant');
    mkdirSync(join(racine, 'art', 'dossier'));
    expect(() => ecrireFichiers(racine, [{ chemin: 'art/a.txt', contenu: 'apres' }, { chemin: 'art/dossier', contenu: 'x' }], PERMIS)).toThrow();
    expect(readFileSync(join(racine, 'art', 'a.txt'), 'utf8')).toBe('avant');
    expect(readdirSync(join(racine, 'art')).sort()).toEqual(['a.txt', 'dossier']);
  });

  it('écrit tous les fichiers du lot sans laisser de temporaire', () => {
    expect(ecrireFichiers(racine, [{ chemin: 'art/a.txt', contenu: '1' }, { chemin: 'art/b.txt', contenu: '2' }], PERMIS)).toEqual(['art/a.txt', 'art/b.txt']);
    expect(readdirSync(join(racine, 'art')).sort()).toEqual(['a.txt', 'b.txt']);
  });
});
