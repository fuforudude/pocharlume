// Correspondance entre le contenu du jeu (types d'ennemis, tours, unités, sorts) et les noms de sprites de
// l'atlas. C'est de l'habillage : le moteur ne le lit jamais, et les tests vérifient que chaque nom existe.
import type { FamilleTour, GenreUnite } from '../engine/etat';
import type { Voie } from '../engine/definitions';

/** Sprite d'un ennemi : son identifiant avec des tirets (paysan_affame devient paysan-affame). */
export function spriteEnnemi(type: string): string {
  return type.replaceAll('_', '-');
}

/** Sprite des unités alliées d'après le nom (clé de texte) de leurs stats. */
const SPRITES_UNITES: Readonly<Record<string, string>> = {
  'unite.chat_de_grange': 'soldat-grange',
  'unite.garde_du_cloitre': 'garde-cloitre',
  'unite.ecorcheur': 'ecorcheur',
  'unite.spectre': 'spectre-chat',
  'unite.gros_matou': 'gros-matou',
  'heros.charlie': 'charlie',
};

export function spriteUnite(_genre: GenreUnite, nomStats: string): string {
  return Object.hasOwn(SPRITES_UNITES, nomStats) ? (SPRITES_UNITES[nomStats] ?? '') : '';
}

const SPRITES_SPECIALISATIONS: Readonly<Record<string, Readonly<Record<Voie, string>>>> = {
  caserne: { A: 'tour-caserne-cloitre', B: 'tour-caserne-ecorcheurs' },
  tir: { A: 'tour-tir-guetteurs', B: 'tour-tir-beffroi' },
  magie: { A: 'tour-magie-oracle', B: 'tour-magie-necromancien' },
  artillerie: { A: 'tour-artillerie-mortier', B: 'tour-artillerie-baliste' },
};

/** Sprite d'une tour selon sa famille, son niveau (1 à 4) et sa spécialisation. */
export function spriteTour(famille: FamilleTour, niveau: number, voie: Voie | null): string {
  if (famille === 'divine') return 'tour-totem';
  if (niveau >= 4 && voie !== null) return SPRITES_SPECIALISATIONS[famille]?.[voie] ?? `tour-${famille}-3`;
  return `tour-${famille}-${String(Math.min(Math.max(niveau, 1), 3))}`;
}

/** Chat tireur posé au sommet d'une tour de tir (au point `tireur` de son sprite), null pour les autres. */
export function spriteTireur(famille: FamilleTour, niveau: number, voie: Voie | null): string | null {
  if (famille !== 'tir') return null;
  if (niveau >= 4) return voie === 'A' ? 'guetteur-chat' : 'arbaletrier-chat';
  return 'archer-chat';
}

/** Point du sprite d'une tour d'où part le projectile (tireur ou tir), s'il y en a un. */
export function nomPointDeTir(famille: FamilleTour): string | null {
  if (famille === 'tir') return 'tireur';
  if (famille === 'magie' || famille === 'artillerie') return 'tir';
  return null;
}

const SPRITES_PROJECTILES: Readonly<Record<string, string>> = {
  'tour.clocher_des_archers': 'fleche',
  'tour.guetteurs_des_toits': 'fleche-poison',
  'tour.arbaletriers_du_beffroi': 'carreau',
  'tour.autel_des_cendres': 'boule-cendre',
  'tour.oracle_de_la_braise': 'boule-cendre',
  'tour.necromancien_des_neuf_vies': 'boule-cendre',
  'tour.catapulte_du_rempart': 'pierre',
  'tour.mortier_de_soufre': 'pot-soufre',
  'tour.baliste_a_chaines': 'trait-chaine',
};

/** Sprite d'un projectile d'après le nom (clé de texte) de la tour qui l'a tiré. */
export function spriteProjectile(nomTour: string): string {
  return Object.hasOwn(SPRITES_PROJECTILES, nomTour) ? (SPRITES_PROJECTILES[nomTour] ?? 'fleche') : 'fleche';
}

/** Projectiles dessinés pointe vers la droite : le rendu les tourne vers leur cible. */
export function projectileTourne(nomSprite: string): boolean {
  return nomSprite === 'fleche' || nomSprite === 'fleche-poison' || nomSprite === 'carreau' || nomSprite === 'trait-chaine';
}

const EFFETS_IMPACT: Readonly<Record<string, string>> = {
  'tour.autel_des_cendres': 'impact-cendre',
  'tour.oracle_de_la_braise': 'impact-cendre',
  'tour.necromancien_des_neuf_vies': 'impact-cendre',
  'tour.mortier_de_soufre': 'fumee',
};

/** Effet joué là où tombe un projectile. */
export function spriteImpact(nomTour: string): string {
  return Object.hasOwn(EFFETS_IMPACT, nomTour) ? (EFFETS_IMPACT[nomTour] ?? 'impact') : 'impact';
}

export interface HabillageSort {
  /** Sprite de l'effet posé sur la carte à l'endroit visé. */
  readonly effet: string;
  /** Animation du héros pendant le sort, null s'il ne bouge pas. */
  readonly animationHeros: string | null;
  /** Sprite d'icône pour le bouton du HUD. */
  readonly icone: string;
}

const SORTS: Readonly<Record<string, readonly [HabillageSort, HabillageSort]>> = {
  charlie: [
    { effet: 'onde-choc', animationHeros: 'competence', icone: 'icone-chute-colosse' },
    { effet: 'fumee', animationHeros: null, icone: 'icone-renforts' },
  ],
};

const SORT_INCONNU: HabillageSort = { effet: 'fumee', animationHeros: null, icone: 'icone-etoile' };

export function habillageSort(dieu: string, emplacement: number): HabillageSort {
  return (Object.hasOwn(SORTS, dieu) ? SORTS[dieu]?.[emplacement] : undefined) ?? SORT_INCONNU;
}

/** Icône de chaque famille de tours dans les menus. */
export function iconeFamille(famille: FamilleTour): string {
  return famille === 'divine' ? 'tour-totem' : `icone-${famille}`;
}

/** Sprite affiché dans le menu pour une tour qu'on peut construire (le premier niveau). */
export function spriteMenuTour(famille: FamilleTour): string {
  return spriteTour(famille, 1, null);
}
