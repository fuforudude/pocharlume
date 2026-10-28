// Validation stricte de ce que la sauvegarde v4 ajoute : région ouverte, défis réussis, collection (objets possédés et
// rangs, éclats, compteurs de garantie, équipement), et les champs `defi` et `bonus` de la config d'une partie en cours.
// Même esprit que validation.ts : types exacts, bornes, ids connus (propriétés propres seulement), copie neuve.
import { estIdCollection, estIdFamilier, FAMILLES_BASE, type IdSkin, type StatHeros, type StatTour } from '../data/collection';
import {
  CAISSES_AVANT_GARANTIE,
  ECHELLE_BONUS,
  IDS_DEFIS,
  IDS_HEROS,
  NOMBRE_REGIONS,
  PLAFOND_BONUS_ENTIERS,
  PLAFOND_MONNAIE,
  RANG_MAX_COLLECTION,
  regionOuverte,
  TYPES_CAISSE,
} from '../data/meta';
import type { ConfigPartie } from '../engine';
import { emplacementAcceptable, type CibleSkin, type Collection } from '../meta/collection';
import type { BonusCollection } from '../meta/bonus';
import { DIFFICULTES_SAUVEGARDE, type DefisNiveau, type Progression } from './format';
import { avecCles, CLE_NIVEAU, echec, estEnregistrement, estEntierEntre, ok, parmi, poser, validerEntiersParCle, valeur, type Resultat } from './validation-base';

// --- Région ouverte et défis -----------------------------------------------------------------------------------

/** La région la plus haute ouverte : un entier de 1 à 10, égal à celui que donne le niveau le plus haut débloqué. */
export function validerRegionMax(x: unknown, niveauMax: number): Resultat<number> {
  if (!estEntierEntre(x, 1, NOMBRE_REGIONS)) return echec(`meta.regionMax : entier de 1 à ${String(NOMBRE_REGIONS)} attendu`);
  if (x !== regionOuverte(niveauMax)) return echec(`meta.regionMax : la région ${String(regionOuverte(niveauMax))} est la plus haute ouverte avec le niveau ${String(niveauMax)} débloqué`);
  return ok(x);
}

/** Meilleur nombre d'étoiles d'un niveau, toutes difficultés confondues (0 s'il n'a jamais été réussi). */
function meilleuresEtoilesBrutes(progression: Progression, cle: string): number {
  const niveau = Object.hasOwn(progression.etoiles, cle) ? progression.etoiles[cle] : undefined;
  return Math.max(0, ...DIFFICULTES_SAUVEGARDE.map((d) => niveau?.[d] ?? 0));
}

/** Les défis réussis : seulement des niveaux à 3 étoiles, des défis connus, la valeur `true`. */
export function validerDefis(x: unknown, progression: Progression): Resultat<Record<string, DefisNiveau>> {
  if (!estEnregistrement(x)) return echec('meta.defis : objet attendu');
  const copie: Record<string, DefisNiveau> = {};
  for (const cle of Object.keys(x)) {
    if (!CLE_NIVEAU.test(cle)) return echec(`meta.defis : numéro de niveau invalide « ${cle} »`);
    const defis = valeur(x, cle);
    if (!estEnregistrement(defis)) return echec(`meta.defis.${cle} : objet attendu`);
    const noms = Object.keys(defis);
    if (noms.length === 0) return echec(`meta.defis.${cle} : aucun défi`);
    const reussis: DefisNiveau = {};
    for (const nom of noms) {
      if (!parmi(IDS_DEFIS, nom)) return echec(`meta.defis.${cle} : défi inconnu « ${nom} »`);
      if (valeur(defis, nom) !== true) return echec(`meta.defis.${cle}.${nom} : vrai attendu`);
      reussis[nom] = true;
    }
    if (meilleuresEtoilesBrutes(progression, cle) < 3) return echec(`meta.defis.${cle} : un défi demande 3 étoiles sur le niveau`);
    poser(copie, cle, reussis);
  }
  return ok(copie);
}

// --- Collection ------------------------------------------------------------------------------------------------

function validerPossedes(x: unknown): Resultat<Collection['possedes']> {
  if (!estEnregistrement(x)) return echec('meta.collection.possedes : objet attendu');
  const copie: Collection['possedes'] = {};
  for (const cle of Object.keys(x)) {
    if (!estIdCollection(cle)) return echec(`meta.collection.possedes : objet inconnu « ${cle} »`);
    const rang = valeur(x, cle);
    if (!estEntierEntre(rang, 1, RANG_MAX_COLLECTION)) return echec(`meta.collection.possedes.${cle} : rang de 1 à ${String(RANG_MAX_COLLECTION)} attendu`);
    copie[cle] = rang;
  }
  return ok(copie);
}

function validerEquipement(x: unknown, possedes: Collection['possedes']): Resultat<Collection['equipes']> {
  const base = avecCles(x, ['skins', 'familiers'], 'meta.collection.equipes');
  if (!base.ok) return base;
  const brutsSkins = valeur(base.valeur, 'skins');
  const brutsFamiliers = valeur(base.valeur, 'familiers');
  if (!estEnregistrement(brutsSkins)) return echec('meta.collection.equipes.skins : objet attendu');
  if (!estEnregistrement(brutsFamiliers)) return echec('meta.collection.equipes.familiers : objet attendu');

  const skins: Collection['equipes']['skins'] = {};
  for (const cible of Object.keys(brutsSkins)) {
    const id = valeur(brutsSkins, cible);
    if (typeof id !== 'string' || !emplacementAcceptable(cible, id)) return echec(`meta.collection.equipes.skins.${cible} : ce skin ne se porte pas ici`);
    if (!Object.hasOwn(possedes, id)) return echec(`meta.collection.equipes.skins.${cible} : skin non possédé`);
    // `emplacementAcceptable` garantit que `cible` est une tour de base ou un héros, et `id` un skin fait pour lui.
    skins[cible as CibleSkin] = id as IdSkin;
  }

  const familiers: Collection['equipes']['familiers'] = {};
  for (const heros of Object.keys(brutsFamiliers)) {
    const id = valeur(brutsFamiliers, heros);
    if (!parmi(IDS_HEROS, heros)) return echec(`meta.collection.equipes.familiers : héros inconnu « ${heros} »`);
    if (!estIdFamilier(id)) return echec(`meta.collection.equipes.familiers.${heros} : familier inconnu`);
    if (!Object.hasOwn(possedes, id)) return echec(`meta.collection.equipes.familiers.${heros} : familier non possédé`);
    familiers[heros] = id;
  }
  return ok({ skins, familiers });
}

