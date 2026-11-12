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
import { caseExiste, centreCase, EFFET, type EtatPartie } from '../engine';
import { cadreA } from './animations';
import type { AtlasRendu, CadreAtlas, SpriteAtlas } from './atlas';
import { Camera, TUILE } from './camera';
import { REGLES } from '../data/regles';
import { PoolEffets, TYPE_EFFET, type Effet } from './effets';
import {
  decalageSursaut, DUREE_FLASH, DUREE_SURSAUT, opaciteAnneau, opaciteFlash, PARTICULES,
  particule, pulsationHalo, rayonAnneau, type DefHalo, type EtatParticule,
} from './effets-tours';
import { dessinerNombre, largeurNombre } from './police';
import { construireSol, peindreSol } from './sol';
import { tuileTouchee } from './zones';
import { zoomPourCase } from './zoom-tactile';
import { CATEGORIE, DECALAGE_BASE_TOUR, DEPLOIEMENT_NUAGE, Suivi, type OptionsCollection, type Visuel, type VisuelProjectile } from './suivi';
import { DessinEvenementsNiveau } from './evenements-niveau';
import { DEMI_VISEE_PLACE, DessinGimmicks, placeAffichee } from './gimmicks';

export type { OptionsCollection } from './suivi';

const FOND = '#0b0a0d';
const OMBRE = 'rgba(0, 0, 0, 0.3)';
const BARRE_FOND = '#14090b';
const BARRE_ENNEMI = '#c8402f';
/** Un ennemi d'élite a toujours sa barre, dorée ; un ennemi intouchable (à terre, plongé) l'a bleu pâle. */
const BARRE_ELITE = '#e0a840';
const BARRE_INTOUCHABLE = '#9cc4e8';
/** Part de la hauteur d'une unité qui passe sous l'eau quand elle se noie. */
const PART_NOYEE = 0.7;
const BARRE_ALLIE = '#5fb85a';
const BARRE_VIDE = '#4a2a2a';
const ANNEAU = '#f3e6b0';
const ANNEAU_PORTEE = '#f3e6b0';
/** Case visée libre : léger voile clair et coins de la couleur des anneaux ; interdite : voile rouge sombre et coins rouges. */
const VISEE_LIBRE_VOILE = 'rgba(243, 230, 176, 0.16)';
const VISEE_LIBRE_COIN = '#f3e6b0';
const VISEE_INTERDITE_VOILE = 'rgba(96, 18, 18, 0.38)';
const VISEE_INTERDITE_COIN = '#9a3030';
/** Longueur (pixels logiques) des coins qui cadrent la case visée. */
const COIN_VISEE = 5;
const MARQUEUR_PLACEHOLDER = '#ff00ff';
/** Amélioration d'une tour : anneau de lumière dorée, poussière et éclats (bois et or). */
const ANNEAU_COULEUR = '#ffd75e';
const ANNEAU_CLAIR = '#fff4c2';
const POUSSIERE_COULEUR = '#d9ccaa';
const ECLAT_BOIS = '#8a5a2b';
const ECLAT_OR = '#ffd75e';
/** Un ennemi volant est dessiné plus haut que son ombre. */
const ALTITUDE_VOL = 10;
/** Opacité d'une tour aveuglée. */
const OPACITE_AVEUGLE = 0.55;
const FONDU_CADAVRE = 300;
const DUREE_BLESSE = 180;
/** Un assassin du Sanctuaire (non ciblable) est dessiné translucide. */
const OPACITE_FURTIF = 0.55;
/** Durée (ms) du fondu d'une zone qui se termine. */
const FONDU_ZONE = 600;
const MS_PAR_PAS = 1000 / 30;
const POINTS_ETAT: readonly (readonly [number, string])[] = [
  [EFFET.ralentissement, '#5fa8e8'],
  [EFFET.brulure, '#f08030'],
  [EFFET.saignement, '#a02020'],
  [EFFET.poison, '#6cc24a'],
];

