// Validation stricte de ce que la sauvegarde v5 ajoute : le mode infini (record par carte, paliers payés).
// Même esprit que validation-collection.ts : types exacts, bornes, copie neuve, propriétés propres seulement.
import { CARTES_INFINI_MAX, estPalierInfini, VAGUE_MAX_INFINI } from '../data/meta';
import type { Infini } from './format';
import { avecCles, echec, estEnregistrement, estEntierEntre, ok, poser, valeur, type Resultat } from './validation-base';

/** Forme d'un identifiant de carte (les cartes des régions 6 à 10 n'existent pas encore : on ne les liste pas ici). */
export const ID_CARTE = /^[a-z][a-z0-9_]{0,31}$/;

/** `x` est-il un identifiant de carte bien formé (jamais un nom hérité d'Object) ? */
export function estIdCarteBienForme(x: unknown): boolean {
  return typeof x === 'string' && ID_CARTE.test(x) && !(x in Object.prototype);
}

/**
 * Le mode infini : records de 1 à `VAGUE_MAX_INFINI` par carte, paliers connus, sans doublon et dans l'ordre. Cohérence :
 * un palier payé suppose un record qui l'atteint.
 */
export function validerInfini(x: unknown): Resultat<Infini> {
  const base = avecCles(x, ['records', 'paliers'], 'meta.infini');
  if (!base.ok) return base;
  const brutsRecords = valeur(base.valeur, 'records');
  if (!estEnregistrement(brutsRecords)) return echec('meta.infini.records : objet attendu');
  const cartes = Object.keys(brutsRecords);
  if (cartes.length > CARTES_INFINI_MAX) return echec(`meta.infini.records : au plus ${String(CARTES_INFINI_MAX)} cartes`);
  const records: Record<string, number> = {};
  let meilleur = 0;
  for (const carte of cartes) {
    if (!estIdCarteBienForme(carte)) return echec(`meta.infini.records : carte invalide « ${carte} »`);
    const vague = valeur(brutsRecords, carte);
    if (!estEntierEntre(vague, 1, VAGUE_MAX_INFINI)) return echec(`meta.infini.records.${carte} : vague de 1 à ${String(VAGUE_MAX_INFINI)} attendue`);
    poser(records, carte, vague);
    meilleur = Math.max(meilleur, vague);
  }
  const brutsPaliers = valeur(base.valeur, 'paliers');
  if (!Array.isArray(brutsPaliers)) return echec('meta.infini.paliers : liste attendue');
  const paliers: Infini['paliers'] = [];
  for (const palier of brutsPaliers as unknown[]) {
    if (!estPalierInfini(palier)) return echec('meta.infini.paliers : palier inconnu');
    const dernier = paliers[paliers.length - 1];
    if (dernier !== undefined && palier <= dernier) return echec('meta.infini.paliers : paliers attendus dans l\'ordre croissant, sans doublon');
    if (palier > meilleur) return echec(`meta.infini.paliers : le palier ${String(palier)} est payé sans record qui l'atteigne`);
    paliers.push(palier);
  }
  return ok({ records, paliers });
}
