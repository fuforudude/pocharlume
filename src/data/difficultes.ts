// Difficultés choisies au lancement d'un niveau : multiplicateurs appliqués par le moteur.
import type { Difficulte } from '../engine/definitions';

export const DIFFICULTES = {
  chaton: { nom: 'difficulte.chaton', pvEnnemis: 0.8, vies: 25, aretesDepart: 1.15, primes: 1.1 },
  matou: { nom: 'difficulte.matou', pvEnnemis: 1, vies: 20, aretesDepart: 1, primes: 1 },
  vieux_sage: { nom: 'difficulte.vieux_sage', pvEnnemis: 1.25, vies: 15, aretesDepart: 0.9, primes: 0.9 },
} as const satisfies Record<string, Difficulte>;

export type IdDifficulte = keyof typeof DIFFICULTES;
