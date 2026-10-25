// Actions du joueur : données simples, horodatées en pas dans le journal.
import type { IdFamille, Voie } from './definitions';

export type Action =
  | { type: 'construire'; socle: number; tour: IdFamille | 'divine' }
  | { type: 'ameliorer'; socle: number }
  | { type: 'specialiser'; socle: number; voie: Voie }
  /** Achète le rang suivant d'une compétence de la spécialisation d'une tour (`competence` : son id). */
  | { type: 'ameliorerCompetence'; socle: number; competence: string }
  | { type: 'vendre'; socle: number }
  | { type: 'deplacerRalliement'; socle: number; x: number; y: number }
  | { type: 'deplacerHeros'; x: number; y: number }
  | { type: 'lancerSort'; emplacement: number; x: number; y: number }
  /** Utilise l'objet de l'emplacement (0 à 2) en un point ; un emplacement ne sert qu'une fois par partie. */
  | { type: 'utiliserObjet'; emplacement: number; x: number; y: number }
  | { type: 'appelerVague' };

export type RaisonRefus =
  | 'partie_terminee'
  | 'action_invalide'
  | 'socle_inconnu'
  | 'socle_occupe'
  | 'socle_vide'
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
  | 'vague_en_cours'
  | 'plus_de_vague';

export type ResultatAction = { ok: true } | { ok: false; raison: RaisonRefus };
