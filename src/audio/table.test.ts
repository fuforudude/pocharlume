import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../tools/sons/catalogue';
import { ENNEMIS } from '../data/ennemis';
import type { Evenement } from '../engine';
import { IDS_SONS, SON_DES_EVENEMENTS, SONS, sonDe, type VuePartie } from './table';

const RACINE = join(import.meta.dirname, '..', '..');
const DOSSIER_SONS = join(RACINE, 'public', 'sons');

/** Les types d'événements, lus dans la déclaration du moteur : un nouveau type sans entrée fait échouer le test. */
function typesEvenementsDuMoteur(): string[] {
  const source = readFileSync(join(RACINE, 'src', 'engine', 'evenements.ts'), 'utf8');
  return [...source.matchAll(/\{ type: '([a-z_]+)'/g)].map((m) => m[1] ?? '').filter((t) => t !== '');
}

const PARTIE: VuePartie = {
  tours: [
    { id: 1, famille: 'tir' },
    { id: 2, famille: 'magie' },
    { id: 3, famille: 'artillerie' },
    { id: 4, famille: 'caserne' },
  ],
  unites: [
    { id: 10, genre: 'heros' },
    { id: 11, genre: 'soldat' },
  ],
};

const tir = (tour: number): Evenement => ({ type: 'tir', tour, cible: 1, projectile: 1, x: 0, y: 0, critique: false });
const impact = (tour: number, zone: number): Evenement => ({ type: 'impact', projectile: 1, tour, x: 0, y: 0, zone });
const mort = (typeEnnemi: string): Evenement => ({ type: 'mort', ennemi: 1, typeEnnemi, x: 0, y: 0, prime: 0 });

describe('table événement vers son', () => {
  it("chaque type d'événement du moteur a une entrée, et rien d'autre", () => {
    const types = typesEvenementsDuMoteur();
    expect(types.length).toBeGreaterThan(30);
    expect(Object.keys(SON_DES_EVENEMENTS).sort()).toEqual([...new Set(types)].sort());
  });

  it('chaque son cité par la table existe dans SONS', () => {
    for (const regle of Object.values(SON_DES_EVENEMENTS)) {
      if (typeof regle === 'string') expect(IDS_SONS).toContain(regle);
    }
  });

  it("aucun son n'est oublié : chacun sert à un événement ou à l'interface", () => {
    const utilises = new Set<string>(['clic', 'refus', 'achat']);
    for (const regle of Object.values(SON_DES_EVENEMENTS)) if (typeof regle === 'string') utilises.add(regle);
    // Les sons choisis par une fonction : on les retrouve en jouant des événements types.
    const exemples: Evenement[] = [
      mort('paysan_affame'),
      tir(1),
      tir(3),
      impact(1, 0),
      impact(2, 0),
      impact(3, 1),
      { type: 'coup', unite: 10, ennemi: 1 },
      { type: 'coup', unite: 11, ennemi: 1 },
      { type: 'coup_ennemi', ennemi: 1, unite: 1, distance: false },
      { type: 'fin', statut: 'victoire', etoiles: 3 },
      { type: 'fin', statut: 'defaite', etoiles: 0 },
    ];
    for (const e of exemples) {
      const id = sonDe(e, PARTIE);
      if (id) utilises.add(id);
    }
    for (const [nom, def] of Object.entries(ENNEMIS)) {
      if (def.boss) utilises.add(sonDe(mort(nom)) ?? '');
    }
    expect([...IDS_SONS].filter((id) => !utilises.has(id))).toEqual([]);
  });

  it("choisit le son d'après la famille de la tour et le genre de l'unité", () => {
    expect(sonDe(tir(1), PARTIE)).toBe('tir_fleche');
    expect(sonDe(tir(3), PARTIE)).toBe('tir_carreau');
    expect(sonDe(tir(2), PARTIE)).toBeNull();
    expect(sonDe(impact(1, 0), PARTIE)).toBe('impact_physique');
    expect(sonDe(impact(2, 0), PARTIE)).toBe('impact_magique');
    expect(sonDe(impact(3, 1.5), PARTIE)).toBe('explosion');
    expect(sonDe(impact(99, 0), PARTIE)).toBe('impact_physique');
    expect(sonDe({ type: 'coup', unite: 10, ennemi: 1 }, PARTIE)).toBe('coup_epee');
    expect(sonDe({ type: 'coup', unite: 11, ennemi: 1 }, PARTIE)).toBe('coup_griffe');
    expect(sonDe({ type: 'coup', unite: 99, ennemi: 1 })).toBe('coup_griffe');
  });

  it("un boss meurt plus fort qu'un ennemi, un type inconnu compte comme un ennemi ordinaire", () => {
    const boss = Object.entries(ENNEMIS).find(([, def]) => def.boss)?.[0];
    expect(boss).toBeDefined();
    expect(sonDe(mort(boss ?? ''))).toBe('mort_boss');
    expect(sonDe(mort('paysan_affame'))).toBe('mort_ennemi');
    expect(sonDe(mort('inconnu'))).toBe('mort_ennemi');
    expect(sonDe(mort('constructor'))).toBe('mort_ennemi');
  });

  it('la fin de partie sonne victoire ou défaite, et rien en cours', () => {
    expect(sonDe({ type: 'fin', statut: 'victoire', etoiles: 2 })).toBe('victoire');
    expect(sonDe({ type: 'fin', statut: 'defaite', etoiles: 0 })).toBe('defaite');
    expect(sonDe({ type: 'fin', statut: 'en_cours', etoiles: 0 })).toBeNull();
  });

  it('les silences voulus restent silencieux', () => {
    expect(sonDe({ type: 'apparition', ennemi: 1, typeEnnemi: 'paysan_affame' })).toBeNull();
    expect(sonDe({ type: 'esquive', unite: 1, ennemi: 1 })).toBeNull();
  });

  it('les paramètres de chaque son sont dans des bornes sensées', () => {
    for (const id of IDS_SONS) {
      const def = SONS[id];
      expect(def.volume).toBeGreaterThan(0);
      expect(def.volume).toBeLessThanOrEqual(1);
      expect(def.hauteur).toBeGreaterThan(0.4);
      expect(def.hauteur).toBeLessThan(2);
      expect(def.variation).toBeGreaterThanOrEqual(0);
      expect(def.variation).toBeLessThan(0.2);
      expect(def.max).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('fichiers de public/sons', () => {
  it("chaque son de la table a son fichier, le catalogue le décrit, et il n'y a pas de fichier en trop", () => {
    expect(readdirSync(DOSSIER_SONS).sort()).toEqual([...IDS_SONS].map((id) => `${id}.ogg`).sort());
    expect(CATALOGUE.map((e) => e.nom).sort()).toEqual([...IDS_SONS].sort());
  });

  it("les fichiers sont de l'Ogg Vorbis et pèsent moins de 600 Ko en tout", () => {
    let total = 0;
    for (const f of readdirSync(DOSSIER_SONS)) {
      const octets = readFileSync(join(DOSSIER_SONS, f));
      expect(octets.subarray(0, 4).toString('latin1'), f).toBe('OggS');
      expect(octets.includes(Buffer.from('vorbis')), f).toBe(true);
      total += statSync(join(DOSSIER_SONS, f)).size;
    }
    expect(total).toBeLessThan(600 * 1024);
  });
});
