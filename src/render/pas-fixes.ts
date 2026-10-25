// Accumulateur de pas fixes : découple la simulation (1/30 s par pas, voir src/engine/temps.ts) de la
// cadence d'affichage. La boucle lui donne le temps réel écoulé, il dit combien de pas simuler ; le reste
// (fraction de pas) sert à interpoler le rendu entre deux pas.
import { PAS_PAR_SECONDE } from '../engine/temps';

/** Au-delà, un temps écoulé est ramené à cette valeur (onglet resté en arrière-plan, point d'arrêt…). */
export const ECART_MAX_MS = 250;
/** Pas simulés au plus par image : au-delà, on ralentit plutôt que de s'enfoncer (spirale de la mort). */
export const PAS_MAX_PAR_IMAGE = 8;

/** Précision de comparaison : 3 pas ne doivent pas valoir 2,9999999 à cause d'un arrondi de flottants. */
const EPSILON = 1e-9;

export class PasFixes {
  /** Multiplicateur de vitesse du jeu (1 ou 2). */
  vitesse = 1;
  pause = false;
  /** Fraction de pas déjà écoulée, dans [0, 1[ : le coefficient d'interpolation du rendu. */
  private reste = 0;

  get alpha(): number {
    return this.reste;
  }

  /** Nombre de pas à simuler maintenant pour `ecartMs` millisecondes de temps réel. Pause : aucun. */
  avancer(ecartMs: number): number {
    if (this.pause) return 0;
    const ecart = Math.min(Math.max(ecartMs, 0), ECART_MAX_MS);
    this.reste += (ecart * this.vitesse * PAS_PAR_SECONDE) / 1000;
    const disponibles = Math.floor(this.reste + EPSILON);
    this.reste = Math.max(0, this.reste - disponibles);
    return Math.min(disponibles, PAS_MAX_PAR_IMAGE);
  }

  reinitialiser(): void {
    this.reste = 0;
  }
}
