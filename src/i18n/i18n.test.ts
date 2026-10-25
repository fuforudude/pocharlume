import { describe, expect, it } from 'vitest';
import { fr } from './fr';
import { t } from './index';

describe('t', () => {
  it('rend le texte français d’une clé', () => {
    expect(t('jeu.titre')).toBe('Pocharlume');
  });

  it('rend exactement la table fr pour chaque clé', () => {
    for (const cle of Object.keys(fr) as (keyof typeof fr)[]) {
      expect(t(cle)).toBe(fr[cle]);
    }
  });

  it('refuse une clé inconnue à la compilation', () => {
    // @ts-expect-error la clé n'existe pas dans fr.ts
    expect(() => t('cle.inconnue')).toThrow('cle.inconnue');
  });
});
