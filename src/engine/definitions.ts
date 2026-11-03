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
  /** Mécaniques propres à l'ennemi (régions 2 à 5) ; absent = ennemi ordinaire. */
  readonly pouvoirs?: PouvoirsEnnemi;
}

// ---------------------------------------------------------------------------------------------
// Pouvoirs des ennemis des régions 2 à 5 et de leurs boss. Tout est piloté par les données : le moteur
// ne connaît aucun ennemi par son nom, seulement ces mécaniques génériques.
// ---------------------------------------------------------------------------------------------

/** Chaque coup au corps-à-corps met le feu à l'unité alliée touchée : dégâts purs par seconde pendant `duree`. */
export interface BrulureContact {
  readonly duree: number;
  /** Dégâts purs par seconde. */
  readonly degats: number;
}

/** L'unité alliée qui le bloque (hors héros) est entraînée sous l'eau : elle meurt après `delai` s, sauf si lui meurt avant. */
export interface Noyade {
  readonly delai: number;
}

/** Tant qu'il touche une unité alliée, lui retire des PV chaque seconde et s'en soigne. */
export interface Drain {
  /** PV retirés par seconde. */
  readonly degats: number;
  /** Part des PV retirés qu'il récupère (1 = tout). */
  readonly soin: number;
}

/** Soigne périodiquement les autres ennemis proches. */
export interface SoinEnnemis {
  readonly rayon: number;
  /** Fraction des PV maximaux de chaque ennemi soigné. */
  readonly quantite: number;
  readonly cadence: number;
}

/** Nuage toxique laissé à sa mort : blesse les unités alliées (soldats, héros…) qui s'y trouvent. */
export interface NuageMortel {
  readonly rayon: number;
  readonly duree: number;
  /** Dégâts purs par seconde. */
  readonly degats: number;
}

/** Se relève après avoir été tué, un nombre de fois limité. */
export interface Relevement {
  readonly fois: number;
  /** Fraction des PV maximaux au relèvement. */
  readonly pv: number;
  /** Secondes à terre (intouchable) avant de repartir. */
  readonly delai: number;
  /** Type de dégâts du coup mortel après lequel il ne se relève pas (le Creux : `magique`) ; absent = tous le relèvent. */
  readonly sauf?: TypeDegats;
}

/** Les soldats tombés à moins de `rayon` tuiles de lui mettent `facteur` fois plus de temps à réapparaître (Fossoyeur). */
export interface Enterrement {
  readonly rayon: number;
  readonly facteur: number;
}

/** Aura : les autres ennemis à moins de `rayon` tuiles vont `vitesse` (0,25 = +25 %) plus vite. Plusieurs auras ne se cumulent pas. */
export interface AuraVitesse {
  readonly rayon: number;
  readonly vitesse: number;
}

/** Le premier soldat (ou autre unité, hors héros) qui le bloque est renversé (étourdi `etourdissement` s) et il passe (Cavalier). */
export interface Renversement {
  readonly etourdissement: number;
}

/** Sous `pv` (fraction des PV maximaux), il va plus vite (`vitesse`, 0,5 = +50 %) et frappe plus fort (`degats`) (Flagellant). */
export interface Rage {
  readonly pv: number;
  readonly vitesse: number;
  readonly degats: number;
}

