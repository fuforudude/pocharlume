// Formes des données de jeu lues par le moteur. Les valeurs elles-mêmes vivent dans src/data/.
// Unités : distances en tuiles (16 px logiques), durées en secondes, vitesses en tuiles par seconde,
// protections (armure, résistance) en fraction de dégâts retirés (paliers 0 / 0,3 / 0,6 / 0,9).
// Les noms (`nom`) sont des clés de src/i18n/fr.ts, vérifiées par les tests des données.

export interface Point {
  x: number;
  y: number;
}

export type TypeDegats = 'physique' | 'magique' | 'pur';
export type IdFamille = 'caserne' | 'tir' | 'magie' | 'artillerie';
export type Voie = 'A' | 'B';
export type Fourchette = readonly [number, number];

export type TypeEffet = 'ralentissement' | 'etourdissement' | 'brulure' | 'saignement' | 'poison';

/**
 * Effet appliqué par un coup, avec une chance (0 à 1) et une durée.
 * `valeur` : facteur de vitesse pour le ralentissement (0,5 = moitié), dégâts purs par seconde pour
 * brûlure, saignement et poison, ignorée pour l'étourdissement.
 */
export interface EffetCoup {
  readonly type: TypeEffet;
  readonly chance: number;
  readonly duree: number;
  readonly valeur: number;
}

export interface AttaqueDistance {
  readonly portee: number;
  readonly degats: Fourchette;
  readonly cadence: number;
  readonly typeDegats: TypeDegats;
}

export interface DefEnnemi {
  readonly nom: string;
  readonly pv: number;
  readonly vitesse: number;
  readonly armure: number;
  readonly resistance: number;
  readonly volant: boolean;
  /** Invisible des tours, soldats et héros, sauf tours qui révèlent ou ennemi révélé (poison). */
  readonly furtif: boolean;
  /** Dégâts physiques au corps-à-corps contre l'unité qui le bloque. */
  readonly degats: Fourchette;
  readonly cadence: number;
  readonly distance: AttaqueDistance | null;
  readonly coutVies: number;
  readonly prime: number;
  readonly boss: boolean;
  readonly insensibleEtourdissement: boolean;
  /** Secondes entre deux soldats dévorés (tués d'un coup) quand il est bloqué ; 0 = jamais. */
  readonly devore: number;
}

/** Stats d'une unité alliée au corps-à-corps (soldat, renfort, spectre). */
export interface StatsCombattant {
  readonly nom: string;
  readonly pv: number;
  readonly degats: Fourchette;
  readonly cadence: number;
  /** Coups portés à chaque attaque (2 pour les Écorcheurs). */
  readonly coups: number;
  readonly armure: number;
  readonly resistance: number;
  readonly vitesse: number;
  /** Rayon d'engagement autour du point de garde. */
  readonly portee: number;
  /** Ennemis bloqués en même temps (plus de 1 = provocation). */
  readonly capacite: number;
  readonly effets: readonly EffetCoup[];
}

export interface StatsSoldats extends StatsCombattant {
  readonly nombre: number;
  readonly reapparition: number;
}

export interface StatsSpectres extends StatsCombattant {
  /** Spectres vivants au plus par tour. */
  readonly max: number;
  readonly duree: number;
}

export interface Critique {
  readonly chance: number;
  readonly multiplicateur: number;
}

export interface Chaine {
  /** Ennemis touchés en plus de la cible. */
  readonly nombre: number;
  readonly rayon: number;
  /** Part des dégâts reçue par chaque ennemi enchaîné. */
  readonly facteur: number;
}

/** Un niveau de tour (1 à 3, ou une spécialisation). Champs à 0 ou null quand ils ne servent pas. */
export interface DefNiveauTour {
  readonly nom: string;
  /** Prix de ce niveau (construction ou amélioration). */
  readonly cout: number;
  /** Portée de tir ; pour une caserne, distance max du point de ralliement à la tour. */
  readonly portee: number;
  readonly cadence: number;
  readonly degats: Fourchette;
  readonly typeDegats: TypeDegats;
  /** Vitesse du projectile ; 0 = coup instantané (rayon). */
  readonly projectile: number;
  /** Rayon des dégâts à l'impact ; 0 = une seule cible. */
  readonly zone: number;
  readonly volants: boolean;
  readonly effets: readonly EffetCoup[];
  readonly critique: Critique | null;
  /** Voit et révèle les furtifs. */
  readonly revele: boolean;
  readonly chaine: Chaine | null;
  readonly soldats: StatsSoldats | null;
  readonly spectres: StatsSpectres | null;
  /** Onde de choc autour de la tour (tour divine) au lieu d'un tir. */
  readonly onde: boolean;
}

