// Outil de tests (jamais importé par le jeu) : un joueur automatique « raisonnable » qui joue un niveau en
// entier. Il construit une tour par socle (familles en alternance), puis améliore toutes les tours au
// niveau 2, au niveau 3, puis les spécialise, en dépensant ses arêtes dès qu'il le peut. Il ne lance pas les
// vagues en avance et n'utilise ni les sorts ni le héros. Le futur simulateur (tâche 9) aura de vrais bots.
import type { Action } from '../../engine/actions';
import type { IdFamille, Niveau, Voie } from '../../engine/definitions';
import type { ConfigPartie, EtatPartie } from '../../engine/etat';
import { creerPartie, step, validerAction, appliquerAction } from '../../engine/partie';
import { PAS_PAR_SECONDE } from '../../engine/temps';
import { VERSION_DONNEES } from '../version';

export const CONFIG_MATOU: ConfigPartie = { graine: 7, difficulte: 'matou', dieu: 'charlie', niveauHeros: 1, versionDonnees: VERSION_DONNEES };

/** Familles posées sur les socles dans l'ordre, en boucle. */
const FAMILLES_PLAN: readonly IdFamille[] = ['tir', 'caserne', 'magie', 'artillerie'];
/** Spécialisation choisie pour chaque famille. */
const VOIES: Readonly<Record<IdFamille, Voie>> = { tir: 'B', caserne: 'A', magie: 'A', artillerie: 'A' };

/** La liste d'achats du plan, dans l'ordre. */
export function planDeConstruction(niveau: Niveau): Action[] {
  const socles = niveau.carte.socles.map((_, i) => i);
  const familleDe = (socle: number): IdFamille => FAMILLES_PLAN[socle % FAMILLES_PLAN.length] ?? 'tir';
  return [
    ...socles.map((socle): Action => ({ type: 'construire', socle, tour: familleDe(socle) })),
    ...socles.map((socle): Action => ({ type: 'ameliorer', socle })),
    ...socles.map((socle): Action => ({ type: 'ameliorer', socle })),
    ...socles.map((socle): Action => ({ type: 'specialiser', socle, voie: VOIES[familleDe(socle)] })),
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
