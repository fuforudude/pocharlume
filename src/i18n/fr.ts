// Tous les textes affichés du jeu, en français. Une clé par texte, groupées par écran.
import { frNiveaux } from './fr-niveaux';

export const fr = {
  'jeu.titre': 'Pocharlume',

  // Difficultés
  'difficulte.chaton': 'Chaton',
  'difficulte.matou': 'Matou',
  'difficulte.vieux_sage': 'Vieux Sage',

  // Ennemis de la région 1
  'ennemi.paysan_affame': 'Paysan Affamé',
  'ennemi.mendiant': 'Mendiant',
  'ennemi.chien_errant': 'Chien Errant',
  'ennemi.boucher_vaudrelle': 'Le Boucher de Vaudrelle',

  // Tours communes
  'tour.grenier_des_griffes': 'Grenier des Griffes',
  'tour.garde_du_cloitre': 'Garde du Cloître',
  'tour.ecorcheurs': 'Écorcheurs',
  'tour.clocher_des_archers': 'Clocher des Archers',
  'tour.guetteurs_des_toits': 'Guetteurs des Toits',
  'tour.arbaletriers_du_beffroi': 'Arbalétriers du Beffroi',
  'tour.autel_des_cendres': 'Autel des Cendres',
  'tour.oracle_de_la_braise': 'Oracle de la Braise',
  'tour.necromancien_des_neuf_vies': 'Nécromancien des Neuf Vies',
  'tour.catapulte_du_rempart': 'Catapulte du Rempart',
  'tour.mortier_de_soufre': 'Mortier de Soufre',
  'tour.baliste_a_chaines': 'Baliste à Chaînes',

  // Unités alliées
  'unite.chat_de_grange': 'Chat de grange',
  'unite.garde_du_cloitre': 'Chat en cotte de mailles',
  'unite.ecorcheur': 'Écorcheur',
  'unite.spectre': 'Spectre',
  'unite.gros_matou': 'Gros matou',

  // Dieu Charlie
  'dieu.charlie': 'Charlie',
  'heros.charlie': 'Charlie, le Colosse',
  'sort.chute_du_colosse': 'Chute du Colosse',
  'sort.renforts': 'Renforts',
  'tour.totem_du_colosse': 'Totem du Colosse',

  // Niveaux de la campagne (fr-niveaux.ts)
  ...frNiveaux,
} as const;
