// Règles de progression de la campagne, en fonctions pures : elles prennent une sauvegarde et en rendent une
// nouvelle (jamais modifiée sur place), sans toucher au stockage.
import {
  DIFFICULTES_SAUVEGARDE,
  NOMBRE_NIVEAUX,
  type DifficulteSauvegarde,
  type Etoiles,
  type EtoilesNiveau,
  type Reglages,
  type Sauvegarde,
} from './format';
import { estEntierEntre } from './validation';

function cle(numero: number): string {
  return String(numero);
}

function valide(numero: number): boolean {
  return estEntierEntre(numero, 1, NOMBRE_NIVEAUX);
}

/** Un niveau est jouable s'il est le premier ou si le précédent a été réussi. */
export function niveauDebloque(s: Sauvegarde, numero: number): boolean {
  return valide(numero) && numero <= s.progression.niveauMax;
}

/** Meilleures étoiles d'un niveau dans une difficulté (0 si jamais réussi). */
export function etoilesDe(s: Sauvegarde, numero: number, difficulte: DifficulteSauvegarde): number {
  return Object.hasOwn(s.progression.etoiles, cle(numero)) ? (s.progression.etoiles[cle(numero)]?.[difficulte] ?? 0) : 0;
}

/** Meilleur résultat d'un niveau, toutes difficultés confondues (0 si jamais réussi). */
export function meilleuresEtoiles(s: Sauvegarde, numero: number): number {
  return Math.max(0, ...DIFFICULTES_SAUVEGARDE.map((d) => etoilesDe(s, numero, d)));
}

export function niveauReussi(s: Sauvegarde, numero: number): boolean {
  return meilleuresEtoiles(s, numero) > 0;
}

/** Total des étoiles gagnées (meilleur résultat par niveau, toutes difficultés confondues) : 300 au plus. */
export function totalEtoiles(s: Sauvegarde): number {
  let total = 0;
  for (let n = 1; n <= NOMBRE_NIVEAUX; n++) total += meilleuresEtoiles(s, n);
  return total;
}

/**
 * Enregistre la victoire d'un niveau : garde le meilleur résultat par niveau et par difficulté, et débloque le
 * niveau suivant. Une victoire invalide (niveau inconnu ou verrouillé, étoiles hors de 1 à 3, difficulté
 * inconnue) est ignorée : la sauvegarde rendue est alors la même.
 */
export function enregistrerVictoire(s: Sauvegarde, numero: number, difficulte: DifficulteSauvegarde, etoiles: number): Sauvegarde {
  if (!niveauDebloque(s, numero) || !estEntierEntre(etoiles, 1, 3) || !DIFFICULTES_SAUVEGARDE.includes(difficulte)) return s;
  const anciennes: EtoilesNiveau = Object.hasOwn(s.progression.etoiles, cle(numero)) ? { ...s.progression.etoiles[cle(numero)] } : {};
  anciennes[difficulte] = Math.max(anciennes[difficulte] ?? 0, etoiles) as Etoiles;
  const nouvelles = { ...s.progression.etoiles };
  Object.defineProperty(nouvelles, cle(numero), { value: anciennes, enumerable: true, writable: true, configurable: true });
  return {
    ...s,
    progression: { niveauMax: Math.max(s.progression.niveauMax, Math.min(numero + 1, NOMBRE_NIVEAUX)), etoiles: nouvelles },
  };
}

/** Change des réglages (les champs absents restent inchangés). Une valeur hors bornes est ignorée. */
export function changerReglages(s: Sauvegarde, changements: Partial<Reglages>): Sauvegarde {
  const reglages = { ...s.reglages };
  if (changements.son !== undefined && estEntierEntre(changements.son, 0, 100)) reglages.son = changements.son;
  if (changements.musique !== undefined && estEntierEntre(changements.musique, 0, 100)) reglages.musique = changements.musique;
  if (changements.vitesse === 1 || changements.vitesse === 2) reglages.vitesse = changements.vitesse;
  return { ...s, reglages };
}
