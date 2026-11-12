// Atlas de sprites : planche PNG + JSON produits par `npm run art` (public/sprites/). Le chargement est le
// seul code asynchrone du rendu ; ensuite tout est synchrone et sans allocation.
import type { AnimationAtlas, AtlasJson, CadreAtlas, SpriteAtlas } from '../../tools/art/atlas.ts';

import type { IdCampagne } from '../engine/definitions';
import { estSkinConnu, imageDuSkin, spritesDuSkin, zoneDuSprite, type ImageDonnees, type Zone } from './palettes-skins';

export type { AnimationAtlas, AtlasJson, CadreAtlas, SpriteAtlas };

/**
 * Un sprite recoloré par un skin : la zone de l'atlas qui contient tous ses cadres, copiée et recolorée une fois, et la même
 * retournée de gauche à droite. Se dessine avec `AtlasRendu.dessinerHabille`, avec les mêmes cadres que le sprite de base.
 */
export interface SpriteHabille {
  readonly nom: string;
  readonly skin: string;
  readonly zone: Zone;
  readonly normal: HTMLCanvasElement;
  readonly miroir: HTMLCanvasElement;
}

/** Rectangle source d'un cadre dans le canvas d'un sprite habillé (ou dans sa version retournée). Pur : testé sans canvas. */
export function sourceHabille(zone: Zone, cadre: CadreAtlas, miroir: boolean): { x: number; y: number } {
  const x = cadre.x - zone.x;
  return { x: miroir ? zone.largeur - x - cadre.largeur : x, y: cadre.y - zone.y };
}

