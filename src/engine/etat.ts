// État complet d'une partie : objets simples, sérialisable tel quel en JSON (pas de Map, de classe,
// d'undefined ni d'Infinity). Les durées internes sont en pas de simulation, les vitesses en tuiles par pas.
import type { Action } from './actions';
import type {
  AttaqueDistance,
  DefNiveauTour,
  DefPiege,
  DefTourelle,
  EffetCoup,
  IdFamille,
  Niveau,
  Point,
  StatsCombattant,
  Voie,
  ZoneHeros,
} from './definitions';
import type { Evenement } from './evenements';

export const VERSION_ETAT = 2;

export type Statut = 'en_cours' | 'victoire' | 'defaite';
export type FamilleTour = IdFamille | 'divine';
export type GenreUnite = 'soldat' | 'heros' | 'renfort' | 'spectre';

/**
 * Tout ce qui entre dans une partie, fixé au lancement : avec le niveau, la graine et le journal d'actions,
 * elle suffit à rejouer la partie à l'identique. Validée par `verifierConfig` (config.ts).
 */
export interface ConfigPartie {
  graine: number;
  /** Clé de src/data/difficultes.ts. */
  difficulte: string;
  /** Clé de src/data/dieux.ts. */
  dieu: string;
  /** Clé de src/data/heros.ts : l'avatar du dieu ou l'un de ses disciples. */
  heros: string;
  /** Niveau du héros (1 à 10), fourni par la progression. */
  niveauHeros: number;
  /** Compétences du héros : id de compétence vers rang (0 à 3). Somme des rangs au plus égale au niveau du héros. */
  competencesHeros: Record<string, number>;
  /** Arbre d'améliorations : id de branche (src/data/ameliorations.ts) vers rang (0 à 5). */
  ameliorations: Record<string, number>;
  /** Objets emportés (0 à 3 ids de src/data/objets.ts, distincts), un par emplacement. */
  objets: string[];
  /** VERSION_DONNEES de src/data/version.ts : une partie ne se rejoue qu'avec les données de sa version. */
  versionDonnees: number;
}

/** Chemin précalculé : longueurs cumulées et directions unitaires de chaque segment. */
export interface CheminCalcule {
  points: Point[];
  cumul: number[];
  dirX: number[];
  dirY: number[];
  longueur: number;
}

/** Indices des effets dans `effetsPas` et `effetsValeur`. */
export const EFFET = { ralentissement: 0, etourdissement: 1, brulure: 2, saignement: 3, poison: 4 } as const;

export interface Ennemi {
  id: number;
  type: string;
  chemin: number;
  /** Distance parcourue le long du chemin. */
  distance: number;
  segment: number;
  /** Décalage latéral par rapport à l'axe du chemin (visuel et ciblage). */
  decalage: number;
  x: number;
  y: number;
  pv: number;
  pvMax: number;
  vitesse: number;
  armure: number;
  resistance: number;
  volant: boolean;
  furtif: boolean;
  /** Pas restants pendant lesquels une tour ou un assassin le révèle (furtif visible de tous). */
  revele: number;
  degatsMin: number;
  degatsMax: number;
  cadence: number;
  recharge: number;
  distanceAttaque: AttaqueDistance | null;
  rechargeDistance: number;
  coutVies: number;
  prime: number;
  boss: boolean;
  insensibleEtourdissement: boolean;
  devore: number;
  rechargeDevore: number;
  /** Id de l'unité qui le bloque, -1 si libre. */
  bloqueur: number;
  vivant: boolean;
  /** Pas restants par effet (indices de EFFET). */
  effetsPas: number[];
  /** Valeur par effet : facteur de vitesse ou dégâts par seconde. */
  effetsValeur: number[];
}

/** Indices des minuteurs d'une unité ou d'une tour (`minuteurs`). */
export const MINUTEUR = { tourelle: 0, piege: 1, soin: 2 } as const;

export interface Unite {
  id: number;
  genre: GenreUnite;
  /** Tour d'origine (caserne, nécromancien), -1 sinon. */
  tour: number;
  emplacement: number;
  x: number;
  y: number;
  /** Point de garde (ralliement + formation, ou point ordonné au héros). */
  ancreX: number;
  ancreY: number;
  pv: number;
  stats: StatsCombattant;
  recharge: number;
  /** Ennemi combattu, -1 si aucun. */
  cible: number;
  /** Ennemis dont elle est le bloqueur. */
  bloques: number;
  mort: boolean;
  reapparition: number;
  delaiReapparition: number;
  /** Pas restants avant de disparaître, -1 si permanente. */
  duree: number;
  /** Héros en route vers un point ordonné : il ne s'engage pas. */
  enDeplacement: boolean;
  zone: ZoneHeros | null;
  /** Pas restants avant la prochaine tourelle, le prochain piège, le prochain soin (indices de MINUTEUR). */
  minuteurs: number[];
}

