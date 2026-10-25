// Pourquoi un code d'import est refusé, en phrase pour le joueur. Le type `Record<RaisonImport, …>` oblige à
// traduire chaque raison : en ajouter une à la sauvegarde sans texte ne compile plus.
import { t, type CleTexte } from '../i18n';
import type { RaisonImport } from '../save';

export const CLES_IMPORT_REFUS: Readonly<Record<RaisonImport, CleTexte>> = {
  vide: 'import.refus.vide',
  trop_long: 'import.refus.trop_long',
  format: 'import.refus.format',
  somme: 'import.refus.somme',
  compression: 'import.refus.compression',
  donnees: 'import.refus.donnees',
  trop_recent: 'import.refus.trop_recent',
};

export function texteImportRefus(raison: RaisonImport): string {
  return t(CLES_IMPORT_REFUS[raison]);
}
