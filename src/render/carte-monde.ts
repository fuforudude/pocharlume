// Rendu de la carte du monde : un fond sombre peint une seule fois avec les tuiles et le décor de l'atlas, le
// chemin tracé jusqu'au dernier niveau débloqué (le reste en pointillé), puis les nœuds dessinés par-dessus à
// chaque image. Même technique que la partie : tampon de pixels logiques agrandi d'un facteur entier, sans
// lissage, avec la même caméra (zoom entier, glisser, pincement).
//
// Les fonctions pures (`carteDuSol`, `pointsPointilles`) sont testées ; le dessin ne l'est pas, on le vérifie à l'œil.
import { HAUTEUR_CARTE_MONDE, LARGEUR_CARTE_MONDE } from '../data/niveaux/carte-du-monde';
import type { VisuelCarte } from '../data/visuel';
import type { Carte, Point } from '../engine/definitions';
import type { AtlasRendu } from './atlas';
import { Camera, TUILE } from './camera';
import type { DecorMonde } from './carte-monde-decor';
import { dessinerNombre, HAUTEUR_GLYPHE, largeurNombre } from './police';
import { construireSol, peindreSol } from './sol';

/** Ce que le rendu a besoin de savoir d'un nœud (la vue de la carte, `VueNoeud`, le fournit). */
export interface NoeudAffiche {
  readonly numero: number;
  readonly x: number;
  readonly y: number;
  readonly boss: boolean;
  readonly visible: boolean;
  readonly clignote: boolean;
  readonly reussi: boolean;
  readonly etoiles: number;
}

/** Demi-largeur de la route sur la carte du monde, en tuiles : une tuile et demie de large. */
export const DEMI_LARGEUR_ROUTE = 0.75;
/** Écart entre deux points du chemin pas encore ouvert, en pixels logiques. */
const PAS_POINTILLE = 7;

const FOND = '#0b0a0d';
const VOILE = 'rgba(6, 4, 12, 0.4)';
const BORD_VIGNETTE = 'rgba(4, 3, 8, 0.2)';
const POINTILLE = '#c9b27c';
const OR = '#e8c860';
const OR_CLAIR = '#fff0b0';
const SANG = '#c8402f';
const SANG_SOMBRE = '#7a2a20';
const BORD = '#a8895c';
const BORD_REUSSI = '#6a5640';
const FOND_NOEUD = '#1c1416';
const FOND_REUSSI = '#3a2c1c';
const TEXTE = '#eadcb9';
const ETOILE_VIDE = '#6a5a48';
const OMBRE = 'rgba(0, 0, 0, 0.38)';
const SELECTION = '#f3e6b0';

const RAYON_NOEUD = 7;
const RAYON_BOSS = 10;
const PERIODE_CLIGNOTEMENT_MS = 420;
const RAYON_TOUCHE_CSS = 26;
/** Marge autour des nœuds visibles quand la vue est cadrée dessus, en pixels du fond (de quoi voir étoiles et chevron). */
const MARGE_CADRAGE = 40;
const ZOOM_CSS_MAX = 2;

/** Étoile de 5 × 5 pixels, ligne par ligne. */
const ETOILE: readonly string[] = ['..#..', '.###.', '#####', '.###.', '.#.#.'];
const LARGEUR_ETOILE = 5;
const ECART_ETOILES = 2;

const VISUEL_VIDE: VisuelCarte = { region: 1, zones: [], decor: [] };

/** La carte de tuiles de la route : les `troncons` premiers tronçons du tracé, en tuiles. Pas de départ. */
export function carteDuSol(trace: readonly (readonly Point[])[], troncons: number): Carte {
  return {
    largeur: LARGEUR_CARTE_MONDE / TUILE,
    hauteur: HAUTEUR_CARTE_MONDE / TUILE,
    chemins: trace.slice(0, Math.max(0, troncons)).map((points) => ({ points: points.map((p) => ({ x: p.x / TUILE, y: p.y / TUILE })) })),
    departHeros: { x: 0, y: 0 },
  };
}

/**
 * Points régulièrement espacés (tous les `pas` pixels, coordonnées arrondies) le long des tronçons à partir du
 * numéro `depuis` : la suite du chemin, encore fermée. Le dernier point d'un tronçon n'est pas répété au début du suivant.
 */
