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

function estEssaim(typeEnnemi: string): boolean {
  if (!Object.hasOwn(ENNEMIS, typeEnnemi)) return false;
  return (ENNEMIS as Readonly<Record<string, { readonly pouvoirs?: { readonly essaim?: number } }>>)[typeEnnemi]?.pouvoirs?.essaim !== undefined;
}

/**
 * Un son de `SONS` réglé pour un événement : le même fichier peut servir plusieurs événements, chacun avec son volume, sa
 * hauteur et sa limite de répétition (pas de nouveau fichier pour une nuance).
 */
export interface LectureSon {
  readonly id: IdSon;
  /** Facteur appliqué au volume propre du son (1 par défaut) ; le produit reste dans ]0, 1]. */
  readonly volume?: number;
  /** Facteur appliqué à la hauteur propre du son (1 par défaut) : moins de 1 = plus grave. */
  readonly hauteur?: number;
  /** Clé du limiteur (l'id du son par défaut) : une clé à part donne à cet événement sa propre limite, sans manger celle du son. */
  readonly cle?: string;
  /** Instances permises dans la fenêtre du limiteur pour cette clé (`max` du son par défaut). */
  readonly max?: number;
  /** Retard de départ en secondes (0 par défaut) : pour égrener des notes. */
  readonly delai?: number;
  /** Lectures lancées avec celle-ci (en général avec un `delai`) : un coup suivi d'un carillon, par exemple. */
  readonly suite?: readonly LectureSon[];
}

/** Une lecture réglée : un son à volume et hauteur adaptés, avec sa limite propre (raccourci de `LectureSon`). */
function lecture(id: IdSon, volume: number, hauteur: number, cle?: string, max?: number): LectureSon {
  return { id, volume, hauteur, ...(cle === undefined ? {} : { cle }), ...(max === undefined ? {} : { max }) };
}

/** Hauteurs (facteurs) des trois notes du carillon d'amélioration : une tierce majeure puis une quinte, qui montent. */
const NOTES_CARILLON: readonly number[] = [1.5, 1.875, 2.25];

/**
 * Le son d'une amélioration : un coup de marteau sur la planche et le bois qui craque, puis un carillon montant d'une note par
 * niveau gagné (niveau 2 : 1 note, niveau 3 : 2 notes). Une spécialisation (niveau 4, voie choisie) sonne plus grave, en 3 notes.
 */
export function sonAmelioration(niveau: number, specialisation: boolean): LectureSon {
  const notes = specialisation ? 3 : Math.min(3, Math.max(1, Math.floor(niveau) - 1));
  const grave = specialisation ? 0.7 : 1;
  const suite: LectureSon[] = [lecture('impact_physique', 0.9, specialisation ? 0.55 : 0.7, 'craque', 1)];
  for (let i = 0; i < notes; i++) {
    suite[i + 1] = { ...lecture('impact_magique', 0.7, (NOTES_CARILLON[i] ?? 1) * grave, 'carillon', 3), delai: 0.2 + 0.11 * i };
  }
  return { ...lecture('construction', 0.9, specialisation ? 0.85 : 1.1, 'marteau', 1), suite };
}

/**
 * Le son d'un événement : un id, une lecture réglée (`LectureSon`), `null` pour le silence (explicite), ou un choix d'après
 * l'événement et la partie.
 */
export type ReglageSon<E> = IdSon | LectureSon | null | ((evenement: E, partie: VuePartie) => IdSon | LectureSon | null);

export type TableEvenements = { readonly [T in Evenement['type']]: ReglageSon<Extract<Evenement, { type: T }>> };

/**
 * Événement du moteur -> son. Chaque type d'événement a une entrée (un test le vérifie) : `null` dit
 * « silence voulu » (trop fréquent, ou rien à entendre), pas « oublié ».
 */
