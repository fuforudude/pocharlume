// Sol de la carte : herbe, chemin tracé à partir des polylignes du moteur (avec bords et coins), zones de
// boue et de pavés. La grille de noms de tuiles est pure (testée) ; la peinture dans un canvas hors écran se
// fait une seule fois au lancement du niveau.
import type { VisuelCarte } from '../data/visuel';
import type { Carte, Point } from '../engine/definitions';
import type { AtlasRendu } from './atlas';
import { TUILE } from './camera';

/** Largeur du chemin dessiné, de part et d'autre de l'axe suivi par les ennemis (en tuiles) : 2 tuiles en tout. */
export const DEMI_LARGEUR_CHEMIN = 1;

/**
 * Nom d'une tuile dans l'atlas selon la région du visuel : la région 1 garde les noms d'origine (`herbe-1`), les
 * suivantes ont leur jeu préfixé (`r2-herbe-1`, `r3-chemin-bord-n`…). Voir art/sprites/tuiles-region<N>.txt.
 */
export function nomTuile(region: number, base: string): string {
  return region <= 1 ? base : `r${String(Math.trunc(region))}-${base}`;
}

export interface GrilleSol {
  readonly largeur: number;
  readonly hauteur: number;
  /** Nom de sprite de chaque tuile, rangée par ligne. */
  readonly tuiles: readonly string[];
}

/** Hasard déterministe dans [0, 1[ pour une case : le sol est identique à chaque lancement. */
export function bruit(x: number, y: number): number {
  let h = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Choisit une variante d'après des poids cumulés (ex. [0.6, 0.85] : 60 % de la 1re, 25 % de la 2e, 15 % de la 3e). */
function variante(x: number, y: number, seuils: readonly number[]): number {
  const b = bruit(x, y);
  const i = seuils.findIndex((s) => b < s);
  return (i === -1 ? seuils.length : i) + 1;
}

function distanceSegment2(px: number, py: number, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longueur2 = dx * dx + dy * dy;
  const t = longueur2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - a.x) * dx + (py - a.y) * dy) / longueur2));
  const ex = px - (a.x + t * dx);
  const ey = py - (a.y + t * dy);
  return ex * ex + ey * ey;
}

/** Cases (rangées par ligne) dont le centre est à moins de `demiLargeur` tuiles d'un chemin. */
export function masqueChemin(carte: Carte, demiLargeur: number = DEMI_LARGEUR_CHEMIN): Uint8Array {
  const masque = new Uint8Array(carte.largeur * carte.hauteur);
  const limite2 = demiLargeur * demiLargeur;
  for (let y = 0; y < carte.hauteur; y++) {
    for (let x = 0; x < carte.largeur; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      let dedans = false;
      for (const chemin of carte.chemins) {
        for (let i = 1; i < chemin.points.length && !dedans; i++) {
          const a = chemin.points[i - 1];
          const b = chemin.points[i];
          if (a && b && distanceSegment2(cx, cy, a, b) <= limite2) dedans = true;
        }
        if (dedans) break;
      }
      masque[y * carte.largeur + x] = dedans ? 1 : 0;
    }
  }
  return masque;
}

/**
 * Nom de la tuile d'une case de chemin selon ses voisines. Hors de la carte, le chemin continue (il entre et
 * sort par les bords) : pas de bord d'herbe là. Les bords et coins sont nommés d'après le côté où se trouve
 * l'herbe, comme dans art/sprites/tuiles-village.txt.
 */
function tuileChemin(masque: Uint8Array, largeur: number, hauteur: number, x: number, y: number): string {
  const chemin = (cx: number, cy: number): boolean =>
    cx < 0 || cy < 0 || cx >= largeur || cy >= hauteur || masque[cy * largeur + cx] === 1;
  const n = !chemin(x, y - 1);
  const s = !chemin(x, y + 1);
  const o = !chemin(x - 1, y);
  const e = !chemin(x + 1, y);
  const cotes = Number(n) + Number(s) + Number(o) + Number(e);

  if (cotes === 0) {
    // Seule une diagonale d'herbe : coin intérieur du virage. Plusieurs diagonales : terre unie.
    const diagonales: string[] = [];
    if (!chemin(x - 1, y - 1)) diagonales.push('no');
    if (!chemin(x + 1, y - 1)) diagonales.push('ne');
    if (!chemin(x - 1, y + 1)) diagonales.push('so');
    if (!chemin(x + 1, y + 1)) diagonales.push('se');
    const seule = diagonales.length === 1 ? diagonales[0] : undefined;
    return seule ? `chemin-coin-int-${seule}` : `chemin-${String(variante(x, y, [0.7]))}`;
  }
  if (cotes === 2 && (n || s) && (o || e)) return `chemin-coin-ext-${n ? 'n' : 's'}${o ? 'o' : 'e'}`;
  // Un côté, ou un couloir d'une case de large (deux côtés opposés) : un bord, du nord au sud en priorité.
  if (n) return 'chemin-bord-n';
  if (e) return 'chemin-bord-e';
  if (s) return 'chemin-bord-s';
  return 'chemin-bord-o';
}

/** Grille de noms de tuiles d'une carte : herbe variée, zones, puis chemin par-dessus. */
export function construireSol(carte: Carte, visuel: VisuelCarte, demiLargeur: number = DEMI_LARGEUR_CHEMIN): GrilleSol {
  const { largeur, hauteur } = carte;
  const masque = masqueChemin(carte, demiLargeur);
  const tuiles: string[] = [];
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      if (masque[y * largeur + x] === 1) {
        tuiles.push(nomTuile(visuel.region, tuileChemin(masque, largeur, hauteur, x, y)));
        continue;
      }
      const zone = visuel.zones.find((z) => x >= z.x && x < z.x + z.largeur && y >= z.y && y < z.y + z.hauteur);
      const base = zone ? `${zone.sol}-${String(variante(x, y, [0.7]))}` : `herbe-${String(variante(x, y, [0.62, 0.86]))}`;
      tuiles.push(nomTuile(visuel.region, base));
    }
  }
  return { largeur, hauteur, tuiles };
}

/** Peint la grille dans un canvas hors écran de la taille de la carte (1 pixel = 1 pixel logique). */
export function peindreSol(grille: GrilleSol, atlas: AtlasRendu): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = grille.largeur * TUILE;
  canvas.height = grille.hauteur * TUILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexte 2D indisponible');
  ctx.imageSmoothingEnabled = false;
  grille.tuiles.forEach((nom, i) => {
    const sprite = atlas.sprite(nom);
    const cadre = sprite ? atlas.cadre(sprite, 'repos', 0) : undefined;
    const x = (i % grille.largeur) * TUILE;
    const y = Math.floor(i / grille.largeur) * TUILE;
    if (sprite && cadre) {
      atlas.dessiner(ctx, sprite, cadre, x, y, false);
    } else {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y, TUILE, TUILE);
    }
  });
  return canvas;
}
