// Remise en cohérence d'une sauvegarde importée avec les définitions de jeu d'aujourd'hui. Un code d'export a été écrit
// avec d'autres seuils d'expérience ou d'autres compétences : plutôt que de le refuser (le joueur perdrait sa
// progression pour un rééquilibrage), on le valide comme une lecture du stockage puis on corrige ce qui ne tient plus.
// Fonction pure : rend une copie, ne modifie pas l'original.
import { HEROS_PAR_DIEU, IDS_HEROS } from '../data/meta';
import { definitionDuHeros, niveauHerosDepuisXp, pointsDeCompetence, type DefsMeta } from './definitions';
import type { Meta, ProgressionHeros, Sauvegarde } from './format';

/** Les compétences de ce héros tiennent-elles avec les définitions (connues, rang permis, niveau requis, assez de points) ? */
function competencesCoherentes(id: string, progression: ProgressionHeros, defs: DefsMeta): boolean {
  const definition = definitionDuHeros(defs, id);
  if (!definition) return Object.keys(progression.competences).length === 0;
  const niveau = niveauHerosDepuisXp(progression.xp, defs.seuilsXp);
  let places = 0;
  for (const [cle, rang] of Object.entries(progression.competences)) {
    const competence = definition.competences.find((c) => c.id === cle);
    if (!competence || rang > competence.rangMax || niveau < competence.niveauRequis) return false;
    places += rang;
  }
  return places <= pointsDeCompetence(niveau);
}

/**
 * Corrige la méta-progression d'une sauvegarde qui vient d'un code d'export :
 * - un héros dont les compétences ne tiennent plus avec les définitions actuelles (seuils d'expérience changés,
 *   compétence retirée ou rééquilibrée) récupère tous ses points, à replacer à la main ; son expérience est gardée ;
 * - un héros choisi qui n'est pas possédé est remplacé par l'avatar du dieu choisi.
 * Sans `defs`, seule la seconde correction a lieu (les compétences ne peuvent pas être jugées).
 */
export function normaliserImport(s: Sauvegarde, defs?: DefsMeta): Sauvegarde {
  const heros: Meta['heros'] = {};
  for (const id of IDS_HEROS) {
    const progression = s.meta.heros[id];
    if (!progression) continue;
    heros[id] = !defs || competencesCoherentes(id, progression, defs) ? progression : { xp: progression.xp, competences: {} };
  }
  const { choix } = s.meta;
  const choisi = Object.hasOwn(heros, choix.heros) ? choix.heros : HEROS_PAR_DIEU[choix.dieu][0];
  return { ...s, meta: { ...s.meta, heros, choix: { ...choix, heros: choisi } } };
}
