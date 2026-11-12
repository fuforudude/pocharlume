// Grille de construction : la carte est découpée en cases de `REGLES.tailleCase` tuiles de côté (2×2 : 16×9 cases sur une
// carte 32×18). Une tour se pose sur n'importe quelle case libre, centrée dedans. Le niveau fournit la liste des cases
// interdites (chemin, grands décors) ; le moteur ne lit pas l'habillage. Tout est pur, sans hasard ni horloge.
import { tuilesDeChemin } from '../data/niveaux/grille-niveau';
import { REGLES } from '../data/regles';
import type { LieuTour } from './actions';
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

/** Tuiles du chemin de chaque carte (mémorisées) : celles dont le centre est à `DEMI_LARGEUR_CHEMIN` de l'axe, comme le sol dessiné. */
const TUILES_CHEMIN = new WeakMap<Pick<Carte, 'chemins'>, Uint8Array>();

/**
 * Vrai si une tuile de la case est du chemin (la règle du sol dessiné et des cases interdites par le chemin : `tuilesDeChemin`). Sur une
 * carte dont les chemins suivent la grille (jalon 5), une case est entièrement du chemin ou pas du tout ; sur une carte dont l'axe passe
 * entre deux rangées, toute case que le chemin effleure en est une.
 */
export function estCaseDeChemin(carte: Pick<Carte, 'largeur' | 'hauteur' | 'chemins'>, cx: number, cy: number): boolean {
  let masque = TUILES_CHEMIN.get(carte);
  if (!masque) {
    masque = tuilesDeChemin(carte);
    TUILES_CHEMIN.set(carte, masque);
  }
  const t = REGLES.tailleCase;
  for (let dy = 0; dy < t; dy++) for (let dx = 0; dx < t; dx++) if (masque[(cy * t + dy) * carte.largeur + cx * t + dx] === 1) return true;
  return false;
}

/** La tour posée sur la case, si elle existe (une tour du radeau n'est sur aucune case). */
export function tourSurCase(etat: Pick<EtatPartie, 'tours'>, cx: number, cy: number): Tour | undefined {
  for (const t of etat.tours) if (t.place < 0 && t.cx === cx && t.cy === cy) return t;
  return undefined;
}

/** La tour posée sur la place `place` du radeau, si elle existe. */
export function tourSurPlace(etat: Pick<EtatPartie, 'tours'>, place: number): Tour | undefined {
  if (place < 0) return undefined;
  for (const t of etat.tours) if (t.place === place) return t;
  return undefined;
}

/** La tour du lieu d'une action : sur la place du radeau si elle en désigne une, sinon sur la case. */
export function tourDuLieu(etat: Pick<EtatPartie, 'tours'>, lieu: LieuTour): Tour | undefined {
  return lieu.place !== undefined ? tourSurPlace(etat, lieu.place) : tourSurCase(etat, lieu.cx, lieu.cy);
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
 * s'il est à moins de `portee` tuiles. Null si aucun chemin n'est à portée : la caserne n'y est alors pas constructible. `actifs` : les
 * chemins ouverts (`etat.dynamique.cheminsActifs`), pour préférer un chemin ouvert.
 */
export function ralliementParDefaut(chemins: readonly CheminCalcule[], cx: number, cy: number, portee: number, actifs?: readonly boolean[]): Point | null {
  const centre = centreCase(cx, cy);
  // Chemins mobiles : on préfère un chemin ouvert (une caserne ne se rallie pas à un chemin fermé où personne ne passe), et à défaut
  // un chemin fermé à portée (il peut s'ouvrir plus tard).
  if (actifs?.includes(false)) {
    const ouverts = chemins.map((c, i) => ({ c, i })).filter((x) => actifs[x.i] !== false);
    const proche = projeterSurChemin(ouverts.map((x) => x.c), centre.x, centre.y);
    const chemin = proche ? ouverts[proche.chemin]?.c : undefined;
    if (proche && chemin && proche.ecart <= portee) return pointSurChemin(chemin, proche.distance);
  }
  const proche = projeterSurChemin(chemins, centre.x, centre.y);
  const chemin = proche ? chemins[proche.chemin] : undefined;
  if (!proche || !chemin || proche.ecart > portee) return null;
  return pointSurChemin(chemin, proche.distance);
}
