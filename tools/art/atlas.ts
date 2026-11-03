// Assemblage de l'atlas : chaque cadre est rogné à ses pixels opaques, les doublons sont fusionnés,
// puis les cadres sont rangés par étagères dans une image de largeur fixe.
import { boiteOpaque, type Couche } from './couche.ts';
import type { AnimDessinee, SpriteDessine } from './dessin.ts';
import { nouvelleImage, type Image } from './png.ts';

/** Structure de public/sprites/atlas.json, lue par le rendu. */
export interface AtlasJson {
  readonly version: 1;
  readonly image: string;
  readonly largeur: number;
  readonly hauteur: number;
  readonly sprites: Readonly<Record<string, SpriteAtlas>>;
}

export interface SpriteAtlas {
  readonly categorie: string;
  /** Taille logique d'un cadre (avant rognage). */
  readonly largeur: number;
  readonly hauteur: number;
  /** Point du cadre posé sur la position de l'entité (au pied pour les personnages et les tours). */
  readonly ancre: { readonly x: number; readonly y: number };
  /** Points nommés en pixels du cadre logique (ex. `tireur` : où poser le chat tireur d'une tour). */
  readonly points?: Readonly<Record<string, { readonly x: number; readonly y: number }>>;
  /** Animations affichées en jeu (avec contour quand le sprite en a un). */
  readonly animations: Readonly<Record<string, AnimationAtlas>>;
  /** Les mêmes sans contour, présentes seulement pour les sprites à contour. */
  readonly sansContour?: Readonly<Record<string, AnimationAtlas>>;
}

export interface AnimationAtlas {
  readonly boucle: boolean;
  readonly cadres: readonly CadreAtlas[];
}

/**
 * Un cadre rogné : le rectangle (x, y, largeur, hauteur) de l'atlas se dessine à (dx, dy) dans le cadre logique.
 * Pour poser un sprite en (px, py) : drawImage(atlas, x, y, largeur, hauteur, px - ancre.x + dx, py - ancre.y + dy, …).
 */
export interface CadreAtlas {
  readonly x: number;
  readonly y: number;
  readonly largeur: number;
  readonly hauteur: number;
  readonly dx: number;
  readonly dy: number;
  /** Durée d'affichage en millisecondes. */
  readonly duree: number;
}

/** 2048 px (la limite sûre des textures mobiles) : à 1024 px de large, les 40 sprites de la variété des ennemis dépassaient 2048 px de haut. */
export const LARGEUR_ATLAS = 2048;
/** Marge vide entre deux cadres, pour qu'un échantillonnage voisin ne bave jamais. */
const MARGE = 1;

interface Morceau {
  readonly cle: string;
  readonly couche: Couche;
  readonly boite: { x: number; y: number; largeur: number; hauteur: number };
  x: number;
  y: number;
}

function cleDe(c: Couche, boite: { x: number; y: number; largeur: number; hauteur: number }): string {
  const lignes: string[] = [`${String(boite.largeur)}x${String(boite.hauteur)}`];
  for (let y = boite.y; y < boite.y + boite.hauteur; y++) {
    const debut = (y * c.largeur + boite.x) * 4;
    lignes.push(Buffer.from(c.pixels.subarray(debut, debut + boite.largeur * 4)).toString('base64'));
  }
  return lignes.join('|');
}

