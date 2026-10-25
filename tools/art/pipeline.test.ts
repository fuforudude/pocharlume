// Tests du format des sprites et des opérations de dessin, sur de petits exemples écrits à la main.
import { describe, expect, it } from 'vitest';
import { contourner, coucheVide, ecrirePixel, estOpaque, lirePixel, tourner, type Couche } from './couche.ts';
import { dessinerSprites, type SpriteDessine } from './dessin.ts';
import { ErreurFormat, lirePalette, lireSprites } from './format.ts';
import { decoderPng, encoderPng, nouvelleImage } from './png.ts';

const PALETTE = new Map([['commune', lirePalette('a ff0000\nb 00ff00\nc 0000ff\nd 11223380\n', 'p.txt')]]);
const ROUGE = 0xff0000ff;
const VERT = 0x00ff00ff;
const BLEU = 0x0000ffff;

function dessiner(texte: string, planche = nouvelleImage(8, 8)): Map<string, SpriteDessine> {
  const sprites = dessinerSprites({ sprites: lireSprites(texte, 'essai.txt'), palettes: PALETTE, planche: () => planche });
  return new Map(sprites.map((s) => [s.nom, s]));
}

function cadre(s: SpriteDessine | undefined, anim = 'repos', i = 0, sansContour = true): Couche {
  const anims = sansContour ? s?.animsSansContour ?? s?.anims : s?.anims;
  const c = anims?.find((a) => a.nom === anim)?.cadres[i]?.couche;
  if (!c) throw new Error(`cadre absent ${anim}.${String(i)}`);
  return c;
}

/** Grille de lettres d'une couche : a, b, c pour les couleurs de l'essai, K pour le contour. */
function lettres(c: Couche): string[] {
  const noms = new Map([[ROUGE, 'a'], [VERT, 'b'], [BLEU, 'c'], [0x2b2928ff, 'K']]);
  const lignes: string[] = [];
  for (let y = 0; y < c.hauteur; y++) {
    let l = '';
    for (let x = 0; x < c.largeur; x++) l += estOpaque(c, x, y) ? noms.get(lirePixel(c, x, y)) ?? '?' : '.';
    lignes.push(l);
  }
  return lignes;
}

const ENTETE = 'palette commune\ntaille 4 4\nancre 2 3\ncontour non\n';

