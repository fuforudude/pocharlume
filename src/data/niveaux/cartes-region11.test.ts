// Les 10 cartes de la région 11 (niveaux 101 à 110) : une par niveau, jouables avec tous leurs chemins, des couloirs dégagés pour le
// Vol de Corbeaux (101 à 105) et un trajet sur l'eau pour le Radeau (106 à 110), une difficulté qui monte dans chaque bloc.
// Couloirs et trajets sont ceux du gimmick de chaque niveau (plan-region11.ts). L'eau (la zone « boue » de la région) bloque la
// construction : aucune case d'eau n'est constructible, le trajet du radeau compris.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Niveau, PlaceRadeau, Point } from '../../engine/definitions';
import { casesDuTrajet } from '../../engine/gimmicks/radeau';
import { casesLibres, centreCase, estCaseInterdite } from '../../engine/grille';
import { REGLES } from '../regles';
import { REGIONS } from './campagne';
import { CARTES } from './cartes-toutes';
import { CARTES_REGION11 } from './cartes-region11';
import { distancePointChemin, distanceRectChemin, rectsSeChevauchent, type Rect } from './geometrie';
import { casesInterditesDuNiveau, tuilesDeChemin } from './grille-niveau';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, GRANDS_DECORS, MARGE_DECOR, zonesBloquantes } from './habillage';
import type { CarteModele } from './modele-carte';
import { PLANS_REGION11 } from './plan-region11';

const ATLAS = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas.json', import.meta.url), 'utf8')) as { sprites: Record<string, { categorie: string; largeur: number }> }).sprites;
const T = REGLES.tailleCase;
const cartes: readonly CarteModele[] = Object.values(CARTES_REGION11);
const NIVEAUX_REGION11 = REGIONS[10] ?? [];

/** Rangées de cases des couloirs de chaque carte du Vol de Corbeaux (niveaux 101 à 105), d'après les plans. */
const COULOIRS: Readonly<Record<string, readonly number[]>> = Object.fromEntries(
  PLANS_REGION11.flatMap((p) => (p.gimmick?.type === 'corbeaux' ? [[p.carte, p.gimmick.couloirs.map((c) => c.cy)]] : [])),
);

/** Trajets du radeau de chaque carte (niveaux 106 à 110), en cases, d'après les plans. */
const TRAJETS: Readonly<Record<string, readonly (readonly [number, number])[]>> = Object.fromEntries(
  PLANS_REGION11.flatMap((p) => (p.gimmick?.type === 'radeau' ? [[p.carte, p.gimmick.trajet.map((c) => [c.cx, c.cy] as const)]] : [])),
);

/** Places du radeau de chaque carte (niveaux 106 à 110), en tuiles autour de son centre, d'après les plans. */
const PLACES: Readonly<Record<string, readonly PlaceRadeau[]>> = Object.fromEntries(
  PLANS_REGION11.flatMap((p) => (p.gimmick?.type === 'radeau' ? [[p.carte, p.gimmick.places]] : [])),
);

/** Cadre dessiné du radeau dans l'atlas (contour compris) et son ancre, en pixels. */
const EMPRISE_RADEAU = (() => {
  const s = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas.json', import.meta.url), 'utf8')) as { sprites: Record<string, { ancre: { x: number; y: number }; animations: Record<string, { cadres: { largeur: number; hauteur: number; dx: number; dy: number }[] }> }> }).sprites.radeau;
  const cadre = s?.animations.repos?.cadres[0];
  if (!s || !cadre) throw new Error('sprite radeau absent de l’atlas');
  return { ax: s.ancre.x, ay: s.ancre.y, dx: cadre.dx, dy: cadre.dy, largeur: cadre.largeur, hauteur: cadre.hauteur };
})();

/** Portée d'une tour de tir de base, et de ralliement d'une caserne : ce qui compte pour dire qu'une case « voit » le chemin. */
const PORTEE = 3.5;

