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
  PouvoirsEnnemi,
  StatsCombattant,
  Voie,
  ZoneHeros,
} from './definitions';
import type { Evenement } from './evenements';

export const VERSION_ETAT = 9;

export type Statut = 'en_cours' | 'victoire' | 'defaite';
export type FamilleTour = IdFamille | 'divine';
export type GenreUnite = 'soldat' | 'heros' | 'renfort' | 'spectre';

/** Défi joué : Héroïque (1 vie, groupes d'élite) ou Fer (une seule vague, deux familles de tours). */
export type DefiPartie = 'heroique' | 'fer';
export type StatBonusTour = 'degats' | 'cadence' | 'portee' | 'pvSoldats';
export type StatBonusHeros = 'pv' | 'degats' | 'cadence' | 'regeneration';

/**
 * Bonus de la collection (skins et familiers), en fractions (0,05 = +5 %). Le bonus d'une famille vaut pour sa tour de
 * base et ses spécialisations ; le total par famille ou pour le héros ne dépasse pas `REGLES.plafondBonus`. Ignoré en Fer.
 */
export interface BonusCollection {
  tours: Partial<Record<IdFamille, Partial<Record<StatBonusTour, number>>>>;
  heros: Partial<Record<StatBonusHeros, number>>;
}

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
  /** Objets emportés (0 à 3 ids de src/data/objets.ts, un même objet pouvant occuper plusieurs emplacements), un par emplacement. */
  objets: string[];
  /** VERSION_DONNEES de src/data/version.ts : une partie ne se rejoue qu'avec les données de sa version. */
  versionDonnees: number;
  /**
   * Défi joué, null (ou absent, pour une config d'avant le jalon 3) = partie ordinaire. Un défi se joue avec les règles
   * de Matou et sans objet.
   */
  defi?: DefiPartie | null;
  /** Bonus de collection ; absent = aucun. */
  bonus?: BonusCollection;
  /**
   * Mode infini (jalon 4) : absent ou null = partie de campagne. `region` (1 à 10) est celle de la carte : les vagues sont
   * générées par le moteur à partir de la graine, parmi les ennemis des régions 1 à `region`, et les vagues du niveau sont
   * ignorées. Se joue avec les règles de Matou.
   */
  infini?: { region: number } | null;
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
  /**
   * Couloir du Vol de Corbeaux où il vole (indice dans `EtatPartie.couloirs`), -1 s'il suit son chemin. Un ennemi en couloir est
   * toujours volant ; `distance` et `segment` se lisent alors le long du couloir (voir `trajetEnnemi`).
   */
  couloir: number;
  /** Distance parcourue le long du chemin (ou du couloir). */
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
  /** Version d'élite (PV, protections, prime et coût en vies déjà ajustés). */
  elite: boolean;
  /** Mécaniques propres à l'ennemi (copie des données) ; null = ennemi ordinaire. */
  pouvoirs: PouvoirsEnnemi | null;
  /** Relèvements encore possibles. */
  releves: number;
  /** Index (de 0) de la vague d'où il vient : les ennemis appelés ou relevés gardent celle de leur source. */
  vague: number;
  /** Bonus de vitesse de l'aura d'un autre ennemi ce pas-ci (0,25 = +25 %), recalculé à chaque pas. */
  bonusVitesse: number;
  /** Pas de charge restants et facteur de vitesse de la charge (Prince Croisé). */
  charge: number;
  chargeVitesse: number;
  /** Renversements de soldats encore possibles (Cavalier). */
  renversements: number;
  /** Pas restants avant le prochain bond (Crapaud Gonflé), 0 = prêt. */
  bondPas: number;
  /** Vrai une fois qu'il a volé ses arêtes (Coupe-Bourse), et arêtes qu'il porte et qu'il rend à sa mort. */
  vole: boolean;
  butin: number;
  /** Réduction de dégâts de l'aura d'un autre ennemi ce pas-ci (0,3 = −30 %), recalculée à chaque pas. */
  bonusProtection: number;
  /** Pas restants avant que l'armure et la résistance s'échangent (Effigie du Roi). */
  alternancePas: number;
  /** Pas restants pendant lesquels il est intouchable (à terre, plongé) : ni ciblé, ni blessé, ni affecté, il ne bouge pas. */
  invulnerable: number;
  /** Tuiles dont il avance sur son chemin en réapparaissant (plongée). */
  saut: number;
  /** Indice du prochain palier de PV à déclencher. */
  palier: number;
  /** Pas restants avant chaque action périodique (même ordre que `pouvoirs.periodiques`). */
  minuteurs: number[];
  /** Pas restants avant le prochain soin des ennemis proches. */
  rechargeSoin: number;
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
  /** Pas restants de brûlure, et dégâts purs par seconde. */
  brulure: number;
  brulureDegats: number;
  /** Pas restants avant de se noyer (0 = pas entraînée sous l'eau) et id du noyeur qui la tient (-1 sinon). */
  noyade: number;
  noyeur: number;
  /** Pas restants d'étourdissement (renversée par un Cavalier, étourdie par un Exorciste) : elle ne fait rien. */
  etourdi: number;
}

