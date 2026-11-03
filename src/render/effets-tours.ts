// Effets visuels des tours : amélioration (anneau, flash, poussière, sursaut) et halo des tours à feu. Tout ce fichier est pur
// (formules et tables, sans canvas) pour rester testable ; `rendu.ts` dessine, `suivi.ts` déclenche. Aucune fonction n'alloue :
// les résultats passent par des objets réutilisés ou par des nombres.
import type { FamilleTour } from '../engine';

/** Durées en millisecondes de temps de jeu (figé en pause, comme tout le rendu). */
export const DUREE_ANNEAU = 300;
export const DUREE_FLASH = 90;
export const DUREE_SURSAUT = 260;
export const DUREE_POUSSIERE = 520;

/**
 * « Réduire les animations » : le jeu n'a pas de réglage dédié, il suit la préférence du système (prefers-reduced-motion).
 * Rend faux quand le navigateur ne sait pas la lire (tests, vieux navigateurs).
 */
export function animationsReduites(fenetre: { matchMedia?: (requete: string) => { matches: boolean } } = globalThis): boolean {
  try {
    return fenetre.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
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

const BRAISE = '255, 150, 60';
const TORCHE = '255, 190, 90';

/**
 * Réglage du halo, par famille et par niveau (1, 2, 3 ; la spécialisation prend le réglage du niveau 3). null : pas de halo.
 * Magie (Autel des Cendres) à tous les niveaux, plus fort au 3 ; artillerie au 3 seulement (torchères). À ajuster ici.
 */
export const HALOS: Readonly<Partial<Record<FamilleTour, readonly [DefHalo | null, DefHalo | null, DefHalo | null]>>> = {
  magie: [
    { rayon: 13, intensite: 0.22, couleur: BRAISE },
    { rayon: 16, intensite: 0.3, couleur: BRAISE },
    { rayon: 22, intensite: 0.45, couleur: BRAISE },
  ],
  artillerie: [null, null, { rayon: 20, intensite: 0.38, couleur: TORCHE }],
};

export function haloDe(famille: FamilleTour, niveau: number): DefHalo | null {
  const table = HALOS[famille];
  if (!table) return null;
  return table[Math.min(3, Math.max(1, Math.floor(niveau))) - 1] ?? null;
}

/** Facteur de pulsation du halo (0,88 à 1,12), lent et décalé par tour (`phase`) pour que deux tours ne battent pas en chœur. */
export function pulsationHalo(temps: number, phase: number): number {
  return 1 + 0.12 * Math.sin((temps + phase) / 380);
}
