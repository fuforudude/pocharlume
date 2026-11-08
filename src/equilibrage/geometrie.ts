// Géométrie des cartes pour les bots : points d'échantillonnage le long des chemins (et des couloirs du Vol de Corbeaux), longueur
// de chemin vue depuis une case de la grille, poids de chaque chemin dans les vagues du niveau.
//
// Un « trajet » est un chemin ou un couloir : les chemins gardent leurs indices (0 à N − 1), le couloir k prend l'indice N + k. Un
// ennemi apparu dans un couloir n'est donc jamais compté sur le chemin 0. Sans couloir, rien ne change.
import { creerPartie, genererVagueInfinie, pointSurChemin } from '../engine';
import type { DefEnnemi, EtatPartie, Niveau, Paquet, Point } from '../engine';
import { ENNEMIS } from '../data/ennemis';
import { menaceEnnemi } from '../data/equilibrage';
import { VERSION_DONNEES } from '../data/version';

/** Écart entre deux points d'échantillonnage, en tuiles. */
export const PAS_ECHANTILLON = 0.5;

export interface Echantillon extends Point {
  /** Indice du trajet : le chemin (0 à N − 1), ou N + k pour le couloir k du Vol de Corbeaux. */
  readonly chemin: number;
  /** Distance parcourue depuis l'entrée. */
  readonly distance: number;
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

/** Points régulièrement espacés sur chaque chemin de la partie, puis sur chaque couloir (indices N + k). */
export function echantillonner(etat: EtatPartie): Echantillon[] {
  const points: Echantillon[] = [];
  [...etat.chemins, ...etat.couloirs].forEach((c, chemin) => {
    for (let d = 0; d <= c.longueur; d += PAS_ECHANTILLON) {
      const p = pointSurChemin(c, d);
      points.push({ x: p.x, y: p.y, chemin, distance: d });
    }
  });
  return points;
}

/** Nombre de couloirs du Vol de Corbeaux du niveau (0 sans ce gimmick). */
export function nombreCouloirs(niveau: Niveau): number {
  return niveau.gimmick?.type === 'corbeaux' ? niveau.gimmick.couloirs.length : 0;
}

/** Indice du trajet d'un groupe de la vague : son couloir (N + k) s'il en a un, sinon son chemin. */
export function trajetDuPaquet(niveau: Niveau, p: Paquet): number {
  return p.couloir !== undefined ? niveau.carte.chemins.length + p.couloir : p.chemin;
}

const table: Readonly<Record<string, DefEnnemi>> = ENNEMIS;

/** Menace d'un groupe de la vague (0 pour un ennemi inconnu). */
export function menacePaquet(p: Paquet): number {
  const def = table[p.ennemi];
  return def ? p.nombre * menaceEnnemi(def) * (p.facteurPv ?? 1) : 0;
}

/** Part de la menace du niveau qui emprunte chaque trajet, chemins puis couloirs (somme égale à 1). */
export function poidsDesChemins(niveau: Niveau): number[] {
  const menaces = Array.from({ length: niveau.carte.chemins.length + nombreCouloirs(niveau) }, () => 0);
  for (const vague of niveau.vagues) {
    for (const p of vague.paquets) {
      const def = table[p.ennemi];
      const t = trajetDuPaquet(niveau, p);
      if (def) menaces[t] = (menaces[t] ?? 0) + p.nombre * menaceEnnemi(def) * (p.facteurPv ?? 1);
    }
  }
  const total = menaces.reduce((a, b) => a + b, 0);
  return menaces.map((m) => (total > 0 ? m / total : 1 / menaces.length));
}

/**
 * Parts (0 à 1) de la menace des chemins portées par des volants et par des furtifs : ce que le bot soigneux doit savoir pour
 * ne pas acheter de tours qui ne touchent pas les volants, et pour penser aux Guetteurs des Toits contre les furtifs. Les groupes
 * des couloirs n'y comptent pas : le bot les traite à part (seules les tours qui visent les volants les touchent).
 */
export function partsSpeciales(niveau: Niveau): { volants: number; furtifs: number } {
  let total = 0;
  let volants = 0;
  let furtifs = 0;
  for (const vague of niveau.vagues) {
    for (const p of vague.paquets) {
      const def = table[p.ennemi];
      if (!def || p.couloir !== undefined) continue;
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

/**
 * Longueur de chemin (en tuiles) à moins de `portee` du point, chaque trajet pesé par `poids`. Avec `nombreChemins`, les couloirs du Vol de
 * Corbeaux (trajets d'indice au moins égal) ne comptent pas : ce que voit une tour qui ne vise pas les volants.
 */
export function longueurVue(echantillons: readonly Echantillon[], poids: readonly number[], p: Point, portee: number, nombreChemins = Infinity): number {
  let total = 0;
  for (const e of echantillons) {
    if (e.chemin < nombreChemins && distance(e, p) <= portee) total += (poids[e.chemin] ?? 0) * PAS_ECHANTILLON;
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
