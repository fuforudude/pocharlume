// Validation de la méta-progression (sauvegarde v3) : bornes, ids connus, clés héritées, cohérence.
import { describe, expect, it } from 'vitest';
import { copie, DEFS_TEST, PARTIE, sauvegardeRemplie, SUPPRIME, variante } from './aides.test-utils';
import type { DefsMeta } from './definitions';
import { sauvegardeVide } from './format';
import { validerSauvegarde } from './validation';

function refusee(x: unknown, defs?: DefsMeta): string {
  const r = validerSauvegarde(x, defs);
  if (r.ok) throw new Error(`la sauvegarde aurait dû être refusée : ${JSON.stringify(x).slice(0, 300)}`);
  return r.raison;
}

function acceptee(x: unknown, defs?: DefsMeta): void {
  const r = validerSauvegarde(x, defs);
  if (!r.ok) throw new Error(`la sauvegarde aurait dû être acceptée : ${r.raison}`);
}

describe('méta-progression', () => {
  it('monnaies : entiers de 0 au plafond, les deux clés et rien d’autre', () => {
    for (const v of [-1, 100_000_000, 1.5, '10', null, Number.NaN]) {
      refusee(variante({ 'meta.monnaies.aretes': v }));
      refusee(variante({ 'meta.monnaies.braises': v }));
    }
    acceptee(variante({ 'meta.monnaies': { aretes: 99_999_999, braises: 0 } }));
    refusee(variante({ 'meta.monnaies.extra': 1 }));
    refusee(variante({ 'meta.monnaies.braises': SUPPRIME }));
    refusee(variante({ 'meta.monnaies': 12 }));
  });

  it('refuse une méta absente, en trop ou incomplète', () => {
    refusee(variante({ meta: SUPPRIME }));
    refusee(variante({ 'meta.extra': 1 }));
    for (const cle of ['monnaies', 'heros', 'arbre', 'objets', 'choix']) refusee(variante({ [`meta.${cle}`]: SUPPRIME }));
    refusee(variante({ meta: null }));
  });

  it('héros : ids connus, les trois avatars toujours possédés, expérience bornée', () => {
    refusee(variante({ 'meta.heros.zeus': { xp: 0, competences: {} } }));
    refusee(variante({ 'meta.heros.plume': SUPPRIME }));
    refusee(variante({ 'meta.heros.charlie': SUPPRIME }));
    refusee(variante({ 'meta.heros.pollen': SUPPRIME }));
    for (const xp of [-1, 1_000_001, 1.5, '5', null]) refusee(variante({ 'meta.heros.plume.xp': xp }));
    acceptee(variante({ 'meta.heros.plume.xp': 1_000_000 }));
    refusee(variante({ 'meta.heros.plume.extra': 1 }));
    refusee(variante({ 'meta.heros.plume.competences': SUPPRIME }));
    acceptee(variante({ 'meta.heros.mastoc': { xp: 0, competences: {} } }));
  });

  it('compétences : au plus 4, ids bien formés, rangs de 1 à 3', () => {
    for (const rang of [0, 4, -1, 1.5, '2', null]) refusee(variante({ 'meta.heros.plume.competences': { a: rang } }));
    refusee(variante({ 'meta.heros.plume.competences': { a: 1, b: 1, c: 1, d: 1, e: 1 } }));
    for (const id of ['', 'A', '1a', 'a b', 'a-b', 'constructor', 'toString', 'prototype', 'x'.repeat(33)]) {
      refusee(variante({ 'meta.heros.plume.competences': { [id]: 1 } }));
    }
    acceptee(variante({ 'meta.heros.plume.competences': { a: 3, b: 3, c: 3, d: 1 } }));
  });

  it('sans définitions, le plafond de points est celui du niveau maximal (10)', () => {
    acceptee(variante({ 'meta.heros.plume.competences': { a: 3, b: 3, c: 3, d: 1 } }));
    refusee(variante({ 'meta.heros.plume.competences': { a: 3, b: 3, c: 3, d: 3 } }));
  });

  it('arbre : toutes les branches, rangs de 0 à 5, jamais plus d’étoiles dépensées que gagnées', () => {
    for (const rang of [-1, 6, 1.5, '2', null]) refusee(variante({ 'meta.arbre.tir': rang }));
    refusee(variante({ 'meta.arbre.piege': 1 }));
    refusee(variante({ 'meta.arbre.tir': SUPPRIME }));
    // La sauvegarde remplie a 12 niveaux réussis : de quoi payer 15 + 10 + 3 étoiles.
    acceptee(variante({ 'meta.arbre': { caserne: 5, tir: 4, magie: 2, artillerie: 0, sorts: 0, heros: 0 } }));
    // Six branches au rang 5 coûtent 90 étoiles.
    refusee(variante({ 'meta.arbre': { caserne: 5, tir: 5, magie: 5, artillerie: 5, sorts: 5, heros: 5 } }));
    // Une sauvegarde vide n'a aucune étoile : le moindre rang est refusé.
    refusee(variante({ 'meta.arbre.tir': 1 }, sauvegardeVide()));
    acceptee(variante({ 'meta.arbre.tir': 0 }, sauvegardeVide()));
  });

  it('objets : les quatre stocks, de 0 à 10', () => {
    for (const n of [-1, 11, 1.5, '3', null]) refusee(variante({ 'meta.objets.sablier': n }));
    refusee(variante({ 'meta.objets.potion': 1 }));
    refusee(variante({ 'meta.objets.sablier': SUPPRIME }));
    acceptee(variante({ 'meta.objets.sablier': 10 }));
  });

  it('choix : un dieu connu, un de ses héros, trois objets connus au plus', () => {
    refusee(variante({ 'meta.choix.dieu': 'zeus' }));
    refusee(variante({ 'meta.choix.dieu': 'constructor' }));
    refusee(variante({ 'meta.choix.heros': 'charlie' })); // la sauvegarde remplie a choisi Plume : Charlie n'est pas son héros
    refusee(variante({ 'meta.choix.heros': 'inconnu' }));
    refusee(variante({ 'meta.choix.objets': ['sablier', 'sablier', 'sablier', 'sablier'] }));
    refusee(variante({ 'meta.choix.objets': ['potion'] }));
    refusee(variante({ 'meta.choix.objets': 'sablier' }));
    refusee(variante({ 'meta.choix.extra': 1 }));
    acceptee(variante({ 'meta.choix': { dieu: 'pollen', heros: 'lanterne', objets: [] } }));
  });
});

