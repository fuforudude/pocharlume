import { describe, expect, it } from 'vitest';
import { apparenceDeLaPartie, campagneDeLAtlas, type Equipes } from './apparence';

const EQUIPES: Equipes = {
  skins: { tir: 'skin_tir_2', charlie: 'skin_charlie', suie: 'skin_suie' },
  familiers: { charlie: 'familier_rat', suie: 'familier_chouette' },
};

describe('apparence d’une partie', () => {
  it('donne tous les skins équipés et le familier du héros joué seulement', () => {
    expect(apparenceDeLaPartie(EQUIPES, 'charlie')).toEqual({
      skins: { tir: 'skin_tir_2', charlie: 'skin_charlie', suie: 'skin_suie' },
      familier: 'familier_rat',
    });
    expect(apparenceDeLaPartie(EQUIPES, 'suie').familier).toBe('familier_chouette');
  });

  it('un héros sans familier n’en a pas', () => {
    expect(apparenceDeLaPartie(EQUIPES, 'plume').familier).toBeNull();
    expect(apparenceDeLaPartie(EQUIPES, 'constructor').familier).toBeNull();
  });

  it('sans équipement, rien n’est habillé', () => {
    expect(apparenceDeLaPartie(undefined, 'charlie')).toEqual({ skins: {}, familier: null });
  });

  it('rend une copie : modifier le résultat ne touche pas à la sauvegarde', () => {
    const copie = apparenceDeLaPartie(EQUIPES, 'charlie');
    (copie.skins as Record<string, string>).tir = 'autre';
    expect(EQUIPES.skins.tir).toBe('skin_tir_2');
  });
});

describe('apparence d’une partie : skins du DLC', () => {
  it('ajoute les skins du DLC portés (copie), seulement s’il y en a', () => {
    const modernes = { tir: 'skin_moderne_tir' };
    const apparence = apparenceDeLaPartie(EQUIPES, 'charlie', modernes);
    expect(apparence.skinsModernes).toEqual(modernes);
    expect(apparence.skinsModernes).not.toBe(modernes);
    expect(apparenceDeLaPartie(EQUIPES, 'charlie', {})).toEqual(apparenceDeLaPartie(EQUIPES, 'charlie'));
    expect(apparenceDeLaPartie(undefined, 'charlie', modernes)).toEqual({ skins: {}, familier: null, skinsModernes: modernes });
  });

  it('l’atlas du DLC se charge pour une partie du DLC, ou pour l’histoire si un skin du DLC porté y sert', () => {
    expect(campagneDeLAtlas('moderne', {}, 'charlie', 'charlie')).toBe('moderne');
    expect(campagneDeLAtlas('histoire', {}, 'charlie', 'charlie')).toBe('histoire');
    expect(campagneDeLAtlas('histoire', undefined, 'charlie', 'charlie')).toBe('histoire');
    expect(campagneDeLAtlas('histoire', { tir: 'skin_moderne_tir' }, 'charlie', 'charlie')).toBe('moderne');
    expect(campagneDeLAtlas('histoire', { caserne: 'skin_moderne_tir' }, 'charlie', 'charlie')).toBe('histoire');
  });

  it('l’atlas du DLC ne se charge pas pour un skin porté qui ne sert pas dans la partie (autre dieu, autre héros)', () => {
    // Tour divine de Pollen et skin de Mastoc portés, partie de Charlie avec le dieu Charlie : rien à télécharger.
    const portes = { divine_pollen: 'skin_moderne_divine_pollen', mastoc: 'skin_moderne_mastoc' };
    expect(campagneDeLAtlas('histoire', portes, 'charlie', 'charlie')).toBe('histoire');
    // Le dieu joué ou le héros joué porte son skin : l'atlas est nécessaire.
    expect(campagneDeLAtlas('histoire', portes, 'pollen', 'charlie')).toBe('moderne');
    expect(campagneDeLAtlas('histoire', portes, 'charlie', 'mastoc')).toBe('moderne');
    // Les 4 familles servent toujours.
    for (const famille of ['caserne', 'tir', 'magie', 'artillerie']) {
      expect(campagneDeLAtlas('histoire', { [famille]: `skin_moderne_${famille}` }, 'charlie', 'charlie')).toBe('moderne');
    }
  });
});
