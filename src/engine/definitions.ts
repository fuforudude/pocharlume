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
}

/** Règles générales de la partie. */
export interface Regles {
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
