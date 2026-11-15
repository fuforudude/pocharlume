// Plan des 10 niveaux de la Manif (DLC « Temps modernes », région 2 : niveaux 11 à 20 de la campagne `moderne`, spec
// docs/specs/2026-11-12-dlc-temps-modernes-campagne.md, tâche 5). Même forme que la Fac (plan-moderne-r1.ts) : les vagues sont générées par
// `npm run niveaux -- moderne` depuis ce plan et figées dans vagues-moderne-r2.ts ; une carte neuve par niveau (cartes-moderne-r2.ts).
//
// La difficulté prend la suite de la Fac : tous les ennemis de la Fac sont connus, leur mélange s'élargit et leur nombre monte (8 à 10
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
// Réglage de la tâche 7 (équilibrage du DLC, région 2) :
// - Fer propre à la région, qui le réussissait à 100 % : `facteurAretes` 4 et `facteurEffectifs` 0,8 (3,5 et 1 aux niveaux 16, 18 et 19 ;
//   3 et 1,3 aux niveaux 12 et 13) au lieu de 6 et 0,36.
// - Budgets des vagues 11 à 19 inchangés : relevés de 10 à 30 % (ou avec 300 arêtes de départ de moins), ils ne retiraient presque rien au
//   naïf en Matou mais faisaient tomber l'Héroïque (bande imposée) de 70 à 50 % environ.
// - Niveau 20 : 24 000 arêtes de départ, budget des vagues inchangé (0,21). Le Grand Centaure (armure 90 %, 16 000 PV) est un contrôle de
//   puissance : il ne meurt qu'à une défense percée et très améliorée. Mesures en Matou, dix graines, trois dieux : la stratégie
//   perce-armure ne le tue qu'avec environ 16 000 arêtes (Plume), 20 000 (Charlie) et 24 000 (Pollen) ; alléger les vagues 8 à 14 lui retire
//   des primes sans rien lui rendre. Fer du niveau : 24 000 × 0,55 ≈ 13 200 arêtes (comme avant), effectifs × 0,7. Le bot générique, lui,
//   laissait passer le boss (12 vies sur 20) : un boss du DLC coûte désormais 20 vies, voir
//   src/equilibrage/boss-moderne.test.ts.
// Rythme plus nerveux (spec docs/specs/2026-11-15-dlc-rythme.md), qui remplace les nombres ci-dessus :
// - 8 vagues aux niveaux 11 à 13, 9 aux niveaux 14 à 16, 10 aux niveaux 17 à 20 (13, 14 et 15 avant). `facteurBudget` multiplié par
//   S(avant) / S(après), où S(N) = N + 0,6 N (N − 1) est la somme des (1 + 1,2 (w − 1)) de budgetVague : × 2,56, × 2,36 et × 2,20. La
//   menace totale de chaque niveau reste ainsi à ±5 % de celle d'avant (src/data/niveaux/rythme-moderne-r2.test.ts), et les primes avec.
// - Événements replacés à la même proportion du niveau (vague × nouveau nombre / ancien, arrondi), dans le même ordre ; au niveau 19 le
//   canon de la vague 5 passe au délai 10 (après la nasse de la même vague), et la rue du sud y rouvre à la vague 8 (2 vagues avant la fin).
// - Niveau 16 : graine 6216 au lieu de 5116, la seule façon de garder l'Hélicoptère à ce niveau (avec 9 vagues, la graine d'avant ne le
//   tirait plus) ; il arrive à la vague 6 sur 9 (10 sur 14 avant).
// - Vagues plus denses, donc dernières vagues plus lourdes : l'Héroïque tombait à 33 % (bande 40 à 90 %). Arêtes de départ × 1,4 aux niveaux
//   11 à 19 (Héroïque remonté vers 60 %), et `facteurAretes` du défi Fer divisé d'autant (2,9 ; 2,5 aux niveaux 16, 18, 19 ; 2,1 aux
//   niveaux 12 et 13) : le Fer garde les mêmes arêtes qu'avant (il montait à 94 %, au-dessus de la bande).
// - Niveau 20 : 24 000 arêtes de départ et Fer inchangés, `facteurBudget` 0,46 ; le perce-armure tue toujours le Grand Centaure.
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
    aretesDepart: 2100,
    defiFer: { familles: ['caserne', 'tir'], facteurAretes: 2.9, facteurEffectifs: 0.8 },
    nom: 'niveau.m2.01.nom',
    ambiance: 'niveau.m2.01.ambiance',
    evenements: [
      { vague: 2, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 21 },
      { vague: 3, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 4, delai: 6, type: 'nasse', chemin: 0, debut: 6, longueur: 3, duree: 6 },
      { vague: 6, delai: 5, type: 'renforts', x: 21, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 12 },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 2 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 10, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 8,
      ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_canon_a_eau'],
      graine: 5111,
      niveauBudget: 31,
      facteurBudget: 0.46,
    },
  },
  {
    numero: 12,
    carte: 'boulevard',
    chemins: [0, 1],
    aretesDepart: 2100,
    defiFer: { familles: ['magie', 'artillerie'], facteurAretes: 2.1, facteurEffectifs: 1.3 },
    nom: 'niveau.m2.02.nom',
    ambiance: 'niveau.m2.02.ambiance',
    // Le cortège avance : la rue latérale du sud s'ouvre à la vague 2 et reste ouverte jusqu'à la fin.
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 1, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 2, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 2, delai: 9, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 14 },
      { vague: 4, delai: 6, type: 'canon_a_eau', cy: 6, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 6, delai: 6, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 27 },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 0 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'bloquer', chemin: 0, debut: 20, longueur: 3, duree: 5 }, recharge: 25 },
      { cases: [{ cx: 11, cy: 3 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 5 }, recharge: 25 },
    ],
    vagues: {
      nombre: 8,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_canon_a_eau'],
      graine: 5112,
      niveauBudget: 32,
      facteurBudget: 0.49,
    },
  },
  {
    numero: 13,
    carte: 'carrefour_manif',
    chemins: [0, 1],
    aretesDepart: 2250,
    defiFer: { familles: ['caserne', 'artillerie'], facteurAretes: 2.1, facteurEffectifs: 1.3 },
    nom: 'niveau.m2.03.nom',
    ambiance: 'niveau.m2.03.ambiance',
    evenements: [
      { vague: 2, delai: 6, type: 'nasse', chemin: 0, debut: 8, longueur: 3, duree: 6 },
      { vague: 3, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_cavalier_monte', nombre: 2, intervalle: 0.8, facteurVitesse: 1.4, duree: 9 },
      { vague: 4, delai: 8, type: 'canon_a_eau', cy: 2, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 1, debut: 6, longueur: 3, duree: 6 },
      { vague: 6, delai: 5, type: 'renforts', x: 21, y: 13, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 11 },
    ],
    foules: [
      { cases: [{ cx: 8, cy: 4 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 25 },
      { cases: [{ cx: 3, cy: 2 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 0, debut: 4, longueur: 3, duree: 6 }, recharge: 30 },
      { cases: [{ cx: 12, cy: 5 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
    ],
    vagues: {
      nombre: 8,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte'],
      graine: 5113,
      niveauBudget: 33,
      facteurBudget: 0.51,
    },
  },
  {
    numero: 14,
    carte: 'abribus',
    chemins: [0, 1],
    aretesDepart: 2650,
    defiFer: { familles: ['tir', 'magie'], facteurAretes: 2.9, facteurEffectifs: 0.8 },
    nom: 'niveau.m2.04.nom',
    ambiance: 'niveau.m2.04.ambiance',
    // Le cortège bloque la rue du nord des vagues 3 à 6 : les forces passent par le sud, puis la rue rouvre jusqu'à la fin.
    evenements: [
      { vague: 1, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 2, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 21 },
      { vague: 3, delai: 3, type: 'fermer_chemin', chemin: 0, repli: 1 },
      { vague: 4, delai: 6, type: 'canon_a_eau', cy: 7, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 1, debut: 12, longueur: 3, duree: 6 },
      { vague: 6, delai: 3, type: 'ouvrir_chemin', chemin: 0 },
      { vague: 6, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 12 },
      { vague: 8, delai: 6, type: 'renforts', x: 25, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 6 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 2, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'bloquer', chemin: 1, debut: 10, longueur: 3, duree: 5 }, recharge: 25 },
      { cases: [{ cx: 10, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 9,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_drone', 'moderne_cavalier_monte', 'moderne_canon_a_eau'],
      graine: 5114,
      niveauBudget: 34,
      facteurBudget: 0.45,
    },
  },
  {
    numero: 15,
    carte: 'nasse',
    chemins: [0, 1],
    aretesDepart: 2100,
    defiFer: { familles: ['tir', 'caserne'], facteurAretes: 2.9, facteurEffectifs: 0.8 },
    nom: 'niveau.m2.05.nom',
    ambiance: 'niveau.m2.05.ambiance',
    evenements: [
      { vague: 1, delai: 6, type: 'nasse', chemin: 1, debut: 8, longueur: 3, duree: 5 },
      { vague: 3, delai: 6, type: 'charge', chemin: 0, ennemi: 'moderne_bac', nombre: 5, intervalle: 0.5, facteurVitesse: 1.6, duree: 21 },
      { vague: 4, delai: 6, type: 'nasse', chemin: 0, debut: 8, longueur: 3, duree: 5 },
      { vague: 5, delai: 5, type: 'renforts', x: 15, y: 9, nombre: 4, duree: 12, unite: ETUDIANT },
      { vague: 6, delai: 6, type: 'nasse', chemin: 0, debut: 30, longueur: 3, duree: 6 },
      { vague: 8, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 14 },
    ],
    foules: [
      { cases: [{ cx: 9, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.45, duree: 5 }, recharge: 22 },
      { cases: [{ cx: 12, cy: 4 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 25 },
      { cases: [{ cx: 1, cy: 1 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'bloquer', chemin: 0, debut: 30, longueur: 3, duree: 5 }, recharge: 20 },
    ],
    vagues: {
      nombre: 9,
      ennemis: ['moderne_gendarme', 'moderne_gendarme_mobile', 'moderne_bac', 'moderne_bravm', 'moderne_drone', 'moderne_cavalier_monte'],
      graine: 5115,
      niveauBudget: 35,
      facteurBudget: 0.71,
      horde: true,
    },
  },
  {
    numero: 16,
    carte: 'republique',
    chemins: [0, 1, 2],
    aretesDepart: 2400,
    defiFer: { familles: ['artillerie', 'tir'], facteurAretes: 2.5, facteurEffectifs: 1 },
    nom: 'niveau.m2.06.nom',
    ambiance: 'niveau.m2.06.ambiance',
    // Les barrières de la rue du nord cèdent à la vague 4 : elle reste ouverte jusqu'à la fin.
    cheminsFermes: [{ chemin: 2, repli: 0 }],
    evenements: [
      { vague: 1, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 3, delai: 6, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 20 },
      { vague: 4, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 4, delai: 10, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 2, intervalle: 0.8, facteurVitesse: 1.4, duree: 9 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 0, debut: 6, longueur: 3, duree: 6 },
      { vague: 6, delai: 6, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 8, delai: 5, type: 'renforts', x: 21, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 4, cy: 2 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 2, cy: 7 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 1, debut: 10, longueur: 3, duree: 6 }, recharge: 30 },
      { cases: [{ cx: 12, cy: 3 }], condition: { type: 'payer', cout: 70 }, effet: { type: 'renforts', nombre: 3, duree: 12, unite: ETUDIANT }, recharge: 25 },
    ],
    vagues: {
      nombre: 9,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_helicoptere'],
      graine: 6216,
      niveauBudget: 36,
      facteurBudget: 0.47,
    },
  },
  {
    numero: 17,
    carte: 'cortege',
    chemins: [0, 1, 2],
    aretesDepart: 2500,
    defiFer: { familles: ['magie', 'tir'], facteurAretes: 2.9, facteurEffectifs: 0.8 },
    nom: 'niveau.m2.07.nom',
    ambiance: 'niveau.m2.07.ambiance',
    // Le cortège de tête avance : la grande rue s'ouvre devant lui à la vague 2 (jusqu'à la fin), puis il occupe la rue du nord de la
    // vague 6 à la vague 7 (ses groupes passent alors par la grande rue) ; elle rouvre à la vague 8. La rue du sud ne bouge pas.
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    evenements: [
      { vague: 2, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 2, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 18 },
      { vague: 3, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 2, debut: 6, longueur: 3, duree: 6 },
      { vague: 6, delai: 3, type: 'fermer_chemin', chemin: 0, repli: 1 },
      { vague: 7, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 8 },
      { vague: 8, delai: 3, type: 'ouvrir_chemin', chemin: 0 },
      { vague: 8, delai: 6, type: 'canon_a_eau', cy: 6, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 9, delai: 5, type: 'renforts', x: 19, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 8, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 4, cy: 7 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 30 },
      { cases: [{ cx: 1, cy: 7 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'bloquer', chemin: 2, debut: 8, longueur: 3, duree: 6 }, recharge: 10, utilisations: 3 },
    ],
    vagues: {
      nombre: 10,
      ennemis: ['moderne_gendarme_mobile', 'moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_drone', 'moderne_cavalier_monte', 'moderne_canon_a_eau'],
      graine: 5117,
      niveauBudget: 37,
      facteurBudget: 0.42,
    },
  },
  {
    numero: 18,
    carte: 'camionnettes',
    chemins: [0, 1],
    aretesDepart: 2500,
    defiFer: { familles: ['caserne', 'magie'], facteurAretes: 2.5, facteurEffectifs: 1 },
    nom: 'niveau.m2.08.nom',
    ambiance: 'niveau.m2.08.ambiance',
    evenements: [
      { vague: 1, delai: 8, type: 'canon_a_eau', cy: 2, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 3, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 24 },
      { vague: 4, delai: 8, type: 'canon_a_eau', cy: 6, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 0, debut: 12, longueur: 3, duree: 6 },
      { vague: 7, delai: 8, type: 'canon_a_eau', cy: 7, sens: 1, recul: 3, etourdissement: 2 },
      { vague: 8, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 18 },
      { vague: 9, delai: 5, type: 'renforts', x: 29, y: 13, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 5 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 5, cy: 7 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'bloquer', chemin: 1, debut: 6, longueur: 3, duree: 6 }, recharge: 30 },
      { cases: [{ cx: 14, cy: 4 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 25 },
    ],
    vagues: {
      nombre: 10,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_helicoptere', 'moderne_canon_a_eau', 'moderne_centaure'],
      graine: 5118,
      niveauBudget: 38,
      facteurBudget: 0.44,
    },
  },
  {
    numero: 19,
    carte: 'paves',
    chemins: [0, 1, 2],
    aretesDepart: 2800,
    defiFer: { familles: ['tir', 'artillerie'], facteurAretes: 2.5, facteurEffectifs: 1 },
    nom: 'niveau.m2.09.nom',
    ambiance: 'niveau.m2.09.ambiance',
    // La ruelle du sud (chemin 2) s'ouvre à la vague 3 et reste ouverte jusqu'à la fin ; la foule prend la rue du sud (chemin 1) aux
    // vagues 6 et 7 : ses groupes repassent par la rue du nord ; la rue rouvre à la vague 8.
    cheminsFermes: [{ chemin: 2, repli: 1 }],
    evenements: [
      { vague: 1, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_gendarme_mobile', nombre: 4, intervalle: 0.8, facteurVitesse: 1.7, duree: 24 },
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 3, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 4, delai: 8, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 7 },
      { vague: 5, delai: 6, type: 'nasse', chemin: 0, debut: 10, longueur: 3, duree: 6 },
      { vague: 5, delai: 10, type: 'canon_a_eau', cy: 7, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 6, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
      { vague: 7, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 25 },
      { vague: 8, delai: 3, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 8, delai: 5, type: 'renforts', x: 13, y: 3, nombre: 3, duree: 12, unite: ETUDIANT },
    ],
    foules: [
      { cases: [{ cx: 7, cy: 2 }], condition: { type: 'payer', cout: 80 }, effet: { type: 'ralentir', rayon: 3.5, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 6, cy: 1 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 12, unite: ETUDIANT }, recharge: 30 },
      { cases: [{ cx: 11, cy: 3 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'bloquer', chemin: 0, debut: 20, longueur: 3, duree: 6 }, recharge: 25 },
    ],
    vagues: {
      nombre: 10,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bac', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_drone', 'moderne_helicoptere', 'moderne_centaure'],
      graine: 5119,
      niveauBudget: 39,
      facteurBudget: 0.46,
    },
  },
  {
    numero: 20,
    carte: 'grand_carrefour',
    chemins: [0, 1, 2],
    aretesDepart: 24000,
    defiFer: { familles: ['caserne', 'magie'], facteurAretes: 0.55, facteurEffectifs: 0.7 },
    nom: 'niveau.m2.10.nom',
    ambiance: 'niveau.m2.10.ambiance',
    annonce: 'niveau.m2.10.annonce',
    cheminsFermes: [{ chemin: 2, repli: 1 }],
    // Le boulevard du sud s'ouvre à mi-niveau (vague 5, jusqu'à la fin). Le Grand Centaure entre à la vague 10 par le nord-ouest
    // (chemin 0) : les étudiants se massent sur le carrefour (renforts), son canon à eau balaie la ligne deux fois, la police montée
    // l'escorte par le sud, une nasse coupe le boulevard du sud-ouest et la BRAV-M ferme la marche.
    evenements: [
      { vague: 1, delai: 8, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 1.5 },
      { vague: 3, delai: 8, type: 'charge', chemin: 1, ennemi: 'moderne_crs', nombre: 3, intervalle: 1, facteurVitesse: 1.6, duree: 20 },
      { vague: 4, delai: 6, type: 'nasse', chemin: 0, debut: 8, longueur: 3, duree: 6 },
      { vague: 5, delai: 3, type: 'ouvrir_chemin', chemin: 2 },
      { vague: 5, delai: 8, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 8 },
      { vague: 7, delai: 8, type: 'canon_a_eau', cy: 1, sens: 1, recul: 3, etourdissement: 1.5 },
      { vague: 8, delai: 6, type: 'renforts', x: 17, y: 9, nombre: 3, duree: 12, unite: ETUDIANT },
      { vague: 9, delai: 8, type: 'charge', chemin: 0, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 12 },
      { vague: 10, delai: 4, type: 'renforts', x: 23, y: 9, nombre: 4, duree: 15, unite: ETUDIANT },
      { vague: 10, delai: 10, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 2 },
      { vague: 10, delai: 14, type: 'charge', chemin: 2, ennemi: 'moderne_cavalier_monte', nombre: 3, intervalle: 0.8, facteurVitesse: 1.4, duree: 8 },
      { vague: 10, delai: 20, type: 'nasse', chemin: 1, debut: 8, longueur: 3, duree: 6 },
      { vague: 10, delai: 26, type: 'canon_a_eau', cy: 4, sens: -1, recul: 3, etourdissement: 2 },
      { vague: 10, delai: 32, type: 'charge', chemin: 1, ennemi: 'moderne_bravm', nombre: 2, intervalle: 0.4, facteurVitesse: 1.5, duree: 11 },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 2 }], condition: { type: 'payer', cout: 90 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 5 }, recharge: 20 },
      { cases: [{ cx: 2, cy: 5 }], condition: { type: 'payer', cout: 100 }, effet: { type: 'bloquer', chemin: 1, debut: 8, longueur: 3, duree: 6 }, recharge: 10, utilisations: 3 },
      { cases: [{ cx: 8, cy: 4 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 4, duree: 14, unite: ETUDIANT }, recharge: 30 },
    ],
    vagues: {
      nombre: 10,
      ennemis: ['moderne_crs', 'moderne_tireur_lbd', 'moderne_bravm', 'moderne_grenadier_lacrymo', 'moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_cavalier_monte', 'moderne_drone', 'moderne_helicoptere', 'moderne_canon_a_eau', 'moderne_centaure'],
      graine: 5120,
      niveauBudget: 40,
      facteurBudget: 0.46,
      boss: { vague: 10, ennemi: 'moderne_centaure_boss', chemin: 0, delai: 6 },
    },
  },
];
