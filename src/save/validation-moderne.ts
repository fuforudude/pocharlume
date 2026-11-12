// Validation stricte de ce que la sauvegarde v9 ajoute : la campagne « Temps modernes » (`moderne`). Même esprit que validation.ts :
// types exacts, bornes, aucune clé en trop, propriétés propres seulement, copie neuve. Pour les skins et les titres du DLC, on vérifie
// leur forme (identifiant bien formé, sans doublon, triés), pas leur existence dans le catalogue : un identifiant inconnu est écarté à
// la normalisation d'un import (normalisation.ts), jamais une cause de rejet de toute la sauvegarde. Un skin porté doit être obtenu, et un
// skin *connu* du catalogue ne se porte que sur son emplacement (comme dans l'histoire) ; un identifiant inconnu n'est jamais rejeté.
// Une v9 écrite avant l'ajout de `equipes` (branche de développement) est tolérée : l'équipement manquant devient `{}`.
import { NIVEAU_MAX_MODERNE } from '../data/campagnes';
import { defSkinModerne, skinModerneAcceptable } from '../data/recompenses-moderne';
import { CAISSES_AVANT_GARANTIE, CARTES_INFINI_MAX, PLAFOND_MONNAIE, VAGUE_MAX_INFINI } from '../data/meta';
import type { CampagneModerne, CollectionModerne } from './format';
import { avecCles, echec, estEnregistrement, estEntierEntre, ok, poser, valeur, type Resultat } from './validation-base';
import { validerDefis } from './validation-collection';
import { estIdCarteBienForme } from './validation-infini';
import { validerProgression } from './validation-progression';

/** Forme d'un identifiant de skin ou de titre : minuscules, chiffres et tirets bas (jamais un nom hérité d'Object). */
const ID_DLC = /^[a-z][a-z0-9_]{0,47}$/;
/** Garde-fou contre une liste démesurée (le DLC prévoit 38 skins et quelques titres). */
export const ELEMENTS_MAX_DLC = 128;

function validerListeIds(x: unknown, chemin: string): Resultat<string[]> {
  if (!Array.isArray(x)) return echec(`${chemin} : liste attendue`);
  const liste = x as unknown[];
  if (liste.length > ELEMENTS_MAX_DLC) return echec(`${chemin} : au plus ${String(ELEMENTS_MAX_DLC)} éléments`);
  const copie: string[] = [];
  for (const id of liste) {
    if (typeof id !== 'string' || !ID_DLC.test(id) || id in Object.prototype) return echec(`${chemin} : identifiant invalide`);
    const dernier = copie[copie.length - 1];
    if (dernier !== undefined && id <= dernier) return echec(`${chemin} : identifiants attendus dans l'ordre alphabétique, sans doublon`);
    copie.push(id);
  }
  return ok(copie);
}

function validerRecords(x: unknown): Resultat<Record<string, number>> {
  if (!estEnregistrement(x)) return echec('moderne.records : objet attendu');
  const cartes = Object.keys(x);
  if (cartes.length > CARTES_INFINI_MAX) return echec(`moderne.records : au plus ${String(CARTES_INFINI_MAX)} cartes`);
  const records: Record<string, number> = {};
  for (const carte of cartes) {
    if (!estIdCarteBienForme(carte)) return echec(`moderne.records : carte invalide « ${carte} »`);
    const vague = valeur(x, carte);
    if (!estEntierEntre(vague, 1, VAGUE_MAX_INFINI)) return echec(`moderne.records.${carte} : vague de 1 à ${String(VAGUE_MAX_INFINI)} attendue`);
    poser(records, carte, vague);
  }
  return ok(records);
}

