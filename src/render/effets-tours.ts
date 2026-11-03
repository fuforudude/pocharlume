// Effets visuels des tours : amélioration (anneau, flash, poussière, sursaut) et halo des tours à feu. Tout ce fichier est pur
// (formules et tables, sans canvas) pour rester testable ; `rendu.ts` dessine, `suivi.ts` déclenche. Aucune fonction n'alloue :
// les résultats passent par des objets réutilisés ou par des nombres.
import type { FamilleTour } from '../engine';
import type { Voie } from '../engine/definitions';
import { PALETTES_SKINS, type IdSkin } from './palettes-skins';

/** Durées en millisecondes de temps de jeu (figé en pause, comme tout le rendu). */
export const DUREE_ANNEAU = 300;
export const DUREE_FLASH = 90;
export const DUREE_SURSAUT = 260;
export const DUREE_POUSSIERE = 520;

/**
 * « Réduire les animations » : le jeu n'a pas de réglage dédié, il suit la préférence du système (prefers-reduced-motion).
 * Rend faux quand le navigateur ne sait pas la lire (tests, vieux navigateurs).
 */
export function animationsReduites(fenetre: FenetreMedia = globalThis): boolean {
  return requeteAnimationsReduites(fenetre).matches;
}

interface FenetreMedia {
  matchMedia?: (requete: string) => { matches: boolean };
}

/**
 * La requête elle-même, à garder : sa propriété `matches` se relit à chaque image sans rien allouer et reste à jour quand le
 * joueur change sa préférence. Sans navigateur pour la lire : un objet qui dit toujours faux.
 */
export function requeteAnimationsReduites(fenetre: FenetreMedia = globalThis): { readonly matches: boolean } {
  try {
    return fenetre.matchMedia?.('(prefers-reduced-motion: reduce)') ?? { matches: false };
  } catch {
    return { matches: false };
  }
}

/** Part de la durée écoulée, bornée à [0, 1]. */
function part(t: number, duree: number): number {
  return t <= 0 ? 0 : t >= duree ? 1 : t / duree;
}

/**
 * Décalage vertical (pixels, entier, positif = vers le bas) de la tour qui reçoit son amélioration : elle se tasse de 2 px, puis
 * rebondit d'un pixel au-dessus de sa place avant de s'y poser. 0 hors de la fenêtre de l'effet.
 */
export function decalageSursaut(t: number): number {
  if (t < 0 || t >= DUREE_SURSAUT) return 0;
  if (t < 70) return Math.round((2 * t) / 70);
  if (t < 150) return Math.round(2 - (3 * (t - 70)) / 80);
  return Math.round(-1 + (t - 150) / 110);
}

/** Opacité du flash blanc posé sur le nouveau sprite : plein au premier cadre, éteint à la fin de `DUREE_FLASH`. */
export function opaciteFlash(t: number): number {
  return t < 0 || t >= DUREE_FLASH ? 0 : 1 - t / DUREE_FLASH;
}

/** Demi-largeur (pixels) de l'ellipse de l'anneau de lumière qui part du pied de la tour. */
export function rayonAnneau(t: number, demiBase: number): number {
  const p = part(t, DUREE_ANNEAU);
  return 3 + (demiBase + 16) * (1 - (1 - p) * (1 - p));
}

/** Opacité de l'anneau : vif au départ, s'éteint en fin de course. */
export function opaciteAnneau(t: number): number {
  return t < 0 || t >= DUREE_ANNEAU ? 0 : 1 - part(t, DUREE_ANNEAU);
}

/** Une particule de la bouffée de poussière : vitesse de départ (pixels par seconde, vers l'extérieur) et taille. */
interface DefParticule {
  readonly vx: number;
  readonly vy: number;
  readonly taille: number;
  /** Éclat de bois ou de pierre (petit, lancé en arc, sombre) plutôt que poussière (qui gonfle et monte). */
  readonly eclat: boolean;
}

/** Les particules de chaque coin de la base ; l'autre coin est le miroir de celui-ci. */
export const PARTICULES: readonly DefParticule[] = [
  { vx: 16, vy: -6, taille: 3, eclat: false },
  { vx: 28, vy: -12, taille: 2, eclat: false },
  { vx: 8, vy: -16, taille: 3, eclat: false },
  { vx: 34, vy: -34, taille: 1, eclat: true },
  { vx: 20, vy: -44, taille: 2, eclat: true },
];

/** Ce que `particule` remplit : position relative au pied de la tour, taille, opacité. Réutilisé : aucune allocation. */
export interface EtatParticule {
  x: number;
  y: number;
  taille: number;
  alpha: number;
  eclat: boolean;
}

const GRAVITE = 150;

