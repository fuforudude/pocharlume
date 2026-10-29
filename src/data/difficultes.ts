// Difficultés choisies au lancement d'un niveau : multiplicateurs appliqués par le moteur.
import type { Difficulte } from '../engine/definitions';

export const DIFFICULTES = {
  chaton: { nom: 'difficulte.chaton', pvEnnemis: 0.6, vies: 25, aretesDepart: 1.5, primes: 1.25, vaguesElites: 0 },
  matou: { nom: 'difficulte.matou', pvEnnemis: 1.08, vies: 20, aretesDepart: 1, primes: 0.7, vaguesElites: 0 },
  vieux_sage: { nom: 'difficulte.vieux_sage', pvEnnemis: 1.27, vies: 15, aretesDepart: 0.85, primes: 0.7, vaguesElites: 2 },
} as const satisfies Record<string, Difficulte>;

export type IdDifficulte = keyof typeof DIFFICULTES;

/** Les défis (Héroïque, Fer) se jouent avec les règles de cette difficulté, quelle que soit celle de la config. */
export const DIFFICULTE_DES_DEFIS: IdDifficulte = 'matou';