/** Ce que l'interface fait mettre en valeur sur la carte (sélection, portées, cibles de sort). */
export class Surbrillance {
  /** Case (colonne, ligne) dont le menu est ouvert, -1 si aucune. */
  cx = -1;
  cy = -1;
  /** Place du radeau dont le menu est ouvert, -1 si aucune : la portée et l'anneau suivent le radeau. */
  place = -1;
  /** Place du radeau sous le pointeur, -1 si aucune : elle s'éclaire comme une case libre. */
  viseePlace = -1;
  /** Portée à tracer autour du centre de cette case (tuiles), 0 si aucune. */
  portee = 0;
  /** Case sous le pointeur (souris ou doigt posé), -1 si aucune : elle s'éclaire, en rouge sombre si on ne peut pas y construire. */
  viseeCx = -1;
  viseeCy = -1;
  viseeInterdite = false;
  /** Portée (tuiles) de la tour qu'on survole dans le menu de construction, tracée depuis la case du menu ; 0 si aucune. */
  apercuPortee = 0;
  /** Ralliement par défaut de la caserne survolée, en tuiles. */
  apercuRalliement = false;
  apercuRalliementX = 0;
  apercuRalliementY = 0;
  /** Héros sélectionné : on attend le point où l'envoyer. */
  heros = false;
  /** Rayon du sort en cours de visée (tuiles), 0 si aucun, et position du curseur (tuiles). */
  sortRayon = 0;
  curseurX = 0;
  curseurY = 0;
  curseurActif = false;
}

/** Élément fixe de la carte (décor), rangé une fois pour toutes par profondeur. */
interface Statique {
  cle: number;
  sprite: SpriteAtlas | null;
  px: number;
  py: number;
  miroir: boolean;
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
  /** Côté minimal (pixels CSS) d'une case à l'écran, 0 s'il n'y en a pas (souris) : la caméra ne dézoome pas en dessous. */
  private cibleCaseCss = 0;

  private readonly ecran: CanvasRenderingContext2D;
  private readonly tampon: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sol: HTMLCanvasElement;
  private readonly halos = new Map<DefHalo, HTMLCanvasElement>();
  private readonly particuleTemp: EtatParticule = { x: 0, y: 0, taille: 0, alpha: 0, eclat: false };
  private readonly statiques: Statique[] = [];
  private readonly etourdi: SpriteAtlas | undefined;
  private readonly piege: SpriteAtlas | undefined;
  private readonly tuileVoile: SpriteAtlas | undefined;
  private readonly boost: SpriteAtlas | undefined;
  private readonly rage: SpriteAtlas | undefined;
  private readonly brulure: SpriteAtlas | undefined;
  private readonly tourEnFeu: SpriteAtlas | undefined;
  private readonly tourAffamee: SpriteAtlas | undefined;
  private readonly nuage: SpriteAtlas | undefined;
  private readonly ondulation: SpriteAtlas | undefined;
  private readonly gimmicks: DessinGimmicks;
  private readonly evenementsNiveau: DessinEvenementsNiveau;

  /**
   * `collection` : les skins et le familier équipés par le joueur (voir `OptionsCollection`) ; on peut aussi les donner ou les
   * changer ensuite avec `definirCollection`.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly atlas: AtlasRendu,
    carte: Carte,
    visuel: VisuelCarte,
    collection: OptionsCollection = {},
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
    this.gimmicks = new DessinGimmicks(atlas, ctx);
    this.evenementsNiveau = new DessinEvenementsNiveau(ctx);
    this.etourdi = atlas.sprite('etourdi');
    this.piege = atlas.sprite('piege');
    this.tuileVoile = atlas.sprite('effet-voile-nuit-tuile');
    this.boost = atlas.sprite('effet-ingeniosite');
    this.rage = atlas.sprite('effet-rage');
    this.brulure = atlas.sprite('effet-brulure');
    this.tourEnFeu = atlas.sprite('effet-tour-feu');
    this.tourAffamee = atlas.sprite('effet-tour-affamee');
    this.nuage = atlas.sprite('effet-nuage-toxique');
    this.ondulation = atlas.sprite('effet-plongee');
    this.suivi.definirCollection(collection);
    for (const d of visuel.decor) {
      const py = Math.round(d.y * TUILE);
      this.statiques.push({ cle: py, sprite: atlas.sprite(d.sprite) ?? null, px: Math.round(d.x * TUILE), py, miroir: d.miroir ?? false });
    }
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
    this.camera.definirPlancherZoom(this.cibleCaseCss > 0 ? zoomPourCase(this.ratio, this.cibleCaseCss) : 1);
    this.camera.redimensionner(l, h);
  }

  /**
   * Écran tactile : une case de construction fait au moins `cssPx` pixels CSS de côté (44 px, la taille d'un doigt). La caméra
   * garde alors un zoom plancher, et la carte défile quand elle ne tient plus en entier. 0 : aucune exigence.
   */
  definirCibleCase(cssPx: number): void {
    this.cibleCaseCss = cssPx > 0 ? cssPx : 0;
    this.redimensionner();
  }

