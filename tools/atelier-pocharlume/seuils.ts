// Seuils de jouabilité d'un niveau : les mêmes que ceux des tests de niveaux (src/data/niveaux/niveaux.test.ts, blocs
// « grille de construction des 100 niveaux » et « cases jouables des casernes et des familles du défi Fer »). Une
// retouche de carte qui fait passer un niveau sous un seuil est refusée. Si ces tests changent, changer ces constantes.
import { REGLES } from '../../src/data/regles';
import { FAMILLES, TOURS } from '../../src/data/tours';
import type { Decor } from '../../src/data/visuel';
import { decorVisible } from '../../src/data/niveaux/assemblage';
import { zonesBloquantes } from '../../src/data/niveaux/habillage';
import type { CarteModele } from '../../src/data/niveaux/cartes-toutes';
import { distancePointChemin } from '../../src/data/niveaux/geometrie';
import { casesInterditesDuNiveau } from '../../src/data/niveaux/grille-niveau';
import type { PlanNiveau } from '../../src/data/niveaux/plan-niveau';
import { calculerChemin } from '../../src/engine/chemins';
import type { Carte, Niveau } from '../../src/engine/definitions';
import { casesLibres, centreCase, ralliementParDefaut } from '../../src/engine/grille';

export const LIBRES_MIN = 40;
export const UTILES_MIN = 8;
export const VALIDES_CASERNE_MIN = 12;
export const JOUABLES_MIN = 4;
/** Portée de ralliement d'une caserne (tuiles) : une case de caserne valide a un chemin à cette distance au plus. */
const PORTEE_RALLIEMENT = 3.5;
/** Portée de la plus courte des tours de tir, de magie ou d'artillerie au niveau 1. */
const PORTEE_TIR_MIN = Math.min(...FAMILLES.filter((f) => f !== 'caserne').map((f) => TOURS[f].niveaux[0].portee));

export interface Mesure {
  readonly nom: string;
  readonly valeur: number;
  readonly minimum: number;
}

/** Cases constructibles d'un niveau (nombre de cases libres) pour des décors donnés. */
export function niveauAvecDecors(modele: CarteModele, plan: Pick<PlanNiveau, 'chemins'>, decors: readonly Decor[]): Niveau {
  const chemins = plan.chemins.flatMap((i) => { const c = modele.chemins[i]; return c ? [c] : []; });
  const carte: Carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins, departHeros: modele.departHeros };
  const visibles = decorVisible({ ...modele, decor: decors }, carte);
  return { id: 'atelier', aretesDepart: 0, carte, casesInterdites: casesInterditesDuNiveau(carte, visibles, zonesBloquantes(modele)), vagues: [] };
}

const distanceAuNiveau = (niveau: Niveau, x: number, y: number): number =>
  Math.min(...niveau.carte.chemins.map((c) => distancePointChemin(x, y, c.points)));

/** Les mesures de jouabilité d'un niveau, avec leur minimum. */
export function mesures(niveau: Niveau, plan: Pick<PlanNiveau, 'defiFer'>): Mesure[] {
  const libres = casesLibres({ niveau, tours: [] });
  const dist = (c: { cx: number; cy: number }): number => { const p = centreCase(c.cx, c.cy); return distanceAuNiveau(niveau, p.x, p.y); };
  const chemins = niveau.carte.chemins.map(calculerChemin);
  const jouables = (famille: string): number => {
    if (famille === 'caserne') return libres.filter((c) => ralliementParDefaut(chemins, c.cx, c.cy, TOURS.caserne.niveaux[0].portee) !== null).length;
    return libres.filter((c) => dist(c) <= TOURS[famille as keyof typeof TOURS].niveaux[0].portee).length;
  };
  const sortie: Mesure[] = [
    { nom: 'cases libres', valeur: libres.length, minimum: LIBRES_MIN },
    { nom: 'cases à portée de tir du chemin', valeur: libres.filter((c) => dist(c) <= PORTEE_TIR_MIN).length, minimum: UTILES_MIN },
    { nom: 'cases de caserne à portée de ralliement', valeur: libres.filter((c) => dist(c) <= PORTEE_RALLIEMENT).length, minimum: VALIDES_CASERNE_MIN },
    { nom: 'cases où la caserne se pose', valeur: jouables('caserne'), minimum: JOUABLES_MIN },
  ];
  for (const famille of plan.defiFer.familles) sortie.push({ nom: `cases jouables pour ${famille} (défi Fer)`, valeur: jouables(famille), minimum: JOUABLES_MIN });
  return sortie;
}

/** Nombre de cases où l'on peut construire sur la grille (hors niveau : taille de la carte moins les cases interdites). */
export function totalCases(modele: CarteModele): number {
  return Math.floor(modele.largeur / REGLES.tailleCase) * Math.floor(modele.hauteur / REGLES.tailleCase);
}
