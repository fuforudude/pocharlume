// Géométrie des cartes pour les bots : points d'échantillonnage le long des chemins, longueur de chemin vue
// depuis un socle, poids de chaque chemin dans les vagues du niveau.
import { creerPartie, pointSurChemin } from '../engine';
import type { DefEnnemi, EtatPartie, Niveau, Point } from '../engine';
import { ENNEMIS } from '../data/ennemis';
import { menaceEnnemi } from '../data/equilibrage';
import { VERSION_DONNEES } from '../data/version';

/** Écart entre deux points d'échantillonnage, en tuiles. */
export const PAS_ECHANTILLON = 0.5;

export interface Echantillon extends Point {
  /** Indice du chemin. */
  readonly chemin: number;
  /** Distance parcourue depuis l'entrée. */
  readonly distance: number;
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

/** Points régulièrement espacés sur chaque chemin de la partie. */
export function echantillonner(etat: EtatPartie): Echantillon[] {
  const points: Echantillon[] = [];
  etat.chemins.forEach((c, chemin) => {
    for (let d = 0; d <= c.longueur; d += PAS_ECHANTILLON) {
      const p = pointSurChemin(c, d);
      points.push({ x: p.x, y: p.y, chemin, distance: d });
    }
  });
  return points;
}

const table: Readonly<Record<string, DefEnnemi>> = ENNEMIS;

/** Part de la menace du niveau qui emprunte chaque chemin (somme égale à 1). */
export function poidsDesChemins(niveau: Niveau): number[] {
  const menaces = niveau.carte.chemins.map(() => 0);
  for (const vague of niveau.vagues) {
    for (const p of vague.paquets) {
      const def = table[p.ennemi];
      if (def) menaces[p.chemin] = (menaces[p.chemin] ?? 0) + p.nombre * menaceEnnemi(def);
    }
  }
  const total = menaces.reduce((a, b) => a + b, 0);
  return menaces.map((m) => (total > 0 ? m / total : 1 / menaces.length));
}

/** Longueur de chemin (en tuiles) à moins de `portee` du point, chaque chemin pesé par `poids`. */
export function longueurVue(echantillons: readonly Echantillon[], poids: readonly number[], p: Point, portee: number): number {
  let total = 0;
  for (const e of echantillons) {
    if (distance(e, p) <= portee) total += (poids[e.chemin] ?? 0) * PAS_ECHANTILLON;
  }
  return total;
}

/** Partie neuve du niveau, pour lire ses chemins calculés. */
export function etatInitial(niveau: Niveau): EtatPartie {
  return creerPartie(niveau, { graine: 0, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES });
}
