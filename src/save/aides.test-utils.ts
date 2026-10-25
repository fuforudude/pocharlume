// Outils réservés aux tests de la sauvegarde (jamais importés par le jeu) : sauvegardes d'exemple, fixture v1,
// stockages truqués.
import { readFileSync } from 'node:fs';
import { VERSION_DONNEES } from '../data/version';
import type { ConfigPartie } from '../engine/etat';
import { sauvegardeVide, type PartieEnCours, type Sauvegarde } from './format';
import type { Stockage } from './stockage';

export const FIXTURE_V1 = readFileSync(new URL('./fixtures/sauvegarde-v1.json', import.meta.url), 'utf8');

export const CONFIG: ConfigPartie = { graine: 42, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 3, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

export const PARTIE: PartieEnCours = { niveau: 3, config: CONFIG, etat: '{"version":1}', vague: 2 };

/** Une sauvegarde bien remplie : 12 niveaux réussis dans plusieurs difficultés, réglages modifiés, partie en cours. */
export function sauvegardeRemplie(): Sauvegarde {
  const s = sauvegardeVide();
  const etoiles: Sauvegarde['progression']['etoiles'] = {};
  for (let n = 1; n <= 12; n++) {
    etoiles[String(n)] = { matou: ((n % 3) + 1) as 1 | 2 | 3, ...(n % 2 === 0 ? { chaton: 3 as const } : {}), ...(n % 5 === 0 ? { vieux_sage: 1 as const } : {}) };
  }
  return { ...s, progression: { niveauMax: 13, etoiles }, reglages: { son: 35, musique: 0, vitesse: 2 }, partie: PARTIE };
}

/** Copie profonde en JSON, pour fabriquer des variantes invalides. */
export function copie(valeur: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(valeur)) as Record<string, unknown>;
}

export const SUPPRIME = Symbol('supprime');

/**
 * Variante de la sauvegarde remplie : chaque entrée `chemin: valeur` remplace la valeur à ce chemin
 * (`'partie.config.dieu': 'zeus'`), ou la retire si la valeur est `SUPPRIME`.
 */
export function variante(changements: Readonly<Record<string, unknown>>, base: unknown = sauvegardeRemplie()): Record<string, unknown> {
  const racine = copie(base);
  for (const [chemin, valeur] of Object.entries(changements)) {
    const cles = chemin.split('.');
    const derniere = cles.pop();
    let courant = racine;
    for (const cle of cles) courant = courant[cle] as Record<string, unknown>;
    if (derniere === undefined) continue;
    if (valeur === SUPPRIME) Reflect.deleteProperty(courant, derniere);
    else Object.defineProperty(courant, derniere, { value: valeur, enumerable: true, writable: true, configurable: true });
  }
  return racine;
}

/** Un stockage dont chaque opération peut être mise en panne. */
export class StockageTruque implements Stockage {
  readonly donnees = new Map<string, string>();
  panneLecture = false;
  panneEcriture = false;
  ecritures = 0;

  get(cle: string): Promise<string | null> {
    if (this.panneLecture) return Promise.reject(new Error('lecture impossible'));
    return Promise.resolve(this.donnees.get(cle) ?? null);
  }

  set(cle: string, valeur: string): Promise<void> {
    if (this.panneEcriture) return Promise.reject(new Error('écriture impossible'));
    this.ecritures++;
    this.donnees.set(cle, valeur);
    return Promise.resolve();
  }

  remove(cle: string): Promise<void> {
    if (this.panneEcriture) return Promise.reject(new Error('écriture impossible'));
    this.donnees.delete(cle);
    return Promise.resolve();
  }
}