export function pointsPointilles(trace: readonly (readonly Point[])[], depuis: number, pas: number): Point[] {
  const points: Point[] = [];
  for (const troncon of trace.slice(Math.max(0, depuis))) {
    let prochain = 0; // distance, le long du tronçon, du prochain point à poser
    let parcouru = 0;
    for (let i = 1; i < troncon.length; i++) {
      const a = troncon[i - 1];
      const b = troncon[i];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const longueur = Math.sqrt(dx * dx + dy * dy);
      for (; prochain < parcouru + longueur; prochain += pas) {
        const t = (prochain - parcouru) / longueur;
        points.push({ x: Math.round(a.x + dx * t), y: Math.round(a.y + dy * t) });
      }
      parcouru += longueur;
    }
  }
  return points;
}

/** Le fond : herbe et route en tuiles, décor, pointillé de la suite du chemin, puis voile sombre et vignette. */
function peindreFond(atlas: AtlasRendu, trace: readonly (readonly Point[])[], troncons: number, decor: readonly DecorMonde[]): HTMLCanvasElement {
  const sol = peindreSol(construireSol(carteDuSol(trace, troncons), VISUEL_VIDE, DEMI_LARGEUR_ROUTE), atlas);
  const ctx = sol.getContext('2d');
  if (!ctx) throw new Error('Contexte 2D indisponible');
  ctx.imageSmoothingEnabled = false;

  for (const d of [...decor].sort((a, b) => a.y - b.y)) {
    const sprite = atlas.sprite(d.sprite);
    const cadre = sprite ? atlas.cadre(sprite, 'repos', 0) : undefined;
    if (sprite && cadre) atlas.dessiner(ctx, sprite, cadre, d.x, d.y, d.miroir ?? false);
  }

  ctx.fillStyle = VOILE;
  ctx.fillRect(0, 0, sol.width, sol.height);
  ctx.fillStyle = BORD_VIGNETTE;
  for (let i = 0; i < 5; i++) {
    const m = i * 6;
    ctx.fillRect(m, m, sol.width - 2 * m, 6);
    ctx.fillRect(m, sol.height - m - 6, sol.width - 2 * m, 6);
    ctx.fillRect(m, m + 6, 6, sol.height - 2 * m - 12);
    ctx.fillRect(sol.width - m - 6, m + 6, 6, sol.height - 2 * m - 12);
  }

  // La suite du chemin, pas encore ouverte : des points clairs, par-dessus le voile.
  ctx.fillStyle = POINTILLE;
  for (const p of pointsPointilles(trace, troncons, PAS_POINTILLE)) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
  return sol;
}

/** Disque plein d'entiers : une rangée de pixels par ligne. */
function disque(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, couleur: string): void {
  ctx.fillStyle = couleur;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r + r - dy * dy));
    ctx.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
  }
}

function etoile(ctx: CanvasRenderingContext2D, x: number, y: number, couleur: string): void {
  ctx.fillStyle = couleur;
  ETOILE.forEach((ligne, dy) => {
    for (let dx = 0; dx < ligne.length; dx++) if (ligne[dx] === '#') ctx.fillRect(x + dx, y + dy, 1, 1);
  });
}

/**
 * Le plus grand zoom entier, entre `plancher` et `prefere`, auquel une boîte de `largeur` × `hauteur` pixels du fond (plus la
 * marge de cadrage de chaque côté) tient dans la zone libre de `libreL` × `libreH` pixels physiques ; `null` si elle n'y tient
 * à aucun de ces zooms.
 */
export function zoomQuiFait(largeur: number, hauteur: number, libreL: number, libreH: number, prefere: number, plancher: number): number | null {
  for (let z = Math.floor(prefere); z >= Math.max(1, plancher); z--) {
    if ((largeur + 2 * MARGE_CADRAGE) * z <= libreL && (hauteur + 2 * MARGE_CADRAGE) * z <= libreH) return z;
  }
  return null;
}

/**
 * Le calcul du cadrage, sans caméra : le zoom et le point du fond à mettre au milieu de la zone libre (l'écran de
 * `ecranL` × `ecranH` pixels physiques, moins `margeHaut` pixels en haut). Si la boîte des `points` tient à un zoom entier
 * entre `plancher` et `prefere`, on la centre ; sinon on centre sur `focus` au zoom préféré.
 */
