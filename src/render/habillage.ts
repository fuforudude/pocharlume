// Correspondance entre le contenu du jeu (types d'ennemis, tours, unités, sorts) et les noms de sprites de
// l'atlas. C'est de l'habillage : le moteur ne le lit jamais, et les tests vérifient que chaque nom existe.
import type { FamilleTour, GenreUnite } from '../engine/etat';
import type { IdCampagne, Voie } from '../engine/definitions';

/** Sprite d'un ennemi : son identifiant avec des tirets (paysan_affame devient paysan-affame). */
export function spriteEnnemi(type: string): string {
  return type.replaceAll('_', '-');
}

/** Sprite de la version d'élite d'un ennemi (`paysan-affame-elite`). Le rendu retombe sur `spriteEnnemi` s'il manque. */
export function spriteEnnemiElite(type: string): string {
  return `${spriteEnnemi(type)}-elite`;
}

/** Sprite d'un familier d'après son id du catalogue (`familier_chauve_souris` devient `familier-chauve-souris`). */
export function spriteFamilier(id: string): string {
  return id.replaceAll('_', '-');
}

/** Id du héros d'après le nom (clé de texte) de ses stats (`heros.brise_os` donne `brise_os`), null pour une autre unité. */
export function idHerosDe(nomStats: string): string | null {
  return nomStats.startsWith('heros.') ? nomStats.slice('heros.'.length) : null;
}

