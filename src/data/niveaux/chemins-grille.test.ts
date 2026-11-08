// Les chemins suivent la grille des cases (jalon 5) : l'axe passe par les centres des cases (coordonnées de tuile impaires, une case
// de 2×2 tuiles couvrant les tuiles 2i et 2i+1), en segments horizontaux ou verticaux, et le chemin occupe exactement les cases
// qu'il traverse : plus aucune case à moitié chemin, à moitié libre.
import { describe, expect, it } from 'vitest';
import { REGLES } from '../regles';
import { CARTES } from './cartes-toutes';
import { casesInterditesDuNiveau, tuilesDeChemin } from './grille-niveau';
import type { CarteModele } from './modele-carte';

const T = REGLES.tailleCase;
/** Les cartes de la campagne, région 11 comprise. */
const cartes: [string, CarteModele][] = Object.entries(CARTES);

/** Cases traversées par l'axe des chemins, calculées sans passer par le masque de tuiles. */
function casesDeLAxe(modele: (typeof cartes)[number][1]): Set<string> {
  const cases = new Set<string>();
  for (const c of modele.chemins) {
    c.points.forEach((b, i) => {
      const a = c.points[i - 1];
      if (!a) return;
      const x0 = Math.min(a.x, b.x);
      const x1 = Math.max(a.x, b.x);
      const y0 = Math.min(a.y, b.y);
      const y1 = Math.max(a.y, b.y);
      for (let x = x0; x <= x1; x += 1) {
        for (let y = y0; y <= y1; y += 1) {
          const cx = Math.floor(x / T);
          const cy = Math.floor(y / T);
          if (cx >= 0 && cy >= 0 && cx < modele.largeur / T && cy < modele.hauteur / T) cases.add(`${String(cx)},${String(cy)}`);
        }
      }
    });
  }
  return cases;
}

describe('chemins alignés sur la grille des cases, 41 cartes', () => {
  it('compte bien 41 cartes : 31 de l’histoire et 10 de la région 11', () => {
    expect(Object.keys(CARTES)).toHaveLength(41);
    expect(Object.values(CARTES).filter((c) => c.region === 11)).toHaveLength(10);
  });

  it.each(cartes)('%s : segments horizontaux ou verticaux, virages au centre d’une case', (_id, modele) => {
    for (const chemin of modele.chemins) {
      chemin.points.forEach((p, i) => {
        expect(p.x % T !== 0 && p.y % T !== 0, `point ${String(i)} (${String(p.x)}, ${String(p.y)}) : coordonnées impaires attendues`).toBe(true);
        const q = chemin.points[i - 1];
        if (q) expect(p.x === q.x || p.y === q.y, `segment ${String(i)} en diagonale`).toBe(true);
        if (q) expect(p.x !== q.x || p.y !== q.y, `segment ${String(i)} de longueur nulle`).toBe(true);
      });
    }
  });

  it.each(cartes)('%s : entrée et sortie par le bord de la carte', (_id, modele) => {
    for (const chemin of modele.chemins) {
      const premier = chemin.points[0];
      const dernier = chemin.points.at(-1);
      const dehors = (p?: { x: number; y: number }): boolean => p !== undefined && (p.x < 0 || p.y < 0 || p.x > modele.largeur || p.y > modele.hauteur);
      expect(dehors(premier) && dehors(dernier)).toBe(true);
    }
  });

  it.each(cartes)('%s : les cases du chemin sont exactement les cases traversées par l’axe, entières', (_id, modele) => {
    const carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins };
    const interdites = new Set(casesInterditesDuNiveau(carte, []).map((c) => `${String(c.cx)},${String(c.cy)}`));
    expect([...interdites].sort()).toEqual([...casesDeLAxe(modele)].sort());
    // Aucune case à moitié chemin : chaque case est entièrement du chemin ou entièrement libre.
    const masque = tuilesDeChemin(carte);
    for (let cy = 0; cy < modele.hauteur / T; cy++) {
      for (let cx = 0; cx < modele.largeur / T; cx++) {
        let nombre = 0;
        for (let dy = 0; dy < T; dy++) for (let dx = 0; dx < T; dx++) nombre += masque[(cy * T + dy) * modele.largeur + cx * T + dx] ?? 0;
        expect(nombre === 0 || nombre === T * T, `case ${String(cx)},${String(cy)} à moitié chemin`).toBe(true);
      }
    }
  });

  it.each(cartes)('%s : le héros attend sur le chemin, au centre d’une case', (_id, modele) => {
    const cases = casesDeLAxe(modele);
    const { x, y } = modele.departHeros;
    expect(cases.has(`${String(Math.floor(x / T))},${String(Math.floor(y / T))}`)).toBe(true);
    expect(x % T !== 0 && y % T !== 0).toBe(true);
  });
});
