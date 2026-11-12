// Validation stricte d'une progression de campagne (niveau débloqué et étoiles par niveau et par difficulté), commune à l'histoire
// (`progression`, niveaux 1 à 150) et à la campagne Temps modernes (`moderne.progression`, niveaux 1 à 30). Même esprit que
// validation.ts : types exacts, bornes, propriétés propres seulement, copie neuve.
import { DIFFICULTES_SAUVEGARDE, NOMBRE_NIVEAUX, type Etoiles, type EtoilesNiveau, type Progression } from './format';
import { avecCles, CLE_NIVEAU, echec, estEnregistrement, estEntierEntre, ok, poser, valeur, type Resultat } from './validation-base';

function validerEtoilesNiveau(x: unknown, chemin: string): Resultat<EtoilesNiveau> {
  if (!estEnregistrement(x)) return echec(`${chemin} : objet attendu`);
  const copie: EtoilesNiveau = {};
  const cles = Object.keys(x);
  if (cles.length === 0) return echec(`${chemin} : aucune difficulté`);
  for (const cle of cles) {
    const difficulte = DIFFICULTES_SAUVEGARDE.find((d) => d === cle);
    if (difficulte === undefined) return echec(`${chemin} : difficulté inconnue « ${cle} »`);
    const etoiles = valeur(x, cle);
    if (!estEntierEntre(etoiles, 1, 3)) return echec(`${chemin}.${cle} : 1 à 3 étoiles attendues`);
    copie[difficulte] = etoiles as Etoiles;
  }
  return ok(copie);
}

/** Une progression dont les niveaux vont de 1 à `max` (150 pour l'histoire, 30 pour le DLC). */
export function validerProgression(x: unknown, max = NOMBRE_NIVEAUX, chemin = 'progression'): Resultat<Progression> {
  const base = avecCles(x, ['niveauMax', 'etoiles'], chemin);
  if (!base.ok) return base;
  const niveauMax = valeur(base.valeur, 'niveauMax');
  if (!estEntierEntre(niveauMax, 1, max)) return echec(`${chemin}.niveauMax : entier de 1 à ${String(max)} attendu`);
  const brutes = valeur(base.valeur, 'etoiles');
  if (!estEnregistrement(brutes)) return echec(`${chemin}.etoiles : objet attendu`);
  const etoiles: Record<string, EtoilesNiveau> = {};
  for (const cle of Object.keys(brutes)) {
    if (!CLE_NIVEAU.test(cle) || Number(cle) > max) return echec(`${chemin}.etoiles : numéro de niveau invalide « ${cle} »`);
    const numero = Number(cle);
    // Réussir le niveau N débloque N + 1 : un niveau réussi ne peut pas dépasser le niveau max débloqué.
    if (niveauMax < Math.min(numero + 1, max)) return echec(`${chemin} : le niveau ${cle} est réussi mais le suivant n'est pas débloqué`);
    const niveau = validerEtoilesNiveau(valeur(brutes, cle), `${chemin}.etoiles.${cle}`);
    if (!niveau.ok) return niveau;
    poser(etoiles, cle, niveau.valeur);
  }
  return ok({ niveauMax, etoiles });
}
