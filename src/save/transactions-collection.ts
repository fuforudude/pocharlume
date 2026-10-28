// Transactions de la collection : ouvrir une caisse, monter un rang, acheter un objet précis, équiper et déséquiper un skin
// ou un familier. Comme celles de transactions.ts, des fonctions pures : chacune prend une sauvegarde et rend soit
// { ok: true, sauvegarde } (une copie), soit { ok: false, raison } sans rien avoir changé. Les paramètres viennent de
// l'interface (chaînes quelconques) : ils sont vérifiés ici. Le hasard de l'ouverture d'une caisse est injecté.
import { CATALOGUE, estIdCollection, estIdFamilier, estIdSkin, type IdCollection, type IdFamilier, type IdSkin } from '../data/collection';
import {
  coutRangEclats,
  ECLATS_DOUBLON,
  estIdHeros,
  estTypeCaisse,
  PLAFOND_MONNAIE,
  PRIX_CAISSE,
  PRIX_ECLATS_OBJET,
  RANG_MAX_COLLECTION,
  type Rarete,
  type TypeCaisse,
} from '../data/meta';
import type { SourceAleatoire } from '../meta/aleatoire';
import { emplacementAcceptable, rangDe, type Collection } from '../meta/collection';
import { tirerCaisse } from '../meta/tirage';
import type { Meta, Sauvegarde } from './format';

export type TransactionCollection<R extends string> =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde }
  | { readonly ok: false; readonly raison: R };

export type RaisonCaisse = 'type_inconnu' | 'braises_insuffisantes';
export type RaisonRang = 'objet_inconnu' | 'non_possede' | 'rang_max' | 'eclats_insuffisants';
export type RaisonAchatPrecis = 'objet_inconnu' | 'deja_possede' | 'eclats_insuffisants';
export type RaisonEquipementCollection = 'objet_inconnu' | 'non_possede' | 'emplacement_invalide' | 'heros_inconnu' | 'heros_non_possede';

/** Ce qu'une caisse a donné, pour l'écran d'ouverture. */
export interface OuvertureCaisse {
  readonly id: IdCollection;
  readonly rarete: Rarete;
  /** Faux pour un doublon (il a donné des éclats au lieu d'un nouvel objet). */
  readonly nouveau: boolean;
  /** Éclats réellement gagnés par un doublon (0 pour un nouvel objet) ; tronqués au plafond des monnaies. */
  readonly eclats: number;
  /** La garantie a imposé un Épique ou mieux. */
  readonly garantie: boolean;
  /** Braises que la caisse a coûtées. */
  readonly braises: number;
}

export type ResultatCaisse =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly tirage: OuvertureCaisse }
  | { readonly ok: false; readonly raison: RaisonCaisse };

function refus<R extends string>(raison: R): { readonly ok: false; readonly raison: R } {
  return { ok: false, raison };
}

function avecCollection(s: Sauvegarde, collection: Collection, meta: Partial<Meta> = {}): { readonly ok: true; readonly sauvegarde: Sauvegarde } {
  return { ok: true, sauvegarde: { ...s, meta: { ...s.meta, ...meta, collection } } };
}

// --- Caisses --------------------------------------------------------------------------------------------------

/**
 * Ouvre une caisse : débite 20 braises, tire un objet (voir `tirerCaisse`), puis l'ajoute au rang 1 ou, si on l'a déjà, le
 * convertit en éclats (selon sa rareté). Le compteur de garantie du type avance ou repart à zéro. Refusé, sans consommer
 * de hasard, pour un type inconnu ou moins de 20 braises.
 */
export function ouvrirCaisse(s: Sauvegarde, type: string, alea: SourceAleatoire): ResultatCaisse {
  if (!estTypeCaisse(type)) return refus('type_inconnu');
  if (s.meta.monnaies.braises < PRIX_CAISSE) return refus('braises_insuffisantes');
  const collection = s.meta.collection;
  const tire = tirerCaisse(type, collection.garanties[type], alea);
  const nouveau = !Object.hasOwn(collection.possedes, tire.id);
  const eclatsApres = nouveau ? collection.eclats : Math.min(PLAFOND_MONNAIE, collection.eclats + ECLATS_DOUBLON[tire.rarete]);
  const suivante: Collection = {
    ...collection,
    possedes: nouveau ? { ...collection.possedes, [tire.id]: 1 } : collection.possedes,
    eclats: eclatsApres,
    garanties: { ...collection.garanties, [type satisfies TypeCaisse]: tire.compteur },
  };
  const { sauvegarde } = avecCollection(s, suivante, { monnaies: { ...s.meta.monnaies, braises: s.meta.monnaies.braises - PRIX_CAISSE } });
  return {
    ok: true,
    sauvegarde,
    tirage: { id: tire.id, rarete: tire.rarete, nouveau, eclats: eclatsApres - collection.eclats, garantie: tire.garantie, braises: PRIX_CAISSE },
  };
}

