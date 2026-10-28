// Plan d'un niveau de campagne : quelle carte, quels chemins et socles, quels ennemis, combien de vagues, quelles
// familles de tours pour le défi Fer. Les vagues elles-mêmes ne sont pas ici : `npm run niveaux` les génère depuis le
// plan et les fige dans vagues-region<N>.ts. Changer un plan (ennemis, nombre de vagues, graine, nombre de chemins)
// demande de relancer `npm run niveaux`, un test le rappelle.
import type { DefiFer } from '../../engine/definitions';
import type { IdEnnemi } from '../ennemis';
import type { IdCarte } from './cartes-toutes';
import type { BossDeVague } from './generation';

export interface PlanNiveau {
  /** Numéro de campagne, de 1 à 100 (10 niveaux par région) : c'est le niveau L du budget de menace b(L, w). */
  readonly numero: number;
  readonly carte: IdCarte;
  /** Chemins de la carte utilisés (entrées), dans l'ordre : le paquet `chemin: i` suit `chemins[i]`. */
  readonly chemins: readonly number[];
  /** Socles de la carte utilisés, dans l'ordre : leur indice dans le niveau est leur rang ici. */
  readonly socles: readonly number[];
  readonly aretesDepart: number;
  /** Les deux seules familles de tours du défi Fer sur ce niveau (choisies pour que le niveau reste jouable). */
  readonly defiFer: DefiFer;
  /** Clés de src/i18n/fr.ts. */
  readonly nom: string;
  readonly ambiance: string;
  readonly vagues: {
    readonly nombre: number;
    readonly ennemis: readonly IdEnnemi[];
    readonly graine: number;
    readonly boss?: BossDeVague;
    /** Vagues retouchées à la main : le test de cohérence avec le générateur les laisse de côté. */
    readonly retouchees?: boolean;
  };
}

/** Les ennemis ordinaires de chaque région, dans l'ordre où elle les débloque (indice 0 = région 1). */
export const ENNEMIS_REGIONS: readonly (readonly IdEnnemi[])[] = [
  ['paysan_affame', 'mendiant', 'chien_errant'],
  ['glaneur', 'corbeau_noir', 'epouvantail'],
  ['porteur_torche', 'chasseur_sorcieres', 'delateur'],
  ['noyeur', 'pelerin_voile', 'sangsue'],
  ['rat_peste', 'pestifere', 'medecin_peste'],
];

/** Le boss de chaque région, au niveau 10 (indice 0 = région 1). */
export const BOSS_REGIONS: readonly IdEnnemi[] = ['boucher_vaudrelle', 'la_faim', 'juge_flammes', 'dame_puits', 'mere_rats'];

/** Niveau de la région à partir duquel les ennemis des régions précédentes se mêlent aux siens. */
export const NIVEAU_MELANGE = 4;

/**
 * Les ennemis du niveau `k` (1 à 10) de la région `region` (2 à 5), dans l'ordre du tirage : ceux de la région, un de
 * plus à chaque niveau (tous au niveau 3), puis dès le niveau 4 ceux des régions précédentes, de la plus proche à la plus
 * lointaine. Le boss n'en fait pas partie : le plan l'ajoute à la dernière vague du niveau 10.
 */
export function ennemisDuNiveau(region: number, k: number): readonly IdEnnemi[] {
  const propres = ENNEMIS_REGIONS[region - 1]?.slice(0, k) ?? [];
  if (k < NIVEAU_MELANGE) return propres;
  return [...propres, ...ENNEMIS_REGIONS.slice(0, region - 1).reverse().flat()];
}
