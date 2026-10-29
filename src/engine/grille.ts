// Grille de construction : la carte est découpée en cases de `REGLES.tailleCase` tuiles de côté (2×2 : 16×9 cases sur une
// carte 32×18). Une tour se pose sur n'importe quelle case libre, centrée dedans. Le niveau fournit la liste des cases
// interdites (chemin, grands décors) ; le moteur ne lit pas l'habillage. Tout est pur, sans hasard ni horloge.
import { REGLES } from '../data/regles';
import { pointSurChemin, projeterSurChemin } from './chemins';
import type { Carte, CaseGrille, Niveau, Point } from './definitions';
import type { CheminCalcule, EtatPartie, Tour } from './etat';

/** Nombre de colonnes de la grille de la carte. */
export function colonnes(carte: Pick<Carte, 'largeur'>): number {
  return Math.floor(carte.largeur / REGLES.tailleCase);
}

/** Nombre de lignes de la grille de la carte. */
export function lignes(carte: Pick<Carte, 'hauteur'>): number {
  return Math.floor(carte.hauteur / REGLES.tailleCase);
}

/** Dit si la case est dans la grille de la carte (entiers, colonne et ligne existantes). */
export function caseExiste(carte: Carte, cx: number, cy: number): boolean {
  return Number.isInteger(cx) && Number.isInteger(cy) && cx >= 0 && cy >= 0 && cx < colonnes(carte) && cy < lignes(carte);
}

/** Centre d'une case, en tuiles : c'est la position d'une tour posée dessus. */
export function centreCase(cx: number, cy: number): Point {
  return { x: (cx + 0.5) * REGLES.tailleCase, y: (cy + 0.5) * REGLES.tailleCase };
}

/** La case qui contient le point (x, y) en tuiles, ou null s'il est hors de la grille. */
export function caseSousPoint(carte: Carte, x: number, y: number): CaseGrille | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) return null;
  const cx = Math.floor(x / REGLES.tailleCase);
  const cy = Math.floor(y / REGLES.tailleCase);
  return caseExiste(carte, cx, cy) ? { cx, cy } : null;
}

/** Cases interdites d'un niveau sous forme d'ensemble (clé `cy * colonnes + cx`), mémorisé par liste. */
const ENSEMBLES = new WeakMap<readonly CaseGrille[], ReadonlySet<number>>();

function ensembleInterdit(niveau: Pick<Niveau, 'carte' | 'casesInterdites'>): ReadonlySet<number> {
  let ensemble = ENSEMBLES.get(niveau.casesInterdites);
  if (!ensemble) {
    const n = colonnes(niveau.carte);
    ensemble = new Set(niveau.casesInterdites.map((c) => c.cy * n + c.cx));
    ENSEMBLES.set(niveau.casesInterdites, ensemble);
  }
  return ensemble;
}

/** Dit si la case est dans la grille et interdite par le niveau (chemin, grand décor). Hors grille : false. */
export function estCaseInterdite(niveau: Pick<Niveau, 'carte' | 'casesInterdites'>, cx: number, cy: number): boolean {
  return ensembleInterdit(niveau).has(cy * colonnes(niveau.carte) + cx);
}

/**
 * Vrai si l'axe d'un chemin de la carte traverse la case (jalon 5 : les chemins suivent la grille, donc une case est entièrement
 * du chemin ou pas du tout). Les segments sont horizontaux ou verticaux ; un segment en diagonale est testé par sa boîte englobante.
 */
export function estCaseDeChemin(carte: Pick<Carte, 'chemins'>, cx: number, cy: number): boolean {
  const t = REGLES.tailleCase;
  const x0 = cx * t;
  const y0 = cy * t;
  return carte.chemins.some((chemin) =>
    chemin.points.some((b, i) => {
      const a = chemin.points[i - 1];
      return a !== undefined && Math.max(a.x, b.x) > x0 && Math.min(a.x, b.x) < x0 + t && Math.max(a.y, b.y) > y0 && Math.min(a.y, b.y) < y0 + t;
    }),
  );
}

/** La tour posée sur la case, si elle existe. */
export function tourSurCase(etat: Pick<EtatPartie, 'tours'>, cx: number, cy: number): Tour | undefined {
  for (const t of etat.tours) if (t.cx === cx && t.cy === cy) return t;
  return undefined;
}

/** Toutes les cases de la grille, ligne par ligne (du nord au sud, de l'ouest à l'est). */
export function toutesLesCases(carte: Carte): CaseGrille[] {
  const toutes: CaseGrille[] = [];
  for (let cy = 0; cy < lignes(carte); cy++) for (let cx = 0; cx < colonnes(carte); cx++) toutes.push({ cx, cy });
  return toutes;
}

/**
 * Les cases où l'on peut poser une tour : ni interdites par le niveau ni déjà occupées. Même ordre que `toutesLesCases`.
 * Ne tient pas compte du prix, de la famille ni de la règle des casernes (voir `validerAction` pour un refus précis).
 */
export function casesLibres(etat: Pick<EtatPartie, 'niveau' | 'tours'>): CaseGrille[] {
  return toutesLesCases(etat.niveau.carte).filter((c) => !estCaseInterdite(etat.niveau, c.cx, c.cy) && !tourSurCase(etat, c.cx, c.cy));
}

/**
 * Point de ralliement par défaut d'une caserne posée sur la case : le point du chemin le plus proche du centre de la case,
 * s'il est à moins de `portee` tuiles. Null si aucun chemin n'est à portée : la caserne n'y est alors pas constructible.
 */
export function ralliementParDefaut(chemins: readonly CheminCalcule[], cx: number, cy: number, portee: number): Point | null {
  const centre = centreCase(cx, cy);
  const proche = projeterSurChemin(chemins, centre.x, centre.y);
  const chemin = proche ? chemins[proche.chemin] : undefined;
  if (!proche || !chemin || proche.ecart > portee) return null;
  return pointSurChemin(chemin, proche.distance);
}
