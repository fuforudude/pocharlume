// DLC « Temps modernes » : noms des ennemis (repris de docs/lore.md par `npm run lore`, leurs phrases vont dans fr-lore.ts),
// textes de bulle et conseils du Bestiaire des trois mécaniques nouvelles (repousse, tir sur les tours, binôme), et capacités de
// famille de la campagne (Piquet, Renvoi, Sono, Perçage).
export const frDlcModerne = {
  'ennemi.moderne_gendarme': 'Gendarme',
  'ennemi.moderne_crs': 'CRS',
  'ennemi.moderne_gendarme_mobile': 'Gendarme Mobile',
  'ennemi.moderne_bouclier_anti_emeute': 'Bouclier Anti-Émeute',
  'ennemi.moderne_tireur_lbd': 'Tireur de LBD',
  'ennemi.moderne_grenadier_lacrymo': 'Grenadier Lacrymogène',
  'ennemi.moderne_bac': 'Agent de la BAC',
  'ennemi.moderne_commissaire': 'Commissaire',
  'ennemi.moderne_bravm': 'BRAV-M',
  'ennemi.moderne_cavalier_monte': 'Cavalier de la Police Montée',
  'ennemi.moderne_drone': 'Drone',
  'ennemi.moderne_helicoptere': 'Hélicoptère',
  'ennemi.moderne_canon_a_eau': 'Canon à Eau',
  'ennemi.moderne_centaure': 'Centaure',
  'ennemi.moderne_prefet': 'Le Préfet',
  'ennemi.moderne_commissaire_boss': 'Le Commissaire Divisionnaire',
  'ennemi.moderne_centaure_boss': 'Le Grand Centaure',

  // Bulles des mécaniques nouvelles
  'bulle.ennemi.repousser': 'Repousse de {n} cases les soldats et le héros devant lui, étourdis {d} s.',
  'bulle.ennemi.tirer_tour': 'Tire sur une tour à {r} cases : elle est hors service {d} s.',
  'bulle.ennemi.binome': 'Arrive en binôme ; quand l’un tombe, l’autre va {n} % plus vite.',

  // Conseils du Bestiaire
  'bestiaire.contre.repousse': 'Il repousse la ligne de soldats devant lui : arrête-le de loin, ou laisse-le passer avant de le prendre de flanc.',
  'bestiaire.contre.tir_tour': 'Il met tes tours hors service à distance : un Perchoir à côté lui renvoie un tir sur trois, qui le blesse ; sinon abats-le vite.',
  'bestiaire.contre.binome': 'Ils vont par deux : frappe-les ensemble en zone, sinon le survivant file plus vite.',

  // Capacités de famille de la campagne « Temps modernes »
  'bulle.tour.capacite_dlc': 'Capacité DLC',
  'bulle.capacite.note': 'Campagne « Temps modernes » : {texte}',
  'capacite.piquet': 'Piquet : les soldats subissent {n} % de dégâts en moins tant qu’au moins {s} d’entre eux tiennent la ligne.',
  'capacite.renvoi': 'Renvoi : dissipe les nuages lacrymogènes à sa portée et renvoie au tireur, pour {d} dégâts, un tir de LBD sur {c} visant une tour proche.',
  'capacite.sono': 'Sono : les ennemis à sa portée vont {n} % moins vite, en permanence.',
  'capacite.percage': 'Perçage : les pavés passent les boucliers frontaux et ignorent {n} % de l’armure en plus.',
} as const;
