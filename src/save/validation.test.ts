import { describe, expect, it } from 'vitest';
import { DIFFICULTES } from '../data/difficultes';
import { copie, PARTIE, sauvegardeRemplie, SUPPRIME, variante } from './aides.test-utils';
import { DIFFICULTES_SAUVEGARDE, metaParDefaut, moderneParDefaut, sauvegardeVide, VERSION_SAUVEGARDE } from './format';
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
    refusee(variante({ version: '4' }));
    refusee(variante({ version: 3 })); // une v3 se migre (migrations.ts) avant d'être validée
    refusee(variante({ version: 2 }));
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
    const meta = JSON.stringify(metaParDefaut());
    const moderne = JSON.stringify(moderneParDefaut());
    const reglages = `"reglages":{"son":1,"musique":1,"vitesse":1},"meta":${meta},"partie":null,"moderne":${moderne}`;
    const v = String(VERSION_SAUVEGARDE);
    const sain = `{"version":${v},"progression":{"niveauMax":3,"etoiles":{"1":{"matou":3}}},${reglages}}`;
    acceptee(JSON.parse(sain));
    const empoisonnees = [
      `{"version":${v},"__proto__":{"polluee":true},"progression":{"niveauMax":1,"etoiles":{}},${reglages}}`,
      `{"version":${v},"progression":{"niveauMax":3,"etoiles":{"__proto__":{"matou":3}}},${reglages}}`,
      `{"version":${v},"progression":{"niveauMax":3,"etoiles":{"1":{"__proto__":3,"matou":3}}},${reglages}}`,
      `{"version":${v},"progression":{"niveauMax":3,"etoiles":{"constructor":{"matou":3}}},${reglages}}`,
      `{"version":${v},"progression":{"niveauMax":3,"etoiles":{"1":{"constructor":3}}},${reglages}}`,
      `{"version":${v},"progression":{"niveauMax":3,"etoiles":{}},"reglages":{"son":1,"musique":1,"vitesse":1,"constructor":{"prototype":{"x":1}}},"meta":${meta},"partie":null,"moderne":${moderne}}`,
      `{"version":${v},"progression":{"niveauMax":3,"etoiles":{}},"reglages":{"son":1,"musique":1,"vitesse":1,"prototype":1},"meta":${meta},"partie":null,"moderne":${moderne}}`,
      sain.replace('"monnaies":{', '"monnaies":{"__proto__":{"polluee":true},'),
      sain.replace('"choix":{', '"choix":{"__proto__":{"polluee":true},'),
      sain.replace('"heros":{"plume"', '"heros":{"__proto__":{"xp":1,"competences":{}},"plume"'),
      sain.replace('"heros":{"plume":{"xp":0,"competences":{}}', '"heros":{"plume":{"xp":0,"competences":{"__proto__":2}}'),
      sain.replace('"heros":{"plume":{"xp":0,"competences":{}}', '"heros":{"plume":{"xp":0,"competences":{"constructor":2}}'),
      // Ce que la v4 ajoute : défis, collection, équipement, garanties.
      sain.replace('"defis":{}', '"defis":{"__proto__":{"fer":true}}'),
      sain.replace('"defis":{}', '"defis":{"constructor":{"fer":true}}'),
      sain.replace('"possedes":{}', '"possedes":{"__proto__":1}'),
      sain.replace('"possedes":{}', '"possedes":{"constructor":1}'),
      sain.replace('"equipes":{"skins":{}', '"equipes":{"skins":{"__proto__":"skin_tir_1"}'),
      sain.replace('"familiers":{}}', '"familiers":{"__proto__":"familier_rat"}}'),
      sain.replace('"garanties":{', '"garanties":{"__proto__":1,'),
      sain.replace('"collection":{', '"collection":{"__proto__":{"polluee":true},'),
    ];
    // Chaque remplacement a bien touché le texte (sinon le cas ne prouverait rien).
    for (const json of empoisonnees.slice(7)) expect(json).not.toBe(sain);
    for (const json of empoisonnees) refusee(JSON.parse(json));
    expect(Reflect.get({}, 'polluee')).toBeUndefined();
    expect(Reflect.get({}, 'matou')).toBeUndefined();
  });

  it('refuse un objet qui n’est pas un objet simple (instance de classe, tableau)', () => {
    class Faux {
      version = 3;
    }
    refusee(new Faux());
    refusee(variante({ reglages: [50, 50, 1] }));
    refusee(variante({ 'progression.etoiles': [{ matou: 3 }] }));
  });

  describe('progression', () => {
    // Sans étoile gagnée, l'arbre ne peut rien avoir coûté : on le remet à zéro avec elles.
    // Sans niveau réussi, aucun défi non plus ; la région ouverte est la première tant que le niveau 10 n'est pas gagné.
    const sansPartie = {
      partie: null,
      'progression.etoiles': {},
      'meta.arbre': { caserne: 0, tir: 0, magie: 0, artillerie: 0, sorts: 0, heros: 0 },
      'meta.defis': {},
      'meta.regionMax': 1,
    };

    it('niveau max : entier de 1 à 150', () => {
      for (const v of [0, -1, 151, 2.5, '3', null, Number.POSITIVE_INFINITY]) refusee(variante({ ...sansPartie, 'progression.niveauMax': v }));
      // La région ouverte suit : 1 jusqu'au niveau 10, 5 au niveau 50, 10 au niveau 99, 11 au niveau 101, 15 au niveau 150.
      for (const [niveauMax, region] of [[1, 1], [50, 5], [100, 10], [101, 11], [150, 15]] as const) acceptee(variante({ ...sansPartie, 'meta.regionMax': region, 'progression.niveauMax': niveauMax }));
    });

    it('clés de niveau : 1 à 150 en chiffres, sans zéro de tête ni signe ni décimale', () => {
      for (const cle of ['0', '151', '01', '-1', '1.5', 'a', '', ' 1', '1e1']) {
        refusee(variante({ ...sansPartie, 'meta.regionMax': 10, 'progression.niveauMax': 100, 'progression.etoiles': { [cle]: { matou: 1 } } }));
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
      refusee(variante({ ...sansPartie, 'meta.regionMax': 10, 'progression.niveauMax': 100, 'progression.etoiles': { '100': { matou: 3 } } }));
      acceptee(variante({ ...sansPartie, 'meta.regionMax': 11, 'progression.niveauMax': 101, 'progression.etoiles': { '100': { matou: 3 } } }));
      acceptee(variante({ ...sansPartie, 'meta.regionMax': 15, 'progression.niveauMax': 150, 'progression.etoiles': { '150': { matou: 3 } } }));
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
