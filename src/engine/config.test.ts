// Validation de ConfigPartie : la config vient de l'interface, d'une sauvegarde ou d'un journal relu, donc
// elle n'est pas fiable. Une config refusée ne crée jamais de partie.
import { describe, expect, it } from 'vitest';
import { HEROS } from '../data/heros';
import { OBJETS } from '../data/objets';
import { VERSION_DONNEES } from '../data/version';
import { CONFIG, configDe, niveauEssai } from './aides.test-utils';
import { verifierConfig } from './config';
import type { ConfigPartie } from './etat';
import { creerPartie } from './partie';

/** Les ids des 4 compétences d'un héros, la dernière étant l'ultime. */
function competences(id: keyof typeof HEROS): string[] {
  return HEROS[id].competences.map((c) => c.id);
}

function refus(surcharges: Record<string, unknown>): string | null {
  return verifierConfig({ ...CONFIG, ...surcharges });
}

describe('verifierConfig : configs valides', () => {
  it('accepte la config de base de chaque dieu avec son avatar', () => {
    for (const dieu of ['plume', 'charlie', 'pollen']) expect(verifierConfig(configDe(dieu))).toBeNull();
  });

  it('accepte chaque disciple avec son dieu', () => {
    for (const [heros, dieu] of [['suie', 'plume'], ['corbeau', 'plume'], ['mastoc', 'charlie'], ['brise_os', 'charlie'], ['rouage', 'pollen'], ['lanterne', 'pollen']] as const) {
      expect(verifierConfig(configDe(dieu, { heros })), heros).toBeNull();
    }
  });

  it('accepte des compétences, des améliorations et trois objets', () => {
    const [a, b, c] = competences('charlie');
    expect(
      verifierConfig({
        ...CONFIG,
        niveauHeros: 8,
        competencesHeros: { [a ?? '']: 3, [b ?? '']: 2, [c ?? '']: 3 },
        ameliorations: { caserne: 5, tir: 1, sorts: 0 },
        objets: ['fiole_soufre', 'sablier', 'herbe_sabbat'],
      }),
    ).toBeNull();
  });

  it('accepte l’ultime à partir du niveau 6 seulement', () => {
    const ultime = competences('charlie')[3] ?? '';
    expect(refus({ niveauHeros: 5, competencesHeros: { [ultime]: 1 } })).toContain('niveau');
    expect(refus({ niveauHeros: 6, competencesHeros: { [ultime]: 1 } })).toBeNull();
  });
});

