// Plan des 10 niveaux de la Préfecture (DLC « Temps modernes », région 3 : niveaux 21 à 30 de la campagne `moderne`, le siège final ; spec
// docs/specs/2026-11-12-dlc-temps-modernes-campagne.md, tâche 5). Comme la Fac (plan-moderne-r1.ts) : les vagues sont générées par
// `npm run niveaux -- moderne` depuis ce plan et figées dans vagues-moderne-r3.ts. Une carte neuve par niveau (cartes-moderne-r3.ts).
//
// La difficulté prend la suite de la Manif (niveaux 11 à 20) : tous les ennemis du DLC sont connus, chaque niveau en combine 6 à 10, et
// les mécaniques se superposent au lieu d'arriver une à une :
// - canon à eau (ennemi et événement), Tireur de LBD et BRAV-M dans chaque niveau, ensemble ;
// - nasses (événement) et foules qui bloquent ;
// - fermetures de chemin (22, 25, 27, 29) et chemins qui s'ouvrent (23, 28, 29, 30) : sept cartes qui bougent ;
// - renforts ennemis : des charges lentes d'unités lourdes (Boucliers, Centaures, CRS, gendarmes) qui sortent de la préfecture en plus
//   des vagues (facteur de vitesse 1,2 à 1,3), à côté des charges rapides (BRAV-M, cavaliers, BAC) ;
// - 26 : niveau de horde (le parking des fourgons) ;
// - 30 : le préfet (boss), avec sa mise en scène dans la dernière vague (renforts étudiants, canons à eau, nasse, escorte, BRAV-M, cavaliers).
//
// Budget des vagues : `niveauBudget` est le niveau L de l'histoire dont le budget b(L, w) sert, 41 à 50 (la Fac a pris 21 à 30, la Manif
// 31 à 40). `aretesDepart` et `facteurBudget` sont une première estimation, posée sur la menace des vagues (en-têtes de vagues-moderne-r3.ts)
// et un seul essai du bot soigneux en Matou (graine 7) par niveau ; la tâche 7 (bots et équilibrage des 3 régions) les règle contre les
// bandes imposées.
//
// Charges : `duree` couvre la traversée jusqu'au milieu du chemin (les chargeurs passent à travers les soldats) ; l'accélération courte
// (`dureeVitesse`) est séparée par une autre tâche et n'est pas écrite ici.
//
// Foules : deux ou trois par niveau, à payer en arêtes (cases hors chemin, réservées par la carte) ou à tenir avec le héros (cases sur le
// chemin) ; leurs prix, durées, recharges et nombres d'utilisations varient d'un niveau à l'autre. Une foule « ralentir » est à deux tuiles
// d'un chemin qui ne bouge pas ; une foule « bloquer » a une recharge au moins égale à la durée de sa coupure.
// `defiFer` : la tour de tir dès qu'il y a la BAC (furtive), des drones ou des hélicoptères (volants), jamais la même paire deux niveaux
// de suite.
import type { PlanNiveauModerne } from './plan-moderne-r1';

const ETUDIANT = 'etudiant';

