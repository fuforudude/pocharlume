// Le Radeau : une plateforme à 3 places va et vient sans arrêt sur un trajet tracé sur l'eau. Sa position est une fonction pure du
// numéro de pas (`positionRadeau`) : rien n'est stocké pour lui, le rejeu et la reprise d'une sauvegarde restent justes d'eux-mêmes.
// Une tour du radeau garde seulement sa place (`Tour.place`) ; sa position (x, y) est recalculée au début de chaque pas
// (`deplacerToursDuRadeau`), si bien que tout ce qui lit la position d'une tour (ciblage, portée, projectiles, ouvrages, pouvoirs des
// ennemis, sorts) la voit là où le radeau se trouve. Le rendu appelle ces mêmes fonctions à un pas fractionnaire pour interpoler entre
// deux pas (`pasAffiche`, src/render/gimmicks.ts).
import { REGLES } from '../../data/regles';
import type { CaseGrille, GimmickRadeau, Niveau, Point } from '../definitions';
import type { EtatPartie } from '../etat';
import { caseExiste, centreCase, estCaseInterdite } from '../grille';
import { PAS_PAR_SECONDE } from '../temps';

/** Le gimmick Radeau du niveau, s'il en a un. */
export function gimmickRadeau(niveau: Niveau): GimmickRadeau | undefined {
  return niveau.gimmick?.type === 'radeau' ? niveau.gimmick : undefined;
}

/** Deux cases successives du trajet : distinctes, et voisines (diagonale comprise) ou alignées sur une ligne ou une colonne. */
function suiteValide(a: { cx: number; cy: number }, b: { cx: number; cy: number }): boolean {
  const dx = Math.abs(a.cx - b.cx);
  const dy = Math.abs(a.cy - b.cy);
  return (dx === 0) !== (dy === 0) || (dx === 1 && dy === 1);
}

/**
 * Toutes les cases que le radeau parcourt : celles du trajet et, entre deux cases alignées, les cases intermédiaires. Sans doublon,
 * dans l'ordre du trajet. L'assemblage les ajoute aux cases interdites du niveau : on ne bâtit pas sur l'eau où passe le radeau.
 */
export function casesDuTrajet(gimmick: GimmickRadeau): CaseGrille[] {
  const vues = new Set<string>();
  const cases: CaseGrille[] = [];
  const ajouter = (cx: number, cy: number): void => {
    const cle = `${String(cx)},${String(cy)}`;
    if (vues.has(cle)) return;
    vues.add(cle);
    cases.push({ cx, cy });
  };
  gimmick.trajet.forEach((c, k) => {
    const avant = gimmick.trajet[k - 1];
    if (avant) {
      const pas = Math.max(Math.abs(c.cx - avant.cx), Math.abs(c.cy - avant.cy));
      for (let i = 1; i < pas; i++) ajouter(avant.cx + Math.sign(c.cx - avant.cx) * i, avant.cy + Math.sign(c.cy - avant.cy) * i);
    }
    ajouter(c.cx, c.cy);
  });
  return cases;
}

/**
 * Vérifie le radeau : trajet d'au moins 2 cases de la grille qui se suivent et toutes interdites à la construction (intermédiaires
 * comprises), vitesse positive, nombre de places des règles, places à des décalages distincts.
 */
export function verifierRadeau(niveau: Niveau, gimmick: GimmickRadeau): void {
  if (gimmick.trajet.length < 2) throw new Error('Radeau : le trajet doit compter au moins 2 cases');
  gimmick.trajet.forEach((c, k) => {
    if (!caseExiste(niveau.carte, c.cx, c.cy)) throw new Error(`Radeau : case ${String(k)} du trajet hors de la grille (${String(c.cx)}, ${String(c.cy)})`);
    const avant = gimmick.trajet[k - 1];
    if (avant && !suiteValide(avant, c)) throw new Error(`Radeau : la case ${String(k)} du trajet n'est ni voisine ni en ligne droite de la précédente`);
  });
  if (!Number.isFinite(gimmick.vitesse) || gimmick.vitesse <= 0) throw new Error(`Radeau : vitesse invalide ${String(gimmick.vitesse)}`);
  if (gimmick.places.length !== REGLES.placesRadeau) throw new Error(`Radeau : ${String(REGLES.placesRadeau)} places attendues, ${String(gimmick.places.length)} données`);
  for (const p of gimmick.places) if (!Number.isFinite(p.dx) || !Number.isFinite(p.dy)) throw new Error('Radeau : décalage de place invalide');
  const decalages = new Set(gimmick.places.map((p) => `${String(p.dx)},${String(p.dy)}`));
  if (decalages.size !== gimmick.places.length) throw new Error('Radeau : deux places au même décalage');
  for (const c of casesDuTrajet(gimmick)) {
    if (!estCaseInterdite(niveau, c.cx, c.cy)) throw new Error(`Radeau : la case (${String(c.cx)}, ${String(c.cy)}) du trajet n'est pas interdite à la construction`);
  }
}

/** Dit si la place `n` existe sur le radeau du niveau (aucune sans radeau). */
export function placeExiste(niveau: Niveau, n: number): boolean {
  const gimmick = gimmickRadeau(niveau);
  return gimmick !== undefined && Number.isInteger(n) && n >= 0 && n < gimmick.places.length;
}

/**
 * Centre du radeau au pas `pas`, en tuiles. La distance parcourue (`vitesse` cases par seconde) est repliée en aller-retour sur la
 * longueur du trajet, puis placée sur la ligne brisée des centres de ses cases.
 */
export function positionRadeau(gimmick: GimmickRadeau, pas: number): Point {
  const points = gimmick.trajet.map((c) => centreCase(c.cx, c.cy));
  const longueurs = points.slice(1).map((p, i) => {
    const a = points[i] ?? p;
    return Math.sqrt((p.x - a.x) * (p.x - a.x) + (p.y - a.y) * (p.y - a.y));
  });
  const total = longueurs.reduce((somme, l) => somme + l, 0);
  const depart = points[0] ?? { x: 0, y: 0 };
  if (total <= 0) return depart;
  const parcourue = (gimmick.vitesse * REGLES.tailleCase * pas) / PAS_PAR_SECONDE;
  const tour = parcourue % (2 * total);
  let reste = tour <= total ? tour : 2 * total - tour;
  for (let i = 0; i < longueurs.length; i++) {
    const l = longueurs[i] ?? 0;
    const a = points[i] ?? depart;
    const b = points[i + 1] ?? a;
    if (reste <= l) return l > 0 ? { x: a.x + ((b.x - a.x) * reste) / l, y: a.y + ((b.y - a.y) * reste) / l } : a;
    reste -= l;
  }
  return points[points.length - 1] ?? depart;
}

/** Position de la place `n` du radeau au pas `pas` : le centre du radeau plus le décalage de la place. */
export function positionPlace(gimmick: GimmickRadeau, pas: number, n: number): Point {
  const centre = positionRadeau(gimmick, pas);
  const place = gimmick.places[n] ?? { dx: 0, dy: 0 };
  return { x: centre.x + place.dx, y: centre.y + place.dy };
}

/** Le pas du Radeau : chaque tour d'une place prend la position de sa place au pas courant. */
export function deplacerToursDuRadeau(etat: EtatPartie, gimmick: GimmickRadeau): void {
  for (const t of etat.tours) {
    if (t.place < 0) continue;
    const p = positionPlace(gimmick, etat.pas, t.place);
    t.x = p.x;
    t.y = p.y;
  }
}
