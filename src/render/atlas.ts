// Atlas de sprites : planche PNG + JSON produits par `npm run art` (public/sprites/). Le chargement est le
// seul code asynchrone du rendu ; ensuite tout est synchrone et sans allocation.
import type { AnimationAtlas, AtlasJson, CadreAtlas, SpriteAtlas } from '../../tools/art/atlas.ts';

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

export class AtlasRendu {
  /** La planche, et la même retournée de gauche à droite (les cadres tournés vers la gauche en sont tirés). */
  private readonly planche: HTMLCanvasElement;
  private readonly miroir: HTMLCanvasElement;
  private readonly sprites: Readonly<Record<string, SpriteAtlas>>;
  private readonly icones = new Map<string, string>();
  private readonly ctxPlanche: CanvasRenderingContext2D;
  /** Pixels de la planche, lus une seule fois, à la première demande de skin (4 Mo : jamais lus si personne n'équipe de skin). */
  private pixels: ImageDonnees | null = null;
  private readonly habilles = new Map<string, SpriteHabille | null>();

  constructor(
    readonly json: AtlasJson,
    image: CanvasImageSource,
  ) {
    this.sprites = json.sprites;
    const { canvas, ctx } = creerCanvas(json.largeur, json.hauteur);
    ctx.drawImage(image, 0, 0);
    this.planche = canvas;
    this.ctxPlanche = ctx;
    const m = creerCanvas(json.largeur, json.hauteur);
    m.ctx.translate(json.largeur, 0);
    m.ctx.scale(-1, 1);
    m.ctx.drawImage(canvas, 0, 0);
    this.miroir = m.canvas;
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
    if (miroir) {
      ctx.drawImage(
        this.miroir,
        this.json.largeur - cadre.x - cadre.largeur, cadre.y, cadre.largeur, cadre.hauteur,
        px + sprite.ancre.x - cadre.dx - cadre.largeur, y, cadre.largeur, cadre.hauteur,
      );
    } else {
      ctx.drawImage(this.planche, cadre.x, cadre.y, cadre.largeur, cadre.hauteur, px - sprite.ancre.x + cadre.dx, y, cadre.largeur, cadre.hauteur);
    }
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
    if (sprite && estSkinConnu(skin) && spritesDuSkin(skin).includes(nom)) {
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
      this.planche,
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
      this.planche,
      cadre.x, cadre.y, cadre.largeur, cadre.hauteur,
      cadre.dx * echelle, cadre.dy * echelle, cadre.largeur * echelle, cadre.hauteur * echelle,
    );
    const url = canvas.toDataURL('image/png');
    this.icones.set(cle, url);
    return url;
  }
}

let chargement: Promise<AtlasRendu> | undefined;

/** Charge l'atlas une seule fois (le résultat est partagé entre les parties). */
export function chargerAtlas(base: string = `${import.meta.env.BASE_URL}sprites/`): Promise<AtlasRendu> {
  chargement ??= (async () => {
    const reponse = await fetch(`${base}atlas.json`);
    if (!reponse.ok) throw new Error(`Atlas introuvable : ${String(reponse.status)}`);
    const json = (await reponse.json()) as AtlasJson;
    const image = new Image();
    image.src = `${base}${json.image}`;
    await image.decode();
    return new AtlasRendu(json, image);
  })();
  chargement.catch(() => {
    chargement = undefined;
  });
  return chargement;
}
