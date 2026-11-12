// Nasse : un chemin est coupé pour un temps (voir barrages.ts pour ce que font les ennemis et les soldats devant la coupure).
import type { EvenementNasse, Niveau } from '../definitions';
import type { EtatPartie } from '../etat';
import { ajouterBarrage, verifierCoupure } from './barrages';

export function verifierNasse(niveau: Niveau, e: EvenementNasse, quoi: string): void {
  verifierCoupure(niveau, quoi, e.chemin, e.debut, e.longueur, e.duree);
}

export function declencherNasse(etat: EtatPartie, e: EvenementNasse): void {
  ajouterBarrage(etat, e.chemin, e.debut, e.longueur, e.duree);
}
