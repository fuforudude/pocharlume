// Transactions de la collection : ouvrir une caisse, monter un rang, acheter un objet précis, équiper et déséquiper.
import { describe, expect, it } from 'vitest';
import { CATALOGUE, IDS_FAMILIERS, IDS_SKINS, objetsDeCaisse, type IdCollection } from '../data/collection';
import {
  CAISSES_AVANT_GARANTIE,
  ECLATS_DOUBLON,
  PLAFOND_MONNAIE,
  PRIX_CAISSE,
  PRIX_ECLATS_OBJET,
  RANG_MAX_COLLECTION,
  RARETES,
  TYPES_CAISSE,
  coutRangEclats,
  type Rarete,
} from '../data/meta';
import { sourceConstante, sourceGraine, sourceListe } from '../meta/aides.test-utils';
import { collectionVide, type Collection } from '../meta/collection';
import { sauvegardeVide, type Sauvegarde } from './format';
import { acheterObjetPrecis, equiperFamilier, equiperSkin, monterRang, ouvrirCaisse } from './transactions-collection';
import { validerSauvegarde } from './validation';

/** Un joueur avec ces braises, ces éclats, cette collection. */
function joueur(options: { braises?: number; eclats?: number; collection?: Partial<Collection> } = {}): Sauvegarde {
  const s = sauvegardeVide();
  return {
    ...s,
    meta: {
      ...s.meta,
      monnaies: { aretes: 0, braises: options.braises ?? 0 },
      collection: { ...collectionVide(), ...options.collection, eclats: options.eclats ?? options.collection?.eclats ?? 0 },
    },
  };
}

function valide(s: Sauvegarde): void {
  const r = validerSauvegarde(JSON.parse(JSON.stringify(s)));
  if (!r.ok) throw new Error(`sauvegarde invalide : ${r.raison}`);
}

/** Les jets qui donnent, dans l'ordre, la rareté (0 : Commun … 0,995 : Mythique) puis le premier objet de la rareté. */
const JET_RARETE: Record<Rarete, number> = { commun: 0, rare: 0.7, epique: 0.9, legendaire: 0.96, mythique: 0.995 };
const jets = (rarete: Rarete): number[] => [JET_RARETE[rarete], 0];