function creerCanvas(largeur: number, hauteur: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexte 2D indisponible');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

/** Une planche, et la même retournée de gauche à droite (les cadres tournés vers la gauche en sont tirés), avec sa largeur. */
interface Planche {
  readonly normal: HTMLCanvasElement;
  readonly miroir: HTMLCanvasElement;
  readonly largeur: number;
}

function creerPlanche(json: AtlasJson, image: CanvasImageSource): { planche: Planche; ctx: CanvasRenderingContext2D } {
  const { canvas, ctx } = creerCanvas(json.largeur, json.hauteur);
  ctx.drawImage(image, 0, 0);
  const m = creerCanvas(json.largeur, json.hauteur);
  m.ctx.translate(json.largeur, 0);
  m.ctx.scale(-1, 1);
  m.ctx.drawImage(canvas, 0, 0);
  return { planche: { normal: canvas, miroir: m.canvas, largeur: json.largeur }, ctx };
}

/**
 * Sprites d'un atlas ajouté (DLC « Temps modernes ») fusionnés à ceux de l'atlas principal : un nom déjà présent est refusé (les
 * sprites du DLC sont tous préfixés `moderne-`). Pur : testé sans canvas.
 */
export function fusionnerSprites(
  principaux: Readonly<Record<string, SpriteAtlas>>,
  ajoutes: Readonly<Record<string, SpriteAtlas>>,
): Record<string, SpriteAtlas> {
  for (const nom of Object.keys(ajoutes)) if (Object.hasOwn(principaux, nom)) throw new Error(`Sprite en double entre deux atlas : ${nom}`);
  return { ...principaux, ...ajoutes };
}

export class AtlasRendu {
  /** La planche principale (celle de l'histoire). */
  private readonly principale: Planche;
  private sprites: Readonly<Record<string, SpriteAtlas>>;
  /** Planche des sprites venus d'un atlas ajouté (DLC) ; les autres sont sur la principale. */
  private readonly planches = new Map<SpriteAtlas, Planche>();
  /** Atlas ajoutés, par nom d'image : chacun ne s'ajoute qu'une fois. */
  private readonly ajoutes = new Set<string>();
  private readonly icones = new Map<string, string>();
  private readonly ctxPlanche: CanvasRenderingContext2D;
  /** Pixels de la planche, lus une seule fois, à la première demande de skin (4 Mo : jamais lus si personne n'équipe de skin). */
  private pixels: ImageDonnees | null = null;
  private readonly habilles = new Map<string, SpriteHabille | null>();
  /** Tampon du flash blanc (`dessinerBlanc`), créé à la première amélioration. */
  private blanc: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;

  constructor(
    readonly json: AtlasJson,
    image: CanvasImageSource,
  ) {
    this.sprites = json.sprites;
    const { planche, ctx } = creerPlanche(json, image);
    this.principale = planche;
    this.ctxPlanche = ctx;
  }

  /**
   * Ajoute les sprites d'un autre atlas, sur sa propre planche (l'atlas du DLC « Temps modernes », chargé seulement pour une partie de
   * cette campagne). Sans effet s'il est déjà ajouté.
   */
  ajouterAtlas(json: AtlasJson, image: CanvasImageSource): void {
    if (this.ajoutes.has(json.image)) return;
    const { planche } = creerPlanche(json, image);
    this.sprites = fusionnerSprites(this.sprites, json.sprites);
    for (const sprite of Object.values(json.sprites)) this.planches.set(sprite, planche);
    this.ajoutes.add(json.image);
  }

  private plancheDe(sprite: SpriteAtlas): Planche {
    return this.planches.get(sprite) ?? this.principale;
  }

  sprite(nom: string): SpriteAtlas | undefined {
    return Object.hasOwn(this.sprites, nom) ? this.sprites[nom] : undefined;
  }

  /** Animation d'un sprite, ou `repos` (toujours présente) si le sprite n'a pas celle-ci. */
  animation(sprite: SpriteAtlas, nom: string): AnimationAtlas | undefined {
    return sprite.animations[nom] ?? sprite.animations.repos;
  }

  cadre(sprite: SpriteAtlas, nomAnimation: string, indice: number): CadreAtlas | undefined {
    return this.animation(sprite, nomAnimation)?.cadres[indice];
  }

  /**
   * Pose un cadre sur le point (px, py) du tampon, entiers : l'ancre du sprite tombe sur ce point.
   * `miroir` retourne le cadre de gauche à droite autour de l'ancre.
   */
  dessiner(ctx: CanvasRenderingContext2D, sprite: SpriteAtlas, cadre: CadreAtlas, px: number, py: number, miroir: boolean): void {
    if (cadre.largeur === 0) return;
    const y = py - sprite.ancre.y + cadre.dy;
    const planche = this.plancheDe(sprite);
    if (miroir) {
      ctx.drawImage(
        planche.miroir,
        planche.largeur - cadre.x - cadre.largeur, cadre.y, cadre.largeur, cadre.hauteur,
        px + sprite.ancre.x - cadre.dx - cadre.largeur, y, cadre.largeur, cadre.hauteur,
      );
    } else {
      ctx.drawImage(planche.normal, cadre.x, cadre.y, cadre.largeur, cadre.hauteur, px - sprite.ancre.x + cadre.dx, y, cadre.largeur, cadre.hauteur);
    }
  }

  /**
   * Comme `dessiner`, mais en silhouette blanche d'opacité `alpha` (flash d'amélioration). Passe par un tampon réutilisé, agrandi
   * seulement si un sprite plus grand se présente : aucune allocation une fois chaud.
   */
  dessinerBlanc(ctx: CanvasRenderingContext2D, sprite: SpriteAtlas, cadre: CadreAtlas, px: number, py: number, miroir: boolean, alpha: number): void {
    if (cadre.largeur === 0 || alpha <= 0) return;
    const l = sprite.largeur;
    const h = sprite.hauteur;
    if (!this.blanc || this.blanc.canvas.width < l || this.blanc.canvas.height < h) {
      this.blanc = creerCanvas(Math.max(l, this.blanc?.canvas.width ?? 0), Math.max(h, this.blanc?.canvas.height ?? 0));
    }
    const { canvas, ctx: t } = this.blanc;
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, canvas.width, canvas.height);
    this.dessiner(t, sprite, cadre, sprite.ancre.x, sprite.ancre.y, miroir);
    t.globalCompositeOperation = 'source-atop';
    t.fillStyle = '#ffffff';
    t.fillRect(0, 0, l, h);
    ctx.globalAlpha = alpha;
    ctx.drawImage(canvas, 0, 0, l, h, px - sprite.ancre.x, py - sprite.ancre.y, l, h);
    ctx.globalAlpha = 1;
  }

  /**
   * Le sprite `nom` recoloré avec la palette du skin `skin` (copie calculée une seule fois par sprite et skin), ou null si le
   * sprite ou le skin n'existe pas, ou si ce skin n'habille pas ce sprite (un skin de tour sur un héros, par exemple).
   */
  habiller(nom: string, skin: string): SpriteHabille | null {
    const cle = `${skin}|${nom}`;
    if (this.habilles.has(cle)) return this.habilles.get(cle) ?? null;
    let habille: SpriteHabille | null = null;
    const sprite = this.sprite(nom);
    // Les skins recolorent la planche principale : un sprite d'un atlas ajouté n'en a pas.
    if (sprite && !this.planches.has(sprite) && estSkinConnu(skin) && spritesDuSkin(skin).includes(nom)) {
      this.pixels ??= this.ctxPlanche.getImageData(0, 0, this.json.largeur, this.json.hauteur);
      const zone = zoneDuSprite(sprite);
      const image = imageDuSkin(this.pixels, skin, zone);
      if (image) {
        const { canvas, ctx } = creerCanvas(zone.largeur, zone.hauteur);
        ctx.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
        const m = creerCanvas(zone.largeur, zone.hauteur);
        m.ctx.translate(zone.largeur, 0);
        m.ctx.scale(-1, 1);
        m.ctx.drawImage(canvas, 0, 0);
        habille = { nom, skin, zone, normal: canvas, miroir: m.canvas };
      }
    }
    this.habilles.set(cle, habille);
    return habille;
  }

  /** Comme `dessiner`, avec les couleurs d'un skin. */
  dessinerHabille(ctx: CanvasRenderingContext2D, habille: SpriteHabille, sprite: SpriteAtlas, cadre: CadreAtlas, px: number, py: number, miroir: boolean): void {
    if (cadre.largeur === 0) return;
    const source = sourceHabille(habille.zone, cadre, miroir);
    const y = py - sprite.ancre.y + cadre.dy;
    const x = miroir ? px + sprite.ancre.x - cadre.dx - cadre.largeur : px - sprite.ancre.x + cadre.dx;
    ctx.drawImage(miroir ? habille.miroir : habille.normal, source.x, source.y, cadre.largeur, cadre.hauteur, x, y, cadre.largeur, cadre.hauteur);
  }

  /** Dessin agrandi d'un entier, sans lissage (ondes, icônes). L'ancre tombe sur (px, py). */
  dessinerEchelle(ctx: CanvasRenderingContext2D, sprite: SpriteAtlas, cadre: CadreAtlas, px: number, py: number, echelle: number): void {
    if (cadre.largeur === 0) return;
    ctx.drawImage(
      this.plancheDe(sprite).normal,
      cadre.x, cadre.y, cadre.largeur, cadre.hauteur,
      px + (cadre.dx - sprite.ancre.x) * echelle, py + (cadre.dy - sprite.ancre.y) * echelle, cadre.largeur * echelle, cadre.hauteur * echelle,
    );
  }

  /** Adresse (data:) d'une image du premier cadre d'un sprite, agrandie d'un entier : pour les icônes du DOM. */
  iconeUrl(nom: string, echelle: number): string {
    const cle = `${nom}@${String(echelle)}`;
    const connue = this.icones.get(cle);
    if (connue !== undefined) return connue;
    const sprite = this.sprite(nom);
    const cadre = sprite ? this.cadre(sprite, 'repos', 0) : undefined;
    if (!sprite || !cadre) return '';
    const { canvas, ctx } = creerCanvas(sprite.largeur * echelle, sprite.hauteur * echelle);
    ctx.drawImage(
      this.plancheDe(sprite).normal,
      cadre.x, cadre.y, cadre.largeur, cadre.hauteur,
      cadre.dx * echelle, cadre.dy * echelle, cadre.largeur * echelle, cadre.hauteur * echelle,
    );
    const url = canvas.toDataURL('image/png');
    this.icones.set(cle, url);
    return url;
  }
}