/** Action déclenchée par un palier de PV ou par une cadence (boss). */
export type ActionEnnemi =
  /** Les tours à `rayon` tuiles perdent `cadence` (0,3 = −30 %) de cadence de tir pendant `duree` s. */
  | { readonly type: 'affamer'; readonly rayon: number; readonly cadence: number; readonly duree: number }
  /** La tour la plus proche (à moins de `rayon` tuiles s'il est donné) est désactivée (en feu) pendant `duree` s. */
  | { readonly type: 'desactiver_tour'; readonly duree: number; readonly rayon?: number }
  /** Appelle `nombre` ennemis sur son chemin, à sa hauteur, espacés de `ecart` tuiles vers l'entrée. */
  | { readonly type: 'invoquer'; readonly ennemi: string; readonly nombre: number; readonly ecart: number }
  /** Plonge : intouchable `duree` s, puis réapparaît `saut` tuiles plus loin sur son chemin. */
  | { readonly type: 'plonger'; readonly duree: number; readonly saut: number }
  /** Les `nombre` tours les plus proches (à moins de `rayon` tuiles s'il est donné) sont gelées `duree` s : elles ne tirent plus. */
  | { readonly type: 'figer_tour'; readonly nombre: number; readonly duree: number; readonly rayon?: number }
  /** Les tours à `rayon` tuiles perdent `portee` (0,3 = −30 %) de portée de tir pendant `duree` s. */
  | { readonly type: 'aveugler'; readonly rayon: number; readonly portee: number; readonly duree: number }
  /** Tue l'invocation (spectre, renfort) la plus proche à `rayon` tuiles, sinon étourdit le héros s'il est à `rayon` tuiles. */
  | { readonly type: 'bannir'; readonly rayon: number; readonly etourdissement: number }
  /** Relève les `nombre` derniers ennemis morts (boss exceptés) avec la part `pv` de leurs PV maximaux. */
  | { readonly type: 'relever_morts'; readonly nombre: number; readonly pv: number }
  /** Charge : vitesse multipliée par `vitesse` pendant `duree` s, sans s'arrêter aux soldats. */
  | { readonly type: 'charger'; readonly duree: number; readonly vitesse: number }
  /** Intouchable `duree` s, sans bouger. */
  | { readonly type: 'invulnerabilite'; readonly duree: number }
  /** Désamorce les pièges et les tourelles des alliés à moins de `rayon` tuiles (Sapeur). Sans effet s'il n'y en a aucun. */
  | { readonly type: 'desamorcer'; readonly rayon: number }
  /** Les ennemis à moins de `rayon` tuiles (lui compris) perdent ralentissement et étourdissement (Aumônier de Guerre). Sans effet s'il n'y en a aucun. */
  | { readonly type: 'purifier'; readonly rayon: number }
  /** Les unités alliées (soldats, héros) à moins de `rayon` tuiles sont étourdies `etourdissement` s (Chantre). Sans effet s'il n'y en a aucune. */
  | { readonly type: 'terrifier'; readonly rayon: number; readonly etourdissement: number };

/** Se déclenche une fois quand ses PV passent sous `pv` (fraction des PV maximaux). Paliers par `pv` décroissant. */
export interface PalierEnnemi {
  readonly pv: number;
  readonly actions: readonly ActionEnnemi[];
}

/**
 * Se déclenche toutes les `cadence` secondes (la première fois après un délai égal). Avec `phase`, seulement tant que la
 * part de PV restants est au plus `phase[0]` et au-dessus de `phase[1]` (le Soleil Blême) ; hors phase, le délai repart de zéro.
 * Une action sans effet (`figer_tour` sans tour à portée, `bannir` sans cible) est retentée au pas suivant.
 */
export interface ActionPeriodique {
  readonly cadence: number;
  readonly actions: readonly ActionEnnemi[];
  readonly phase?: readonly [number, number];
}

/**
 * Bouclier frontal : les coups directs d'une tour, d'une tourelle ou d'un héros tireur qui viennent de devant lui (du côté où il avance)
 * ne passent que pour `1 − reduction`. Les tirs au sol, les ondes, les chaînes et les soldats ne sont pas arrêtés (Porte-Herse).
 */
export interface Bouclier {
  readonly reduction: number;
}

/** Kamikaze : au premier contact avec une unité alliée, il explose et meurt, sans prime ni vie perdue (Gerbe Ardente). */
export interface Explosion {
  readonly rayon: number;
  /** Dégâts physiques à chaque unité alliée dans le rayon. */
  readonly degats: number;
}

/** Bondit par-dessus l'unité qui le retient : `distance` tuiles plus loin sur son chemin, puis `recharge` s avant de pouvoir recommencer (Crapaud Gonflé). */
export interface Bond {
  readonly distance: number;
  readonly recharge: number;
}

/**
 * Voleur : à la première unité alliée qui le retient, ou en atteignant la sortie, il prend `aretes` arêtes au joueur. Retenu, il file à
 * `vitesse` fois sa vitesse pendant `duree` secondes, sans s'arrêter aux unités alliées ; la fuite finie, il est un ennemi comme les autres
 * (il ne vole qu'une fois). Tué, il rend son butin ; échappé, le butin est perdu (Coupe-Bourse).
 */
