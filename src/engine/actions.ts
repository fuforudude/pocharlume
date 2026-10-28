// Actions du joueur : données simples, horodatées en pas dans le journal.
import type { IdFamille, Voie } from './definitions';

export type Action =
  /** Pose une tour sur la case (`cx`, `cy`) de la grille de construction, centrée dans la case. */
  | { type: 'construire'; cx: number; cy: number; tour: IdFamille | 'divine' }
  /** Les actions suivantes visent la tour posée sur la case (`cx`, `cy`). */
  | { type: 'ameliorer'; cx: number; cy: number }
  | { type: 'specialiser'; cx: number; cy: number; voie: Voie }
  /** Achète le rang suivant d'une compétence de la spécialisation d'une tour (`competence` : son id). */
  | { type: 'ameliorerCompetence'; cx: number; cy: number; competence: string }
  | { type: 'vendre'; cx: number; cy: number }
  | { type: 'deplacerRalliement'; cx: number; cy: number; x: number; y: number }
  | { type: 'deplacerHeros'; x: number; y: number }
  | { type: 'lancerSort'; emplacement: number; x: number; y: number }
  /** Utilise l'objet de l'emplacement (0 à 2) en un point ; un emplacement ne sert qu'une fois par partie. */
  | { type: 'utiliserObjet'; emplacement: number; x: number; y: number }
  | { type: 'appelerVague' };

export type RaisonRefus =
  | 'partie_terminee'
  | 'action_invalide'
  /** La case visée n'existe pas dans la grille de la carte. */
  | 'case_hors_carte'
  /** Chemin ou grand décor : on ne construit pas sur cette case. */
  | 'case_interdite'
  /** Une tour se dresse déjà sur cette case. */
  | 'case_occupee'
  /** Aucune tour sur la case visée (amélioration, vente, ralliement…). */
  | 'case_vide'
  /** Une caserne (ou une tour divine à soldats) ne se pose que là où un chemin est à portée de son ralliement. */
  | 'caserne_sans_chemin'
  | 'tour_inconnue'
  | 'aretes_insuffisantes'
  | 'niveau_max'
  | 'specialisation_requise'
  | 'specialisation_impossible'
  | 'tour_divine_unique'
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
  | 'famille_interdite';

export type ResultatAction = { ok: true } | { ok: false; raison: RaisonRefus };
