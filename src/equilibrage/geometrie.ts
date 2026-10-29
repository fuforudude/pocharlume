// Géométrie des cartes pour les bots : points d'échantillonnage le long des chemins, longueur de chemin vue
// depuis une case de la grille, poids de chaque chemin dans les vagues du niveau.
import { creerPartie, genererVagueInfinie, pointSurChemin } from '../engine';
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
      if (def) menaces[p.chemin] = (menaces[p.chemin] ?? 0) + p.nombre * menaceEnnemi(def) * (p.facteurPv ?? 1);
    }
  }
  const total = menaces.reduce((a, b) => a + b, 0);
  return menaces.map((m) => (total > 0 ? m / total : 1 / menaces.length));
}

/**
 * Parts (0 à 1) de la menace du niveau portées par des volants et par des furtifs : ce que le bot soigneux doit savoir pour
 * ne pas acheter de tours qui ne touchent pas les volants, et pour penser aux Guetteurs des Toits contre les furtifs.
 */
export function partsSpeciales(niveau: Niveau): { volants: number; furtifs: number } {
  let total = 0;
  let volants = 0;
  let furtifs = 0;
  for (const vague of niveau.vagues) {
    for (const p of vague.paquets) {
      const def = table[p.ennemi];
      if (!def) continue;
      const menace = p.nombre * menaceEnnemi(def) * (p.facteurPv ?? 1);
      total += menace;
      if (def.volant) volants += menace;
      if (def.furtif) furtifs += menace;
    }
  }
  return total > 0 ? { volants: volants / total, furtifs: furtifs / total } : { volants: 0, furtifs: 0 };
}

/** Numéro (1 à N) de la première vague du niveau qui compte un furtif, 0 s'il n'y en a aucun. */
export function premiereVagueFurtifs(niveau: Niveau): number {
  const i = niveau.vagues.findIndex((v) => v.paquets.some((p) => table[p.ennemi]?.furtif === true));
  return i + 1;
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

/** Nombre de vagues de l'infini que le bot soigneux « lit à l'avance » pour peser les chemins et repérer volants et furtifs. */
export const VAGUES_LUES_INFINI = 30;

/**
 * Le niveau tel que le bot soigneux le lit : celui de la partie, ou, en infini (où le moteur génère ses vagues et le niveau n'en porte
 * aucune), un niveau portant les `VAGUES_LUES_INFINI` premières vagues générées avec la graine de la partie. Comme en campagne, le
 * soigneux voit donc l'avenir : il est un peu optimiste.
 */
export function niveauLu(etat: EtatPartie): Niveau {
  if (!etat.config.infini) return etat.niveau;
  const vagues = Array.from({ length: VAGUES_LUES_INFINI }, (_, i) => genererVagueInfinie(etat.config, etat.chemins.length, i + 1));
  return { ...etat.niveau, vagues };
}
