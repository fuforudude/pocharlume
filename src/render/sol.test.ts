import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { VisuelCarte } from '../data/visuel';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import type { Carte } from '../engine/definitions';
import { bruit, construireSol, masqueChemin, nomTuile, type GrilleSol } from './sol';

const SANS_ZONE: VisuelCarte = { region: 1, zones: [], decor: [] };
const carte = NIVEAU_TEST.carte;

function tuile(grille: GrilleSol, x: number, y: number): string {
  return grille.tuiles[y * grille.largeur + x] ?? '';
}

const atlas = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as { sprites: Record<string, unknown> };

describe('masque du chemin', () => {
  it('couvre 2 tuiles de large autour de l’axe du chemin', () => {
    const m = masqueChemin(carte);
    const estChemin = (x: number, y: number): boolean => m[y * carte.largeur + x] === 1;
    // Premier tronçon horizontal à y = 4 : lignes 3 et 4.
    for (const x of [0, 5, 9]) {
      expect(estChemin(x, 2)).toBe(false);
      expect(estChemin(x, 3)).toBe(true);
      expect(estChemin(x, 4)).toBe(true);
      expect(estChemin(x, 5)).toBe(false);
    }
    // Tronçon vertical à x = 12 : colonnes 11 et 12.
    for (const y of [6, 8, 10]) {
      expect(estChemin(10, y)).toBe(false);
      expect(estChemin(11, y)).toBe(true);
      expect(estChemin(12, y)).toBe(true);
      expect(estChemin(13, y)).toBe(false);
    }
  });

  it('chaque point de l’axe suivi par les ennemis est sur une case de chemin', () => {
    const m = masqueChemin(carte);
    for (const chemin of carte.chemins) {
      for (let i = 1; i < chemin.points.length; i++) {
        const a = chemin.points[i - 1];
        const b = chemin.points[i];
        if (!a || !b) continue;
        for (let k = 0; k <= 40; k++) {
          const x = a.x + ((b.x - a.x) * k) / 40;
          const y = a.y + ((b.y - a.y) * k) / 40;
          if (x < 0 || y < 0 || x >= carte.largeur || y >= carte.hauteur) continue;
          expect(m[Math.floor(y) * carte.largeur + Math.floor(x)]).toBe(1);
        }
      }
    }
  });

  it('un chemin plus large couvre plus de cases', () => {
    const somme = (m: Uint8Array): number => m.reduce((a, b) => a + b, 0);
    expect(somme(masqueChemin(carte, 1.5))).toBeGreaterThan(somme(masqueChemin(carte, 1)));
  });
});

