import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Niveau, Point } from '../../engine/definitions';
import { caseExiste, casesLibres, centreCase, estCaseInterdite } from '../../engine/grille';
import { fr } from '../../i18n/fr';
import { ENNEMIS } from '../ennemis';
import { budgetVague, menaceVague } from '../equilibrage';
import { REGLES } from '../regles';
import { FAMILLES, TOURS } from '../tours';
import type { NiveauCampagne } from '../visuel';
import { CARTES } from './cartes-toutes';
import { vaguesDuPlan } from './generation';
import { distancePointChemin, distanceRectChemin, rectsSeChevauchent } from './geometrie';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, GRANDS_DECORS, MARGE_DECOR } from './habillage';
import { casesInterditesDuNiveau, tuilesDeChemin } from './grille-niveau';
import { CAMPAGNE, TEXTES_REGIONS, VAGUES_REGIONS } from './campagne';
import { PLANS_REGION1 } from './plan-region1';
import { PLANS_REGIONS } from './plans';
import { NIVEAU_TEST, REGION1 } from './region1';

interface SpriteAtlas {
  readonly categorie: string;
  readonly largeur: number;
  readonly hauteur: number;
}
const ATLAS = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas.json', import.meta.url), 'utf8')) as { sprites: Record<string, SpriteAtlas> }).sprites;

/** Portée de la plus courte des tours de tir, de magie ou d'artillerie au niveau 1 : une case utile doit y voir le chemin. */
const PORTEE_TIR_MIN = Math.min(...FAMILLES.filter((f) => f !== 'caserne').map((f) => TOURS[f].niveaux[0].portee));

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

function distanceAuNiveau(niveau: Niveau, p: Point): number {
  return Math.min(...niveau.carte.chemins.map((c) => distancePointChemin(p.x, p.y, c.points)));
}

/** Contrôles de géométrie d'une carte de moteur, valables pour tout niveau (campagne, test, futurs). */
function verifierCarte(niveau: Niveau): void {
  const { carte } = niveau;
  const nom = niveau.id;
  expect(carte.chemins.length, `${nom} : au moins un chemin`).toBeGreaterThanOrEqual(1);
  carte.chemins.forEach((chemin, i) => {
    const pts = chemin.points;
    expect(pts.length, `${nom} chemin ${String(i)} : au moins 2 points`).toBeGreaterThanOrEqual(2);
    let longueur = 0;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1];
      const b = pts[k];
      if (!a || !b) continue;
      const l = dist(a, b);
      expect(l, `${nom} chemin ${String(i)} : segment ${String(k)} de longueur nulle`).toBeGreaterThan(0);
      longueur += l;
    }
    expect(longueur, `${nom} chemin ${String(i)} : trop court`).toBeGreaterThan(20);
    for (const p of pts) {
      expect(p.x >= -2 && p.x <= carte.largeur + 2 && p.y >= -2 && p.y <= carte.hauteur + 2, `${nom} chemin ${String(i)} : point hors de la carte`).toBe(true);
    }
    const premier = pts[0];
    const dernier = pts.at(-1);
    const dehors = (p: Point | undefined): boolean => !!p && (p.x < 0 || p.x > carte.largeur || p.y < 0 || p.y > carte.hauteur);
    expect(dehors(premier), `${nom} chemin ${String(i)} : l'entrée doit être hors de la carte`).toBe(true);
    expect(dehors(dernier), `${nom} chemin ${String(i)} : la sortie doit être hors de la carte`).toBe(true);
  });

  // Grille de construction : cases interdites dans la grille, sans doublon, et qui couvrent chaque tuile du chemin.
  const vues = new Set<string>();
  for (const c of niveau.casesInterdites) {
    expect(caseExiste(carte, c.cx, c.cy), `${nom} : case interdite (${String(c.cx)},${String(c.cy)}) hors de la grille`).toBe(true);
    const cle = `${String(c.cx)},${String(c.cy)}`;
    expect(vues.has(cle), `${nom} : case interdite ${cle} en double`).toBe(false);
    vues.add(cle);
  }
  const tuiles = tuilesDeChemin(carte);
  for (let ty = 0; ty < carte.hauteur; ty++) {
    for (let tx = 0; tx < carte.largeur; tx++) {
      if (tuiles[ty * carte.largeur + tx] === 1) {
        const cx = Math.floor(tx / REGLES.tailleCase);
        const cy = Math.floor(ty / REGLES.tailleCase);
        expect(estCaseInterdite(niveau, cx, cy), `${nom} : la tuile (${String(tx)},${String(ty)}) du chemin est dans une case libre`).toBe(true);
      }
    }
  }

  expect(distanceAuNiveau(niveau, carte.departHeros), `${nom} : le héros doit partir du chemin`).toBeLessThanOrEqual(REGLES.distanceMaxChemin);
  for (const p of [carte.departHeros]) expect(p.x >= 0 && p.x <= carte.largeur && p.y >= 0 && p.y <= carte.hauteur).toBe(true);

  niveau.vagues.forEach((vague, w) => {
    expect(vague.paquets.length, `${nom} vague ${String(w + 1)} vide`).toBeGreaterThan(0);
    for (const p of vague.paquets) {
      expect(Object.hasOwn(ENNEMIS, p.ennemi), `${nom} : ennemi ${p.ennemi}`).toBe(true);
      expect(Number.isInteger(p.chemin) && p.chemin >= 0 && p.chemin < carte.chemins.length, `${nom} vague ${String(w + 1)} : indice de chemin ${String(p.chemin)}`).toBe(true);
      expect(Number.isInteger(p.nombre) && p.nombre >= 1, `${nom} : nombre`).toBe(true);
      expect(p.intervalle >= 0 && p.delai >= 0, `${nom} : durées`).toBe(true);
    }
  });
}

