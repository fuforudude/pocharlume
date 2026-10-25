// Outils réservés aux tests de la sauvegarde (jamais importés par le jeu) : sauvegardes d'exemple, fixtures v1 et
// v2, définitions de héros d'essai, stockages truqués.
import { readFileSync } from 'node:fs';
import { IDS_HEROS } from '../data/meta';
import { VERSION_DONNEES } from '../data/version';
import type { ConfigPartie } from '../engine/etat';
import type { DefsMeta } from './definitions';
import { sauvegardeVide, type PartieEnCours, type Sauvegarde } from './format';
import type { Stockage } from './stockage';

export const FIXTURE_V1 = readFileSync(new URL('./fixtures/sauvegarde-v1.json', import.meta.url), 'utf8');
export const FIXTURE_V2 = readFileSync(new URL('./fixtures/sauvegarde-v2.json', import.meta.url), 'utf8');

/**
 * Définitions de héros d'essai (les vraies viennent de src/data/heros.ts) : 4 compétences par héros, les trois
 * premières dès le niveau 1, l'ultime au niveau 6 ; niveau 2 à 100 d'expérience, 3 à 250, 4 à 450, 5 à 700, 6 à 1000…
 */
export const DEFS_TEST: DefsMeta = {
  heros: Object.fromEntries(
    IDS_HEROS.map((h) => [
      h,
      {
        competences: [
          { id: `${h}_a`, rangMax: 3, niveauRequis: 1 },
          { id: `${h}_b`, rangMax: 3, niveauRequis: 1 },
          { id: `${h}_c`, rangMax: 3, niveauRequis: 1 },
          { id: `${h}_ultime`, rangMax: 3, niveauRequis: 6 },
        ],
      },
    ]),
  ),
  seuilsXp: [100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200],
};

export const CONFIG: ConfigPartie = { graine: 42, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 3, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

export const PARTIE: PartieEnCours = { niveau: 3, config: CONFIG, etat: '{"version":1}', vague: 2 };

/** Une sauvegarde bien remplie : 12 niveaux réussis dans plusieurs difficultés, réglages modifiés, partie en cours. */
export function sauvegardeRemplie(): Sauvegarde {
  const s = sauvegardeVide();
  const etoiles: Sauvegarde['progression']['etoiles'] = {};
  for (let n = 1; n <= 12; n++) {
    etoiles[String(n)] = { matou: ((n % 3) + 1) as 1 | 2 | 3, ...(n % 2 === 0 ? { chaton: 3 as const } : {}), ...(n % 5 === 0 ? { vieux_sage: 1 as const } : {}) };
  }
  return {
    ...s,
    progression: { niveauMax: 13, etoiles },
    reglages: { son: 35, musique: 0, vitesse: 2 },
    meta: {
      monnaies: { aretes: 345, braises: 42 },
      heros: {
        plume: { xp: 120, competences: {} },
        charlie: { xp: 500, competences: { charlie_a: 2, charlie_b: 1 } },
        pollen: { xp: 0, competences: {} },
        suie: { xp: 2000, competences: { suie_a: 3, suie_b: 2, suie_ultime: 1 } },
      },
      arbre: { caserne: 2, tir: 3, magie: 0, artillerie: 0, sorts: 1, heros: 0 },
      objets: { fiole_soufre: 3, herbe_sabbat: 0, griffe_renfort: 0, sablier: 5 },
      choix: { dieu: 'plume', heros: 'suie', objets: ['sablier', 'sablier', 'fiole_soufre'] },
    },
    partie: PARTIE,
  };
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