/** Sprite des unités alliées d'après le nom (clé de texte) de leurs stats. */
const SPRITES_UNITES: Readonly<Record<string, string>> = {
  'unite.chat_de_grange': 'soldat-grange',
  'unite.garde_du_cloitre': 'garde-cloitre',
  'unite.ecorcheur': 'ecorcheur',
  'unite.spectre': 'spectre-chat',
  'unite.gros_matou': 'gros-matou',
  'heros.charlie': 'charlie',
  'heros.plume': 'heros-plume',
  'heros.suie': 'heros-suie',
  'heros.corbeau': 'heros-corbeau',
  'heros.mastoc': 'heros-mastoc',
  'heros.brise_os': 'heros-brise-os',
  'heros.pollen': 'heros-pollen',
  'heros.rouage': 'heros-rouage',
  'heros.lanterne': 'heros-lanterne',
  'unite.assassin_du_sanctuaire': 'assassin-ombre',
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

/** Tour divine de chaque dieu (le Totem du Colosse par défaut). */
const TOURS_DIVINES: Readonly<Record<string, string>> = {
  charlie: 'tour-totem',
  plume: 'tour-sanctuaire',
  pollen: 'tour-atelier',
};

// DLC « Temps modernes » : dans une partie de cette campagne, les tours prennent leur skin DLC (atlas à part, atlas-moderne.json),
// avec les mêmes animations que l'original qu'il remplace (contrat de conformité, testé). Hors de cette campagne, rien ne change.
const SPECIALISATIONS_MODERNES: Readonly<Record<string, Readonly<Record<Voie, string>>>> = {
  caserne: { A: 'moderne-caserne-amphi', B: 'moderne-caserne-zad' },
  tir: { A: 'moderne-tir-vigies', B: 'moderne-tir-renvoyeurs' },
  magie: { A: 'moderne-magie-megaphone', B: 'moderne-magie-graffeurs' },
  artillerie: { A: 'moderne-artillerie-trebuchet', B: 'moderne-artillerie-canon-paves' },
};

const DIVINES_MODERNES: Readonly<Record<string, string>> = {
  charlie: 'moderne-charlie',
  plume: 'moderne-plume',
  pollen: 'moderne-pollen',
};

/**
 * Sprite d'une tour selon sa famille, son niveau (1 à 4), sa spécialisation, pour la tour divine le dieu de la partie, et la campagne
 * (`moderne` : le skin du DLC).
 */
export function spriteTour(famille: FamilleTour, niveau: number, voie: Voie | null, dieu = 'charlie', campagne: IdCampagne = 'histoire'): string {
  const moderne = campagne === 'moderne';
  if (famille === 'divine') {
    const table = moderne ? DIVINES_MODERNES : TOURS_DIVINES;
    const defaut = moderne ? 'moderne-charlie' : 'tour-totem';
    return Object.hasOwn(table, dieu) ? (table[dieu] ?? defaut) : defaut;
  }
  const prefixe = moderne ? 'moderne' : 'tour';
  if (niveau >= 4 && voie !== null) return (moderne ? SPECIALISATIONS_MODERNES : SPRITES_SPECIALISATIONS)[famille]?.[voie] ?? `${prefixe}-${famille}-3`;
  return `${prefixe}-${famille}-${String(Math.min(Math.max(niveau, 1), 3))}`;
}

/**
 * Chat tireur posé au sommet d'une tour (au point de tir de son sprite, `nomPointDeTir`), null s'il n'y en a pas : les tours de tir, et
 * dans le DLC le mégaphone d'or (magie niveau 4 voie A), dont l'étudiant se tourne vers sa cible (spec d'animation du DLC).
 */
export function spriteTireur(famille: FamilleTour, niveau: number, voie: Voie | null, campagne: IdCampagne = 'histoire'): string | null {
  const moderne = campagne === 'moderne';
  if (moderne && famille === 'magie' && niveau >= 4 && voie === 'A') return 'moderne-megaphone-chat';
  if (famille !== 'tir') return null;
  if (niveau >= 4) {
    if (voie === 'A') return moderne ? 'moderne-vigie-chat' : 'guetteur-chat';
    return moderne ? 'moderne-renvoyeur-chat' : 'arbaletrier-chat';
  }
  return moderne ? 'moderne-lanceur-chat' : 'archer-chat';
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
  // Le Voile de Nuit lui-même est la zone durable que le rendu peint tant qu'elle dure ; le sort n'ajoute qu'un souffle d'ombre.
  plume: [
    { effet: 'effet-ombre', animationHeros: 'competence', icone: 'icone-voile-nuit' },
    { effet: 'effet-griffes', animationHeros: 'competence', icone: 'icone-griffes-ombre' },
  ],
  // Les pièges et les roues de l'Ingéniosité sont dessinés d'après l'état (pièges posés, tours boostées).
  pollen: [
    { effet: 'fumee', animationHeros: 'competence', icone: 'icone-pieges-ressort' },
    { effet: 'fumee', animationHeros: 'competence', icone: 'icone-ingeniosite' },
  ],
};

const SORT_INCONNU: HabillageSort = { effet: 'fumee', animationHeros: null, icone: 'icone-etoile' };

export function habillageSort(dieu: string, emplacement: number): HabillageSort {
  return (Object.hasOwn(SORTS, dieu) ? SORTS[dieu]?.[emplacement] : undefined) ?? SORT_INCONNU;
}

/** Icône de chaque famille de tours dans les menus ; la tour divine montre celle du dieu de la partie. */
export function iconeFamille(famille: FamilleTour, dieu = 'charlie'): string {
  return famille === 'divine' ? spriteTour('divine', 1, null, dieu) : `icone-${famille}`;
}

/** Sprite affiché dans le menu pour une tour qu'on peut construire (le premier niveau). */
export function spriteMenuTour(famille: FamilleTour): string {
  return spriteTour(famille, 1, null);
}

// --- Objets, dieux, héros, branches de l'arbre -------------------------------------------------------------------

/** Id avec tirets : `brise_os` devient `brise-os` (un nom de sprite n'a que a-z, 0-9 et -). */
function avecTirets(id: string): string {
  return id.replaceAll('_', '-');
}

export function iconeDieu(dieu: string): string {
  return `icone-dieu-${avecTirets(dieu)}`;
}

export function portraitHeros(heros: string): string {
  return `icone-portrait-${avecTirets(heros)}`;
}

export function iconeObjet(objet: string): string {
  return `icone-${avecTirets(objet)}`;
}

export function iconeBranche(branche: string): string {
  return `icone-branche-${avecTirets(branche)}`;
}

/** Effet joué là où un objet est utilisé (le point touché). */
const EFFETS_OBJETS: Readonly<Record<string, string>> = {
  fiole_soufre: 'effet-soufre',
  herbe_sabbat: 'effet-sabbat',
  griffe_renfort: 'fumee',
  sablier: 'effet-sablier',
};

export function effetObjet(objet: string): string {
  return Object.hasOwn(EFFETS_OBJETS, objet) ? (EFFETS_OBJETS[objet] ?? 'fumee') : 'fumee';
}

/** Sprite d'une tourelle construite (Atelier Boiteux, Rouage). */
const SPRITES_STRUCTURES: Readonly<Record<string, string>> = {
  'unite.tourelle_de_l_atelier': 'tourelle-atelier',
  'unite.tourelle_de_rouage': 'tourelle-atelier',
};

export function spriteStructure(nomStats: string): string {
  return Object.hasOwn(SPRITES_STRUCTURES, nomStats) ? (SPRITES_STRUCTURES[nomStats] ?? 'tourelle-atelier') : 'tourelle-atelier';
}
