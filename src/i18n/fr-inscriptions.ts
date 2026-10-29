// Textes de l'interface des inscriptions (jalon 5, « Les dieux sans visage ») : le bouton de la carte du monde, le recueil, la fenêtre
// qui s'ouvre quand on touche une vieille statue pendant une partie. Les inscriptions elles-mêmes (`inscription.<id de carte>`) sont
// dans fr-lore.ts, généré depuis docs/lore.md. Aucun de ces textes ne nomme les entités : leurs noms ne vivent que dans les inscriptions.
export const frInscriptions = {
  // Carte du monde
  'carte.inscriptions': 'Inscriptions',

  // Recueil
  'inscriptions.titre': 'Inscriptions',
  'inscriptions.fermer': 'Fermer',
  'inscriptions.compteur': '{n} / {total}',
  'inscriptions.compteur_libelle': '{n} inscriptions trouvées sur {total}',
  'inscriptions.liste': 'Les inscriptions des vieilles statues',
  'inscriptions.inconnue': '???',
  'inscriptions.inconnue_libelle': 'Inscription pas encore trouvée, dans la région : {region}',
  'inscriptions.lieu': '{carte}, {region}',
  'inscriptions.vide': 'Aucune inscription pour l’instant. De vieilles statues se cachent dans le décor des cartes : touche-les pendant une partie.',

  // Fenêtre ouverte en touchant une statue pendant une partie
  'inscriptions.statue': 'Une vieille statue',
  'inscriptions.statue_libelle': 'Inscription d’une vieille statue',
  'inscriptions.nouvelle': 'Inscription ajoutée au recueil.',
  'inscriptions.relue': 'Déjà dans le recueil.',
  'inscriptions.refermer': 'Refermer',
} as const;