export interface Vol {
  readonly aretes: number;
  readonly vitesse: number;
  readonly duree: number;
}

/** Aura de protection : les autres ennemis à moins de `rayon` tuiles subissent `reduction` de moins (0,3 = −30 %) de dégâts physiques et magiques. Non cumulable (Crieur Public). */
export interface AuraProtection {
  readonly rayon: number;
  readonly reduction: number;
}

/** À sa mort (tué, non échappé), `nombre` ennemis apparaissent là où il est tombé, espacés de `ecart` tuiles vers l'entrée (Grand Manteau). */
export interface Division {
  readonly ennemi: string;
  readonly nombre: number;
  readonly ecart: number;
}

/** Récupère `quantite` (0,03 = 3 %) de ses PV maximaux par seconde (Bubonneux). */
export interface Regeneration {
  readonly quantite: number;
}

/** Chaque coup au corps-à-corps qu'il reçoit blesse l'unité qui le porte de `degats` points purs (Fagot d'Os). */
export interface Epines {
  readonly degats: number;
}

/** Toutes les `periode` secondes, son armure et sa résistance magique s'échangent (Effigie du Roi). */
export interface Alternance {
  readonly periode: number;
}

/** À sa mort, rend `quantite` de leurs PV maximaux aux ennemis à moins de `rayon` tuiles (Martyr Blême). */
export interface DerniereLueur {
  readonly rayon: number;
  readonly quantite: number;
}

export interface PouvoirsEnnemi {
  readonly brulure?: BrulureContact;
  readonly noyade?: Noyade;
  readonly drain?: Drain;
  readonly soin?: SoinEnnemis;
  readonly nuage?: NuageMortel;
  readonly relevement?: Relevement;
  readonly enterrement?: Enterrement;
  readonly aura?: AuraVitesse;
  readonly renversement?: Renversement;
  readonly rage?: Rage;
  readonly bouclier?: Bouclier;
  readonly explosion?: Explosion;
  readonly bond?: Bond;
  readonly vol?: Vol;
  readonly auraProtection?: AuraProtection;
  readonly division?: Division;
  readonly regeneration?: Regeneration;
  readonly epines?: Epines;
  readonly alternance?: Alternance;
  readonly derniereLueur?: DerniereLueur;
  /** Aucun soldat ni héros ne l'arrête ni ne le vise : il passe entre eux (Frère Sans-Porte). Les tours l'atteignent comme un ennemi au sol. */
  readonly insaisissable?: boolean;
  /** Aucun ralentissement ne le touche (Grand Inquisiteur). */
  readonly insensibleRalentissement?: boolean;
  /** Multiplicateur de ses dégâts contre un héros (2 = double). */
  readonly degatsHeros?: number;
  /** Arrive par groupes de cette taille : le générateur de vagues crée des paquets de multiples de ce nombre. */
  readonly essaim?: number;
  readonly paliers?: readonly PalierEnnemi[];
  readonly periodiques?: readonly ActionPeriodique[];
}

export interface Critique {
  readonly chance: number;
  readonly multiplicateur: number;
}

// ---------------------------------------------------------------------------------------------
// Pouvoirs particuliers des unités alliées (héros, soldats, assassins) : esquive, exécution, tir à
// distance, soin, pièges et tourelles. Tout est piloté par les données, rien n'est propre à un héros.
// ---------------------------------------------------------------------------------------------

/** Attaque à distance d'une unité alliée (héros tireur ou soigneur) : elle ne bloque alors personne. */
export interface AttaqueUnite {
  readonly portee: number;
  readonly degats: Fourchette;
  readonly cadence: number;
  readonly typeDegats: TypeDegats;
  readonly volants: boolean;
  readonly effets: readonly EffetCoup[];
}

/** Soin périodique des alliés vivants autour de l'unité (elle comprise). */
export interface SoinZone {
  readonly rayon: number;
  /** Fraction des PV maximaux de chaque allié rendue à chaque soin. */
  readonly quantite: number;
  readonly cadence: number;
}

