// Accès du moteur aux tables de src/data/, par identifiant texte. Les ids viennent de l'état sérialisé ou
// d'un journal relu : on ne lit que les propriétés propres des tables (« constructor », « __proto__ »,
// « toString »… ne sont pas des ids).
import { DIEUX } from '../data/dieux';
import { DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { TOURS } from '../data/tours';
import type { DefDieu, DefEnnemi, DefFamille, Difficulte } from './definitions';
import type { EtatPartie } from './etat';

const ennemis: Readonly<Record<string, DefEnnemi>> = ENNEMIS;
const dieux: Readonly<Record<string, DefDieu>> = DIEUX;
const difficultes: Readonly<Record<string, Difficulte>> = DIFFICULTES;
const familles: Readonly<Record<string, DefFamille>> = TOURS;

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

/** Dieu de la partie ; la config a été validée à la création. */
export function dieuDe(etat: EtatPartie): DefDieu {
  const dieu = defDieu(etat.config.dieu);
  if (!dieu) throw new Error(`Dieu inconnu : ${etat.config.dieu}`);
  return dieu;
}

export function difficulteDe(etat: EtatPartie): Difficulte {
  const difficulte = defDifficulte(etat.config.difficulte);
  if (!difficulte) throw new Error(`Difficulté inconnue : ${etat.config.difficulte}`);
  return difficulte;
}
