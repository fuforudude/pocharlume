// Le jeu doit dire ce que dit docs/lore.md, et les noms des dieux ne doivent apparaître que dans les inscriptions.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../../src/data/ennemis';
import { fr } from '../../src/i18n/fr';
import { frLore } from '../../src/i18n/fr-lore';
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

  it('frLore contient exactement les clés nouvelles du document, et elles seules', () => {
    const dansLeDocument = textes.map((x) => x.cle).filter((c) => CLE_NOUVELLE.test(c)).sort();
    expect(Object.keys(frLore).sort()).toEqual(dansLeDocument);
    const ailleurs = Object.keys(fr).filter((c) => !Object.hasOwn(frLore, c) && CLE_NOUVELLE.test(c));
    expect(ailleurs).toEqual([]);
  });

  it('le jeu a son lot complet : 41 inscriptions, 11 paroles de boss, une description par ennemi', () => {
    expect(Object.keys(frLore).filter((c) => c.startsWith('inscription.'))).toHaveLength(41);
    for (let n = 1; n <= 11; n++) expect(frLore).toHaveProperty(`boss.r${String(n)}.parole`);
    const sansDescription = Object.keys(ENNEMIS).filter((id) => !Object.hasOwn(fr, `ennemi.${id}.desc`));
    expect(sansDescription).toEqual([]);
  });

  it('le DLC a une parole par boss (boss.m1 à boss.m3), reconnue comme clé nouvelle', () => {
    for (let n = 1; n <= 3; n++) {
      expect(frLore).toHaveProperty(`boss.m${String(n)}.parole`);
      expect(CLE_NOUVELLE.test(`boss.m${String(n)}.parole`)).toBe(true);
    }
  });

  it('lit une ligne, ignore l’Univers et refuse une clé répétée', () => {
    const doc = '## Univers\n- `a.b` : non\n## Autre\n- `c.d` : oui ’ « x »\nlibre\n';
    expect(lireLore(doc)).toEqual([{ cle: 'c.d', texte: 'oui ’ « x »', ligne: 4 }]);
    expect(() => lireLore('- `a` : 1\n- `a` : 2\n')).toThrow('déjà vue');
    expect(() => lireLore('- `a` : \n')).toThrow('vide');
  });

  it('refuse une ligne mal formée hors de l’Univers (jamais ignorée en silence)', () => {
    expect(() => lireLore('- `a` texte sans deux-points\n')).toThrow('ligne 1');
    expect(() => lireLore('- `a`: ok\n- `b` ; non\n')).toThrow('ligne 2');
    expect(() => lireLore('## Univers\n- `a` pas grave\n')).not.toThrow();
  });

  it('accepte le deux-points collé, ou précédé d’une espace insécable ou fine', () => {
    const doc = '- `a`: un\n- `b` : deux\n- `c` : trois\n- `d` : quatre\n';
    expect(lireLore(doc).map((x) => x.texte)).toEqual(['un', 'deux', 'trois', 'quatre']);
  });

  it('recolle une ligne indentée à l’entrée qui la précède', () => {
    const doc = '- `a` : début\n    suite\n\t fin\n- `b` : autre\n\n  perdue\n';
    expect(lireLore(doc).map((x) => x.texte)).toEqual(['début suite fin', 'autre']);
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