  /**
   * Skins équipés (par famille de tours ou par héros) et familier du héros. Les tours et le héros déjà à l'écran sont rhabillés
   * au prochain `apresPas`. Voir `OptionsCollection` pour la forme, qui est celle de `Collection.equipes` de la sauvegarde.
   */
  definirCollection(collection: OptionsCollection): void {
    this.suivi.definirCollection(collection);
  }

  /** À appeler après chaque pas du moteur : suivi des entités et déclenchement des effets. */
  apresPas(etat: EtatPartie, temps: number): void {
    this.suivi.apresPas(etat, temps);
    this.evenementsNiveau.apresPas(etat, temps);
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
   * largeur, pour qu'une case collée au bord reste atteignable.
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
    // Les couloirs du Vol de Corbeaux, tracés sur le sol toute la partie.
    this.gimmicks.dessinerCouloirs(etat, temps, this.suivi.animationsReduites(), ox, oy, l);
    // Événements datés et foules (DLC) : chemins fermés, coupures et zones des foules, sur le sol.
    this.evenementsNiveau.dessinerSol(etat, ox, oy);

    this.dessinerCadavres(temps, ox, oy);
    this.dessinerAuSol(etat, temps, ox, oy);
    // Le radeau flotte sous les entités : ses tours sont dessinées par-dessus, à la position de leur place.
    this.gimmicks.dessinerRadeau(etat, alpha, ox, oy);
    this.interpoler(alpha, ox, oy);
    this.trier();
    this.dessinerOmbres(l, h);
    this.dessinerHalos(temps, l, h);
    this.dessinerAnneauxArriere(temps, ox, oy);
    this.dessinerProfondeur(temps, l, h);
    this.dessinerVisee(etat, surb, alpha, ox, oy);
    this.dessinerProjectiles(alpha, temps, ox, oy);
    this.dessinerEffets(temps, ox, oy);
    this.evenementsNiveau.dessinerDessus(etat, temps, ox, oy);
    this.dessinerBarres(temps, l, h);
    this.dessinerSurbrillance(etat, surb, alpha, temps, ox, oy);

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
      v.py = Math.round(y * TUILE) - oy + (v.tour ? DECALAGE_BASE_TOUR : 0);
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

  /** Ce qui reste posé sur le sol, sous les entités : zones qui durent (Voile de Nuit, nappe de soufre) et pièges armés. */
  private dessinerAuSol(etat: EtatPartie, temps: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const zones = etat.zones;
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (!z) continue;
      const cx = z.x * TUILE;
      const cy = z.y * TUILE;
      const r = z.rayon * TUILE;
      const reste = z.restant * MS_PAR_PAS;
      const alpha = reste < FONDU_ZONE ? Math.max(0, reste / FONDU_ZONE) : 1;
      const tuile = this.tuileVoile;
      const anim = tuile ? this.atlas.animation(tuile, 'repos') : undefined;
      if (z.degatsAllies > 0 && this.nuage) {
        // Nuage toxique : le nuage qui tourne, posé quand son déploiement (joué comme effet) est fini ; il s'efface à la fin.
        const debut = this.suivi.debutNuage.get(z.id);
        const animNuage = this.atlas.animation(this.nuage, 'repos');
        if (animNuage && (debut === undefined || temps - debut >= DEPLOIEMENT_NUAGE)) {
          ctx.globalAlpha = alpha;
          this.atlas.dessinerEchelle(ctx, this.nuage, cadreA(animNuage, temps + z.id * 137), Math.round(cx) - ox, Math.round(cy) - oy, Math.max(1, Math.round(r / (this.nuage.largeur / 2))));
          ctx.globalAlpha = 1;
        }
      } else if (z.critique > 0 && tuile && anim) {
        // Voile de Nuit : une tuile d'ombre sur chaque case que le rayon touche, donc toute la zone réelle.
        const cadre = cadreA(anim, temps);
        ctx.globalAlpha = alpha;
        const x0 = Math.floor((cx - r) / TUILE);
        const x1 = Math.floor((cx + r) / TUILE);
        const y0 = Math.floor((cy - r) / TUILE);
        const y1 = Math.floor((cy + r) / TUILE);
        for (let ty = y0; ty <= y1; ty++) {
          for (let tx = x0; tx <= x1; tx++) {
            if (tuileTouchee(tx, ty, cx, cy, r, TUILE)) this.atlas.dessiner(ctx, tuile, cadre, tx * TUILE + TUILE / 2 - ox, ty * TUILE + TUILE / 2 - oy, false);
          }
        }
        ctx.globalAlpha = 1;
      } else {
        // Nappe de soufre et autres zones : disque chaud et bord pointillé.
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(240, 130, 40, 0.22)';
        ctx.beginPath();
        ctx.arc(Math.round(cx) - ox, Math.round(cy) - oy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f09040';
        cerclePointille(ctx, Math.round(cx) - ox, Math.round(cy) - oy, r, Math.floor(temps / 120));
        ctx.globalAlpha = 1;
      }
    }
    const piege = this.piege;
    const animPiege = piege ? this.atlas.animation(piege, 'repos') : undefined;
    if (piege && animPiege) {
      const cadre = cadreA(animPiege, 0);
      const pieges = etat.pieges;
      for (let i = 0; i < pieges.length; i++) {
        const p = pieges[i];
        if (p) this.atlas.dessiner(ctx, piege, cadre, Math.round(p.x * TUILE) - ox, Math.round(p.y * TUILE) - oy, false);
      }
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
      if (v.unite?.mort || v.masque) continue;
      // Un ennemi plongé n'a plus d'ombre sur le sol : il est sous l'eau (celui qui est à terre garde la sienne).
      if (v.ennemi && v.ennemi.invulnerable > 0 && !v.ennemi.pouvoirs?.relevement) continue;
      const demi = Math.round(v.sprite.largeur / 6);
      ctx.fillRect(v.px - demi + 1, v.py - 3, demi * 2 - 2, 3);
      ctx.fillRect(v.px - demi, v.py - 2, demi * 2, 1);
    }
  }

  /** Décor, tours, ennemis et unités, du plus au nord au plus au sud. */
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
    if (v.masque) return;
    let nom = 'repos';
    let t = temps + v.phase;
    const ennemi = v.ennemi;
    if (ennemi && ennemi.invulnerable > 0) {
      // À terre (relèvement) ou plongé : la chute ou la plongée se joue une fois, puis le dernier cadre reste jusqu'à la fin.
      nom = ennemi.pouvoirs?.relevement ? 'mort' : 'plonge';
      t = temps - v.intouchableDebut;
    } else if (v.categorie === CATEGORIE.unite && v.mortDebut >= 0) {
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
    if (nom === 'mort' && t > 1800 && v.categorie !== CATEGORIE.ennemi) return;
    // Tour qui vient d'être améliorée : elle se tasse puis rebondit (sursaut), et son nouveau sprite flashe en blanc.
    const ts = v.categorie === CATEGORIE.tour ? temps - v.sursautDebut : -1;
    const sursaut = ts >= 0 && ts < DUREE_SURSAUT ? decalageSursaut(ts) : 0;
    const y = v.py - (ennemi?.volant ? ALTITUDE_VOL : 0) + sursaut;
    const unite = v.unite;
    const capacites = unite?.stats.capacites;
    // Les flammes de la rage sous les pieds d'un héros blessé, avant lui ; l'assassin du Sanctuaire est translucide.
    if (unite && (capacites?.rage ?? 0) > 0 && !unite.mort && unite.pv < unite.stats.pv) this.dessinerBoucle(this.rage, v.px, v.py, temps);
    const furtif = capacites?.ciblable === false;
    // Une tour aveuglée (Soleil Blême) est dessinée en retrait, comme dans la brume.
    const aveuglee = v.categorie === CATEGORIE.tour && (v.tour?.aveuglePas ?? 0) > 0;
    if (furtif) ctx.globalAlpha = OPACITE_FURTIF;
    else if (aveuglee) ctx.globalAlpha = OPACITE_AVEUGLE;
    if (unite && !unite.mort && unite.noyade > 0 && v.noyadeMax > 0) this.dessinerNoyee(v, sprite, cadreA(anim, t), y, temps);
    else this.poser(v, sprite, cadreA(anim, t), v.px, y);
    if (furtif || aveuglee) ctx.globalAlpha = 1;
    const tf = v.categorie === CATEGORIE.tour ? temps - v.flashDebut : -1;
    if (tf >= 0 && tf < DUREE_FLASH) this.atlas.dessinerBlanc(ctx, sprite, cadreA(anim, t), v.px, y, v.miroir, opaciteFlash(tf));

    if (v.categorie === CATEGORIE.tour) {
      this.dessinerTireur(v, temps, sursaut);
      const tour = v.tour;
      if (tour) {
        // Ingéniosité : les roues d'or tournent sur chaque tour dont la cadence est boostée.
        if (tour.boostPas > 0) this.dessinerBoucle(this.boost, v.px, v.py - 8, temps);
        // Tour en feu (Juge des Flammes, désactivée) et tour affamée (La Faim, cadence réduite).
        if (tour.desactivee > 0) this.dessinerBoucle(this.tourEnFeu, v.px, v.py - 8, temps);
        // Tour gelée (Inquisiteur) ou affamée (La Faim) : le même voile glacé au-dessus d'elle.
        if (tour.affamePas > 0 || tour.gel > 0) this.dessinerBoucle(this.tourAffamee, v.px, v.py - 8, temps);
      }
    } else if (ennemi && (ennemi.effetsPas[EFFET.etourdissement] ?? 0) > 0 && this.etourdi) {
      const a = this.atlas.animation(this.etourdi, 'repos');
      if (a) this.atlas.dessiner(ctx, this.etourdi, cadreA(a, temps), v.px, y - Math.round(sprite.ancre.y * 0.8) - 4, false);
    }
    // Un soldat qui brûle : des flammes de part et d'autre, par-dessus lui.
    if (unite && !unite.mort && unite.brulure > 0) this.dessinerBoucle(this.brulure, v.px, v.py, temps + v.phase);
  }

  /** Pose un cadre du sprite d'un visuel, avec les couleurs de son skin s'il en porte un. */
  private poser(v: Visuel, sprite: SpriteAtlas, cadre: CadreAtlas, px: number, py: number): void {
    if (v.habille) this.atlas.dessinerHabille(this.ctx, v.habille, sprite, cadre, px, py, v.miroir);
    else this.atlas.dessiner(this.ctx, sprite, cadre, px, py, v.miroir);
  }

  /**
   * Une unité entraînée sous l'eau par un noyeur : elle s'enfonce à mesure que son compte à rebours avance (seul le haut reste
   * visible, coupé par la surface) et une ondulation marque la surface.
   */
  private dessinerNoyee(v: Visuel, sprite: SpriteAtlas, cadre: CadreAtlas, y: number, temps: number): void {
    const unite = v.unite;
    if (!unite) return;
    const avance = 1 - Math.min(1, unite.noyade / v.noyadeMax);
    const enfoncement = Math.round(avance * PART_NOYEE * sprite.hauteur);
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(v.px - sprite.largeur, y - sprite.hauteur - 8, sprite.largeur * 2, sprite.hauteur + 8 - enfoncement);
    ctx.clip();
    this.poser(v, sprite, cadre, v.px, y);
    ctx.restore();
    this.dessinerBoucle(this.ondulation, v.px, y - enfoncement, temps);
  }

  /** Pose un sprite à animation en boucle (halo, flammes, roues) sur un point du tampon. */
  private dessinerBoucle(sprite: SpriteAtlas | undefined, px: number, py: number, temps: number): void {
    if (!sprite) return;
    const anim = this.atlas.animation(sprite, 'repos');
    if (anim) this.atlas.dessiner(this.ctx, sprite, cadreA(anim, temps), px, py, false);
  }

  /** Le chat tireur posté au sommet d'une tour de tir. */
  private dessinerTireur(v: Visuel, temps: number, decalage: number): void {
    const tireur = v.tireur;
    if (!tireur) return;
    const enAction = temps < v.actionFin;
    const anim = this.atlas.animation(tireur, enAction ? 'attaque' : 'repos');
    if (!anim) return;
    this.atlas.dessiner(this.ctx, tireur, cadreA(anim, enAction ? temps - v.actionDebut : temps + v.phase), v.px + v.tirX, v.py + v.tirY + decalage, v.tireurMiroir);
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
        case TYPE_EFFET.anneau:
          this.dessinerAnneau(e, t, ox, oy, false);
          break;
        case TYPE_EFFET.poussiere:
          this.dessinerPoussiere(e, t, ox, oy);
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

  /** Moitié arrière (côté nord) des anneaux d'amélioration : dessinée avant les tours, pour que l'anneau passe derrière le fût. */
  private dessinerAnneauxArriere(temps: number, ox: number, oy: number): void {
    const liste = this.effets.liste;
    for (let i = 0; i < liste.length; i++) {
      const e = liste[i];
      if (!e?.actif || e.type !== TYPE_EFFET.anneau) continue;
      const t = temps - e.debut;
      if (t >= 0 && t < e.duree) this.dessinerAnneau(e, t, ox, oy, true);
    }
  }

  /**
   * Anneau de lumière dorée au pied d'une tour améliorée : une ellipse de pixels, deux rangs d'épaisseur, qui s'élargit et s'éteint.
   * Deux passes : la moitié arrière (`arriere`) avant les tours, la moitié avant par-dessus, pour qu'il entoure la tour.
   */
  private dessinerAnneau(e: Effet, t: number, ox: number, oy: number, arriere: boolean): void {
    const ctx = this.ctx;
    const suivie = this.tourSuivie(e);
    const cx = suivie ? suivie.px : e.x - ox;
    const cy = (suivie ? suivie.py : e.y - oy) - 1;
    const rx = rayonAnneau(t, e.valeur);
    const ry = rx * 0.45;
    const n = Math.max(16, Math.ceil(rx * 5));
    ctx.fillStyle = ANNEAU_COULEUR;
    ctx.globalAlpha = opaciteAnneau(t);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI;
      if (Math.sin(a) < 0 !== arriere) continue;
      const x = Math.round(cx + Math.cos(a) * rx);
      const y = Math.round(cy + Math.sin(a) * ry);
      ctx.fillRect(x, y, 1, 2);
    }
    ctx.globalAlpha = opaciteAnneau(t) * 0.5;
    ctx.fillStyle = ANNEAU_CLAIR;
    for (let i = 0; i < n; i += 2) {
      const a = (i / n) * 2 * Math.PI;
      if (Math.sin(a) < 0 !== arriere) continue;
      ctx.fillRect(Math.round(cx + Math.cos(a) * (rx - 2)), Math.round(cy + Math.sin(a) * (ry - 1)), 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  /** La tour qu'un effet suit (tour du radeau, qui bouge) : son visuel, à sa position interpolée de cette image. */
  private tourSuivie(e: Effet): Visuel | undefined {
    return e.suitTour >= 0 ? this.suivi.tours.get(e.suitTour) : undefined;
  }

  /** Poussière et éclats aux deux coins de la base d'une tour améliorée. */
  private dessinerPoussiere(e: Effet, t: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const s = this.particuleTemp;
    const suivie = this.tourSuivie(e);
    const bx = suivie ? suivie.px : e.x - ox;
    const by = suivie ? suivie.py : e.y - oy;
    for (let cote = -1; cote <= 1; cote += 2) {
      for (let i = 0; i < PARTICULES.length; i++) {
        if (e.echelle === 0 && PARTICULES[i]?.eclat) continue;
        if (!particule(i, cote as -1 | 1, t, e.valeur, s)) continue;
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.eclat ? (i % 2 === 0 ? ECLAT_BOIS : ECLAT_OR) : POUSSIERE_COULEUR;
        ctx.fillRect(bx + s.x, by + s.y - 1, s.taille, s.taille);
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Lueur additive sous les tours à feu (voir `HALOS`) : une image de dégradé préparée une fois par réglage, posée en ellipse,
   * qui pulse doucement. Dessinée avant les sprites pour rester sous les ennemis et les tours : elle n'éclaire que le sol.
   */
  private dessinerHalos(temps: number, l: number, h: number): void {
    const liste = this.suivi.dessinables;
    const ctx = this.ctx;
    let additif = false;
    const reduit = this.suivi.animationsReduites();
    for (let i = 0; i < liste.length; i++) {
      const v = liste[i];
      if (!v || v.categorie !== CATEGORIE.tour || v.masque || !v.tour) continue;
      const def = v.halo;
      if (!def) continue;
      if (v.px < -48 || v.px > l + 48 || v.py < -16 || v.py > h + 80) continue;
      const image = this.imageHalo(def);
      if (!additif) {
        ctx.globalCompositeOperation = 'lighter';
        additif = true;
      }
      ctx.globalAlpha = Math.min(1, def.intensite * pulsationHalo(temps, v.phase, reduit));
      const demi = def.rayon;
      ctx.drawImage(image, v.px - demi, v.py - 5 - Math.round(demi * 0.3), demi * 2, Math.round(demi * 1.2));
    }
    if (additif) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  /** Disque dégradé de la couleur du halo, créé à la première demande puis gardé. */
  private imageHalo(def: DefHalo): HTMLCanvasElement {
    const connue = this.halos.get(def);
    if (connue) return connue;
    const taille = def.rayon * 2;
    const canvas = document.createElement('canvas');
    canvas.width = taille;
    canvas.height = taille;
    const g = canvas.getContext('2d');
    if (g) {
      const degrade = g.createRadialGradient(def.rayon, def.rayon, 0, def.rayon, def.rayon, def.rayon);
      degrade.addColorStop(0, `rgba(${def.couleur}, 1)`);
      degrade.addColorStop(0.5, `rgba(${def.couleur}, 0.45)`);
      degrade.addColorStop(1, `rgba(${def.couleur}, 0)`);
      g.fillStyle = degrade;
      g.fillRect(0, 0, taille, taille);
    }
    this.halos.set(def, canvas);
    return canvas;
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
      if (!v?.sprite || v.categorie === CATEGORIE.tour || v.masque) continue;
      if (v.px < -40 || v.px > l + 40 || v.py < -16 || v.py > h + 80) continue;
      const e = v.ennemi;
      const u = v.unite;
      let ratio: number;
      let couleur: string;
      let large = 12;
      let pastilles = false;
      if (e) {
        ratio = e.pv / e.pvMax;
        couleur = e.invulnerable > 0 ? BARRE_INTOUCHABLE : e.elite ? BARRE_ELITE : BARRE_ENNEMI;
        if (e.boss) large = 28;
        else if (e.elite) large = 14;
        for (let k = 0; k < POINTS_ETAT.length && !pastilles; k++) pastilles = (e.effetsPas[POINTS_ETAT[k]?.[0] ?? 0] ?? 0) > 0;
        if (ratio >= 0.999 && !e.boss && !e.elite && e.invulnerable === 0 && !pastilles) continue;
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

  /** Disque clair et cercle pointillé : la portée d'une tour, centrée en (cx, cy) du tampon. */
  private dessinerPortee(cx: number, cy: number, rayon: number, phase: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(243, 230, 176, 0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, rayon, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ANNEAU_PORTEE;
    cerclePointille(ctx, cx, cy, rayon, phase);
  }

  /** Point de ralliement d'une caserne : un petit carré cerné d'un anneau, relié à la tour par une ligne. */
  private dessinerRalliement(cx: number, cy: number, rx: number, ry: number, phase: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = ANNEAU;
    ligne(ctx, cx, cy, rx, ry);
    cerclePointille(ctx, rx, ry, 5, phase);
    ctx.fillRect(rx - 1, ry - 1, 3, 3);
  }

  /**
   * La case sous le pointeur : un voile et quatre coins. Dessinée par-dessus le décor et les tours (un grand décor qui interdit
   * la case la cacherait sinon), mais en voile léger. Rien n'est dessiné tant qu'on ne vise pas.
   */
  private dessinerVisee(etat: EtatPartie, surb: Surbrillance, alpha: number, ox: number, oy: number): void {
    const place = surb.viseePlace >= 0 ? placeAffichee(etat, alpha, surb.viseePlace) : null;
    if (place) {
      // Une place du radeau visée : un cadre d'une tuile autour d'elle, qui suit le radeau.
      const demi = DEMI_VISEE_PLACE;
      this.cadreVisee(Math.round(place.x * TUILE) - ox - demi, Math.round(place.y * TUILE) - oy - demi, demi * 2, false);
      return;
    }
    if (surb.viseeCx < 0 || surb.viseeCy < 0 || !caseExiste(etat.niveau.carte, surb.viseeCx, surb.viseeCy)) return;
    const cote = REGLES.tailleCase * TUILE;
    this.cadreVisee(surb.viseeCx * cote - ox, surb.viseeCy * cote - oy, cote, surb.viseeInterdite);
  }

  /** Un voile et quatre coins sur le carré de côté `cote` dont le coin haut gauche est (x, y) du tampon. */
  private cadreVisee(x: number, y: number, cote: number, interdite: boolean): void {
    const ctx = this.ctx;
    ctx.fillStyle = interdite ? VISEE_INTERDITE_VOILE : VISEE_LIBRE_VOILE;
    ctx.fillRect(x + 1, y + 1, cote - 2, cote - 2);
    ctx.fillStyle = interdite ? VISEE_INTERDITE_COIN : VISEE_LIBRE_COIN;
    const fin = cote - 1;
    for (const [px, py, sx, sy] of [[1, 1, 1, 1], [fin, 1, -1, 1], [1, fin, 1, -1], [fin, fin, -1, -1]] as const) {
      // Un coin : deux traits d'un pixel, l'un horizontal et l'autre vertical.
      ctx.fillRect(sx > 0 ? x + px : x + px - COIN_VISEE + 1, y + py, COIN_VISEE, 1);
      ctx.fillRect(x + px, sy > 0 ? y + py : y + py - COIN_VISEE + 1, 1, COIN_VISEE);
    }
  }

  private dessinerSurbrillance(etat: EtatPartie, surb: Surbrillance, alpha: number, temps: number, ox: number, oy: number): void {
    const ctx = this.ctx;
    const phase = Math.floor(temps / 90);
    if (surb.place >= 0 || (surb.cx >= 0 && surb.cy >= 0)) {
      // Une place du radeau se lit au pas affiché : la portée et l'anneau de sélection suivent la tour qui bouge.
      const s = surb.place >= 0 ? placeAffichee(etat, alpha, surb.place) : caseExiste(etat.niveau.carte, surb.cx, surb.cy) ? centreCase(surb.cx, surb.cy) : null;
      if (s) {
        const cx = Math.round(s.x * TUILE) - ox;
        const cy = Math.round(s.y * TUILE) - oy;
        if (surb.portee > 0) this.dessinerPortee(cx, cy, surb.portee * TUILE, phase);
        else if (surb.apercuPortee > 0) {
          // Menu de construction : la tour survolée couvrirait ceci, et ses soldats se rallieraient là.
          this.dessinerPortee(cx, cy, surb.apercuPortee * TUILE, phase);
          if (surb.apercuRalliement) this.dessinerRalliement(cx, cy, Math.round(surb.apercuRalliementX * TUILE) - ox, Math.round(surb.apercuRalliementY * TUILE) - oy, phase);
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
