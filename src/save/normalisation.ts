// Remise en cohérence d'une sauvegarde importée avec les définitions de jeu d'aujourd'hui. Un code d'export a été écrit
// avec d'autres seuils d'expérience ou d'autres compétences : plutôt que de le refuser (le joueur perdrait sa
// progression pour un rééquilibrage), on le valide comme une lecture du stockage puis on corrige ce qui ne tient plus.
// Fonction pure : rend une copie, ne modifie pas l'original.
import { FAMILLES_BASE, type IdFamilier, type IdSkin } from '../data/collection';
import { HEROS_PAR_DIEU, IDS_HEROS, type IdHeros } from '../data/meta';
import { CATALOGUE_MODERNE, skinModerneAcceptable, type CatalogueModerne } from '../data/recompenses-moderne';
import type { CibleSkin, Collection } from '../meta/collection';
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
 * - un héros choisi qui n'est pas possédé est remplacé par l'avatar du dieu choisi ;
 * - un skin de héros ou un familier équipé sur un héros que le joueur n'a pas est déséquipé (il reste dans la collection) :
 *   les transactions d'équipement l'interdisent, un code forgé le contournerait.
 * - un skin ou un titre du DLC absent du catalogue (retiré ou renommé depuis l'export) est écarté, au lieu de faire refuser toute la
 *   sauvegarde : la validation ne contrôle que la forme des identifiants (`catalogue` : `null`, pas encore de catalogue, n'écarte rien).
 * Sans `defs`, seules les corrections de héros et d'équipement ont lieu (les compétences ne peuvent pas être jugées).
 */
export function normaliserImport(s: Sauvegarde, defs?: DefsMeta, catalogue: CatalogueModerne | null = CATALOGUE_MODERNE): Sauvegarde {
  const heros: Meta['heros'] = {};
  for (const id of IDS_HEROS) {
    const progression = s.meta.heros[id];
    if (!progression) continue;
    heros[id] = !defs || competencesCoherentes(id, progression, defs) ? progression : { xp: progression.xp, competences: {} };
  }
  const { choix } = s.meta;
  const choisi = Object.hasOwn(heros, choix.heros) ? choix.heros : HEROS_PAR_DIEU[choix.dieu][0];
  return {
    ...s,
    meta: { ...s.meta, heros, choix: { ...choix, heros: choisi }, collection: { ...s.meta.collection, equipes: equipementPossede(s.meta.collection.equipes, heros) } },
    moderne: catalogue ? moderneConnu(s.moderne, catalogue, heros) : s.moderne,
  };
}

/** L'équipement sans ce qui est porté par un héros absent de `heros` ; les skins de tour ne dépendent d'aucun héros. */
function equipementPossede(equipes: Collection['equipes'], heros: Meta['heros']): Collection['equipes'] {
  const skins: Collection['equipes']['skins'] = {};
  for (const [cible, skin] of Object.entries(equipes.skins) as [CibleSkin, IdSkin][]) {
    if ((FAMILLES_BASE as readonly string[]).includes(cible) || Object.hasOwn(heros, cible)) skins[cible] = skin;
  }
  const familiers: Collection['equipes']['familiers'] = {};
  for (const [id, familier] of Object.entries(equipes.familiers) as [IdHeros, IdFamilier][]) {
    if (Object.hasOwn(heros, id)) familiers[id] = familier;
  }
  return { skins, familiers };
}

/**
 * La campagne du DLC sans les skins et les titres que le catalogue ne connaît pas (l'ordre, donc la validité, est gardé), et sans les skins
 * portés qui ne tiennent plus : inconnu, porté ailleurs que sur son emplacement, ou sur un héros que le joueur n'a pas.
 */
function moderneConnu(moderne: Sauvegarde['moderne'], catalogue: CatalogueModerne, heros: Meta['heros']): Sauvegarde['moderne'] {
  const garder = (ids: readonly string[], connus: readonly string[]): string[] => ids.filter((id) => connus.includes(id));
  const skinsTours = garder(moderne.collection.skinsTours, catalogue.skinsTours);
  const skinsHeros = garder(moderne.collection.skinsHeros, catalogue.skinsHeros);
  const equipes: Record<string, string> = {};
  for (const [cible, skin] of Object.entries(moderne.collection.equipes)) {
    const obtenu = skinsTours.includes(skin) || skinsHeros.includes(skin);
    const herosAbsent = (IDS_HEROS as readonly string[]).includes(cible) && !Object.hasOwn(heros, cible);
    if (obtenu && !herosAbsent && skinModerneAcceptable(cible, skin)) Object.defineProperty(equipes, cible, { value: skin, enumerable: true, writable: true, configurable: true });
  }
  return {
    ...moderne,
    collection: { ...moderne.collection, skinsTours, skinsHeros, equipes },
    titres: garder(moderne.titres, catalogue.titres),
  };
}
