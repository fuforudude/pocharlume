// Les 10 cartes de la région 11 (niveaux 101 à 110) : une par niveau, jouables avec tous leurs chemins, des couloirs dégagés pour le
// Vol de Corbeaux (101 à 105) et un trajet sur l'eau pour le Radeau (106 à 110), une difficulté qui monte dans chaque bloc.
// Couloirs et trajets sont ceux proposés en commentaire dans cartes-region11.ts : ce test les recopie en attendant le champ
// `gimmick` du niveau, qui les remplacera.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Point } from '../../engine/definitions';
import { casesLibres, centreCase } from '../../engine/grille';
import { REGLES } from '../regles';
import { CARTES } from './cartes-toutes';
import { CARTES_REGION11 } from './cartes-region11';
import { distancePointChemin, distanceRectChemin, rectsSeChevauchent, type Rect } from './geometrie';
import { casesInterditesDuNiveau, tuilesDeChemin } from './grille-niveau';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, GRANDS_DECORS, MARGE_DECOR } from './habillage';
import type { CarteModele } from './modele-carte';

const ATLAS = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas.json', import.meta.url), 'utf8')) as { sprites: Record<string, { categorie: string; largeur: number }> }).sprites;
const T = REGLES.tailleCase;
const cartes: readonly CarteModele[] = Object.values(CARTES_REGION11);

/** Rangées de cases des couloirs proposés (niveaux 101 à 105). */
const COULOIRS: Readonly<Record<string, readonly number[]>> = {
  greve: [1, 6],
  filets: [2, 6],
  epaves: [1, 4, 7],
  ponton_noir: [2, 5, 8],
  cap_corbeaux: [1, 4, 7],
};

