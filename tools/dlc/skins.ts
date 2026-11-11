// Skins du DLC « Temps modernes » : lecture des sources (art/dlc-moderne/**, même format que art/sprites), aperçus
// agrandis (pose de repos et chaque animation), chaque skin à côté du sprite d'origine dont il reprend le rôle, et
// comparaison de leurs animations (mêmes noms, même nombre d'images). Le dessin passe par le moteur de tools/art.
//
// Chaque skin est déclaré par une ligne d'en-tête (un commentaire pour le format des sprites) :
//
//   #: <id> | <nom> | <original>
//
// <id> est le nom du sprite du skin, <original> celui du sprite du jeu (ou `-` s'il n'y en a pas). Les deux acceptent une
// composition `sprite + autre@point` : `autre` est posé par son ancre sur le point nommé `point` du premier sprite (le
// chat tireur sur le Clocher des Archers : `tour-tir-1 + archer-chat@tireur`). La catégorie (tour, ennemi…) est celle du
// sprite. Les sources du DLC peuvent reprendre des sprites du jeu (`modele`, `derive`, cadres d'un autre sprite).
import { dessinerSprites, type AnimDessinee, type CadreDessine, type SpriteDessine } from '../art/dessin.ts';
import { ErreurFormat, lireSprites, type SpriteSource } from '../art/format.ts';
import { agrandirImage, poser } from '../art/apercu.ts';
import { nouvelleImage, type Image } from '../art/png.ts';
import type { ImageGif } from './gif.ts';

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

export interface AnimationApercu {
  readonly nom: string;
  /** Animation du skin (null si le skin ne l'a pas encore alors que l'original l'a). */
  readonly skin: ImageAnimee | null;
  readonly original: ImageAnimee | null;
}

export interface Apercu {
  readonly entete: Entete;
  readonly categorie: string;
  /** Pose de repos (premier cadre). */
  readonly skin: Image;
  readonly original: Image | null;
  /** Animations du skin, puis celles de l'original qui lui manquent. */
  readonly animations: readonly AnimationApercu[];
  /** Comparaison des animations avec l'original, sprite par sprite (vide sans original). */
  readonly ecarts: readonly Ecart[];
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

interface Couche {
  readonly s: SpriteDessine;
  readonly x: number;
  readonly y: number;
}

function trouverSprite(sprites: ReadonlyMap<string, SpriteDessine>, nom: string): SpriteDessine {
  const s = sprites.get(nom);
  if (!s) throw new Error(`sprite inconnu « ${nom} »`);
  return s;
}

/** Sprites de la composition, chacun à sa place (la base en 0 0, les poses par leur ancre sur le point nommé). */
function couchesComposition(c: Composition, sprites: ReadonlyMap<string, SpriteDessine>): Couche[] {
  const base = trouverSprite(sprites, c.base);
  const couches: Couche[] = [{ s: base, x: 0, y: 0 }];
  for (const p of c.poses) {
    const s = trouverSprite(sprites, p.sprite);
    const point = base.points.get(p.point);
    if (!point) throw new Error(`le sprite « ${base.nom} » n’a pas de point « ${p.point} »`);
    couches.push({ s, x: point[0] - s.ancre[0], y: point[1] - s.ancre[1] });
  }
  return couches;
}

/** Image sur fond de terre, avec une marge, où chaque couche pose le cadre que `cadre` lui donne. */
function poserCouches(couches: readonly Couche[], cadre: (k: Couche) => CadreDessine | undefined, facteur: number): Image {
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
    const couche = cadre(k)?.couche;
    if (couche) poser(image, couche, k.x - x0 + MARGE, k.y - y0 + MARGE);
  }
  return facteur === 1 ? image : agrandirImage(image, facteur);
}

function animRepos(s: SpriteDessine): AnimDessinee | undefined {
  return s.anims.find((a) => a.nom === 'repos') ?? s.anims[0];
}

/** Pose le premier cadre de repos de la composition sur un fond de terre, avec une marge, puis l'agrandit. */
export function rendreComposition(c: Composition, sprites: ReadonlyMap<string, SpriteDessine>, facteur = FACTEUR): Image {
  return poserCouches(couchesComposition(c, sprites), (k) => animRepos(k.s)?.cadres[0], facteur);
}

/** Noms des animations d'une composition : celles de la base, puis celles que seules les poses ont (le tireur). */
export function animationsComposition(c: Composition, sprites: ReadonlyMap<string, SpriteDessine>): string[] {
  const noms: string[] = [];
  for (const k of couchesComposition(c, sprites)) {
    for (const a of k.s.anims) if (!noms.includes(a.nom)) noms.push(a.nom);
  }
  return noms;
}

export interface ImageAnimee {
  readonly boucle: boolean;
  /** Images agrandies, avec leur durée en millisecondes. */
  readonly images: readonly ImageGif[];
}

