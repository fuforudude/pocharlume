// Transactions de la caisse « Temps modernes » et des skins du DLC : ouverture payée en badges (garantie, doublons en éclats), skins
// portés aussi dans l'histoire. Mêmes règles que transactions-collection.ts.
import { describe, expect, it } from 'vitest';
import { ECLATS_DOUBLON, PLAFOND_MONNAIE } from '../data/meta';
import { PRIX_CAISSE_MODERNE, skinsCaisseModerne } from '../data/recompenses-moderne';
import { sourceConstante, sourceListe } from '../meta/aides.test-utils';
import { sauvegardeVide, type Sauvegarde } from './format';
import { equiperSkinModerne, ouvrirCaisseModerne } from './transactions-moderne';
import { validerSauvegarde } from './validation';

function avecBadges(badges: number, base: Sauvegarde = sauvegardeVide()): Sauvegarde {
  return { ...base, moderne: { ...base.moderne, badges } };
}

function valide(s: Sauvegarde): void {
  const r = validerSauvegarde(JSON.parse(JSON.stringify(s)));
  expect(r.ok ? 'ok' : r.raison).toBe('ok');
}

describe('ouvrir la caisse Temps modernes', () => {
  it('débite les badges, ajoute le skin tiré, fait avancer la garantie ; l’histoire ne bouge pas', () => {
    const avant = avecBadges(40);
    const r = ouvrirCaisseModerne(avant, sourceConstante(0));
    if (!r.ok) throw new Error(r.raison);
    const id = skinsCaisseModerne('commun')[0] ?? '';
    expect(r.tirage).toEqual({ id, rarete: 'commun', nouveau: true, eclats: 0, garantie: false, badges: PRIX_CAISSE_MODERNE });
    expect(r.sauvegarde.moderne.badges).toBe(40 - PRIX_CAISSE_MODERNE);
    expect(r.sauvegarde.moderne.collection.skinsTours).toEqual([id]);
    expect(r.sauvegarde.moderne.collection.garantie).toBe(1);
    expect(r.sauvegarde.meta.monnaies).toEqual(avant.meta.monnaies);
    expect(r.sauvegarde.meta.collection.possedes).toEqual(avant.meta.collection.possedes);
    valide(r.sauvegarde);
  });

  it('un skin de héros va dans `skinsHeros`, rangé dans l’ordre alphabétique', () => {
    let s = avecBadges(100);
    const r1 = ouvrirCaisseModerne(s, sourceListe([0.7, 0.99]));
    if (!r1.ok) throw new Error(r1.raison);
    s = r1.sauvegarde;
    const r2 = ouvrirCaisseModerne(s, sourceListe([0.7, 0]));
    if (!r2.ok) throw new Error(r2.raison);
    const rares = skinsCaisseModerne('rare');
    expect(r2.sauvegarde.moderne.collection.skinsHeros).toEqual([rares[0], rares[rares.length - 1]].sort());
    valide(r2.sauvegarde);
  });

  it('un doublon donne les éclats de sa rareté à la collection, plafonnés', () => {
    const premier = ouvrirCaisseModerne(avecBadges(100), sourceConstante(0));
    if (!premier.ok) throw new Error(premier.raison);
    const doublon = ouvrirCaisseModerne(premier.sauvegarde, sourceConstante(0));
    if (!doublon.ok) throw new Error(doublon.raison);
    expect(doublon.tirage.nouveau).toBe(false);
    expect(doublon.tirage.eclats).toBe(ECLATS_DOUBLON.commun);
    expect(doublon.sauvegarde.meta.collection.eclats).toBe(premier.sauvegarde.meta.collection.eclats + ECLATS_DOUBLON.commun);
    expect(doublon.sauvegarde.moderne.collection.skinsTours).toEqual(premier.sauvegarde.moderne.collection.skinsTours);

    const plein = { ...premier.sauvegarde, meta: { ...premier.sauvegarde.meta, collection: { ...premier.sauvegarde.meta.collection, eclats: PLAFOND_MONNAIE - 1 } } };
    const tronque = ouvrirCaisseModerne(plein, sourceConstante(0));
    expect(tronque.ok && tronque.tirage.eclats).toBe(1);
  });

  it('la dixième caisse sans Épique en donne un, et la garantie repart à zéro', () => {
    const s = avecBadges(100);
    const neuf = { ...s, moderne: { ...s.moderne, collection: { ...s.moderne.collection, garantie: 9 } } };
    const r = ouvrirCaisseModerne(neuf, sourceConstante(0));
    if (!r.ok) throw new Error(r.raison);
    expect(r.tirage.garantie).toBe(true);
    expect(['epique', 'legendaire', 'mythique']).toContain(r.tirage.rarete);
    expect(r.sauvegarde.moderne.collection.garantie).toBe(0);
  });

  it('refuse sans assez de badges, sans consommer de hasard ; les braises ne paient jamais', () => {
    let jets = 0;
    const alea = (): number => {
      jets++;
      return 0;
    };
    const riche = { ...avecBadges(PRIX_CAISSE_MODERNE - 1), meta: { ...sauvegardeVide().meta, monnaies: { aretes: 999, braises: 999 } } };
    expect(ouvrirCaisseModerne(riche, alea)).toEqual({ ok: false, raison: 'badges_insuffisants' });
    expect(jets).toBe(0);
  });
});

