// Skins du DLC « Temps modernes » : lecture des sources (art/dlc-moderne/**, même format que art/sprites) et aperçus
// agrandis, chaque skin à côté du sprite d'origine dont il reprend le rôle. Le dessin passe par le moteur de tools/art.
//
// Chaque skin est déclaré par une ligne d'en-tête (un commentaire pour le format des sprites) :
//
//   #: <id> | <nom> | <original>
//
// <id> est le nom du sprite du skin, <original> celui du sprite du jeu (ou `-` s'il n'y en a pas). Les deux acceptent une
// composition `sprite + autre@point` : `autre` est posé par son ancre sur le point nommé `point` du premier sprite (le
// chat tireur sur le Clocher des Archers : `tour-tir-1 + archer-chat@tireur`). La catégorie (tour, ennemi…) est celle du
// sprite. Les sources du DLC peuvent reprendre des sprites du jeu (`modele`, `derive`, cadres d'un autre sprite).
import { dessinerSprites, type SpriteDessine } from '../art/dessin.ts';
import { ErreurFormat, lireSprites, type SpriteSource } from '../art/format.ts';
import { agrandirImage, poser } from '../art/apercu.ts';
import { nouvelleImage, type Image } from '../art/png.ts';

export interface Pose {
  readonly sprite: string;
  readonly point: string;
}

export interface Composition {
  readonly base: string;
  readonly poses: readonly Pose[];
}

export interface Entete {
  readonly id: string;
  readonly nom: string;
  readonly skin: Composition;
  readonly original: Composition | null;
  readonly fichier: string;
  readonly ligne: number;
}

export interface SourceDlc {
  readonly texte: string;
  /** Chemin affiché dans les erreurs et l'index (art/dlc-moderne/…). */
  readonly fichier: string;
}

export interface Apercu {
  readonly entete: Entete;
  readonly categorie: string;
  readonly skin: Image;
  readonly original: Image | null;
}

/** Agrandissement des aperçus. */
export const FACTEUR = 6;
/** Bord autour du sprite, en pixels du sprite. */
export const MARGE = 2;
/** Fond proche de la terre du Village Affamé, pour juger la lisibilité en situation. */
const FOND = [0x4a, 0x47, 0x36] as const;

function lireComposition(texte: string, fichier: string, ligne: number): Composition {
  const [base = '', ...autres] = texte.split('+').map((m) => m.trim());
  if (!/^[a-z0-9-]+$/.test(base)) throw new ErreurFormat(fichier, ligne, `sprite attendu, lu « ${base} »`);
  const poses = autres.map((m): Pose => {
    const r = /^([a-z0-9-]+)@([\w-]+)$/.exec(m);
    if (!r) throw new ErreurFormat(fichier, ligne, `pose attendue sous la forme sprite@point, lu « ${m} »`);
    return { sprite: r[1] ?? '', point: r[2] ?? '' };
  });
  return { base, poses };
}

/** Lignes `#: id | nom | original` d'une source. */
export function lireEntetes(texte: string, fichier: string): Entete[] {
  const entetes: Entete[] = [];
  texte.split(/\r?\n/).forEach((brute, i) => {
    const ligne = brute.trim();
    if (!ligne.startsWith('#:')) return;
    const champs = ligne.slice(2).split('|').map((c) => c.trim());
    const [id = '', nom = '', original = ''] = champs;
    if (champs.length !== 3 || id === '' || nom === '') {
      throw new ErreurFormat(fichier, i + 1, 'en-tête attendu : #: id | nom | original (ou - sans original)');
    }
    const skin = lireComposition(id, fichier, i + 1);
    entetes.push({
      id: skin.base,
      nom,
      skin,
      original: original === '' || original === '-' ? null : lireComposition(original, fichier, i + 1),
      fichier,
      ligne: i + 1,
    });
  });
  return entetes;
}

/** Pose le premier cadre de repos de la composition sur un fond de terre, avec une marge, puis l'agrandit. */
export function rendreComposition(c: Composition, sprites: ReadonlyMap<string, SpriteDessine>, facteur = FACTEUR): Image {
  const trouver = (nom: string): SpriteDessine => {
    const s = sprites.get(nom);
    if (!s) throw new Error(`sprite inconnu « ${nom} »`);
    return s;
  };
  const base = trouver(c.base);
  const couches = [{ s: base, x: 0, y: 0 }];
  for (const p of c.poses) {
    const s = trouver(p.sprite);
    const point = base.points.get(p.point);
    if (!point) throw new Error(`le sprite « ${base.nom} » n’a pas de point « ${p.point} »`);
    couches.push({ s, x: point[0] - s.ancre[0], y: point[1] - s.ancre[1] });
  }
  const x0 = Math.min(...couches.map((k) => k.x));
  const y0 = Math.min(...couches.map((k) => k.y));
  const x1 = Math.max(...couches.map((k) => k.x + k.s.largeur));
  const y1 = Math.max(...couches.map((k) => k.y + k.s.hauteur));
  const image = nouvelleImage(x1 - x0 + 2 * MARGE, y1 - y0 + 2 * MARGE);
  for (let i = 0; i < image.pixels.length; i += 4) {
    image.pixels[i] = FOND[0];
    image.pixels[i + 1] = FOND[1];
    image.pixels[i + 2] = FOND[2];
    image.pixels[i + 3] = 255;
  }
  for (const k of couches) {
    const anim = k.s.anims.find((a) => a.nom === 'repos') ?? k.s.anims[0];
    const couche = anim?.cadres[0]?.couche;
    if (couche) poser(image, couche, k.x - x0 + MARGE, k.y - y0 + MARGE);
  }
  return facteur === 1 ? image : agrandirImage(image, facteur);
}

export interface Entrees {
  /** Sprites du jeu (art/sprites), pour les originaux et les reprises. */
  readonly jeu: readonly SpriteSource[];
  readonly dlc: readonly SourceDlc[];
  readonly palettes: ReadonlyMap<string, ReadonlyMap<string, string>>;
  readonly planche: (chemin: string) => Image;
  readonly facteur?: number;
}

/** Dessine les sprites du jeu et du DLC ensemble et produit l'aperçu de chaque skin déclaré. */
export function rendreApercus(e: Entrees): Apercu[] {
  const sourcesDlc = e.dlc.flatMap((f) => lireSprites(f.texte, f.fichier));
  const entetes = e.dlc.flatMap((f) => lireEntetes(f.texte, f.fichier));
  const vus = new Set<string>();
  for (const en of entetes) {
    if (vus.has(en.id)) throw new ErreurFormat(en.fichier, en.ligne, `skin « ${en.id} » déclaré deux fois`);
    vus.add(en.id);
    if (!sourcesDlc.some((s) => s.nom === en.id)) throw new ErreurFormat(en.fichier, en.ligne, `aucun sprite « ${en.id} » dans les sources du DLC`);
  }
  const dessines = dessinerSprites({ sprites: [...e.jeu, ...sourcesDlc], palettes: e.palettes, planche: e.planche });
  const parNom = new Map(dessines.map((s) => [s.nom, s]));
  const facteur = e.facteur ?? FACTEUR;
  return entetes.map((en) => ({
    entete: en,
    categorie: parNom.get(en.id)?.categorie ?? '',
    skin: rendreComposition(en.skin, parNom, facteur),
    original: en.original ? rendreComposition(en.original, parNom, facteur) : null,
  }));
}
