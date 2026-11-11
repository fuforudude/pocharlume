// Tests de l'outil d'aperçu des skins du DLC, sur une petite source d'essai écrite à la main.
import { describe, expect, it } from 'vitest';
import { lirePalette, lireSprites } from '../art/format.ts';
import { decoderPng, encoderPng, nouvelleImage } from '../art/png.ts';
import { FACTEUR, MARGE, PAUSE_UNIQUE, decrireEcart, estBloquant, lireEntetes, rendreApercus } from './skins.ts';

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

/** Original animé : une tour à repos de 2 images (300 ms) et attaque de 2 images, un tireur à repos de 3 images. */
const JEU_ANIME = lireSprites(`palette commune
contour non
sprite tour-anim
categorie tour
taille 4 4
ancre 2 3
point tireur 2 1
anim repos 300
cadre
aaaa
cadre
bbbb
anim attaque 100
cadre
aaaa
cadre
aaaa
....
aaaa

sprite tireur-anim
taille 2 2
ancre 1 1
anim repos 200
cadre
bb
cadre
aa
cadre
bb
anim mort 100
cadre
aa
`, 'jeu.txt');

const SKIN_ANIME = `#: moderne-anim + moderne-tireur@tireur | Skin animé | tour-anim + tireur-anim@tireur
palette commune
contour non
sprite moderne-anim
categorie tour
taille 4 4
ancre 2 3
point tireur 2 1
anim repos 300
cadre
bbbb
cadre
aaaa

sprite moderne-tireur
taille 2 2
ancre 1 1
anim repos 200
cadre
aa
cadre
bb
`;

describe('animations des skins du DLC', () => {
  const rendre = (texte: string): ReturnType<typeof rendreApercus> =>
    rendreApercus({ jeu: JEU_ANIME, dlc: [{ texte, fichier: 'essai.txt' }], palettes: PALETTES, planche, facteur: 1 });

  it('liste les animations du skin puis celles de l’original qui lui manquent, tireur compris', () => {
    const [a] = rendre(SKIN_ANIME);
    expect(a?.animations.map((x) => [x.nom, x.skin !== null, x.original !== null])).toEqual([
      ['repos', true, true], ['attaque', false, true], ['mort', false, true],
    ]);
  });

  it('compose les boucles de cadences différentes jusqu’à ce qu’elles se retrouvent', () => {
    const [a] = rendre(SKIN_ANIME);
    const original = a?.animations[0]?.original;
    // Tour 2 × 300 ms, tireur 3 × 200 ms : une boucle commune de 600 ms, changements à 0, 200, 300, 400.
    expect(original?.boucle).toBe(true);
    expect(original?.images.map((i) => i.duree)).toEqual([200, 100, 100, 200]);
    // Le skin : tour 600 ms, tireur 400 ms → 1200 ms.
    expect(a?.animations[0]?.skin?.images.reduce((t, i) => t + i.duree, 0)).toBe(1200);
  });

  it('joue une animation unique une fois, la tour seule avec le tireur en repos, puis marque une pause', () => {
    const [a] = rendre(SKIN_ANIME);
    const attaque = a?.animations[1]?.original;
    expect(attaque?.boucle).toBe(false);
    // Attaque 2 × 100 ms ; le tireur reste en repos (son image change à 200 ms, après la fin).
    expect(attaque?.images.map((i) => i.duree)).toEqual([100, 100 + PAUSE_UNIQUE]);
  });

  it('montre seul le tireur pour une animation que la tour n’a pas', () => {
    const [a] = rendre(SKIN_ANIME);
    const mort = a?.animations[2]?.original;
    expect([mort?.images[0]?.image.largeur, mort?.images[0]?.image.hauteur]).toEqual([2 + 2 * MARGE, 2 + 2 * MARGE]);
  });

  it('relève les écarts d’animations avec l’original, sprite par sprite', () => {
    const [a] = rendre(SKIN_ANIME);
    expect(a?.ecarts.map(decrireEcart)).toEqual([
      'moderne-anim (moderne-anim / tour-anim) : manque attaque',
      'moderne-anim (moderne-tireur / tireur-anim) : manque mort ; repos : 2 images au lieu de 3',
    ]);
    expect(a?.ecarts.every(estBloquant)).toBe(true);
  });

  it('ne signale rien quand le skin a les mêmes animations, et la cadence à part', () => {
    const complet = SKIN_ANIME
      .replace('anim repos 300\ncadre\nbbbb\ncadre\naaaa\n', 'anim repos 300\ncadre\nbbbb\ncadre\naaaa\nanim attaque 100\ncadre\nbbbb\ncadre\nbbbb\n')
      .replace('anim repos 200\ncadre\naa\ncadre\nbb\n', 'anim repos 250\ncadre\naa\ncadre\nbb\ncadre\naa\nanim mort 100\ncadre\nbb\n');
    const [a] = rendre(complet);
    expect(a?.ecarts.filter(estBloquant)).toEqual([]);
    expect(a?.ecarts[1]?.cadences.map((c) => c.nom)).toEqual(['repos']);
  });
});
