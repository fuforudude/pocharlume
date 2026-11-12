// Partie en cours : prendre l'instantané du début de vague, le ranger dans la sauvegarde, le relire pour
// « Reprendre à la vague N ». Fonctions pures, sans stockage.
import type { EtatPartie } from '../engine/etat';
import { deserialiser, serialiser } from '../engine/partie';
import { NIVEAU_MAX_MODERNE } from '../data/campagnes';
import { NOMBRE_NIVEAUX, type PartieEnCours, type Sauvegarde } from './format';
import { estEntierEntre, TAILLE_MAX_ETAT } from './validation';
import { estIdCarteBienForme } from './validation-infini';

/**
 * Instantané à ranger dans la sauvegarde. À prendre juste après le lancement d'une vague (événement `vague`
 * du moteur) : `vague` est alors le numéro, à partir de 1, de la vague qui vient de commencer. Rend null si
 * aucune vague n'est lancée, si la partie est finie, si le numéro de niveau est invalide ou si l'état est
 * trop gros pour la sauvegarde.
 */
export function partieEnCours(etat: EtatPartie, numeroNiveau: number, carte?: string): PartieEnCours | null {
  // Le DLC garde sa campagne dans la partie (absent = histoire) ; son niveau va de 1 à 30 et il n'a pas de mode infini.
  const moderne = etat.niveau.campagne === 'moderne';
  if (etat.statut !== 'en_cours' || etat.vagues.lancees < 1 || !estEntierEntre(numeroNiveau, 1, moderne ? NIVEAU_MAX_MODERNE : NOMBRE_NIVEAUX)) return null;
  if (moderne && carte !== undefined) return null;
  // Une partie infinie va avec sa carte, une partie de campagne n'en a pas : l'un sans l'autre est une incohérence.
  const infinie = etat.config.infini !== undefined && etat.config.infini !== null;
  if (infinie !== (carte !== undefined) || (carte !== undefined && !estIdCarteBienForme(carte))) return null;
  const texte = serialiser(etat);
  if (texte.length > TAILLE_MAX_ETAT) return null;
  return {
    niveau: numeroNiveau,
    config: { ...etat.config, ...(etat.config.infini ? { infini: { ...etat.config.infini } } : {}) },
    etat: texte,
    vague: etat.vagues.lancees,
    ...(carte === undefined ? {} : { carte }),
    ...(moderne ? { campagne: 'moderne' as const } : {}),
  };
}

export function avecPartieEnCours(s: Sauvegarde, partie: PartieEnCours | null): Sauvegarde {
  return { ...s, partie };
}

/**
 * Relit l'état d'une partie en cours. Rend null si elle ne peut pas reprendre : état illisible, partie
 * enregistrée avec d'autres données de jeu (le moteur refuse alors de la relire), ou incohérente (dont un état dont le
 * niveau ne porte pas le numéro de la partie rangée).
 */
export function reprendrePartie(partie: PartieEnCours): EtatPartie | null {
  try {
    const etat = deserialiser(partie.etat);
    const coherent =
      etat.statut === 'en_cours' &&
      etat.vagues.lancees === partie.vague &&
      // Le niveau de l'état est celui de la partie rangée : son numéro décide aussi des tours débloquées.
      etat.niveau.numero === partie.niveau &&
      (etat.niveau.campagne === 'moderne') === (partie.campagne === 'moderne') &&
      etat.config.versionDonnees === partie.config.versionDonnees &&
      etat.config.difficulte === partie.config.difficulte &&
      etat.config.dieu === partie.config.dieu &&
      etat.config.graine === partie.config.graine &&
      (etat.config.infini?.region ?? 0) === (partie.config.infini?.region ?? 0) &&
      (partie.carte !== undefined) === (etat.config.infini !== undefined && etat.config.infini !== null);
    return coherent ? etat : null;
  } catch {
    return null;
  }
}
