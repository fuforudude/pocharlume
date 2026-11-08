// Textes des gimmicks (particularités des niveaux 101 à 150) : nom, phrase de présentation, conseil du Bestiaire, et ce que
// l'interface en dit (fiche du niveau, fiche « Nouvelle particularité », onglet du Bestiaire, bulles en partie).
export const frGimmicks = {
  'gimmick.corbeaux.nom': 'Vol de Corbeaux',
  'gimmick.corbeaux.phrase': 'Des corbeaux traversent la carte dans des couloirs, sans suivre le chemin. Chacun qui passe coûte un cœur. Seul ce qui vise les volants les touche.',
  'gimmick.corbeaux.conseil': 'Avant chaque vague, un panneau au bord gauche annonce les couloirs qui serviront. Pose des tours qui visent les volants tout près de ces couloirs, et poste un héros tireur là où un couloir croise le chemin : les soldats, eux, ne les retiennent pas.',
  'gimmick.radeau.nom': 'Radeau',
  'gimmick.radeau.phrase': 'Il va et vient sur l’eau. On y construit tout sauf ce qui pose quelque chose au sol. L’eau, elle, ne porte rien.',
  'gimmick.radeau.conseil': 'Touche une place libre du radeau pour y construire. Ses tours tirent depuis là où il se trouve : mets-y des tours de longue portée, qui couvrent le chemin d’un bout à l’autre de sa course. Casernes et ateliers n’y ont pas leur place.',

  'gimmick.fiche_ligne': 'Particularité : {nom} — {phrase}',
  'gimmick.nouveau_titre': 'Nouvelle particularité',
  'gimmick.nouveau_libelle': 'Nouvelle particularité : {nom}',
  'gimmick.nouveau_aide': 'La partie reprend quand tu fermes cette fiche. Tu la retrouveras dans le Bestiaire, onglet Particularités.',
  'gimmick.comment': 'Comment s’y prendre',
  'gimmick.inconnue': 'Pas encore rencontrée : elle t’attend plus loin, après l’histoire.',
  'gimmick.inconnue_libelle': 'Particularité pas encore rencontrée',

  'gimmick.radeau.places': 'Places libres',
  'gimmick.radeau.vitesse': 'Vitesse',
  'gimmick.radeau.note': 'Touche une place libre pour y construire, une tour pour l’améliorer ou la vendre.',
  'gimmick.couloir.note': 'Les ennemis de ce couloir le traversent en ligne droite, de gauche à droite.',

  'bestiaire.onglet_particularites': 'Particularités',
  'bestiaire.liste_particularites': 'Particularités des niveaux',
  'bestiaire.compte_particularites': '{n} / {m} rencontrées',
} as const;
