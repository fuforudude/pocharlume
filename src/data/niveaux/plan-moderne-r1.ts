// Plan des 10 niveaux de la Fac (DLC « Temps modernes », région 1 : niveaux 1 à 10 de la campagne `moderne`, spec
// docs/specs/2026-11-12-dlc-temps-modernes-campagne.md, tâche 5). Comme les plans de l'histoire : les vagues sont générées par
// `npm run niveaux -- moderne` depuis ce plan et figées dans vagues-moderne-r1.ts. Une carte neuve par niveau (cartes-moderne-r1.ts).
//
// Montée de la difficulté et ordre d'arrivée des mécaniques :
// - 1 et 2 : les ennemis simples (Gendarme, puis Gendarme Mobile) ; une première foule au niveau 2.
// - 3 : les CRS (armure) et les premiers événements datés (charges) ; deux chemins.
// - 4 : le Canon à Eau, ennemi et événement (la ligne de soldats balayée) ; une foule qui bloque.
// - 5 : niveau de horde (le Resto U) avec la BAC (furtif) ; nasse et renforts étudiants.
// - 6 : le Tireur de LBD (tire sur les tours) ; première carte qui bouge (la grille du parvis cède : chemin qui s'ouvre).
// - 7 : la BRAV-M (binôme) ; le piquet ferme puis rouvre la porte nord.
// - 8 : Grenadier Lacrymogène et Drone (volant) ; trois chemins, dont un qui s'ouvre à mi-niveau et reste ouvert.
// - 9 : Commissaire (aura de vitesse) et Bouclier Anti-Émeute ; le raccourci de la verrière se ferme puis rouvre.
// - 10 : le Commissaire Divisionnaire (boss), avec sa mise en scène dans la dernière vague (renforts, escorte, canon, nasse, BRAV-M).
//
// Budget des vagues : `niveauBudget` est le niveau L de l'histoire dont le budget de menace b(L, w) sert (21 à 30 : toutes les tours sont
// ouvertes dans le DLC, comme à la région 3 de l'histoire). `aretesDepart` et `facteurBudget` sont une première estimation, posée sur un
// essai rapide du bot soigneux en Matou (graine 7) : il gagne chaque niveau, avec des pertes dès le niveau 2 (le boss lui coûte 12 vies).
// Les ennemis du DLC (armures, canon à eau intouchable, LBD qui coupe les tours, binômes) pèsent plus que leur menace : d'où des facteurs
// bas et des arêtes de départ hautes. La tâche 7 (bots et équilibrage des 3 régions) les règle contre les bandes imposées.
//
// Foules : au moins une par niveau dès le niveau 2, à payer en arêtes ou à tenir avec le héros (cases sur le chemin), pour ralentir,
// envoyer des renforts étudiants ou bloquer un passage. Les cases d'une foule « payer » sont hors chemin et réservées par la carte (aucun
// décor) ; celles d'une foule « héros » sont sur le chemin (le héros ne se poste qu'à une tuile de l'axe).
// `defiFer` : la tour de tir dès qu'il y a la BAC (furtive) ou des drones (volants), jamais la même paire deux niveaux de suite.
import type { CheminFerme, DefiFer, EvenementNiveau, Foule } from '../../engine/definitions';
import type { IdEnnemi } from '../ennemis';
import type { IdCarteModerneR1 } from './cartes-moderne-r1';
import type { BossDeVague } from './generation';

/** Plan d'un niveau du DLC ; `C` : les identifiants de cartes de sa région (la Fac par défaut). */
export interface PlanNiveauModerne<C extends string = IdCarteModerneR1> {
  /** Numéro dans la campagne `moderne` (1 à 30). */
  readonly numero: number;
  readonly carte: C;
  /** Chemins de la carte utilisés, dans l'ordre (tous ici) ; les chemins mobiles en font partie. */
  readonly chemins: readonly number[];
  readonly aretesDepart: number;
  readonly defiFer: DefiFer;
  /** Clés de src/i18n/fr-moderne-niveaux.ts (textes dans docs/lore.md). */
  readonly nom: string;
  readonly ambiance: string;
  readonly evenements?: readonly EvenementNiveau[];
  readonly cheminsFermes?: readonly CheminFerme[];
  readonly foules?: readonly Foule[];
  readonly vagues: {
    readonly nombre: number;
    readonly ennemis: readonly IdEnnemi[];
    readonly graine: number;
    /** Niveau L de l'histoire dont le budget de menace sert aux vagues. */
    readonly niveauBudget: number;
    readonly facteurBudget?: number;
    readonly boss?: BossDeVague;
    readonly horde?: boolean;
  };
}

const ETUDIANT = 'etudiant';

