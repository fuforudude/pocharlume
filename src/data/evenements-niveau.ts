// Valeurs des événements datés et des foules du DLC Temps modernes (moteur : src/engine/evenements-niveau/). Les paramètres propres à
// chaque événement ou foule sont écrits dans le niveau ; ici, ce qui est commun à tous.
import type { StatsCombattant } from '../engine/definitions';

export const EVENEMENTS_NIVEAU = {
  /** Secondes entre l'annonce d'un événement (bandeau) et son déclenchement ; c'est aussi le délai minimal (et par défaut) d'un événement. */
  annonce: 3,
  /** Secondes d'accélération d'une charge dont le niveau ne donne pas `dureeVitesse` (la traversée des soldats dure `duree`). */
  accelerationCharge: 4,
} as const;

/** Unités alliées des renforts (événement `renforts`, effet de foule `renforts`), par clé. Chiffres à régler au simulateur. */
export const UNITES_EVENEMENTS: Readonly<Record<string, StatsCombattant>> = {
  etudiant: {
    nom: 'unite.etudiant',
    pv: 120,
    degats: [5, 8],
    cadence: 1,
    coups: 1,
    armure: 0,
    resistance: 0,
    vitesse: 1.4,
    portee: 1.5,
    capacite: 1,
    effets: [],
  },
};
