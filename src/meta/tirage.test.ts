import { describe, expect, it } from 'vitest';
import { CATALOGUE, objetsDeCaisse } from '../data/collection';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, RARETES, TYPES_CAISSE, type Rarete, type TypeCaisse } from '../data/meta';
import { sourceConstante, sourceGraine, sourceListe } from './aides.test-utils';
import { tirerCaisse, tirerRarete } from './tirage';

const TIRAGES = 100_000;
/** Écart maximal toléré entre la chance affichée et la fréquence observée, en points de pourcentage. */
const ECART_MAX = 0.5;

function compter<T extends string>(valeurs: readonly T[]): Map<T, number> {
  const comptes = new Map<T, number>();
  for (const v of valeurs) comptes.set(v, (comptes.get(v) ?? 0) + 1);
  return comptes;
}

describe('tirer la rareté', () => {
  it(`sur ${String(TIRAGES)} tirages sans garantie, chaque rareté sort à moins de ${String(ECART_MAX)} point de la chance affichée`, () => {
    const alea = sourceGraine(20261028);
    const comptes = compter(Array.from({ length: TIRAGES }, () => tirerRarete(alea, false)));
    for (const rarete of RARETES) {
      const frequence = (100 * (comptes.get(rarete) ?? 0)) / TIRAGES;
      expect(Math.abs(frequence - CHANCES_RARETE[rarete]), `${rarete} : ${frequence.toFixed(3)} %`).toBeLessThan(ECART_MAX);
    }
  });

  it('tient aussi avec d’autres graines', () => {
    for (const graine of [1, 7, 4242]) {
      const alea = sourceGraine(graine);
      const comptes = compter(Array.from({ length: TIRAGES }, () => tirerRarete(alea, false)));
      for (const rarete of RARETES) {
        expect(Math.abs((100 * (comptes.get(rarete) ?? 0)) / TIRAGES - CHANCES_RARETE[rarete]), `graine ${String(graine)} ${rarete}`).toBeLessThan(ECART_MAX);
      }
    }
  });

  it('les bornes du jet tombent sur la bonne rareté : 0 donne Commun, 0,6 Rare, 0,85 Épique, 0,95 Légendaire, 0,99 Mythique', () => {
    const rarete = (u: number): Rarete => tirerRarete(sourceConstante(u), false);
    expect([0, 0.5999, 0.6, 0.8499, 0.85, 0.9499, 0.95, 0.9899, 0.99, 0.999999].map(rarete)).toEqual([
      'commun', 'commun', 'rare', 'rare', 'epique', 'epique', 'legendaire', 'legendaire', 'mythique', 'mythique',
    ]);
  });

  it('avec la garantie, jamais moins qu’Épique, dans les proportions 10 / 4 / 1', () => {
    const alea = sourceGraine(99);
    const comptes = compter(Array.from({ length: TIRAGES }, () => tirerRarete(alea, true)));
    expect(comptes.get('commun') ?? 0).toBe(0);
    expect(comptes.get('rare') ?? 0).toBe(0);
    expect(Math.abs((100 * (comptes.get('epique') ?? 0)) / TIRAGES - (100 * 10) / 15)).toBeLessThan(ECART_MAX);
    expect(Math.abs((100 * (comptes.get('legendaire') ?? 0)) / TIRAGES - (100 * 4) / 15)).toBeLessThan(ECART_MAX);
    expect(Math.abs((100 * (comptes.get('mythique') ?? 0)) / TIRAGES - (100 * 1) / 15)).toBeLessThan(ECART_MAX);
  });

  it('une source qui rend n’importe quoi (NaN, négatif, 1 ou plus) ne fait jamais sortir d’une rareté connue', () => {
    for (const u of [Number.NaN, -3, 1, 7, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(RARETES, String(u)).toContain(tirerRarete(sourceConstante(u), false));
      expect(RARETES, String(u)).toContain(tirerRarete(sourceConstante(u), true));
    }
  });
});

describe('tirer dans une caisse', () => {
  for (const type of TYPES_CAISSE) {
    describe(`caisse de ${type}`, () => {
      it('le tirage consomme exactement deux jets (rareté, puis objet) et rend un objet de la caisse, de la rareté tirée', () => {
        const alea = sourceListe([0.7, 0]);
        const r = tirerCaisse(type, 0, alea);
        expect(r.rarete).toBe('rare');
        expect(r.id).toBe(objetsDeCaisse(type, 'rare')[0]);
        expect(CATALOGUE[r.id].rarete).toBe('rare');
        expect(r.garantie).toBe(false);
        expect(() => alea()).toThrow('épuisée');
      });

      it('le deuxième jet choisit l’objet parmi ceux de la rareté, à égalité de chances', () => {
        const alea = sourceGraine(5);
        const objets = objetsDeCaisse(type, 'commun');
        const comptes = compter(Array.from({ length: 20_000 }, () => tirerCaisse(type, 0, alea)).filter((r) => r.rarete === 'commun').map((r) => r.id));
        const total = [...comptes.values()].reduce((a, b) => a + b, 0);
        expect(comptes.size).toBe(objets.length);
        for (const id of objets) expect(Math.abs((comptes.get(id) ?? 0) / total - 1 / objets.length)).toBeLessThan(0.03);
      });

      it('chaque objet de la caisse peut sortir, et rien d’une autre caisse', () => {
        const alea = sourceGraine(77);
        const vus = new Set<string>();
        for (let i = 0; i < 20_000; i++) vus.add(tirerCaisse(type, 0, alea).id);
        const attendus = RARETES.flatMap((rarete) => objetsDeCaisse(type, rarete));
        // Les Mythiques sont rares (1 %) : 20 000 tirages les atteignent tous.
        expect([...vus].sort()).toEqual([...attendus].sort());
      });

      it(`la caisse numéro ${String(CAISSES_AVANT_GARANTIE)} sans Épique ni mieux en donne un, même avec un jet qui donnerait Commun`, () => {
        let compteur = 0;
        const rarites: Rarete[] = [];
        for (let n = 1; n <= CAISSES_AVANT_GARANTIE; n++) {
          const r = tirerCaisse(type, compteur, sourceConstante(0));
          rarites.push(r.rarete);
          compteur = r.compteur;
        }
        expect(rarites.slice(0, CAISSES_AVANT_GARANTIE - 1)).toEqual(Array<Rarete>(CAISSES_AVANT_GARANTIE - 1).fill('commun'));
        expect(rarites[CAISSES_AVANT_GARANTIE - 1]).toBe('epique');
        expect(compteur).toBe(0);
      });

      it('la garantie ne joue qu’au compteur 9 et le tirage garanti est marqué comme tel', () => {
        expect(tirerCaisse(type, CAISSES_AVANT_GARANTIE - 2, sourceConstante(0))).toMatchObject({ rarete: 'commun', garantie: false, compteur: CAISSES_AVANT_GARANTIE - 1 });
        expect(tirerCaisse(type, CAISSES_AVANT_GARANTIE - 1, sourceConstante(0))).toMatchObject({ rarete: 'epique', garantie: true, compteur: 0 });
      });

      it('un Épique naturel, Légendaire ou Mythique remet le compteur à zéro ; un Commun ou un Rare l’avance', () => {
        expect(tirerCaisse(type, 4, sourceListe([0.9, 0])).compteur).toBe(0);
        expect(tirerCaisse(type, 4, sourceListe([0.96, 0])).compteur).toBe(0);
        expect(tirerCaisse(type, 4, sourceListe([0.995, 0])).compteur).toBe(0);
        expect(tirerCaisse(type, 4, sourceListe([0.7, 0])).compteur).toBe(5);
        expect(tirerCaisse(type, 4, sourceListe([0.1, 0])).compteur).toBe(5);
      });

      it('sur une longue série, jamais plus de 9 caisses de suite sans Épique ni mieux', () => {
        const alea = sourceGraine(31337);
        let compteur = 0;
        let serieMax = 0;
        let serie = 0;
        for (let i = 0; i < 50_000; i++) {
          const r = tirerCaisse(type, compteur, alea);
          compteur = r.compteur;
          serie = r.rarete === 'commun' || r.rarete === 'rare' ? serie + 1 : 0;
          serieMax = Math.max(serieMax, serie);
        }
        expect(serieMax).toBeLessThanOrEqual(CAISSES_AVANT_GARANTIE - 1);
      });
    });
  }

  it('un compteur hors bornes (sauvegarde abîmée) compte comme une garantie atteinte, jamais comme une erreur', () => {
    for (const compteur of [CAISSES_AVANT_GARANTIE, 99, Number.NaN] as const) {
      const type: TypeCaisse = 'skins';
      const r = tirerCaisse(type, compteur, sourceConstante(0));
      expect(['epique', 'legendaire', 'mythique'], String(compteur)).toContain(r.rarete);
    }
  });
});
