// Données : chaque niveau du DLC (Temps modernes) qui a un défi Fer se crée dans ce défi sans erreur (événements répartis, replis
// cohérents). La liste est vide tant que le contenu n'est pas livré : le test passe alors à vide.
import { describe, expect, it } from 'vitest';
import { CAMPAGNE_MODERNE } from '../../data/niveaux/campagne-moderne';
import { CONFIG } from '../aides.test-utils';
import { creerPartie } from '../partie';

describe('défi Fer sur les niveaux du DLC', () => {
  for (const n of CAMPAGNE_MODERNE) {
    if (!n.niveau.defiFer) continue;
    it(`le niveau ${String(n.numero)} se crée en défi Fer`, () => {
      expect(() => creerPartie(n.niveau, { ...CONFIG, defi: 'fer' })).not.toThrow();
    });
  }
  it('la liste des niveaux du DLC est lisible', () => {
    expect(Array.isArray(CAMPAGNE_MODERNE)).toBe(true);
  });
});
