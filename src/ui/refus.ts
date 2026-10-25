// Pourquoi le moteur a refusé un geste, en phrase pour le joueur. Le type `Record<RaisonRefus, …>` oblige à
// traduire chaque raison : en ajouter une au moteur sans texte ne compile plus.
import type { RaisonRefus } from '../engine';
import { t, type CleTexte } from '../i18n';

export const CLES_REFUS: Readonly<Record<RaisonRefus, CleTexte>> = {
  partie_terminee: 'refus.partie_terminee',
  action_invalide: 'refus.action_invalide',
  socle_inconnu: 'refus.socle_inconnu',
  socle_occupe: 'refus.socle_occupe',
  socle_vide: 'refus.socle_vide',
  tour_inconnue: 'refus.tour_inconnue',
  aretes_insuffisantes: 'refus.aretes_insuffisantes',
  niveau_max: 'refus.niveau_max',
  specialisation_requise: 'refus.specialisation_requise',
  specialisation_impossible: 'refus.specialisation_impossible',
  tour_divine_unique: 'refus.tour_divine_unique',
  pas_une_caserne: 'refus.pas_une_caserne',
  hors_portee: 'refus.hors_portee',
  hors_carte: 'refus.hors_carte',
  hors_chemin: 'refus.hors_chemin',
  heros_mort: 'refus.heros_mort',
  sort_inconnu: 'refus.sort_inconnu',
  sort_en_recharge: 'refus.sort_en_recharge',
  vague_en_cours: 'refus.vague_en_cours',
  competence_inconnue: 'refus.competence_inconnue',
  competence_au_maximum: 'refus.competence_au_maximum',
  objet_inconnu: 'refus.objet_inconnu',
  objet_utilise: 'refus.objet_utilise',
  plus_de_vague: 'refus.plus_de_vague',
};

export function texteRefus(raison: RaisonRefus): string {
  return t(CLES_REFUS[raison]);
}
