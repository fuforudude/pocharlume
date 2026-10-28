// Arbre d'améliorations acheté avec des étoiles : 6 branches de 5 rangs, un petit bonus par rang.
// Ici, seulement l'effet en partie ; les prix (le rang n coûte n étoiles) et l'achat sont dans la méta-progression.
// Un rang donne l'effet TOTAL de la branche à ce rang (indice 0 = rang 1).
import type { DefBranche, ModArbre } from '../engine/definitions';
import { RANG_MAX_ARBRE } from './meta';

const NUL: ModArbre = { pvSoldats: 0, portee: 0, degats: 0, zone: 0, recharge: 0, pvHeros: 0, degatsHeros: 0 };

/** Cinq rangs d'un même champ : `cinq('portee', [0.03, 0.06, …])`. */
function cinq(champs: Partial<Record<keyof ModArbre, readonly [number, number, number, number, number]>>): readonly ModArbre[] {
  return [0, 1, 2, 3, 4].map((i) => {
    const mod: { -readonly [K in keyof ModArbre]: ModArbre[K] } = { ...NUL };
    for (const cle of Object.keys(champs) as (keyof ModArbre)[]) mod[cle] = champs[cle]?.[i] ?? 0;
    return mod;
  });
}

function branche(id: string, cible: DefBranche['cible'], effets: readonly ModArbre[]): DefBranche {
  return { nom: `arbre.${id}`, description: `arbre.${id}.desc`, cible, rangMax: RANG_MAX_ARBRE, effets };
}

export const BRANCHES = {
  /** Soldats des casernes : plus de PV. */
  caserne: branche('caserne', 'caserne', cinq({ pvSoldats: [0.016, 0.032, 0.048, 0.064, 0.08] })),
  /** Tours de tir : plus de portée. */
  tir: branche('tir', 'tir', cinq({ portee: [0.012, 0.024, 0.036, 0.048, 0.06] })),
  /** Tours de magie : plus de dégâts. */
  magie: branche('magie', 'magie', cinq({ degats: [0.012, 0.024, 0.036, 0.048, 0.06] })),
  /** Artillerie : zones plus larges. */
  artillerie: branche('artillerie', 'artillerie', cinq({ zone: [0.016, 0.032, 0.048, 0.064, 0.08] })),
  /** Sorts : recharge plus courte. */
  sorts: branche('sorts', 'sorts', cinq({ recharge: [0.016, 0.032, 0.048, 0.064, 0.08] })),
  /** Héros : plus de PV et de dégâts. */
  heros: branche('heros', 'heros', cinq({ pvHeros: [0.016, 0.032, 0.048, 0.064, 0.08], degatsHeros: [0.012, 0.024, 0.036, 0.048, 0.06] })),
} as const satisfies Record<string, DefBranche>;

export type IdBranche = keyof typeof BRANCHES;
