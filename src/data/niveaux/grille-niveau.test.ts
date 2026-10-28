// Cases interdites d'un niveau : chemin (2 tuiles de large) et grands décors bloquent, herbe, fleurs, petits cailloux et tout décor
// de 16×16 non.
import { describe, expect, it } from 'vitest';
import type { Carte, CaseGrille } from '../../engine/definitions';
import type { Decor } from '../visuel';
import { casesInterditesDuNiveau, tuilesDeChemin } from './grille-niveau';
import { GRANDS_DECORS } from './habillage';

function carteAvec(...chemins: [number, number][][]): Pick<Carte, 'largeur' | 'hauteur' | 'chemins'> {
  return { largeur: 32, hauteur: 18, chemins: chemins.map((points) => ({ points: points.map(([x, y]) => ({ x, y })) })) };
}

const CARTE_VIDE = carteAvec();

const cles = (cases: readonly CaseGrille[]): string[] => cases.map((c) => `${String(c.cx)},${String(c.cy)}`);

describe('tuiles du chemin', () => {
  it('un chemin horizontal sur un axe entier couvre deux rangées de tuiles', () => {
    const tuiles = tuilesDeChemin(carteAvec([[-1, 4], [33, 4]]));
    for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) expect(tuiles[y * 32 + x], `(${String(x)},${String(y)})`).toBe(y === 3 || y === 4 ? 1 : 0);
  });

  it('un chemin vertical, et un virage : les tuiles dont le centre est à une tuile ou moins de l’axe', () => {
    const tuiles = tuilesDeChemin(carteAvec([[-1, 4], [12, 4], [12, 13]]));
    const est = (x: number, y: number): number => tuiles[y * 32 + x] ?? 0;
    expect([est(11, 4), est(12, 4), est(10, 4), est(13, 4)]).toEqual([1, 1, 1, 0]);
    expect([est(11, 8), est(12, 8), est(10, 8), est(13, 8)]).toEqual([1, 1, 0, 0]);
    // Le coin extérieur est rond : la tuile (13, 3), à 1,58 tuile du point de virage, n'en fait pas partie. Le chemin finit en (12, 13).
    expect([est(12, 3), est(13, 3), est(12, 13), est(12, 14)]).toEqual([1, 0, 1, 0]);
  });
});

describe('cases interdites', () => {
  it('un chemin sur un axe impair n’interdit qu’une ligne de cases, sur un axe pair il en interdit deux', () => {
    expect(cles(casesInterditesDuNiveau(carteAvec([[-1, 5], [33, 5]]), [])).filter((c) => c.startsWith('7,'))).toEqual(['7,2']);
    expect(cles(casesInterditesDuNiveau(carteAvec([[-1, 4], [33, 4]]), [])).filter((c) => c.startsWith('7,'))).toEqual(['7,1', '7,2']);
  });

  it('une carte sans chemin ni décor n’interdit rien', () => {
    expect(casesInterditesDuNiveau(CARTE_VIDE, [])).toEqual([]);
  });

  it('les cases sortent ligne par ligne, du nord au sud', () => {
    const interdites = casesInterditesDuNiveau(carteAvec([[-1, 4], [12, 4], [12, 13]]), []);
    const ordre = interdites.map((c) => c.cy * 100 + c.cx);
    expect(ordre).toEqual([...ordre].sort((a, b) => a - b));
  });

  it('un grand décor bloque les cases de ses tuiles (puits 32×32 ancré à (9, 9) : tuiles 8-9 × 7-8)', () => {
    const decor: Decor[] = [{ sprite: 'puits', x: 9, y: 9 }];
    expect(cles(casesInterditesDuNiveau(CARTE_VIDE, decor))).toEqual(['4,3', '4,4']);
  });

  it('un grand décor à cheval sur plusieurs cases les bloque toutes, une marge de quelques pixels non', () => {
    // Arbre ancré à (19.5, 6) : emprise 18,5 à 20,5 × 4,125 à 6,125 : tuiles 18, 19, 20 × 4, 5 (la rangée 6 n'est mordue que de 0,125).
    expect(cles(casesInterditesDuNiveau(CARTE_VIDE, [{ sprite: 'arbre-mort-1', x: 19.5, y: 6 }]))).toEqual(['9,2', '10,2']);
  });

  it('les petits décors ne bloquent rien : cailloux, touffes, tonneaux, croix, clôtures, souches', () => {
    const petits = ['cailloux', 'touffe', 'tonneau', 'croix', 'cloture-h', 'cloture-v', 'souche', 'crane'];
    for (const sprite of petits) expect(GRANDS_DECORS.has(sprite), sprite).toBe(false);
    const decor: Decor[] = petits.map((sprite, i) => ({ sprite, x: 3 + i * 3, y: 8 }));
    expect(casesInterditesDuNiveau(CARTE_VIDE, decor)).toEqual([]);
  });

  it('chacun des grands décors du jeu bloque au moins une case, jamais plus de quatre', () => {
    for (const sprite of GRANDS_DECORS) {
      const interdites = casesInterditesDuNiveau(CARTE_VIDE, [{ sprite, x: 15, y: 9 }]);
      expect(interdites.length, sprite).toBeGreaterThanOrEqual(1);
      expect(interdites.length, sprite).toBeLessThanOrEqual(4);
    }
  });

  it('un décor qui dépasse de la carte ne bloque que les cases de la carte', () => {
    expect(cles(casesInterditesDuNiveau(CARTE_VIDE, [{ sprite: 'puits', x: 1, y: 2 }]))).toEqual(['0,0']);
    expect(casesInterditesDuNiveau(CARTE_VIDE, [{ sprite: 'puits', x: -5, y: -5 }])).toEqual([]);
    expect(cles(casesInterditesDuNiveau(CARTE_VIDE, [{ sprite: 'puits', x: 32, y: 18 }]))).toEqual(['15,8']);
  });

  it('le chemin et le décor s’ajoutent sans doublon', () => {
    // Le puits ancré à (9, 6) mord le chemin (rangées 4 et 5, case 2) : il n'ajoute rien ; ancré à (9, 8), il ajoute la case (4, 3).
    const interdites = casesInterditesDuNiveau(carteAvec([[-1, 5], [33, 5]]), [{ sprite: 'puits', x: 9, y: 6 }, { sprite: 'puits', x: 9, y: 8 }]);
    expect(new Set(cles(interdites)).size).toBe(interdites.length);
    expect(interdites).toHaveLength(16 + 1);
    expect(cles(interdites)).toContain('4,2');
    expect(cles(interdites)).toContain('4,3');
  });
});
