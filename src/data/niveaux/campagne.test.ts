// La campagne des régions 1 à 5 : 50 niveaux, 16 cartes (3 nouvelles par région 2 à 5), ennemis et boss de chaque région,
// essaims, vagues dans le budget de menace, défi Fer jouable. Les contrôles de géométrie des cartes et de l'habillage sont
// dans niveaux.test.ts, qui parcourt aussi toute la campagne.
import { describe, expect, it } from 'vitest';
import type { DefEnnemi, Niveau } from '../../engine/definitions';
import { CONFIG, niveauEssai } from '../../engine/aides.test-utils';
import { creerPartie } from '../../engine/partie';
import { ENNEMIS, type IdEnnemi } from '../ennemis';
import { budgetVague, menaceVague } from '../equilibrage';
import { FAMILLES } from '../tours';
import type { NiveauCampagne } from '../visuel';
import { CAMPAGNE, REGIONS, niveauDeCampagne } from './campagne';
import { CARTES } from './cartes-toutes';
import { BOSS_REGIONS, ENNEMIS_REGIONS, ennemisDuNiveau } from './plan-niveau';
import { PLANS_REGIONS } from './plans';

const REGIONS_NOUVELLES = [2, 3, 4, 5];
const region = (numero: number): number => Math.floor((numero - 1) / 10) + 1;
const rang = (numero: number): number => ((numero - 1) % 10) + 1;
const definition = (id: string): DefEnnemi => ENNEMIS[id as IdEnnemi];
const ennemisDe = (n: NiveauCampagne): Set<string> => new Set(n.niveau.vagues.flatMap((v) => v.paquets.map((p) => p.ennemi)));

