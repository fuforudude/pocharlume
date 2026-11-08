// Méta-progression : ce qui se gagne et se dépense entre les parties (arêtes, braises, étoiles de l'arbre, disciples,
// objets consommables, expérience des héros). Ce fichier ne porte que les identifiants, les prix, les plafonds et les
// formules de gain. Les effets en partie vivent ailleurs : héros et compétences dans `heros.ts`, objets dans
// `objets.ts`, rangs de l'arbre dans `ameliorations.ts` ; un test de fusion vérifie qu'ils déclarent les mêmes ids.
// Les fonctions de `src/save/` s'appuient sur ces valeurs, jamais l'inverse.

// --- Dieux et héros -------------------------------------------------------------------------------------------

export const IDS_DIEUX = ['plume', 'charlie', 'pollen'] as const;
export type IdDieu = (typeof IDS_DIEUX)[number];

/** Les héros de chaque dieu : l'avatar d'abord (offert), puis les deux disciples (payants). */
export const HEROS_PAR_DIEU = {
  plume: ['plume', 'suie', 'corbeau'],
  charlie: ['charlie', 'mastoc', 'brise_os'],
  pollen: ['pollen', 'rouage', 'lanterne'],
} as const satisfies Record<IdDieu, readonly string[]>;

export const IDS_HEROS = ['plume', 'suie', 'corbeau', 'charlie', 'mastoc', 'brise_os', 'pollen', 'rouage', 'lanterne'] as const;
export type IdHeros = (typeof IDS_HEROS)[number];

/** Les avatars, offerts dès le départ. */
export const AVATARS: readonly IdHeros[] = ['plume', 'charlie', 'pollen'];

/** Prix d'un disciple, en braises. */
export const PRIX_DISCIPLE = 30;

export function dieuDuHeros(heros: IdHeros): IdDieu {
  return IDS_DIEUX.find((dieu) => (HEROS_PAR_DIEU[dieu] as readonly string[]).includes(heros)) ?? 'charlie';
}

/** Gardes de type : `x` est un identifiant connu (jamais vrai pour un nom hérité d'Object comme `constructor`). */
export function estIdDieu(x: unknown): x is IdDieu {
  return typeof x === 'string' && (IDS_DIEUX as readonly string[]).includes(x);
}

export function estIdHeros(x: unknown): x is IdHeros {
  return typeof x === 'string' && (IDS_HEROS as readonly string[]).includes(x);
}

// --- Expérience et compétences des héros -----------------------------------------------------------------------

/** Compétences par héros : 4, dont l'ultime (la dernière). */
export const COMPETENCES_PAR_HEROS = 4;
export const RANG_MAX_COMPETENCE = 3;
/** Niveau de héros à partir duquel l'ultime s'apprend. */
export const NIVEAU_ULTIME = 6;
/** Points de compétence gagnés par niveau de héros (le niveau 1 en donne déjà autant). */
export const POINTS_PAR_NIVEAU = 1;
/** Plafond de l'expérience gardée par héros (au-delà, elle ne monte plus). */
export const PLAFOND_XP = 1_000_000;

// --- Arbre d'améliorations -------------------------------------------------------------------------------------

export const BRANCHES_ARBRE = ['caserne', 'tir', 'magie', 'artillerie', 'sorts', 'heros'] as const;
export type IdBranche = (typeof BRANCHES_ARBRE)[number];
export const RANG_MAX_ARBRE = 5;

export function estIdBranche(x: unknown): x is IdBranche {
  return typeof x === 'string' && (BRANCHES_ARBRE as readonly string[]).includes(x);
}

/** Étoiles que coûte l'achat du rang `rang` (1 à 5) : le rang n coûte n étoiles. */
export function coutRangArbre(rang: number): number {
  return rang;
}

/** Étoiles dépensées pour avoir atteint le rang `rang` d'une branche (1 + 2 + … + rang). */
export function coutCumuleArbre(rang: number): number {
  return (rang * (rang + 1)) / 2;
}

// --- Objets consommables ---------------------------------------------------------------------------------------

/** Prix en arêtes. */
export const OBJETS = {
  fiole_soufre: { prix: 60 },
  herbe_sabbat: { prix: 80 },
  griffe_renfort: { prix: 60 },
  sablier: { prix: 100 },
} as const;
export type IdObjet = keyof typeof OBJETS;
export const IDS_OBJETS = Object.keys(OBJETS) as readonly IdObjet[];
export function estIdObjet(x: unknown): x is IdObjet {
  return typeof x === 'string' && (IDS_OBJETS as readonly string[]).includes(x);
}
/** Stock maximal de chaque objet. */
export const STOCK_MAX_OBJET = 10;
/** Emplacements d'objets emportés dans une partie (chacun utilisable une fois). */
export const EMPLACEMENTS_OBJETS = 3;

