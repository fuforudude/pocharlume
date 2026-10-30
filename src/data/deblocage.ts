// Déblocage progressif des tours : ce qu'on peut construire dépend du numéro du niveau joué (« rythme du niveau »),
// jamais de la sauvegarde. Rejouer le niveau 2, même en défi Héroïque ou Fer, limite toujours aux tours du niveau 2.
// Les niveaux 1 à 10 ouvrent les tours une à une ; à partir de NIVEAU_TOUT_OUVERT, et en mode infini, tout est ouvert.
import type { IdFamille } from '../engine/definitions';

/** Palier d'une tour : niveaux 1 à 3, puis 4 pour les deux spécialisations (A et B, ouvertes ensemble avec leurs compétences). */
export type PalierTour = 1 | 2 | 3 | 4;

export interface Deblocage {
  /** Numéro de campagne du niveau qui ouvre l'élément. */
  readonly niveau: number;
  readonly famille: IdFamille | 'divine';
  /** Toujours 1 pour la tour divine. */
  readonly palier: PalierTour;
}

/** À partir de ce numéro de niveau, tout est ouvert. */
export const NIVEAU_TOUT_OUVERT = 11;

export const DEBLOCAGES: readonly Deblocage[] = [
  { niveau: 1, famille: 'caserne', palier: 1 },
  { niveau: 1, famille: 'tir', palier: 1 },
  { niveau: 1, famille: 'magie', palier: 1 },
  { niveau: 1, famille: 'artillerie', palier: 1 },
  { niveau: 2, famille: 'caserne', palier: 2 },
  { niveau: 2, famille: 'tir', palier: 2 },
  { niveau: 3, famille: 'magie', palier: 2 },
  { niveau: 3, famille: 'artillerie', palier: 2 },
  { niveau: 4, famille: 'caserne', palier: 3 },
  { niveau: 4, famille: 'tir', palier: 3 },
  { niveau: 5, famille: 'magie', palier: 3 },
  { niveau: 5, famille: 'artillerie', palier: 3 },
  { niveau: 6, famille: 'caserne', palier: 4 },
  { niveau: 7, famille: 'tir', palier: 4 },
  { niveau: 8, famille: 'magie', palier: 4 },
  { niveau: 9, famille: 'artillerie', palier: 4 },
  { niveau: 10, famille: 'divine', palier: 1 },
];

/** Numéro du niveau qui ouvre ce palier de cette famille (NIVEAU_TOUT_OUVERT pour un élément absent de la table). */
export function niveauOuverture(famille: IdFamille | 'divine', palier: number): number {
  return DEBLOCAGES.find((d) => d.famille === famille && d.palier === palier)?.niveau ?? NIVEAU_TOUT_OUVERT;
}

/** Ce que le niveau `numero` ouvre de neuf, dans l'ordre de la table (vide s'il n'apporte rien). */
export function nouveautesDuNiveau(numero: number): Deblocage[] {
  return DEBLOCAGES.filter((d) => d.niveau === numero);
}