export function construireAtlas(sprites: readonly SpriteDessine[], nomImage = 'atlas.png'): { image: Image; json: AtlasJson } {
  const morceaux = new Map<string, Morceau>();
  const reference = new Map<Couche, Morceau>();

  const enregistrer = (anims: readonly AnimDessinee[], nom: string): void => {
    for (const a of anims) {
      a.cadres.forEach((c, i) => {
        const boite = boiteOpaque(c.couche);
        if (!boite) throw new Error(`Cadre vide : ${nom}/${a.nom}.${String(i)}`);
        const cle = cleDe(c.couche, boite);
        let m = morceaux.get(cle);
        if (!m) {
          m = { cle, couche: c.couche, boite, x: 0, y: 0 };
          morceaux.set(cle, m);
        }
        reference.set(c.couche, m);
      });
    }
  };
  for (const s of sprites) {
    enregistrer(s.anims, s.nom);
    if (s.animsSansContour) enregistrer(s.animsSansContour, s.nom);
  }

  // Étagères : du plus haut au plus bas, puis du plus large au plus étroit ; ordre stable donc atlas reproductible.
  const ordre = [...morceaux.values()].sort((a, b) =>
    b.boite.hauteur - a.boite.hauteur || b.boite.largeur - a.boite.largeur || (a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0));
  let x = 0;
  let y = 0;
  let hauteurEtagere = 0;
  for (const m of ordre) {
    if (m.boite.largeur > LARGEUR_ATLAS) throw new Error('Cadre plus large que l’atlas');
    if (x + m.boite.largeur > LARGEUR_ATLAS) {
      x = 0;
      y += hauteurEtagere + MARGE;
      hauteurEtagere = 0;
    }
    m.x = x;
    m.y = y;
    x += m.boite.largeur + MARGE;
    hauteurEtagere = Math.max(hauteurEtagere, m.boite.hauteur);
  }
  const hauteur = y + hauteurEtagere;
  const image = nouvelleImage(LARGEUR_ATLAS, hauteur);
  for (const m of ordre) {
    for (let j = 0; j < m.boite.hauteur; j++) {
      const source = ((m.boite.y + j) * m.couche.largeur + m.boite.x) * 4;
      image.pixels.set(m.couche.pixels.subarray(source, source + m.boite.largeur * 4), ((m.y + j) * LARGEUR_ATLAS + m.x) * 4);
    }
  }

  const versJson = (anims: readonly AnimDessinee[]): Record<string, AnimationAtlas> => {
    const sortie: Record<string, AnimationAtlas> = {};
    for (const a of anims) {
      sortie[a.nom] = {
        boucle: a.boucle,
        cadres: a.cadres.map((c): CadreAtlas => {
          const m = reference.get(c.couche);
          if (!m) throw new Error('Cadre non rangé');
          return { x: m.x, y: m.y, largeur: m.boite.largeur, hauteur: m.boite.hauteur, dx: m.boite.x, dy: m.boite.y, duree: c.duree };
        }),
      };
    }
    return sortie;
  };

  const spritesJson: Record<string, SpriteAtlas> = {};
  for (const s of [...sprites].sort((a, b) => (a.nom < b.nom ? -1 : 1))) {
    const base = {
      categorie: s.categorie,
      largeur: s.largeur,
      hauteur: s.hauteur,
      ancre: { x: s.ancre[0], y: s.ancre[1] },
      ...(s.points.size > 0 ? { points: Object.fromEntries([...s.points].map(([n, [x, y]]) => [n, { x, y }])) } : {}),
      animations: versJson(s.anims),
    };
    spritesJson[s.nom] = s.animsSansContour ? { ...base, sansContour: versJson(s.animsSansContour) } : base;
  }
  return { image, json: { version: 1, image: nomImage, largeur: LARGEUR_ATLAS, hauteur, sprites: spritesJson } };
}

/** JSON compact mais lisible en diff : un cadre par ligne. */
export function serialiserAtlas(json: AtlasJson): string {
  const texte = JSON.stringify(json, null, 1);
  // Remet chaque objet cadre sur une seule ligne.
  return `${texte.replace(/\{\n\s*"x": (\d+),\n\s*"y": (\d+),\n\s*"largeur": (\d+),\n\s*"hauteur": (\d+),\n\s*"dx": (\d+),\n\s*"dy": (\d+),\n\s*"duree": (\d+)\n\s*\}/g,
    '{ "x": $1, "y": $2, "largeur": $3, "hauteur": $4, "dx": $5, "dy": $6, "duree": $7 }')}\n`;
}