export const SON_DES_EVENEMENTS: TableEvenements = {
  vague: 'vague',
  apparition: null,
  fuite: 'vie_perdue',
  // Un essaim (sangsues, rats de peste) qui tombe d'un coup ne fait qu'un son, plus doux : pas de mitraille.
  mort: (e) => (estBoss(e.typeEnnemi) ? 'mort_boss' : estEssaim(e.typeEnnemi) ? lecture('mort_ennemi', 0.7, 1.15, 'mort_essaim', 1) : 'mort_ennemi'),
  construction: 'construction',
  amelioration: (e) => sonAmelioration(e.niveau, e.voie !== null),
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
  piege_desamorce: lecture('piege', 0.8, 0.8, 'piege_desamorce', 2),
  structure: 'construction',
  tir_structure: 'tir_carreau',
  structure_fin: null,
  boost: 'amelioration',
  ralliement: 'clic',
  ordre_heros: 'clic',
  // Mécaniques des ennemis (régions 2 à 5) : pas de fichier de plus, les sons existants réglés par événement (volume, hauteur).
  // Les événements qui peuvent venir en grappe (brûlures, soins du médecin, appels) ont leur propre limite d'une instance.
  /** Le corps tombe : la chute d'une unité, plus grave et plus lourde. */
  releve: lecture('mort_unite', 1, 0.8),
  /** Le boss plonge : la plaque de métal lourde de l'onde de choc, très grave, comme une grosse gerbe. */
  plongee: lecture('onde_choc', 0.9, 0.7),
  /** Il refait surface ou se relève : l'éclat de verre, plus aigu. */
  emergence: lecture('impact_magique', 0.8, 1.2),
  /** Un soldat prend feu : le souffle du sort, aigu et discret. */
  brulure: lecture('sort', 0.55, 1.5, 'brulure', 1),
  /** Un soldat est entraîné sous l'eau : un choc sourd et grave, comme un glouglou. */
  noyade: lecture('impact_physique', 1.3, 0.6),
  /** Le médecin soigne : le son du soin, plus grave et plus bas que les soins des alliés. */
  soin_ennemi: lecture('soin', 0.6, 0.85, 'soin_ennemi', 1),
  /** La Faim hurle : le souffle du sort, très grave. */
  famine: lecture('sort', 0.8, 0.6),
  /** Une tour prend feu : un éclat de braise, plus léger que l'explosion de la catapulte. */
  tour_desactivee: lecture('explosion', 0.6, 1.3),
  /** La Mère des Rats ou le Juge appelle du renfort : le souffle du sort, grave, une fois à la fois. */
  appel: lecture('sort', 0.7, 0.75, 'appel', 1),
  // Mécaniques des régions 6 à 10 : sons existants réglés par événement, en attendant des fichiers dédiés.
  /** Un soldat est enterré : un choc sourd, une fois à la fois. */
  enterre: lecture('impact_physique', 1, 0.5, 'enterre', 1),
  /** Le Cavalier renverse un soldat : un choc lourd. */
  renversement: lecture('impact_physique', 1.3, 0.7),
  /** Une tour gèle : l'éclat de verre, aigu. */
  tour_gelee: lecture('impact_magique', 0.7, 1.4, 'tour_gelee', 1),
  /** Le Soleil Blême aveugle les tours : le souffle du sort, très aigu. */
  aveuglement: lecture('sort', 0.8, 1.6),
  /** Un Exorciste bannit : le souffle du sort, aigu. */
  bannissement: lecture('sort', 0.7, 1.3, 'bannissement', 1),
  /** Le Roi des Fosses relève ses morts : le souffle du sort, très grave. */
  resurrection: lecture('sort', 0.9, 0.5),
  /** La charge du Prince Croisé : l'onde de choc, grave. */
  charge: lecture('onde_choc', 0.7, 0.8),
  /** Un boss devient intouchable : l'éclat de verre, aigu et fort. */
  invulnerabilite: lecture('impact_magique', 0.9, 1.6),
  // Mécaniques de la variété des ennemis : sons existants réglés par événement.
  /** Une Gerbe Ardente explose : l'explosion de la catapulte, plus aiguë. */
  explosion: lecture('explosion', 0.8, 1.2),
  /** Le Crapaud bondit : un choc sourd et grave. */
  bond: lecture('impact_physique', 0.8, 0.6, 'bond', 1),
  /** Le Coupe-Bourse vole : un éclat de verre, aigu et discret. */
  vol: lecture('impact_magique', 0.7, 1.7),
  /** Un Grand Manteau se défait : le souffle du sort, grave. */
  division: lecture('sort', 0.7, 0.7, 'division', 1),
  /** La dernière lueur d'un Martyr Blême : le soin, très grave. */
  derniere_lueur: lecture('soin', 0.7, 0.6, 'derniere_lueur', 1),
  /** L'Aumônier purifie : le soin, aigu. */
  purification: lecture('soin', 0.6, 1.4, 'purification', 1),
  /** Le Chantre terrifie : le souffle du sort, très grave. */
  terreur: lecture('sort', 0.9, 0.55, 'terreur', 1),
  /** Le Sapeur désamorce : un choc sec. */
  desamorcage: lecture('impact_physique', 0.9, 1.1, 'desamorcage', 1),
  /** L'Effigie change de peau : l'éclat de verre, grave. */
  inversion: lecture('impact_magique', 0.6, 0.8, 'inversion', 1),
  fin: (e) => (e.statut === 'victoire' ? 'victoire' : e.statut === 'defaite' ? 'defaite' : null),
};

/** La lecture à lancer pour un événement (son, facteurs, limite), ou null pour le silence. */
export function lectureDe(evenement: Evenement, partie: VuePartie = PARTIE_VIDE): LectureSon | null {
  const regle = (SON_DES_EVENEMENTS as Readonly<Record<string, ReglageSon<Evenement>>>)[evenement.type];
  if (regle === undefined || regle === null) return null;
  const resultat = typeof regle === 'function' ? regle(evenement, partie) : regle;
  if (resultat === null) return null;
  return typeof resultat === 'string' ? { id: resultat } : resultat;
}

/** Le son à jouer pour un événement, ou null. */
export function sonDe(evenement: Evenement, partie: VuePartie = PARTIE_VIDE): IdSon | null {
  return lectureDe(evenement, partie)?.id ?? null;
}