// --- Monnaies et gains -----------------------------------------------------------------------------------------

/** Plafond des arêtes et des braises gardées : un gain qui le dépasserait est tronqué. */
export const PLAFOND_MONNAIE = 99_999_999;

/** Niveaux de boss de la campagne : le dernier niveau de chaque région de 10. */
export function estNiveauBoss(niveau: number): boolean {
  return Number.isInteger(niveau) && niveau >= 1 && niveau % 10 === 0;
}

/**
 * Arêtes hors partie gagnées par une victoire au niveau `niveau` : 30 + 6 × N + 15 par étoile jamais obtenue sur
 * ce niveau (toutes difficultés confondues, comme le total d'étoiles de l'arbre) ; sans étoile nouvelle,
 * 10 + 2 × N. Une défaite ne rapporte rien.
 */
export function aretesDeVictoire(niveau: number, nouvellesEtoiles: number): number {
  return nouvellesEtoiles > 0 ? 30 + 6 * niveau + 15 * nouvellesEtoiles : 10 + 2 * niveau;
}

/**
 * Braises gagnées par une victoire. Niveaux 1 à 100 : 5 la première fois qu'un niveau est gagné, 10 de plus à la
 * première victoire sur un boss, 2 la première fois qu'un niveau atteint ses 3 étoiles (les 10 niveaux de la région 1
 * en rapportent au plus 50 + 10 + 20 = 80, soit deux disciples à 30 braises).
 * Niveaux 101 à 150 (après l'histoire) : 15 la première victoire, 30 de plus à la première victoire du 5e niveau de
 * chaque bloc (à la place du bonus de boss), 6 la première fois que les 3 étoiles sont atteintes.
 */
export function braisesDeVictoire(niveau: number, premiereVictoire: boolean, premieresTroisEtoiles: boolean): number {
  if (estApresHistoire(niveau)) {
    return (
      (premiereVictoire ? BRAISES_APRES_HISTOIRE.premiereVictoire : 0) +
      (premiereVictoire && estFinDeBloc(niveau) ? BRAISES_APRES_HISTOIRE.finDeBloc : 0) +
      (premieresTroisEtoiles ? BRAISES_APRES_HISTOIRE.troisEtoiles : 0)
    );
  }
  return (premiereVictoire ? BRAISES_PREMIERE_VICTOIRE : 0) + (premiereVictoire && estNiveauBoss(niveau) ? 10 : 0) + (premieresTroisEtoiles ? 2 : 0);
}

/** Braises d'un niveau gagné pour la première fois. */
export const BRAISES_PREMIERE_VICTOIRE = 5;

/** Braises des niveaux 101 à 150 (valeurs fixées par la spec « après l'histoire »). */
export const BRAISES_APRES_HISTOIRE = {
  premiereVictoire: 15,
  /** En plus, à la première victoire du 5e niveau de chaque bloc de 5 (105, 110, … 150). */
  finDeBloc: 30,
  troisEtoiles: 6,
  defi: 12,
} as const;

/** Niveaux d'un bloc de gimmick : chaque région compte deux blocs de 5 niveaux. */
export const NIVEAUX_PAR_BLOC = 5;

/** Expérience gagnée par le héros joué : 100 + 20 × N pour une victoire, la moitié pour une défaite. */
export function xpDePartie(niveau: number, victoire: boolean): number {
  const xp = 100 + 20 * niveau;
  return victoire ? xp : xp / 2;
}

// --- Régions et défis ------------------------------------------------------------------------------------------

/**
 * Niveaux par région. La campagne entière compte `NOMBRE_REGIONS` régions et `NIVEAU_MAX` niveaux : l'histoire (régions 1 à 10,
 * niveaux 1 à 100, `NIVEAU_FIN_CAMPAGNE`) puis l'après-histoire (régions 11 à 15, niveaux 101 à 150).
 */
export const NIVEAUX_PAR_REGION = 10;
/** Régions de l'histoire seule : celles dont le dernier boss termine la campagne. */
export const NOMBRE_REGIONS_HISTOIRE = 10;
/** Toutes les régions, histoire et après-histoire. */
export const NOMBRE_REGIONS = 15;
/** Dernier niveau de la campagne entière. */
export const NIVEAU_MAX = NOMBRE_REGIONS * NIVEAUX_PAR_REGION;
/** Premier niveau d'après l'histoire (région 11). */
export const PREMIER_NIVEAU_APRES_HISTOIRE = NOMBRE_REGIONS_HISTOIRE * NIVEAUX_PAR_REGION + 1;
/** Le mode infini ne connaît que les régions de l'histoire : les régions 11 à 15 n'ont pas encore de cartes d'infini. */
export const NOMBRE_REGIONS_INFINI = NOMBRE_REGIONS_HISTOIRE;