describe('ouvrirCaisse', () => {
  for (const type of TYPES_CAISSE) {
    describe(`caisse de ${type}`, () => {
      it('débite 20 braises, ajoute l’objet tiré au rang 1 et avance le compteur de garantie de ce type seulement', () => {
        const s = joueur({ braises: 50 });
        const r = ouvrirCaisse(s, type, sourceListe(jets('commun')));
        if (!r.ok) throw new Error(r.raison);
        const attendu = objetsDeCaisse(type, 'commun')[0];
        if (!attendu) throw new Error('aucun commun');
        expect(r.sauvegarde.meta.monnaies.braises).toBe(50 - PRIX_CAISSE);
        expect(r.sauvegarde.meta.collection.possedes).toEqual({ [attendu]: 1 });
        expect(r.sauvegarde.meta.collection.garanties[type]).toBe(1);
        expect(r.sauvegarde.meta.collection.garanties[type === 'skins' ? 'familiers' : 'skins']).toBe(0);
        expect(r.sauvegarde.meta.collection.eclats).toBe(0);
        expect(r.tirage).toEqual({ id: attendu, rarete: 'commun', nouveau: true, eclats: 0, garantie: false, braises: PRIX_CAISSE });
        valide(r.sauvegarde);
      });

      it('un doublon donne les éclats de sa rareté (5 / 10 / 25 / 60 / 150) et garde son rang', () => {
        for (const rarete of RARETES) {
          const id = objetsDeCaisse(type, rarete)[0];
          if (!id) throw new Error(`aucun ${rarete}`);
          const s = joueur({ braises: 20, eclats: 7, collection: { possedes: { [id]: 3 } } });
          const r = ouvrirCaisse(s, type, sourceListe(jets(rarete)));
          if (!r.ok) throw new Error(r.raison);
          expect(r.tirage).toMatchObject({ id, rarete, nouveau: false, eclats: ECLATS_DOUBLON[rarete] });
          expect(r.sauvegarde.meta.collection.eclats, rarete).toBe(7 + ECLATS_DOUBLON[rarete]);
          expect(r.sauvegarde.meta.collection.possedes, rarete).toEqual({ [id]: 3 });
          expect(r.sauvegarde.meta.monnaies.braises).toBe(0);
          valide(r.sauvegarde);
        }
      });

      it('le compteur repart à zéro après un Épique, un Légendaire ou un Mythique naturels, et avance sinon', () => {
        const ancien = joueur({ braises: 200, collection: { garanties: { skins: 6, familiers: 6 } } });
        for (const rarete of ['epique', 'legendaire', 'mythique'] as const) {
          const r = ouvrirCaisse(ancien, type, sourceListe(jets(rarete)));
          if (!r.ok) throw new Error(r.raison);
          expect(r.sauvegarde.meta.collection.garanties[type], rarete).toBe(0);
          expect(r.tirage.garantie).toBe(false);
        }
        for (const rarete of ['commun', 'rare'] as const) {
          const r = ouvrirCaisse(ancien, type, sourceListe(jets(rarete)));
          if (!r.ok) throw new Error(r.raison);
          expect(r.sauvegarde.meta.collection.garanties[type], rarete).toBe(7);
        }
      });

      it(`la caisse numéro ${String(CAISSES_AVANT_GARANTIE)} sans Épique ni mieux en donne un, même avec des jets qui donneraient Commun`, () => {
        let s = joueur({ braises: PRIX_CAISSE * CAISSES_AVANT_GARANTIE });
        const vues: Rarete[] = [];
        for (let i = 0; i < CAISSES_AVANT_GARANTIE; i++) {
          const r = ouvrirCaisse(s, type, sourceConstante(0));
          if (!r.ok) throw new Error(`caisse ${String(i + 1)} : ${r.raison}`);
          vues.push(r.tirage.rarete);
          s = r.sauvegarde;
        }
        expect(vues.slice(0, CAISSES_AVANT_GARANTIE - 1).every((r) => r === 'commun')).toBe(true);
        expect(vues[CAISSES_AVANT_GARANTIE - 1]).toBe('epique');
        expect(s.meta.collection.garanties[type]).toBe(0);
        expect(s.meta.monnaies.braises).toBe(0);
        valide(s);
      });

      it('le tirage garanti est signalé, et le compteur de l’autre caisse reste intact', () => {
        const s = joueur({ braises: 20, collection: { garanties: type === 'skins' ? { skins: 9, familiers: 4 } : { skins: 4, familiers: 9 } } });
        const r = ouvrirCaisse(s, type, sourceConstante(0));
        if (!r.ok) throw new Error(r.raison);
        expect(r.tirage.garantie).toBe(true);
        expect(r.sauvegarde.meta.collection.garanties[type]).toBe(0);
        expect(r.sauvegarde.meta.collection.garanties[type === 'skins' ? 'familiers' : 'skins']).toBe(4);
      });

      it('moins de 20 braises : refus, rien débité, et le hasard n’est pas consommé', () => {
        for (const braises of [0, 19]) {
          const s = joueur({ braises });
          const avant = structuredClone(s);
          expect(ouvrirCaisse(s, type, sourceListe([]))).toEqual({ ok: false, raison: 'braises_insuffisantes' });
          expect(s).toEqual(avant);
        }
        expect(ouvrirCaisse(joueur({ braises: 20 }), type, sourceListe(jets('commun'))).ok).toBe(true);
      });

      it('ne donne que des objets de cette caisse', () => {
        let s = joueur({ braises: PRIX_CAISSE * 300 });
        const alea = sourceGraine(2026);
        const permis = new Set<IdCollection>(RARETES.flatMap((rarete) => objetsDeCaisse(type, rarete)));
        for (let i = 0; i < 300; i++) {
          const r = ouvrirCaisse(s, type, alea);
          if (!r.ok) throw new Error(r.raison);
          expect(permis.has(r.tirage.id)).toBe(true);
          s = r.sauvegarde;
        }
        valide(s);
        expect(Object.keys(s.meta.collection.possedes).length).toBeGreaterThan(5);
      });
    });
  }

  it('refuse un type de caisse inconnu, avant toute dépense', () => {
    const s = joueur({ braises: 100 });
    for (const type of ['autre', '', 'constructor', '__proto__', 'Skins']) {
      expect(ouvrirCaisse(s, type, sourceListe([])), type).toEqual({ ok: false, raison: 'type_inconnu' });
    }
  });

  it('ne modifie pas la sauvegarde reçue', () => {
    const s = joueur({ braises: 40, collection: { possedes: { skin_caserne_1: 1 } } });
    const avant = structuredClone(s);
    ouvrirCaisse(s, 'skins', sourceListe(jets('commun')));
    expect(s).toEqual(avant);
  });

  it('un gain d’éclats ne dépasse pas le plafond des monnaies, et le résultat dit ce qui a vraiment été gagné', () => {
    const id = objetsDeCaisse('familiers', 'mythique')[0];
    if (!id) throw new Error('aucun mythique');
    const s = joueur({ braises: 20, eclats: PLAFOND_MONNAIE - 10, collection: { possedes: { [id]: 1 } } });
    const r = ouvrirCaisse(s, 'familiers', sourceListe(jets('mythique')));
    if (!r.ok) throw new Error(r.raison);
    expect(r.sauvegarde.meta.collection.eclats).toBe(PLAFOND_MONNAIE);
    expect(r.tirage.eclats).toBe(10);
  });

  it('les braises sont plafonnées par le format : jamais de braises négatives', () => {
    const r = ouvrirCaisse(joueur({ braises: 20 }), 'skins', sourceListe(jets('rare')));
    expect(r.ok && r.sauvegarde.meta.monnaies.braises).toBe(0);
  });
});

