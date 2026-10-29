// Les statues cachées dans le décor des 31 cartes (jalon 5, « Les dieux sans visage »). Une vieille statue de chat par carte, posée
// sur une case de décor : hors chemin, sur une case que le décor interdit déjà à la construction (donc jamais une case où l'on
// pourrait poser une tour), et sans rien recouvrir. La toucher pendant une partie révèle l'inscription de la carte
// (`inscription.<id de carte>` dans src/i18n/fr-lore.ts), rangée dans le recueil. C'est de la méta : aucun effet sur la partie.
//
// Le moteur ne lit pas ce fichier. Un test (statues.test.ts) vérifie, pour chaque niveau de campagne, que la case de la statue est
// dans la carte, interdite à la construction et hors chemin.
import { CARTES, type IdCarte } from './cartes-toutes';

/** D'où vient l'inscription : une des trois entités, ou les hommes de l'Église du Soleil Blême qui veulent effacer (docs/lore.md). */
export type OrigineStatue = 'colosse' | 'ombre' | 'trois_pattes' | 'eglise';

/** Une statue : la carte qui la porte (et dont l'inscription porte le nom), son pied (ancre du sprite, en tuiles) et son origine, qui choisit le sprite. */
export interface StatueCarte {
  readonly id: IdCarte;
  readonly x: number;
  readonly y: number;
  readonly origine: OrigineStatue;
}

/** Sprite de décor d'une origine (art/sprites/statues.txt). */
export const SPRITE_STATUE: Readonly<Record<OrigineStatue, string>> = {
  colosse: 'statue-colosse',
  ombre: 'statue-ombre',
  trois_pattes: 'statue-trois-pattes',
  eglise: 'statue-eglise',
};

/** Le sprite de décor commun à toutes les statues, pour les listes (le jeu choisit selon l'origine). */
export const SPRITES_STATUES: readonly string[] = Object.values(SPRITE_STATUE);

const POSITIONS: Readonly<Record<IdCarte, Omit<StatueCarte, 'id'>>> = {
  // Région 1 : le Village Affamé
  chaumes: { x: 19, y: 7, origine: 'colosse' },
  gue: { x: 3.5, y: 15, origine: 'ombre' },
  pendus: { x: 17.5, y: 15.9, origine: 'eglise' },
  carrefour: { x: 18.5, y: 15, origine: 'trois_pattes' },
  // Région 2
  sillons: { x: 26.5, y: 7, origine: 'trois_pattes' },
  meules: { x: 16.5, y: 3, origine: 'colosse' },
  aire: { x: 2.5, y: 7, origine: 'ombre' },
  // Région 3
  ruelles: { x: 30.5, y: 5, origine: 'ombre' },
  place: { x: 23.5, y: 3, origine: 'eglise' },
  beffroi: { x: 16.5, y: 3.5, origine: 'colosse' },
  // Région 4
  ponton: { x: 22.5, y: 7.5, origine: 'trois_pattes' },
  etang: { x: 18.5, y: 3.5, origine: 'ombre' },
  saules: { x: 9.5, y: 15, origine: 'eglise' },
  // Région 5
  quarantaine: { x: 17.5, y: 5, origine: 'eglise' },
  faubourg: { x: 7, y: 3.5, origine: 'trois_pattes' },
  marche: { x: 2.5, y: 5, origine: 'colosse' },
  // Région 6
  fossoyage: { x: 4.5, y: 15.5, origine: 'colosse' },
  tertres: { x: 11, y: 7, origine: 'trois_pattes' },
  ossuaire: { x: 1.5, y: 15, origine: 'ombre' },
  // Région 7
  bivouac: { x: 1.5, y: 15, origine: 'colosse' },
  palissade: { x: 3, y: 11.5, origine: 'trois_pattes' },
  baliste: { x: 2.5, y: 15.5, origine: 'eglise' },
  // Région 8
  cloitre: { x: 9, y: 9, origine: 'ombre' },
  refectoire: { x: 5, y: 13.5, origine: 'colosse' },
  scriptorium: { x: 3.5, y: 3, origine: 'eglise' },
  // Région 9
  avenue: { x: 25.5, y: 13, origine: 'eglise' },
  douves: { x: 29.5, y: 11, origine: 'trois_pattes' },
  pont_levis: { x: 10.5, y: 13, origine: 'colosse' },
  // Région 10
  nef: { x: 29, y: 3, origine: 'ombre' },
  transept: { x: 3, y: 11, origine: 'trois_pattes' },
  choeur: { x: 20.5, y: 3, origine: 'ombre' },
};

/** Les statues, par identifiant de carte. */
export const STATUES: Readonly<Record<IdCarte, StatueCarte>> = Object.fromEntries(
  (Object.keys(POSITIONS) as IdCarte[]).map((id) => [id, { id, ...POSITIONS[id] }]),
) as Record<IdCarte, StatueCarte>;

/** Les identifiants des 31 inscriptions (ceux des cartes), dans l'ordre de la campagne : l'ordre du recueil et de la sauvegarde. */
export const IDS_INSCRIPTIONS: readonly IdCarte[] = Object.keys(CARTES) as IdCarte[];

export type IdInscription = IdCarte;

/** `x` est-il l'identifiant d'une inscription (jamais un nom hérité d'Object) ? */
export function estIdInscription(x: unknown): x is IdInscription {
  return typeof x === 'string' && Object.hasOwn(STATUES, x);
}

/** Clé de texte de l'inscription d'une carte. */
export function cleInscription(id: IdInscription): `inscription.${string}` {
  return `inscription.${id}`;
}
