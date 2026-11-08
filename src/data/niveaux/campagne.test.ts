// La campagne des régions 1 à 11 : 110 niveaux, 41 cartes (3 nouvelles par région 2 à 10, une par niveau en région 11), ennemis et
// boss de chaque région, essaims, vagues dans le budget de menace, défi Fer jouable, gimmicks de la région 11. Les contrôles de géométrie des cartes et de l'habillage sont
// dans niveaux.test.ts, qui parcourt aussi toute la campagne.
import { describe, expect, it } from 'vitest';
import type { DefEnnemi, Niveau } from '../../engine/definitions';
import { CONFIG, niveauEssai } from '../../engine/aides.test-utils';
import { creerPartie } from '../../engine/partie';
import { ENNEMIS, type IdEnnemi } from '../ennemis';
import { budgetVague, menaceEnnemi, menaceVague } from '../equilibrage';
import { FAMILLES } from '../tours';
import type { NiveauCampagne } from '../visuel';
import { CAMPAGNE, REGIONS, niveauDeCampagne } from './campagne';
import { CARTES } from './cartes-toutes';
import { BOSS_REGIONS, ENNEMIS_REGIONS, ennemisDuNiveau, NIVEAUX_NOUVEAUX, NOUVEAUX_ENNEMIS_REGIONS, REPRISES_REGIONS } from './plan-niveau';
import { PLANS_REGION11 } from './plan-region11';
import { PLANS_REGIONS } from './plans';

const REGIONS_NOUVELLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const region = (numero: number): number => Math.floor((numero - 1) / 10) + 1;
const rang = (numero: number): number => ((numero - 1) % 10) + 1;
const definition = (id: string): DefEnnemi => ENNEMIS[id as IdEnnemi];
const ennemisDe = (n: NiveauCampagne): Set<string> => new Set(n.niveau.vagues.flatMap((v) => v.paquets.map((p) => p.ennemi)));

