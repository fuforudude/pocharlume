// Tests de l'outil d'aperçu des skins du DLC, sur une petite source d'essai écrite à la main.
import { describe, expect, it } from 'vitest';
import { lirePalette, lireSprites } from '../art/format.ts';
import { decoderPng, encoderPng, nouvelleImage } from '../art/png.ts';
import { FACTEUR, MARGE, lireEntetes, rendreApercus } from './skins.ts';

const PALETTES = new Map([['commune', lirePalette('a ff0000\nb 00ff00\n', 'p.txt')]]);
const planche = (): ReturnType<typeof nouvelleImage> => nouvelleImage(8, 8);

/** « Jeu » d'essai : une tour de 6×8 avec un point tireur, et un tireur de 2×2. */
const JEU = lireSprites(`palette commune
contour non
sprite tour-essai
categorie tour
taille 6 8
ancre 3 7
point tireur 3 2
aaaaaa

sprite tireur-essai
taille 2 2
ancre 1 1
bb
bb
`, 'jeu.txt');

const SOURCE = `# Skin d'essai
#: moderne-essai + tireur-essai@tireur | Tour d'essai | tour-essai + tireur-essai@tireur
#: moderne-ennemi | Ennemi d'essai | -
palette commune
contour non
sprite moderne-essai
categorie tour
taille 6 8
ancre 3 7
point tireur 3 2
bbbbbb

sprite moderne-ennemi
categorie ennemi
taille 4 4
ancre 2 3
aaaa
`;

describe('aperçus des skins du DLC', () => {
  it('lit les en-têtes : id, nom, original et compositions', () => {
    const [skin, ennemi] = lireEntetes(SOURCE, 'essai.txt');
    expect(skin).toMatchObject({
      id: 'moderne-essai',
      nom: 'Tour d\'essai',
      skin: { base: 'moderne-essai', poses: [{ sprite: 'tireur-essai', point: 'tireur' }] },
      original: { base: 'tour-essai' },
      ligne: 2,
    });
    expect(ennemi).toMatchObject({ id: 'moderne-ennemi', original: null });
  });

  it('refuse un en-tête incomplet', () => {
    expect(() => lireEntetes('#: seul-id\n', 'essai.txt')).toThrow(/en-tête attendu/);
  });

  it('produit un PNG agrandi de la bonne taille pour le skin et son original, tireur compris', () => {
    const apercus = rendreApercus({ jeu: JEU, dlc: [{ texte: SOURCE, fichier: 'essai.txt' }], palettes: PALETTES, planche });
    expect(apercus.map((a) => [a.entete.id, a.categorie])).toEqual([['moderne-essai', 'tour'], ['moderne-ennemi', 'ennemi']]);
    const [tour, ennemi] = apercus;
    // Le tireur (2×2, ancre 1 1) posé au point 3 2 tient dans le cadre de 6×8 : l'image garde la taille du cadre.
    const png = decoderPng(encoderPng(tour?.skin ?? nouvelleImage(1, 1)));
    expect([png.largeur, png.hauteur]).toEqual([(6 + 2 * MARGE) * FACTEUR, (8 + 2 * MARGE) * FACTEUR]);
    expect([tour?.original?.largeur, tour?.original?.hauteur]).toEqual([png.largeur, png.hauteur]);
    expect([ennemi?.skin.largeur, ennemi?.skin.hauteur]).toEqual([(4 + 2 * MARGE) * FACTEUR, (4 + 2 * MARGE) * FACTEUR]);
    expect(ennemi?.original).toBeNull();
    // Le pixel du tireur (vert) est bien posé au-dessus de la tour, en (2, 1) du cadre.
    const i = (((1 + MARGE) * FACTEUR) * png.largeur + (2 + MARGE) * FACTEUR) * 4;
    expect([...png.pixels.slice(i, i + 4)]).toEqual([0, 255, 0, 255]);
  });

  it('agrandit les compositions qui dépassent du cadre', () => {
    const haut = SOURCE.replace('point tireur 3 2\nbbbbbb', 'point tireur 3 0\nbbbbbb');
    const [tour] = rendreApercus({ jeu: JEU, dlc: [{ texte: haut, fichier: 'essai.txt' }], palettes: PALETTES, planche, facteur: 1 });
    expect([tour?.skin.largeur, tour?.skin.hauteur]).toEqual([6 + 2 * MARGE, 9 + 2 * MARGE]);
  });

  it('signale un skin déclaré sans sprite', () => {
    const texte = '#: moderne-absent | Absent | -\npalette commune\nsprite autre\na\n';
    expect(() => rendreApercus({ jeu: JEU, dlc: [{ texte, fichier: 'essai.txt' }], palettes: PALETTES, planche })).toThrow(/aucun sprite/);
  });
});
