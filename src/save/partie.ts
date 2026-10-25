// Partie en cours : prendre l'instantané du début de vague, le ranger dans la sauvegarde, le relire pour
// « Reprendre à la vague N ». Fonctions pures, sans stockage.
import type { EtatPartie } from '../engine/etat';
import { deserialiser, serialiser } from '../engine/partie';
import { NOMBRE_NIVEAUX, type PartieEnCours, type Sauvegarde } from './format';
import { estEntierEntre, TAILLE_MAX_ETAT } from './validation';

/**
 * Instantané à ranger dans la sauvegarde. À prendre juste après le lancement d'une vague (événement `vague`
 * du moteur) : `vague` est alors le numéro, à partir de 1, de la vague qui vient de commencer. Rend null si
 * aucune vague n'est lancée, si la partie est finie, si le numéro de niveau est invalide ou si l'état est
 * trop gros pour la sauvegarde.
 */
export function partieEnCours(etat: EtatPartie, numeroNiveau: number): PartieEnCours | null {
  if (etat.statut !== 'en_cours' || etat.vagues.lancees < 1 || !estEntierEntre(numeroNiveau, 1, NOMBRE_NIVEAUX)) return null;
  const texte = serialiser(etat);
  if (texte.length > TAILLE_MAX_ETAT) return null;
  return { niveau: numeroNiveau, config: { ...etat.config }, etat: texte, vague: etat.vagues.lancees };
}

export function avecPartieEnCours(s: Sauvegarde, partie: PartieEnCours | null): Sauvegarde {
  return { ...s, partie };
}

/**
 * Relit l'état d'une partie en cours. Rend null si elle ne peut pas reprendre : état illisible, partie
 * enregistrée avec d'autres données de jeu (le moteur refuse alors de la relire), ou incohérente.
 */
export function reprendrePartie(partie: PartieEnCours): EtatPartie | null {
  try {
    const etat = deserialiser(partie.etat);
    const coherent =
      etat.statut === 'en_cours' &&
      etat.vagues.lancees === partie.vague &&
      etat.config.versionDonnees === partie.config.versionDonnees &&
      etat.config.difficulte === partie.config.difficulte &&
      etat.config.dieu === partie.config.dieu &&
      etat.config.graine === partie.config.graine;
    return coherent ? etat : null;
  } catch {
    return null;
  }
}
