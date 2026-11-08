// Plan d'un niveau de campagne : quelle carte, quels chemins, quels ennemis, combien de vagues, quelles
// familles de tours pour le défi Fer. Les vagues elles-mêmes ne sont pas ici : `npm run niveaux` les génère depuis le
// plan et les fige dans vagues-region<N>.ts. Changer un plan (ennemis, nombre de vagues, graine, nombre de chemins)
// demande de relancer `npm run niveaux`, un test le rappelle.
import type { DefiFer, Gimmick } from '../../engine/definitions';
import type { IdEnnemi } from '../ennemis';
import type { IdCarte } from './cartes-toutes';
import type { BossDeVague } from './generation';

export interface PlanNiveau {
  /** Numéro de campagne, de 1 à 110 (10 niveaux par région) : c'est le niveau L du budget de menace b(L, w). */
  readonly numero: number;
  readonly carte: IdCarte;
  /** Chemins de la carte utilisés (entrées), dans l'ordre : le paquet `chemin: i` suit `chemins[i]`. */
  readonly chemins: readonly number[];
  readonly aretesDepart: number;
  /** Les deux seules familles de tours du défi Fer sur ce niveau (choisies pour que le niveau reste jouable). */
  readonly defiFer: DefiFer;
  /** Particularité du niveau (régions 11 à 15), copiée telle quelle dans le `Niveau` ; absente = niveau ordinaire. */
  readonly gimmick?: Gimmick;
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
    /**
     * Niveau de horde (jalon 5) : nombreux ennemis faibles et serrés (la densité d'avant), là où les tours de zone doivent briller.
     * Absent = niveau ordinaire : environ deux fois moins d'ennemis, deux fois plus solides, espacés de `EQUILIBRAGE.ecartMinimalTuiles` (1,3 tuile ; au moins 0,8).
     */
    readonly horde?: boolean;
    /** Écart minimal entre deux ennemis d'un paquet (tuiles, au moins 0,8) à la place de la valeur commune `EQUILIBRAGE.ecartMinimalTuiles` : réglage fin d'un niveau. */
    readonly ecart?: number;
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

/**
 * Le boss de chaque région, au niveau 10 (indice 0 = région 1) : les dix de l'histoire, puis ceux de l'après-histoire (région 11 : le
 * Passeur, au niveau 110, avec le Radeau). Les régions 11 et suivantes n'ont pas d'ennemis ordinaires à elles (`ENNEMIS_REGIONS` s'arrête
 * à la région 10) : leurs plans choisissent parmi les ennemis existants.
 */
export const BOSS_REGIONS: readonly IdEnnemi[] = ['boucher_vaudrelle', 'la_faim', 'juge_flammes', 'dame_puits', 'mere_rats', 'roi_fosses', 'prince_croise', 'grand_inquisiteur', 'roi_fou', 'soleil_bleme', 'passeur'];

/**
 * Les deux ennemis inédits de chaque région (indice 0 = région 1) : le premier arrive au niveau 4, le second au niveau 7
 * (`NIVEAUX_NOUVEAUX`). Chacun a un rôle mécanique propre (docs/specs/2026-11-03-lisibilite-bestiaire-variete.md).
 */
export const NOUVEAUX_ENNEMIS_REGIONS: readonly (readonly [IdEnnemi, IdEnnemi])[] = [
  ['coupe_bourse', 'grand_manteau'],
  ['gerbe_ardente', 'porte_herse'],
  ['fagotier', 'crieur_public'],
  ['crapaud_gonfle', 'lueur_marais'],
  ['montreur_rats', 'bubonneux'],
  ['deterreur', 'fagot_os'],
  ['sapeur', 'aumonier'],
  ['chantre', 'frere_sans_porte'],
  ['effigie_roi', 'bourreau_roi'],
  ['gargouille', 'martyr_bleme'],
];

/** Niveau de la région (de 1 à 10) où arrive chacun des deux nouveaux ennemis. */
export const NIVEAUX_NOUVEAUX: readonly [number, number] = [4, 7];

/**
 * Les ennemis des régions précédentes que chaque région reprend dans ses plans de vagues, dès `NIVEAU_MELANGE` (indice 0 =
 * région 1, qui n'en reprend aucun). Un choix à la main, pas « tout ce qui précède » : la liste garde les nouveaux ennemis visibles
 * et rappelle ce que le joueur a déjà dû contrer (volants, armures, essaims).
 */
export const REPRISES_REGIONS: readonly (readonly IdEnnemi[])[] = [
  [],
  ['chien_errant', 'mendiant', 'coupe_bourse'],
  ['paysan_affame', 'corbeau_noir', 'gerbe_ardente'],
  ['chasseur_sorcieres', 'crieur_public', 'corbeau_noir'],
  ['sangsue', 'pelerin_voile', 'fagotier'],
  ['rat_peste', 'pestifere', 'crapaud_gonfle'],
  ['fossoyeur', 'chauve_souris', 'deterreur'],
  ['fantassin', 'medecin_peste', 'sapeur'],
  ['cavalier', 'exorciste', 'chantre'],
  ['garde_royal', 'inquisiteur', 'effigie_roi', 'bourreau_roi'],
];

/** Niveau de la région à partir duquel les ennemis repris des régions précédentes se mêlent aux siens. */
export const NIVEAU_MELANGE = 4;

/** Les nouveaux ennemis de la région déjà arrivés au niveau `k` (0, 1 ou 2). */
export function nouveauxEnnemisDuNiveau(region: number, k: number): readonly IdEnnemi[] {
  const nouveaux = NOUVEAUX_ENNEMIS_REGIONS[region - 1] ?? [];
  return nouveaux.filter((_, i) => k >= (NIVEAUX_NOUVEAUX[i] ?? Infinity));
}

/**
 * Les ennemis du niveau `k` (1 à 10) de la région `region` (2 à 10), dans l'ordre du tirage : ceux de la région, un de
 * plus à chaque niveau (tous au niveau 3, ou au niveau 2 pour la région 10 qui n'en a que deux), ses nouveaux ennemis
 * (le premier au niveau 4, le second au niveau 7), puis dès le niveau 4 ceux qu'elle reprend des régions précédentes
 * (`REPRISES_REGIONS`). Le boss n'en fait pas partie : le plan l'ajoute à la dernière vague du niveau 10.
 */
export function ennemisDuNiveau(region: number, k: number): readonly IdEnnemi[] {
  const propres = ENNEMIS_REGIONS[region - 1]?.slice(0, k) ?? [];
  const nouveaux = nouveauxEnnemisDuNiveau(region, k);
  if (k < NIVEAU_MELANGE) return [...propres, ...nouveaux];
  return [...propres, ...nouveaux, ...(REPRISES_REGIONS[region - 1] ?? [])];
}
