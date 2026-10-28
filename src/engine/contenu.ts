// Accès du moteur aux tables de src/data/, par identifiant texte. Les ids viennent de l'état sérialisé ou
// d'un journal relu : on ne lit que les propriétés propres des tables (« constructor », « __proto__ »,
// « toString »… ne sont pas des ids).
import { BRANCHES } from '../data/ameliorations';
import { DIEUX } from '../data/dieux';
import { DIFFICULTE_DES_DEFIS, DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { HEROS } from '../data/heros';
import { OBJETS } from '../data/objets';
import { TOURS } from '../data/tours';
import type { DefBranche, DefDieu, DefEnnemi, DefFamille, DefHeros, DefObjet, Difficulte } from './definitions';
import type { ConfigPartie, EtatPartie } from './etat';

const ennemis: Readonly<Record<string, DefEnnemi>> = ENNEMIS;
const dieux: Readonly<Record<string, DefDieu>> = DIEUX;
const difficultes: Readonly<Record<string, Difficulte>> = DIFFICULTES;
const familles: Readonly<Record<string, DefFamille>> = TOURS;
const heros: Readonly<Record<string, DefHeros>> = HEROS;
const objets: Readonly<Record<string, DefObjet>> = OBJETS;
const branches: Readonly<Record<string, DefBranche>> = BRANCHES;

function chercher<T>(table: Readonly<Record<string, T>>, id: unknown): T | undefined {
  return typeof id === 'string' && Object.hasOwn(table, id) ? table[id] : undefined;
}

export function defEnnemi(id: unknown): DefEnnemi | undefined {
  return chercher(ennemis, id);
}

export function defDieu(id: unknown): DefDieu | undefined {
  return chercher(dieux, id);
}

export function defDifficulte(id: unknown): Difficulte | undefined {
  return chercher(difficultes, id);
}

export function defFamille(id: unknown): DefFamille | undefined {
  return chercher(familles, id);
}

export function defHeros(id: unknown): DefHeros | undefined {
  return chercher(heros, id);
}

export function defObjet(id: unknown): DefObjet | undefined {
  return chercher(objets, id);
}

export function defBranche(id: unknown): DefBranche | undefined {
  return chercher(branches, id);
}

/** Ids des branches de l'arbre d'améliorations. */
export function idsBranches(): string[] {
  return Object.keys(branches);
}

/** Dieu de la partie ; la config a été validée à la création. */
export function dieuDe(etat: EtatPartie): DefDieu {
  const dieu = defDieu(etat.config.dieu);
  if (!dieu) throw new Error(`Dieu inconnu : ${etat.config.dieu}`);
  return dieu;
}

/** Héros de la partie (celui de la config) ; la config a été validée à la création. */
export function herosDe(etat: EtatPartie): DefHeros {
  const h = defHeros(etat.config.heros);
  if (!h) throw new Error(`Héros inconnu : ${etat.config.heros}`);
  return h;
}

/** Difficulté qui s'applique à une config : celle de Matou en défi (Héroïque, Fer), sinon celle de la config. */
export function difficulteDeConfig(config: ConfigPartie): Difficulte | undefined {
  return defDifficulte(config.defi ? DIFFICULTE_DES_DEFIS : config.difficulte);
}

export function difficulteDe(etat: EtatPartie): Difficulte {
  const difficulte = difficulteDeConfig(etat.config);
  if (!difficulte) throw new Error(`Difficulté inconnue : ${etat.config.difficulte}`);
  return difficulte;
}