export interface Tour {
  id: number;
  /** Case de la grille où la tour est posée ; (x, y) en est le centre. -1 et -1 pour une tour du radeau. */
  cx: number;
  cy: number;
  /**
   * Place du Radeau (gimmick) où la tour est posée, -1 pour une tour posée sur une case. Une tour du radeau ne garde que cela : son
   * (x, y) est celui de sa place, recalculé au début de chaque pas (`deplacerToursDuRadeau`).
   */
  place: number;
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
  /** Pas restants de désactivation (en feu) : la tour ne tire pas, ne révèle pas, ne construit pas. */
  desactivee: number;
  /** Pas restants de famine et fraction de cadence perdue (0,3 = −30 %). */
  affamePas: number;
  affameCadence: number;
  /** Pas restants de gel (Inquisiteur) : même effet que la désactivation, sans le feu. */
  gel: number;
  /** Pas restants d'aveuglement et fraction de portée perdue (0,3 = −30 %). */
  aveuglePas: number;
  aveugleFacteur: number;
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
  /** Où la tour se trouvait au départ du tir (pour le bouclier frontal). */
  origineX: number;
  origineY: number;
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
  /** Révèle les furtifs de la zone. */
  revele: boolean;
  /** Dégâts purs par seconde aux unités alliées de la zone (nuage toxique) ; 0 = aucun. */
  degatsAllies: number;
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
  elite: boolean;
  /** Part des PV de l'ennemi (1 = tous). */
  facteurPv: number;
  /** Couloir du Vol de Corbeaux du groupe, -1 s'il suit `chemin`. */
  couloir: number;
}

/** Un ennemi mort (pas échappé), gardé en mémoire pour le Roi des Fosses. */
export interface MortRecente {
  type: string;
  chemin: number;
  distance: number;
  elite: boolean;
  vague: number;
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
  /** Copie de la config reçue (`copierConfig`) : `defi` et `bonus` n'y sont que s'ils servent. */
  config: ConfigPartie;
  chemins: CheminCalcule[];
  /** Couloirs du Vol de Corbeaux précalculés comme des chemins droits (bord gauche vers bord droit) ; vide sans ce gimmick. */
  couloirs: CheminCalcule[];
  pas: number;
  rng: number;
  statut: Statut;
  etoiles: number;
  vies: number;
  viesDepart: number;
  /** Vrai dès qu'une vie a été perdue, même rendue ensuite (Herbe de Sabbat) : les 3 étoiles n'iront qu'à une partie sans perte. */
  viePerdue: boolean;
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
  /** Les derniers ennemis morts (au plus `REGLES.memoireMorts`, les plus récents en fin), boss exceptés. */
  morts: MortRecente[];
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
