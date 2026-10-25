import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Niveau, Point } from '../../engine/definitions';
import { fr } from '../../i18n/fr';
import { ENNEMIS } from '../ennemis';
import { budgetVague, menaceVague } from '../equilibrage';
import { REGLES } from '../regles';
import { FAMILLES, TOURS } from '../tours';
import type { NiveauCampagne } from '../visuel';
import { CARTES } from './cartes';
import { vaguesDuPlan } from './generation';
import { distancePointChemin, distanceRectChemin, rectsSeChevauchent } from './geometrie';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, empriseSocle, empriseSprite, GRANDS_DECORS, MARGE_DECOR } from './habillage';
import { PLANS_REGION1 } from './plan-region1';
import { NIVEAU_TEST, REGION1, TEXTES_REGION1 } from './region1';
import { VAGUES_REGION1 } from './vagues-region1';

interface SpriteAtlas {
  readonly categorie: string;
  readonly largeur: number;
  readonly hauteur: number;
}
const ATLAS = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas.json', import.meta.url), 'utf8')) as { sprites: Record<string, SpriteAtlas> }).sprites;

/** Portée de la plus courte des tours de tir, de magie ou d'artillerie au niveau 1 : un socle doit y voir le chemin. */
const PORTEE_TIR_MIN = Math.min(...FAMILLES.filter((f) => f !== 'caserne').map((f) => TOURS[f].niveaux[0].portee));
const PORTEE_CASERNE = TOURS.caserne.niveaux[0].portee;
/** Distance minimale d'un socle au bord haut et au bord bas de la carte (tuiles). */
const MARGE_HAUT_BAS_SOCLE = 1.5;

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

  carte.socles.forEach((s, i) => {
    const quoi = `${nom} socle ${String(i)} (${String(s.x)},${String(s.y)})`;
    expect(s.x >= 1 && s.x <= carte.largeur - 1 && s.y >= 1 && s.y <= carte.hauteur - 1, `${quoi} : trop près du bord`).toBe(true);
    // Les barres du HUD recouvrent le haut et le bas de l'écran : la caméra ne peut pas dépasser de beaucoup la carte.
    expect(s.y >= MARGE_HAUT_BAS_SOCLE && s.y <= carte.hauteur - MARGE_HAUT_BAS_SOCLE, `${quoi} : à moins de ${String(MARGE_HAUT_BAS_SOCLE)} tuile du bord haut ou bas`).toBe(true);
    const d = distanceAuNiveau(niveau, s);
    expect(d, `${quoi} : sur le chemin`).toBeGreaterThanOrEqual(1);
    expect(d, `${quoi} : hors de portée de tir du chemin`).toBeLessThanOrEqual(PORTEE_TIR_MIN);
    // La pierre du socle ne mord pas sur le couloir dessiné du chemin.
    const pierre = empriseSocle(s.x, s.y);
    for (const c of carte.chemins) {
      expect(distanceRectChemin(pierre, c.points), `${quoi} : la pierre touche le couloir du chemin`).toBeGreaterThanOrEqual(DEMI_LARGEUR_CHEMIN);
    }
    // Le ralliement de la caserne est sur le chemin et à portée de la tour.
    expect(distanceAuNiveau(niveau, s.ralliement), `${quoi} : ralliement hors du chemin`).toBeLessThanOrEqual(0.01);
    expect(dist(s, s.ralliement), `${quoi} : ralliement hors de portée de la caserne`).toBeLessThanOrEqual(PORTEE_CASERNE);
    expect(s.ralliement.x >= 0 && s.ralliement.x <= carte.largeur && s.ralliement.y >= 0 && s.ralliement.y <= carte.hauteur, `${quoi} : ralliement hors carte`).toBe(true);
    carte.socles.forEach((autre, j) => {
      if (j > i) expect(rectsSeChevauchent(empriseSprite(s.x, s.y), empriseSprite(autre.x, autre.y)), `${quoi} chevauche le socle ${String(j)}`).toBe(false);
    });
  });

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

