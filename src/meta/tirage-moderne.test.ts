// Tirage de la caisse « Temps modernes » : les mêmes règles que les caisses actuelles (deux jets, chances affichées, garantie).
import { describe, expect, it } from 'vitest';
import { CHANCES_RARETE, RARETES } from '../data/meta';
import { defSkinModerne, skinsCaisseModerne } from '../data/recompenses-moderne';
import { sourceConstante, sourceGraine, sourceListe } from './aides.test-utils';
import { tirerCaisseModerne } from './tirage';

describe('tirer la caisse Temps modernes', () => {
  it('donne un skin du DLC de la rareté tirée, en deux jets', () => {
    let jets = 0;
    const alea = (): number => {
      jets++;
      return 0;
    };
    const tire = tirerCaisseModerne(0, alea);
    expect(jets).toBe(2);
    expect(tire).toEqual({ id: skinsCaisseModerne('commun')[0], rarete: 'commun', garantie: false, compteur: 1 });
  });

  it('le second jet choisit le skin dans sa rareté', () => {
    const communs = skinsCaisseModerne('commun');
    expect(tirerCaisseModerne(0, sourceListe([0, 0.999])).id).toBe(communs[communs.length - 1]);
    expect(tirerCaisseModerne(0, sourceListe([0.99, 0])).id).toBe(skinsCaisseModerne('mythique')[0]);
  });

  it('la dixième caisse sans Épique en donne un, et le compteur repart à zéro', () => {
    const tire = tirerCaisseModerne(9, sourceConstante(0));
    expect(tire.garantie).toBe(true);
    expect(['epique', 'legendaire', 'mythique']).toContain(tire.rarete);
    expect(tire.compteur).toBe(0);
    expect(tirerCaisseModerne(4, sourceListe([0.9, 0])).compteur).toBe(0);
  });

  it('sur 100 000 tirages, les raretés sortent aux chances affichées et le skin a toujours sa rareté', () => {
    const alea = sourceGraine(20261112);
    const comptes = new Map<string, number>();
    for (let i = 0; i < 100_000; i++) {
      const tire = tirerCaisseModerne(0, alea);
      expect(defSkinModerne(tire.id)?.rarete).toBe(tire.rarete);
      comptes.set(tire.rarete, (comptes.get(tire.rarete) ?? 0) + 1);
    }
    for (const rarete of RARETES) expect(Math.abs((comptes.get(rarete) ?? 0) / 1000 - CHANCES_RARETE[rarete])).toBeLessThan(0.5);
  });
});
