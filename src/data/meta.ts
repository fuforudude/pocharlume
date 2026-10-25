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
 * Braises gagnées par une victoire : 10 à la première victoire sur un boss, 2 la première fois qu'un niveau atteint
 * ses 3 étoiles.
 */
export function braisesDeVictoire(niveau: number, premiereVictoire: boolean, premieresTroisEtoiles: boolean): number {
  return (premiereVictoire && estNiveauBoss(niveau) ? 10 : 0) + (premieresTroisEtoiles ? 2 : 0);
}

/** Expérience gagnée par le héros joué : 100 + 20 × N pour une victoire, la moitié pour une défaite. */
export function xpDePartie(niveau: number, victoire: boolean): number {
  const xp = 100 + 20 * niveau;
  return victoire ? xp : xp / 2;
}
