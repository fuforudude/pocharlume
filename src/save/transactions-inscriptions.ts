// Transactions des inscriptions de statues : trouver une inscription (la première fois seulement) et lire ce qui est trouvé. Des
// fonctions pures, comme celles de transactions.ts : une sauvegarde en entrée, une copie en sortie ou un refus sans rien changer.
//
// Une inscription ne coûte rien et ne rapporte rien d'autre que son texte dans le recueil : c'est de la méta, elle n'a aucun effet
// sur une partie. Une fois trouvée, elle l'est pour toujours ; la retrouver ne change rien (la sauvegarde rendue est la même).
import { estIdInscription, IDS_INSCRIPTIONS, type IdInscription } from '../data/niveaux/statues';
import type { Sauvegarde } from './format';

export type RaisonInscription = 'inscription_inconnue';

export type ResultatInscription =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly nouvelle: boolean }
  | { readonly ok: false; readonly raison: RaisonInscription };

/** L'inscription de cette carte est-elle trouvée ? */
export function inscriptionTrouvee(s: Sauvegarde, id: string): boolean {
  return estIdInscription(id) && s.meta.inscriptions.includes(id);
}

/** Nombre d'inscriptions trouvées (0 à 31). */
export function nombreInscriptionsTrouvees(s: Sauvegarde): number {
  return s.meta.inscriptions.length;
}

/**
 * Trouve l'inscription d'une statue. La première fois, elle entre dans la sauvegarde (`nouvelle` vaut vrai) ; ensuite la sauvegarde
 * rendue est la même et `nouvelle` vaut faux : relire ne gagne rien de plus. Un identifiant inconnu est refusé.
 */
export function trouverInscription(s: Sauvegarde, id: string): ResultatInscription {
  if (!estIdInscription(id)) return { ok: false, raison: 'inscription_inconnue' };
  if (s.meta.inscriptions.includes(id)) return { ok: true, sauvegarde: s, nouvelle: false };
  return { ok: true, sauvegarde: { ...s, meta: { ...s.meta, inscriptions: reunirInscriptions(s.meta.inscriptions, [id]) } }, nouvelle: true };
}

/** La réunion de deux listes d'inscriptions, sans doublon et dans l'ordre des cartes de la campagne (la forme de la sauvegarde). */
export function reunirInscriptions(a: readonly IdInscription[], b: readonly IdInscription[]): IdInscription[] {
  return IDS_INSCRIPTIONS.filter((id) => a.includes(id) || b.includes(id));
}