/** Piège posé sur le chemin : le premier ennemi au sol qui s'en approche le déclenche, une seule fois. */
export interface DefPiege {
  readonly degats: number;
  readonly typeDegats: TypeDegats;
  /** Secondes d'immobilisation (étourdissement) de l'ennemi pris. */
  readonly immobilisation: number;
  /** Distance de déclenchement. */
  readonly rayon: number;
}

/** Tourelle automatique : tire seule sur le premier ennemi à portée, puis disparaît. */
export interface DefTourelle {
  readonly nom: string;
  readonly portee: number;
  readonly degats: Fourchette;
  readonly cadence: number;
  readonly typeDegats: TypeDegats;
  readonly volants: boolean;
  readonly effets: readonly EffetCoup[];
  /** Durée de vie en secondes. */
  readonly duree: number;
}

export interface ConstructeurTourelles {
  readonly tourelle: DefTourelle;
  /** Tourelles vivantes au plus pour ce constructeur. */
  readonly max: number;
  /** Secondes entre deux constructions. */
  readonly cadence: number;
  /** Où elles apparaissent, par rapport au constructeur (le n-ième emplacement libre). */
  readonly decalages: readonly Point[];
}

export interface PoseurDePieges {
  readonly piege: DefPiege;
  readonly cadence: number;
  /** Distance max entre le poseur et le point du chemin où il pose. */
  readonly portee: number;
}

/** Ce qu'une tour divine ou un héros construit autour de lui. */
export interface Ouvrage {
  readonly constructeur: ConstructeurTourelles | null;
  readonly pieges: PoseurDePieges | null;
}

/** Pouvoirs particuliers d'une unité alliée. Tout à zéro / null, et ciblable, = unité ordinaire. */
export interface CapacitesUnite {
  /** Chance (0 à 1) d'éviter un coup reçu. */
  readonly esquive: number;
  /** Un non-boss sous cette fraction de PV est tué net par son coup. */
  readonly execution: number;
  /** Part de l'armure physique ignorée par ses coups. */
  readonly ignoreArmure: number;
  readonly critique: Critique | null;
  /** Bonus de dégâts maximal (0,8 = +80 %) quand ses PV tombent à zéro, proportionnel aux PV perdus. */
  readonly rage: number;
  /** PV rendus par seconde à elle-même. */
  readonly regeneration: number;
  readonly soin: SoinZone | null;
  /** Faux : les ennemis ne peuvent ni la viser ni être bloqués par elle (assassin furtif). */
  readonly ciblable: boolean;
  /** Voit et frappe les ennemis furtifs. */
  readonly voitFurtifs: boolean;
  readonly distance: AttaqueUnite | null;
  readonly ouvrage: Ouvrage | null;
}

/**
 * Modificateur de stats d'une unité (rangs de compétence de héros ou de spécialisation).
 * Les fractions s'ajoutent (0,1 = +10 %) ; le reste s'ajoute tel quel.
 */
export interface ModUnite {
  readonly pv: number;
  readonly degats: number;
  /** Fraction de vitesse d'attaque en plus. */
  readonly cadence: number;
  readonly armure: number;
  /** Fraction de vitesse de déplacement en plus. */
  readonly vitesse: number;
  /** Tuiles ajoutées à la portée d'engagement ou de tir. */
  readonly portee: number;
  /** Ennemis bloqués en plus. */
  readonly capacite: number;
  readonly esquive: number;
  readonly execution: number;
  readonly ignoreArmure: number;
  /** Chance de critique ajoutée. */
  readonly critique: number;
  readonly regeneration: number;
  readonly rage: number;
  /** Tuiles ajoutées au rayon de la frappe de zone et du soin. */
  readonly zone: number;
  /** Fraction de PV maximaux ajoutée à chaque soin. */
  readonly soin: number;
  /** Tourelles de plus pour un constructeur. */
  readonly nombreOuvrages: number;
  /** Fraction de délai en moins entre deux ouvrages (constructions, pièges). */
  readonly cadenceOuvrages: number;
  /** Fraction de dégâts en plus des tourelles et des pièges. */
  readonly degatsOuvrages: number;
}