export const PLANS_MODERNE_R1: readonly PlanNiveauModerne[] = [
  {
    numero: 1,
    carte: 'amphi',
    chemins: [0],
    aretesDepart: 800,
    defiFer: { familles: ['caserne', 'tir'], facteurEffectifs: 0.45 },
    nom: 'niveau.m1.01.nom',
    ambiance: 'niveau.m1.01.ambiance',
    vagues: { nombre: 8, ennemis: ['moderne_gendarme'], graine: 5101, niveauBudget: 21 },
  },
  {
    numero: 2,
    carte: 'couloirs',
    chemins: [0],
    aretesDepart: 1150,
    defiFer: { familles: ['magie', 'artillerie'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.02.nom',
    ambiance: 'niveau.m1.02.ambiance',
    foules: [
      { cases: [{ cx: 7, cy: 5 }], condition: { type: 'payer', cout: 40 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 4 }, recharge: 18 },
    ],
    vagues: { nombre: 9, ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile'], graine: 5102, niveauBudget: 22, facteurBudget: 0.7 },
  },
  {
    numero: 3,
    carte: 'cour',
    chemins: [0, 1],
    aretesDepart: 1700,
    defiFer: { familles: ['caserne', 'magie'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.03.nom',
    ambiance: 'niveau.m1.03.ambiance',
    evenements: [
      { vague: 4, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme', nombre: 4, intervalle: 0.7, facteurVitesse: 1.8, duree: 16 },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_gendarme_mobile', nombre: 3, intervalle: 0.8, facteurVitesse: 1.7, duree: 20 },
    ],
    foules: [
      { cases: [{ cx: 9, cy: 4 }], condition: { type: 'payer', cout: 50 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 4 }, recharge: 20 },
      { cases: [{ cx: 13, cy: 5 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 2, duree: 10, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: { nombre: 9, ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_crs'], graine: 5103, niveauBudget: 23, facteurBudget: 1.15 },
  },
  {
    numero: 4,
    carte: 'bibliotheque',
    chemins: [0],
    aretesDepart: 1200,
    defiFer: { familles: ['tir', 'artillerie'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.04.nom',
    ambiance: 'niveau.m1.04.ambiance',
    evenements: [
      { vague: 3, delai: 8, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 6, delai: 10, type: 'canon_a_eau', cy: 2, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 9, delai: 5, type: 'charge', chemin: 0, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 44 },
    ],
    foules: [
      { cases: [{ cx: 9, cy: 4 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'bloquer', chemin: 0, debut: 63, longueur: 3, duree: 5 }, recharge: 25 },
      { cases: [{ cx: 10, cy: 7 }, { cx: 11, cy: 7 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3, facteur: 0.5, duree: 5 }, recharge: 25 },
    ],
    vagues: { nombre: 10, ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_crs', 'moderne_canon_a_eau'], graine: 5104, niveauBudget: 24, facteurBudget: 0.4 },
  },
  {
    numero: 5,
    carte: 'resto',
    chemins: [0, 1],
    aretesDepart: 1000,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.m1.05.nom',
    ambiance: 'niveau.m1.05.ambiance',
    evenements: [
      { vague: 3, delai: 6, type: 'nasse', chemin: 1, debut: 12, longueur: 3, duree: 6 },
      { vague: 6, delai: 4, type: 'renforts', x: 21, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 8, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bac', nombre: 4, intervalle: 0.6, facteurVitesse: 1.6, duree: 13 },
    ],
    foules: [
      { cases: [{ cx: 12, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 4 }, recharge: 22 },
      { cases: [{ cx: 7, cy: 6 }], condition: { type: 'payer', cout: 50 }, effet: { type: 'renforts', nombre: 3, duree: 10, unite: ETUDIANT }, recharge: 25 },
    ],
    vagues: { nombre: 10, ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_bac'], graine: 5105, niveauBudget: 25, facteurBudget: 0.65, horde: true },
  },
  {
    numero: 6,
    carte: 'parvis',
    chemins: [0, 1],
    aretesDepart: 1400,
    defiFer: { familles: ['caserne', 'artillerie'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.06.nom',
    ambiance: 'niveau.m1.06.ambiance',
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 3, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 4, delai: 9, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 14 },
      { vague: 8, delai: 6, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 10, delai: 5, type: 'renforts', x: 20, y: 7, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 4 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'bloquer', chemin: 0, debut: 20, longueur: 3, duree: 5 }, recharge: 25 },
      { cases: [{ cx: 13, cy: 5 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: { nombre: 11, ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd'], graine: 5106, niveauBudget: 26, facteurBudget: 0.45 },
  },
  {
    numero: 7,
    carte: 'piquet',
    chemins: [0, 1],
    aretesDepart: 1200,
    defiFer: { familles: ['tir', 'caserne'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.07.nom',
    ambiance: 'niveau.m1.07.ambiance',
    evenements: [
      { vague: 3, delai: 6, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
      { vague: 6, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 13 },
      { vague: 8, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 9, delai: 10, type: 'nasse', chemin: 1, debut: 4, longueur: 3, duree: 5 },
    ],
    foules: [
      { cases: [{ cx: 9, cy: 5 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 8, cy: 2 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 1, debut: 2, longueur: 3, duree: 6 }, recharge: 30 },
    ],
    vagues: { nombre: 11, ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm'], graine: 5107, niveauBudget: 27, facteurBudget: 0.46 },
  },
  {
    numero: 8,
    carte: 'assemblee',
    chemins: [0, 1, 2],
    aretesDepart: 1500,
    defiFer: { familles: ['caserne', 'tir'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.08.nom',
    ambiance: 'niveau.m1.08.ambiance',
    cheminsFermes: [{ chemin: 2, repli: 1 }],
    evenements: [
      { vague: 2, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme', nombre: 5, intervalle: 0.6, facteurVitesse: 1.8, duree: 20 },
      { vague: 4, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 6, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 7, delai: 6, type: 'renforts', x: 25, y: 13, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 11, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 13 },
    ],
    foules: [
      { cases: [{ cx: 11, cy: 3 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 25 },
      { cases: [{ cx: 8, cy: 7 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'bloquer', chemin: 1, debut: 15, longueur: 3, duree: 5 }, recharge: 8, utilisations: 3 },
      { cases: [{ cx: 12, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 25 },
    ],
    vagues: {
      nombre: 12,
      ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_drone'],
      graine: 5108,
      niveauBudget: 28,
      facteurBudget: 0.38,
    },
  },
  {
    numero: 9,
    carte: 'hall',
    chemins: [0, 1],
    aretesDepart: 1800,
    defiFer: { familles: ['artillerie', 'tir'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.09.nom',
    ambiance: 'niveau.m1.09.ambiance',
    evenements: [
      { vague: 2, delai: 8, type: 'nasse', chemin: 0, debut: 30, longueur: 3, duree: 6 },
      { vague: 4, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
      { vague: 5, delai: 6, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 38 },
      { vague: 9, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 10, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 4 },
      { vague: 11, delai: 5, type: 'renforts', x: 20, y: 15, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 2 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 14, cy: 3 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'bloquer', chemin: 0, debut: 54, longueur: 3, duree: 5 }, recharge: 30 },
      { cases: [{ cx: 12, cy: 2 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 12,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_commissaire', 'moderne_bouclier_anti_emeute'],
      graine: 5109,
      niveauBudget: 29,
      facteurBudget: 0.32,
    },
  },
  {
    numero: 10,
    carte: 'rectorat',
    chemins: [0, 1, 2],
    aretesDepart: 3000,
    defiFer: { familles: ['magie', 'tir'], facteurEffectifs: 0.9 },
    nom: 'niveau.m1.10.nom',
    ambiance: 'niveau.m1.10.ambiance',
    cheminsFermes: [{ chemin: 2, repli: 1 }],
    // Le Commissaire Divisionnaire entre à la vague 13 (chemin 0) : les étudiants descendent l'accueillir (renforts), son escorte de CRS
    // prend le chemin du sud (ouvert dès la vague 6 : on a eu le temps d'y bâtir), le canon à eau balaie la ligne, une nasse coupe le chemin du sud-ouest et la BRAV-M ferme la marche.
    evenements: [
      { vague: 3, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 20 },
      { vague: 5, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 6, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 7, delai: 5, type: 'nasse', chemin: 0, debut: 14, longueur: 3, duree: 6 },
      { vague: 9, delai: 6, type: 'renforts', x: 18, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 13, delai: 4, type: 'renforts', x: 24, y: 9, nombre: 4, duree: 15, unite: ETUDIANT },
      { vague: 13, delai: 8, type: 'charge', chemin: 2, ennemi: 'moderne_crs', nombre: 4, intervalle: 0.9, facteurVitesse: 1.5, duree: 11 },
      { vague: 13, delai: 14, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 2 },
      { vague: 13, delai: 20, type: 'nasse', chemin: 1, debut: 8, longueur: 3, duree: 6 },
      { vague: 13, delai: 30, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 13 },
    ],
    foules: [
      { cases: [{ cx: 12, cy: 3 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 6, cy: 6 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'bloquer', chemin: 1, debut: 8, longueur: 3, duree: 6 }, recharge: 8, utilisations: 3 },
      { cases: [{ cx: 11, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 14, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_drone', 'moderne_commissaire', 'moderne_bouclier_anti_emeute', 'moderne_canon_a_eau'],
      graine: 5110,
      niveauBudget: 30,
      facteurBudget: 0.18,
      boss: { vague: 13, ennemi: 'moderne_commissaire_boss', chemin: 0, delai: 6 },
    },
  },
];