const distance = (a: Point, b: Point): number => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
const rectCase =(cx: number, cy: number): Rect => ({ x0: cx * T, y0: cy * T, x1: (cx + 1) * T, y1: (cy + 1) * T });
const distanceAuChemin = (m: CarteModele, p: Point): number => Math.min(...m.chemins.map((c) => distancePointChemin(p.x, p.y, c.points)));
const longueur = (points: readonly Point[]): number => points.reduce((t, p, i) => t + (i === 0 ? 0 : Math.abs(p.x - (points[i - 1]?.x ?? p.x)) + Math.abs(p.y - (points[i - 1]?.y ?? p.y))), 0);
/** Un niveau de moteur minimal sur la carte, avec tous ses chemins, tout son décor et son eau (comme dans niveaux.test.ts). */
const niveauDe = (m: CarteModele): Niveau => {
  const carte = { largeur: m.largeur, hauteur: m.hauteur, chemins: m.chemins, departHeros: m.departHeros };
  return {
    id: m.id,
    aretesDepart: 0,
    carte,
    casesInterdites: casesInterditesDuNiveau(carte, m.decor, zonesBloquantes(m)),
    vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 0, delai: 0 }] }],
  };
};

describe('les 10 cartes de la région 11', () => {
  it('une par niveau, de 32 × 18 tuiles, au jeu de tuiles de la région 11, branchées dans CARTES', () => {
    expect(cartes).toHaveLength(10);
    for (const m of cartes) {
      expect(m.region, m.id).toBe(11);
      expect([m.largeur, m.hauteur]).toEqual([32, 18]);
      expect(CARTES[m.id as keyof typeof CARTES], m.id).toBe(m);
    }
    expect(Object.keys(CARTES_REGION11)).toEqual([...Object.keys(COULOIRS), ...Object.keys(TRAJETS)]);
    expect(PLANS_REGION11.map((p) => p.carte)).toEqual(Object.keys(CARTES_REGION11));
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

  it.each(Object.entries(TRAJETS))('%s : à chaque bout, une place du radeau est à portée du chemin, à deux endroits éloignés', (id, trajet) => {
    const m = CARTES_REGION11[id as keyof typeof CARTES_REGION11];
    const places = PLACES[id] ?? [];
    expect(places.length).toBeGreaterThan(0);
    /** La place la plus proche du chemin quand le radeau est au centre de la case, et le point du chemin le plus proche d'elle. */
    const plusProche = ([cx, cy]: readonly [number, number]): { d: number; p: Point } => {
      const centre = centreCase(cx, cy);
      let meilleur = { d: Infinity, p: { x: 0, y: 0 } };
      for (const place of places) {
        const depuis = { x: centre.x + place.dx, y: centre.y + place.dy };
        for (const c of m.chemins) {
          c.points.forEach((b, i) => {
            const a = c.points[i - 1];
            if (!a) return;
            const pas = longueur([a, b]) * 4;
            for (let k = 0; k <= pas; k++) {
              const p = { x: a.x + ((b.x - a.x) * k) / pas, y: a.y + ((b.y - a.y) * k) / pas };
              const d = distance(p, depuis);
              if (d < meilleur.d) meilleur = { d, p };
            }
          });
        }
      }
      return meilleur;
    };
    const debut = plusProche(trajet[0] ?? [0, 0]);
    const fin = plusProche(trajet.at(-1) ?? [0, 0]);
    expect(debut.d).toBeLessThanOrEqual(PORTEE);
    expect(fin.d).toBeLessThanOrEqual(PORTEE);
    expect(distance(debut.p, fin.p)).toBeGreaterThanOrEqual(8);
  });

  it.each(Object.entries(TRAJETS))('%s : le radeau dessiné reste sur l’eau, hors du chemin, tout le long de son trajet', (id, trajet) => {
    const m = CARTES_REGION11[id as keyof typeof CARTES_REGION11];
    const tuiles = tuilesDeChemin(m);
    const eau = (tx: number, ty: number): boolean => m.zones.some((z) => z.sol === 'boue' && tx >= z.x && tx < z.x + z.largeur && ty >= z.y && ty < z.y + z.hauteur);
    // L'emprise dessinée du radeau (cadre de l'atlas, contour compris) autour de son centre, en tuiles.
    const x0 = (EMPRISE_RADEAU.dx - EMPRISE_RADEAU.ax) / 16;
    const y0 = (EMPRISE_RADEAU.dy - EMPRISE_RADEAU.ay) / 16;
    const x1 = x0 + EMPRISE_RADEAU.largeur / 16;
    const y1 = y0 + EMPRISE_RADEAU.hauteur / 16;
    const problemes = new Set<string>();
    // Le radeau va en ligne droite d'un centre de case au suivant : un huitième de case suffit, aucune tuile n'est sautée.
    trajet.forEach(([cx, cy], i) => {
      const [px, py] = trajet[i - 1] ?? [cx, cy];
      for (let k = 0; k <= 8; k++) {
        const c = centreCase(px + ((cx - px) * k) / 8, py + ((cy - py) * k) / 8);
        for (let ty = Math.floor(c.y + y0); ty < Math.ceil(c.y + y1); ty++) {
          for (let tx = Math.floor(c.x + x0); tx < Math.ceil(c.x + x1); tx++) {
            if (!eau(tx, ty)) problemes.add(`rive en (${String(tx)}, ${String(ty)})`);
            else if (tuiles[ty * m.largeur + tx]) problemes.add(`chemin en (${String(tx)}, ${String(ty)})`);
          }
        }
      }
    });
    expect([...problemes]).toEqual([]);
  });
});

describe('l’eau bloque la construction (niveaux 101 à 110)', () => {
  it('les 10 niveaux de la région 11 sont assemblés, chacun avec le gimmick de son plan', () => {
    expect(NIVEAUX_REGION11.map((n) => n.numero)).toEqual([101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
    NIVEAUX_REGION11.forEach((n, i) => {
      expect(n.niveau.gimmick, `niveau ${String(n.numero)}`).toEqual(PLANS_REGION11[i]?.gimmick);
      expect(n.niveau.gimmick?.type, `niveau ${String(n.numero)}`).toBe(i < 5 ? 'corbeaux' : 'radeau');
    });
  });

  it('aucune case qui touche l’eau n’est constructible, sur aucune des 10 cartes', () => {
    for (const n of NIVEAUX_REGION11) {
      const eau = n.visuel.zones.filter((z) => z.sol === 'boue');
      expect(eau.length, `niveau ${String(n.numero)}`).toBeGreaterThan(0);
      for (const z of eau) {
        for (let ty = z.y; ty < z.y + z.hauteur; ty++) {
          for (let tx = z.x; tx < z.x + z.largeur; tx++) {
            const [cx, cy] = [Math.floor(tx / T), Math.floor(ty / T)];
            expect(estCaseInterdite(n.niveau, cx, cy), `niveau ${String(n.numero)} : tuile d’eau (${String(tx)}, ${String(ty)}) constructible`).toBe(true);
          }
        }
      }
    }
  });

  it('les cases du trajet du radeau restent interdites (niveaux 106 à 110)', () => {
    for (const n of NIVEAUX_REGION11.slice(5)) {
      const gimmick = n.niveau.gimmick;
      if (gimmick?.type !== 'radeau') throw new Error(`niveau ${String(n.numero)} sans radeau`);
      for (const c of casesDuTrajet(gimmick)) expect(estCaseInterdite(n.niveau, c.cx, c.cy), `niveau ${String(n.numero)} : (${String(c.cx)}, ${String(c.cy)})`).toBe(true);
    }
  });

  it('seule l’eau de la région 11 bloque : ni ses pavés (planches de ponton), ni la boue des autres régions', () => {
    for (const m of Object.values(CARTES).filter((c) => c.region !== 11)) expect(zonesBloquantes(m), m.id).toEqual([]);
    for (const m of cartes) {
      expect(zonesBloquantes(m).length, m.id).toBeGreaterThan(0);
      expect(zonesBloquantes(m).every((z) => z.sol === 'boue'), m.id).toBe(true);
    }
  });
});