describe('grille de construction des 50 niveaux', () => {
  const taille = REGLES.tailleCase;

  it('chaque niveau a ses cases interdites tirées de son chemin et de ses grands décors visibles', () => {
    for (const n of CAMPAGNE) {
      const { carte } = n.niveau;
      expect(n.niveau.casesInterdites, `niveau ${String(n.numero)}`).toEqual(casesInterditesDuNiveau(carte, n.visuel.decor));
      expect(n.niveau.casesInterdites.length, `niveau ${String(n.numero)}`).toBeGreaterThan(0);
    }
  });

  it('une tuile entière couverte par un grand décor visible est dans une case interdite', () => {
    const problemes: string[] = [];
    for (const n of CAMPAGNE) {
      for (const d of n.visuel.decor.filter((v) => GRANDS_DECORS.has(v.sprite))) {
        // Les tuiles dont le centre est franchement dans le rectangle du sprite (32×32, ancré au pied).
        for (let ty = Math.floor(d.y - 2); ty < d.y; ty++) {
          for (let tx = Math.floor(d.x - 1); tx < d.x + 1; tx++) {
            const dedans = tx + 0.5 > d.x - 0.9 && tx + 0.5 < d.x + 0.9 && ty + 0.5 > d.y - 1.9 && ty + 0.5 < d.y - 0.1;
            const cx = Math.floor(tx / taille);
            const cy = Math.floor(ty / taille);
            if (dedans && caseExiste(n.niveau.carte, cx, cy) && !estCaseInterdite(n.niveau, cx, cy)) {
              problemes.push(`niveau ${String(n.numero)} : ${d.sprite} en (${String(d.x)},${String(d.y)}), case (${String(cx)},${String(cy)}) libre`);
            }
          }
        }
      }
    }
    expect(problemes).toEqual([]);
  });

  it('une case interdite l’est pour une raison : chemin ou grand décor visible sur l’une de ses tuiles', () => {
    const problemes: string[] = [];
    for (const n of CAMPAGNE) {
      const { carte } = n.niveau;
      const chemin = tuilesDeChemin(carte);
      const grands = n.visuel.decor.filter((d) => GRANDS_DECORS.has(d.sprite)).map(empriseDecor);
      for (const c of n.niveau.casesInterdites) {
        const rect = { x0: c.cx * taille, y0: c.cy * taille, x1: (c.cx + 1) * taille, y1: (c.cy + 1) * taille };
        let surChemin = false;
        for (let ty = rect.y0; ty < rect.y1; ty++) for (let tx = rect.x0; tx < rect.x1; tx++) surChemin ||= chemin[ty * carte.largeur + tx] === 1;
        if (!surChemin && !grands.some((g) => rectsSeChevauchent(rect, g))) problemes.push(`niveau ${String(n.numero)} : case (${String(c.cx)},${String(c.cy)}) interdite sans raison`);
      }
    }
    expect(problemes).toEqual([]);
  });

  it('les petits décors (cailloux, touffes, tonneaux, croix…) ne bloquent aucune case', () => {
    for (const n of CAMPAGNE) {
      const petits = n.visuel.decor.filter((d) => !GRANDS_DECORS.has(d.sprite));
      expect(petits.length, `niveau ${String(n.numero)}`).toBeGreaterThan(0);
      const sans = casesInterditesDuNiveau(n.niveau.carte, n.visuel.decor.filter((d) => GRANDS_DECORS.has(d.sprite)));
      expect(sans, `niveau ${String(n.numero)}`).toEqual(n.niveau.casesInterdites);
    }
  });

  it('laisse assez de cases libres, dont assez à portée de tir du chemin', () => {
    for (const n of CAMPAGNE) {
      const libres = casesLibres({ niveau: n.niveau, tours: [] });
      expect(libres.length, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(40);
      const utiles = libres.filter((c) => distanceAuNiveau(n.niveau, centreCase(c.cx, c.cy)) <= PORTEE_TIR_MIN);
      expect(utiles.length, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('validité des cartes', () => {
  for (const campagne of CAMPAGNE) {
    it(`niveau ${String(campagne.numero)} : chemins, socles, ralliements, héros et paquets sont valides`, () => {
      verifierCarte(campagne.niveau);
    });
  }

  it('le niveau de test de la région 1 passe les mêmes contrôles', () => {
    verifierCarte(NIVEAU_TEST);
  });

  it('chaque carte dessinée est valide avec tous ses chemins et tout son décor', () => {
    for (const modele of Object.values(CARTES)) {
      const carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins, departHeros: modele.departHeros };
      verifierCarte({
        id: modele.id,
        aretesDepart: 0,
        carte,
        casesInterdites: casesInterditesDuNiveau(carte, modele.decor),
        vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 0, delai: 0 }] }],
      });
    }
  });

  it('un niveau dégénéré est refusé par les contrôles (le test détecte bien les erreurs)', () => {
    const base = REGION1[0]?.niveau;
    if (!base) throw new Error('niveau 1 absent');
    const copie = (modif: (n: Niveau) => Niveau): Niveau => modif(JSON.parse(JSON.stringify(base)) as Niveau);
    const cheminLibre = copie((n) => ({ ...n, casesInterdites: [] }));
    expect(() => { verifierCarte(cheminLibre); }).toThrow();
    const caseHorsGrille = copie((n) => ({ ...n, casesInterdites: [...n.casesInterdites, { cx: 16, cy: 0 }] }));
    expect(() => { verifierCarte(caseHorsGrille); }).toThrow();
    const caseEnDouble = copie((n) => ({ ...n, casesInterdites: [...n.casesInterdites, ...n.casesInterdites.slice(0, 1)] }));
    expect(() => { verifierCarte(caseEnDouble); }).toThrow();
    const heros = copie((n) => ({ ...n, carte: { ...n.carte, departHeros: { x: 2, y: 10 } } }));
    expect(() => { verifierCarte(heros); }).toThrow();
    const cheminDegenere = copie((n) => ({ ...n, carte: { ...n.carte, chemins: [{ points: [{ x: -1, y: 4 }, { x: -1, y: 4 }] }] } }));
    expect(() => { verifierCarte(cheminDegenere); }).toThrow();
    const paquet = copie((n) => ({ ...n, vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 5, delai: 0 }] }] }));
    expect(() => { verifierCarte(paquet); }).toThrow();
  });
});