/** Niveau d'après l'histoire (101 à 150). */
export function estApresHistoire(niveau: number): boolean {
  return Number.isInteger(niveau) && niveau >= PREMIER_NIVEAU_APRES_HISTOIRE && niveau <= NIVEAU_MAX;
}

/** 5e niveau d'un bloc de 5 après l'histoire (105, 110, … 150). */
export function estFinDeBloc(niveau: number): boolean {
  return estApresHistoire(niveau) && niveau % NIVEAUX_PAR_BLOC === 0;
}

/** Région d'un niveau de campagne (1 à 15), ou 0 pour un numéro qui n'en est pas un. */
export function regionDuNiveau(niveau: number): number {
  return Number.isInteger(niveau) && niveau >= 1 && niveau <= NIVEAU_MAX ? Math.floor((niveau - 1) / NIVEAUX_PAR_REGION) + 1 : 0;
}

/**
 * Plus haute région ouverte quand le plus haut niveau jouable est `niveauMax` : la région r + 1 s'ouvre quand le boss
 * (niveau 10 r) de la région r est battu, c'est-à-dire quand `niveauMax` dépasse 10 r.
 */
export function regionOuverte(niveauMax: number): number {
  return Math.min(NOMBRE_REGIONS, Math.max(1, regionDuNiveau(niveauMax)));
}

/** Défis d'un niveau à 3 étoiles : Héroïque (1 vie, vagues d'élite) et Fer (une énorme vague, 2 familles de tours). */
export const IDS_DEFIS = ['heroique', 'fer'] as const;
export type IdDefi = (typeof IDS_DEFIS)[number];
export function estIdDefi(x: unknown): x is IdDefi {
  return typeof x === 'string' && (IDS_DEFIS as readonly string[]).includes(x);
}
/** Braises que rapporte la première réussite d'un défi sur un niveau de l'histoire (1 à 100). */
export const BRAISES_DEFI = 4;
/** Braises de la première réussite d'un défi sur le niveau `niveau` : 4 jusqu'au niveau 100, 12 après l'histoire. */
export function braisesDeDefi(niveau: number): number {
  return estApresHistoire(niveau) ? BRAISES_APRES_HISTOIRE.defi : BRAISES_DEFI;
}

/** Niveaux (boss) dont la première victoire offre un disciple : fin des régions 2, 4, 6 et 8. */
export const NIVEAUX_DISCIPLE_OFFERT: readonly number[] = [20, 40, 60, 80];

/** Niveau (boss de la région 1) dont la victoire ouvre le mode infini. */
export const NIVEAU_OUVERTURE_INFINI = 10;
/** Niveau (boss de la région 10, le Soleil Blême) dont la victoire termine l'histoire et ouvre la région 11. */
export const NIVEAU_FIN_CAMPAGNE = NOMBRE_REGIONS_HISTOIRE * NIVEAUX_PAR_REGION;

// --- Mode infini : record par carte et paliers --------------------------------------------------------------------

/** Paliers de l'infini (dernière vague terminée) : chacun est payé une seule fois au total, toutes cartes confondues. */
export const PALIERS_INFINI = [10, 20, 30, 50, 75, 100] as const;
export type PalierInfini = (typeof PALIERS_INFINI)[number];
export function estPalierInfini(x: unknown): x is PalierInfini {
  return typeof x === 'number' && (PALIERS_INFINI as readonly number[]).includes(x);
}
/** Ce que rapporte un palier de l'infini, la première (et seule) fois. */
export const RECOMPENSES_PALIERS_INFINI: Readonly<Record<PalierInfini, { readonly aretes: number; readonly braises: number }>> = {
  10: { aretes: 50, braises: 2 },
  20: { aretes: 100, braises: 3 },
  30: { aretes: 150, braises: 5 },
  50: { aretes: 250, braises: 8 },
  75: { aretes: 400, braises: 12 },
  100: { aretes: 600, braises: 20 },
};
/** Plus haute vague acceptée comme record (garde-fou contre une valeur démesurée). */
export const VAGUE_MAX_INFINI = 9999;
/** Nombre maximal de cartes ayant un record (15 + 15 cartes dessinées prévues, avec de la marge). */
export const CARTES_INFINI_MAX = 64;
/** Ordre dans lequel les disciples sont offerts : le premier que le joueur n'a pas encore. */
export const DISCIPLES_OFFERTS: readonly IdHeros[] = ['suie', 'mastoc', 'rouage', 'corbeau', 'brise_os', 'lanterne'];