/** Zone au sol qui dure : applique ses effets aux ennemis qui s'y trouvent, à chaque pas. */
export interface DefZoneDurable {
  /** Secondes. */
  readonly duree: number;
  /** Effets rafraîchis à chaque pas (durées courtes). */
  readonly effets: readonly EffetCoup[];
  /** Points de critique ajoutés aux tirs des tours sur un ennemi dans la zone. */
  readonly critique: number;
  readonly volants: boolean;
  /** Les ennemis furtifs de la zone sont visibles de tous tant qu'ils y restent (Voile de Nuit). */
  readonly revele?: boolean;
  /** Dégâts purs par seconde aux unités alliées de la zone (nuage toxique) ; absent = les alliés ne sont pas touchés. */
  readonly degatsAllies?: number;
}

/** Zone qu'un tir d'artillerie laisse à l'impact. */
export interface DefNappe extends DefZoneDurable {
  readonly rayon: number;
}

/** Bonus de Pollen : un tir d'artillerie qui touche le sol laisse parfois un piège. */
export interface PiegeAuSol {
  readonly chance: number;
  readonly piege: DefPiege;
}

/** Modificateur de tour (rang d'une compétence de spécialisation). */
export interface ModTour {
  readonly pvSoldats: number;
  readonly degats: number;
  readonly cadence: number;
  readonly portee: number;
  readonly zone: number;
  readonly critique: number;
  readonly ignoreArmure: number;
  /** Maillons de chaîne en plus. */
  readonly chaine: number;
  /** Spectres vivants en plus. */
  readonly spectres: number;
  /** Effets ajoutés aux coups ; un effet déjà présent est renforcé (maximum de chaque valeur). */
  readonly effets: readonly EffetCoup[];
  /** Modifie les soldats ou les spectres de la tour. */
  readonly unites: ModUnite;
  /** Remplace la nappe laissée à l'impact. */
  readonly nappe: DefNappe | null;
}