describe('les 50 niveaux', () => {
  it('sont numérotés de 1 à 50, par régions de 10, avec des identifiants distincts', () => {
    expect(CAMPAGNE.map((n) => n.numero)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(REGIONS.map((r) => r.length)).toEqual([10, 10, 10, 10, 10]);
    expect(new Set(CAMPAGNE.map((n) => n.niveau.id)).size).toBe(50);
    for (const n of CAMPAGNE) expect(n.niveau.id).toBe(`r${String(region(n.numero))}-${String(rang(n.numero)).padStart(2, '0')}`);
  });

  it('niveauDeCampagne rend le niveau de ce numéro', () => {
    expect(niveauDeCampagne(1)?.niveau.id).toBe('r1-01');
    expect(niveauDeCampagne(37)?.niveau.id).toBe('r4-07');
    expect(niveauDeCampagne(50)?.niveau.id).toBe('r5-10');
    expect(niveauDeCampagne(0)).toBeUndefined();
    expect(niveauDeCampagne(51)).toBeUndefined();
  });

  it('suivent leur plan : numéro, entrées, arêtes de départ', () => {
    PLANS_REGIONS.flat().forEach((plan, i) => {
      const n = CAMPAGNE[i];
      expect(n?.numero).toBe(plan.numero);
      expect(n?.niveau.carte.chemins.length).toBe(plan.chemins.length);
      expect(n?.niveau.aretesDepart).toBe(plan.aretesDepart);
      expect(n?.niveau.defiFer).toEqual(plan.defiFer);
    });
  });

  it('laissent de 40 à 110 cases libres sur 144, une ou deux entrées (trois au plus pour la région 1)', () => {
    for (const n of CAMPAGNE) {
      const libres = 144 - n.niveau.casesInterdites.length;
      expect(libres, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(40);
      expect(libres, `niveau ${String(n.numero)}`).toBeLessThanOrEqual(110);
      if (n.numero > 10) expect(n.niveau.carte.chemins.length, `niveau ${String(n.numero)}`).toBeLessThanOrEqual(2);
    }
  });

  it('les arêtes de départ sont des multiples de 5, du même ordre que le budget de la première vague', () => {
    for (const n of CAMPAGNE) {
      expect(n.niveau.aretesDepart % 5, `niveau ${String(n.numero)}`).toBe(0);
      const budget = budgetVague(n.numero, 1);
      expect(n.niveau.aretesDepart, `niveau ${String(n.numero)}`).toBeGreaterThan(budget * 0.3);
      expect(n.niveau.aretesDepart, `niveau ${String(n.numero)}`).toBeLessThan(budget * 4);
    }
  });
});

describe('les 12 nouvelles cartes', () => {
  const nouvelles = Object.values(CARTES).filter((c) => c.region >= 2);

  it('sont trois par région 2 à 5, de 32 × 18 tuiles, avec un jeu de tuiles de leur région', () => {
    expect(nouvelles).toHaveLength(12);
    for (const r of REGIONS_NOUVELLES) {
      const cartes = nouvelles.filter((c) => c.region === r);
      expect(cartes, `région ${String(r)}`).toHaveLength(3);
      // La première a un seul chemin, les deux autres en ont deux.
      expect(cartes.map((c) => c.chemins.length), `région ${String(r)}`).toEqual([1, 2, 2]);
    }
    for (const c of nouvelles) expect([c.largeur, c.hauteur]).toEqual([32, 18]);
    expect(Object.values(CARTES).filter((c) => c.region === 1)).toHaveLength(4);
  });

  it('ont au moins 40 décors et 3 zones de sol', () => {
    for (const c of nouvelles) {
      expect(c.decor.length, c.id).toBeGreaterThanOrEqual(40);
      expect(c.zones.length, c.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('chaque niveau n’utilise que des cartes de sa région, et chaque carte sert au moins deux fois', () => {
    for (const plan of PLANS_REGIONS.flat()) expect(CARTES[plan.carte].region, `niveau ${String(plan.numero)}`).toBe(region(plan.numero));
    for (const c of nouvelles) expect(PLANS_REGIONS.flat().filter((p) => p.carte === c.id).length, c.id).toBeGreaterThanOrEqual(2);
  });

});

describe('ennemis des régions', () => {
  it('chaque région a trois ennemis ordinaires et un boss, tous dans les données', () => {
    expect(ENNEMIS_REGIONS).toHaveLength(5);
    for (const liste of ENNEMIS_REGIONS) {
      expect(liste).toHaveLength(3);
      for (const id of liste) expect(definition(id).boss, id).toBe(false);
    }
    for (const id of BOSS_REGIONS) expect(definition(id).boss, id).toBe(true);
  });

  it('un niveau de région 2 à 5 emploie les ennemis de sa région, puis dès le niveau 4 ceux des régions précédentes', () => {
    for (const r of REGIONS_NOUVELLES) {
      const propres = ENNEMIS_REGIONS[r - 1] ?? [];
      const anciens = ENNEMIS_REGIONS.slice(0, r - 1).flat();
      for (let k = 1; k <= 10; k++) {
        const liste = ennemisDuNiveau(r, k);
        expect(liste.filter((e) => propres.includes(e)), `région ${String(r)} niveau ${String(k)}`).toEqual(propres.slice(0, k));
        if (k < 4) expect(liste.some((e) => anciens.includes(e)), `région ${String(r)} niveau ${String(k)}`).toBe(false);
        else expect([...liste].sort(), `région ${String(r)} niveau ${String(k)}`).toEqual([...propres, ...anciens].sort());
      }
    }
  });

  it('les vagues ne contiennent que les ennemis permis, et tous les ennemis de la région avant le niveau 4', () => {
    for (const r of REGIONS_NOUVELLES) {
      const propres = ENNEMIS_REGIONS[r - 1] ?? [];
      REGIONS[r - 1]?.forEach((n, i) => {
        const permis = new Set<string>([...ennemisDuNiveau(r, i + 1), ...(i === 9 ? [BOSS_REGIONS[r - 1] ?? ''] : [])]);
        for (const e of ennemisDe(n)) expect(permis.has(e), `niveau ${String(n.numero)} : ${e}`).toBe(true);
        // Les ennemis propres au niveau y apparaissent (le premier est toujours là, les autres presque).
        expect(ennemisDe(n).has(propres[0] ?? ''), `niveau ${String(n.numero)}`).toBe(true);
      });
    }
  });

  it('les niveaux 4 à 10 mélangent des ennemis de plusieurs régions', () => {
    for (const r of REGIONS_NOUVELLES) {
      const anciens = new Set<string>(ENNEMIS_REGIONS.slice(0, r - 1).flat());
      const niveaux = (REGIONS[r - 1] ?? []).slice(3);
      const avecAnciens = niveaux.filter((n) => [...ennemisDe(n)].some((e) => anciens.has(e)));
      expect(avecAnciens.length, `région ${String(r)}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('les essaims arrivent par groupes entiers (6 sangsues, 8 rats de peste)', () => {
    let vus = 0;
    for (const n of CAMPAGNE) {
      for (const [w, v] of n.niveau.vagues.entries()) {
        for (const p of v.paquets) {
          const groupe = definition(p.ennemi).pouvoirs?.essaim;
          if (groupe === undefined) continue;
          vus++;
          expect(p.nombre % groupe, `niveau ${String(n.numero)} vague ${String(w + 1)} : ${p.ennemi} ×${String(p.nombre)}`).toBe(0);
        }
      }
    }
    expect(vus).toBeGreaterThan(20);
    expect(definition('sangsue').pouvoirs?.essaim).toBe(6);
    expect(definition('rat_peste').pouvoirs?.essaim).toBe(8);
  });
});

describe('boss', () => {
  it('le niveau 10 de chaque région est un boss, seul de sa région, dans la dernière vague', () => {
    BOSS_REGIONS.forEach((boss, r) => {
      const niveaux = REGIONS[r] ?? [];
      expect(niveaux.filter((n) => n.boss).map((n) => rang(n.numero)), `région ${String(r + 1)}`).toEqual([10]);
      niveaux.forEach((n, i) => {
        const avecBoss = n.niveau.vagues.flatMap((v, w) => (v.paquets.some((p) => p.ennemi === boss) ? [w] : []));
        expect(avecBoss, `niveau ${String(n.numero)}`).toEqual(i === 9 ? [n.niveau.vagues.length - 1] : []);
        // Aucun autre boss n'apparaît dans une vague de la campagne.
        expect([...ennemisDe(n)].filter((e) => definition(e).boss && e !== boss), `niveau ${String(n.numero)}`).toEqual([]);
      });
    });
  });
});

describe('vagues', () => {
  it('suivent le budget de menace b(L, w) du numéro de campagne, boss exceptés', () => {
    for (const n of CAMPAGNE) {
      n.niveau.vagues.forEach((vague, w) => {
        const ordinaires = { paquets: vague.paquets.filter((p) => !definition(p.ennemi).boss) };
        const budget = budgetVague(n.numero, w + 1);
        const menace = menaceVague(ordinaires, ENNEMIS);
        expect(menace, `niveau ${String(n.numero)} vague ${String(w + 1)}`).toBeLessThanOrEqual(budget);
        expect(menace, `niveau ${String(n.numero)} vague ${String(w + 1)}`).toBeGreaterThan(budget * 0.8);
      });
    }
  });

  it('chaque région 2 à 5 a de 8 à 15 vagues par niveau, et leur nombre ne baisse jamais', () => {
    for (const r of REGIONS_NOUVELLES) {
      const nombres = (REGIONS[r - 1] ?? []).map((n) => n.niveau.vagues.length);
      for (const nb of nombres) {
        expect(nb, `région ${String(r)}`).toBeGreaterThanOrEqual(8);
        expect(nb, `région ${String(r)}`).toBeLessThanOrEqual(15);
      }
      for (let i = 1; i < nombres.length; i++) expect(nombres[i], `région ${String(r)}`).toBeGreaterThanOrEqual(nombres[i - 1] ?? 0);
    }
  });

  it('la menace de la dernière vague croît d’un niveau à l’autre dans une région', () => {
    for (const r of REGIONS_NOUVELLES) {
      const menaces = (REGIONS[r - 1] ?? []).map((n) => menaceVague(n.niveau.vagues.at(-1) ?? { paquets: [] }, ENNEMIS));
      for (let i = 1; i < menaces.length; i++) expect(menaces[i], `région ${String(r)}`).toBeGreaterThan((menaces[i - 1] ?? 0) * 0.9);
    }
  });
});

describe('élites en Vieux Sage', () => {
  it('la région 1 n’en joue pas (ses bandes de Vieux Sage ne les supportent pas), les régions 2 à 5 si', () => {
    for (const n of CAMPAGNE) expect(n.niveau.sansElites === true, `niveau ${String(n.numero)}`).toBe(n.numero <= 10);
  });
});

describe('défi Fer', () => {
  const paires = CAMPAGNE.map((n) => n.niveau.defiFer?.familles);

  it('chaque niveau, région 1 comprise, impose deux familles de tours différentes et connues', () => {
    for (const n of CAMPAGNE) {
      const familles = n.niveau.defiFer?.familles;
      expect(familles, `niveau ${String(n.numero)}`).toBeDefined();
      const [a, b] = familles ?? ['', ''];
      expect(a).not.toBe(b);
      for (const f of [a, b]) expect((FAMILLES as readonly string[]).includes(f), `niveau ${String(n.numero)} : ${f}`).toBe(true);
    }
  });

  it('la partie en défi Fer se crée sur chaque niveau', () => {
    for (const n of CAMPAGNE) {
      expect(() => creerPartie(n.niveau, { ...CONFIG, defi: 'fer' }), `niveau ${String(n.numero)}`).not.toThrow();
    }
  });

  it('les deux familles savent toucher les volants et révéler les furtifs quand le niveau en compte', () => {
    for (const n of CAMPAGNE) {
      const familles = n.niveau.defiFer?.familles ?? ['', ''];
      const defs = [...ennemisDe(n)].map(definition);
      if (defs.some((d) => d.volant)) expect(familles.some((f) => f === 'tir' || f === 'magie'), `niveau ${String(n.numero)} : volants`).toBe(true);
      // Seuls les Guetteurs des Toits (spécialisation de la tour de tir) révèlent les furtifs.
      if (defs.some((d) => d.furtif)) expect(familles.includes('tir'), `niveau ${String(n.numero)} : furtifs`).toBe(true);
    }
  });

  it('varie les paires : toutes servent, jamais deux fois de suite, aucune ne domine', () => {
    const cle = (p: readonly [string, string] | undefined): string => [...(p ?? ['', ''])].sort().join('+');
    const usage = new Map<string, number>();
    paires.forEach((p, i) => {
      usage.set(cle(p), (usage.get(cle(p)) ?? 0) + 1);
      if (i > 0) expect(cle(p), `niveaux ${String(i)} et ${String(i + 1)}`).not.toBe(cle(paires[i - 1]));
    });
    expect(usage.size).toBe(6);
    for (const [paire, n] of usage) expect(n, paire).toBeLessThanOrEqual(15);
  });

  it('la tour divine de chaque dieu reste possible sur au moins un niveau sur deux', () => {
    // Plume : tir, Charlie : caserne, Pollen : artillerie.
    for (const famille of ['tir', 'caserne', 'artillerie']) {
      const n = CAMPAGNE.filter((c) => c.niveau.defiFer?.familles.includes(famille)).length;
      expect(n, famille).toBeGreaterThanOrEqual(15);
    }
  });
});

describe('niveau de campagne et niveau d’essai', () => {
  it('un niveau de campagne est un niveau du moteur', () => {
    const niveau: Niveau = niveauDeCampagne(11)?.niveau ?? niveauEssai();
    expect(niveau.id).toBe('r2-01');
  });
});