describe('validité des cartes', () => {
  for (const campagne of REGION1) {
    it(`niveau ${String(campagne.numero)} : chemins, socles, ralliements, héros et paquets sont valides`, () => {
      verifierCarte(campagne.niveau);
    });
  }

  it('le niveau de test de la région 1 passe les mêmes contrôles', () => {
    verifierCarte(NIVEAU_TEST);
  });

  it('chaque carte dessinée est valide avec tous ses chemins et tous ses socles', () => {
    for (const modele of Object.values(CARTES)) {
      verifierCarte({
        id: modele.id,
        aretesDepart: 0,
        carte: { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins, socles: modele.socles, departHeros: modele.departHeros },
        vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 0, delai: 0 }] }],
      });
    }
  });

  it('un niveau dégénéré est refusé par les contrôles (le test détecte bien les erreurs)', () => {
    const base = REGION1[0]?.niveau;
    if (!base) throw new Error('niveau 1 absent');
    const copie = (modif: (n: Niveau) => Niveau): Niveau => modif(JSON.parse(JSON.stringify(base)) as Niveau);
    const socleSurChemin = copie((n) => ({ ...n, carte: { ...n.carte, socles: [{ x: 8, y: 4, ralliement: { x: 8, y: 4 } }] } }));
    expect(() => { verifierCarte(socleSurChemin); }).toThrow();
    const socleLoin = copie((n) => ({ ...n, carte: { ...n.carte, socles: [{ x: 20, y: 1.5, ralliement: { x: 20, y: 4 } }] } }));
    expect(() => { verifierCarte(socleLoin); }).toThrow();
    const ralliementHorsChemin = copie((n) => ({ ...n, carte: { ...n.carte, socles: [{ x: 4, y: 6, ralliement: { x: 4, y: 6 } }] } }));
    expect(() => { verifierCarte(ralliementHorsChemin); }).toThrow();
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

  it('le niveau 1 a un chemin et 6 socles ; les entrées multiples viennent ensuite', () => {
    const n1 = REGION1[0]?.niveau;
    expect(n1?.carte.chemins.length).toBe(1);
    expect(n1?.carte.socles.length).toBe(6);
    const entrees = REGION1.map((n) => n.niveau.carte.chemins.length);
    expect(entrees.slice(0, 4)).toEqual([1, 1, 1, 1]);
    for (const e of entrees.slice(4)) expect(e).toBeGreaterThanOrEqual(2);
    expect(Math.max(...entrees)).toBe(3);
    for (const n of REGION1) {
      expect(n.niveau.carte.socles.length).toBeGreaterThanOrEqual(6);
      expect(n.niveau.carte.socles.length).toBeLessThanOrEqual(10);
    }
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
    PLANS_REGION1.forEach((plan, i) => {
      if (plan.vagues.retouchees === true) return;
      expect(VAGUES_REGION1[i], `niveau ${String(plan.numero)} : relancer npm run niveaux`).toEqual(vaguesDuPlan(plan));
    });
    expect(VAGUES_REGION1.length).toBe(PLANS_REGION1.length);
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

  it('chaque niveau est habillé : région 1, décor de la région, des zones de boue ou de pavés', () => {
    for (const n of REGION1) {
      expect(n.visuel.region).toBe(1);
      expect(n.visuel.decor.length, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(20);
      expect(n.visuel.zones.length).toBeGreaterThanOrEqual(2);
      expect(new Set(decorsUtilises(n)).size).toBeGreaterThanOrEqual(8);
    }
    const tous = new Set(REGION1.flatMap(decorsUtilises));
    for (const attendu of ['maison-ruine-1', 'maison-ruine-2', 'arbre-mort-1', 'arbre-mort-2', 'puits', 'potence', 'bucher-eteint', 'cloture-h', 'tonneau', 'croix']) {
      expect(tous.has(attendu), attendu).toBe(true);
    }
  });

  it('le décor ne recouvre ni un chemin ni un socle du niveau, et reste dans la carte', () => {
    const problemes: string[] = [];
    for (const n of REGION1) {
      const { carte } = n.niveau;
      for (const d of n.visuel.decor) {
        const quoi = `niveau ${String(n.numero)} : ${d.sprite} en (${String(d.x)},${String(d.y)})`;
        const r = empriseDecor(d);
        if (!(r.x0 >= 0 && r.x1 <= carte.largeur && r.y0 >= 0 && r.y1 <= carte.hauteur)) problemes.push(`${quoi} sort de la carte`);
        if (carte.chemins.some((c) => distanceRectChemin(r, c.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR)) problemes.push(`${quoi} sur le chemin`);
        if (carte.socles.some((s) => rectsSeChevauchent(r, empriseSprite(s.x, s.y)))) problemes.push(`${quoi} sur un socle`);
      }
    }
    expect(problemes).toEqual([]);
  });

  it('les zones de sol restent dans la carte, en tuiles entières', () => {
    for (const n of REGION1) {
      for (const z of n.visuel.zones) {
        expect(['boue', 'paves']).toContain(z.sol);
        expect([z.x, z.y, z.largeur, z.hauteur].every(Number.isInteger)).toBe(true);
        expect(z.x >= 0 && z.y >= 0 && z.largeur > 0 && z.hauteur > 0 && z.x + z.largeur <= 32 && z.y + z.hauteur <= 18).toBe(true);
      }
    }
  });

  it('les décors posés sur un chemin ou un socle inutilisé réapparaissent là où ils sont libres', () => {
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
    expect(TEXTES_REGION1.length).toBe(10);
    const cles = new Set(Object.keys(fr));
    const textes = fr as Record<string, string>;
    const vus = new Set<string>();
    for (const t of TEXTES_REGION1) {
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
