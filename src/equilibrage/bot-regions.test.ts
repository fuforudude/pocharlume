// Le bot soigneux et les ennemis des régions 2 à 5 : il sait que la caserne et l'artillerie ne touchent pas les volants (il
// n'en achète pas quand la menace est aérienne) et qu'il faut des Guetteurs des Toits (spécialisation A de la tour de tir)
// pour révéler les furtifs. Sur la région 1, qui n'a ni volants ni furtifs, son jeu ne change pas.
import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { niveauEssai } from '../engine/aides.test-utils';
import { avancer, creerPartie } from '../engine';
import type { Action, Niveau, Vague } from '../engine';
import { creerBotSoigneux } from './bot-soigneux';
import { partsSpeciales } from './geometrie';
import { configPartie } from './simulation';

function vagues(ennemi: string, nombre = 12, fois = 4): Vague[] {
  return Array.from({ length: fois }, () => ({ paquets: [{ ennemi, nombre, intervalle: 0.6, chemin: 0, delai: 0 }] }));
}

function actionsDuBot(niveau: Niveau, dieu: string, secondes: number): Action[] {
  const bot = creerBotSoigneux({ variante: { nom: 'équilibrée', poids: { caserne: 1, tir: 1, magie: 1, artillerie: 1 }, diversite: 0.4 } });
  const etat = creerPartie(niveau, configPartie({ graine: 7, difficulte: 'chaton', dieu }));
  while (etat.statut === 'en_cours' && etat.pas < secondes * 30) avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
  return etat.journal.map((e) => e.action);
}

describe('parts de menace des volants et des furtifs', () => {
  it('sont nulles sur la région 1, entières sur un niveau de seuls volants ou de seuls furtifs', () => {
    for (const c of REGION1) expect(partsSpeciales(c.niveau)).toEqual({ volants: 0, furtifs: 0 });
    expect(partsSpeciales(niveauEssai(vagues('corbeau_noir')))).toEqual({ volants: 1, furtifs: 0 });
    expect(partsSpeciales(niveauEssai(vagues('delateur')))).toEqual({ volants: 0, furtifs: 1 });
  });

  it('se mesurent en menace : un mélange donne la part de chacun', () => {
    const melange: Vague[] = [{ paquets: [
      { ennemi: 'corbeau_noir', nombre: 10, intervalle: 0.5, chemin: 0, delai: 0 },
      { ennemi: 'delateur', nombre: 10, intervalle: 0.5, chemin: 0, delai: 0 },
      { ennemi: 'paysan_affame', nombre: 10, intervalle: 0.5, chemin: 0, delai: 0 },
    ] }];
    const parts = partsSpeciales(niveauEssai(melange));
    expect(parts.volants).toBeGreaterThan(0.15);
    expect(parts.volants).toBeLessThan(0.5);
    expect(parts.furtifs).toBeGreaterThan(0.15);
    expect(parts.furtifs).toBeLessThan(0.5);
    expect(parts.volants + parts.furtifs).toBeLessThan(1);
  });
});

describe('bot soigneux face aux volants', () => {
  it.each(['charlie', 'pollen'])('%s : sur un niveau de corbeaux, il ne construit que des tours qui les touchent', (dieu) => {
    const actions = actionsDuBot(niveauEssai(vagues('corbeau_noir', 12, 6), 600), dieu, 200);
    const familles = actions.flatMap((a) => (a.type === 'construire' && a.tour !== 'divine' ? [a.tour] : []));
    expect(familles.length).toBeGreaterThan(2);
    for (const f of familles) expect(['tir', 'magie'], `${dieu} : ${f}`).toContain(f);
  });

  it('sur un niveau sans volants, il construit toujours de la caserne et de l’artillerie quand elles valent mieux', () => {
    const actions = actionsDuBot(niveauEssai(vagues('paysan_affame', 12, 6), 600), 'charlie', 200);
    const familles = new Set(actions.flatMap((a) => (a.type === 'construire' && a.tour !== 'divine' ? [a.tour] : [])));
    expect([...familles].some((f) => f === 'caserne' || f === 'artillerie')).toBe(true);
  });
});

describe('bot soigneux face aux furtifs', () => {
  it('construit une tour de tir et la spécialise en Guetteurs des Toits (voie A), pour révéler les furtifs', () => {
    const actions = actionsDuBot(niveauEssai(vagues('delateur', 12, 6), 900), 'charlie', 240);
    const tir = actions.findIndex((a) => a.type === 'construire' && a.tour === 'tir');
    const guetteurs = actions.findIndex((a) => a.type === 'specialiser' && a.voie === 'A');
    expect(tir).toBeGreaterThanOrEqual(0);
    expect(guetteurs).toBeGreaterThan(tir);
    const construit = actions[tir];
    const specialise = actions[guetteurs];
    expect(construit?.type === 'construire' && specialise?.type === 'specialiser' && construit.socle === specialise.socle).toBe(true);
  });

  it('sans furtifs, il ne se préoccupe pas des Guetteurs', () => {
    const actions = actionsDuBot(niveauEssai(vagues('paysan_affame', 12, 6), 900), 'charlie', 240);
    const premiere = actions.findIndex((a) => a.type === 'specialiser');
    // S'il spécialise, ce n'est pas avant d'avoir de quoi améliorer : la première action n'est jamais une tour de tir imposée.
    expect(premiere === -1 || premiere > 2).toBe(true);
  });
});