describe('porter un skin du DLC', () => {
  function avecSkins(): Sauvegarde {
    const s = sauvegardeVide();
    return { ...s, moderne: { ...s.moderne, collection: { ...s.moderne.collection, skinsTours: ['skin_moderne_divine_plume', 'skin_moderne_tir'], skinsHeros: ['skin_moderne_charlie', 'skin_moderne_mastoc'] } } };
  }

  it('sur sa tour, sa tour divine ou son héros recruté, puis le retire ; le skin de l’histoire et son bonus restent', () => {
    let s = avecSkins();
    s = { ...s, meta: { ...s.meta, collection: { ...s.meta.collection, possedes: { skin_tir_2: 1 }, equipes: { ...s.meta.collection.equipes, skins: { tir: 'skin_tir_2' } } } } };
    for (const [cible, skin] of [['tir', 'skin_moderne_tir'], ['divine_plume', 'skin_moderne_divine_plume'], ['charlie', 'skin_moderne_charlie']] as const) {
      const r = equiperSkinModerne(s, cible, skin);
      if (!r.ok) throw new Error(r.raison);
      s = r.sauvegarde;
    }
    expect(s.moderne.collection.equipes).toEqual({ tir: 'skin_moderne_tir', divine_plume: 'skin_moderne_divine_plume', charlie: 'skin_moderne_charlie' });
    expect(s.meta.collection.equipes.skins).toEqual({ tir: 'skin_tir_2' });
    valide(s);
    const retire = equiperSkinModerne(s, 'tir', null);
    expect(retire.ok && retire.sauvegarde.moderne.collection.equipes).toEqual({ divine_plume: 'skin_moderne_divine_plume', charlie: 'skin_moderne_charlie' });
    const rien = equiperSkinModerne(avecSkins(), 'magie', null);
    expect(rien.ok && rien.sauvegarde).toEqual(avecSkins());
  });

  it('refuse un skin inconnu, pas obtenu, mal placé, ou sur un héros pas recruté', () => {
    const s = avecSkins();
    expect(equiperSkinModerne(s, 'tir', 'skin_tir_2')).toEqual({ ok: false, raison: 'objet_inconnu' });
    expect(equiperSkinModerne(s, 'magie', 'skin_moderne_magie')).toEqual({ ok: false, raison: 'non_possede' });
    expect(equiperSkinModerne(s, 'caserne', 'skin_moderne_tir')).toEqual({ ok: false, raison: 'emplacement_invalide' });
    expect(equiperSkinModerne(s, 'mastoc', 'skin_moderne_mastoc')).toEqual({ ok: false, raison: 'heros_non_possede' });
    expect(equiperSkinModerne(s, '__proto__', null)).toEqual({ ok: true, sauvegarde: s });
  });
});