/** Pause ajoutée sur la dernière image d'une animation jouée une fois, pour que la boucle du GIF reste lisible. */
export const PAUSE_UNIQUE = 500;
/** Au-delà, une boucle composée (tour et tireur de cadences différentes) est coupée à la plus longue des deux. */
const BOUCLE_MAX = 15000;

function pgcd(a: number, b: number): number {
  return b === 0 ? a : pgcd(b, a % b);
}

interface Piste {
  readonly k: Couche;
  readonly cadres: readonly CadreDessine[];
  readonly total: number;
  readonly boucle: boolean;
  readonly actif: boolean;
}

function cadreA(p: Piste, t: number): CadreDessine | undefined {
  if (p.total === 0) return p.cadres[0];
  let reste = p.boucle ? t % p.total : Math.min(t, p.total - 1);
  for (const x of p.cadres) {
    if (reste < x.duree) return x;
    reste -= x.duree;
  }
  return p.cadres[p.cadres.length - 1];
}

function memesPixels(a: Image, b: Image): boolean {
  if (a.largeur !== b.largeur || a.hauteur !== b.hauteur) return false;
  for (let i = 0; i < a.pixels.length; i++) if (a.pixels[i] !== b.pixels[i]) return false;
  return true;
}

/**
 * Animation `nom` de la composition. Les sprites qui l'ont la jouent ensemble ; ceux qui ne l'ont pas restent en repos
 * (la tour pendant que le tireur tire). Une animation que seules les poses ont (marche, mort du tireur) montre la pose seule.
 * Les boucles de durées différentes tournent jusqu'à se retrouver ; une animation jouée une fois finit sur sa dernière image,
 * tenue PAUSE_UNIQUE ms de plus.
 */
export function rendreAnimation(c: Composition, sprites: ReadonlyMap<string, SpriteDessine>, nom: string, facteur = FACTEUR): ImageAnimee | null {
  let couches = couchesComposition(c, sprites);
  if (!couches[0]?.s.anims.some((a) => a.nom === nom)) {
    couches = couches.slice(1).filter((k) => k.s.anims.some((a) => a.nom === nom));
    if (couches.length === 0) return null;
  }
  const pistes: Piste[] = couches.map((k) => {
    const propre = k.s.anims.find((a) => a.nom === nom);
    const cadres = (propre ?? animRepos(k.s))?.cadres ?? [];
    return { k, cadres, total: cadres.reduce((t, x) => t + x.duree, 0), boucle: propre ? propre.boucle : true, actif: propre !== undefined };
  });
  const actives = pistes.filter((p) => p.actif && p.total > 0);
  const boucle = actives.every((p) => p.boucle);
  let duree: number;
  if (boucle) {
    duree = actives.reduce((d, p) => (d * p.total) / pgcd(d, p.total), 1);
    if (duree > BOUCLE_MAX) duree = Math.max(...actives.map((p) => p.total));
  } else {
    duree = Math.max(...actives.filter((p) => !p.boucle).map((p) => p.total));
  }
  // Instants où au moins un sprite change d'image.
  const instants = new Set([0]);
  for (const p of pistes) {
    if (p.total === 0) continue;
    for (let t0 = 0; t0 < duree; t0 += p.total) {
      let t = t0;
      for (const x of p.cadres) {
        t += x.duree;
        if (t < duree) instants.add(t);
      }
      if (!p.boucle) break;
    }
  }
  const tries = [...instants].sort((a, b) => a - b);
  const images: ImageGif[] = [];
  tries.forEach((t, i) => {
    const suivant = tries[i + 1] ?? duree;
    const image = poserCouches(couches, (k) => {
      const p = pistes.find((q) => q.k === k);
      return p ? cadreA(p, t) : undefined;
    }, facteur);
    const precedente = images[images.length - 1];
    if (precedente && memesPixels(precedente.image, image)) {
      images[images.length - 1] = { image: precedente.image, duree: precedente.duree + suivant - t };
    } else {
      images.push({ image, duree: suivant - t });
    }
  });
  if (!boucle) {
    const derniere = images[images.length - 1];
    if (derniere) images[images.length - 1] = { ...derniere, duree: derniere.duree + PAUSE_UNIQUE };
  }
  return { boucle, images };
}

export interface AnimationSprite {
  readonly nom: string;
  readonly images: number;
  readonly durees: readonly number[];
  readonly boucle: boolean;
}

/** Animations d'un sprite dessiné, dans l'ordre de ses sources. */
export function animationsSprite(s: SpriteDessine): AnimationSprite[] {
  return s.anims.map((a) => ({ nom: a.nom, images: a.cadres.length, durees: a.cadres.map((x) => x.duree), boucle: a.boucle }));
}