export const PLANS_MODERNE_R3: readonly PlanNiveauModerne[] = [
  {
    numero: 21,
    carte: 'grilles',
    chemins: [0, 1],
    aretesDepart: 2400,
    defiFer: { familles: ['tir', 'caserne'] },
    nom: 'niveau.m3.01.nom',
    ambiance: 'niveau.m3.01.ambiance',
    evenements: [
      { vague: 2, delai: 6, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 14 },
      { vague: 6, delai: 5, type: 'nasse', chemin: 0, debut: 14, longueur: 3, duree: 6 },
      { vague: 8, delai: 6, type: 'renforts', x: 13, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 10, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_crs', nombre: 4, intervalle: 1, facteurVitesse: 1.2, duree: 26 },
      { vague: 11, delai: 10, type: 'canon_a_eau', cy: 7, sens: -1, recul: 3, etourdissement: 1.5 },
    ],
    foules: [
      { cases: [{ cx: 10, cy: 3 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 6, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 12,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_canon_a_eau', 'moderne_bac', 'moderne_grenadier_lacrymo'],
      graine: 5321,
      niveauBudget: 41,
      facteurBudget: 0.19,
    },
  },
  {
    numero: 22,
    carte: 'cour_honneur',
    chemins: [0, 1],
    aretesDepart: 2400,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.m3.02.nom',
    ambiance: 'niveau.m3.02.ambiance',
    // Le porche du nord (chemin 1) est refermé par la police à la vague 5, puis rouvert à la vague 8 jusqu'à la fin.
    evenements: [
      { vague: 2, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.7, facteurVitesse: 1.7, duree: 14 },
      { vague: 3, delai: 8, type: 'canon_a_eau', cy: 6, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
      { vague: 6, delai: 8, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 7, delai: 6, type: 'charge', chemin: 0, ennemi: 'moderne_bouclier_anti_emeute', nombre: 3, intervalle: 1, facteurVitesse: 1.3, duree: 33 },
      { vague: 8, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 10, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 8 },
      { vague: 11, delai: 5, type: 'renforts', x: 25, y: 11, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 2, cy: 3 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 9, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'bloquer', chemin: 0, debut: 30, longueur: 3, duree: 6 }, recharge: 25 },
      { cases: [{ cx: 6, cy: 6 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3, facteur: 0.5, duree: 5 }, recharge: 25 },
    ],
    vagues: {
      nombre: 12,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_canon_a_eau', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_drone'],
      graine: 5322,
      niveauBudget: 42,
      facteurBudget: 0.18,
    },
  },
  {
    numero: 23,
    carte: 'jardins',
    chemins: [0, 1],
    aretesDepart: 2500,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.m3.03.nom',
    ambiance: 'niveau.m3.03.ambiance',
    // La haie du sud (chemin 1) est fermée au départ ; elle s'ouvre à la vague 6 et reste ouverte jusqu'à la fin.
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 6, type: 'charge', chemin: 0, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.3, duree: 12 },
      { vague: 6, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 7, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 4, intervalle: 0.9, facteurVitesse: 1.5, duree: 25 },
      { vague: 9, delai: 6, type: 'nasse', chemin: 0, debut: 14, longueur: 3, duree: 6 },
      { vague: 10, delai: 5, type: 'renforts', x: 17, y: 15, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 12, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_centaure', nombre: 2, intervalle: 1.5, facteurVitesse: 1.3, duree: 39 },
    ],
    foules: [
      { cases: [{ cx: 8, cy: 2 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 12, cy: 2 }], condition: { type: 'payer', cout: 100 }, effet: { type: 'renforts', nombre: 4, duree: 14, unite: ETUDIANT }, recharge: 30 },
      { cases: [{ cx: 2, cy: 4 }], condition: { type: 'heros', duree: 4 }, effet: { type: 'bloquer', chemin: 0, debut: 20, longueur: 3, duree: 6 }, recharge: 30 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_cavalier_monte', 'moderne_helicoptere', 'moderne_canon_a_eau'],
      graine: 5323,
      niveauBudget: 43,
      facteurBudget: 0.2,
    },
  },
  {
    numero: 24,
    carte: 'perron',
    chemins: [0, 1],
    aretesDepart: 2500,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.m3.04.nom',
    ambiance: 'niveau.m3.04.ambiance',
    evenements: [
      { vague: 2, delai: 6, type: 'nasse', chemin: 0, debut: 20, longueur: 3, duree: 6 },
      { vague: 3, delai: 8, type: 'canon_a_eau', cy: 2, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 8 },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bouclier_anti_emeute', nombre: 4, intervalle: 1, facteurVitesse: 1.3, duree: 53 },
      { vague: 8, delai: 6, type: 'canon_a_eau', cy: 6, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 10, delai: 5, type: 'renforts', x: 17, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 11, delai: 8, type: 'nasse', chemin: 1, debut: 4, longueur: 3, duree: 6 },
      { vague: 12, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_cavalier_monte', nombre: 4, intervalle: 0.6, facteurVitesse: 1.4, duree: 18 },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 3 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 10, cy: 5 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'bloquer', chemin: 1, debut: 4, longueur: 3, duree: 6 }, recharge: 25 },
      { cases: [{ cx: 8, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_crs', 'moderne_bouclier_anti_emeute', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_canon_a_eau', 'moderne_centaure', 'moderne_grenadier_lacrymo'],
      graine: 5324,
      niveauBudget: 44,
      facteurBudget: 0.2,
    },
  },
  {
    numero: 25,
    carte: 'colonnade',
    chemins: [0, 1],
    aretesDepart: 2600,
    defiFer: { familles: ['tir', 'caserne'] },
    nom: 'niveau.m3.05.nom',
    ambiance: 'niveau.m3.05.ambiance',
    // Le raccourci de la colonnade (chemin 1) est fermé à la vague 3, puis rouvert à la vague 8 jusqu'à la fin.
    evenements: [
      { vague: 2, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 5, intervalle: 0.6, facteurVitesse: 1.7, duree: 21 },
      { vague: 3, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
      { vague: 4, delai: 8, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 0, debut: 18, longueur: 3, duree: 6 },
      { vague: 6, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_centaure', nombre: 2, intervalle: 1.5, facteurVitesse: 1.3, duree: 44 },
      { vague: 8, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 9, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 4, intervalle: 0.5, facteurVitesse: 1.5, duree: 12 },
      { vague: 10, delai: 6, type: 'renforts', x: 23, y: 7, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 12, delai: 6, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 2 },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 6 }, recharge: 22 },
      { cases: [{ cx: 8, cy: 6 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 25 },
      { cases: [{ cx: 13, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 0, debut: 40, longueur: 3, duree: 6 }, recharge: 30 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_drone', 'moderne_canon_a_eau', 'moderne_centaure'],
      graine: 5325,
      niveauBudget: 45,
      facteurBudget: 0.18,
    },
  },
  {
    numero: 26,
    carte: 'parking',
    chemins: [0, 1, 2],
    aretesDepart: 2400,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.m3.06.nom',
    ambiance: 'niveau.m3.06.ambiance',
    evenements: [
      { vague: 2, delai: 6, type: 'charge', chemin: 2, ennemi: 'moderne_bac', nombre: 5, intervalle: 0.5, facteurVitesse: 1.6, duree: 8 },
      { vague: 4, delai: 8, type: 'canon_a_eau', cy: 4, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 6, type: 'renforts', x: 17, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 7, delai: 6, type: 'nasse', chemin: 1, debut: 8, longueur: 3, duree: 6 },
      { vague: 8, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 4, intervalle: 0.5, facteurVitesse: 1.5, duree: 12 },
      { vague: 10, delai: 6, type: 'nasse', chemin: 0, debut: 8, longueur: 3, duree: 6 },
      { vague: 11, delai: 8, type: 'charge', chemin: 2, ennemi: 'moderne_gendarme', nombre: 8, intervalle: 0.4, facteurVitesse: 1.2, duree: 13 },
      { vague: 12, delai: 6, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 2 },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 2 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 18 },
      { cases: [{ cx: 7, cy: 6 }], condition: { type: 'payer', cout: 50 }, effet: { type: 'bloquer', chemin: 1, debut: 10, longueur: 3, duree: 5 }, recharge: 15, utilisations: 4 },
      { cases: [{ cx: 12, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 14, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_bac', 'moderne_bravm', 'moderne_tireur_lbd', 'moderne_drone', 'moderne_canon_a_eau'],
      graine: 5326,
      niveauBudget: 46,
      facteurBudget: 0.13,
      horde: true,
    },
  },
  {
    numero: 27,
    carte: 'archives',
    chemins: [0, 1],
    aretesDepart: 2700,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.m3.07.nom',
    ambiance: 'niveau.m3.07.ambiance',
    // L'entrée du nord-ouest (chemin 1) est murée de dossiers à la vague 4, puis rouverte à la vague 9 jusqu'à la fin.
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 3, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.5, duree: 38 },
      { vague: 4, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
      { vague: 5, delai: 8, type: 'nasse', chemin: 0, debut: 26, longueur: 3, duree: 6 },
      { vague: 6, delai: 6, type: 'renforts', x: 19, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bouclier_anti_emeute', nombre: 4, intervalle: 1, facteurVitesse: 1.3, duree: 50 },
      { vague: 9, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 10, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 4, intervalle: 0.5, facteurVitesse: 1.5, duree: 21 },
      { vague: 11, delai: 6, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 12, delai: 8, type: 'nasse', chemin: 0, debut: 48, longueur: 3, duree: 6 },
      { vague: 13, delai: 6, type: 'charge', chemin: 0, ennemi: 'moderne_centaure', nombre: 3, intervalle: 1.5, facteurVitesse: 1.3, duree: 59 },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 4 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 6 }, recharge: 22 },
      { cases: [{ cx: 11, cy: 6 }], condition: { type: 'payer', cout: 100 }, effet: { type: 'bloquer', chemin: 0, debut: 50, longueur: 3, duree: 6 }, recharge: 25 },
      { cases: [{ cx: 9, cy: 2 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 14,
      ennemis: ['moderne_crs', 'moderne_bouclier_anti_emeute', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_helicoptere', 'moderne_canon_a_eau', 'moderne_commissaire'],
      graine: 5327,
      niveauBudget: 47,
      facteurBudget: 0.15,
    },
  },
  {
    numero: 28,
    carte: 'salle_fetes',
    chemins: [0, 1],
    aretesDepart: 2700,
    defiFer: { familles: ['tir', 'caserne'] },
    nom: 'niveau.m3.08.nom',
    ambiance: 'niveau.m3.08.ambiance',
    // La porte de l'office (chemin 1) est fermée au départ ; elle s'ouvre à la vague 6 et reste ouverte jusqu'à la fin.
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 2, delai: 6, type: 'canon_a_eau', cy: 2, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 3, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 12 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 6, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 7, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 5, intervalle: 0.8, facteurVitesse: 1.5, duree: 17 },
      { vague: 8, delai: 6, type: 'renforts', x: 15, y: 13, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 10, delai: 8, type: 'canon_a_eau', cy: 6, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 11, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 4, intervalle: 0.5, facteurVitesse: 1.5, duree: 9 },
      { vague: 13, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_centaure', nombre: 3, intervalle: 1.5, facteurVitesse: 1.3, duree: 42 },
    ],
    foules: [
      { cases: [{ cx: 6, cy: 3 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 11, cy: 4 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'renforts', nombre: 4, duree: 14, unite: ETUDIANT }, recharge: 28 },
      { cases: [{ cx: 3, cy: 2 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 0, debut: 6, longueur: 3, duree: 6 }, recharge: 30 },
    ],
    vagues: {
      nombre: 14,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_cavalier_monte', 'moderne_centaure', 'moderne_drone', 'moderne_canon_a_eau'],
      graine: 5328,
      niveauBudget: 48,
      facteurBudget: 0.15,
    },
  },
  {
    numero: 29,
    carte: 'toits',
    chemins: [0, 1, 2],
    aretesDepart: 2800,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.m3.09.nom',
    ambiance: 'niveau.m3.09.ambiance',
    // La verrière du sud-ouest (chemin 1) cède à la vague 4 et reste ouverte ; la lucarne du nord (chemin 2) est condamnée à la vague 9.
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 2, delai: 6, type: 'charge', chemin: 2, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 6 },
      { vague: 3, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 5, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 5, intervalle: 0.6, facteurVitesse: 1.7, duree: 19 },
      { vague: 7, delai: 6, type: 'nasse', chemin: 0, debut: 22, longueur: 3, duree: 6 },
      { vague: 8, delai: 8, type: 'canon_a_eau', cy: 6, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 9, delai: 3, type: 'fermer_chemin', chemin: 2, repli: 0 },
      { vague: 10, delai: 6, type: 'renforts', x: 21, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 11, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_centaure', nombre: 3, intervalle: 1.5, facteurVitesse: 1.3, duree: 42 },
      { vague: 12, delai: 6, type: 'nasse', chemin: 1, debut: 6, longueur: 3, duree: 6 },
      { vague: 13, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 4, intervalle: 0.5, facteurVitesse: 1.5, duree: 11 },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 2 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 12, cy: 5 }], condition: { type: 'payer', cout: 100 }, effet: { type: 'bloquer', chemin: 0, debut: 40, longueur: 3, duree: 6 }, recharge: 25 },
      { cases: [{ cx: 4, cy: 1 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 14,
      ennemis: ['moderne_crs', 'moderne_bouclier_anti_emeute', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_helicoptere', 'moderne_drone', 'moderne_commissaire', 'moderne_centaure', 'moderne_canon_a_eau'],
      graine: 5329,
      niveauBudget: 49,
      facteurBudget: 0.15,
    },
  },
  {
    numero: 30,
    carte: 'bureau',
    chemins: [0, 1, 2],
    aretesDepart: 3200,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.m3.10.nom',
    ambiance: 'niveau.m3.10.ambiance',
    cheminsFermes: [{ chemin: 2, repli: 0 }],
    // Le passage dérobé du nord (chemin 2) s'ouvre à la vague 7 et reste ouvert. Le préfet entre à la vague 15 (chemin 0) : les étudiants
    // descendent l'attendre devant le bureau (renforts), le canon à eau balaie leur ligne, la BRAV-M sort du passage dérobé, une nasse coupe
    // l'allée du sud, son escorte de Boucliers le suit, un deuxième canon balaie l'allée du sud et les cavaliers ferment la marche. Lui-même
    // appelle 4 CRS et devient invulnérable 3 s à 75, 50 et 25 % de ses PV (src/data/ennemis.ts).
    evenements: [
      { vague: 2, delai: 6, type: 'canon_a_eau', cy: 4, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 3, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 12 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 6, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bouclier_anti_emeute', nombre: 4, intervalle: 1, facteurVitesse: 1.3, duree: 29 },
      { vague: 7, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 8, delai: 8, type: 'charge', chemin: 2, ennemi: 'moderne_crs', nombre: 5, intervalle: 0.8, facteurVitesse: 1.5, duree: 11 },
      { vague: 10, delai: 6, type: 'renforts', x: 21, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 11, delai: 8, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 12, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_centaure', nombre: 3, intervalle: 1.5, facteurVitesse: 1.3, duree: 34 },
      { vague: 13, delai: 6, type: 'nasse', chemin: 1, debut: 12, longueur: 3, duree: 6 },
      { vague: 15, delai: 4, type: 'renforts', x: 25, y: 9, nombre: 5, duree: 18, unite: ETUDIANT },
      { vague: 15, delai: 9, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 2 },
      { vague: 15, delai: 14, type: 'charge', chemin: 2, ennemi: 'moderne_bravm', nombre: 4, intervalle: 0.5, facteurVitesse: 1.5, duree: 9 },
      { vague: 15, delai: 20, type: 'nasse', chemin: 1, debut: 12, longueur: 3, duree: 8 },
      { vague: 15, delai: 26, type: 'charge', chemin: 0, ennemi: 'moderne_bouclier_anti_emeute', nombre: 4, intervalle: 1, facteurVitesse: 1.3, duree: 29 },
      { vague: 15, delai: 34, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 15, delai: 40, type: 'charge', chemin: 1, ennemi: 'moderne_cavalier_monte', nombre: 4, intervalle: 0.6, facteurVitesse: 1.4, duree: 10 },
    ],
    foules: [
      { cases: [{ cx: 8, cy: 3 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 6 }, recharge: 20 },
      { cases: [{ cx: 7, cy: 5 }], condition: { type: 'payer', cout: 120 }, effet: { type: 'bloquer', chemin: 1, debut: 20, longueur: 3, duree: 6 }, recharge: 20, utilisations: 3 },
      { cases: [{ cx: 7, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 5, duree: 15, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 15,
      ennemis: ['moderne_crs', 'moderne_bouclier_anti_emeute', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_cavalier_monte', 'moderne_helicoptere', 'moderne_commissaire', 'moderne_centaure', 'moderne_canon_a_eau', 'moderne_grenadier_lacrymo'],
      graine: 5330,
      niveauBudget: 50,
      facteurBudget: 0.15,
      boss: { vague: 15, ennemi: 'moderne_prefet', chemin: 0, delai: 6 },
    },
  },
];
