// Outil de tests (jamais importé par le jeu) : un joueur automatique « raisonnable » qui joue un niveau en
// entier. Il construit une tour par case libre parmi les plus proches du chemin (familles en alternance), puis améliore toutes les tours au
// niveau 2, au niveau 3, puis les spécialise, en dépensant ses arêtes dès qu'il le peut. Il ne lance pas les
// vagues en avance et n'utilise ni les sorts ni le héros. Les vrais bots du simulateur d'équilibrage sont dans src/equilibrage/.
import type { Action } from '../../engine/actions';
import type { CaseGrille, IdFamille, Niveau, Point, Voie } from '../../engine/definitions';
import { casesLibres, centreCase } from '../../engine/grille';
import type { ConfigPartie, EtatPartie } from '../../engine/etat';
import { creerPartie, step, validerAction, appliquerAction } from '../../engine/partie';
import { PAS_PAR_SECONDE } from '../../engine/temps';
import { VERSION_DONNEES } from '../version';

export const CONFIG_MATOU: ConfigPartie = { graine: 7, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

/** Familles posées sur les cases dans l'ordre, en boucle. */
const FAMILLES_PLAN: readonly IdFamille[] = ['tir', 'caserne', 'magie', 'artillerie'];
/** Spécialisation choisie pour chaque famille. */
const VOIES: Readonly<Record<IdFamille, Voie>> = { tir: 'B', caserne: 'A', magie: 'A', artillerie: 'A' };

/** Nombre de cases du plan : une défense de la taille de celles des anciens niveaux à socles (de 6 à 12), choisies parmi les plus proches du chemin. */
const NOMBRE_DE_CASES = 10;

/** Distance du centre de la case au point le plus proche d'un chemin du niveau (les chemins sont échantillonnés tous les 0,25 tuile). */
function distanceAuChemin(niveau: Niveau, centre: Point): number {
  let min = Infinity;
  for (const chemin of niveau.carte.chemins) {
    for (let i = 1; i < chemin.points.length; i++) {
      const a = chemin.points[i - 1];
      const b = chemin.points[i];
      if (!a || !b) continue;
      const longueur = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
      const pas = Math.max(1, Math.ceil(longueur * 4));
      for (let k = 0; k <= pas; k++) {
        const x = a.x + ((b.x - a.x) * k) / pas;
        const y = a.y + ((b.y - a.y) * k) / pas;
        min = Math.min(min, (x - centre.x) * (x - centre.x) + (y - centre.y) * (y - centre.y));
      }
    }
  }
  return Math.sqrt(min);
}

/** Les cases du plan : les plus proches du chemin parmi les cases libres, ni sur le bord de la carte ni loin du chemin (égalité : ordre de la grille). */
export function casesDuPlan(niveau: Niveau): CaseGrille[] {
  const libres = casesLibres({ niveau, tours: [] });
  return libres
    .map((c) => ({ c, d: distanceAuChemin(niveau, centreCase(c.cx, c.cy)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, NOMBRE_DE_CASES)
    .map((m) => m.c);
}

/** La liste d'achats du plan, dans l'ordre. */
export function planDeConstruction(niveau: Niveau): Action[] {
  const cases = casesDuPlan(niveau);
  const familleDe = (i: number): IdFamille => FAMILLES_PLAN[i % FAMILLES_PLAN.length] ?? 'tir';
  return [
    ...cases.map(({ cx, cy }, i): Action => ({ type: 'construire', cx, cy, tour: familleDe(i) })),
    ...cases.map(({ cx, cy }): Action => ({ type: 'ameliorer', cx, cy })),
    ...cases.map(({ cx, cy }): Action => ({ type: 'ameliorer', cx, cy })),
    ...cases.map(({ cx, cy }, i): Action => ({ type: 'specialiser', cx, cy, voie: VOIES[familleDe(i)] })),
  ];
}

export interface BilanPartie {
  statut: EtatPartie['statut'];
  vies: number;
  etoiles: number;
  /** Durée de la partie en secondes de jeu. */
  secondes: number;
  etat: EtatPartie;
}

/**
 * Joue le niveau jusqu'à sa fin. Avec `plan` à null, ne fait rien (pas de tour). Une partie qui ne finit pas
 * avant `secondesMax` est rendue en cours.
 */
export function jouer(niveau: Niveau, plan: readonly Action[] | null, config: ConfigPartie = CONFIG_MATOU, secondesMax = 3600): BilanPartie {
  const etat = creerPartie(niveau, config);
  let suivant = 0;
  const limite = secondesMax * PAS_PAR_SECONDE;
  while (etat.statut === 'en_cours' && etat.pas < limite) {
    // Toutes les demi-secondes, tente le prochain achat du plan ; un achat impossible pour une autre raison que
    // le manque d'arêtes est abandonné.
    if (plan && etat.pas % (PAS_PAR_SECONDE / 2) === 0) {
      for (let action = plan[suivant]; action; action = plan[suivant]) {
        const raison = validerAction(etat, action);
        if (raison === 'aretes_insuffisantes') break;
        if (raison === null) appliquerAction(etat, action);
        suivant++;
      }
    }
    step(etat);
  }
  return { statut: etat.statut, vies: etat.vies, etoiles: etat.etoiles, secondes: etat.pas / PAS_PAR_SECONDE, etat };
}