// --- Rangs et achats précis -----------------------------------------------------------------------------------

/** Monte un objet possédé du rang r au rang r + 1 pour 20 × r éclats (5 rangs au plus). */
export function monterRang(s: Sauvegarde, objet: string): TransactionCollection<RaisonRang> {
  if (!estIdCollection(objet)) return refus('objet_inconnu');
  const rang = rangDe(s.meta.collection, objet);
  if (rang === 0) return refus('non_possede');
  if (rang >= RANG_MAX_COLLECTION) return refus('rang_max');
  const cout = coutRangEclats(rang);
  if (s.meta.collection.eclats < cout) return refus('eclats_insuffisants');
  return avecCollection(s, {
    ...s.meta.collection,
    possedes: { ...s.meta.collection.possedes, [objet]: rang + 1 },
    eclats: s.meta.collection.eclats - cout,
  });
}

/** Achète un objet précis qu'on n'a pas, au rang 1, pour 50 / 120 / 300 / 700 / 1500 éclats selon sa rareté. */
export function acheterObjetPrecis(s: Sauvegarde, objet: string): TransactionCollection<RaisonAchatPrecis> {
  if (!estIdCollection(objet)) return refus('objet_inconnu');
  if (rangDe(s.meta.collection, objet) > 0) return refus('deja_possede');
  const prix = PRIX_ECLATS_OBJET[CATALOGUE[objet].rarete];
  if (s.meta.collection.eclats < prix) return refus('eclats_insuffisants');
  return avecCollection(s, {
    ...s.meta.collection,
    possedes: { ...s.meta.collection.possedes, [objet]: 1 },
    eclats: s.meta.collection.eclats - prix,
  });
}

// --- Équipement -----------------------------------------------------------------------------------------------

/** Le héros est-il possédé (propriété propre : jamais un nom hérité d'Object) ? */
function heroPossede(s: Sauvegarde, heros: string): boolean {
  return Object.hasOwn(s.meta.heros, heros);
}

/**
 * Équipe un skin possédé à son emplacement (la tour de base ou le héros pour lequel il est fait), ou le retire avec
 * `null`. Le skin d'un héros demande que le héros soit recruté.
 */
export function equiperSkin(s: Sauvegarde, cible: string, skin: string | null): TransactionCollection<RaisonEquipementCollection> {
  const collection = s.meta.collection;
  if (skin === null) {
    if (!Object.hasOwn(collection.equipes.skins, cible)) return { ok: true, sauvegarde: s };
    const skins = Object.fromEntries(Object.entries(collection.equipes.skins).filter(([emplacement]) => emplacement !== cible)) as Collection['equipes']['skins'];
    return avecCollection(s, { ...collection, equipes: { ...collection.equipes, skins } });
  }
  if (!estIdSkin(skin)) return refus('objet_inconnu');
  if (!emplacementAcceptable(cible, skin)) return refus('emplacement_invalide');
  if (rangDe(collection, skin) === 0) return refus('non_possede');
  if (estIdHeros(cible) && !heroPossede(s, cible)) return refus('heros_non_possede');
  return avecCollection(s, { ...collection, equipes: { ...collection.equipes, skins: { ...collection.equipes.skins, [cible]: skin satisfies IdSkin } } });
}

/** Équipe un familier possédé sur un héros recruté, ou le retire avec `null`. Un seul familier par héros. */
export function equiperFamilier(s: Sauvegarde, heros: string, familier: string | null): TransactionCollection<RaisonEquipementCollection> {
  if (!estIdHeros(heros)) return refus('heros_inconnu');
  const collection = s.meta.collection;
  if (familier === null) {
    if (!Object.hasOwn(collection.equipes.familiers, heros)) return { ok: true, sauvegarde: s };
    const familiers = Object.fromEntries(Object.entries(collection.equipes.familiers).filter(([porteur]) => porteur !== heros)) as Collection['equipes']['familiers'];
    return avecCollection(s, { ...collection, equipes: { ...collection.equipes, familiers } });
  }
  if (!estIdFamilier(familier)) return refus('objet_inconnu');
  if (rangDe(collection, familier) === 0) return refus('non_possede');
  if (!heroPossede(s, heros)) return refus('heros_non_possede');
  return avecCollection(s, {
    ...collection,
    equipes: { ...collection.equipes, familiers: { ...collection.equipes.familiers, [heros]: familier satisfies IdFamilier } },
  });
}