describe('les 110 niveaux', () => {
  it('sont numérotés de 1 à 110, par régions de 10, avec des identifiants distincts', () => {
    expect(CAMPAGNE.map((n) => n.numero)).toEqual(Array.from({ length: 110 }, (_, i) => i + 1));
    expect(REGIONS.map((r) => r.length)).toEqual([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    expect(new Set(CAMPAGNE.map((n) => n.niveau.id)).size).toBe(110);
    for (const n of CAMPAGNE) expect(n.niveau.id).toBe(`r${String(region(n.numero))}-${String(rang(n.numero)).padStart(2, '0')}`);
  });

  it('niveauDeCampagne rend le niveau de ce numéro', () => {
    expect(niveauDeCampagne(1)?.niveau.id).toBe('r1-01');
    expect(niveauDeCampagne(37)?.niveau.id).toBe('r4-07');
    expect(niveauDeCampagne(50)?.niveau.id).toBe('r5-10');
    expect(niveauDeCampagne(0)).toBeUndefined();
    expect(niveauDeCampagne(51)?.niveau.id).toBe('r6-01');
    expect(niveauDeCampagne(100)?.niveau.id).toBe('r10-10');
    expect(niveauDeCampagne(101)?.niveau.id).toBe('r11-01');
    expect(niveauDeCampagne(110)?.niveau.id).toBe('r11-10');
    expect(niveauDeCampagne(111)).toBeUndefined();
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

  it('laissent de 40 à 110 cases libres sur 144, une ou deux entrées (trois au plus pour la région 1 et les 5es niveaux des blocs d’après l’histoire)', () => {
    for (const n of CAMPAGNE) {
      const libres = 144 - n.niveau.casesInterdites.length;
      expect(libres, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(40);
      expect(libres, `niveau ${String(n.numero)}`).toBeLessThanOrEqual(110);
      // Spec de l'après-histoire : le 5e niveau de chaque bloc (105, 110) a trois entrées.
      const entreesMax = n.numero > 100 && n.numero % 5 === 0 ? 3 : 2;
      if (n.numero > 10) expect(n.niveau.carte.chemins.length, `niveau ${String(n.numero)}`).toBeLessThanOrEqual(entreesMax);
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

describe('les 27 nouvelles cartes', () => {
  const nouvelles = Object.values(CARTES).filter((c) => c.region >= 2 && c.region <= 10);

  it('sont trois par région 2 à 10, de 32 × 18 tuiles, avec un jeu de tuiles de leur région', () => {
    expect(nouvelles).toHaveLength(27);
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

  it('après l’histoire, chaque carte sert exactement une fois : une carte neuve par niveau (spec, 50 cartes pour 50 niveaux)', () => {
    const region11 = Object.values(CARTES).filter((c) => c.region === 11);
    expect(region11).toHaveLength(10);
    for (const c of region11) expect(PLANS_REGIONS.flat().filter((p) => p.carte === c.id).length, c.id).toBe(1);
  });

});

describe('ennemis des régions', () => {
  it('chaque région a trois ennemis ordinaires (deux pour la région 10) et un boss, tous dans les données', () => {
    expect(ENNEMIS_REGIONS).toHaveLength(10);
    // Un boss de plus par région d'après l'histoire (la 11 : le Passeur), sans ennemi ordinaire à elle.
    expect(BOSS_REGIONS).toHaveLength(11);
    ENNEMIS_REGIONS.forEach((liste, r) => {
      expect(liste).toHaveLength(r === 9 ? 2 : 3);
      for (const id of liste) expect(definition(id).boss, id).toBe(false);
    });
    for (const id of BOSS_REGIONS) expect(definition(id).boss, id).toBe(true);
  });

  it('un niveau de région 2 à 10 emploie les ennemis de sa région, ses nouveaux ennemis (niveaux 4 et 7), puis dès le niveau 4 ceux qu’elle reprend', () => {
    for (const r of REGIONS_NOUVELLES) {
      const propres = ENNEMIS_REGIONS[r - 1] ?? [];
      const nouveaux = NOUVEAUX_ENNEMIS_REGIONS[r - 1] ?? [];
      const reprises = REPRISES_REGIONS[r - 1] ?? [];
      for (let k = 1; k <= 10; k++) {
        const liste = ennemisDuNiveau(r, k);
        const attendus = [...propres.slice(0, k), ...nouveaux.filter((_, i) => k >= (NIVEAUX_NOUVEAUX[i] ?? Infinity)), ...(k >= 4 ? reprises : [])];
        expect([...liste].sort(), `région ${String(r)} niveau ${String(k)}`).toEqual([...attendus].sort());
      }
    }
  });

  it('chaque région a au moins 2 ennemis inédits (arrivés aux niveaux 4 et 7) et reprend au moins 1 ennemi d’une région précédente', () => {
    expect(NOUVEAUX_ENNEMIS_REGIONS).toHaveLength(10);
    expect(REPRISES_REGIONS).toHaveLength(10);
    expect(NIVEAUX_NOUVEAUX).toEqual([4, 7]);
    const vus = new Set<string>();
    NOUVEAUX_ENNEMIS_REGIONS.forEach((nouveaux, i) => {
      const r = i + 1;
      expect(nouveaux.length, `région ${String(r)}`).toBeGreaterThanOrEqual(2);
      for (const id of nouveaux) {
        expect(definition(id).boss, id).toBe(false);
        expect(vus.has(id), `${id} : déjà nouveau dans une autre région`).toBe(false);
        vus.add(id);
        // Inédit : ni un ennemi ordinaire d'une région, ni repris avant la sienne.
        expect(ENNEMIS_REGIONS.flat().includes(id), id).toBe(false);
      }
      // Les nouveaux ennemis de la région sont bien dans ses plans de vagues, le premier au niveau 4 et le second au niveau 7.
      const plans = PLANS_REGIONS[i] ?? [];
      expect(plans[3]?.vagues.ennemis, `région ${String(r)} niveau 4`).toContain(nouveaux[0]);
      expect(plans[2]?.vagues.ennemis, `région ${String(r)} niveau 3`).not.toContain(nouveaux[0]);
      expect(plans[6]?.vagues.ennemis, `région ${String(r)} niveau 7`).toContain(nouveaux[1]);
      expect(plans[5]?.vagues.ennemis, `région ${String(r)} niveau 6`).not.toContain(nouveaux[1]);
      // Reprises : des ennemis de régions précédentes (ordinaires ou nouveaux), dans les plans des niveaux 4 à 10 (sauf la région 1).
      const reprises = REPRISES_REGIONS[i] ?? [];
      if (r === 1) {
        expect(reprises).toHaveLength(0);
        return;
      }
      expect(reprises.length, `région ${String(r)}`).toBeGreaterThanOrEqual(1);
      const precedents = new Set<string>([...ENNEMIS_REGIONS.slice(0, i).flat(), ...NOUVEAUX_ENNEMIS_REGIONS.slice(0, i).flat()]);
      for (const id of reprises) expect(precedents.has(id), `région ${String(r)} reprend ${id}`).toBe(true);
      for (const plan of plans.slice(3)) for (const id of reprises) expect(plan.vagues.ennemis, `niveau ${String(plan.numero)}`).toContain(id);
      for (const plan of plans.slice(0, 3)) for (const id of reprises) expect(plan.vagues.ennemis, `niveau ${String(plan.numero)}`).not.toContain(id);
    });
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

  it('les niveaux 4 à 10 mélangent des ennemis de plusieurs régions et font apparaître les nouveaux ennemis', () => {
    for (const r of REGIONS_NOUVELLES) {
      const anciens = new Set<string>(REPRISES_REGIONS[r - 1] ?? []);
      const niveaux = (REGIONS[r - 1] ?? []).slice(3);
      const avecAnciens = niveaux.filter((n) => [...ennemisDe(n)].some((e) => anciens.has(e)));
      expect(avecAnciens.length, `région ${String(r)}`).toBeGreaterThanOrEqual(5);
      // Chaque nouvel ennemi se retrouve dans les vagues de sa région (il arrive au niveau 4 ou 7, puis revient).
      for (const id of NOUVEAUX_ENNEMIS_REGIONS[r - 1] ?? []) {
        const niveauxAvec = (REGIONS[r - 1] ?? []).filter((n) => ennemisDe(n).has(id));
        expect(niveauxAvec.length, `région ${String(r)} : ${id}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('les essaims arrivent par groupes entiers (6 sangsues, 8 rats de peste, 5 chauves-souris)', () => {
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
    expect(definition('chauve_souris').pouvoirs?.essaim).toBe(5);
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
        // `facteurBudget` : réglage fin des régions 6 à 10 (plan-niveau.ts), absent des régions 1 à 5.
        const facteur = PLANS_REGIONS.flat().find((p) => p.numero === n.numero)?.vagues.facteurBudget ?? 1;
        const budget = budgetVague(n.numero, w + 1) * facteur;
        const menace = menaceVague(ordinaires, ENNEMIS);
        expect(menace, `niveau ${String(n.numero)} vague ${String(w + 1)}`).toBeLessThanOrEqual(budget);
        // Le tirage s'arrête quand plus aucun ennemi ne rentre dans le reste du budget : le reste est au plus la menace du moins cher.
        const plan = PLANS_REGIONS.flat().find((p) => p.numero === n.numero);
        const petit = Math.min(...(plan?.vagues.ennemis ?? []).map((e) => menaceEnnemi(ENNEMIS[e] as DefEnnemi) * ((ENNEMIS[e] as DefEnnemi).pouvoirs?.essaim ?? 1)));
        expect(budget - menace < petit || menace > budget * 0.8, `niveau ${String(n.numero)} vague ${String(w + 1)}`).toBe(true);
      });
    }
  });

  it('chaque région 2 à 10 a de 8 à 15 vagues par niveau, et leur nombre ne baisse jamais', () => {
    for (const r of REGIONS_NOUVELLES) {
      const nombres = (REGIONS[r - 1] ?? []).map((n) => n.niveau.vagues.length);
      for (const nb of nombres) {
        expect(nb, `région ${String(r)}`).toBeGreaterThanOrEqual(8);
        expect(nb, `région ${String(r)}`).toBeLessThanOrEqual(15);
      }
      for (let i = 1; i < nombres.length; i++) expect(nombres[i], `région ${String(r)}`).toBeGreaterThanOrEqual(nombres[i - 1] ?? 0);
    }
  });

  it('aucun pic de menace : la vague 6 d’un niveau ordinaire ne dépasse pas 1,5 fois (régions 1 à 5) ou 2,2 fois (régions 6 à 10) celle du niveau ordinaire suivant', () => {
    // Les niveaux de horde et de boss sont laissés de côté. Les régions 6 à 10 ont un `facteurBudget` réglé niveau par niveau sur le simulateur
    // (donc pas monotone) : tolérance plus large. La mesure est la menace réelle des paquets, facteur de PV compris.
    REGIONS.forEach((region, r) => {
      const ordinaires = region.filter((n) => !n.horde && !n.boss).map((n) => ({ numero: n.numero, menace: menaceVague({ paquets: (n.niveau.vagues[5]?.paquets ?? []).filter((p) => !definition(p.ennemi).boss) }, ENNEMIS) }));
      const tolerance = r < 5 ? 1.5 : 2.2;
      ordinaires.forEach((n, i) => {
        const suivant = ordinaires[i + 1];
        if (suivant) expect(n.menace / suivant.menace, `niveau ${String(n.numero)} contre ${String(suivant.numero)}`).toBeLessThanOrEqual(tolerance);
      });
    });
  });

  it('la menace de la dernière vague croît d’un niveau à l’autre dans une région', () => {
    for (const r of REGIONS_NOUVELLES) {
      const menaces = (REGIONS[r - 1] ?? []).map((n) => menaceVague(n.niveau.vagues.at(-1) ?? { paquets: [] }, ENNEMIS));
      // Régions 2 à 5 : de niveau en niveau. Régions 6 à 10 : le facteur de budget de chaque niveau est réglé sur le simulateur
      // (donc pas monotone) ; on exige seulement que le boss soit nettement au-dessus du niveau 1.
      if (r <= 5) for (let i = 1; i < menaces.length; i++) expect(menaces[i], `région ${String(r)}`).toBeGreaterThan((menaces[i - 1] ?? 0) * 0.9);
      else expect(menaces.at(-1) ?? 0, `région ${String(r)}`).toBeGreaterThan(menaces[0] ?? 0);
    }
  });
});

describe('élites en Vieux Sage', () => {
  it('la région 1 n’en joue pas (ses bandes de Vieux Sage ne les supportent pas), les régions 2 à 10 si', () => {
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
    for (const [paire, n] of usage) expect(n, paire).toBeLessThanOrEqual(30);
  });

  it('la tour divine de chaque dieu reste possible sur au moins 30 niveaux sur 100', () => {
    // Plume : tir, Charlie : caserne, Pollen : artillerie.
    for (const famille of ['tir', 'caserne', 'artillerie']) {
      const n = CAMPAGNE.filter((c) => c.niveau.defiFer?.familles.includes(famille)).length;
      expect(n, famille).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('niveau de campagne et niveau d’essai', () => {
  it('un niveau de campagne est un niveau du moteur', () => {
    const niveau: Niveau = niveauDeCampagne(11)?.niveau ?? niveauEssai();
    expect(niveau.id).toBe('r2-01');
  });
});

describe('région 11 : Vol de Corbeaux et Radeau', () => {
  const niveaux = REGIONS[10] ?? [];
  const anciens = new Set<string>([...ENNEMIS_REGIONS.flat(), ...NOUVEAUX_ENNEMIS_REGIONS.flat()]);

  it('emploie seulement des ennemis ordinaires existants (aucun nouveau), ceux de son plan, et le Passeur au niveau 110', () => {
    niveaux.forEach((n, i) => {
      const plan = PLANS_REGION11[i];
      for (const id of plan?.vagues.ennemis ?? []) expect(anciens.has(id), `niveau ${String(n.numero)} : ${id}`).toBe(true);
      const permis = new Set<string>([...(plan?.vagues.ennemis ?? []), ...(i === 9 ? ['passeur'] : [])]);
      for (const e of ennemisDe(n)) expect(permis.has(e), `niveau ${String(n.numero)} : ${e}`).toBe(true);
    });
    expect(BOSS_REGIONS[10]).toBe('passeur');
  });

  it('a de 8 à 15 vagues par niveau, et le dernier niveau de chaque bloc en a le plus', () => {
    const nombres = niveaux.map((n) => n.niveau.vagues.length);
    for (const nb of nombres) expect(nb >= 8 && nb <= 15).toBe(true);
    for (const bloc of [nombres.slice(0, 5), nombres.slice(5)]) expect(bloc.at(-1)).toBe(Math.max(...bloc));
  });

  it('Vol de Corbeaux (101 à 105) : tous les groupes de volants traversent un couloir, chaque couloir sert, et les volants pèsent lourd', () => {
    for (const n of niveaux.slice(0, 5)) {
      const gimmick = n.niveau.gimmick;
      if (gimmick?.type !== 'corbeaux') throw new Error(`niveau ${String(n.numero)} sans Vol de Corbeaux`);
      const paquets = n.niveau.vagues.flatMap((v) => v.paquets);
      for (const p of paquets) expect(p.couloir !== undefined, `niveau ${String(n.numero)} : ${p.ennemi}`).toBe(definition(p.ennemi).volant);
      const servis = new Set(paquets.flatMap((p) => (p.couloir === undefined ? [] : [p.couloir])));
      expect([...servis].sort(), `niveau ${String(n.numero)}`).toEqual(gimmick.couloirs.map((_, k) => k));
      // Au moins un groupe sur six vole : le gimmick se voit à chaque niveau.
      expect(paquets.filter((p) => p.couloir !== undefined).length / paquets.length, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(1 / 6);
    }
  });

  it('Radeau (106 à 110) : aucun couloir, un trajet de 8 à 12 cases à 0,5 case par seconde et 3 places distinctes à moins d’une tuile du centre', () => {
    for (const n of niveaux.slice(5)) {
      const gimmick = n.niveau.gimmick;
      if (gimmick?.type !== 'radeau') throw new Error(`niveau ${String(n.numero)} sans radeau`);
      expect(n.niveau.vagues.flatMap((v) => v.paquets).some((p) => p.couloir !== undefined)).toBe(false);
      expect(gimmick.trajet.length >= 8 && gimmick.trajet.length <= 12, `niveau ${String(n.numero)}`).toBe(true);
      expect(gimmick.vitesse).toBe(0.5);
      expect(gimmick.places).toHaveLength(3);
      for (const p of gimmick.places) expect(Math.abs(p.dx) <= 0.5 && Math.abs(p.dy) <= 0.5).toBe(true);
    }
  });
});