export function validerCollection(x: unknown): Resultat<Collection> {
  const base = avecCles(x, ['possedes', 'eclats', 'garanties', 'equipes'], 'meta.collection');
  if (!base.ok) return base;
  const possedes = validerPossedes(valeur(base.valeur, 'possedes'));
  if (!possedes.ok) return possedes;
  const eclats = valeur(base.valeur, 'eclats');
  if (!estEntierEntre(eclats, 0, PLAFOND_MONNAIE)) return echec(`meta.collection.eclats : entier de 0 à ${String(PLAFOND_MONNAIE)} attendu`);
  const garanties = validerEntiersParCle(valeur(base.valeur, 'garanties'), TYPES_CAISSE, CAISSES_AVANT_GARANTIE - 1, 'meta.collection.garanties');
  if (!garanties.ok) return garanties;
  const equipes = validerEquipement(valeur(base.valeur, 'equipes'), possedes.valeur);
  if (!equipes.ok) return equipes;
  return ok({ possedes: possedes.valeur, eclats, garanties: garanties.valeur, equipes: equipes.valeur });
}

// --- Défi et bonus de la config d'une partie -------------------------------------------------------------------

/** Les champs que la config d'une partie reçoit au jalon 3 : le défi joué (ou null) et les bonus de la collection. */
export type ExtensionConfigV4 = Required<Pick<ConfigPartie, 'defi' | 'bonus'>>;

/** Un groupe de bonus (une tour, ou le héros) : stats connues, fractions finies de 0 à +10 %, total d'au plus +10 %. */
function validerGroupeBonus<S extends string>(x: unknown, stats: readonly S[], chemin: string): Resultat<Partial<Record<S, number>>> {
  if (!estEnregistrement(x)) return echec(`${chemin} : objet attendu`);
  const copie: Partial<Record<S, number>> = {};
  let total = 0;
  for (const stat of Object.keys(x)) {
    if (!parmi(stats, stat)) return echec(`${chemin} : stat inconnue « ${stat} »`);
    const fraction = valeur(x, stat);
    if (typeof fraction !== 'number' || !Number.isFinite(fraction) || fraction < 0 || fraction > PLAFOND_BONUS_ENTIERS / ECHELLE_BONUS) {
      return echec(`${chemin}.${stat} : fraction de 0 à ${String(PLAFOND_BONUS_ENTIERS / ECHELLE_BONUS)} attendue`);
    }
    total += Math.round(fraction * ECHELLE_BONUS);
    copie[stat] = fraction;
  }
  if (total > PLAFOND_BONUS_ENTIERS) return echec(`${chemin} : le total dépasse le plafond de +${String(PLAFOND_BONUS_ENTIERS / (ECHELLE_BONUS / 100))} %`);
  return ok(copie);
}

const STATS_TOUR: readonly StatTour[] = ['degats', 'cadence', 'portee', 'pvSoldats'];
const STATS_HEROS: readonly StatHeros[] = ['pv', 'degats', 'cadence', 'regeneration'];

function validerBonus(x: unknown): Resultat<BonusCollection> {
  const base = avecCles(x, ['tours', 'heros'], 'partie.config.bonus');
  if (!base.ok) return base;
  const brutsTours = valeur(base.valeur, 'tours');
  if (!estEnregistrement(brutsTours)) return echec('partie.config.bonus.tours : objet attendu');
  const tours: BonusCollection['tours'] = {};
  for (const famille of Object.keys(brutsTours)) {
    if (!parmi(FAMILLES_BASE, famille)) return echec(`partie.config.bonus.tours : tour inconnue « ${famille} »`);
    const groupe = validerGroupeBonus(valeur(brutsTours, famille), STATS_TOUR, `partie.config.bonus.tours.${famille}`);
    if (!groupe.ok) return groupe;
    tours[famille] = groupe.valeur;
  }
  const heros = validerGroupeBonus(valeur(base.valeur, 'heros'), STATS_HEROS, 'partie.config.bonus.heros');
  if (!heros.ok) return heros;
  return ok({ tours, heros: heros.valeur });
}

/** Les champs `defi` et `bonus` d'une config (tous deux présents, déjà vérifié par l'appelant). Aucun bonus en défi Fer. */
export function validerExtensionConfigV4(brute: Record<string, unknown>): Resultat<ExtensionConfigV4> {
  const defi = valeur(brute, 'defi');
  if (defi !== null && !parmi(IDS_DEFIS, defi)) return echec('partie.config.defi inconnu');
  const bonus = validerBonus(valeur(brute, 'bonus'));
  if (!bonus.ok) return bonus;
  if (defi === 'fer' && (Object.keys(bonus.valeur.tours).length > 0 || Object.keys(bonus.valeur.heros).length > 0)) {
    return echec('partie.config.bonus : aucun bonus de collection en défi Fer');
  }
  return ok({ defi, bonus: bonus.valeur });
}