/** Les skins du DLC portés : emplacement et skin bien formés, le skin parmi ceux obtenus. */
function validerEquipesModernes(x: unknown, obtenus: readonly string[]): Resultat<Record<string, string>> {
  if (!estEnregistrement(x)) return echec('moderne.collection.equipes : objet attendu');
  const cibles = Object.keys(x);
  if (cibles.length > ELEMENTS_MAX_DLC) return echec(`moderne.collection.equipes : au plus ${String(ELEMENTS_MAX_DLC)} emplacements`);
  const equipes: Record<string, string> = {};
  for (const cible of cibles) {
    if (!ID_DLC.test(cible) || cible in Object.prototype) return echec(`moderne.collection.equipes : emplacement invalide « ${cible} »`);
    const skin = valeur(x, cible);
    if (typeof skin !== 'string' || !obtenus.includes(skin)) return echec(`moderne.collection.equipes.${cible} : skin non obtenu`);
    if (defSkinModerne(skin) !== undefined && !skinModerneAcceptable(cible, skin)) return echec(`moderne.collection.equipes.${cible} : ce skin ne se porte pas à cet emplacement`);
    poser(equipes, cible, skin);
  }
  return ok(equipes);
}

function validerCollectionModerne(brut: unknown): Resultat<CollectionModerne> {
  const x = estEnregistrement(brut) && !Object.hasOwn(brut, 'equipes') ? { ...brut, equipes: {} } : brut;
  const base = avecCles(x, ['skinsTours', 'skinsHeros', 'garantie', 'equipes'], 'moderne.collection');
  if (!base.ok) return base;
  const skinsTours = validerListeIds(valeur(base.valeur, 'skinsTours'), 'moderne.collection.skinsTours');
  if (!skinsTours.ok) return skinsTours;
  const skinsHeros = validerListeIds(valeur(base.valeur, 'skinsHeros'), 'moderne.collection.skinsHeros');
  if (!skinsHeros.ok) return skinsHeros;
  const garantie = valeur(base.valeur, 'garantie');
  if (!estEntierEntre(garantie, 0, CAISSES_AVANT_GARANTIE - 1)) return echec(`moderne.collection.garantie : entier de 0 à ${String(CAISSES_AVANT_GARANTIE - 1)} attendu`);
  const equipes = validerEquipesModernes(valeur(base.valeur, 'equipes'), [...skinsTours.valeur, ...skinsHeros.valeur]);
  if (!equipes.ok) return equipes;
  return ok({ skinsTours: skinsTours.valeur, skinsHeros: skinsHeros.valeur, garantie, equipes: equipes.valeur });
}

export function validerModerne(x: unknown): Resultat<CampagneModerne> {
  const base = avecCles(x, ['progression', 'defis', 'records', 'badges', 'collection', 'titres', 'stickerReplie'], 'moderne');
  if (!base.ok) return base;
  const progression = validerProgression(valeur(base.valeur, 'progression'), NIVEAU_MAX_MODERNE, 'moderne.progression');
  if (!progression.ok) return progression;
  const defis = validerDefis(valeur(base.valeur, 'defis'), progression.valeur, 'moderne.defis');
  if (!defis.ok) return defis;
  const records = validerRecords(valeur(base.valeur, 'records'));
  if (!records.ok) return records;
  const badges = valeur(base.valeur, 'badges');
  if (!estEntierEntre(badges, 0, PLAFOND_MONNAIE)) return echec(`moderne.badges : entier de 0 à ${String(PLAFOND_MONNAIE)} attendu`);
  const collection = validerCollectionModerne(valeur(base.valeur, 'collection'));
  if (!collection.ok) return collection;
  const titres = validerListeIds(valeur(base.valeur, 'titres'), 'moderne.titres');
  if (!titres.ok) return titres;
  const stickerReplie = valeur(base.valeur, 'stickerReplie');
  if (typeof stickerReplie !== 'boolean') return echec('moderne.stickerReplie : booléen attendu');
  return ok({ progression: progression.valeur, defis: defis.valeur, records: records.valeur, badges, collection: collection.valeur, titres: titres.valeur, stickerReplie });
}
