import { describe, expect, it } from 'vitest';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import { CONFIG } from './aides.test-utils';
import type { Action } from './actions';
import { VERSION_ETAT, type ConfigPartie, type EntreeJournal, type EtatPartie } from './etat';
import { avancer, creerPartie, deserialiser, rejouer, serialiser, step } from './partie';
import { PAS_PAR_SECONDE } from './temps';

/** Une partie scénarisée qui touche à toutes les actions. */
const SCENARIO: readonly { pas: number; action: Action }[] = [
  { pas: 0, action: { type: 'construire', socle: 0, tour: 'caserne' } },
  { pas: 0, action: { type: 'construire', socle: 1, tour: 'tir' } },
  { pas: 5, action: { type: 'appelerVague' } },
  { pas: 30, action: { type: 'construire', socle: 2, tour: 'artillerie' } },
  { pas: 60, action: { type: 'deplacerHeros', x: 12, y: 8 } },
  { pas: 90, action: { type: 'construire', socle: 9, tour: 'tir' } },
  { pas: 400, action: { type: 'lancerSort', emplacement: 0, x: 12, y: 6 } },
  { pas: 450, action: { type: 'lancerSort', emplacement: 1, x: 14, y: 13 } },
  { pas: 600, action: { type: 'appelerVague' } },
  { pas: 700, action: { type: 'ameliorer', socle: 1 } },
  { pas: 800, action: { type: 'deplacerRalliement', socle: 0, x: 9, y: 4 } },
  { pas: 900, action: { type: 'construire', socle: 3, tour: 'divine' } },
  { pas: 1200, action: { type: 'appelerVague' } },
  { pas: 1500, action: { type: 'construire', socle: 4, tour: 'magie' } },
  { pas: 1800, action: { type: 'vendre', socle: 2 } },
  { pas: 1801, action: { type: 'construire', socle: 2, tour: 'caserne' } },
  { pas: 2400, action: { type: 'appelerVague' } },
];

function jouer(config: ConfigPartie, pasFinal: number): EtatPartie {
  const etat = creerPartie(NIVEAU_TEST, config);
  let i = 0;
  while (etat.pas < pasFinal && etat.statut === 'en_cours') {
    const actions: Action[] = [];
    while (i < SCENARIO.length && SCENARIO[i]?.pas === etat.pas) {
      const entree = SCENARIO[i];
      if (entree) actions.push(entree.action);
      i++;
    }
    avancer(etat, actions);
  }
  return etat;
}

describe('déterminisme et rejeu', () => {
  it('même graine et mêmes actions donnent le même état, octet pour octet', () => {
    const a = jouer(CONFIG, 3000);
    const b = jouer(CONFIG, 3000);
    expect(serialiser(a)).toBe(serialiser(b));
    expect(a.ennemis.length + a.tours.length).toBeGreaterThan(0);
  });

  it('une autre graine donne une autre partie', () => {
    expect(serialiser(jouer({ ...CONFIG, graine: 7 }, 1500))).not.toBe(serialiser(jouer(CONFIG, 1500)));
  });

  it('ne journalise que les actions acceptées, horodatées en pas', () => {
    const etat = jouer(CONFIG, 3000);
    expect(etat.journal.some((e) => e.action.type === 'construire' && e.action.socle === 9)).toBe(false);
    expect(etat.journal[0]).toEqual({ pas: 0, action: { type: 'construire', socle: 0, tour: 'caserne' } });
    expect(etat.journal.length).toBeGreaterThan(10);
  });

  it('rejouer(niveau, config, journal) redonne exactement le même état', () => {
    const etat = jouer(CONFIG, 3000);
    const rejoue = rejouer(NIVEAU_TEST, CONFIG, etat.journal, etat.pas);
    expect(serialiser(rejoue)).toBe(serialiser(etat));
  });

  it('rejoue jusqu’à la fin de la partie quand aucun pas final n’est donné', () => {
    const etat = rejouer(NIVEAU_TEST, CONFIG, []);
    expect(etat.statut).not.toBe('en_cours');
  });

  it('un état sérialisé puis relu continue à l’identique (reprise à la vague N)', () => {
    const original = jouer(CONFIG, 1300);
    const copie = deserialiser(serialiser(original));
    expect(copie).toEqual(original);
    for (let i = 0; i < 60 * PAS_PAR_SECONDE; i++) {
      step(original);
      step(copie);
    }
    expect(serialiser(copie)).toBe(serialiser(original));
  });

  it('refuse un état d’une autre version', () => {
    const texte = serialiser(creerPartie(NIVEAU_TEST, CONFIG)).replace(`"version":${String(VERSION_ETAT)},`, '"version":99,');
    expect(() => deserialiser(texte)).toThrow('version');
  });

  it('refuse un état de l’ancien format (version 2, sans indicateur de vie perdue)', () => {
    const texte = serialiser(creerPartie(NIVEAU_TEST, CONFIG)).replace(`"version":${String(VERSION_ETAT)},`, '"version":2,');
    expect(() => deserialiser(texte)).toThrow('version');
  });

  it('refuse de relire ou de rejouer une partie d’une autre version des données', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    etat.versionDonnees += 1;
    expect(() => deserialiser(serialiser(etat))).toThrow('version des données');
    const autre = { ...CONFIG, versionDonnees: CONFIG.versionDonnees + 1 };
    expect(() => rejouer(NIVEAU_TEST, autre, [])).toThrow('version des données');
  });

  it('rejoue sans lever d’exception un journal contenant des actions invalides', () => {
    const journal = [
      { pas: 0, action: { type: 'construire', socle: 0, tour: 'constructor' } },
      { pas: 1, action: { type: '__proto__' } },
      { pas: 2, action: null },
      { pas: 3, action: { type: 'lancerSort', emplacement: 'toString', x: 1, y: 4 } },
    ] as unknown as EntreeJournal[];
    const etat = rejouer(NIVEAU_TEST, CONFIG, journal, 100);
    expect(etat.journal).toEqual([]);
    expect(etat.pas).toBe(100);
  });
});