describe('monterRang', () => {
  const id = 'skin_tir_1';
  const avecRang = (rang: number, eclats: number): Sauvegarde => joueur({ eclats, collection: { possedes: { [id]: rang } } });

  it('passer du rang r au rang r + 1 coûte 20 × r éclats', () => {
    for (let rang = 1; rang < RANG_MAX_COLLECTION; rang++) {
      const r = monterRang(avecRang(rang, 1000), id);
      if (!r.ok) throw new Error(r.raison);
      expect(r.sauvegarde.meta.collection.possedes[id], `rang ${String(rang)}`).toBe(rang + 1);
      expect(r.sauvegarde.meta.collection.eclats).toBe(1000 - 20 * rang);
      expect(coutRangEclats(rang)).toBe(20 * rang);
      valide(r.sauvegarde);
    }
  });

  it('monter de 1 à 5 d’un coup coûte 20 + 40 + 60 + 80 = 200 éclats', () => {
    let s = avecRang(1, 200);
    for (let i = 0; i < RANG_MAX_COLLECTION - 1; i++) {
      const r = monterRang(s, id);
      if (!r.ok) throw new Error(r.raison);
      s = r.sauvegarde;
    }
    expect(s.meta.collection.possedes[id]).toBe(5);
    expect(s.meta.collection.eclats).toBe(0);
  });

  it('exactement le prix suffit ; un éclat de moins : refus, rien ne change', () => {
    expect(monterRang(avecRang(3, 60), id).ok).toBe(true);
    const s = avecRang(3, 59);
    const avant = structuredClone(s);
    expect(monterRang(s, id)).toEqual({ ok: false, raison: 'eclats_insuffisants' });
    expect(s).toEqual(avant);
  });

  it('refuse au rang maximal, même avec beaucoup d’éclats', () => {
    expect(monterRang(avecRang(RANG_MAX_COLLECTION, 99_999), id)).toEqual({ ok: false, raison: 'rang_max' });
  });

  it('refuse un objet qu’on n’a pas ou qui n’existe pas', () => {
    const s = joueur({ eclats: 9999 });
    expect(monterRang(s, id)).toEqual({ ok: false, raison: 'non_possede' });
    for (const inconnu of ['skin_dragon', '', 'constructor', '__proto__', 'familier_rat ']) {
      expect(monterRang(s, inconnu), inconnu).toEqual({ ok: false, raison: 'objet_inconnu' });
    }
    expect(monterRang(s, 3 as unknown as string)).toEqual({ ok: false, raison: 'objet_inconnu' });
  });

  it('marche pour un familier comme pour un skin', () => {
    const s = joueur({ eclats: 20, collection: { possedes: { familier_rat: 1 } } });
    const r = monterRang(s, 'familier_rat');
    expect(r.ok && r.sauvegarde.meta.collection.possedes.familier_rat).toBe(2);
  });
});

