// Briques communes aux validations strictes de la sauvegarde (validation.ts et validation-collection.ts) : un résultat
// typé, la lecture de propriétés propres seulement, les objets à clés exactes, les entiers bornés.

/** Un numéro de niveau de campagne en chiffres, de « 1 » à « 100 » (clé des tables par niveau). */
export const CLE_NIVEAU = /^(?:[1-9]\d?|1[0-4]\d|150)$/;

export type Resultat<T> = { readonly ok: true; readonly valeur: T } | { readonly ok: false; readonly raison: string };

export function ok<T>(valeur: T): Resultat<T> {
  return { ok: true, valeur };
}

export function echec<T>(raison: string): Resultat<T> {
  return { ok: false, raison };
}

export function estEnregistrement(x: unknown): x is Record<string, unknown> {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const proto = Object.getPrototypeOf(x) as unknown;
  return proto === Object.prototype || proto === null;
}

/** Un objet qui a exactement ces clés propres (ni plus ni moins). */
export function avecCles(x: unknown, cles: readonly string[], chemin: string): Resultat<Record<string, unknown>> {
  if (!estEnregistrement(x)) return echec(`${chemin} : objet attendu`);
  const presentes = Object.keys(x);
  for (const cle of presentes) if (!cles.includes(cle)) return echec(`${chemin} : clé inattendue « ${cle} »`);
  for (const cle of cles) if (!Object.hasOwn(x, cle)) return echec(`${chemin} : clé « ${cle} » manquante`);
  return ok(x);
}

export function estEntierEntre(x: unknown, min: number, max: number): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}

/** La propriété propre `cle` de `objet`, ou undefined (jamais une propriété héritée du prototype). */
export function valeur(objet: Record<string, unknown>, cle: string): unknown {
  return Object.hasOwn(objet, cle) ? objet[cle] : undefined;
}

/** Pose une valeur sous une clé quelconque comme propriété propre (jamais comme prototype, même pour `__proto__`). */
export function poser<T>(cible: Record<string, T>, cle: string, valeur: T): void {
  Object.defineProperty(cible, cle, { value: valeur, enumerable: true, writable: true, configurable: true });
}

/** `x` est l'un des éléments de `liste` (une liste d'identifiants connus). */
export function parmi<T extends string>(liste: readonly T[], x: unknown): x is T {
  return typeof x === 'string' && (liste as readonly string[]).includes(x);
}

/** Un objet dont les clés sont exactement `cles` et les valeurs des entiers de 0 à `max`. */
export function validerEntiersParCle<K extends string>(x: unknown, cles: readonly K[], max: number, chemin: string): Resultat<Record<K, number>> {
  const base = avecCles(x, cles, chemin);
  if (!base.ok) return base;
  const copie = {} as Record<K, number>;
  for (const cle of cles) {
    const v = valeur(base.valeur, cle);
    if (!estEntierEntre(v, 0, max)) return echec(`${chemin}.${cle} : entier de 0 à ${String(max)} attendu`);
    copie[cle] = v;
  }
  return ok(copie);
}
