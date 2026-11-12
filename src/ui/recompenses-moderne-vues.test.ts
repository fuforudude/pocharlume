// Ce que les écrans montrent des récompenses du DLC : la caisse « Temps modernes » (prix, chances, garantie, solde de badges), les skins
// du DLC (obtenus, portés, où) et les titres.
import { describe, expect, it } from 'vitest';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, RARETES } from '../data/meta';
import { CATALOGUE_MODERNE, DEFS_SKINS_MODERNES, DEFS_TITRES_MODERNES, PRIX_CAISSE_MODERNE } from '../data/recompenses-moderne';
import { aTexte } from '../i18n';
import { sauvegardeVide, type Sauvegarde } from '../save';
import { vueCaisseModerne, vueSkinsModernes, vueTitresModernes } from './recompenses-moderne-vues';

function avec(moderne: Partial<Sauvegarde['moderne']>, collection: Partial<Sauvegarde['moderne']['collection']> = {}): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, moderne: { ...s.moderne, ...moderne, collection: { ...s.moderne.collection, ...collection } } };
}

describe('vue de la caisse Temps modernes', () => {
  it('donne le prix en badges, les chances du tirage, la garantie restante et le solde', () => {
    const vue = vueCaisseModerne(avec({ badges: PRIX_CAISSE_MODERNE + 2 }, { garantie: 3, skinsTours: ['skin_moderne_tir'] }));
    expect(vue).toMatchObject({ prix: PRIX_CAISSE_MODERNE, badges: PRIX_CAISSE_MODERNE + 2, compteur: 3, avantGarantie: CAISSES_AVANT_GARANTIE - 3, peutPayer: true, possedes: 1, total: DEFS_SKINS_MODERNES.length });
    expect(vue.chances).toEqual(RARETES.map((rarete) => ({ rarete, pourcent: CHANCES_RARETE[rarete] })));
    expect(vueCaisseModerne(avec({ badges: PRIX_CAISSE_MODERNE - 1 })).peutPayer).toBe(false);
  });
});

describe('vue des skins du DLC', () => {
  it('liste tout le catalogue : obtenus, portés, et si le héros est recruté', () => {
    const s = avec({}, { skinsTours: ['skin_moderne_tir'], skinsHeros: ['skin_moderne_charlie', 'skin_moderne_mastoc'], equipes: { charlie: 'skin_moderne_charlie' } });
    const vues = vueSkinsModernes(s);
    expect(vues.map((v) => v.id)).toEqual(DEFS_SKINS_MODERNES.map((d) => d.id));
    const par = (id: string) => vues.find((v) => v.id === id);
    expect(par('skin_moderne_tir')).toMatchObject({ possede: true, porte: false, peutPorter: true, cible: 'tir', sprite: 'moderne-tir-3' });
    expect(par('skin_moderne_charlie')).toMatchObject({ possede: true, porte: true, peutPorter: true, sprite: 'moderne-heros-charlie' });
    expect(par('skin_moderne_mastoc')).toMatchObject({ possede: true, peutPorter: false });
    expect(par('skin_moderne_divine_pollen')).toMatchObject({ possede: false, cible: 'divine_pollen', sprite: 'moderne-pollen' });
  });

  it('chaque skin et chaque titre du catalogue a son texte', () => {
    for (const def of DEFS_SKINS_MODERNES) expect(aTexte(def.nom), def.nom).toBe(true);
    for (const def of DEFS_TITRES_MODERNES) {
      expect(aTexte(def.nom), def.nom).toBe(true);
      expect(aTexte(def.condition), def.condition).toBe(true);
    }
  });
});

describe('vue des titres', () => {
  it('tous les titres, obtenus ou non, dans l’ordre du catalogue ; un titre inconnu n’apparaît pas', () => {
    const vues = vueTitresModernes(avec({ titres: ['fac_occupee', 'titre_retire'] }));
    expect(vues.map((v) => v.id)).toEqual(CATALOGUE_MODERNE.titres);
    expect(vues.filter((v) => v.obtenu).map((v) => v.id)).toEqual(['fac_occupee']);
  });
});
