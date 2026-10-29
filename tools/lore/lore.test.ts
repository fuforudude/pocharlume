// Le jeu doit dire ce que dit docs/lore.md, et les noms des dieux ne doivent apparaître que dans les inscriptions.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fr } from '../../src/i18n/fr';
import { CLE_NOUVELLE, litteral, lireLore } from './lore.ts';

const textes = lireLore(readFileSync(new URL('../../docs/lore.md', import.meta.url), 'utf8'));
const table: Readonly<Record<string, string>> = fr;

describe('docs/lore.md et src/i18n/', () => {
  it('lit les textes du document, sans la section Univers', () => {
    expect(textes.length).toBeGreaterThan(600);
    expect(textes.some((x) => x.cle === 'dieu.charlie')).toBe(true);
  });

  it('chaque texte du document est dans le jeu, à l’identique (lancer `npm run lore` sinon)', () => {
    const differents = textes.filter((x) => table[x.cle] !== x.texte).map((x) => x.cle);
    expect(differents).toEqual([]);
  });

  it('les clés nouvelles ont un genre autorisé', () => {
    const nouvelles = textes.filter((x) => CLE_NOUVELLE.test(x.cle));
    expect(nouvelles.length).toBeGreaterThan(30 + 10 + 30);
  });

  it('lit une ligne, ignore l’Univers et refuse une clé répétée', () => {
    const doc = '## Univers\n- `a.b` : non\n## Autre\n- `c.d` : oui ’ « x »\nlibre\n';
    expect(lireLore(doc)).toEqual([{ cle: 'c.d', texte: 'oui ’ « x »', ligne: 4 }]);
    expect(() => lireLore('- `a` : 1\n- `a` : 2\n')).toThrow('déjà vue');
    expect(() => lireLore('- `a` : \n')).toThrow('vide');
  });

  it('écrit un littéral TypeScript sûr', () => {
    expect(litteral(String.raw`l'x\y`)).toBe(String.raw`'l\'x\\y'`);
  });
});

describe('noms des dieux', () => {
  const NOMS = /(?<![\p{L}\p{N}_])(?:Plume|Charlie|Pollen)(?![\p{L}\p{N}_])/u;

  it('« Plume », « Charlie » et « Pollen » n’apparaissent que dans des inscriptions', () => {
    const fautifs = Object.entries(table)
      .filter(([cle, texte]) => !cle.startsWith('inscription.') && NOMS.test(texte))
      .map(([cle]) => cle);
    expect(fautifs).toEqual([]);
  });

  it('le détecteur voit les noms entiers mais pas « Pennes »', () => {
    expect(NOMS.test('Charlie tenait la porte')).toBe(true);
    expect(NOMS.test('le pollen de mai')).toBe(false);
    expect(NOMS.test('Pennes et plumes')).toBe(false);
  });
});
