// Rendu Canvas 2D d'une partie. Il lit l'état du moteur et ne le modifie jamais.
//
// Tout se dessine dans un tampon basse résolution (1 pixel = 1 pixel logique, une tuile = 16 px), puis le
// tampon est agrandi d'un facteur entier sans lissage sur le canvas de l'écran. Ordre des couches : sol
// (précalculé), cadavres, ombres, décor et entités triés par profondeur, projectiles, effets, barres de vie,
// surbrillance des sélections. Le HUD est en DOM (src/ui/).
//
// Boucle chaude : pas d'allocation. Le tri en profondeur est un tri par insertion sur un tableau permanent
// (presque trié d'une image à l'autre), les effets viennent d'un pool et les couleurs sont des constantes.
import type { VisuelCarte } from '../data/visuel';
import type { Carte } from '../engine/definitions';
import { EFFET, type EtatPartie } from '../engine';
import { cadreA } from './animations';
import type { AtlasRendu, SpriteAtlas } from './atlas';
import { Camera, TUILE } from './camera';
import { PoolEffets, TYPE_EFFET, type Effet } from './effets';
import { dessinerNombre, largeurNombre } from './police';
import { construireSol, peindreSol } from './sol';
import { CATEGORIE, Suivi, type Visuel, type VisuelProjectile } from './suivi';

const FOND = '#0b0a0d';
const OMBRE = 'rgba(0, 0, 0, 0.3)';
const BARRE_FOND = '#14090b';
const BARRE_ENNEMI = '#c8402f';
const BARRE_ALLIE = '#5fb85a';
const BARRE_VIDE = '#4a2a2a';
const ANNEAU = '#f3e6b0';
const ANNEAU_PORTEE = '#f3e6b0';
const MARQUEUR_PLACEHOLDER = '#ff00ff';
/** Un ennemi volant est dessiné plus haut que son ombre. */
const ALTITUDE_VOL = 10;
const FONDU_CADAVRE = 300;
const DUREE_BLESSE = 180;
const POINTS_ETAT: readonly (readonly [number, string])[] = [
  [EFFET.ralentissement, '#5fa8e8'],
  [EFFET.brulure, '#f08030'],
  [EFFET.saignement, '#a02020'],
  [EFFET.poison, '#6cc24a'],
];

/** Ce que l'interface fait mettre en valeur sur la carte (sélection, portées, cibles de sort). */
export class Surbrillance {
  /** Socle dont le menu est ouvert, -1 si aucun. */
  socle = -1;
  /** Portée à tracer autour de ce socle (tuiles), 0 si aucune. */
  portee = 0;
  /** Héros sélectionné : on attend le point où l'envoyer. */
  heros = false;
  /** Rayon du sort en cours de visée (tuiles), 0 si aucun, et position du curseur (tuiles). */
  sortRayon = 0;
  curseurX = 0;
  curseurY = 0;
  curseurActif = false;
}

/** Élément fixe de la carte (décor ou socle vide), rangé une fois pour toutes par profondeur. */
interface Statique {
  cle: number;
  sprite: SpriteAtlas | null;
  px: number;
  py: number;
  miroir: boolean;
  /** Indice du socle, -1 pour un décor. */
  socle: number;
}

function borner01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Trace une ligne d'un pixel d'épaisseur (Bresenham), nette à tout zoom. */
function ligne(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let erreur = dx + dy;
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(x, y, 1, 1);
    if (x === x1 && y === y1) return;
    const e2 = 2 * erreur;
    if (e2 >= dy) {
      erreur += dy;
      x += sx;
    }
    if (e2 <= dx) {
      erreur += dx;
      y += sy;
    }
  }
}

/** Cercle pointillé d'un pixel d'épaisseur : une portée, un rayon de sort. `phase` fait défiler les points. */
function cerclePointille(ctx: CanvasRenderingContext2D, cx: number, cy: number, rayon: number, phase: number): void {
  const n = Math.max(12, Math.ceil(rayon * 2 * Math.PI));
  for (let i = 0; i < n; i++) {
    if (((i + phase) & 3) > 1) continue;
    const a = (i / n) * 2 * Math.PI;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rayon), Math.round(cy + Math.sin(a) * rayon), 1, 1);
  }
}

export class Rendu {
  readonly camera: Camera;
  readonly effets = new PoolEffets();
  readonly suivi: Suivi;
  /** Pixels physiques par pixel CSS. */
  ratio = 1;