describe('verifierConfig : cas piégés', () => {
  const [a, b, c] = competences('charlie');
  const ultime = competences('charlie')[3] ?? '';

  it('refuse ce qui n’est pas une config', () => {
    for (const mauvaise of [null, undefined, 3, 'charlie', [], true]) expect(verifierConfig(mauvaise)).not.toBeNull();
  });

  it('refuse une ancienne config sans les nouveaux champs', () => {
    const ancienne = { graine: 1, difficulte: 'matou', dieu: 'charlie', niveauHeros: 1, versionDonnees: VERSION_DONNEES };
    expect(verifierConfig(ancienne)).toContain('Héros');
    for (const champ of ['heros', 'competencesHeros', 'ameliorations', 'objets'] as const) {
      const sans = Object.fromEntries(Object.entries(CONFIG).filter(([cle]) => cle !== champ));
      expect(verifierConfig(sans), champ).not.toBeNull();
    }
  });

  it('refuse un héros inconnu, ou un nom de la chaîne de prototypes', () => {
    for (const heros of ['zeus', 'constructor', '__proto__', 'toString', '', 3, null, undefined]) {
      expect(refus({ heros }), String(heros)).not.toBeNull();
    }
  });

  it('refuse un héros qui n’appartient pas au dieu', () => {
    expect(refus({ dieu: 'charlie', heros: 'plume' })).toContain('plume');
    expect(refus({ dieu: 'pollen', heros: 'mastoc' })).not.toBeNull();
  });

  it('refuse une graine ou un niveau de héros qui n’est pas un entier raisonnable', () => {
    for (const graine of [Number.NaN, Infinity, 1.5, '3', null]) expect(refus({ graine }), String(graine)).not.toBeNull();
    for (const niveauHeros of [0, 11, 2.5, Number.NaN, '3', -1]) expect(refus({ niveauHeros }), String(niveauHeros)).not.toBeNull();
  });

  it('refuse des compétences qui ne sont pas un objet simple', () => {
    for (const competencesHeros of [null, [], 'poigne_de_fer', 4, [1, 2]]) expect(refus({ competencesHeros }), String(competencesHeros)).not.toBeNull();
  });

  it('refuse une compétence inconnue, d’un autre héros, ou héritée des prototypes', () => {
    expect(refus({ competencesHeros: { inconnue: 1 } })).toContain('inconnue');
    expect(refus({ competencesHeros: { [competences('plume')[0] ?? '']: 1 } })).not.toBeNull();
    expect(refus({ competencesHeros: { constructor: 1 } })).not.toBeNull();
    const piege = JSON.parse('{"__proto__": 1}') as Record<string, number>;
    expect(refus({ competencesHeros: piege })).not.toBeNull();
  });

  it('refuse un rang hors de 0 à 3, ou qui n’est pas un entier', () => {
    for (const rang of [4, -1, 1.5, Number.NaN, Infinity, '2', null, undefined, true]) {
      expect(refus({ niveauHeros: 10, competencesHeros: { [a ?? '']: rang } }), String(rang)).not.toBeNull();
    }
    expect(refus({ niveauHeros: 10, competencesHeros: { [a ?? '']: 0 } })).toBeNull();
  });

  it('refuse plus de points de compétence que de niveaux', () => {
    expect(refus({ niveauHeros: 2, competencesHeros: { [a ?? '']: 2, [b ?? '']: 1 } })).toContain('points');
    expect(refus({ niveauHeros: 3, competencesHeros: { [a ?? '']: 2, [b ?? '']: 1 } })).toBeNull();
    expect(refus({ niveauHeros: 1, competencesHeros: { [a ?? '']: 1, [b ?? '']: 1 } })).not.toBeNull();
    expect(refus({ niveauHeros: 6, competencesHeros: { [a ?? '']: 3, [b ?? '']: 3, [c ?? '']: 1 } })).toContain('points');
    expect(refus({ niveauHeros: 7, competencesHeros: { [a ?? '']: 3, [b ?? '']: 3, [c ?? '']: 1 } })).toBeNull();
    expect(refus({ niveauHeros: 6, competencesHeros: { [ultime]: 1, [a ?? '']: 3, [b ?? '']: 3 } })).toContain('points');
  });

  it('refuse une branche inconnue ou un rang de l’arbre hors de 0 à 5', () => {
    for (const ameliorations of [null, [], 'tir', 3]) expect(refus({ ameliorations }), String(ameliorations)).not.toBeNull();
    expect(refus({ ameliorations: { feu: 1 } })).toContain('feu');
    expect(refus({ ameliorations: { constructor: 1 } })).not.toBeNull();
    expect(refus({ ameliorations: JSON.parse('{"__proto__": 1}') as Record<string, number> })).not.toBeNull();
    for (const rang of [6, -1, 0.5, Number.NaN, '1', null]) expect(refus({ ameliorations: { tir: rang } }), String(rang)).not.toBeNull();
    expect(refus({ ameliorations: { tir: 5, magie: 0 } })).toBeNull();
  });

  it('refuse des objets inconnus, en double, trop nombreux, ou qui ne sont pas des ids', () => {
    expect(refus({ objets: ['potion'] })).toContain('potion');
    expect(refus({ objets: ['sablier', 'sablier'] })).toContain('sablier');
    expect(refus({ objets: ['fiole_soufre', 'herbe_sabbat', 'griffe_renfort', 'sablier'] })).not.toBeNull();
    for (const objets of ['sablier', null, { 0: 'sablier' }, [3], [null], ['constructor'], ['__proto__']]) {
      expect(refus({ objets }), JSON.stringify(objets)).not.toBeNull();
    }
    expect(refus({ objets: Object.keys(OBJETS).slice(0, 3) })).toBeNull();
    expect(refus({ objets: [] })).toBeNull();
  });

  it('refuse une autre version des données', () => {
    expect(refus({ versionDonnees: VERSION_DONNEES + 1 })).toContain('version');
  });
});

describe('creerPartie et ConfigPartie', () => {
  it('lève l’erreur de verifierConfig, et ne crée rien', () => {
    const niveau = niveauEssai();
    expect(() => creerPartie(niveau, { ...CONFIG, heros: 'plume' })).toThrow('plume');
    expect(() => creerPartie(niveau, { ...CONFIG, objets: ['sablier', 'sablier'] })).toThrow('sablier');
    expect(() => creerPartie(niveau, { ...CONFIG, ameliorations: { feu: 1 } })).toThrow('feu');
  });

  it('range une copie de la config : la modifier ensuite ne change pas la partie', () => {
    const config: ConfigPartie = { ...CONFIG, objets: ['sablier'], ameliorations: { tir: 2 }, niveauHeros: 3, competencesHeros: { [competences('charlie')[0] ?? '']: 1 } };
    const etat = creerPartie(niveauEssai(), config);
    config.objets.push('fiole_soufre');
    config.ameliorations.tir = 5;
    config.competencesHeros.poigne_de_fer = 3;
    expect(etat.config.objets).toEqual(['sablier']);
    expect(etat.config.ameliorations).toEqual({ tir: 2 });
    expect(etat.config.competencesHeros).toEqual({ poigne_de_fer: 1 });
  });

  it('ignore les champs en trop de la config', () => {
    const etat = creerPartie(niveauEssai(), { ...CONFIG, espion: 'x' } as ConfigPartie);
    expect(Object.hasOwn(etat.config, 'espion')).toBe(false);
  });
});