describe('format des sprites', () => {
  it('lit une grille posée juste après le sprite comme un repos d’un cadre, origine comprise', () => {
    const s = dessiner(`${ENTETE}sprite t\norigine 1 1\nab\nc\n`).get('t');
    expect(lettres(cadre(s))).toEqual(['....', '.ab.', '.c..', '....']);
  });

  it('compose des calques, les décale, les retourne, recolore et efface', () => {
    const s = dessiner(`${ENTETE}sprite t
calque barre 0 3
aaaa
anim repos
cadre barre
cadre barre decale 0 -1 + barre couleurs a=b
cadre repos.0 tourne 90
cadre barre
.
._
`).get('t');
    expect(lettres(cadre(s, 'repos', 0))).toEqual(['....', '....', '....', 'aaaa']);
    expect(lettres(cadre(s, 'repos', 1))).toEqual(['....', '....', 'aaaa', 'bbbb']);
    expect(lettres(cadre(s, 'repos', 2))).toEqual(['a...', 'a...', 'a...', 'a...']);
    expect(lettres(cadre(s, 'repos', 3))).toEqual(['....', '....', '....', 'aaaa']);
  });

  it('efface avec _ dans une grille superposée', () => {
    const s = dessiner(`${ENTETE}sprite t
anim repos
cadre
aaaa
cadre repos.0
_._
`).get('t');
    expect(lettres(cadre(s, 'repos', 1))).toEqual(['.a.a', '....', '....', '....']);
  });

  it('recolore seulement dans une zone et rend transparent avec #00000000', () => {
    const s = dessiner(`${ENTETE}sprite t
anim repos
cadre
aaaa
aaaa
cadre repos.0 couleurs a=c dans 0 0 1 0 couleurs a=#00000000 dans 3 1 3 1
`).get('t');
    expect(lettres(cadre(s, 'repos', 1)).slice(0, 2)).toEqual(['ccaa', 'aaa.']);
  });

  it('développe une plage d’indices en plusieurs cadres et lit les cadres Minifolks recolorés', () => {
    const planche = nouvelleImage(8, 4);
    const c = { ...coucheVide(8, 4), pixels: planche.pixels };
    ecrirePixel(c, 0, 3, 0x123456ff);
    ecrirePixel(c, 5, 3, 0x123456ff);
    const s = dessiner(`${ENTETE}sprite t\nminifolks x.png\nrecolore 123456=b\nanim marche\ncadre mf 0.0-1\n`, planche).get('t');
    expect(s?.anims[0]?.cadres.length).toBe(2);
    expect(lettres(cadre(s, 'marche', 0))[3]).toBe('b...');
    expect(lettres(cadre(s, 'marche', 1))[3]).toBe('.b..');
  });

  it('reprend les cadres d’un autre sprite (derive) et sa recette (modele)', () => {
    const sprites = dessiner(`${ENTETE}
sprite base
calque corps 1 1
a
anim repos
cadre corps
cadre corps decale 1 0

sprite recolore
derive base couleurs a=c

sprite habille
modele base
calque corps 1 1
b
`);
    expect(lettres(cadre(sprites.get('recolore'), 'repos', 1))[1]).toBe('..c.');
    expect(lettres(cadre(sprites.get('habille'), 'repos', 0))[1]).toBe('.b..');
    expect(lettres(cadre(sprites.get('habille'), 'repos', 1))[1]).toBe('..b.');
  });

  it('applique les retouches sur les cadres déjà définis', () => {
    const s = dessiner(`${ENTETE}sprite t
anim repos
cadre
a
cadre
.a
retouche repos *
...c
`).get('t');
    expect(lettres(cadre(s, 'repos', 0))[0]).toBe('a..c');
    expect(lettres(cadre(s, 'repos', 1))[0]).toBe('.a.c');
  });

  it('marque attaque, blesse et mort comme jouées une fois', () => {
    const [s] = lireSprites(`${ENTETE}sprite t\nanim repos\ncadre\na\nanim mort\ncadre\na\nanim marche 90 unique\ncadre\na\n`, 'e.txt');
    expect(s?.anims.map((a) => [a.nom, a.boucle, a.duree])).toEqual([['repos', true, 120], ['mort', false, 120], ['marche', false, 90]]);
  });

  it('agrandit les sprites marqués agrandi, ancre comprise', () => {
    const s = dessiner('palette commune\ntaille 4 4\nancre 2 3\nagrandi 2\ncontour non\nsprite t\n...a\n').get('t');
    expect([s?.largeur, s?.hauteur, s?.ancre]).toEqual([8, 8, [4, 7]]);
    expect(lettres(cadre(s))[0]).toBe('......aa');
  });

  it('signale les erreurs avec le fichier et la ligne', () => {
    const erreur = (texte: string): string => {
      try {
        dessiner(texte);
      } catch (e) {
        expect(e).toBeInstanceOf(ErreurFormat);
        return (e as Error).message;
      }
      return 'aucune erreur';
    };
    expect(erreur('sprite t\nbidule 3\n')).toContain('essai.txt:2');
    expect(erreur('aaa\n')).toContain('grille sans cadre');
    expect(erreur(`${ENTETE}sprite t\nz\n`)).toContain('« z » absente de la palette');
    expect(erreur(`${ENTETE}sprite t\naaaaa\n`)).toContain('déborde');
    expect(erreur(`${ENTETE}sprite t\nanim repos\ncadre repos.0\n`)).toContain('cadre introuvable');
    expect(erreur(`${ENTETE}sprite t\nanim repos\ncadre inconnu\n`)).toContain('calque inconnu');
    expect(erreur(`${ENTETE}sprite a\nderive b\nsprite b\nderive a\n`)).toContain('circulaire');
    expect(erreur(`${ENTETE}sprite t\na\nsprite t\nb\n`)).toContain('déjà défini');
    expect(() => lirePalette('. 123456\n', 'p.txt')).toThrow('ne peut pas désigner une couleur');
  });
});

describe('opérations sur les cadres', () => {
  it('ajoute un contour d’un pixel tout autour, sauf sous les pieds, comme le pack', () => {
    const c = coucheVide(5, 5);
    ecrirePixel(c, 2, 2, ROUGE);
    ecrirePixel(c, 2, 3, ROUGE);
    expect(lettres(contourner(c))).toEqual(['.....', '..K..', '.KaK.', '.KaK.', '.....']);
  });

  it('tourne un cadre carré d’un quart de tour dans le sens horaire', () => {
    const c = coucheVide(3, 3);
    ecrirePixel(c, 0, 0, ROUGE);
    expect(lettres(tourner(c, 1))).toEqual(['..a', '...', '...']);
  });

  it('écrit des PNG que l’on relit à l’identique', () => {
    const image = nouvelleImage(3, 2);
    image.pixels.set([1, 2, 3, 4, 250, 251, 252, 253], 4);
    const relue = decoderPng(encoderPng(image));
    expect([relue.largeur, relue.hauteur]).toEqual([3, 2]);
    expect([...relue.pixels]).toEqual([...image.pixels]);
  });

  it('produit une sortie déterministe', () => {
    const image = nouvelleImage(4, 4);
    image.pixels.fill(7);
    expect(encoderPng(image)).toEqual(encoderPng(image));
  });
});