describe('progression de la région', () => {
  it('compte 10 niveaux numérotés de 1 à 10, avec des identifiants distincts', () => {
    expect(REGION1.map((n) => n.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(REGION1.map((n) => n.niveau.id)).size).toBe(10);
  });

  it('réutilise 4 cartes dessinées à la main de 32 × 18 tuiles', () => {
    expect(PLANS_REGION1.length).toBe(10);
    expect(new Set(PLANS_REGION1.map((p) => p.carte)).size).toBe(4);
    for (const n of REGION1) expect([n.niveau.carte.largeur, n.niveau.carte.hauteur]).toEqual([32, 18]);
  });

  it('le niveau 1 a un chemin ; les entrées multiples viennent ensuite', () => {
    const n1 = REGION1[0]?.niveau;
    expect(n1?.carte.chemins.length).toBe(1);
    const entrees = REGION1.map((n) => n.niveau.carte.chemins.length);
    expect(entrees.slice(0, 4)).toEqual([1, 1, 1, 1]);
    for (const e of entrees.slice(4)) expect(e).toBeGreaterThanOrEqual(2);
    expect(Math.max(...entrees)).toBe(3);
  });

  it('le niveau 10 est le seul boss : le Boucher de Vaudrelle arrive dans sa dernière vague', () => {
    expect(REGION1.filter((n) => n.boss).map((n) => n.numero)).toEqual([10]);
    for (const n of REGION1) {
      const avecBoss = n.niveau.vagues.flatMap((v, i) => (v.paquets.some((p) => p.ennemi === 'boucher_vaudrelle') ? [i] : []));
      expect(avecBoss, `niveau ${String(n.numero)}`).toEqual(n.numero === 10 ? [n.niveau.vagues.length - 1] : []);
    }
  });

  it('chaque niveau a de 6 à 12 vagues, et leur nombre ne baisse jamais', () => {
    const nombres = REGION1.map((n) => n.niveau.vagues.length);
    for (const nb of nombres) {
      expect(nb).toBeGreaterThanOrEqual(6);
      expect(nb).toBeLessThanOrEqual(12);
    }
    for (let i = 1; i < nombres.length; i++) expect(nombres[i]).toBeGreaterThanOrEqual(nombres[i - 1] ?? 0);
  });

  it('débloque les ennemis progressivement : paysan dès 1, mendiant dès 3, chien errant dès 5', () => {
    const premier = (id: string): number => REGION1.find((n) => n.niveau.vagues.some((v) => v.paquets.some((p) => p.ennemi === id)))?.numero ?? 0;
    expect(premier('paysan_affame')).toBe(1);
    expect(premier('mendiant')).toBe(3);
    expect(premier('chien_errant')).toBe(5);
    expect(premier('boucher_vaudrelle')).toBe(10);
  });

  it('les vagues d’un niveau suivent le budget de menace b(L, w), hors boss', () => {
    for (const n of REGION1) {
      n.niveau.vagues.forEach((vague, w) => {
        const ordinaires = { paquets: vague.paquets.filter((p) => !ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss) };
        const budget = budgetVague(n.numero, w + 1);
        const menace = menaceVague(ordinaires, ENNEMIS);
        expect(menace, `niveau ${String(n.numero)} vague ${String(w + 1)}`).toBeLessThanOrEqual(budget);
        expect(menace, `niveau ${String(n.numero)} vague ${String(w + 1)}`).toBeGreaterThan(budget * 0.8);
      });
    }
  });

  it('la menace des vagues croît d’un niveau à l’autre pour une même vague', () => {
    const menaces = REGION1.map((n) => menaceVague(n.niveau.vagues[5] ?? { paquets: [] }, ENNEMIS));
    for (let i = 1; i < menaces.length; i++) expect(menaces[i]).toBeGreaterThan((menaces[i - 1] ?? 0) * 0.9);
  });
});

describe('vagues figées', () => {
  it('correspondent à ce que produit le générateur depuis le plan (sinon : npm run niveaux)', () => {
    PLANS_REGIONS.forEach((plans, region) => {
      const vagues = VAGUES_REGIONS[region] ?? [];
      plans.forEach((plan, i) => {
        if (plan.vagues.retouchees === true) return;
        expect(vagues[i], `niveau ${String(plan.numero)} : relancer npm run niveaux`).toEqual(vaguesDuPlan(plan));
      });
      expect(vagues.length, `région ${String(region + 1)}`).toBe(plans.length);
    });
  });
});

describe('habillage', () => {
  const decorsUtilises = (n: NiveauCampagne): string[] => n.visuel.decor.map((d) => d.sprite);

  it('les sprites de décor existent dans l’atlas, et les grands font 32 × 32', () => {
    for (const modele of Object.values(CARTES)) {
      for (const d of modele.decor) {
        const sprite = ATLAS[d.sprite];
        expect(sprite, `${modele.id} : sprite ${d.sprite}`).toBeDefined();
        expect(['decor', 'tuile']).toContain(sprite?.categorie);
        expect(GRANDS_DECORS.has(d.sprite), `${d.sprite} : taille`).toBe((sprite?.largeur ?? 0) === 32);
      }
    }
  });

  it('chaque niveau est habillé : jeu de tuiles de sa région, décor, des zones de boue ou de pavés', () => {
    for (const n of CAMPAGNE) {
      expect(n.visuel.region, `niveau ${String(n.numero)}`).toBe(Math.floor((n.numero - 1) / 10) + 1);
      expect(n.visuel.decor.length, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(20);
      expect(n.visuel.zones.length).toBeGreaterThanOrEqual(2);
      expect(new Set(decorsUtilises(n)).size, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(8);
    }
    const tous = new Set(REGION1.flatMap(decorsUtilises));
    for (const attendu of ['maison-ruine-1', 'maison-ruine-2', 'arbre-mort-1', 'arbre-mort-2', 'puits', 'potence', 'bucher-eteint', 'cloture-h', 'tonneau', 'croix']) {
      expect(tous.has(attendu), attendu).toBe(true);
    }
  });

  it('le décor ne recouvre pas un chemin du niveau, et reste dans la carte', () => {
    const problemes: string[] = [];
    for (const n of CAMPAGNE) {
      const { carte } = n.niveau;
      for (const d of n.visuel.decor) {
        const quoi = `niveau ${String(n.numero)} : ${d.sprite} en (${String(d.x)},${String(d.y)})`;
        const r = empriseDecor(d);
        if (!(r.x0 >= 0 && r.x1 <= carte.largeur && r.y0 >= 0 && r.y1 <= carte.hauteur)) problemes.push(`${quoi} sort de la carte`);
        if (carte.chemins.some((c) => distanceRectChemin(r, c.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR)) problemes.push(`${quoi} sur le chemin`);
      }
    }
    expect(problemes).toEqual([]);
  });

  it('les zones de sol restent dans la carte, en tuiles entières', () => {
    for (const n of CAMPAGNE) {
      for (const z of n.visuel.zones) {
        expect(['boue', 'paves']).toContain(z.sol);
        expect([z.x, z.y, z.largeur, z.hauteur].every(Number.isInteger)).toBe(true);
        expect(z.x >= 0 && z.y >= 0 && z.largeur > 0 && z.hauteur > 0 && z.x + z.largeur <= 32 && z.y + z.hauteur <= 18).toBe(true);
      }
    }
  });

  it('les décors posés sur un chemin inutilisé réapparaissent là où ils sont libres', () => {
    // Le décor du couloir du chemin 1 de la carte des Chaumes est visible au niveau 1 (un seul chemin), pas au niveau 5.
    const niveau1 = REGION1[0];
    const niveau5 = REGION1[4];
    const maison = (n: NiveauCampagne | undefined): boolean => !!n?.visuel.decor.some((d) => d.sprite === 'maison-ruine-2' && d.x === 3 && d.y === 16);
    expect(maison(niveau1)).toBe(true);
    expect(maison(niveau5)).toBe(false);
  });
});

describe('textes', () => {
  it('chaque niveau a un nom et une phrase d’ambiance en français, distincts', () => {
    expect(TEXTES_REGIONS.map((t) => t.length)).toEqual([10, 10, 10, 10, 10]);
    const cles = new Set(Object.keys(fr));
    const textes = fr as Record<string, string>;
    const vus = new Set<string>();
    for (const t of TEXTES_REGIONS.flat()) {
      for (const cle of [t.nom, t.ambiance]) {
        expect(cles.has(cle), cle).toBe(true);
        const texte = textes[cle] ?? '';
        expect(texte.length).toBeGreaterThan(3);
        expect(vus.has(texte), `texte en double : ${texte}`).toBe(false);
        vus.add(texte);
      }
      expect((textes[t.ambiance] ?? '').length, t.ambiance).toBeLessThanOrEqual(120);
    }
  });
});