  private readonly ecran: CanvasRenderingContext2D;
  private readonly tampon: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sol: HTMLCanvasElement;
  private readonly statiques: Statique[] = [];
  private readonly etourdi: SpriteAtlas | undefined;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly atlas: AtlasRendu,
    carte: Carte,
    visuel: VisuelCarte,
  ) {
    const ecran = canvas.getContext('2d');
    this.tampon = document.createElement('canvas');
    const ctx = this.tampon.getContext('2d', { alpha: false });
    if (!ecran || !ctx) throw new Error('Contexte 2D indisponible');
    this.ecran = ecran;
    this.ctx = ctx;
    this.camera = new Camera(carte.largeur * TUILE, carte.hauteur * TUILE);
    this.sol = peindreSol(construireSol(carte, visuel), atlas);
    this.suivi = new Suivi(atlas, this.effets);
    this.etourdi = atlas.sprite('etourdi');
    for (const d of visuel.decor) {
      const py = Math.round(d.y * TUILE);
      this.statiques.push({ cle: py, sprite: atlas.sprite(d.sprite) ?? null, px: Math.round(d.x * TUILE), py, miroir: d.miroir ?? false, socle: -1 });
    }
    carte.socles.forEach((s, i) => {
      const py = Math.round(s.y * TUILE);
      this.statiques.push({ cle: py, sprite: atlas.sprite('socle') ?? null, px: Math.round(s.x * TUILE), py, miroir: false, socle: i });
    });
    this.statiques.sort((a, b) => a.cle - b.cle);
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

  /** À appeler après chaque pas du moteur : suivi des entités et déclenchement des effets. */
  apresPas(etat: EtatPartie, temps: number): void {
    this.suivi.apresPas(etat, temps);
    this.effets.nettoyer(temps);
  }

  /**
   * Montre l'état tel qu'il est, sans rejouer les événements de son dernier pas (ni effets, ni animations de
   * coup) : à appeler pour une partie reprise, dont ce pas a déjà été vu avant l'interruption.
   */
  synchroniser(etat: EtatPartie, temps: number): void {
    this.suivi.apresPas(etat, temps, false);
    this.effets.nettoyer(temps);
  }

  /**
   * Les bandes de l'écran que l'interface recouvre (pixels CSS) : la caméra peut dépasser la carte de leur
   * largeur, pour qu'un socle collé au bord reste atteignable.
   */
  definirMarges(marges: { readonly haut: number; readonly bas: number; readonly gauche: number; readonly droite: number }): void {
    const r = this.ratio;
    this.camera.definirMarges(marges.haut * r, marges.bas * r, marges.gauche * r, marges.droite * r);
  }

  // --- Conversions pour l'interface (coordonnées en pixels CSS du canvas, positions en tuiles) ---

  /** Pixels CSS d'une tuile à l'écran, au zoom actuel. */
  get pixelsCssParTuile(): number {
    return (TUILE * this.camera.zoom) / this.ratio;
  }

  enTuilesX(cssX: number): number {
    return this.camera.versMondeX(cssX * this.ratio) / TUILE;
  }

  enTuilesY(cssY: number): number {
    return this.camera.versMondeY(cssY * this.ratio) / TUILE;
  }

  enCssX(tuilesX: number): number {
    return this.camera.versEcranX(tuilesX * TUILE) / this.ratio;
  }

  enCssY(tuilesY: number): number {
    return this.camera.versEcranY(tuilesY * TUILE) / this.ratio;
  }

  // --- Dessin ---

  dessiner(etat: EtatPartie, alpha: number, temps: number, surb: Surbrillance): void {
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
    ctx.drawImage(this.sol, -ox, -oy);

    this.dessinerCadavres(temps, ox, oy);
    this.interpoler(alpha, ox, oy);
    this.trier();
    this.dessinerOmbres(l, h);
    this.dessinerProfondeur(temps, l, h);
    this.dessinerProjectiles(alpha, temps, ox, oy);
    this.dessinerEffets(temps, ox, oy);
    this.dessinerBarres(temps, l, h);
    this.dessinerSurbrillance(etat, surb, temps, ox, oy);

    const ecran = this.ecran;
    ecran.imageSmoothingEnabled = false;
    ecran.drawImage(this.tampon, 0, 0, l * cam.zoom, h * cam.zoom);
  }

  /** Position interpolée de chaque entité dans le tampon, et clé de tri en profondeur. */
  private interpoler(alpha: number, ox: number, oy: number): void {
    const liste = this.suivi.dessinables;
    for (let i = 0; i < liste.length; i++) {
      const v = liste[i];
      if (!v) continue;
      const x = v.xPrec + (v.x - v.xPrec) * alpha;
      const y = v.yPrec + (v.y - v.yPrec) * alpha;
      v.px = Math.round(x * TUILE) - ox;
      v.py = Math.round(y * TUILE) - oy;
      v.cle = Math.round(y * TUILE) + v.categorie * 0.01 + (v.ennemi?.volant ? 10_000 : 0);
    }
  }

  /** Tri par insertion : l'ordre d'une image à l'autre change peu, donc le coût reste linéaire. */
  private trier(): void {
    const liste = this.suivi.dessinables;
    for (let i = 1; i < liste.length; i++) {
      const v = liste[i];
      if (!v) continue;
      let j = i - 1;
      for (let w = liste[j]; w && w.cle > v.cle; w = liste[j]) {
        liste[j + 1] = w;
        j--;
      }
      liste[j + 1] = v;
    }
  }

  private dessinerCadavres(temps: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const liste = this.effets.liste;
    for (let i = 0; i < liste.length; i++) {
      const e = liste[i];
      if (!e?.actif || e.type !== TYPE_EFFET.fantome || !e.sprite) continue;
      const anim = this.atlas.animation(e.sprite, e.anim);
      if (!anim) continue;
      const t = temps - e.debut;
      const reste = e.duree - t;
      if (reste < FONDU_CADAVRE) ctx.globalAlpha = Math.max(0, reste / FONDU_CADAVRE);
      this.atlas.dessiner(ctx, e.sprite, cadreA(anim, t), e.x - ox, e.y - oy, e.miroir);
      ctx.globalAlpha = 1;
    }
  }

  private dessinerOmbres(l: number, h: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = OMBRE;
    const liste = this.suivi.dessinables;
    for (let i = 0; i < liste.length; i++) {
      const v = liste[i];
      if (!v || v.categorie === CATEGORIE.tour || !v.sprite) continue;
      if (v.px < -40 || v.px > l + 40 || v.py < -20 || v.py > h + 40) continue;
      if (v.unite?.mort) continue;
      const demi = Math.round(v.sprite.largeur / 6);
      ctx.fillRect(v.px - demi + 1, v.py - 3, demi * 2 - 2, 3);
      ctx.fillRect(v.px - demi, v.py - 2, demi * 2, 1);
    }
  }

  /** Décor, socles vides, tours, ennemis et unités, du plus au nord au plus au sud. */
  private dessinerProfondeur(temps: number, l: number, h: number): void {
    const statiques = this.statiques;
    const liste = this.suivi.dessinables;
    let s = 0;
    for (let i = 0; i < liste.length; i++) {
      const v = liste[i];
      if (!v) continue;
      while (s < statiques.length && (statiques[s]?.cle ?? Infinity) <= v.cle) this.dessinerStatique(statiques[s++], l, h);
      if (v.px < -48 || v.px > l + 48 || v.py < -16 || v.py > h + 80) continue;
      this.dessinerVisuel(v, temps);
    }
    while (s < statiques.length) this.dessinerStatique(statiques[s++], l, h);
  }

  private dessinerStatique(st: Statique | undefined, l: number, h: number): void {
    if (!st) return;
    if (st.socle >= 0 && this.suivi.socleOccupe[st.socle]) return;
    const px = st.px - this.camera.decalageX;
    const py = st.py - this.camera.decalageY;
    if (px < -48 || px > l + 48 || py < -16 || py > h + 80) return;
    const sprite = st.sprite;
    if (!sprite) {
      this.ctx.fillStyle = MARQUEUR_PLACEHOLDER;
      this.ctx.fillRect(px - 4, py - 8, 8, 8);
      return;
    }
    const anim = this.atlas.animation(sprite, 'repos');
    if (anim) this.atlas.dessiner(this.ctx, sprite, cadreA(anim, 0), px, py, st.miroir);
  }

  private dessinerVisuel(v: Visuel, temps: number): void {
    const ctx = this.ctx;
    const sprite = v.sprite;
    if (!sprite) {
      ctx.fillStyle = MARQUEUR_PLACEHOLDER;
      ctx.fillRect(v.px - 4, v.py - 12, 8, 12);
      return;
    }
    let nom = 'repos';
    let t = temps + v.phase;
    if (v.categorie === CATEGORIE.unite && v.mortDebut >= 0) {
      nom = 'mort';
      t = temps - v.mortDebut;
    } else if (temps < v.actionFin) {
      nom = v.actionAnim;
      t = temps - v.actionDebut;
    } else if (v.categorie !== CATEGORIE.tour && temps < v.blesseFin) {
      nom = 'blesse';
      t = DUREE_BLESSE - (v.blesseFin - temps);
    } else if (v.categorie !== CATEGORIE.tour && temps < v.marcheJusqua) {
      nom = 'marche';
    }
    const anim = this.atlas.animation(sprite, nom);
    if (!anim) return;
    // Une unité tombée reste étendue un moment, puis disparaît jusqu'à sa réapparition.
    if (nom === 'mort' && t > 1800) return;
    const y = v.py - (v.ennemi?.volant ? ALTITUDE_VOL : 0);
    this.atlas.dessiner(ctx, sprite, cadreA(anim, t), v.px, y, v.miroir);

    if (v.categorie === CATEGORIE.tour) {
      this.dessinerTireur(v, temps);
    } else if (v.ennemi && (v.ennemi.effetsPas[EFFET.etourdissement] ?? 0) > 0 && this.etourdi) {
      const a = this.atlas.animation(this.etourdi, 'repos');
      if (a) this.atlas.dessiner(ctx, this.etourdi, cadreA(a, temps), v.px, y - Math.round(sprite.ancre.y * 0.8) - 4, false);
    }
  }

  /** Le chat tireur posté au sommet d'une tour de tir. */
  private dessinerTireur(v: Visuel, temps: number): void {
    const tireur = v.tireur;
    if (!tireur) return;
    const enAction = temps < v.actionFin;
    const anim = this.atlas.animation(tireur, enAction ? 'attaque' : 'repos');
    if (!anim) return;
    this.atlas.dessiner(this.ctx, tireur, cadreA(anim, enAction ? temps - v.actionDebut : temps + v.phase), v.px + v.tirX, v.py + v.tirY, v.tireurMiroir);
  }

  private dessinerProjectiles(alpha: number, temps: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const liste = this.suivi.listeProjectiles;
    for (let i = 0; i < liste.length; i++) {
      const v: VisuelProjectile | undefined = liste[i];
      const p = v?.projectile;
      if (!v || !p || !v.sprite) continue;
      const x = v.xPrec + (v.x - v.xPrec) * alpha;
      const y = v.yPrec + (v.y - v.yPrec) * alpha;
      const dx = p.cx - x;
      const dy = p.cy - y;
      const progres = borner01(1 - Math.sqrt(dx * dx + dy * dy) / v.total);
      const restant = 1 - progres;
      const hauteur = v.arc * 4 * progres * restant;
      const px = Math.round(x * TUILE + v.origineX * restant) - ox;
      const py = Math.round(y * TUILE + v.origineY * restant - hauteur + (v.surEnnemi ? -8 * progres : 0)) - oy;
      const anim = this.atlas.animation(v.sprite, 'repos');
      if (!anim) continue;
      const cadre = cadreA(anim, temps);
      if (v.tourne) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(v.angle);
        this.atlas.dessiner(ctx, v.sprite, cadre, 0, 0, false);
        ctx.restore();
      } else {
        this.atlas.dessiner(ctx, v.sprite, cadre, px, py, false);
      }
    }
  }

  private dessinerEffets(temps: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const liste = this.effets.liste;
    for (let i = 0; i < liste.length; i++) {
      const e = liste[i];
      if (!e?.actif) continue;
      const t = temps - e.debut;
      if (t < 0 || t >= e.duree) continue;
      switch (e.type) {
        case TYPE_EFFET.sprite:
          this.dessinerEffetSprite(e, t, ox, oy);
          break;
        case TYPE_EFFET.rayon:
          ctx.globalAlpha = 1 - t / e.duree;
          ctx.fillStyle = e.couleur;
          ligne(ctx, e.x - ox, e.y - oy, e.x2 - ox, e.y2 - oy);
          ctx.globalAlpha = 1;
          break;
        case TYPE_EFFET.ordre:
          ctx.globalAlpha = 1 - (t / e.duree) * (t / e.duree);
          ctx.fillStyle = e.couleur;
          cerclePointille(ctx, e.x - ox, e.y - oy, Math.max(2, e.valeur * (1 - (t / e.duree) * 0.6)), 0);
          ctx.globalAlpha = 1;
          break;
        case TYPE_EFFET.texte:
          this.dessinerTexte(e, t, ox, oy);
          break;
        default:
          break;
      }
    }
  }

  private dessinerEffetSprite(e: Effet, t: number, ox: number, oy: number): void {
    if (!e.sprite) return;
    const anim = this.atlas.animation(e.sprite, e.anim);
    if (!anim) return;
    const cadre = cadreA(anim, t);
    if (e.echelle > 1) this.atlas.dessinerEchelle(this.ctx, e.sprite, cadre, e.x - ox, e.y - oy, e.echelle);
    else this.atlas.dessiner(this.ctx, e.sprite, cadre, e.x - ox, e.y - oy, e.miroir);
  }

  /** Prime en arêtes : « +6 » qui monte et s'efface, contour sombre pour rester lisible sur l'herbe. */
  private dessinerTexte(e: Effet, t: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const avance = t / e.duree;
    const x = e.x - ox - Math.round(largeurNombre(e.valeur, true) / 2);
    const y = e.y - oy - Math.round(avance * 12);
    ctx.globalAlpha = avance < 0.6 ? 1 : 1 - (avance - 0.6) / 0.4;
    ctx.fillStyle = BARRE_FOND;
    dessinerNombre(ctx, e.valeur, x + 1, y + 1, true);
    dessinerNombre(ctx, e.valeur, x + 1, y - 1, true);
    dessinerNombre(ctx, e.valeur, x, y + 1, true);
    ctx.fillStyle = e.couleur;
    dessinerNombre(ctx, e.valeur, x, y, true);
    ctx.globalAlpha = 1;
  }

  /** Barres de vie (ennemis blessés ou boss, alliés blessés) et pastilles d'effets subis. */
  private dessinerBarres(_temps: number, l: number, h: number): void {
    const ctx = this.ctx;
    const liste = this.suivi.dessinables;
    for (let i = 0; i < liste.length; i++) {
      const v = liste[i];
      if (!v?.sprite || v.categorie === CATEGORIE.tour) continue;
      if (v.px < -40 || v.px > l + 40 || v.py < -16 || v.py > h + 80) continue;
      const e = v.ennemi;
      const u = v.unite;
      let ratio: number;
      let couleur: string;
      let large = 12;
      let pastilles = false;
      if (e) {
        ratio = e.pv / e.pvMax;
        couleur = BARRE_ENNEMI;
        if (e.boss) large = 28;
        for (let k = 0; k < POINTS_ETAT.length && !pastilles; k++) pastilles = (e.effetsPas[POINTS_ETAT[k]?.[0] ?? 0] ?? 0) > 0;
        if (ratio >= 0.999 && !e.boss && !pastilles) continue;
      } else if (u && !u.mort) {
        ratio = u.pv / u.stats.pv;
        couleur = BARRE_ALLIE;
        if (ratio >= 0.999) continue;
      } else {
        continue;
      }
      const x = v.px - (large >> 1);
      const y = v.py - (e?.volant ? ALTITUDE_VOL : 0) - Math.round(v.sprite.ancre.y * 0.8) - 2;
      ctx.fillStyle = BARRE_FOND;
      ctx.fillRect(x - 1, y - 1, large + 2, 4);
      ctx.fillStyle = BARRE_VIDE;
      ctx.fillRect(x, y, large, 2);
      ctx.fillStyle = couleur;
      ctx.fillRect(x, y, Math.max(1, Math.round(large * borner01(ratio))), 2);
      if (e && pastilles) {
        let k0 = 0;
        for (let k = 0; k < POINTS_ETAT.length; k++) {
          const etat = POINTS_ETAT[k];
          if (!etat || (e.effetsPas[etat[0]] ?? 0) <= 0) continue;
          ctx.fillStyle = etat[1];
          ctx.fillRect(x + k0 * 3, y - 4, 2, 2);
          k0++;
        }
      }
    }
  }

  private dessinerSurbrillance(etat: EtatPartie, surb: Surbrillance, temps: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const phase = Math.floor(temps / 90);
    if (surb.socle >= 0) {
      const s = etat.niveau.carte.socles[surb.socle];
      if (s) {
        const cx = Math.round(s.x * TUILE) - ox;
        const cy = Math.round(s.y * TUILE) - oy;
        if (surb.portee > 0) {
          const r = surb.portee * TUILE;
          ctx.fillStyle = 'rgba(243, 230, 176, 0.1)';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = ANNEAU_PORTEE;
          cerclePointille(ctx, cx, cy, r, phase);
        }
        ctx.fillStyle = ANNEAU;
        cerclePointille(ctx, cx, cy - 2, 13, phase);
      }
    }
    if (surb.heros) {
      const v = this.suivi.unites.get(etat.heros);
      if (v) {
        ctx.fillStyle = ANNEAU;
        cerclePointille(ctx, v.px, v.py - 2, 10, phase);
      }
    }
    if (surb.sortRayon > 0 && surb.curseurActif) {
      const cx = Math.round(surb.curseurX * TUILE) - ox;
      const cy = Math.round(surb.curseurY * TUILE) - oy;
      const r = surb.sortRayon * TUILE;
      ctx.fillStyle = 'rgba(232, 80, 60, 0.14)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb08a';
      cerclePointille(ctx, cx, cy, r, phase);
    }
  }
}