export interface DefFamille {
  readonly id: IdFamille;
  readonly niveaux: readonly [DefNiveauTour, DefNiveauTour, DefNiveauTour];
  readonly specialisations: Readonly<Record<Voie, DefNiveauTour>>;
}

export interface ZoneHeros {
  readonly rayon: number;
  readonly effets: readonly EffetCoup[];
}

export interface DefHeros {
  readonly nom: string;
  readonly pv: number;
  readonly pvParNiveau: number;
  readonly degats: Fourchette;
  readonly degatsParNiveau: number;
  readonly cadence: number;
  readonly armure: number;
  readonly resistance: number;
  readonly vitesse: number;
  readonly portee: number;
  readonly capacite: number;
  readonly effets: readonly EffetCoup[];
  /** Frappe de zone autour de la cible ; null = une seule cible. */
  readonly zone: ZoneHeros | null;
}

export type EffetSort =
  | { readonly type: 'degats'; readonly degats: Fourchette; readonly typeDegats: TypeDegats; readonly volants: boolean }
  | { readonly type: 'effet'; readonly effet: EffetCoup; readonly volants: boolean }
  | { readonly type: 'invoquer'; readonly unite: StatsCombattant; readonly nombre: number; readonly duree: number };

export interface DefSort {
  readonly nom: string;
  readonly recharge: number;
  readonly rechargeInitiale: number;
  readonly rayon: number;
  /** Le point visé doit être sur ou près d'un chemin. */
  readonly surChemin: boolean;
  readonly effets: readonly EffetSort[];
}

/** Bonus d'un dieu sur une famille de tours. Les fractions s'ajoutent (+0,25 = +25 %). */
export interface BonusFamille {
  readonly famille: IdFamille;
  readonly pvSoldats: number;
  readonly cadence: number;
  readonly chanceCritique: number;
  readonly prix: number;
  /** Effets ajoutés aux coups de la famille (tirs ou soldats). */
  readonly effets: readonly EffetCoup[];
}

export interface DefDieu {
  readonly nom: string;
  readonly heros: DefHeros;
  readonly sorts: readonly [DefSort, DefSort];
  readonly bonus: BonusFamille;
  /** Cinquième tour, un exemplaire par carte au maximum, sans amélioration. */
  readonly tourDivine: DefNiveauTour;
}

export interface Difficulte {
  readonly nom: string;
  readonly pvEnnemis: number;
  readonly vies: number;
  readonly aretesDepart: number;
  readonly primes: number;
}

/** Règles générales de la partie. */
export interface Regles {
  readonly tauxRevente: number;
  /** Multiplicateur d'un coup critique donné par un bonus à une tour qui n'en a pas. */
  readonly multiplicateurCritique: number;
  readonly paliersProtection: readonly number[];
  readonly reapparitionHeros: number;
  readonly delaiPremiereVague: number;
  /** Délai entre la dernière apparition d'une vague et le lancement automatique de la suivante. */
  readonly delaiEntreVagues: number;
  /** Arêtes par seconde d'avance quand le joueur appelle une vague (à partir de la deuxième). */
  readonly aretesParSecondeAvance: number;
  /** Distance à laquelle un bloqueur arrête son ennemi et l'échange de coups commence. */
  readonly distanceBlocage: number;
  /** Un ennemi engagé qui s'éloigne au-delà de portée × ce facteur du point de garde est relâché. */
  readonly laisseEngagement: number;
  /** Distance max entre un point visé (héros, ralliement, sort sur chemin) et un chemin. */
  readonly distanceMaxChemin: number;
  readonly decalageLateralMax: number;
  /** Décalages des unités autour de leur point de garde. */
  readonly formation: readonly Point[];
  /** Seuil de vies restantes (fraction) pour 2 étoiles ; 3 étoiles si aucune vie perdue. */
  readonly seuilDeuxEtoiles: number;
}

export interface Paquet {
  readonly ennemi: string;
  readonly nombre: number;
  readonly intervalle: number;
  /** Indice du chemin dans la carte : chaque chemin part d'une entrée et mène à une sortie. */
  readonly chemin: number;
  /** Secondes après le lancement de la vague. */
  readonly delai: number;
}

export interface Vague {
  readonly paquets: readonly Paquet[];
}

export interface Socle extends Point {
  /** Point de ralliement par défaut si on y construit une caserne. */
  readonly ralliement: Point;
}

export interface CheminCarte {
  /** Polyligne de l'entrée à la sortie. */
  readonly points: readonly Point[];
}

export interface Carte {
  readonly largeur: number;
  readonly hauteur: number;
  readonly chemins: readonly CheminCarte[];
  readonly socles: readonly Socle[];
  readonly departHeros: Point;
}

export interface Niveau {
  readonly id: string;
  readonly carte: Carte;
  readonly vagues: readonly Vague[];
  readonly aretesDepart: number;
}
