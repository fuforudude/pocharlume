// Géométrie de l'habillage des cartes : rectangles (emprises des sprites) et distances aux chemins.
// Coordonnées en tuiles, comme la carte du moteur. Sert à l'assemblage des niveaux et à leurs tests.
import type { Point } from '../../engine/definitions';

export interface Rect {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export function rectAutour(x: number, y: number, gauche: number, haut: number, droite: number, bas: number): Rect {
  return { x0: x - gauche, y0: y - haut, x1: x + droite, y1: y + bas };
}

export function rectsSeChevauchent(a: Rect, b: Rect, marge = 0): boolean {
  return a.x0 < b.x1 + marge && a.x1 + marge > b.x0 && a.y0 < b.y1 + marge && a.y1 + marge > b.y0;
}

function distancePointSegment(px: number, py: number, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const l2 = vx * vx + vy * vy;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / l2)) : 0;
  const dx = px - (a.x + t * vx);
  const dy = py - (a.y + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}

function distancePointRect(px: number, py: number, r: Rect): number {
  const dx = Math.max(r.x0 - px, 0, px - r.x1);
  const dy = Math.max(r.y0 - py, 0, py - r.y1);
  return Math.sqrt(dx * dx + dy * dy);
}

/** Dit si le segment ab traverse (ou touche) le rectangle. */
function segmentTraverseRect(a: Point, b: Point, r: Rect): boolean {
  if (distancePointRect(a.x, a.y, r) === 0 || distancePointRect(b.x, b.y, r) === 0) return true;
  // Clipping de Liang-Barsky.
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bornes: [number, number][] = [
    [-dx, a.x - r.x0],
    [dx, r.x1 - a.x],
    [-dy, a.y - r.y0],
    [dy, r.y1 - a.y],
  ];
  for (const [p, q] of bornes) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        t0 = Math.max(t0, t);
      } else {
        if (t < t0) return false;
        t1 = Math.min(t1, t);
      }
    }
  }
  return true;
}

/** Distance du rectangle à la polyligne (0 si elle le traverse). */
export function distanceRectChemin(r: Rect, points: readonly Point[]): number {
  let min = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    if (segmentTraverseRect(a, b, r)) return 0;
    min = Math.min(
      min,
      distancePointRect(a.x, a.y, r),
      distancePointRect(b.x, b.y, r),
      distancePointSegment(r.x0, r.y0, a, b),
      distancePointSegment(r.x1, r.y0, a, b),
      distancePointSegment(r.x0, r.y1, a, b),
      distancePointSegment(r.x1, r.y1, a, b),
    );
  }
  return min;
}

/** Distance d'un point à la polyligne. */
export function distancePointChemin(x: number, y: number, points: readonly Point[]): number {
  let min = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) min = Math.min(min, distancePointSegment(x, y, a, b));
  }
  return min;
}