export interface Tour {
  id: number;
  socle: number;
  famille: FamilleTour;
  niveau: number;
  voie: Voie | null;
  coutCumule: number;
  x: number;
  y: number;
  recharge: number;
  ralliementX: number;
  ralliementY: number;
  /** Stats du niveau courant, bonus du dieu, de l'arbre et rangs de compétence compris. Jamais modifié en place. */
  stats: DefNiveauTour;
  /** Rang acheté de chacune des compétences de la spécialisation (même ordre que `stats.competences`). */
  rangs: number[];
  /** Fraction de cadence en plus tant que `boostPas` > 0 (Ingéniosité). */
  boostCadence: number;
  boostPas: number;
  /** Pas restants avant la prochaine tourelle et le prochain piège de l'Atelier (indices de MINUTEUR). */
  minuteurs: number[];
}

export interface Projectile {
  id: number;
  tour: number;
  x: number;
  y: number;
  /** Ennemi suivi, -1 pour un tir au sol (zone). */
  cible: number;
  cx: number;
  cy: number;
  vitesse: number;
  degats: number;
  critique: boolean;
  stats: DefNiveauTour;
}

/** Piège posé sur le chemin : se déclenche une fois sur le premier ennemi au sol qui s'en approche. */
export interface Piege {
  id: number;
  x: number;
  y: number;
  stats: DefPiege;
}

/** Zone qui dure (Voile de Nuit, nappe de soufre). */
export interface ZoneDurable {
  id: number;
  x: number;
  y: number;
  rayon: number;
  /** Pas restants. */
  restant: number;
  effets: readonly EffetCoup[];
  critique: number;
  volants: boolean;
}

/** Tourelle construite par une tour ou un héros : tire seule jusqu'à la fin de sa vie. */
export interface Structure {
  id: number;
  /** Id de la tour ou de l'unité qui l'a construite. */
  origine: number;
  x: number;
  y: number;
  /** Pas restants avant qu'elle disparaisse. */
  restant: number;
  recharge: number;
  stats: DefTourelle;
}

export interface PaquetActif {
  vague: number;
  ennemi: string;
  chemin: number;
  restants: number;
  intervalle: number;
  prochain: number;
}

export interface EtatVagues {
  lancees: number;
  /** Pas du lancement automatique de la vague suivante, -1 s'il n'en reste plus. */
  prochaine: number;
  paquets: PaquetActif[];
}

export interface EtatSort {
  recharge: number;
}

export interface EntreeJournal {
  pas: number;
  action: Action;
}

export interface EtatPartie {
  version: number;
  versionDonnees: number;
  niveau: Niveau;
  config: ConfigPartie;
  chemins: CheminCalcule[];
  pas: number;
  rng: number;
  statut: Statut;
  etoiles: number;
  vies: number;
  viesDepart: number;
  aretes: number;
  vagues: EtatVagues;
  ennemis: Ennemi[];
  unites: Unite[];
  tours: Tour[];
  projectiles: Projectile[];
  pieges: Piege[];
  zones: ZoneDurable[];
  structures: Structure[];
  heros: number;
  sorts: EtatSort[];
  /** Pour chaque emplacement d'objet de la config : déjà utilisé dans cette partie. */
  objetsUtilises: boolean[];
  prochainId: number;
  /**
   * Événements du pas `evenementsPas`, lus par le rendu pour les effets et les sons : ceux des actions
   * appliquées à ce pas (par `avancer` ou `appliquerAction` juste avant `step`) puis ceux de la simulation.
   * Ils sont remplacés dès que quelque chose se passe au pas suivant. Partie terminée : « fin » reste
   * lisible après le dernier pas, puis le pas suivant (`step` ou `avancer`) vide la liste.
   */
  evenements: Evenement[];
  evenementsPas: number;
  /** Actions acceptées, horodatées : avec la config, elles suffisent à rejouer la partie. */
  journal: EntreeJournal[];
}