describe('construireSol', () => {
  const grille = construireSol(carte, SANS_ZONE);

  it('a une tuile par case de la carte', () => {
    expect(grille.largeur).toBe(32);
    expect(grille.hauteur).toBe(18);
    expect(grille.tuiles).toHaveLength(32 * 18);
  });

  it('met de l’herbe loin du chemin et de la terre sur le chemin', () => {
    expect(tuile(grille, 0, 0)).toMatch(/^herbe-[123]$/);
    expect(tuile(grille, 30, 16)).toMatch(/^herbe-[123]$/);
    expect(tuile(grille, 5, 3)).toMatch(/^chemin-/);
  });

  it('borde le chemin d’herbe : le bord porte le nom du côté où se trouve l’herbe', () => {
    expect(tuile(grille, 5, 3)).toBe('chemin-bord-n');
    expect(tuile(grille, 5, 4)).toBe('chemin-bord-s');
    expect(tuile(grille, 11, 8)).toBe('chemin-bord-o');
    expect(tuile(grille, 12, 8)).toBe('chemin-bord-e');
  });

  it('pose un coin extérieur à chaque virage et un coin intérieur de l’autre côté', () => {
    // Virage de (12,4) : l'angle extérieur est au nord-est.
    expect(tuile(grille, 12, 3)).toBe('chemin-coin-ext-ne');
    // Le creux du virage, au sud-ouest : la tuile de chemin voisine d'une herbe en diagonale.
    expect(tuile(grille, 11, 4)).toBe('chemin-coin-int-so');
    // Virage de (12,13) vers l'est : l'angle extérieur est au sud-ouest.
    expect(tuile(grille, 11, 13)).toBe('chemin-coin-ext-so');
    // Virage de (24,13) vers le nord : angle extérieur au sud-est.
    expect(tuile(grille, 24, 13)).toBe('chemin-coin-ext-se');
  });

  it('ne met pas de bord d’herbe là où le chemin sort de la carte', () => {
    // Le chemin entre par la gauche à y = 4 : la case (0,4) n'a pas d'herbe à l'ouest.
    expect(tuile(grille, 0, 4)).toBe('chemin-bord-s');
    expect(tuile(grille, 31, 7)).toBe('chemin-bord-s');
  });

  it('est identique d’un appel à l’autre (pas de hasard non déterministe)', () => {
    expect(construireSol(carte, SANS_ZONE).tuiles).toEqual(grille.tuiles);
  });

  it('varie l’herbe avec ses trois variantes, et la terre d’un chemin plus large avec ses deux', () => {
    expect(new Set(grille.tuiles.filter((n) => n.startsWith('herbe-'))).size).toBe(3);
    // À 2 tuiles de large chaque case touche l'herbe : la terre unie n'apparaît qu'à partir de 3.
    const large = construireSol(carte, SANS_ZONE, 2);
    expect(new Set(large.tuiles.filter((n) => /^chemin-[12]$/.test(n))).size).toBe(2);
  });

  it('ne nomme que des tuiles de l’atlas', () => {
    for (const nom of new Set(grille.tuiles)) expect(atlas.sprites, nom).toHaveProperty([nom]);
  });

  it('remplace l’herbe par la boue ou les pavés dans une zone, sans recouvrir le chemin', () => {
    const visuel: VisuelCarte = {
      region: 1,
      zones: [
        { sol: 'boue', x: 2, y: 8, largeur: 3, hauteur: 2 },
        { sol: 'paves', x: 10, y: 2, largeur: 4, hauteur: 3 },
      ],
      decor: [],
    };
    const g = construireSol(carte, visuel);
    expect(tuile(g, 3, 8)).toMatch(/^boue-[12]$/);
    expect(tuile(g, 4, 9)).toMatch(/^boue-[12]$/);
    expect(tuile(g, 5, 9)).toMatch(/^herbe-/);
    // (10,2) et (13,2) sont sur la zone de pavés, mais (10,3) à (13,4) sont le chemin.
    expect(tuile(g, 10, 2)).toMatch(/^paves-[12]$/);
    expect(tuile(g, 10, 3)).toMatch(/^chemin-/);
    for (const nom of new Set(g.tuiles)) expect(atlas.sprites, nom).toHaveProperty([nom]);
  });

  it('gère un chemin qui n’est qu’un couloir d’une case de large', () => {
    const fin: Carte = { ...carte, chemins: [{ points: [{ x: 0, y: 5.5 }, { x: 31, y: 5.5 }] }] };
    const g = construireSol(fin, SANS_ZONE, 0.5);
    expect(tuile(g, 10, 5)).toMatch(/^chemin-/);
    expect(g.tuiles.every((n) => Object.hasOwn(atlas.sprites, n))).toBe(true);
  });
});

describe('jeux de tuiles par région', () => {
  const BASES = [
    'herbe-1', 'herbe-2', 'herbe-3', 'chemin-1', 'chemin-2', 'boue-1', 'boue-2', 'paves-1', 'paves-2',
    ...['n', 'e', 's', 'o'].map((c) => `chemin-bord-${c}`),
    ...['no', 'ne', 'se', 'so'].flatMap((c) => [`chemin-coin-ext-${c}`, `chemin-coin-int-${c}`]),
  ];

  it('nomme les tuiles de la région 1 comme avant et préfixe celles des régions suivantes', () => {
    expect(nomTuile(1, 'herbe-1')).toBe('herbe-1');
    expect(nomTuile(2, 'herbe-1')).toBe('r2-herbe-1');
    expect(nomTuile(5, 'chemin-coin-int-so')).toBe('r5-chemin-coin-int-so');
  });

  it('a, pour chacune des régions 1 à 5, les 21 tuiles du jeu dans l’atlas', () => {
    for (const region of [1, 2, 3, 4, 5]) {
      for (const base of BASES) expect(atlas.sprites, nomTuile(region, base)).toHaveProperty([nomTuile(region, base)]);
    }
  });

  it('peint une carte entière avec le seul jeu de sa région (chemin, herbe et zones)', () => {
    for (const region of [2, 3, 4, 5]) {
      const visuel: VisuelCarte = {
        region,
        zones: [{ sol: 'boue', x: 2, y: 8, largeur: 3, hauteur: 2 }, { sol: 'paves', x: 10, y: 2, largeur: 4, hauteur: 3 }],
        decor: [],
      };
      const g = construireSol(carte, visuel);
      const prefixe = `r${String(region)}-`;
      expect(g.tuiles.every((n) => n.startsWith(prefixe) && Object.hasOwn(atlas.sprites, n)), `région ${String(region)}`).toBe(true);
      // Les mêmes formes qu'en région 1 : seul le jeu change.
      expect(g.tuiles.map((n) => n.slice(prefixe.length))).toEqual(construireSol(carte, { ...visuel, region: 1 }).tuiles);
    }
  });
});

describe('bruit', () => {
  it('reste dans [0, 1[ et dépend de la case', () => {
    const valeurs = new Set<number>();
    for (let x = 0; x < 40; x++) {
      for (let y = 0; y < 20; y++) {
        const b = bruit(x, y);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(1);
        valeurs.add(b);
      }
    }
    expect(valeurs.size).toBeGreaterThan(700);
  });
});
