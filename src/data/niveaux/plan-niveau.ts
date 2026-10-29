// Plan d'un niveau de campagne : quelle carte, quels chemins, quels ennemis, combien de vagues, quelles
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
    /**
     * Facteur sur le budget de menace b(L, w) des vagues du niveau (1 si absent). Réglage fin des régions 6 à 10 (jalon 4) : la menace
     * d'un ennemi ne chiffre pas ce que valent ses mécaniques contre un joueur (armure 60 à 90 %, invocations), si bien que le même
     * budget y est plus dur qu'aux régions 1 à 5. Jamais utilisé par les régions 1 à 5 (leurs vagues sont intactes).
     */
    readonly facteurBudget?: number;
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
  ['fossoyeur', 'creux', 'chauve_souris'],
  ['fantassin', 'porte_banniere', 'cavalier'],
  ['flagellant', 'inquisiteur', 'exorciste'],
  ['garde_royal', 'arbaletrier_elite', 'chevalier'],
  // La région 10 n'a que deux ennemis ordinaires : le Soleil Blême tient le reste de la cathédrale.
  ['acolyte_cendre', 'ange_cendre'],
];

/** Le boss de chaque région, au niveau 10 (indice 0 = région 1). */
export const BOSS_REGIONS: readonly IdEnnemi[] = ['boucher_vaudrelle', 'la_faim', 'juge_flammes', 'dame_puits', 'mere_rats', 'roi_fosses', 'prince_croise', 'grand_inquisiteur', 'roi_fou', 'soleil_bleme'];

/** Niveau de la région à partir duquel les ennemis des régions précédentes se mêlent aux siens. */
export const NIVEAU_MELANGE = 4;

/**
 * Les ennemis du niveau `k` (1 à 10) de la région `region` (2 à 10), dans l'ordre du tirage : ceux de la région, un de
 * plus à chaque niveau (tous au niveau 3, ou au niveau 2 pour la région 10 qui n'en a que deux), puis dès le niveau 4 ceux des régions précédentes, de la plus proche à la plus
 * lointaine. Le boss n'en fait pas partie : le plan l'ajoute à la dernière vague du niveau 10.
 */
export function ennemisDuNiveau(region: number, k: number): readonly IdEnnemi[] {
  const propres = ENNEMIS_REGIONS[region - 1]?.slice(0, k) ?? [];
  if (k < NIVEAU_MELANGE) return propres;
  return [...propres, ...ENNEMIS_REGIONS.slice(0, region - 1).reverse().flat()];
}
