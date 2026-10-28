// Données du son : les bruitages (fichier, volume, hauteur, importance) et la table « événement du moteur -> son ».
// Aucune logique de lecture ici : `moteur.ts` joue ce que cette table décrit. Les fichiers sont dans public/sons/
// (`<id>.ogg`) ; d'où ils viennent est dans tools/sons/catalogue.ts.
import { ENNEMIS } from '../data/ennemis';
import type { Evenement } from '../engine';
import type { Priorite } from './limiteur';

export type BusAudio = 'effets' | 'interface';

export interface DefSon {
  /** Volume propre du son, de 0 à 1, avant le volume des réglages. */
  readonly volume: number;
  /** Vitesse de lecture de base : 1 = hauteur d'origine, moins = plus grave. */
  readonly hauteur: number;
  /** Variation aléatoire de hauteur à chaque lecture, en fraction (0,08 = ± 8 %). 0 pour une cloche ou un clic. */
  readonly variation: number;
  /** Importance : décide de ce qui survit quand la fenêtre du limiteur est pleine. */
  readonly priorite: Priorite;
  /** Instances du même son permises dans une fenêtre de 80 ms. */
  readonly max: number;
  readonly bus: BusAudio;
}

function son(volume: number, hauteur: number, variation: number, priorite: Priorite, max: number, bus: BusAudio = 'effets'): DefSon {
  return { volume, hauteur, variation, priorite, max, bus };
}

/** Tous les bruitages. L'identifiant est aussi le nom du fichier : `public/sons/<id>.ogg`. */
export const SONS = {
  tir_fleche: son(0.5, 1, 0.08, 'basse', 2),
  tir_carreau: son(0.5, 1, 0.06, 'basse', 2),
  impact_physique: son(0.45, 1, 0.1, 'basse', 2),
  impact_magique: son(0.5, 0.85, 0.08, 'normale', 2),
  explosion: son(0.8, 0.75, 0.06, 'normale', 2),
  onde_choc: son(0.7, 0.9, 0.05, 'normale', 1),
  coup_epee: son(0.5, 1, 0.08, 'basse', 2),
  coup_griffe: son(0.45, 1, 0.1, 'basse', 2),
  coup_ennemi: son(0.45, 1, 0.1, 'basse', 2),
  mort_ennemi: son(0.5, 1, 0.1, 'basse', 3),
  mort_boss: son(0.9, 0.6, 0.03, 'haute', 1),
  mort_unite: son(0.55, 0.9, 0.06, 'normale', 2),
  construction: son(0.7, 1, 0.03, 'normale', 1),
  amelioration: son(0.6, 1, 0.02, 'normale', 1),
  vente: son(0.6, 1, 0.03, 'normale', 1),
  achat: son(0.6, 1, 0, 'normale', 1, 'interface'),
  sort: son(0.65, 0.9, 0.03, 'normale', 2),
  piege: son(0.6, 1, 0.05, 'normale', 2),
  soin: son(0.4, 1.25, 0.05, 'basse', 1),
  vague: son(0.8, 0.8, 0, 'haute', 1),
  victoire: son(0.9, 1, 0, 'haute', 1),
  defaite: son(0.9, 0.7, 0, 'haute', 1),
  clic: son(0.5, 1, 0.03, 'normale', 2, 'interface'),
  refus: son(0.5, 1, 0, 'normale', 1, 'interface'),
  vie_perdue: son(0.8, 0.7, 0.03, 'haute', 1),
} as const satisfies Readonly<Record<string, DefSon>>;

export type IdSon = keyof typeof SONS;

export const IDS_SONS = Object.keys(SONS) as readonly IdSon[];

/** Sons que l'interface joue elle-même (`jouerInterface`) : ceux du bus d'interface. */
export type IdSonInterface = 'clic' | 'refus' | 'achat';

/** Ce que la table sait de la partie : de quoi retrouver la famille d'une tour ou le genre d'une unité. */
export interface VuePartie {
  readonly tours: readonly { readonly id: number; readonly famille: string }[];
  readonly unites: readonly { readonly id: number; readonly genre: string }[];
}

