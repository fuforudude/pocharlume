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

  // Accueil
  'accueil.jouer': 'Jouer',
  'accueil.reprendre': 'Reprendre à la vague {n}',

  // Partie : barre du haut et commandes
  'hud.vies': 'Vies',
  'hud.aretes': 'Arêtes',
  'hud.vague': 'Vague {n}/{m}',
  'hud.appeler_vague': 'Appeler la vague',
  'hud.appeler_vague_bonus': 'Appeler la vague +{n}',
  'hud.vague_dans': 'Vague dans {s} s',
  'hud.vitesse': 'Vitesse ×{n}',
  'hud.pause': 'Pause',
  'hud.heros': 'Héros',
  'hud.heros_revient': 'Revient dans {s} s',
  'hud.recharge': 'Recharge : {s} s',

  // Partie : familles de tours, menus et invites
  'famille.caserne': 'Caserne',
  'famille.tir': 'Tir',
  'famille.magie': 'Magie',
  'famille.artillerie': 'Artillerie',
  'famille.divine': 'Tour divine',
  'menu.ameliorer': 'Améliorer',
  'menu.vendre': 'Vendre',
  'menu.ralliement': 'Ralliement',
  'menu.niveau': 'Niveau {n}',
  'menu.specialisation': 'Spécialisation',
  'menu.construire': 'Construire : {nom}',
  'menu.fermer': 'Fermer le menu',
  'invite.heros': 'Touche un point du chemin pour y envoyer le héros.',
  'invite.sort': 'Touche la carte pour lancer : {nom}.',
  'invite.ralliement': 'Touche un point du chemin pour y rallier les chats.',

  // Partie : pourquoi un geste est refusé
  'refus.partie_terminee': 'La partie est finie.',
  'refus.action_invalide': 'Ce geste est impossible.',
  'refus.socle_inconnu': 'Il n’y a pas de socle ici.',
  'refus.socle_occupe': 'Une tour se dresse déjà ici.',
  'refus.socle_vide': 'Ce socle est vide.',
  'refus.tour_inconnue': 'Cette tour n’existe pas.',
  'refus.aretes_insuffisantes': 'Pas assez d’arêtes.',
  'refus.niveau_max': 'Cette tour est au sommet.',
  'refus.specialisation_requise': 'Il faut choisir une spécialisation.',
  'refus.specialisation_impossible': 'Pas de spécialisation possible.',
  'refus.tour_divine_unique': 'Une seule tour divine par carte.',
  'refus.pas_une_caserne': 'Seule une caserne a un ralliement.',
  'refus.hors_portee': 'C’est trop loin de la tour.',
  'refus.hors_carte': 'C’est hors de la carte.',
  'refus.hors_chemin': 'Touche plus près du chemin.',
  'refus.heros_mort': 'Le héros est tombé.',
  'refus.sort_inconnu': 'Ce sort n’existe pas.',
  'refus.sort_en_recharge': 'Le sort se recharge.',
  'refus.vague_en_cours': 'La vague sort encore.',
  'refus.plus_de_vague': 'Il ne reste plus de vague.',

  // Partie : pause, orientation et fin
  'pause.titre': 'Pause',
  'pause.reprendre': 'Reprendre',
  'ecran.tourne': 'Tourne ton téléphone',
  'ecran.tourne_detail': 'Pocharlume se joue en paysage.',
  'fin.victoire': 'Victoire',
  'fin.victoire_detail': 'Les braises tiennent encore.',
  'fin.defaite': 'Défaite',
  'fin.defaite_detail': 'Le Soleil Blême gagne cette nuit.',
  'fin.etoiles': '{n} étoile(s) sur 3',
  'fin.vies': 'Vies restantes : {n}/{m}',
  'fin.rejouer': 'Rejouer',
  'fin.quitter': 'Quitter',

  // Dieu Charlie
  'dieu.charlie': 'Charlie',
  'heros.charlie': 'Charlie, le Colosse',
  'sort.chute_du_colosse': 'Chute du Colosse',
  'sort.renforts': 'Renforts',
  'tour.totem_du_colosse': 'Totem du Colosse',

  // Niveaux de la campagne (fr-niveaux.ts)
  ...frNiveaux,
} as const;
