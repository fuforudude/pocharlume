import { describe, expect, it } from 'vitest';
import { DIFFICULTES } from '../data/difficultes';
import { copie, PARTIE, sauvegardeRemplie, SUPPRIME, variante } from './aides.test-utils';
import { DIFFICULTES_SAUVEGARDE, sauvegardeVide, VERSION_SAUVEGARDE } from './format';
import { TAILLE_MAX_ETAT, validerSauvegarde } from './validation';

function refusee(x: unknown): string {
  const r = validerSauvegarde(x);
  if (r.ok) throw new Error(`la sauvegarde aurait dû être refusée : ${JSON.stringify(x).slice(0, 200)}`);
  return r.raison;
}

function acceptee(x: unknown): void {
  const r = validerSauvegarde(x);
  if (!r.ok) throw new Error(`la sauvegarde aurait dû être acceptée : ${r.raison}`);
}

describe('validation d’une sauvegarde', () => {
  it('accepte une sauvegarde vide et une sauvegarde remplie, et rend une copie égale', () => {
    for (const s of [sauvegardeVide(), sauvegardeRemplie()]) {
      const r = validerSauvegarde(copie(s));
      expect(r.ok && r.valeur).toEqual(s);
    }
  });

  it('les difficultés de la sauvegarde sont celles des données de jeu', () => {
    expect([...DIFFICULTES_SAUVEGARDE].sort()).toEqual(Object.keys(DIFFICULTES).sort());
  });

  it('refuse ce qui n’est pas un objet, et une mauvaise version', () => {
    for (const x of [null, undefined, 3, 'texte', [], true]) refusee(x);
    refusee(variante({ version: 1 }));
    refusee(variante({ version: VERSION_SAUVEGARDE + 1 }));
    refusee(variante({ version: '2' }));
  });

  it('refuse les clés manquantes et les clés en trop', () => {
    refusee(variante({ reglages: SUPPRIME }));
    refusee(variante({ partie: SUPPRIME }));
    refusee(variante({ extra: 1 }));
    refusee(variante({ 'progression.extra': 1 }));
    refusee(variante({ 'reglages.extra': 1 }));
    refusee(variante({ 'progression.niveauMax': SUPPRIME }));
  });

  it('refuse les clés héritées __proto__, constructor et prototype, sans polluer Object.prototype', () => {
    const reglages = '"reglages":{"son":1,"musique":1,"vitesse":1},"partie":null';
    const empoisonnees = [
      `{"version":2,"__proto__":{"polluee":true},"progression":{"niveauMax":1,"etoiles":{}},${reglages}}`,
      `{"version":2,"progression":{"niveauMax":3,"etoiles":{"__proto__":{"matou":3}}},${reglages}}`,
      `{"version":2,"progression":{"niveauMax":3,"etoiles":{"1":{"__proto__":3,"matou":3}}},${reglages}}`,
      `{"version":2,"progression":{"niveauMax":3,"etoiles":{"constructor":{"matou":3}}},${reglages}}`,
      `{"version":2,"progression":{"niveauMax":3,"etoiles":{"1":{"constructor":3}}},${reglages}}`,
      '{"version":2,"progression":{"niveauMax":3,"etoiles":{}},"reglages":{"son":1,"musique":1,"vitesse":1,"constructor":{"prototype":{"x":1}}},"partie":null}',
      '{"version":2,"progression":{"niveauMax":3,"etoiles":{}},"reglages":{"son":1,"musique":1,"vitesse":1,"prototype":1},"partie":null}',
    ];
    for (const json of empoisonnees) refusee(JSON.parse(json));
    expect(Reflect.get({}, 'polluee')).toBeUndefined();
    expect(Reflect.get({}, 'matou')).toBeUndefined();
  });

  it('refuse un objet qui n’est pas un objet simple (instance de classe, tableau)', () => {
    class Faux {
      version = 2;
    }
    refusee(new Faux());
    refusee(variante({ reglages: [50, 50, 1] }));
    refusee(variante({ 'progression.etoiles': [{ matou: 3 }] }));
  });

  describe('progression', () => {
    const sansPartie = { partie: null, 'progression.etoiles': {} };

    it('niveau max : entier de 1 à 100', () => {
      for (const v of [0, -1, 101, 2.5, '3', null, Number.POSITIVE_INFINITY]) refusee(variante({ ...sansPartie, 'progression.niveauMax': v }));
      for (const v of [1, 50, 100]) acceptee(variante({ ...sansPartie, 'progression.niveauMax': v }));
    });

    it('clés de niveau : 1 à 100 en chiffres, sans zéro de tête ni signe ni décimale', () => {
      for (const cle of ['0', '101', '01', '-1', '1.5', 'a', '', ' 1', '1e1']) {
        refusee(variante({ partie: null, 'progression.niveauMax': 100, 'progression.etoiles': { [cle]: { matou: 1 } } }));
      }
    });

    it('étoiles : 1 à 3 entières, difficulté connue, au moins une par niveau réussi', () => {
      for (const v of [0, 4, -1, 1.5, '3', null, true]) refusee(variante({ 'progression.etoiles.1': { matou: v } }));
      refusee(variante({ 'progression.etoiles.1': { legendaire: 3 } }));
      refusee(variante({ 'progression.etoiles.1': {} }));
      refusee(variante({ 'progression.etoiles.1': 3 }));
    });

    it('un niveau réussi doit avoir son suivant débloqué (sauf le dernier)', () => {
      refusee(variante({ ...sansPartie, 'progression.niveauMax': 3, 'progression.etoiles': { '3': { matou: 1 } } }));
      acceptee(variante({ ...sansPartie, 'progression.niveauMax': 4, 'progression.etoiles': { '3': { matou: 1 } } }));
      acceptee(variante({ ...sansPartie, 'progression.niveauMax': 100, 'progression.etoiles': { '100': { matou: 3 } } }));
    });
  });

  describe('réglages', () => {
    it('volumes : entiers de 0 à 100 ; vitesse : 1 ou 2', () => {
      for (const v of [-1, 101, 0.5, '50', null]) {
        refusee(variante({ 'reglages.son': v }));
        refusee(variante({ 'reglages.musique': v }));
      }
      for (const v of [0, 3, 1.5, '1', null]) refusee(variante({ 'reglages.vitesse': v }));
    });
  });

  describe('partie en cours', () => {
    it('accepte une partie correcte et refuse chaque champ hors bornes', () => {
      acceptee(variante({ partie: copie(PARTIE) }));
      refusee(variante({ 'partie.niveau': 0 }));
      refusee(variante({ 'partie.niveau': 101 }));
      refusee(variante({ 'partie.niveau': 14 })); // pas encore débloqué (niveau max 13)
      refusee(variante({ 'partie.vague': 0 }));
      refusee(variante({ 'partie.vague': 1001 }));
      refusee(variante({ 'partie.vague': 1.5 }));
      refusee(variante({ 'partie.etat': 3 }));
      refusee(variante({ 'partie.etat': '' }));
      refusee(variante({ 'partie.etat': 'pas du json' }));
      refusee(variante({ 'partie.etat': `{${'x'.repeat(TAILLE_MAX_ETAT)}` }));
      refusee(variante({ 'partie.extra': 1 }));
    });

    it('config : graine 32 bits, difficulté et dieu connus, niveau de héros de 1 à 10', () => {
      const mauvaises: [string, unknown][] = [
        ['graine', -1],
        ['graine', 2 ** 32],
        ['graine', 1.5],
        ['difficulte', 'facile'],
        ['difficulte', '__proto__'],
        ['difficulte', 'constructor'],
        ['dieu', 'zeus'],
        ['dieu', 'toString'],
        ['niveauHeros', 0],
        ['niveauHeros', 11],
        ['versionDonnees', 0],
        ['versionDonnees', '1'],
      ];
      for (const [cle, v] of mauvaises) refusee(variante({ [`partie.config.${cle}`]: v }));
      refusee(variante({ 'partie.config.dieu': SUPPRIME }));
      refusee(variante({ 'partie.config.extra': 1 }));
    });
  });

  it('n’altère pas l’objet reçu et n’en réutilise aucune partie', () => {
    const entree = copie(sauvegardeRemplie());
    const avant = JSON.stringify(entree);
    const r = validerSauvegarde(entree);
    expect(JSON.stringify(entree)).toBe(avant);
    if (!r.ok) throw new Error('refusée');
    expect(r.valeur.progression).not.toBe(entree.progression);
    expect(r.valeur.progression.etoiles).not.toBe((entree.progression as Record<string, unknown>).etoiles);
  });
});