describe('méta-progression avec les définitions de héros', () => {
  it('accepte la sauvegarde remplie', () => {
    acceptee(copie(sauvegardeRemplie()), DEFS_TEST);
  });

  it('refuse plus de points placés que le niveau n’en donne', () => {
    // Charlie : 500 d'expérience = niveau 4 = 4 points.
    acceptee(variante({ 'meta.heros.charlie.competences': { charlie_a: 3, charlie_b: 1 } }), DEFS_TEST);
    refusee(variante({ 'meta.heros.charlie.competences': { charlie_a: 3, charlie_b: 2 } }), DEFS_TEST);
    // Pollen n'a pas d'expérience : niveau 1, un seul point.
    acceptee(variante({ 'meta.heros.pollen.competences': { pollen_a: 1 } }), DEFS_TEST);
    refusee(variante({ 'meta.heros.pollen.competences': { pollen_a: 1, pollen_b: 1 } }), DEFS_TEST);
  });

  it('refuse l’ultime avant le niveau 6', () => {
    refusee(variante({ 'meta.heros.charlie.competences': { charlie_ultime: 1 } }), DEFS_TEST); // niveau 4
    acceptee(variante({ 'meta.heros.suie.competences': { suie_ultime: 3 } }), DEFS_TEST); // niveau 8
  });

  it('refuse une compétence inconnue ou un rang au-dessus du maximum du jeu', () => {
    refusee(variante({ 'meta.heros.plume.competences': { vol: 1 } }), DEFS_TEST);
    const peuDeRangs: DefsMeta = {
      ...DEFS_TEST,
      heros: {
        ...DEFS_TEST.heros,
        suie: {
          competences: [
            { id: 'suie_a', rangMax: 2, niveauRequis: 1 },
            { id: 'suie_b', rangMax: 3, niveauRequis: 1 },
            { id: 'suie_ultime', rangMax: 3, niveauRequis: 6 },
          ],
        },
      },
    };
    refusee(copie(sauvegardeRemplie()), peuDeRangs); // suie_a est au rang 3
  });

  it('refuse un héros que les définitions ne connaissent pas', () => {
    const sansSuie: DefsMeta = { ...DEFS_TEST, heros: Object.fromEntries(Object.entries(DEFS_TEST.heros).filter(([id]) => id !== 'suie')) };
    refusee(copie(sauvegardeRemplie()), sansSuie);
  });
});

describe('config d’une partie en cours étendue (jalon 2)', () => {
  const etendue = { heros: 'charlie', competencesHeros: { charlie_a: 2 }, ameliorations: { caserne: 2, sorts: 1 }, objets: ['sablier', 'fiole_soufre'] };
  const avecConfig = (extra: Record<string, unknown>): Record<string, unknown> => variante({ 'partie.config': { ...copie(PARTIE.config), ...extra } });

  it('accepte les champs du jalon 2 et les garde dans la copie', () => {
    const r = validerSauvegarde(avecConfig(etendue));
    expect(r.ok && r.valeur.partie?.config).toEqual({ ...PARTIE.config, ...etendue });
  });

  it('refuse une config à moitié étendue ou aux valeurs piégées', () => {
    refusee(avecConfig({ heros: 'charlie' }));
    refusee(avecConfig({ ...etendue, heros: 'suie' })); // Suie n'est pas un héros de Charlie
    refusee(avecConfig({ ...etendue, heros: 'inconnu' }));
    refusee(avecConfig({ ...etendue, competencesHeros: { constructor: 1 } }));
    refusee(avecConfig({ ...etendue, competencesHeros: { charlie_a: 4 } }));
    refusee(avecConfig({ ...etendue, ameliorations: { pieges: 1 } }));
    refusee(avecConfig({ ...etendue, ameliorations: { caserne: 6 } }));
    refusee(avecConfig({ ...etendue, objets: ['sablier', 'sablier', 'sablier', 'sablier'] }));
    refusee(avecConfig({ ...etendue, objets: ['potion'] }));
    refusee(avecConfig({ ...etendue, extra: 1 }));
  });
});
