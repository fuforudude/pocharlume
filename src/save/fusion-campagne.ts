// Briques de fusion d'une progression de campagne, communes à l'histoire et au DLC (progression.ts, moderne.ts) : meilleures étoiles par
// niveau et par difficulté, défis réussis réunis, meilleur record par carte. Chacune dit si `b` a apporté quelque chose.
import { IDS_DEFIS } from '../data/meta';
import { DIFFICULTES_SAUVEGARDE, type DefisNiveau, type Etoiles, type EtoilesNiveau } from './format';

export interface Reunion<T> {
  readonly valeur: T;
  /** Vrai : `b` a apporté au moins une chose que `a` n'avait pas. */
  readonly change: boolean;
}

function poserPropre<T>(cible: Record<string, T>, cle: string, valeur: T): void {
  Object.defineProperty(cible, cle, { value: valeur, enumerable: true, writable: true, configurable: true });
}

/** Les meilleures étoiles de `a` et de `b`, par niveau et par difficulté. */
export function reunirEtoiles(a: Readonly<Record<string, EtoilesNiveau>>, b: Readonly<Record<string, EtoilesNiveau>>): Reunion<Record<string, EtoilesNiveau>> {
  let change = false;
  const etoiles = { ...a };
  for (const numero of Object.keys(b)) {
    const autres = b[numero];
    if (!autres) continue;
    const miennes = Object.hasOwn(etoiles, numero) ? etoiles[numero] : undefined;
    const reunies: EtoilesNiveau = { ...miennes };
    for (const difficulte of DIFFICULTES_SAUVEGARDE) {
      const avant = miennes?.[difficulte] ?? 0;
      const apres = autres[difficulte] ?? 0;
      if (apres > avant) {
        reunies[difficulte] = apres as Etoiles;
        change = true;
      }
    }
    poserPropre(etoiles, numero, reunies);
  }
  return { valeur: etoiles, change };
}

/** Les défis réussis de `a` et de `b` : un défi réussi ne se perd pas. */
export function reunirDefis(a: Readonly<Record<string, DefisNiveau>>, b: Readonly<Record<string, DefisNiveau>>): Reunion<Record<string, DefisNiveau>> {
  let change = false;
  const defis = { ...a };
  for (const numero of Object.keys(b)) {
    const miens = Object.hasOwn(defis, numero) ? defis[numero] : undefined;
    const autres = b[numero];
    if (!autres) continue;
    const reunis: DefisNiveau = { ...miens };
    for (const defi of IDS_DEFIS) {
      if (autres[defi] === true && miens?.[defi] !== true) {
        reunis[defi] = true;
        change = true;
      }
    }
    poserPropre(defis, numero, reunis);
  }
  return { valeur: defis, change };
}

/** Le meilleur record de chaque carte. */
export function reunirRecords(a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>): Reunion<Record<string, number>> {
  let change = false;
  const records = { ...a };
  for (const carte of Object.keys(b)) {
    const autre = b[carte] ?? 0;
    const mien = Object.hasOwn(records, carte) ? (records[carte] ?? 0) : 0;
    if (autre > mien) {
      poserPropre(records, carte, autre);
      change = true;
    }
  }
  return { valeur: records, change };
}