export function calculerCadrage(
  points: readonly Point[], focus: Point, ecranL: number, ecranH: number, margeHaut: number, prefere: number, plancher: number,
): { zoom: number; x: number; y: number } {
  const premier = points[0];
  if (!premier) return { zoom: prefere, x: focus.x, y: focus.y };
  let xMin = premier.x;
  let xMax = premier.x;
  let yMin = premier.y;
  let yMax = premier.y;
  for (const p of points) {
    xMin = Math.min(xMin, p.x);
    xMax = Math.max(xMax, p.x);
    yMin = Math.min(yMin, p.y);
    yMax = Math.max(yMax, p.y);
  }
  const zoom = zoomQuiFait(xMax - xMin, yMax - yMin, ecranL, ecranH - margeHaut, prefere, plancher);
  return zoom === null ? { zoom: prefere, x: focus.x, y: focus.y } : { zoom, x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 };
}

/** Met le point (x, y) du fond au milieu de la zone libre de la caméra (qui reste dans les bornes du fond). */
export function centrerCameraSur(cam: Camera, x: number, y: number): void {
  cam.x = x - (cam.vueL / 2);
  cam.y = y - (cam.vueH + cam.margeHautLogique) / 2;
  cam.contraindre();
}

/** Le cadrage d'une région sur la caméra (voir `RenduCarteMonde.cadrer`), sans canvas : `ratio` est le nombre de pixels physiques par pixel CSS. */
export function cadrerCamera(cam: Camera, points: readonly Point[], focus: Point, ratio: number): void {
  const prefere = Math.min(cam.zoomMax, Math.max(cam.zoomMin, Math.round(ZOOM_CSS_MAX * ratio)));
  const plancher = Math.min(prefere, Math.max(cam.zoomMin, Math.ceil(ratio)));
  const cadrage = calculerCadrage(points, focus, cam.ecranL, cam.ecranH, cam.margeHautLogique * cam.zoom, prefere, plancher);
  cam.zoom = cadrage.zoom;
  centrerCameraSur(cam, cadrage.x, cadrage.y);
}

export class RenduCarteMonde {
  readonly camera: Camera;
  /** Pixels physiques par pixel CSS. */
  ratio = 1;

  private readonly ecran: CanvasRenderingContext2D;
  private readonly tampon: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly fond: HTMLCanvasElement;
  private readonly crane: ReturnType<AtlasRendu['sprite']>;