/** Compétence d'une spécialisation de tour : 3 rangs achetés en partie avec des arêtes. */
export interface DefCompetenceTour {
  readonly id: string;
  /** Clés de src/i18n/fr.ts. */
  readonly nom: string;
  readonly description: string;
  /** Prix en arêtes du rang 1, 2, 3. */
  readonly cout: readonly [number, number, number];
  /** Effet total de la compétence à chaque rang (le rang 2 remplace le rang 1, il ne s'y ajoute pas). */
  readonly rangs: readonly [ModTour, ModTour, ModTour];
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
  /** Pouvoirs particuliers (esquive, exécution, tir à distance…) ; absent = aucun. */
  readonly capacites?: CapacitesUnite;
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
  /** Part de l'armure physique ignorée par ses tirs. */
  readonly ignoreArmure: number;
  /** Zone laissée au sol par un tir d'artillerie. */
  readonly nappe: DefNappe | null;
  /** Bonus de dieu : un tir qui touche le sol laisse parfois un piège. Posé par le moteur, jamais dans les données. */
  readonly piegeAuSol: PiegeAuSol | null;
  /** Tour qui construit des tourelles et pose des pièges au lieu de tirer (Atelier Boiteux). */
  readonly atelier: Ouvrage | null;
  /** Compétences de la spécialisation (0 ou 2). */
  readonly competences: readonly DefCompetenceTour[];
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

/** Compétence d'un héros : 3 rangs, la dernière (l'ultime) demande un niveau de héros plus élevé. */
export interface DefCompetenceHeros {
  readonly id: string;
  /** Clés de src/i18n/fr.ts. */
  readonly nom: string;
  readonly description: string;
  readonly rangMax: number;
  /** Niveau du héros à partir duquel on peut y placer des points. */
  readonly niveauRequis: number;
  readonly ultime: boolean;
  /** Effet total à chaque rang (le rang 2 remplace le rang 1, il ne s'y ajoute pas). */
  readonly rangs: readonly [ModUnite, ModUnite, ModUnite];
}

export interface DefHeros {
  readonly nom: string;
  /** Clé de src/i18n/fr.ts : rôle en quelques mots. */
  readonly role: string;
  readonly description: string;
  /** Id du dieu dont il est l'avatar ou le disciple. */
  readonly dieu: string;
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
  readonly capacites: CapacitesUnite;
  /** Les 4 compétences, l'ultime en dernier. */
  readonly competences: readonly DefCompetenceHeros[];
}

/** Sur quelles cibles porte un effet de sort ou d'objet. */
export type CiblesEffet = 'tous' | 'non_boss' | 'boss';

export type EffetSort =
  | {
      readonly type: 'degats';
      readonly degats: Fourchette;
      readonly typeDegats: TypeDegats;
      readonly volants: boolean;
      readonly cibles?: CiblesEffet;
    }
  | { readonly type: 'effet'; readonly effet: EffetCoup; readonly volants: boolean; readonly cibles?: CiblesEffet }
  | { readonly type: 'invoquer'; readonly unite: StatsCombattant; readonly nombre: number; readonly duree: number }
  /** Tue net les non-boss de la zone ; un boss perd cette fraction de ses PV actuels. */
  | { readonly type: 'execution'; readonly volants: boolean; readonly fractionBoss: number }
  /** Zone qui dure, de même rayon que le sort. */
  | { readonly type: 'zone'; readonly zone: DefZoneDurable }
  /** `nombre` pièges sur le chemin le plus proche du point, espacés de `ecart` tuiles le long du chemin. */
  | { readonly type: 'pieges'; readonly nombre: number; readonly ecart: number; readonly piege: DefPiege }
  | { readonly type: 'aretes'; readonly montant: number }
  /** Les tours dans le rayon du sort tirent plus vite pendant `duree` secondes. */
  | { readonly type: 'boost'; readonly cadence: number; readonly duree: number }
  | { readonly type: 'vies'; readonly nombre: number };

/** Ce qu'un sort ou un objet fait autour d'un point (ou partout). */
export interface ZoneEffets {
  readonly rayon: number;
  /** Le point visé doit être sur ou près d'un chemin. */
  readonly surChemin: boolean;
  /** Les effets touchent tous les ennemis de la carte, quel que soit le point. */
  readonly global: boolean;
  readonly effets: readonly EffetSort[];
}

export interface DefSort extends ZoneEffets {
  readonly nom: string;
  readonly description: string;
  readonly recharge: number;
  readonly rechargeInitiale: number;
}

/** Consommable emporté en partie : un emplacement ne sert qu'une fois par partie. */
export interface DefObjet extends ZoneEffets {
  readonly nom: string;
  readonly description: string;
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
  /** Un tir de la famille qui touche le sol laisse parfois un piège. */
  readonly piegeAuSol: PiegeAuSol | null;
}

export interface DefDieu {
  readonly nom: string;
  readonly description: string;
  /** Le héros-avatar (offert), le premier de `idsHeros`. */
  readonly heros: DefHeros;
  /** L'avatar puis les deux disciples. */
  readonly idsHeros: readonly string[];
  readonly sorts: readonly [DefSort, DefSort];
  readonly bonus: BonusFamille;
  /** Cinquième tour, un exemplaire par carte au maximum, sans amélioration. */
  readonly tourDivine: DefNiveauTour;
}

/** Effets d'un rang de l'arbre d'améliorations. Les fractions s'ajoutent (0,05 = +5 %). */
export interface ModArbre {
  readonly pvSoldats: number;
  /** Fraction de portée des tirs. */
  readonly portee: number;
  /** Fraction de dégâts des tirs. */
  readonly degats: number;
  /** Fraction de rayon des dégâts de zone. */
  readonly zone: number;
  /** Fraction de temps de recharge en moins. */
  readonly recharge: number;
  readonly pvHeros: number;
  readonly degatsHeros: number;
}

export interface DefBranche {
  readonly nom: string;
  readonly description: string;
  /** Ce que la branche améliore : une famille de tours, les sorts ou le héros. */
  readonly cible: IdFamille | 'sorts' | 'heros';
  readonly rangMax: number;
  /** Effet total à chaque rang (indice 0 = rang 1). */
  readonly effets: readonly ModArbre[];
}

export interface Difficulte {
  readonly nom: string;
  readonly pvEnnemis: number;
  readonly vies: number;
  readonly aretesDepart: number;
  readonly primes: number;
  /** Nombre de dernières vagues dont les groupes (boss exceptés) sont d'élite : 0 = aucune. */
  readonly vaguesElites: number;
}

/** Règles générales de la partie. */
export interface Regles {
  /** Côté d'une case de la grille de construction, en tuiles (2 : cases de 2×2 tuiles, 16×9 sur une carte 32×18). */
  readonly tailleCase: number;
  /** Pourcentage entier du coût cumulé rendu à la revente (70 = 70 %), pour un calcul sans arrondi. */
  readonly tauxRevente: number;
  /** Multiplicateur d'un coup critique donné par un bonus à une tour qui n'en a pas. */
  readonly multiplicateurCritique: number;
  readonly paliersProtection: readonly number[];
  readonly reapparitionHeros: number;
  readonly delaiPremiereVague: number;
  /** Délai entre la dernière apparition d'une vague et le lancement automatique de la suivante. */
  readonly delaiEntreVagues: number;
  /** Arêtes (entier) par seconde d'avance quand le joueur appelle une vague (à partir de la deuxième). */
  readonly aretesParSecondeAvance: number;
  /** Distance à laquelle un bloqueur arrête son ennemi et l'échange de coups commence. */
  readonly distanceBlocage: number;
  /** Distance à laquelle une unité cesse d'approcher sa cible (un peu sous la distance de blocage). */
  readonly distanceContact: number;
  /** Niveau maximal du héros. */
  readonly niveauHerosMax: number;
  /** Un ennemi engagé qui s'éloigne au-delà de portée × ce facteur du point de garde est relâché. */
  readonly laisseEngagement: number;
  /** Distance max entre un point visé (héros, ralliement, sort sur chemin) et un chemin. */
  readonly distanceMaxChemin: number;
  readonly decalageLateralMax: number;
  /** Décalages des unités autour de leur point de garde. */
  readonly formation: readonly Point[];
  /** Seuil de vies restantes (fraction) pour 2 étoiles ; 3 étoiles si aucune vie perdue. */
  readonly seuilDeuxEtoiles: number;
  /** Pièges vivants au plus sur la carte : au-delà, le plus ancien disparaît. */
  readonly piegesMax: number;
  /** Secondes pendant lesquelles un ennemi reste visible après avoir été révélé par une tour ou un assassin. */
  readonly dureeRevelation: number;
  /** Version d'élite d'un ennemi (hors boss). */
  readonly elite: {
    readonly facteurPv: number;
    readonly facteurPrime: number;
    /** Vies de plus que coûte l'ennemi s'il s'échappe. */
    readonly viesEnPlus: number;
  };
  /** Défi Héroïque : nombre de vies (tous les groupes non-boss en élite) et facteur sur les arêtes de départ. */
  readonly heroique: { readonly vies: number; readonly facteurAretes: number };
  /** Défi Fer : toutes les vagues en une, effectifs multipliés (arrondi au-dessus), boss exceptés. */
  readonly fer: { readonly facteurEffectifs: number; readonly facteurAretes: number };
  /** Nombre de morts récentes gardées en mémoire (le Roi des Fosses en relève les plus récentes). */
  readonly memoireMorts: number;
  /** Bonus de collection : total maximal (0,1 = +10 %) par tour de base ou pour le héros. */
  readonly plafondBonus: number;
  /** PV régénérés par seconde pour un bonus de régénération de 100 % (1 = +100 %) du héros. */
  readonly regenerationBonusHeros: number;
}

export interface Paquet {
  readonly ennemi: string;
  readonly nombre: number;
  readonly intervalle: number;
  /** Indice du chemin dans la carte : chaque chemin part d'une entrée et mène à une sortie. */
  readonly chemin: number;
  /** Secondes après le lancement de la vague. */
  readonly delai: number;
  /** Les ennemis de ce groupe sont des élites (PV, protections et prime en hausse). Ignoré pour un boss. */
  readonly elite?: boolean;
  /** Part des PV (et de la prime) de l'ennemi, 1 par défaut : un mini-boss de l'infini est un boss à 30 % de ses PV. */
  readonly facteurPv?: number;
}

export interface Vague {
  readonly paquets: readonly Paquet[];
}

/**
 * Une case de la grille de construction : carré de `REGLES.tailleCase` tuiles de côté (2×2), colonne `cx` et ligne `cy`
 * comptées depuis le coin nord-ouest de la carte. La tour posée sur une case est centrée dessus.
 */
export interface CaseGrille {
  readonly cx: number;
  readonly cy: number;
}

export interface CheminCarte {
  /** Polyligne de l'entrée à la sortie. */
  readonly points: readonly Point[];
}

export interface Carte {
  readonly largeur: number;
  readonly hauteur: number;
  readonly chemins: readonly CheminCarte[];
  readonly departHeros: Point;
}

/**
 * Défi Fer d'un niveau : les deux seules familles de tours constructibles (ids de IdFamille, vérifiés à la création
 * de la partie). La tour divine est permise si la famille de son dieu en fait partie.
 */
export interface DefiFer {
  readonly familles: readonly [string, string];
}

export interface Niveau {
  readonly id: string;
  readonly carte: Carte;
  readonly vagues: readonly Vague[];
  /**
   * Cases de la grille où l'on ne construit pas (chemin, grands décors), calculées à l'assemblage du niveau : le moteur
   * ne lit pas l'habillage. Toute autre case de la carte est constructible.
   */
  readonly casesInterdites: readonly CaseGrille[];
  readonly aretesDepart: number;
  /** Absent = pas de défi Fer sur ce niveau. */
  readonly defiFer?: DefiFer;
  /** Vrai : la difficulté Vieux Sage n'y joue pas ses dernières vagues en élite (le défi Héroïque, lui, les joue toutes en élite). */
  readonly sansElites?: boolean;
  /** Niveau de horde (jalon 5) : nombreux ennemis faibles et serrés. Les bots de l'équilibrage s'en servent pour estimer ce que vaut la zone. */
  readonly horde?: boolean;
  /**
   * Numéro de campagne (1 à 100) : il décide des tours déjà débloquées (src/data/deblocage.ts). Absent (niveau d'essai) : tout
   * est ouvert.
   */
  readonly numero?: number;
}

/** Une région du mode infini : ses ennemis propres, et le boss dont les mini-boss sont tirés. */
export interface RegionInfini {
  /** Ennemis ordinaires propres à la région, dans un ordre fixe (l'ordre compte pour le déterminisme). */
  readonly ennemis: readonly string[];
  readonly boss: string;
}

/** Règles du mode infini (src/data/infini.ts). */
export interface ParametresInfini {
  /** Numéro de campagne dont le budget de la première vague sert de base : le budget de la vague n est ce budget × croissance^(n−1). */
  readonly niveauBase: number;
  /** Multiplicateur du budget d'une vague à la suivante (1,22 depuis le réglage du jalon 4). */
  readonly croissance: number;
  /**
   * Nombre maximal d'ennemis (mini-boss non compris) dans une vague. Au-delà, le budget de menace est rempli avec moins d'ennemis, et
   * le surplus devient un facteur de PV (et de prime) de la vague : l'état reste sérialisable et le jeu fluide à la vague 100.
   */
  readonly ennemisMaxParVague: number;
  /** Régions 1 à 10, dans l'ordre : une carte de la région r tire parmi les ennemis des régions 1 à r. */
  readonly regions: readonly RegionInfini[];
  readonly elites: {
    /** Première vague qui compte des élites. */
    readonly premiereVague: number;
    /** Part des ennemis d'élite à la première vague d'élites (0,1 = 10 %). */
    readonly partDepart: number;
    /** Part ajoutée tous les `intervalle` vagues. */
    readonly partParPalier: number;
    readonly intervalle: number;
    readonly partMax: number;
  };
  readonly miniBoss: {
    /** Un mini-boss toutes les `intervalle` vagues (10, 20, 30…). */
    readonly intervalle: number;
    /** Part des PV du boss pour le premier mini-boss. */
    readonly pvDepart: number;
    /** Part de PV ajoutée par mini-boss déjà passé. */
    readonly pvParMiniBoss: number;
    /** Secondes entre le lancement de la vague et l'arrivée du mini-boss. */
    readonly delai: number;
  };
}
