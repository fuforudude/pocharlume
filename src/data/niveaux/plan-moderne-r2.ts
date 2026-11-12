// Plan des 10 niveaux de la Manif (DLC « Temps modernes », région 2 : niveaux 11 à 20 de la campagne `moderne`, spec
// docs/specs/2026-11-12-dlc-temps-modernes-campagne.md, tâche 5). Même forme que la Fac (plan-moderne-r1.ts) : les vagues sont générées par
// `npm run niveaux -- moderne` depuis ce plan et figées dans vagues-moderne-r2.ts ; une carte neuve par niveau (cartes-moderne-r2.ts).
//
// La difficulté prend la suite de la Fac : tous les ennemis de la Fac sont connus, leur mélange s'élargit et leur nombre monte (13 à 15
// vagues, budget annoncé L = 31 à 40). Trois ennemis du DLC qui manquaient à la Fac arrivent un à un : le Cavalier de la Police Montée
// (niveau 13), l'Hélicoptère (niveau 16), le Centaure (niveau 18), avant le Grand Centaure (boss, niveau 20).
// Ce qui est mis en avant, comme le demande la région :
// - le cortège qui avance : six cartes bougent (12, 14, 16, 17, 19, 20) ; une rue qui s'ouvre reste ouverte au moins 5 vagues ou jusqu'à
//   la fin (règle de l'étudiant) ; une rue fermée par le cortège se replie sur une rue voisine ;
// - les charges (deux par niveau ou plus), écrites avec `duree` jusqu'au milieu du chemin à l'allure normale (l'accélération, courte,
//   prend la valeur par défaut : pas de `dureeVitesse`) ;
// - les nasses (une ou plusieurs par niveau, trois au niveau 15, « la Nasse ») ;
// - les canons à eau (événements sur des lignes que traverse un chemin ; trois au niveau 18, quatre au boss).
//
// Foules : à chaque niveau, au moins deux, à payer ou à tenir avec le héros, pour ralentir (toujours à côté d'un chemin qui ne bouge
// pas), envoyer des renforts ou bloquer (toujours avec une recharge au moins égale à la durée de la coupure).
// `aretesDepart` et `facteurBudget` : une première estimation prudente, posée sur un seul essai du bot soigneux en Matou par niveau ;
// la tâche 7 les règle contre les bandes imposées.
// `defiFer` : une famille qui touche les volants (tir ou magie) dès qu'il y a drones ou hélicoptères, la tour de tir avec la BAC
// (furtive), jamais la même paire deux niveaux de suite.
import type { IdCarteModerneR2 } from './cartes-moderne-r2';
import type { PlanNiveauModerne } from './plan-moderne-r1';

const ETUDIANT = 'etudiant';

