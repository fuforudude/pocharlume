// Pourquoi une transaction de la méta-progression ou un lancement de partie est refusé, en phrase pour le joueur.
// Le type `Record<RaisonMeta, …>` oblige à traduire chaque raison : en ajouter une dans src/save/ sans texte ne compile plus.
import { t, type CleTexte } from '../i18n';
import type {
  RaisonAchatObjet,
  RaisonAchatPrecis,
  RaisonArbre,
  RaisonCaisse,
  RaisonCaisseModerne,
  RaisonChoix,
  RaisonConfig,
  RaisonDefi,
  RaisonDisciple,
  RaisonEquipement,
  RaisonEquipementCollection,
  RaisonFin,
  RaisonPoint,
  RaisonPoints,
  RaisonRang,
  RaisonReinitialisation,
} from '../save';

/** Toutes les raisons que la session ou la composition d'une config peuvent rendre. */
export type RaisonMeta =
  | RaisonArbre
  | RaisonReinitialisation
  | RaisonDisciple
  | RaisonAchatObjet
  | RaisonEquipement
  | RaisonChoix
  | RaisonPoint
  | RaisonPoints
  | RaisonConfig
  | RaisonFin
  | RaisonDefi
  | RaisonCaisse
  | RaisonCaisseModerne
  | RaisonRang
  | RaisonAchatPrecis
  | RaisonEquipementCollection
  | 'aleatoire_indisponible'
  | 'modifie_ailleurs'
  | 'definitions_absentes';

export const CLES_REFUS_META: Readonly<Record<RaisonMeta, CleTexte>> = {
  branche_inconnue: 'meta.refus.branche_inconnue',
  rang_max: 'meta.refus.rang_max',
  etoiles_insuffisantes: 'meta.refus.etoiles_insuffisantes',
  rien_a_reinitialiser: 'meta.refus.rien_a_reinitialiser',
  heros_inconnu: 'meta.refus.heros_inconnu',
  deja_possede: 'meta.refus.deja_possede',
  braises_insuffisantes: 'meta.refus.braises_insuffisantes',
  objet_inconnu: 'meta.refus.objet_inconnu',
  quantite_invalide: 'meta.refus.quantite_invalide',
  stock_plein: 'meta.refus.stock_plein',
  aretes_insuffisantes: 'meta.refus.aretes_insuffisantes',
  trop_d_objets: 'meta.refus.trop_d_objets',
  objet_hors_stock: 'meta.refus.objet_hors_stock',
  dieu_inconnu: 'meta.refus.dieu_inconnu',
  heros_pas_du_dieu: 'meta.refus.heros_pas_du_dieu',
  heros_non_possede: 'meta.refus.heros_non_possede',
  competence_inconnue: 'meta.refus.competence_inconnue',
  niveau_insuffisant: 'meta.refus.niveau_insuffisant',
  plus_de_points: 'meta.refus.plus_de_points',
  modifie_ailleurs: 'meta.refus.modifie_ailleurs',
  definitions_absentes: 'meta.refus.definitions_absentes',
  competences_incoherentes: 'meta.refus.competences_incoherentes',
  difficulte_inconnue: 'meta.refus.difficulte_inconnue',
  niveau_invalide: 'meta.refus.niveau_invalide',
  etoiles_invalides: 'meta.refus.etoiles_invalides',
  objets_invalides: 'meta.refus.objets_invalides',
  // Jalon 3 : caisses, collection et défis (les raisons déjà connues plus haut gardent leur phrase meta.refus.*).
  type_inconnu: 'collection.refus.type_inconnu',
  eclats_insuffisants: 'collection.refus.eclats_insuffisants',
  non_possede: 'collection.refus.non_possede',
  emplacement_invalide: 'collection.refus.emplacement_invalide',
  aleatoire_indisponible: 'collection.refus.aleatoire_indisponible',
  defi_inconnu: 'collection.refus.defi_inconnu',
  defi_verrouille: 'collection.refus.defi_verrouille',
  // DLC « Temps modernes » : la caisse payée en badges.
  badges_insuffisants: 'collection.refus.badges_insuffisants',
};

export function texteRefusMeta(raison: RaisonMeta): string {
  return t(CLES_REFUS_META[raison]);
}
