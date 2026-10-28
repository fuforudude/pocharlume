import { describe, expect, it } from 'vitest';
import { IDS_FAMILIERS, IDS_SKINS } from '../data/collection';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, PRIX_CAISSE, PRIX_ECLATS_OBJET, RARETES } from '../data/meta';
import { sauvegardeVide, type Sauvegarde } from '../save';
import { formaterPourcent, spriteDeCollection, vueCaisses, vueObjetsCollection, vuePorteurs } from './collection-vues';

function avec(collection: Partial<Sauvegarde['meta']['collection']>, monnaies: Partial<Sauvegarde['meta']['monnaies']> = {}, heros: string[] = []): Sauvegarde {
  const s = sauvegardeVide();
  return {
    ...s,
    meta: {
      ...s.meta,
      monnaies: { ...s.meta.monnaies, ...monnaies },
      heros: { ...s.meta.heros, ...Object.fromEntries(heros.map((h) => [h, { xp: 0, competences: {} }])) },
      collection: { ...s.meta.collection, ...collection },
    },
  };
}

describe('vue des caisses', () => {
  it('deux caisses au prix du jeu, avec les chances affichées lues dans meta.ts', () => {
    const vues = vueCaisses(avec({}, { braises: 25 }));
    expect(vues.map((v) => v.type)).toEqual(['skins', 'familiers']);
    for (const v of vues) {
      expect(v.prix).toBe(PRIX_CAISSE);
      expect(v.chances.map((c) => [c.rarete, c.pourcent])).toEqual(RARETES.map((r) => [r, CHANCES_RARETE[r]]));
      expect(v.chances.reduce((somme, c) => somme + c.pourcent, 0)).toBe(100);
      expect(v.peutPayer).toBe(true);
    }
  });

  it('on ne peut pas payer avec moins de 20 braises', () => {
    expect(vueCaisses(avec({}, { braises: 19 })).every((v) => !v.peutPayer)).toBe(true);
    expect(vueCaisses(avec({}, { braises: 20 })).every((v) => v.peutPayer)).toBe(true);
  });

  it('la garantie restante se compte par type de caisse : 10 au départ, 1 quand le compteur est à 9', () => {
    const neuf = vueCaisses(avec({ garanties: { skins: 0, familiers: 9 } }));
    expect(neuf[0]?.avantGarantie).toBe(CAISSES_AVANT_GARANTIE);
    expect(neuf[1]?.avantGarantie).toBe(1);
    expect(vueCaisses(avec({ garanties: { skins: 4, familiers: 0 } }))[0]?.avantGarantie).toBe(6);
  });
});

describe('vue des objets de la collection', () => {
  it('montre tout le catalogue : 21 skins, 12 familiers, dans l’ordre du catalogue', () => {
    expect(vueObjetsCollection(avec({}), 'skin').map((v) => v.id)).toEqual([...IDS_SKINS]);
    expect(vueObjetsCollection(avec({}), 'familier').map((v) => v.id)).toEqual([...IDS_FAMILIERS]);
  });

  it('un objet pas possédé est une silhouette, avec le prix de son achat en éclats et son bonus au rang 1', () => {
    const [vue] = vueObjetsCollection(avec({ eclats: 100 }), 'skin');
    expect(vue).toMatchObject({ id: 'skin_caserne_1', possede: false, rang: 0, rarete: 'commun', stat: 'pvSoldats', bonusPourcent: 1 });
    expect(vue?.prixAchat).toBe(PRIX_ECLATS_OBJET.commun);
    expect(vue?.peutAcheter).toBe(true);
    expect(vue?.coutMonter).toBeNull();
  });

  it('pas assez d’éclats : l’achat est marqué impossible', () => {
    expect(vueObjetsCollection(avec({ eclats: 49 }), 'skin')[0]?.peutAcheter).toBe(false);
  });

  it('un objet possédé montre son rang, son bonus actuel, le coût du rang suivant, et ne s’achète plus', () => {
    const vues = vueObjetsCollection(avec({ possedes: { skin_tir_2: 3 }, eclats: 59 }), 'skin');
    const tir2 = vues.find((v) => v.id === 'skin_tir_2');
    // Rare : base 2 %, rang 3 : × 1,5 = 3 %. Rang 3 vers 4 : 60 éclats, il en manque un.
    expect(tir2).toMatchObject({ possede: true, rang: 3, rarete: 'rare', bonusPourcent: 3, coutMonter: 60, peutMonter: false, prixAchat: null, peutAcheter: false });
    expect(vueObjetsCollection(avec({ possedes: { skin_tir_2: 3 }, eclats: 60 }), 'skin').find((v) => v.id === 'skin_tir_2')?.peutMonter).toBe(true);
  });

  it('au rang maximal, plus de montée', () => {
    const vue = vueObjetsCollection(avec({ possedes: { familier_rat: 5 }, eclats: 9999 }), 'familier')[0];
    expect(vue).toMatchObject({ rang: 5, coutMonter: null, peutMonter: false });
    // Commun : 1 % × (1 + 0,25 × 4) = 2 %.
    expect(vue?.bonusPourcent).toBe(2);
  });

  it('dit sur quoi un skin est équipé, et quels porteurs conviennent', () => {
    const s = avec({ possedes: { skin_tir_1: 1, skin_suie: 1 }, equipes: { skins: { tir: 'skin_tir_1' }, familiers: {} } }, {}, ['suie']);
    const vues = vueObjetsCollection(s, 'skin');
    expect(vues.find((v) => v.id === 'skin_tir_1')).toMatchObject({ porteurs: ['tir'], equipeSur: ['tir'] });
    expect(vues.find((v) => v.id === 'skin_suie')).toMatchObject({ porteurs: ['suie'], equipeSur: [] });
  });

  it('un familier peut être porté par n’importe quel héros recruté, et par plusieurs', () => {
    const s = avec({ possedes: { familier_rat: 1 }, equipes: { skins: {}, familiers: { plume: 'familier_rat', suie: 'familier_rat' } } }, {}, ['suie']);
    const rat = vueObjetsCollection(s, 'familier')[0];
    expect(rat?.porteurs).toEqual(['plume', 'suie', 'charlie', 'pollen']);
    expect(rat?.equipeSur).toEqual(['plume', 'suie']);
  });
});