export interface Ecart {
  /** Skin concerné, et sprite du skin comparé (la base ou un tireur) à celui de l'original. */
  readonly id: string;
  readonly sprite: string;
  readonly original: string;
  readonly manquantes: readonly string[];
  readonly enTrop: readonly string[];
  /** Animations présentes des deux côtés mais avec un autre nombre d'images. */
  readonly images: readonly { readonly nom: string; readonly skin: number; readonly original: number }[];
  /** Même nombre d'images mais d'autres durées (informatif : la cadence peut s'écarter avec une raison). */
  readonly cadences: readonly { readonly nom: string; readonly skin: readonly number[]; readonly original: readonly number[] }[];
}

/** Compare un sprite du skin à celui de l'original : mêmes noms d'animations, même nombre d'images, cadences. */
export function comparerSprites(id: string, skin: SpriteDessine, original: SpriteDessine): Ecart {
  const a = animationsSprite(skin);
  const b = animationsSprite(original);
  const images: { nom: string; skin: number; original: number }[] = [];
  const cadences: { nom: string; skin: readonly number[]; original: readonly number[] }[] = [];
  for (const x of a) {
    const y = b.find((o) => o.nom === x.nom);
    if (!y) continue;
    if (x.images !== y.images) images.push({ nom: x.nom, skin: x.images, original: y.images });
    else if (x.durees.some((d, i) => d !== y.durees[i])) cadences.push({ nom: x.nom, skin: x.durees, original: y.durees });
  }
  return {
    id,
    sprite: skin.nom,
    original: original.nom,
    manquantes: b.filter((o) => !a.some((x) => x.nom === o.nom)).map((o) => o.nom),
    enTrop: a.filter((x) => !b.some((o) => o.nom === x.nom)).map((x) => x.nom),
    images,
    cadences,
  };
}

/** Écart bloquant : animation manquante ou en trop, ou nombre d'images différent. */
export function estBloquant(e: Ecart): boolean {
  return e.manquantes.length > 0 || e.enTrop.length > 0 || e.images.length > 0;
}

/** Écart quelconque, cadence comprise. */
export function estEcart(e: Ecart): boolean {
  return estBloquant(e) || e.cadences.length > 0;
}

/** Compare la base du skin à celle de l'original, puis chaque tireur à celui de l'original, dans l'ordre. */
export function comparerEntete(en: Entete, sprites: ReadonlyMap<string, SpriteDessine>): Ecart[] {
  const original = en.original;
  if (!original) return [];
  const paires: [string, string][] = [[en.skin.base, original.base]];
  en.skin.poses.forEach((p, i) => {
    const o = original.poses[i];
    if (o) paires.push([p.sprite, o.sprite]);
  });
  return paires.map(([s, o]) => comparerSprites(en.id, trouverSprite(sprites, s), trouverSprite(sprites, o)));
}

/** Écart lisible en une ligne. */
export function decrireEcart(e: Ecart): string {
  const morceaux: string[] = [];
  if (e.manquantes.length > 0) morceaux.push(`manque ${e.manquantes.join(', ')}`);
  if (e.enTrop.length > 0) morceaux.push(`en trop ${e.enTrop.join(', ')}`);
  for (const i of e.images) morceaux.push(`${i.nom} : ${String(i.skin)} images au lieu de ${String(i.original)}`);
  for (const c of e.cadences) morceaux.push(`${c.nom} : cadence ${c.skin.join(',')} au lieu de ${c.original.join(',')}`);
  return `${e.id} (${e.sprite} / ${e.original}) : ${morceaux.join(' ; ')}`;
}

export interface Entrees {
  /** Sprites du jeu (art/sprites), pour les originaux et les reprises. */
  readonly jeu: readonly SpriteSource[];
  readonly dlc: readonly SourceDlc[];
  readonly palettes: ReadonlyMap<string, ReadonlyMap<string, string>>;
  readonly planche: (chemin: string) => Image;
  readonly facteur?: number;
  /** false : seulement les poses de repos et les écarts, sans dessiner les animations (tests de conformité). */
  readonly animations?: boolean;
}

/** Dessine les sprites du jeu et du DLC ensemble et produit l'aperçu de chaque skin déclaré, animations comprises. */
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
  return entetes.map((en) => {
    const noms = animationsComposition(en.skin, parNom);
    if (en.original) for (const n of animationsComposition(en.original, parNom)) if (!noms.includes(n)) noms.push(n);
    return {
      entete: en,
      categorie: parNom.get(en.id)?.categorie ?? '',
      skin: rendreComposition(en.skin, parNom, facteur),
      original: en.original ? rendreComposition(en.original, parNom, facteur) : null,
      animations: e.animations === false ? [] : noms.map((nom) => ({
        nom,
        skin: rendreAnimation(en.skin, parNom, nom, facteur),
        original: en.original ? rendreAnimation(en.original, parNom, nom, facteur) : null,
      })),
      ecarts: comparerEntete(en, parNom),
    };
  });
}