// --- Collection : caisses, raretés, éclats, rangs, bonus ------------------------------------------------------

/** Les deux caisses : skins (tours de base et héros) et familiers (un par héros). */
export const TYPES_CAISSE = ['skins', 'familiers'] as const;
export type TypeCaisse = (typeof TYPES_CAISSE)[number];
export function estTypeCaisse(x: unknown): x is TypeCaisse {
  return typeof x === 'string' && (TYPES_CAISSE as readonly string[]).includes(x);
}

/** Prix d'une caisse, en braises (les deux caisses coûtent pareil). */
export const PRIX_CAISSE = 20;

/** Raretés, de la plus commune à la plus rare. */
export const RARETES = ['commun', 'rare', 'epique', 'legendaire', 'mythique'] as const;
export type Rarete = (typeof RARETES)[number];
export function estRarete(x: unknown): x is Rarete {
  return typeof x === 'string' && (RARETES as readonly string[]).includes(x);
}

/** Chances affichées, en pourcents entiers (leur somme fait 100) : ce sont aussi celles du tirage. */
export const CHANCES_RARETE: Readonly<Record<Rarete, number>> = { commun: 60, rare: 25, epique: 10, legendaire: 4, mythique: 1 };

/** Rareté à partir de laquelle une caisse « tient » la garantie : Épique ou mieux. */
export const RARETE_GARANTIE: Rarete = 'epique';
/**
 * Garantie : la caisse numéro 10 d'un type, si les 9 précédentes n'ont donné ni Épique ni mieux, en donne un. Le
 * compteur gardé par type de caisse compte donc les caisses sans Épique, de 0 à 9.
 */
export const CAISSES_AVANT_GARANTIE = 10;

/** Éclats donnés par un doublon, selon sa rareté. */
export const ECLATS_DOUBLON: Readonly<Record<Rarete, number>> = { commun: 5, rare: 10, epique: 25, legendaire: 60, mythique: 150 };
/** Éclats que coûte l'achat direct d'un objet précis, selon sa rareté. */
export const PRIX_ECLATS_OBJET: Readonly<Record<Rarete, number>> = { commun: 50, rare: 120, epique: 300, legendaire: 700, mythique: 1500 };

/** Rang maximal d'un objet de la collection ; on commence au rang 1. */
export const RANG_MAX_COLLECTION = 5;
/** Éclats que coûte le passage du rang `rang` au rang `rang + 1` : 20 × rang. */
export function coutRangEclats(rang: number): number {
  return 20 * rang;
}

/** Bonus de base d'un skin, en pourcents, selon sa rareté (Commun +1 % à Mythique +5 %). */
export const BONUS_SKIN_POURCENT: Readonly<Record<Rarete, number>> = { commun: 1, rare: 2, epique: 3, legendaire: 4, mythique: 5 };
/** Bonus de base d'un familier, en pourcents, selon sa rareté. */
export const BONUS_FAMILIER_POURCENT: Readonly<Record<Rarete, number>> = { commun: 1, rare: 1.5, epique: 2, legendaire: 3, mythique: 4 };
/** Chaque rang au-dessus du premier ajoute 25 % du bonus de base (multiplicateur 1 + 0,25 × (rang − 1)). */
export const PAS_RANG_BONUS_POURCENT = 25;
/** Plafond du bonus total d'une tour ou d'un héros, en pourcents. */
export const PLAFOND_BONUS_POURCENT = 10;
/** Les bonus se calculent en entiers de 1/100 000 (1 % = 1 000) pour que sommes et plafond soient exacts. */
export const ECHELLE_BONUS = 100_000;

/** Bonus d'un objet de rang `rang` dont le bonus de base est `basePourcent`, en entiers de 1/100 000 (voir `ECHELLE_BONUS`). */
export function bonusEnEntiers(basePourcent: number, rang: number): number {
  const base = Math.round(basePourcent * (ECHELLE_BONUS / 100));
  return Math.round((base * (100 + PAS_RANG_BONUS_POURCENT * (rang - 1))) / 100);
}

/** Le plafond de bonus, dans la même unité. */
export const PLAFOND_BONUS_ENTIERS = Math.round(PLAFOND_BONUS_POURCENT * (ECHELLE_BONUS / 100));
