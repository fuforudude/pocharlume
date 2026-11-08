// Chemins en polylignes : précalcul des longueurs, position à une distance parcourue, distance au chemin.
import type { CheminCarte, Point } from './definitions';
import type { CheminCalcule, Ennemi, EtatPartie } from './etat';

export function calculerChemin(chemin: CheminCarte): CheminCalcule {
  const points = chemin.points.map((p) => ({ x: p.x, y: p.y }));
  const cumul = [0];
  const dirX: number[] = [];
  const dirY: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    const longueur = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    dirX.push(longueur > 0 ? (b.x - a.x) / longueur : 0);
    dirY.push(longueur > 0 ? (b.y - a.y) / longueur : 0);
    total += longueur;
    cumul.push(total);
  }
  return { points, cumul, dirX, dirY, longueur: total };
}

/**
 * Le trajet que suit un ennemi : son couloir s'il vole en couloir (Vol de Corbeaux), sinon son chemin. Tout ce qui lit sa progression
 * (déplacement, ciblage du plus avancé, anticipation des tirs, bouclier frontal) passe par ici.
 */
export function trajetEnnemi(etat: Pick<EtatPartie, 'chemins' | 'couloirs'>, e: Pick<Ennemi, 'chemin' | 'couloir'>): CheminCalcule | undefined {
  return e.couloir >= 0 ? etat.couloirs[e.couloir] : etat.chemins[e.chemin];
}

/** Avance l'indice de segment pour la distance donnée (les ennemis ne reculent jamais). */
export function segmentPour(c: CheminCalcule, distance: number, depuis: number): number {
  let s = depuis;
  const dernier = c.cumul.length - 2;
  while (s < dernier && distance >= (c.cumul[s + 1] ?? Infinity)) s++;
  return s;
}

/**
 * Écrit dans `sortie` le point à `distance` le long du chemin, décalé latéralement de `decalage`.
 * Sans allocation : sert dans la boucle chaude.
 */
export function placerSurChemin(c: CheminCalcule, distance: number, segment: number, decalage: number, sortie: Point): void {
  const p = c.points[segment];
  if (!p) return;
  const dx = c.dirX[segment] ?? 0;
  const dy = c.dirY[segment] ?? 0;
  const d = Math.min(distance, c.longueur) - (c.cumul[segment] ?? 0);
  sortie.x = p.x + dx * d - dy * decalage;
  sortie.y = p.y + dy * d + dx * decalage;
}

/** Point sur l'axe du chemin à une distance parcourue (bornée à la sortie). */
export function pointSurChemin(c: CheminCalcule, distance: number): Point {
  const point = { x: 0, y: 0 };
  placerSurChemin(c, distance, segmentPour(c, distance, 0), 0, point);
  return point;
}

function distanceAuSegment(px: number, py: number, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const l2 = vx * vx + vy * vy;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / l2)) : 0;
  const dx = px - (a.x + t * vx);
  const dy = py - (a.y + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}

export interface Projection {
  /** Indice du chemin le plus proche. */
  chemin: number;
  /** Distance parcourue le long de ce chemin jusqu'au point le plus proche. */
  distance: number;
  /** Distance du point au chemin. */
  ecart: number;
}

/** Point du chemin le plus proche d'un point donné (le premier en cas d'égalité), ou undefined s'il n'y a pas de chemin. */
export function projeterSurChemin(chemins: readonly CheminCalcule[], x: number, y: number): Projection | undefined {
  let meilleur: Projection | undefined;
  chemins.forEach((c, chemin) => {
    for (let i = 1; i < c.points.length; i++) {
      const a = c.points[i - 1];
      const b = c.points[i];
      if (!a || !b) continue;
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const l2 = vx * vx + vy * vy;
      const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / l2)) : 0;
      const dx = x - (a.x + t * vx);
      const dy = y - (a.y + t * vy);
      const ecart = Math.sqrt(dx * dx + dy * dy);
      if (!meilleur || ecart < meilleur.ecart) meilleur = { chemin, distance: (c.cumul[i - 1] ?? 0) + t * Math.sqrt(l2), ecart };
    }
  });
  return meilleur;
}

/** Distance d'un point au chemin le plus proche. */
export function distanceAuxChemins(chemins: readonly CheminCalcule[], x: number, y: number): number {
  let min = Infinity;
  for (const c of chemins) {
    for (let i = 1; i < c.points.length; i++) {
      const a = c.points[i - 1];
      const b = c.points[i];
      if (a && b) min = Math.min(min, distanceAuSegment(x, y, a, b));
    }
  }
  return min;
}
