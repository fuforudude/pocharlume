// Accès du moteur aux tables de src/data/, par identifiant texte (les ids viennent de l'état sérialisé).
import { DIEUX } from '../data/dieux';
import { DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { TOURS } from '../data/tours';
import type { DefDieu, DefEnnemi, DefFamille, Difficulte } from './definitions';
import type { EtatPartie } from './etat';

const ennemis: Readonly<Record<string, DefEnnemi | undefined>> = ENNEMIS;
const dieux: Readonly<Record<string, DefDieu | undefined>> = DIEUX;
const difficultes: Readonly<Record<string, Difficulte | undefined>> = DIFFICULTES;
const familles: Readonly<Record<string, DefFamille | undefined>> = TOURS;

export function defEnnemi(id: string): DefEnnemi | undefined {
  return ennemis[id];
}

export function defDieu(id: string): DefDieu | undefined {
  return dieux[id];
}

export function defDifficulte(id: string): Difficulte | undefined {
  return difficultes[id];
}

export function defFamille(id: string): DefFamille | undefined {
  return familles[id];
}

/** Dieu de la partie ; la config a été validée à la création. */
export function dieuDe(etat: EtatPartie): DefDieu {
  const dieu = dieux[etat.config.dieu];
  if (!dieu) throw new Error(`Dieu inconnu : ${etat.config.dieu}`);
  return dieu;
}

export function difficulteDe(etat: EtatPartie): Difficulte {
  const difficulte = difficultes[etat.config.difficulte];
  if (!difficulte) throw new Error(`Difficulté inconnue : ${etat.config.difficulte}`);
  return difficulte;
}
