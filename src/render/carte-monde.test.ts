import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HAUTEUR_CARTE_MONDE, LARGEUR_CARTE_MONDE, NOEUDS_REGION1, TRACE_REGION1 } from '../data/niveaux/carte-du-monde';
import type { Point } from '../engine/definitions';
import { carteDuSol, DEMI_LARGEUR_ROUTE, pointsPointilles } from './carte-monde';
import { DECOR_MONDE_REGION1 } from './carte-monde-decor';
import { construireSol, masqueChemin } from './sol';

const atlas = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as { sprites: Record<string, unknown> };

function distanceSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.sqrt((p.x - a.x - t * dx) ** 2 + (p.y - a.y - t * dy) ** 2);
}

function distanceAuTrace(p: Point): number {
  let min = Infinity;
  for (const troncon of TRACE_REGION1) {
    for (let i = 1; i < troncon.length; i++) {
      const a = troncon[i - 1];
      const b = troncon[i];
      if (a && b) min = Math.min(min, distanceSegment(p, a, b));
    }
  }
  return min;
}

describe('carte des tuiles de la route', () => {
  it('fait 32 × 18 tuiles, comme le fond de 512 × 288', () => {
    const c = carteDuSol(TRACE_REGION1, 3);
    expect([c.largeur, c.hauteur]).toEqual([LARGEUR_CARTE_MONDE / 16, HAUTEUR_CARTE_MONDE / 16]);
  });

  it('ne contient que les tronçons ouverts, en tuiles', () => {
    expect(carteDuSol(TRACE_REGION1, 0).chemins).toHaveLength(0);
    expect(carteDuSol(TRACE_REGION1, -2).chemins).toHaveLength(0);
    const trois = carteDuSol(TRACE_REGION1, 3);
    expect(trois.chemins).toHaveLength(3);
    expect(trois.chemins[0]?.points[0]).toEqual({ x: 40 / 16, y: 236 / 16 });
    expect(carteDuSol(TRACE_REGION1, 99).chemins).toHaveLength(TRACE_REGION1.length);
  });

  it('dessine la route sous les tronçons ouverts et pas sous les autres', () => {
    const ouverte = carteDuSol(TRACE_REGION1, 2);
    const grille = construireSol(ouverte, { region: 1, zones: [], decor: [] }, DEMI_LARGEUR_ROUTE);
    const masque = masqueChemin(ouverte, DEMI_LARGEUR_ROUTE);
    const [n1, n2, n3, n9] = [NOEUDS_REGION1[0], NOEUDS_REGION1[1], NOEUDS_REGION1[2], NOEUDS_REGION1[8]];
    if (!n1 || !n2 || !n3 || !n9) throw new Error('nœuds absents');
    const estRoute = (n: Point): boolean => masque[Math.floor(n.y / 16) * grille.largeur + Math.floor(n.x / 16)] === 1;
    expect([estRoute(n1), estRoute(n2), estRoute(n3), estRoute(n9)]).toEqual([true, true, true, false]);
  });
});

describe('pointillé du chemin fermé', () => {
  it('ne pose des points que sur les tronçons demandés, régulièrement espacés', () => {
    const points = pointsPointilles(TRACE_REGION1, 5, 7);
    expect(points.length).toBeGreaterThan(10);
    const dernierOuvert = NOEUDS_REGION1[5];
    if (!dernierOuvert) throw new Error('nœud 6 absent');
    for (const p of points) {
      expect(distanceAuTrace(p)).toBeLessThanOrEqual(1);
      expect(p.x).toBeGreaterThanOrEqual(dernierOuvert.x - 1);
    }
  });

  it('ne pose rien quand tout le chemin est ouvert, et pose tout depuis le début', () => {
    expect(pointsPointilles(TRACE_REGION1, TRACE_REGION1.length, 7)).toEqual([]);
    expect(pointsPointilles(TRACE_REGION1, 0, 7).length).toBeGreaterThan(pointsPointilles(TRACE_REGION1, 4, 7).length);
  });

  it('commence chaque tronçon sur son nœud de départ', () => {
    const un = pointsPointilles(TRACE_REGION1.slice(0, 1), 0, 7);
    expect(un[0]).toEqual({ x: NOEUDS_REGION1[0]?.x, y: NOEUDS_REGION1[0]?.y });
  });
});

describe('décor de la carte du monde', () => {
  it('n’utilise que des sprites de l’atlas', () => {
    for (const d of DECOR_MONDE_REGION1) expect(Object.hasOwn(atlas.sprites, d.sprite), d.sprite).toBe(true);
  });

  it('reste dans le fond', () => {
    for (const d of DECOR_MONDE_REGION1) {
      expect(d.x).toBeGreaterThanOrEqual(8);
      expect(d.x).toBeLessThanOrEqual(LARGEUR_CARTE_MONDE - 8);
      expect(d.y).toBeGreaterThanOrEqual(16);
      expect(d.y).toBeLessThanOrEqual(HAUTEUR_CARTE_MONDE);
    }
  });

  it('ne recouvre ni la route ni les nœuds ni leurs étoiles', () => {
    for (const d of DECOR_MONDE_REGION1) {
      expect(distanceAuTrace(d), `${d.sprite} en (${String(d.x)}, ${String(d.y)}) trop près de la route`).toBeGreaterThanOrEqual(18);
      for (const n of NOEUDS_REGION1) {
        // Pastille de 10 px de rayon, ses étoiles juste dessous : le décor se tient plus loin, surtout sous le nœud.
        const dx = d.x - n.x;
        const dy = d.y - n.y;
        expect(Math.sqrt(dx * dx + dy * dy), `${d.sprite} trop près du nœud ${String(n.numero)}`).toBeGreaterThanOrEqual(24);
      }
    }
  });
});