let chargement: Promise<AtlasRendu> | undefined;
let chargementModerne: Promise<AtlasRendu> | undefined;

/** Lit un atlas (JSON puis planche) dans le dossier `base`. */
async function lireAtlas(base: string, fichier: string): Promise<{ json: AtlasJson; image: HTMLImageElement }> {
  const reponse = await fetch(`${base}${fichier}`);
  if (!reponse.ok) throw new Error(`Atlas introuvable : ${fichier} (${String(reponse.status)})`);
  const json = (await reponse.json()) as AtlasJson;
  const image = new Image();
  image.src = `${base}${json.image}`;
  await image.decode();
  return { json, image };
}

/**
 * Charge l'atlas une seule fois (le résultat est partagé entre les parties). Pour la campagne `moderne`, ajoute aussi l'atlas à part du DLC
 * (atlas-moderne.json, chargé une seule fois, et jamais pour l'histoire).
 */
export function chargerAtlas(campagne: IdCampagne = 'histoire', base: string = `${import.meta.env.BASE_URL}sprites/`): Promise<AtlasRendu> {
  chargement ??= (async () => {
    const { json, image } = await lireAtlas(base, 'atlas.json');
    return new AtlasRendu(json, image);
  })();
  chargement.catch(() => {
    chargement = undefined;
  });
  if (campagne !== 'moderne') return chargement;
  const principal = chargement;
  chargementModerne ??= (async () => {
    const atlas = await principal;
    const { json, image } = await lireAtlas(base, 'atlas-moderne.json');
    atlas.ajouterAtlas(json, image);
    return atlas;
  })();
  chargementModerne.catch(() => {
    chargementModerne = undefined;
  });
  return chargementModerne;
}
