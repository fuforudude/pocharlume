// Textes des événements datés, de la carte qui bouge et des foules (DLC Temps modernes) : bandeau d'annonce, bulles des foules, refus.
export const frEvenements = {
  // Bandeau d'annonce, quelques secondes avant l'événement ({n} : numéro du chemin, à partir de 1).
  'evenement.charge.annonce': 'Charge sur le chemin {n} !',
  'evenement.nasse.annonce': 'Nasse sur le chemin {n} !',
  'evenement.canon_a_eau.annonce': 'Canon à eau !',
  'evenement.renforts.annonce': 'Renforts étudiants !',
  'evenement.ouvrir_chemin.annonce': 'La barricade cède : le chemin {n} s’ouvre !',
  'evenement.fermer_chemin.annonce': 'Le chemin {n} se ferme !',
  'evenement.vente_office': 'Tour emportée par le cortège : {n} arêtes rendues.',

  // Foules activables.
  'foule.activee.ralentir': 'La foule ralentit les ennemis !',
  'foule.activee.renforts': 'La foule envoie des renforts !',
  'foule.activee.bloquer': 'La foule bloque le passage !',
  'foule.aide.payer': 'Foule : touche-la pour l’activer ({n} arêtes).',
  'foule.aide.heros': 'Foule : laisse ton héros dedans {n} s pour l’activer.',

  'unite.etudiant': 'Étudiant',
  'accueil.essai_evenements': 'Essai : événements du DLC',

  // Refus du moteur.
  'refus.foule_inconnue': 'Il n’y a pas de foule ici.',
  'refus.foule_sans_paiement': 'Cette foule ne se paie pas : poste ton héros dedans.',
  'refus.foule_en_recharge': 'La foule reprend son souffle.',
  'refus.foule_epuisee': 'Cette foule a déjà tout donné.',
  'refus.zone_bloquee': 'Ce passage est coupé : personne n’y va.',
} as const;
