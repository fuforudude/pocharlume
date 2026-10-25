import { fr } from './fr';

export type CleTexte = keyof typeof fr;

/** Valeurs insérées à la place des `{nom}` d'un texte. */
export type ParametresTexte = Readonly<Record<string, string | number>>;

// Vue indexée par chaîne : le contrôle à l'exécution couvre les appels qui échappent au typage.
const textes: Readonly<Record<string, string>> = fr;

const MARQUEUR = /\{(\w+)\}/g;

function interpoler(cle: string, texte: string, parametres: ParametresTexte): string {
  return texte.replace(MARQUEUR, (_, nom: string) => {
    const valeur = Object.hasOwn(parametres, nom) ? parametres[nom] : undefined;
    if (valeur === undefined) throw new Error(`Paramètre manquant : {${nom}} dans ${cle}`);
    return String(valeur);
  });
}

/**
 * Comme `t`, pour une clé qui vient des données (noms de tours, d'ennemis, de sorts : `nom` des tables de
 * src/data/). Les tests des données vérifient que ces clés existent ; ici une clé inconnue lève une erreur.
 */
export function tCle(cle: string, parametres: ParametresTexte = {}): string {
  const texte = Object.hasOwn(textes, cle) ? textes[cle] : undefined;
  if (texte === undefined) throw new Error(`Texte manquant : ${cle}`);
  return interpoler(cle, texte, parametres);
}

/**
 * Rend le texte d'une clé, en remplaçant chaque `{nom}` par la valeur du même nom dans `parametres`
 * (ex. `t('accueil.reprendre', { n: 7 })`). Une clé absente de fr.ts est refusée par TypeScript ; un
 * paramètre absent lève une erreur plutôt que d'afficher `{n}` au joueur.
 */
export function t(cle: CleTexte, parametres: ParametresTexte = {}): string {
  return tCle(cle, parametres);
}
