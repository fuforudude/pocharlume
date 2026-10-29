// L'atelier est un outil local : il n'entre jamais dans le build du site ni dans le jeu livré.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RACINE = join(import.meta.dirname, '..', '..');
/** Ce qui désignerait l'outil (le mot « atelier » seul est aussi du vocabulaire du jeu). */
const OUTIL = /tools\/atelier|atelier\.config|atelier-pocharlume/;

function sources(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? sources(chemin) : /\.ts$/.test(nom) ? [chemin] : [];
  });
}

describe('l\'atelier reste hors du build', () => {
  it('le jeu (src/) n\'importe rien de l\'atelier', () => {
    const fautifs = sources(join(RACINE, 'src')).filter((f) => OUTIL.test(readFileSync(f, 'utf8')));
    expect(fautifs).toEqual([]);
  });

  it('la page d\'entrée, la config Vite et la commande de build ne le citent pas', () => {
    expect(readFileSync(join(RACINE, 'index.html'), 'utf8')).not.toMatch(OUTIL);
    expect(readFileSync(join(RACINE, 'vite.config.ts'), 'utf8')).not.toMatch(OUTIL);
    const scripts = (JSON.parse(readFileSync(join(RACINE, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    expect(scripts['build']).not.toMatch(OUTIL);
    expect(scripts['verifier']).not.toMatch(OUTIL);
    expect(scripts['editeur']).toMatch(OUTIL);
  });
});
