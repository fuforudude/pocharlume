// Tous les textes affichés du jeu, en français. Une clé par texte, groupées par écran.
import { frDieux } from './fr-dieux';
import { frMeta } from './fr-meta';
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
  'accueil.niveau': 'Niveau {n}',
  'accueil.niveau_test': 'Niveau de test',
  'accueil.options': 'Options',

  // Chargement raté
  'erreur.chargement': 'Le chargement a échoué. Réessaie dans un instant.',
  'erreur.sauvegarde': 'La sauvegarde a échoué. Réessaie dans un instant.',

  // Sauvegarde : avis discrets au démarrage
  'sauvegarde.corrompue': 'Ta sauvegarde était illisible : une copie est gardée de côté, tu repars de zéro.',
  'sauvegarde.trop_recente': 'Cette sauvegarde vient d’une version plus récente du jeu : une copie est gardée de côté, tu repars de zéro.',
  'sauvegarde.partie_oubliee': 'Ta partie en cours venait d’une ancienne version du jeu : elle ne peut plus être reprise et a été oubliée.',
  'sauvegarde.indisponible': 'Le navigateur refuse de garder ta progression : elle sera perdue à la fermeture.',

  // Carte du monde et fiche de niveau
  'carte.retour': 'Retour',
  'carte.options': 'Options',
  'carte.total_etoiles': '{n} / {m}',
  'carte.total_etoiles_libelle': 'Étoiles gagnées : {n} sur {m}',
  'carte.niveau': 'Niveau {n} : {nom}',
  'fiche.boss': 'Boss',
  'fiche.difficulte': 'Difficulté',
  'fiche.etoiles': '{n} étoile(s) en {difficulte}',
  'fiche.lancer': 'Lancer',
  'fiche.fermer': 'Fermer',
  'lancer.perte_titre': 'Une partie en cours sera perdue',
  'lancer.perte_detail': 'Ta partie du niveau {n}, à la vague {m}, sera remplacée si tu lances ce niveau.',
  'lancer.confirmer': 'Lancer quand même',
  'lancer.annuler': 'Annuler',

  // Options
  'options.titre': 'Options',
  'options.son': 'Bruitages',
  'options.musique': 'Musique',
  'options.volume': '{n} %',
  'options.vitesse': 'Vitesse par défaut',
  'options.exporter': 'Exporter',
  'options.exporter_aide': 'Ce code garde ta progression. Copie-le, puis colle-le dans Importer sur un autre appareil.',
  'options.copier': 'Copier',
  'options.copie': 'Copié',
  'options.copie_impossible': 'Copie impossible : sélectionne le code et copie-le à la main.',
  'options.importer': 'Importer',
  'options.importer_aide': 'Colle ici un code exporté.',
  'options.importer_champ': 'Code à importer',
  'options.importer_valider': 'Importer ce code',
  'options.confirmer_titre': 'Remplacer ta progression ?',
  'options.confirmer_detail': 'Tu as {n} étoile(s). Le code en contient {m}. Ta progression et tes réglages actuels seront remplacés, la partie en cours abandonnée.',
  'options.confirmer': 'Remplacer',
  'options.annuler': 'Annuler',
  'options.import_ok': 'Progression importée.',
  'options.fermer': 'Fermer',

  // Import : pourquoi un code est refusé
  'import.refus.vide': 'Colle d’abord un code.',
  'import.refus.trop_long': 'Ce code est beaucoup trop long pour être un code Pocharlume.',
  'import.refus.format': 'Ce n’est pas un code Pocharlume.',
  'import.refus.somme': 'Le code est incomplet ou erroné : recopie-le en entier.',
  'import.refus.compression': 'Ce navigateur ne sait pas lire ce code.',
  'import.refus.donnees': 'Ce code est abîmé : son contenu est illisible.',
  'import.refus.trop_recent': 'Ce code vient d’une version plus récente du jeu.',

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
  // Rappel de la touche du clavier affiché sur un bouton
  'hud.touche_heros': 'E',
  'hud.touche_vague': '␣',
  'hud.touche_sort_1': 'Q',
  'hud.touche_sort_2': 'W',

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
  'refus.competence_inconnue': 'Cette compétence n’existe pas.',
  'refus.competence_au_maximum': 'Cette compétence est au sommet.',
  'refus.objet_inconnu': 'Il n’y a pas d’objet ici.',
  'refus.objet_utilise': 'Cet objet est déjà utilisé.',
  'refus.vies_pleines': 'Tes vies sont pleines : l’Herbe est gardée pour plus tard.',
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
  'fin.continuer': 'Continuer',
  'fin.quitter': 'Quitter',

  // Dieux, héros, sorts, tours divines, compétences, arbre, objets (fr-dieux.ts)
  ...frDieux,

  // Méta-progression : fiche de niveau, héros, boutique, bilan, refus des transactions (fr-meta.ts)
  ...frMeta,

  // Niveaux de la campagne (fr-niveaux.ts)
  ...frNiveaux,
} as const;