describe('vue des porteurs et du plafond de +10 %', () => {
  it('quatre tours de base puis les héros recrutés', () => {
    expect(vuePorteurs(avec({})).map((p) => p.id)).toEqual(['caserne', 'tir', 'magie', 'artillerie', 'plume', 'charlie', 'pollen']);
    expect(vuePorteurs(avec({}, {}, ['corbeau'])).map((p) => p.id)).toEqual(['caserne', 'tir', 'magie', 'artillerie', 'plume', 'corbeau', 'charlie', 'pollen']);
  });

  it('sans rien d’équipé, bonus à zéro et pas de plafond atteint', () => {
    for (const p of vuePorteurs(avec({}))) expect(p).toMatchObject({ skin: null, familier: null, totalPourcent: 0, plafonne: false });
  });

  it('additionne le skin et le familier d’un héros', () => {
    const s = avec({
      possedes: { skin_plume: 2, familier_chouette: 1 },
      equipes: { skins: { plume: 'skin_plume' }, familiers: { plume: 'familier_chouette' } },
    });
    // Skin Rare rang 2 : 2 % × 1,25 = 2,5 %. Familier Rare rang 1 : 1,5 %.
    expect(vuePorteurs(s).find((p) => p.id === 'plume')).toMatchObject({ skin: 'skin_plume', familier: 'familier_chouette', totalPourcent: 4, plafonne: false });
  });

  it('le total d’un porteur ne dépasse jamais le plafond, et le dit quand le brut le dépasse', () => {
    // Skin Mythique (5 %) rang 5 (× 2 = 10 %) + familier Mythique (4 %) rang 5 (8 %) : 18 % brut, 10 % servi.
    const s = avec({
      possedes: { skin_lanterne: 5, familier_salamandre: 5 },
      equipes: { skins: { lanterne: 'skin_lanterne' }, familiers: { lanterne: 'familier_salamandre' } },
    }, {}, ['lanterne']);
    const lanterne = vuePorteurs(s).find((p) => p.id === 'lanterne');
    expect(lanterne?.brutPourcent).toBe(18);
    // La réduction proportionnelle se fait en entiers vers le bas : 9,999 %, jamais plus de 10 %.
    expect(lanterne?.totalPourcent).toBeLessThanOrEqual(10);
    expect(lanterne?.totalPourcent).toBeCloseTo(10, 2);
    expect(lanterne?.plafonne).toBe(true);
  });

  it('un skin équipé mais qui n’est plus possédé ne compte pas', () => {
    const s = avec({ equipes: { skins: { tir: 'skin_tir_1' }, familiers: {} } });
    expect(vuePorteurs(s).find((p) => p.id === 'tir')).toMatchObject({ totalPourcent: 0, brutPourcent: 0 });
  });
});

describe('petits formats', () => {
  it('pourcentages à la française, sans zéros inutiles', () => {
    expect(formaterPourcent(1)).toBe('1');
    expect(formaterPourcent(1.5)).toBe('1,5');
    expect(formaterPourcent(2.5)).toBe('2,5');
    expect(formaterPourcent(1.25)).toBe('1,25');
    expect(formaterPourcent(0)).toBe('0');
    expect(formaterPourcent(10)).toBe('10');
    expect(formaterPourcent(9.999)).toBe('10');
  });

  it('nom du sprite de chaque objet du catalogue', () => {
    expect(spriteDeCollection('skin_tir_2')).toBe('icone-tir');
    expect(spriteDeCollection('skin_brise_os')).toBe('icone-portrait-brise-os');
    expect(spriteDeCollection('familier_papillon_nuit')).toBe('familier-papillon-nuit');
  });
});
