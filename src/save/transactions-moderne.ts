// Transactions des récompenses du DLC « Temps modernes » : ouvrir la caisse « Temps modernes » (payée en badges) et porter un skin du DLC.
// Sur le modèle de transactions-collection.ts : des fonctions pures qui rendent { ok: true, sauvegarde } (une copie) ou { ok: false, raison }
// sans rien changer ; paramètres de l'interface vérifiés ici ; hasard injecté. Les skins du DLC sont une apparence : ils n'ont ni rang
// ni bonus, un doublon donne des éclats à la collection de l'histoire (`meta.collection.eclats`), comme un doublon des caisses actuelles.
import { ECLATS_DOUBLON, IDS_HEROS, PLAFOND_MONNAIE, type Rarete } from '../data/meta';
import { defSkinModerne, PRIX_CAISSE_MODERNE, skinModerneAcceptable } from '../data/recompenses-moderne';
import type { SourceAleatoire } from '../meta/aleatoire';
import { tirerCaisseModerne } from '../meta/tirage';
import type { CollectionModerne, Sauvegarde } from './format';
import type { RaisonEquipementCollection, TransactionCollection } from './transactions-collection';

export type RaisonCaisseModerne = 'badges_insuffisants';

/** Ce que la caisse « Temps modernes » a donné, pour l'écran d'ouverture. */
export interface OuvertureCaisseModerne {
  /** Identifiant du skin du DLC. */
  readonly id: string;
  readonly rarete: Rarete;
  /** Faux pour un doublon (il a donné des éclats). */
  readonly nouveau: boolean;
  /** Éclats réellement gagnés par un doublon (0 pour un nouveau skin), tronqués au plafond. */
  readonly eclats: number;
  /** La garantie a imposé un Épique ou mieux. */
  readonly garantie: boolean;
  /** Badges que la caisse a coûtés. */
  readonly badges: number;
}

export type ResultatCaisseModerne =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly tirage: OuvertureCaisseModerne }
  | { readonly ok: false; readonly raison: RaisonCaisseModerne };

function refus<R extends string>(raison: R): { readonly ok: false; readonly raison: R } {
  return { ok: false, raison };
}

function avecCollectionModerne(s: Sauvegarde, collection: CollectionModerne, badges = s.moderne.badges): Sauvegarde {
  return { ...s, moderne: { ...s.moderne, badges, collection } };
}

/**
 * Ouvre une caisse « Temps modernes » : débite `PRIX_CAISSE_MODERNE` badges, tire un skin du DLC (`tirerCaisseModerne`), l'ajoute à sa
 * liste (tours ou héros, dans l'ordre alphabétique) ou, si on l'a déjà, le convertit en éclats selon sa rareté. La garantie avance ou
 * repart à zéro. Refusé, sans consommer de hasard, s'il manque des badges (les braises et les éclats ne paient jamais cette caisse).
 */
export function ouvrirCaisseModerne(s: Sauvegarde, alea: SourceAleatoire): ResultatCaisseModerne {
  if (s.moderne.badges < PRIX_CAISSE_MODERNE) return refus('badges_insuffisants');
  const collection = s.moderne.collection;
  const tire = tirerCaisseModerne(collection.garantie, alea);
  const heros = defSkinModerne(tire.id)?.cible.type === 'heros';
  const liste = heros ? collection.skinsHeros : collection.skinsTours;
  const nouveau = !liste.includes(tire.id);
  const eclatsAvant = s.meta.collection.eclats;
  const eclatsApres = nouveau ? eclatsAvant : Math.min(PLAFOND_MONNAIE, eclatsAvant + ECLATS_DOUBLON[tire.rarete]);
  const suivante: CollectionModerne = {
    ...collection,
    ...(nouveau ? (heros ? { skinsHeros: [...liste, tire.id].sort() } : { skinsTours: [...liste, tire.id].sort() }) : {}),
    garantie: tire.compteur,
  };
  const payee = avecCollectionModerne(s, suivante, s.moderne.badges - PRIX_CAISSE_MODERNE);
  const sauvegarde = nouveau ? payee : { ...payee, meta: { ...payee.meta, collection: { ...payee.meta.collection, eclats: eclatsApres } } };
  return {
    ok: true,
    sauvegarde,
    tirage: { id: tire.id, rarete: tire.rarete, nouveau, eclats: eclatsApres - eclatsAvant, garantie: tire.garantie, badges: PRIX_CAISSE_MODERNE },
  };
}

/**
 * Porte un skin du DLC obtenu sur son emplacement (`tir`, `divine_plume`, un héros recruté), ou le retire avec `null`. Il habille aussi
 * l'histoire, par-dessus le skin de la collection de l'histoire, qui reste équipé (et son bonus compté).
 */
export function equiperSkinModerne(s: Sauvegarde, cible: string, skin: string | null): TransactionCollection<RaisonEquipementCollection> {
  const collection = s.moderne.collection;
  if (skin === null) {
    if (!Object.hasOwn(collection.equipes, cible)) return { ok: true, sauvegarde: s };
    const equipes = Object.fromEntries(Object.entries(collection.equipes).filter(([emplacement]) => emplacement !== cible));
    return { ok: true, sauvegarde: avecCollectionModerne(s, { ...collection, equipes }) };
  }
  if (defSkinModerne(skin) === undefined) return refus('objet_inconnu');
  if (!skinModerneAcceptable(cible, skin)) return refus('emplacement_invalide');
  if (!collection.skinsTours.includes(skin) && !collection.skinsHeros.includes(skin)) return refus('non_possede');
  if ((IDS_HEROS as readonly string[]).includes(cible) && !Object.hasOwn(s.meta.heros, cible)) return refus('heros_non_possede');
  const equipes = { ...collection.equipes };
  Object.defineProperty(equipes, cible, { value: skin, enumerable: true, writable: true, configurable: true });
  return { ok: true, sauvegarde: avecCollectionModerne(s, { ...collection, equipes }) };
}
