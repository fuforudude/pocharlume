import { fr } from './fr';

export type CleTexte = keyof typeof fr;

// Vue indexée par chaîne : le contrôle à l'exécution couvre les appels qui échappent au typage.
const textes: Readonly<Record<string, string>> = fr;

/** Rend le texte d'une clé. Une clé absente de fr.ts est refusée par TypeScript. */
export function t(cle: CleTexte): string {
  const texte = textes[cle];
  if (texte === undefined) throw new Error(`Texte manquant : ${cle}`);
  return texte;
}
