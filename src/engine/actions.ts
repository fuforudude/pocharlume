// Actions du joueur : données simples, horodatées en pas dans le journal.
import type { IdFamille, Voie } from './definitions';

/**
 * Où se trouve la tour d'une action : la case (`cx`, `cy`) de la grille de construction, ou, sur un niveau à Radeau, la place `place`
 * du radeau (0 à 2) au lieu de la case. Jamais les deux à la fois (l'action serait refusée comme mal formée).
 */
export type LieuTour = { cx: number; cy: number; place?: undefined } | { place: number; cx?: undefined; cy?: undefined };

export type Action =
  /** Pose une tour sur la case (centrée dedans) ou sur la place du radeau. */
  | ({ type: 'construire'; tour: IdFamille | 'divine' } & LieuTour)
  /** Les actions suivantes visent la tour posée sur la case ou sur la place du radeau. */
  | ({ type: 'ameliorer' } & LieuTour)
  | ({ type: 'specialiser'; voie: Voie } & LieuTour)
  /** Achète le rang suivant d'une compétence de la spécialisation d'une tour (`competence` : son id). */
  | ({ type: 'ameliorerCompetence'; competence: string } & LieuTour)
  | ({ type: 'vendre' } & LieuTour)
  | ({ type: 'deplacerRalliement'; x: number; y: number } & LieuTour)
  | { type: 'deplacerHeros'; x: number; y: number }
  | { type: 'lancerSort'; emplacement: number; x: number; y: number }
  /** Utilise l'objet de l'emplacement (0 à 2) en un point ; un emplacement ne sert qu'une fois par partie. */
  | { type: 'utiliserObjet'; emplacement: number; x: number; y: number }
  | { type: 'appelerVague' }
  /** Active la foule `foule` (indice dans `Niveau.foules`) dont la condition est de payer : son coût en arêtes est pris. */
  | { type: 'activerFoule'; foule: number };

export type RaisonRefus =
  | 'partie_terminee'
  | 'action_invalide'
  /** La case visée n'existe pas dans la grille de la carte. */
  | 'case_hors_carte'
  /** Chemin ou grand décor : on ne construit pas sur cette case. */
  | 'case_interdite'
  /** Une tour se dresse déjà sur cette case (ou sur cette place du radeau). */
  | 'case_occupee'
  /** Aucune tour sur la case visée (amélioration, vente, ralliement…), ou sur la place du radeau visée. */
  | 'case_vide'
  /** Le niveau n'a pas de radeau, ou pas de place de ce numéro. */
  | 'place_inconnue'
  /** Une tour qui pose quelque chose au sol (soldats, assassins, tourelles, pièges) ne se pose pas sur le radeau, ni n'y devient une. */
  | 'radeau_sol_requis'
  /** Une caserne (ou une tour divine à soldats) ne se pose que là où un chemin est à portée de son ralliement. */
  | 'caserne_sans_chemin'
  | 'tour_inconnue'
  | 'aretes_insuffisantes'
  | 'niveau_max'
  | 'specialisation_requise'
  | 'specialisation_impossible'
  | 'une_seule_divine'
  | 'pas_une_caserne'
  | 'hors_portee'
  | 'hors_carte'
  | 'hors_chemin'
  | 'heros_mort'
  | 'sort_inconnu'
  | 'sort_en_recharge'
  | 'competence_inconnue'
  | 'competence_au_maximum'
  | 'objet_inconnu'
  | 'objet_utilise'
  | 'vies_pleines'
  | 'vague_en_cours'
  | 'plus_de_vague'
  /** Défi Fer : cette famille de tours n'est pas constructible sur ce niveau. */
  | 'famille_interdite'
  /** Déblocage progressif : le niveau joué n'a pas encore ouvert ce palier de tour (src/data/deblocage.ts). */
  | 'non_debloque'
  /** Le niveau n'a pas de foule de ce numéro. */
  | 'foule_inconnue'
  /** Cette foule ne s'active pas en payant (il faut y poster le héros). */
  | 'foule_sans_paiement'
  /** La foule se remet de sa dernière activation. */
  | 'foule_en_recharge'
  /** La foule a servi autant de fois qu'elle le pouvait. */
  | 'foule_epuisee'
  /** Le point visé est dans une portion de chemin coupée (nasse, foule qui bloque) : on n'y envoie ni soldats ni héros. */
  | 'zone_bloquee';

export type ResultatAction = { ok: true } | { ok: false; raison: RaisonRefus };
