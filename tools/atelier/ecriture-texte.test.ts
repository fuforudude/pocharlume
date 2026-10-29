import { describe, expect, it } from 'vitest';
import { fusionnerGrille, remplacerGrilles } from './ecriture-texte.ts';

describe('édition ciblée de grilles', () => {
  const texte = '# titre\nsprite a\n  .ab.\n  ..b.\n\n# fin\n';

  it('ne change rien quand la grille est identique', () => {
    expect(remplacerGrilles(texte, [{ debut: 3, longueur: 2, lignes: ['.ab.', '..b.'] }])).toBe(texte);
  });

  it('ne réécrit que la ligne modifiée, avec son indentation', () => {
    expect(remplacerGrilles(texte, [{ debut: 3, longueur: 2, lignes: ['.ab.', '.cb.'] }])).toBe('# titre\nsprite a\n  .ab.\n  .cb.\n\n# fin\n');
  });

  it('ignore les points finaux et garde la ligne d\'origine', () => {
    expect(fusionnerGrille(['.ab.'], ['.ab...'])).toEqual(['.ab.']);
  });

  it('allonge la grille et remplace une ligne vide par un point', () => {
    expect(remplacerGrilles(texte, [{ debut: 3, longueur: 2, lignes: ['.ab.', '..b.', '', 'c'] }])).toBe('# titre\nsprite a\n  .ab.\n  ..b.\n  .\n  c\n\n# fin\n');
  });

  it('respecte les fins de ligne CRLF', () => {
    const crlf = texte.replaceAll('\n', '\r\n');
    expect(remplacerGrilles(crlf, [{ debut: 3, longueur: 2, lignes: ['.ab.', '.cb.', 'd'] }]))
      .toBe('# titre\r\nsprite a\r\n  .ab.\r\n  .cb.\r\n  d\r\n\r\n# fin\r\n');
  });

  it('applique plusieurs blocs sans décaler les suivants', () => {
    const deux = 'x\n.a\n\ny\n.b\n';
    expect(remplacerGrilles(deux, [{ debut: 2, longueur: 1, lignes: ['.a', '.c'] }, { debut: 5, longueur: 1, lignes: ['.z'] }])).toBe('x\n.a\n.c\n\ny\n.z\n');
  });
});