export const PARTIE_VIDE: VuePartie = { tours: [], unites: [] };

function familleDe(vue: VuePartie, tour: number): string | null {
  for (const t of vue.tours) if (t.id === tour) return t.famille;
  return null;
}

function genreDe(vue: VuePartie, unite: number): string | null {
  for (const u of vue.unites) if (u.id === unite) return u.genre;
  return null;
}

function estBoss(typeEnnemi: string): boolean {
  if (!Object.hasOwn(ENNEMIS, typeEnnemi)) return false;
  return (ENNEMIS as Readonly<Record<string, { readonly boss: boolean }>>)[typeEnnemi]?.boss === true;
}

/** Le son d'un événement : un id, `null` pour le silence (explicite), ou un choix d'après l'événement et la partie. */
export type ReglageSon<E> = IdSon | null | ((evenement: E, partie: VuePartie) => IdSon | null);

export type TableEvenements = { readonly [T in Evenement['type']]: ReglageSon<Extract<Evenement, { type: T }>> };

/**
 * Événement du moteur -> son. Chaque type d'événement a une entrée (un test le vérifie) : `null` dit
 * « silence voulu » (trop fréquent, ou rien à entendre), pas « oublié ».
 */
export const SON_DES_EVENEMENTS: TableEvenements = {
  vague: 'vague',
  apparition: null,
  fuite: 'vie_perdue',
  mort: (e) => (estBoss(e.typeEnnemi) ? 'mort_boss' : 'mort_ennemi'),
  construction: 'construction',
  amelioration: 'amelioration',
  vente: 'vente',
  tir: (e, p) => {
    const famille = familleDe(p, e.tour);
    if (famille === 'tir') return 'tir_fleche';
    if (famille === 'artillerie') return 'tir_carreau';
    return null;
  },
  impact: (e, p) => {
    const famille = familleDe(p, e.tour);
    if (famille === 'magie') return 'impact_magique';
    if (famille === 'artillerie') return e.zone > 0 ? 'explosion' : 'impact_physique';
    return 'impact_physique';
  },
  onde: 'onde_choc',
  coup: (e, p) => (genreDe(p, e.unite) === 'heros' ? 'coup_epee' : 'coup_griffe'),
  coup_ennemi: (e) => (e.distance ? 'tir_fleche' : 'coup_ennemi'),
  devore: 'coup_griffe',
  mort_unite: 'mort_unite',
  reapparition: null,
  invocation: 'sort',
  sort: 'sort',
  objet: 'sort',
  competence_tour: 'amelioration',
  tir_unite: 'tir_fleche',
  esquive: null,
  soin: 'soin',
  regain_vies: 'soin',
  execution: 'coup_epee',
  zone: 'impact_magique',
  zone_fin: null,
  piege_pose: null,
  piege_declenche: 'piege',
  structure: 'construction',
  tir_structure: 'tir_carreau',
  structure_fin: null,
  boost: 'amelioration',
  ralliement: 'clic',
  ordre_heros: 'clic',
  // Mécaniques des ennemis : le choix des sons est à faire avec les bruitages des régions 2 à 5 (silence provisoire).
  releve: null,
  plongee: null,
  emergence: null,
  brulure: null,
  noyade: null,
  soin_ennemi: 'soin',
  famine: 'sort',
  tour_desactivee: null,
  appel: 'sort',
  fin: (e) => (e.statut === 'victoire' ? 'victoire' : e.statut === 'defaite' ? 'defaite' : null),
};

/** Le son à jouer pour un événement, ou null. */
export function sonDe(evenement: Evenement, partie: VuePartie = PARTIE_VIDE): IdSon | null {
  const regle = (SON_DES_EVENEMENTS as Readonly<Record<string, ReglageSon<Evenement>>>)[evenement.type];
  if (regle === undefined || regle === null) return null;
  return typeof regle === 'string' ? regle : regle(evenement, partie);
}
