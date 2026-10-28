import { describe, expect, it } from 'vitest';
import type { Point } from '../../engine/definitions';
import {
  HAUTEUR_CARTE_MONDE,
  LARGEUR_CARTE_MONDE,
  NOEUDS_REGION1,
  NOEUDS_REGIONS,
  TRACES_REGIONS,
  TRACE_REGION1,
  noeudsDeRegion,
  traceDeRegion,
} from './carte-du-monde';
import { REGIONS } from './campagne';

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

function distancePointSegment(p: Point, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const l2 = vx * vx + vy * vy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2));
  return dist(p, { x: a.x + t * vx, y: a.y + t * vy });
}

function orientation(a: Point, b: Point, c: Point): number {
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

/** Deux segments se croisent (au sens strict : se toucher au bout ne compte pas). */
function secroisent(a: Point, b: Point, c: Point, d: Point): boolean {
  return orientation(a, b, c) * orientation(a, b, d) < 0 && orientation(c, d, a) * orientation(c, d, b) < 0;
}

describe('carte du monde : cinq régions', () => {
  it('a une route par région, avec dix nœuds chacune', () => {
    expect(NOEUDS_REGIONS).toHaveLength(5);
    expect(TRACES_REGIONS).toHaveLength(5);
    expect(NOEUDS_REGIONS[0]).toBe(NOEUDS_REGION1);
    expect(TRACES_REGIONS[0]).toBe(TRACE_REGION1);
    for (const noeuds of NOEUDS_REGIONS) expect(noeuds).toHaveLength(10);
  });

  it('noeudsDeRegion et traceDeRegion rendent la route d’une région de 1 à 5, rien d’autre', () => {
    expect(noeudsDeRegion(3)).toBe(NOEUDS_REGIONS[2]);
    expect(traceDeRegion(5)).toBe(TRACES_REGIONS[4]);
    for (const r of [0, 6, 1.5, -1, Number.NaN]) {
      expect(noeudsDeRegion(r)).toBeUndefined();
      expect(traceDeRegion(r)).toBeUndefined();
    }
  });

  it('les cinq routes ne se ressemblent pas : chaque région a ses propres positions', () => {
    const cles = NOEUDS_REGIONS.map((n) => JSON.stringify(n.map((x) => [x.x, x.y])));
    expect(new Set(cles).size).toBe(5);
  });

  NOEUDS_REGIONS.forEach((noeuds, r) => {
    const region = r + 1;
    const trace = TRACES_REGIONS[r] ?? [];

    describe(`région ${String(region)}`, () => {
      it('a un nœud par niveau de la région, dans l’ordre, le boss en dernier', () => {
        expect(noeuds.map((n) => n.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(noeuds.map((n) => n.numero)).toEqual((REGIONS[r] ?? []).map((n) => n.numero - r * 10));
        expect(noeuds.filter((n) => n.boss).map((n) => n.numero)).toEqual([10]);
      });

      it('place les nœuds dans le fond de 512 × 288, assez loin les uns des autres pour être touchés au doigt', () => {
        expect([LARGEUR_CARTE_MONDE, HAUTEUR_CARTE_MONDE]).toEqual([512, 288]);
        for (const n of noeuds) {
          expect(n.x).toBeGreaterThanOrEqual(16);
          expect(n.x).toBeLessThanOrEqual(LARGEUR_CARTE_MONDE - 16);
          expect(n.y).toBeGreaterThanOrEqual(16);
          expect(n.y).toBeLessThanOrEqual(HAUTEUR_CARTE_MONDE - 16);
        }
        noeuds.forEach((a, i) => {
          noeuds.forEach((b, j) => {
            if (j > i) expect(dist(a, b), `nœuds ${String(a.numero)} et ${String(b.numero)}`).toBeGreaterThanOrEqual(40);
          });
        });
      });

      it('relie chaque niveau au suivant par un tronçon qui part et arrive exactement sur les nœuds', () => {
        expect(trace.length).toBe(noeuds.length - 1);
        trace.forEach((troncon, i) => {
          const depart = noeuds[i];
          const arrivee = noeuds[i + 1];
          expect(troncon.length).toBeGreaterThanOrEqual(2);
          expect(troncon[0]).toEqual({ x: depart?.x, y: depart?.y });
          expect(troncon.at(-1)).toEqual({ x: arrivee?.x, y: arrivee?.y });
          for (let k = 1; k < troncon.length; k++) {
            const a = troncon[k - 1];
            const b = troncon[k];
            if (a && b) expect(dist(a, b)).toBeGreaterThan(0);
          }
          for (const p of troncon) {
            expect(p.x >= 0 && p.x <= LARGEUR_CARTE_MONDE && p.y >= 0 && p.y <= HAUTEUR_CARTE_MONDE).toBe(true);
          }
        });
      });

      it('la route ne se recoupe pas et passe à l’écart des nœuds qui ne sont pas les siens', () => {
        const segments: [Point, Point, number][] = [];
        trace.forEach((troncon, i) => {
          for (let k = 1; k < troncon.length; k++) {
            const a = troncon[k - 1];
            const b = troncon[k];
            if (a && b) segments.push([a, b, i]);
          }
        });
        segments.forEach(([a, b, i], s) => {
          segments.forEach(([c, d, j], t) => {
            if (t > s) expect(secroisent(a, b, c, d), `tronçons ${String(i + 1)} et ${String(j + 1)}`).toBe(false);
          });
          noeuds.forEach((n, m) => {
            if (m === i || m === i + 1) return;
            expect(distancePointSegment(n, a, b), `tronçon ${String(i + 1)} près du nœud ${String(n.numero)}`).toBeGreaterThanOrEqual(14);
          });
        });
      });
    });
  });

  it('la route de la région 1 avance toujours vers l’est', () => {
    const points = TRACE_REGION1.flat();
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (a && b) expect(b.x).toBeGreaterThanOrEqual(a.x);
    }
  });
});