export const PLANS_MODERNE_R2: readonly PlanNiveauModerne<IdCarteModerneR2>[] = [
  {
    numero: 11,
    carte: 'rendez_vous',
    chemins: [0, 1],
    aretesDepart: 1500,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.m2.01.nom',
    ambiance: 'niveau.m2.01.ambiance',
    evenements: [
      { vague: 3, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 21 },
      { vague: 5, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 7, delai: 6, type: 'nasse', chemin: 0, debut: 6, longueur: 3, duree: 6 },
      { vague: 9, delai: 5, type: 'renforts', x: 21, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 11, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 12 },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 2 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 10, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_canon_a_eau'],
      graine: 5111,
      niveauBudget: 31,
      facteurBudget: 0.18,
    },
  },
  {
    numero: 12,
    carte: 'boulevard',
    chemins: [0, 1],
    aretesDepart: 1500,
    defiFer: { familles: ['magie', 'artillerie'] },
    nom: 'niveau.m2.02.nom',
    ambiance: 'niveau.m2.02.ambiance',
    // Le cortège avance : la rue latérale du sud s'ouvre à la vague 4 et reste ouverte jusqu'à la fin.
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 4, delai: 9, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 14 },
      { vague: 7, delai: 6, type: 'canon_a_eau', cy: 6, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 9, delai: 6, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 11, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 27 },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 0 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'bloquer', chemin: 0, debut: 20, longueur: 3, duree: 5 }, recharge: 25 },
      { cases: [{ cx: 11, cy: 3 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 5 }, recharge: 25 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_canon_a_eau'],
      graine: 5112,
      niveauBudget: 32,
      facteurBudget: 0.19,
    },
  },
  {
    numero: 13,
    carte: 'carrefour',
    chemins: [0, 1],
    aretesDepart: 1600,
    defiFer: { familles: ['caserne', 'artillerie'] },
    nom: 'niveau.m2.03.nom',
    ambiance: 'niveau.m2.03.ambiance',
    evenements: [
      { vague: 3, delai: 6, type: 'nasse', chemin: 0, debut: 8, longueur: 3, duree: 6 },
      { vague: 5, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_cavalier_monte', nombre: 2, intervalle: 0.8, facteurVitesse: 1.4, duree: 9 },
      { vague: 6, delai: 8, type: 'canon_a_eau', cy: 2, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 8, delai: 6, type: 'nasse', chemin: 1, debut: 6, longueur: 3, duree: 6 },
      { vague: 10, delai: 5, type: 'renforts', x: 21, y: 13, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 12, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 11 },
    ],
    foules: [
      { cases: [{ cx: 8, cy: 4 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 25 },
      { cases: [{ cx: 3, cy: 2 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 0, debut: 4, longueur: 3, duree: 6 }, recharge: 30 },
      { cases: [{ cx: 12, cy: 5 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
    ],
    vagues: {
      nombre: 13,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte'],
      graine: 5113,
      niveauBudget: 33,
      facteurBudget: 0.2,
    },
  },
  {
    numero: 14,
    carte: 'abribus',
    chemins: [0, 1],
    aretesDepart: 1900,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.m2.04.nom',
    ambiance: 'niveau.m2.04.ambiance',
    // Le cortège bloque la rue du nord des vagues 5 à 9 : les forces passent par le sud, puis la rue rouvre jusqu'à la fin.
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 21 },
      { vague: 5, delai: 3, type: 'fermer_chemin', chemin: 0, repli: 1 },
      { vague: 6, delai: 6, type: 'canon_a_eau', cy: 7, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 7, delai: 6, type: 'nasse', chemin: 1, debut: 12, longueur: 3, duree: 6 },
      { vague: 9, delai: 3, type: 'ouvrir_chemin', chemin: 0 },
      { vague: 10, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 12 },
      { vague: 12, delai: 6, type: 'renforts', x: 25, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 6 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 2, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'bloquer', chemin: 1, debut: 10, longueur: 3, duree: 5 }, recharge: 25 },
      { cases: [{ cx: 10, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 14,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_drone', 'moderne_cavalier_monte', 'moderne_canon_a_eau'],
      graine: 5114,
      niveauBudget: 34,
      facteurBudget: 0.19,
    },
  },
  {
    numero: 15,
    carte: 'nasse',
    chemins: [0, 1],
    aretesDepart: 1500,
    defiFer: { familles: ['tir', 'caserne'] },
    nom: 'niveau.m2.05.nom',
    ambiance: 'niveau.m2.05.ambiance',
    evenements: [
      { vague: 2, delai: 6, type: 'nasse', chemin: 1, debut: 8, longueur: 3, duree: 5 },
      { vague: 4, delai: 6, type: 'charge', chemin: 0, ennemi: 'moderne_bac', nombre: 5, intervalle: 0.5, facteurVitesse: 1.6, duree: 21 },
      { vague: 6, delai: 6, type: 'nasse', chemin: 0, debut: 8, longueur: 3, duree: 5 },
      { vague: 8, delai: 5, type: 'renforts', x: 15, y: 9, nombre: 4, duree: 12, unite: ETUDIANT },
      { vague: 10, delai: 6, type: 'nasse', chemin: 0, debut: 30, longueur: 3, duree: 6 },
      { vague: 12, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 14 },
    ],
    foules: [
      { cases: [{ cx: 9, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 5 }, recharge: 22 },
      { cases: [{ cx: 12, cy: 4 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 25 },
      { cases: [{ cx: 1, cy: 1 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'bloquer', chemin: 0, debut: 30, longueur: 3, duree: 5 }, recharge: 20 },
    ],
    vagues: {
      nombre: 14,
      ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_bac', 'moderne_bravm', 'moderne_drone', 'moderne_cavalier_monte'],
      graine: 5115,
      niveauBudget: 35,
      facteurBudget: 0.3,
      horde: true,
    },
  },
  {
    numero: 16,
    carte: 'republique',
    chemins: [0, 1, 2],
    aretesDepart: 1700,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.m2.06.nom',
    ambiance: 'niveau.m2.06.ambiance',
    // Les barrières de la rue du nord cèdent à la vague 6 : elle reste ouverte jusqu'à la fin.
    cheminsFermes: [{ chemin: 2, repli: 0 }],
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 20 },
      { vague: 6, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 6, delai: 10, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 2, intervalle: 0.8, facteurVitesse: 1.4, duree: 9 },
      { vague: 8, delai: 6, type: 'nasse', chemin: 0, debut: 6, longueur: 3, duree: 6 },
      { vague: 10, delai: 6, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 12, delai: 5, type: 'renforts', x: 21, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 4, cy: 2 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 2, cy: 7 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 1, debut: 10, longueur: 3, duree: 6 }, recharge: 30 },
      { cases: [{ cx: 12, cy: 3 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 25 },
    ],
    vagues: {
      nombre: 14,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_helicoptere'],
      graine: 5116,
      niveauBudget: 36,
      facteurBudget: 0.2,
    },
  },
  {
    numero: 17,
    carte: 'cortege',
    chemins: [0, 1, 2],
    aretesDepart: 1800,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.m2.07.nom',
    ambiance: 'niveau.m2.07.ambiance',
    // Le cortège de tête avance : la grande rue s'ouvre devant lui à la vague 3 (jusqu'à la fin), puis il occupe la rue du nord de la
    // vague 9 à la vague 11 (ses groupes passent alors par la grande rue) ; elle rouvre à la vague 12. La rue du sud ne bouge pas.
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 3, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 3, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 18 },
      { vague: 5, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 7, delai: 6, type: 'nasse', chemin: 2, debut: 6, longueur: 3, duree: 6 },
      { vague: 9, delai: 3, type: 'fermer_chemin', chemin: 0, repli: 1 },
      { vague: 10, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 8 },
      { vague: 12, delai: 3, type: 'ouvrir_chemin', chemin: 0 },
      { vague: 12, delai: 6, type: 'canon_a_eau', cy: 6, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 13, delai: 5, type: 'renforts', x: 19, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 8, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 4, cy: 7 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 30 },
      { cases: [{ cx: 1, cy: 7 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'bloquer', chemin: 2, debut: 8, longueur: 3, duree: 6 }, recharge: 10, utilisations: 3 },
    ],
    vagues: {
      nombre: 15,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_drone', 'moderne_cavalier_monte', 'moderne_canon_a_eau'],
      graine: 5117,
      niveauBudget: 37,
      facteurBudget: 0.19,
    },
  },
  {
    numero: 18,
    carte: 'camionnettes',
    chemins: [0, 1],
    aretesDepart: 1800,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.m2.08.nom',
    ambiance: 'niveau.m2.08.ambiance',
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 2, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 24 },
      { vague: 6, delai: 8, type: 'canon_a_eau', cy: 6, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 8, delai: 6, type: 'nasse', chemin: 0, debut: 12, longueur: 3, duree: 6 },
      { vague: 10, delai: 8, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 12, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 18 },
      { vague: 13, delai: 5, type: 'renforts', x: 29, y: 13, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 5, cy: 7 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 1, debut: 6, longueur: 3, duree: 6 }, recharge: 30 },
      { cases: [{ cx: 14, cy: 4 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 25 },
    ],
    vagues: {
      nombre: 15,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_helicoptere', 'moderne_canon_a_eau', 'moderne_centaure'],
      graine: 5118,
      niveauBudget: 38,
      facteurBudget: 0.2,
    },
  },
  {
    numero: 19,
    carte: 'paves',
    chemins: [0, 1, 2],
    aretesDepart: 2000,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.m2.09.nom',
    ambiance: 'niveau.m2.09.ambiance',
    // La ruelle du sud (chemin 2) s'ouvre à la vague 5 et reste ouverte jusqu'à la fin ; la foule prend la rue du sud (chemin 1) aux
    // vagues 11 et 12 : ses groupes repassent par la rue du nord ; la rue rouvre à la vague 13.
    cheminsFermes: [{ chemin: 2, repli: 1 }],
    evenements: [
      { vague: 2, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 24 },
      { vague: 4, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 6, delai: 8, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 7 },
      { vague: 8, delai: 6, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 9, delai: 6, type: 'canon_a_eau', cy: 7, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 11, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
      { vague: 12, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 25 },
      { vague: 13, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 13, delai: 5, type: 'renforts', x: 13, y: 3, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 2 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 6, cy: 1 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 30 },
      { cases: [{ cx: 11, cy: 3 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'bloquer', chemin: 0, debut: 20, longueur: 3, duree: 6 }, recharge: 25 },
    ],
    vagues: {
      nombre: 15,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_drone', 'moderne_helicoptere', 'moderne_centaure'],
      graine: 5119,
      niveauBudget: 39,
      facteurBudget: 0.21,
    },
  },
  {
    numero: 20,
    carte: 'grand_carrefour',
    chemins: [0, 1, 2],
    aretesDepart: 3600,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.m2.10.nom',
    ambiance: 'niveau.m2.10.ambiance',
    cheminsFermes: [{ chemin: 2, repli: 1 }],
    // Le boulevard du sud s'ouvre à mi-niveau (vague 7, jusqu'à la fin). Le Grand Centaure entre à la vague 15 par le nord-ouest
    // (chemin 0) : les étudiants se massent sur le carrefour (renforts), son canon à eau balaie la ligne deux fois, la police montée
    // l'escorte par le sud, une nasse coupe le boulevard du sud-ouest et la BRAV-M ferme la marche.
    evenements: [
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 20 },
      { vague: 6, delai: 6, type: 'nasse', chemin: 0, debut: 8, longueur: 3, duree: 6 },
      { vague: 7, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 8, delai: 8, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 8 },
      { vague: 10, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 12, delai: 6, type: 'renforts', x: 17, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 13, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 12 },
      { vague: 15, delai: 4, type: 'renforts', x: 23, y: 9, nombre: 4, duree: 15, unite: ETUDIANT },
      { vague: 15, delai: 10, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 2 },
      { vague: 15, delai: 14, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 8 },
      { vague: 15, delai: 20, type: 'nasse', chemin: 1, debut: 8, longueur: 3, duree: 6 },
      { vague: 15, delai: 26, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 2 },
      { vague: 15, delai: 32, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 11 },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 2 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 2, cy: 5 }], condition: { type: 'payer', cout: 100 }, effet: { type: 'bloquer', chemin: 1, debut: 8, longueur: 3, duree: 6 }, recharge: 10, utilisations: 3 },
      { cases: [{ cx: 8, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 14, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 15,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_drone', 'moderne_helicoptere', 'moderne_canon_a_eau', 'moderne_centaure'],
      graine: 5120,
      niveauBudget: 40,
      facteurBudget: 0.12,
      boss: { vague: 15, ennemi: 'moderne_centaure_boss', chemin: 0, delai: 6 },
    },
  },
];
