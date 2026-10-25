import { describe, expect, it } from 'vitest';
import { HAUTEUR_CARTE_MONDE, LARGEUR_CARTE_MONDE, NOEUDS_REGION1, TRACE_REGION1 } from './carte-du-monde';
import { REGION1 } from './region1';

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

describe('carte de la région 1', () => {
  it('a un nœud par niveau de la campagne, dans l’ordre, le boss en dernier', () => {
    expect(NOEUDS_REGION1.map((n) => n.numero)).toEqual(REGION1.map((n) => n.numero));
    expect(NOEUDS_REGION1.filter((n) => n.boss).map((n) => n.numero)).toEqual([10]);
  });

  it('place les nœuds dans le fond de 512 × 288, assez loin les uns des autres pour être touchés au doigt', () => {
    expect([LARGEUR_CARTE_MONDE, HAUTEUR_CARTE_MONDE]).toEqual([512, 288]);
    for (const n of NOEUDS_REGION1) {
      expect(n.x).toBeGreaterThanOrEqual(16);
      expect(n.x).toBeLessThanOrEqual(LARGEUR_CARTE_MONDE - 16);
      expect(n.y).toBeGreaterThanOrEqual(16);
      expect(n.y).toBeLessThanOrEqual(HAUTEUR_CARTE_MONDE - 16);
    }
    NOEUDS_REGION1.forEach((a, i) => {
      NOEUDS_REGION1.forEach((b, j) => {
        if (j > i) expect(dist(a, b), `nœuds ${String(a.numero)} et ${String(b.numero)}`).toBeGreaterThanOrEqual(40);
      });
    });
  });

  it('relie chaque niveau au suivant par un tronçon qui part et arrive exactement sur les nœuds', () => {
    expect(TRACE_REGION1.length).toBe(NOEUDS_REGION1.length - 1);
    TRACE_REGION1.forEach((troncon, i) => {
      const depart = NOEUDS_REGION1[i];
      const arrivee = NOEUDS_REGION1[i + 1];
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

  it('avance toujours vers l’est : la route ne se recoupe pas', () => {
    const points = TRACE_REGION1.flat();
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (a && b) expect(b.x).toBeGreaterThanOrEqual(a.x);
    }
  });
});
