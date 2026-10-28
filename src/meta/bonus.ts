// Bonus de la collection équipée, tel que la config d'une partie le porte au lancement. Fonctions pures.
//
// Chaque skin ou familier donne un bonus de base selon sa rareté (`meta.ts`), multiplié par 1 + 0,25 × (rang − 1). Un skin
// vaut pour une tour de base (et ses spécialisations) ou pour un héros, un familier pour le héros qui le porte. Le total
// d'une tour ou du héros est plafonné à +10 % : quand les bonus bruts le dépassent, chaque stat est réduite dans la même
// proportion (au pourcentage entier près vers le bas), si bien que la somme ne dépasse jamais le plafond. Les calculs se
// font en entiers de 1/100 000 (`ECHELLE_BONUS`) ; seule la conversion finale donne des fractions.
// En défi Fer, aucun bonus.
import {
  CATALOGUE,
  type FamilleBase,
  FAMILLES_BASE,
  type StatHeros,
  type StatTour,
} from '../data/collection';
import {
  BONUS_FAMILIER_POURCENT,
  BONUS_SKIN_POURCENT,
  bonusEnEntiers,
  ECHELLE_BONUS,
  PLAFOND_BONUS_ENTIERS,
  RANG_MAX_COLLECTION,
  type IdDefi,
  type IdHeros,
} from '../data/meta';
import { emplacementAcceptable, familierEquipe, rangDe, skinEquipe, type Collection } from './collection';

/**
 * Les bonus d'une partie, en fractions (0,03 = +3 %). C'est exactement le contrat du champ `bonus` de la config du
 * moteur : `tours` par famille de tour de base, `heros` pour le héros joué.
 */
export interface BonusCollection {
  tours: Partial<Record<FamilleBase, Partial<Record<StatTour, number>>>>;
  heros: Partial<Record<StatHeros, number>>;
}

export function bonusVide(): BonusCollection {
  return { tours: {}, heros: {} };
}

type Entiers = Partial<Record<string, number>>;

function ajouter(cumul: Entiers, stat: string, valeur: number): void {
  cumul[stat] = (cumul[stat] ?? 0) + valeur;
}

/** Ramène le total au plafond en gardant les proportions ; ne change rien s'il le respecte. */
function plafonner(cumul: Entiers): Entiers {
  const total = Object.values(cumul).reduce<number>((somme, v) => somme + (v ?? 0), 0);
  if (total <= PLAFOND_BONUS_ENTIERS) return cumul;
  const reduit: Entiers = {};
  for (const [stat, valeur] of Object.entries(cumul)) reduit[stat] = Math.floor(((valeur ?? 0) * PLAFOND_BONUS_ENTIERS) / total);
  return reduit;
}

/** Les entiers positifs d'un cumul, convertis en fractions. */
function enFractions<S extends string>(cumul: Entiers): Partial<Record<S, number>> {
  const fractions: Partial<Record<S, number>> = {};
  for (const [stat, valeur] of Object.entries(cumul)) if (valeur !== undefined && valeur > 0) fractions[stat as S] = valeur / ECHELLE_BONUS;
  return fractions;
}

function rangValide(rang: number): number {
  return Math.min(RANG_MAX_COLLECTION, Math.max(1, rang));
}

/**
 * Les bonus de la collection équipée pour une partie jouée avec `heros` dans le défi `defi` (null : partie ordinaire).
 * Un objet équipé mais non possédé, ou un skin à un emplacement qui n'est pas le sien, ne donne rien.
 */
export function bonusDeCollection(collection: Collection, heros: IdHeros, defi: IdDefi | null): BonusCollection {
  if (defi === 'fer') return bonusVide();
  const resultat = bonusVide();

  for (const famille of FAMILLES_BASE) {
    const id = skinEquipe(collection, famille);
    const rang = id === null ? 0 : rangDe(collection, id);
    if (id === null || rang === 0 || !emplacementAcceptable(famille, id)) continue;
    const def = CATALOGUE[id];
    if (def.genre !== 'skin') continue;
    const cumul: Entiers = {};
    ajouter(cumul, def.stat, bonusEnEntiers(BONUS_SKIN_POURCENT[def.rarete], rangValide(rang)));
    const fractions = enFractions<StatTour>(plafonner(cumul));
    if (Object.keys(fractions).length > 0) resultat.tours[famille] = fractions;
  }

  const cumul: Entiers = {};
  const skin = skinEquipe(collection, heros);
  if (skin !== null && rangDe(collection, skin) > 0 && emplacementAcceptable(heros, skin)) {
    const def = CATALOGUE[skin];
    if (def.genre === 'skin') ajouter(cumul, def.stat, bonusEnEntiers(BONUS_SKIN_POURCENT[def.rarete], rangValide(rangDe(collection, skin))));
  }
  const familier = familierEquipe(collection, heros);
  if (familier !== null && rangDe(collection, familier) > 0) {
    const def = CATALOGUE[familier];
    if (def.genre === 'familier') ajouter(cumul, def.stat, bonusEnEntiers(BONUS_FAMILIER_POURCENT[def.rarete], rangValide(rangDe(collection, familier))));
  }
  resultat.heros = enFractions<StatHeros>(plafonner(cumul));
  return resultat;
}
