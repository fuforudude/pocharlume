// Pourquoi le moteur a refusé un geste, en phrase pour le joueur. Le type `Record<RaisonRefus, …>` oblige à
// traduire chaque raison : en ajouter une au moteur sans texte ne compile plus.
import type { RaisonRefus } from '../engine';
import { t, type CleTexte } from '../i18n';

export const CLES_REFUS: Readonly<Record<RaisonRefus, CleTexte>> = {
  partie_terminee: 'refus.partie_terminee',
  action_invalide: 'refus.action_invalide',
  case_hors_carte: 'refus.case_hors_carte',
  case_interdite: 'refus.case_interdite',
  case_occupee: 'refus.case_occupee',
  case_vide: 'refus.case_vide',
  caserne_sans_chemin: 'refus.caserne_sans_chemin',
  tour_inconnue: 'refus.tour_inconnue',
  aretes_insuffisantes: 'refus.aretes_insuffisantes',
  niveau_max: 'refus.niveau_max',
  specialisation_requise: 'refus.specialisation_requise',
  specialisation_impossible: 'refus.specialisation_impossible',
  une_seule_divine: 'refus.une_seule_divine',
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
  vies_pleines: 'refus.vies_pleines',
  plus_de_vague: 'refus.plus_de_vague',
  famille_interdite: 'refus.famille_interdite',
  non_debloque: 'refus.non_debloque',
};

/** La phrase d'un refus ; pour un élément pas encore débloqué, `niveau` dit où il se débloque (« Se débloque au niveau 4. »). */
export function texteRefus(raison: RaisonRefus, niveau: number | null = null): string {
  if (raison === 'non_debloque' && niveau !== null) return t('refus.non_debloque_au', { n: niveau });
  return t(CLES_REFUS[raison]);
}
