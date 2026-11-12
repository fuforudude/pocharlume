// Les campagnes nommées (spec du DLC « Temps modernes », décision technique 1). Chaque niveau porte une campagne et un numéro dans
// cette campagne :
// - `histoire` : la campagne principale, niveaux 1 à 150 en 15 régions (constantes de meta.ts, inchangées) ; ses niveaux ne portent
//   pas le champ `campagne` (absent = histoire), si bien que leur état sérialisé et leurs journaux ne changent pas ;
// - `moderne` : le DLC « Temps modernes », ouvert à tous, niveaux 1 à 30 en 3 régions de 10 (la Fac, la Manif, la Préfecture).
// La sauvegarde garde une progression par campagne (src/save/moderne.ts).
import type { IdCampagne } from '../engine/definitions';
import { NIVEAUX_PAR_REGION } from './meta';

export type { IdCampagne };

export const IDS_CAMPAGNES = ['histoire', 'moderne'] as const satisfies readonly IdCampagne[];

export function estIdCampagne(x: unknown): x is IdCampagne {
  return typeof x === 'string' && (IDS_CAMPAGNES as readonly string[]).includes(x);
}

/** Régions du DLC : 1 la Fac, 2 la Manif, 3 la Préfecture. */
export const NOMBRE_REGIONS_MODERNE = 3;
/** Dernier niveau du DLC (le boss de la Préfecture). */
export const NIVEAU_MAX_MODERNE = NOMBRE_REGIONS_MODERNE * NIVEAUX_PAR_REGION;

/** Région d'un niveau du DLC (1 à 3), ou 0 pour un numéro qui n'en est pas un. */
export function regionDuNiveauModerne(niveau: number): number {
  return Number.isInteger(niveau) && niveau >= 1 && niveau <= NIVEAU_MAX_MODERNE ? Math.floor((niveau - 1) / NIVEAUX_PAR_REGION) + 1 : 0;
}

/** Plus haute région du DLC ouverte quand son plus haut niveau jouable est `niveauMax` (même règle que l'histoire : boss battu). */
export function regionOuverteModerne(niveauMax: number): number {
  return Math.min(NOMBRE_REGIONS_MODERNE, Math.max(1, regionDuNiveauModerne(niveauMax)));
}

/** La campagne d'un niveau : `histoire` quand il n'en porte pas. */
export function campagneDuNiveau(niveau: { readonly campagne?: IdCampagne }): IdCampagne {
  return niveau.campagne ?? 'histoire';
}

/** Vrai : toutes les tours sont ouvertes dès le premier niveau de cette campagne (le DLC, comme après le niveau 11 de l'histoire). */
export function toutEstOuvertDans(campagne: IdCampagne): boolean {
  return campagne === 'moderne';
}