/** Trajets proposés du radeau, en cases (niveaux 106 à 110). */
const TRAJETS: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  eau_morte: [[5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4]],
  pontons: [[3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [7, 6], [7, 5], [7, 4]],
  passe_noyes: [[5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [12, 5], [12, 4], [12, 3]],
  baie_morte: [[3, 5], [4, 5], [5, 5], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [9, 5], [9, 6]],
  naufrage: [[4, 5], [4, 4], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [10, 4], [10, 5], [10, 6]],
};

/** Portée d'une tour de tir de base, et de ralliement d'une caserne : ce qui compte pour dire qu'une case « voit » le chemin. */
const PORTEE = 3.5;

const rectCase = (cx: number, cy: number): Rect => ({ x0: cx * T, y0: cy * T, x1: (cx + 1) * T, y1: (cy + 1) * T });
const distanceAuChemin = (m: CarteModele, p: Point): number => Math.min(...m.chemins.map((c) => distancePointChemin(p.x, p.y, c.points)));
const longueur = (points: readonly Point[]): number => points.reduce((t, p, i) => t + (i === 0 ? 0 : Math.abs(p.x - (points[i - 1]?.x ?? p.x)) + Math.abs(p.y - (points[i - 1]?.y ?? p.y))), 0);
const niveauDe = (m: CarteModele) => {
  const carte = { largeur: m.largeur, hauteur: m.hauteur, chemins: m.chemins, departHeros: m.departHeros };
  return { carte, casesInterdites: casesInterditesDuNiveau(carte, m.decor) };
};

describe('les 10 cartes de la région 11', () => {
  it('une par niveau, de 32 × 18 tuiles, au jeu de tuiles de la région 11, d’identifiants neufs', () => {
    expect(cartes).toHaveLength(10);
    for (const m of cartes) {
      expect(m.region, m.id).toBe(11);
      expect([m.largeur, m.hauteur]).toEqual([32, 18]);
      expect(m.id in CARTES, m.id).toBe(false);
    }
    expect(Object.keys(CARTES_REGION11)).toEqual([...Object.keys(COULOIRS), ...Object.keys(TRAJETS)]);
  });

  it('ont au moins 40 décors, dont des grands, et au moins 3 zones de sol en tuiles entières dans la carte', () => {
    for (const m of cartes) {
      expect(m.decor.length, m.id).toBeGreaterThanOrEqual(40);
      expect(m.decor.filter((d) => GRANDS_DECORS.has(d.sprite)).length, m.id).toBeGreaterThanOrEqual(4);
      expect(new Set(m.decor.map((d) => d.sprite)).size, m.id).toBeGreaterThanOrEqual(8);
      expect(m.zones.length, m.id).toBeGreaterThanOrEqual(3);
      for (const z of m.zones) {
        expect([z.x, z.y, z.largeur, z.hauteur].every(Number.isInteger)).toBe(true);
        expect(z.x >= 0 && z.y >= 0 && z.x + z.largeur <= m.largeur && z.y + z.hauteur <= m.hauteur, m.id).toBe(true);
      }
    }
  });

  it('les sprites de décor existent dans l’atlas, et les grands font 32 × 32', () => {
    for (const m of cartes) {
      for (const d of m.decor) {
        expect(ATLAS[d.sprite]?.categorie, `${m.id} : ${d.sprite}`).toBe('decor');
        expect(GRANDS_DECORS.has(d.sprite), d.sprite).toBe(ATLAS[d.sprite]?.largeur === 32);
      }
    }
  });

  it('le décor reste dans la carte et ne mord sur aucun chemin', () => {
    const problemes: string[] = [];
    for (const m of cartes) {
      for (const d of m.decor) {
        const r = empriseDecor(d);
        const quoi = `${m.id} : ${d.sprite} en (${String(d.x)}, ${String(d.y)})`;
        if (!(r.x0 >= 0 && r.x1 <= m.largeur && r.y0 >= 0 && r.y1 <= m.hauteur)) problemes.push(`${quoi} sort de la carte`);
        if (m.chemins.some((c) => distanceRectChemin(r, c.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR)) problemes.push(`${quoi} sur le chemin`);
      }
    }
    expect(problemes).toEqual([]);
  });

  it('laissent assez de cases libres, à portée du chemin et de caserne, avec tous leurs chemins', () => {
    for (const m of cartes) {
      const niveau = niveauDe(m);
      const libres = casesLibres({ niveau, tours: [] });
      expect(libres.length, m.id).toBeGreaterThanOrEqual(40);
      expect(libres.filter((c) => distanceAuChemin(m, centreCase(c.cx, c.cy)) <= PORTEE).length, m.id).toBeGreaterThanOrEqual(12);
    }
  });

  it('dans chaque bloc, chaque carte est plus longue ou plus tortueuse que la précédente, et la 5e a trois entrées', () => {
    for (const bloc of [cartes.slice(0, 5), cartes.slice(5, 10)]) {
      bloc.forEach((m, i) => {
        const [principal] = m.chemins;
        if (!principal) throw new Error(`${m.id} sans chemin`);
        if (i === 4) {
          expect(m.chemins.length, m.id).toBe(3);
          return;
        }
        expect(m.chemins.length, m.id).toBe(1);
        const avant = bloc[i - 1]?.chemins[0];
        if (!avant) return;
        const plusLong = longueur(principal.points) > longueur(avant.points);
        const plusTortueux = principal.points.length > avant.points.length;
        expect(plusLong || plusTortueux, m.id).toBe(true);
      });
    }
  });
});

describe('Vol de Corbeaux (niveaux 101 à 105) : couloirs dégagés', () => {
  it.each(Object.entries(COULOIRS))('%s : 2 ou 3 couloirs, sans décor, que le chemin ne fait que traverser', (id, couloirs) => {
    const m = CARTES_REGION11[id as keyof typeof CARTES_REGION11];
    expect(couloirs.length === 2 || couloirs.length === 3).toBe(true);
    for (const cy of couloirs) {
      expect(cy >= 0 && cy < m.hauteur / T).toBe(true);
      const bande: Rect = { x0: 0, y0: cy * T, x1: m.largeur, y1: (cy + 1) * T };
      for (const d of m.decor) expect(rectsSeChevauchent(empriseDecor(d), bande), `${d.sprite} en (${String(d.x)}, ${String(d.y)}) dans le couloir ${String(cy)}`).toBe(false);
      // Aucun segment horizontal du chemin dans la bande : seulement des traversées verticales.
      for (const c of m.chemins) {
        c.points.forEach((p, i) => {
          const q = c.points[i - 1];
          if (q && q.y === p.y) expect(Math.floor(p.y / T), `couloir ${String(cy)} longé par le chemin`).not.toBe(cy);
        });
      }
    }
  });
});

describe('Radeau (niveaux 106 à 110) : trajet sur l’eau', () => {
  it.each(Object.entries(TRAJETS))('%s : 6 à 12 cases contiguës, sur l’eau, hors chemin et sans décor', (id, trajet) => {
    const m = CARTES_REGION11[id as keyof typeof CARTES_REGION11];
    expect(trajet.length).toBeGreaterThanOrEqual(6);
    expect(trajet.length).toBeLessThanOrEqual(12);
    expect(new Set(trajet.map(([cx, cy]) => `${String(cx)},${String(cy)}`)).size).toBe(trajet.length);
    const tuiles = tuilesDeChemin(m);
    trajet.forEach(([cx, cy], i) => {
      const precedente = trajet[i - 1];
      if (precedente) expect(Math.abs(cx - precedente[0]) + Math.abs(cy - precedente[1]), `case ${String(i)} non voisine`).toBe(1);
      const r = rectCase(cx, cy);
      expect(m.zones.some((z) => z.sol === 'boue' && z.x <= r.x0 && z.y <= r.y0 && z.x + z.largeur >= r.x1 && z.y + z.hauteur >= r.y1), `case (${String(cx)}, ${String(cy)}) hors de l’eau`).toBe(true);
      for (let ty = r.y0; ty < r.y1; ty++) for (let tx = r.x0; tx < r.x1; tx++) expect(tuiles[ty * m.largeur + tx], `chemin en (${String(tx)}, ${String(ty)})`).toBe(0);
      for (const d of m.decor) expect(rectsSeChevauchent(empriseDecor(d), r), `${d.sprite} sur la case (${String(cx)}, ${String(cy)})`).toBe(false);
    });
  });

  it.each(Object.entries(TRAJETS))('%s : ses deux bouts sont à portée de deux endroits éloignés du chemin', (id, trajet) => {
    const m = CARTES_REGION11[id as keyof typeof CARTES_REGION11];
    /** Le point du chemin le plus proche du centre de la case. */
    const plusProche = ([cx, cy]: readonly [number, number]): { d: number; p: Point } => {
      const centre = centreCase(cx, cy);
      let meilleur = { d: Infinity, p: { x: 0, y: 0 } };
      for (const c of m.chemins) {
        c.points.forEach((b, i) => {
          const a = c.points[i - 1];
          if (!a) return;
          const pas = longueur([a, b]) * 4;
          for (let k = 0; k <= pas; k++) {
            const p = { x: a.x + ((b.x - a.x) * k) / pas, y: a.y + ((b.y - a.y) * k) / pas };
            const d = Math.hypot(p.x - centre.x, p.y - centre.y);
            if (d < meilleur.d) meilleur = { d, p };
          }
        });
      }
      return meilleur;
    };
    const debut = plusProche(trajet[0] ?? [0, 0]);
    const fin = plusProche(trajet.at(-1) ?? [0, 0]);
    expect(debut.d).toBeLessThanOrEqual(PORTEE);
    expect(fin.d).toBeLessThanOrEqual(PORTEE);
    expect(Math.hypot(debut.p.x - fin.p.x, debut.p.y - fin.p.y)).toBeGreaterThanOrEqual(8);
  });
});