describe('acheterObjetPrecis', () => {
  it('coûte 50 / 120 / 300 / 700 / 1500 éclats selon la rareté, et l’objet arrive au rang 1', () => {
    expect(RARETES.map((r) => PRIX_ECLATS_OBJET[r])).toEqual([50, 120, 300, 700, 1500]);
    for (const rarete of RARETES) {
      for (const type of TYPES_CAISSE) {
        const cible = objetsDeCaisse(type, rarete)[0];
        if (!cible) throw new Error(`aucun ${rarete}`);
        const prix = PRIX_ECLATS_OBJET[rarete];
        const r = acheterObjetPrecis(joueur({ eclats: prix + 11 }), cible);
        if (!r.ok) throw new Error(r.raison);
        expect(r.sauvegarde.meta.collection.eclats, cible).toBe(11);
        expect(r.sauvegarde.meta.collection.possedes).toEqual({ [cible]: 1 });
        valide(r.sauvegarde);
      }
    }
  });

  it('un éclat de moins que le prix : refus, rien ne change', () => {
    for (const rarete of RARETES) {
      const cible = objetsDeCaisse('skins', rarete)[0];
      if (!cible) throw new Error(`aucun ${rarete}`);
      const s = joueur({ eclats: PRIX_ECLATS_OBJET[rarete] - 1 });
      const avant = structuredClone(s);
      expect(acheterObjetPrecis(s, cible), rarete).toEqual({ ok: false, raison: 'eclats_insuffisants' });
      expect(s).toEqual(avant);
    }
  });

  it('ne s’achète pas deux fois, et ne touche pas aux braises ni au compteur de garantie', () => {
    const s = joueur({ eclats: 500, braises: 33, collection: { possedes: { skin_tir_1: 2 }, garanties: { skins: 5, familiers: 2 } } });
    expect(acheterObjetPrecis(s, 'skin_tir_1')).toEqual({ ok: false, raison: 'deja_possede' });
    const r = acheterObjetPrecis(s, 'skin_tir_2');
    if (!r.ok) throw new Error(r.raison);
    expect(r.sauvegarde.meta.monnaies.braises).toBe(33);
    expect(r.sauvegarde.meta.collection.garanties).toEqual({ skins: 5, familiers: 2 });
    expect(r.sauvegarde.meta.collection.possedes).toEqual({ skin_tir_1: 2, skin_tir_2: 1 });
  });

  it('refuse un objet inconnu', () => {
    for (const inconnu of ['skin_dragon', '', 'constructor', '__proto__']) {
      expect(acheterObjetPrecis(joueur({ eclats: 9999 }), inconnu), inconnu).toEqual({ ok: false, raison: 'objet_inconnu' });
    }
  });

  it('les 33 objets du catalogue ont un prix et peuvent tous s’acheter', () => {
    let s = joueur({ eclats: 50_000_000 });
    for (const id of [...IDS_SKINS, ...IDS_FAMILIERS]) {
      const r = acheterObjetPrecis(s, id);
      if (!r.ok) throw new Error(`${id} : ${r.raison}`);
      expect(s.meta.collection.eclats - r.sauvegarde.meta.collection.eclats).toBe(PRIX_ECLATS_OBJET[CATALOGUE[id].rarete]);
      s = r.sauvegarde;
    }
    expect(Object.keys(s.meta.collection.possedes)).toHaveLength(33);
    valide(s);
  });
});