/** Calcule la particule `i` du coin `cote` (-1 gauche, 1 droite) à l'instant `t` ; faux si elle est éteinte. */
export function particule(i: number, cote: -1 | 1, t: number, demiBase: number, sortie: EtatParticule): boolean {
  const def = PARTICULES[i];
  if (!def || t < 0 || t >= DUREE_POUSSIERE) return false;
  const s = t / 1000;
  const p = t / DUREE_POUSSIERE;
  sortie.x = Math.round(cote * (demiBase + def.vx * s * (1 - 0.5 * p)));
  sortie.y = Math.round(def.vy * s + (def.eclat ? GRAVITE * s * s : -6 * s));
  sortie.taille = def.eclat ? def.taille : Math.round(def.taille + 3 * p);
  sortie.alpha = def.eclat ? 1 - p * p : 0.85 * (1 - p);
  sortie.eclat = def.eclat;
  return true;
}

// --- Halo des tours à feu ---

/** Lueur sous une tour : rayon horizontal en pixels, intensité de 0 à 1, couleur « r, g, b ». */
export interface DefHalo {
  readonly rayon: number;
  readonly intensite: number;
  readonly couleur: string;
}

/** Braise du feu des tours, telle qu'elle est peinte dans les sprites : un skin la change (voir `PALETTES_SKINS`). */
const BRAISE_SPRITE = 'e09128';
const BRAISE = '255, 150, 60';
const TORCHE = '255, 190, 90';
/** Flammes vert-de-tombe du Nécromancien des Neuf Vies. */
const TOMBE = '110, 230, 130';

/** Halo d'une famille : un réglage par niveau (1, 2, 3), et au besoin un réglage par spécialisation (niveau 4, voie choisie). */
interface HalosFamille {
  readonly niveaux: readonly [DefHalo | null, DefHalo | null, DefHalo | null];
  readonly voies?: Readonly<Partial<Record<Voie, DefHalo>>>;
}

/**
 * Réglage du halo, par famille et par niveau (la spécialisation sans réglage propre prend celui du niveau 3). Magie (Autel des
 * Cendres) à tous les niveaux, plus fort au 3 ; artillerie au 3 seulement (torchères). La voie B de la magie (Nécromancien) brûle
 * vert. Un skin dont la braise est recolorée l'emporte sur la couleur de la voie. À ajuster ici.
 */
export const HALOS: Readonly<Partial<Record<FamilleTour, HalosFamille>>> = {
  magie: {
    niveaux: [
      { rayon: 13, intensite: 0.22, couleur: BRAISE },
      { rayon: 16, intensite: 0.3, couleur: BRAISE },
      { rayon: 22, intensite: 0.45, couleur: BRAISE },
    ],
    voies: { B: { rayon: 22, intensite: 0.45, couleur: TOMBE } },
  },
  artillerie: { niveaux: [null, null, { rayon: 20, intensite: 0.38, couleur: TORCHE }] },
};

/** « rrggbb » vers « r, g, b », ou null si ce n'est pas une couleur hexadécimale. */
function hexVersRvb(hex: string): string | null {
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return `${String(parseInt(hex.slice(0, 2), 16))}, ${String(parseInt(hex.slice(2, 4), 16))}, ${String(parseInt(hex.slice(4, 6), 16))}`;
}

/** Halos déjà préparés pour un skin : un objet stable par (réglage, skin), pour que le rendu puisse les garder en cache. */
const HALOS_DE_SKIN = new Map<DefHalo, Map<string, DefHalo>>();

/**
 * Le halo d'une tour (niveau 1 à 4, voie de sa spécialisation, skin équipé), ou null. La couleur vient des données : celle de la voie,
 * ou la braise recolorée du skin. Rend toujours le même objet pour les mêmes arguments (le rendu s'en sert de clé de cache) ; à
 * appeler quand la tour change d'aspect, pas à chaque image.
 */
export function haloDe(famille: FamilleTour, niveau: number, voie: Voie | null = null, skin: string | null = null): DefHalo | null {
  const table = HALOS[famille];
  if (!table) return null;
  const base = (voie !== null && niveau >= 4 ? table.voies?.[voie] : undefined) ?? table.niveaux[Math.min(3, Math.max(1, Math.floor(niveau))) - 1] ?? null;
  if (!base || skin === null || !Object.hasOwn(PALETTES_SKINS, skin)) return base;
  const hex = (PALETTES_SKINS[skin as IdSkin].substitutions as Readonly<Record<string, string | undefined>>)[BRAISE_SPRITE];
  const rvb = hex === undefined ? null : hexVersRvb(hex);
  if (rvb === null) return base;
  let parSkin = HALOS_DE_SKIN.get(base);
  if (!parSkin) {
    parSkin = new Map();
    HALOS_DE_SKIN.set(base, parSkin);
  }
  let def = parSkin.get(rvb);
  if (!def) {
    def = { rayon: base.rayon, intensite: base.intensite, couleur: rvb };
    parSkin.set(rvb, def);
  }
  return def;
}

/**
 * Facteur de pulsation du halo (0,88 à 1,12), lent et décalé par tour (`phase`) pour que deux tours ne battent pas en chœur.
 * Animations réduites : 1, le halo reste fixe.
 */
export function pulsationHalo(temps: number, phase: number, reduit = false): number {
  return reduit ? 1 : 1 + 0.12 * Math.sin((temps + phase) / 380);
}