  /**
   * `troncons` : nombre de tronçons du tracé à montrer en route ; la suite est en pointillé. Le fond est peint
   * ici une fois pour toutes : pour une autre progression, créer un nouveau rendu.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly atlas: AtlasRendu,
    trace: readonly (readonly Point[])[],
    decor: readonly DecorMonde[],
    troncons: number,
  ) {
    const ecran = canvas.getContext('2d');
    this.tampon = document.createElement('canvas');
    const ctx = this.tampon.getContext('2d', { alpha: false });
    if (!ecran || !ctx) throw new Error('Contexte 2D indisponible');
    this.ecran = ecran;
    this.ctx = ctx;
    this.camera = new Camera(LARGEUR_CARTE_MONDE, HAUTEUR_CARTE_MONDE);
    this.fond = peindreFond(atlas, trace, troncons, decor);
    this.crane = atlas.sprite('crane');
    this.redimensionner();
  }

  /** Adapte le canvas à sa taille d'affichage (à appeler quand la fenêtre change de taille ou d'orientation). */
  redimensionner(): void {
    this.ratio = window.devicePixelRatio || 1;
    const l = Math.max(1, Math.round(this.canvas.clientWidth * this.ratio));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * this.ratio));
    if (this.canvas.width !== l || this.canvas.height !== h) {
      this.canvas.width = l;
      this.canvas.height = h;
    }
    this.camera.redimensionner(l, h);
  }

  /**
   * Réserve en haut du canvas la bande que l'en-tête de l'écran recouvre (pixels CSS, mesurés à l'affichage) : le cadrage
   * se fait dans la place restante, et la vue peut être glissée jusqu'à amener n'importe quel nœud sous l'en-tête.
   */
  definirMargeHaut(cssPx: number): void {
    this.camera.definirMarges(Math.max(0, cssPx) * this.ratio, 0, 0, 0);
  }

  /** Met le point (x, y) du fond au milieu de la zone libre de la vue (la caméra reste dans les bornes du fond). */
  centrerSur(x: number, y: number): void {
    centrerCameraSur(this.camera, x, y);
  }

  /**
   * Cadre la vue à 2 pixels CSS par pixel du fond (jamais plus : le pixel art deviendrait grossier, jamais moins
   * que le plus petit zoom entier). Si tous les `points` y tiennent, la vue se centre sur leur boîte ; sinon sur
   * `focus`, le nœud que le joueur va jouer. Pincer ou tourner la molette montre la région en entier. Tout se calcule dans
   * la zone libre sous l'en-tête ; pour que les `points` y tiennent, le zoom descend d'un cran à la fois, jamais en dessous
   * d'un pixel CSS par pixel du fond (les chiffres des nœuds deviendraient illisibles).
   */
  cadrer(points: readonly Point[], focus: Point): void {
    cadrerCamera(this.camera, points, focus, this.ratio);
  }

  /** Rayon, en pixels du fond, de la zone qui répond au toucher autour d'un nœud (26 px CSS au moins). */
  get rayonToucher(): number {
    return Math.max(RAYON_NOEUD + 3, (RAYON_TOUCHE_CSS * this.ratio) / this.camera.zoom);
  }

  /** Point du canvas (pixels CSS) vers le fond (pixels logiques). */
  enMondeX(cssX: number): number {
    return this.camera.versMondeX(cssX * this.ratio);
  }

  enMondeY(cssY: number): number {
    return this.camera.versMondeY(cssY * this.ratio);
  }

  dessiner(noeuds: readonly NoeudAffiche[], selection: number, tempsMs: number): void {
    const cam = this.camera;
    const ctx = this.ctx;
    const l = cam.vueL;
    const h = cam.vueH;
    if (this.tampon.width !== l || this.tampon.height !== h) {
      this.tampon.width = l;
      this.tampon.height = h;
    }
    ctx.imageSmoothingEnabled = false;
    const ox = cam.decalageX;
    const oy = cam.decalageY;
    ctx.fillStyle = FOND;
    ctx.fillRect(0, 0, l, h);
    ctx.drawImage(this.fond, -ox, -oy);

    const phase = Math.floor(tempsMs / PERIODE_CLIGNOTEMENT_MS) % 2 === 0;
    noeuds.forEach((n, i) => {
      if (n.visible) this.dessinerNoeud(n, Math.round(n.x) - ox, Math.round(n.y) - oy, phase);
      if (i === selection && n.visible) this.dessinerSelection(n, Math.round(n.x) - ox, Math.round(n.y) - oy, tempsMs);
    });

    const ecran = this.ecran;
    ecran.imageSmoothingEnabled = false;
    ecran.drawImage(this.tampon, 0, 0, l * cam.zoom, h * cam.zoom);
  }

  private dessinerNoeud(n: NoeudAffiche, cx: number, cy: number, phase: boolean): void {
    const ctx = this.ctx;
    const r = n.boss ? RAYON_BOSS : RAYON_NOEUD;
    disque(ctx, cx, cy + 2, r + 2, OMBRE);
    let bord = n.boss ? (n.reussi ? SANG_SOMBRE : SANG) : n.reussi ? BORD_REUSSI : BORD;
    if (n.clignote) {
      if (phase) disque(ctx, cx, cy, r + 4, n.boss ? SANG : OR);
      bord = phase ? OR_CLAIR : n.boss ? SANG : OR;
    }
    disque(ctx, cx, cy, r + 2, bord);
    disque(ctx, cx, cy, r, n.reussi ? FOND_REUSSI : FOND_NOEUD);

    if (n.boss && this.crane) {
      const cadre = this.atlas.cadre(this.crane, 'repos', 0);
      if (cadre) this.atlas.dessiner(ctx, this.crane, cadre, cx, cy + 6, false);
    } else {
      ctx.fillStyle = n.reussi ? OR : TEXTE;
      dessinerNombre(ctx, n.numero, cx - Math.floor(largeurNombre(n.numero, false) / 2), cy - Math.floor(HAUTEUR_GLYPHE / 2), false);
    }

    const largeur = 3 * LARGEUR_ETOILE + 2 * ECART_ETOILES;
    const x0 = cx - Math.floor(largeur / 2);
    const y0 = cy + r + 5;
    for (let k = 0; k < 3; k++) etoile(ctx, x0 + k * (LARGEUR_ETOILE + ECART_ETOILES), y0, k < n.etoiles ? OR : ETOILE_VIDE);
  }

  /** Petit chevron qui flotte au-dessus du nœud sélectionné. */
  private dessinerSelection(n: NoeudAffiche, cx: number, cy: number, tempsMs: number): void {
    const ctx = this.ctx;
    const r = n.boss ? RAYON_BOSS : RAYON_NOEUD;
    const flotte = Math.floor(tempsMs / 300) % 2;
    const y = cy - r - 12 + flotte;
    ctx.fillStyle = SELECTION;
    for (let k = 0; k < 4; k++) ctx.fillRect(cx - 3 + k, y + k, 7 - 2 * k, 1);
  }
}