describe('équiper et déséquiper', () => {
  const base = (): Sauvegarde => joueur({ collection: { possedes: { skin_tir_1: 1, skin_tir_2: 2, skin_suie: 1, skin_mastoc: 1, familier_rat: 1, familier_chouette: 2 } } }) ;
  /** La même, avec Suie recrutée. */
  const avecSuie = (): Sauvegarde => {
    const s = base();
    return { ...s, meta: { ...s.meta, heros: { ...s.meta.heros, suie: { xp: 0, competences: {} } } } };
  };

  it('équipe un skin sur sa tour et en change', () => {
    const premier = equiperSkin(base(), 'tir', 'skin_tir_1');
    if (!premier.ok) throw new Error(premier.raison);
    expect(premier.sauvegarde.meta.collection.equipes.skins).toEqual({ tir: 'skin_tir_1' });
    const second = equiperSkin(premier.sauvegarde, 'tir', 'skin_tir_2');
    if (!second.ok) throw new Error(second.raison);
    expect(second.sauvegarde.meta.collection.equipes.skins).toEqual({ tir: 'skin_tir_2' });
    valide(second.sauvegarde);
  });

  it('équipe le skin d’un héros possédé', () => {
    const r = equiperSkin(avecSuie(), 'suie', 'skin_suie');
    if (!r.ok) throw new Error(r.raison);
    expect(r.sauvegarde.meta.collection.equipes.skins).toEqual({ suie: 'skin_suie' });
  });

  it('déséquipe avec null, et déséquiper ce qui n’est pas équipé ne change rien', () => {
    const equipe = equiperSkin(base(), 'tir', 'skin_tir_1');
    if (!equipe.ok) throw new Error(equipe.raison);
    const enleve = equiperSkin(equipe.sauvegarde, 'tir', null);
    expect(enleve.ok && enleve.sauvegarde.meta.collection.equipes.skins).toEqual({});
    const rien = equiperSkin(base(), 'tir', null);
    expect(rien.ok && rien.sauvegarde).toEqual(base());
    expect(equiperSkin(base(), 'tir', null).ok).toBe(true);
  });

  it('refuse un skin non possédé, mal placé, inconnu, ou un emplacement inconnu', () => {
    expect(equiperSkin(base(), 'tir', 'skin_tir_3')).toEqual({ ok: false, raison: 'non_possede' });
    expect(equiperSkin(base(), 'magie', 'skin_tir_1')).toEqual({ ok: false, raison: 'emplacement_invalide' });
    expect(equiperSkin(avecSuie(), 'plume', 'skin_suie')).toEqual({ ok: false, raison: 'emplacement_invalide' });
    expect(equiperSkin(base(), 'tir', 'skin_dragon')).toEqual({ ok: false, raison: 'objet_inconnu' });
    expect(equiperSkin(base(), 'tir', 'familier_rat')).toEqual({ ok: false, raison: 'objet_inconnu' });
    for (const cible of ['donjon', '', 'constructor', '__proto__']) {
      expect(equiperSkin(base(), cible, 'skin_tir_1'), cible).toEqual({ ok: false, raison: 'emplacement_invalide' });
    }
  });

  it('refuse le skin d’un héros que le joueur n’a pas encore', () => {
    expect(equiperSkin(base(), 'mastoc', 'skin_mastoc')).toEqual({ ok: false, raison: 'heros_non_possede' });
  });

  it('équipe un familier sur un héros possédé, en change, le retire', () => {
    const premier = equiperFamilier(base(), 'charlie', 'familier_rat');
    if (!premier.ok) throw new Error(premier.raison);
    expect(premier.sauvegarde.meta.collection.equipes.familiers).toEqual({ charlie: 'familier_rat' });
    const second = equiperFamilier(premier.sauvegarde, 'charlie', 'familier_chouette');
    expect(second.ok && second.sauvegarde.meta.collection.equipes.familiers).toEqual({ charlie: 'familier_chouette' });
    const enleve = equiperFamilier(premier.sauvegarde, 'charlie', null);
    expect(enleve.ok && enleve.sauvegarde.meta.collection.equipes.familiers).toEqual({});
    valide(premier.sauvegarde);
  });

  it('un familier par héros : chaque héros porte le sien', () => {
    let s = avecSuie();
    for (const [heros, familier] of [['charlie', 'familier_rat'], ['suie', 'familier_chouette']] as const) {
      const r = equiperFamilier(s, heros, familier);
      if (!r.ok) throw new Error(r.raison);
      s = r.sauvegarde;
    }
    expect(s.meta.collection.equipes.familiers).toEqual({ charlie: 'familier_rat', suie: 'familier_chouette' });
  });

  it('refuse un familier non possédé, inconnu, ou un héros inconnu ou pas encore recruté', () => {
    expect(equiperFamilier(base(), 'charlie', 'familier_corneille')).toEqual({ ok: false, raison: 'non_possede' });
    expect(equiperFamilier(base(), 'charlie', 'skin_tir_1')).toEqual({ ok: false, raison: 'objet_inconnu' });
    expect(equiperFamilier(base(), 'charlie', 'familier_dragon')).toEqual({ ok: false, raison: 'objet_inconnu' });
    expect(equiperFamilier(base(), 'zeus', 'familier_rat')).toEqual({ ok: false, raison: 'heros_inconnu' });
    expect(equiperFamilier(base(), 'constructor', 'familier_rat')).toEqual({ ok: false, raison: 'heros_inconnu' });
    expect(equiperFamilier(base(), 'suie', 'familier_rat')).toEqual({ ok: false, raison: 'heros_non_possede' });
  });

  it('ne modifie pas la sauvegarde reçue', () => {
    const s = avecSuie();
    const avant = structuredClone(s);
    equiperSkin(s, 'tir', 'skin_tir_1');
    equiperFamilier(s, 'suie', 'familier_rat');
    expect(s).toEqual(avant);
  });
});
