import { describe, expect, it } from 'vitest';
import { apparenceDeLaPartie, type Equipes } from './apparence';

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
