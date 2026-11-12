// Corrections de contenu de la Fac (DLC « Temps modernes », région 1) après la relecture : foules qui servent, renforts sur le chemin,
// charges qui durent, recharges, chemins mobiles ouverts assez longtemps, plan cohérent avec sa carte, décor visible au niveau 4.
// Ce sont des vérifications de contenu : le moteur ne les fait pas (il ne regarde que la forme).
import { describe, expect, it } from 'vitest';
import { calculerChemin, pointSurChemin, projeterSurChemin } from '../../engine/chemins';
import type { Foule, Point } from '../../engine/definitions';
import { centreFoule } from '../../engine/evenements-niveau/foules';
import { ENNEMIS } from '../ennemis';
import { assemblerNiveauModerne, cheminsMobilesDuPlan } from './assemblage-moderne';
import { CARTES_MODERNE_R1 } from './cartes-moderne-r1';
import { distancePointChemin, rectAutour, rectsSeChevauchent } from './geometrie';
import { empriseDecor } from './habillage';
import { PLANS_MODERNE_R1, type PlanNiveauModerne } from './plan-moderne-r1';
import { VAGUES_MODERNE_R1 } from './vagues-moderne-r1';

const points = (plan: PlanNiveauModerne, chemin: number): readonly Point[] => CARTES_MODERNE_R1[plan.carte].chemins[chemin]?.points ?? [];
const quoi = (plan: PlanNiveauModerne, detail: string): string => `niveau ${String(plan.numero)} : ${detail}`;

/** Les chemins ouverts juste avant l'événement d'indice `k` du plan (état de départ, puis les ouvertures et fermetures précédentes). */
function ouvertsAvant(plan: PlanNiveauModerne, k: number): boolean[] {
  const ouverts = plan.chemins.map((i) => !(plan.cheminsFermes ?? []).some((f) => f.chemin === i));
  (plan.evenements ?? []).slice(0, k).forEach((e) => {
    if (e.type === 'ouvrir_chemin') ouverts[e.chemin] = true;
    if (e.type === 'fermer_chemin') ouverts[e.chemin] = false;
  });
  return ouverts;
}

function foulesDuPlan(plan: PlanNiveauModerne): readonly Foule[] {
  return plan.foules ?? [];
}

describe('foules « ralentir »', () => {
  it('le centre est à moins de rayon − 1 d’un chemin qui ne bouge pas (sinon on paie pour presque rien)', () => {
    const problemes: string[] = [];
    for (const plan of PLANS_MODERNE_R1) {
      const mobiles = cheminsMobilesDuPlan(plan);
      for (const f of foulesDuPlan(plan)) {
        if (f.effet.type !== 'ralentir') continue;
        const c = centreFoule(f);
        const d = Math.min(...plan.chemins.filter((i) => !mobiles.has(i)).map((i) => distancePointChemin(c.x, c.y, points(plan, i))));
        if (!(d <= f.effet.rayon - 1)) problemes.push(quoi(plan, `foule en (${String(c.x)}, ${String(c.y)}), rayon ${String(f.effet.rayon)}, chemin fixe à ${d.toFixed(2)}`));
      }
    }
    expect(problemes).toEqual([]);
  });
});

describe('renforts', () => {
  it('chaque renfort daté apparaît à au plus 1 tuile d’un chemin ouvert à ce moment', () => {
    const problemes: string[] = [];
    for (const plan of PLANS_MODERNE_R1) {
      (plan.evenements ?? []).forEach((e, k) => {
        if (e.type !== 'renforts') return;
        const ouverts = ouvertsAvant(plan, k);
        const d = Math.min(...plan.chemins.filter((i) => ouverts[i]).map((i) => distancePointChemin(e.x, e.y, points(plan, i))));
        if (!(d <= 1)) problemes.push(quoi(plan, `renforts de la vague ${String(e.vague)} en (${String(e.x)}, ${String(e.y)}) à ${d.toFixed(2)}`));
      });
    }
    expect(problemes).toEqual([]);
  });

  it('chaque foule à renforts a un chemin qui ne bouge pas, et ses renforts tombent sur un chemin', () => {
    for (const plan of PLANS_MODERNE_R1) {
      const fixes = plan.chemins.filter((i) => !cheminsMobilesDuPlan(plan).has(i));
      for (const f of foulesDuPlan(plan)) {
        if (f.effet.type !== 'renforts') continue;
        expect(fixes.length, quoi(plan, 'chemin fixe')).toBeGreaterThan(0);
        const c = centreFoule(f);
        const calcules = fixes.map((i) => calculerChemin({ points: points(plan, i) }));
        const proche = projeterSurChemin(calcules, c.x, c.y);
        const chemin = proche ? calcules[proche.chemin] : undefined;
        const p = proche && chemin ? pointSurChemin(chemin, proche.distance) : c;
        expect(Math.min(...fixes.map((i) => distancePointChemin(p.x, p.y, points(plan, i)))), quoi(plan, 'renforts de foule')).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('charges', () => {
  it('chaque charge dure au moins jusqu’au milieu du chemin (les chargeurs passent à travers les soldats sur la moitié du parcours)', () => {
    const problemes: string[] = [];
    for (const plan of PLANS_MODERNE_R1) {
      for (const e of plan.evenements ?? []) {
        if (e.type !== 'charge') continue;
        const longueur = calculerChemin({ points: points(plan, e.chemin) }).longueur;
        const parcouru = ENNEMIS[e.ennemi as keyof typeof ENNEMIS].vitesse * e.facteurVitesse * e.duree;
        if (parcouru < longueur / 2) problemes.push(quoi(plan, `charge de la vague ${String(e.vague)} : ${parcouru.toFixed(1)} tuiles pour un chemin de ${longueur.toFixed(1)}`));
      }
    }
    expect(problemes).toEqual([]);
  });
});

describe('foules qui bloquent', () => {
  it('la recharge est au moins égale à la durée de l’effet (un double clic ne paie pas deux fois la même coupure)', () => {
    for (const plan of PLANS_MODERNE_R1) {
      for (const f of foulesDuPlan(plan)) {
        if (f.effet.type !== 'bloquer') continue;
        expect(f.recharge ?? 0, quoi(plan, `foule bloquer en ${JSON.stringify(f.cases)}`)).toBeGreaterThanOrEqual(f.effet.duree);
      }
    }
  });
});

describe('chemins mobiles', () => {
  it('un chemin ouvert en cours de niveau reste ouvert au moins 5 vagues (ou jusqu’à la fin) : construire dessus vaut le coup', () => {
    const problemes: string[] = [];
    for (const plan of PLANS_MODERNE_R1) {
      const evs = plan.evenements ?? [];
      evs.forEach((e) => {
        if (e.type !== 'ouvrir_chemin') return;
        const ferme = evs.find((f) => f.type === 'fermer_chemin' && f.chemin === e.chemin && (f.vague > e.vague || (f.vague === e.vague && (f.delai ?? 0) > (e.delai ?? 0))));
        if (ferme && ferme.vague - e.vague < 5) problemes.push(quoi(plan, `chemin ${String(e.chemin)} ouvert vague ${String(e.vague)}, refermé vague ${String(ferme.vague)}`));
      });
    }
    expect(problemes).toEqual([]);
  });

  it('niveau 8 : le chemin 2 une fois ouvert le reste jusqu’à la fin ; niveau 10 : il s’ouvre vers la moitié du niveau (vague 6 ou 7)', () => {
    const n8 = PLANS_MODERNE_R1[7];
    const n10 = PLANS_MODERNE_R1[9];
    if (!n8 || !n10) throw new Error('plans absents');
    expect((n8.evenements ?? []).some((e) => e.type === 'fermer_chemin' && e.chemin === 2)).toBe(false);
    const ouverture = (n10.evenements ?? []).find((e) => e.type === 'ouvrir_chemin' && e.chemin === 2);
    expect(ouverture?.vague).toBeGreaterThanOrEqual(6);
    expect(ouverture?.vague).toBeLessThanOrEqual(7);
  });

  it('les événements restent triés par (vague, délai)', () => {
    for (const plan of PLANS_MODERNE_R1) {
      const evs = plan.evenements ?? [];
      evs.forEach((e, i) => {
        const avant = evs[i - 1];
        if (avant) expect(avant.vague * 1000 + (avant.delai ?? 0), quoi(plan, `événement ${String(i)}`)).toBeLessThanOrEqual(e.vague * 1000 + (e.delai ?? 0));
      });
    }
  });
});

describe('garde de l’assemblage', () => {
  const base = PLANS_MODERNE_R1[2];
  const vagues = VAGUES_MODERNE_R1[2];
  it('accepte un plan dont les événements et les foules visent des chemins du plan', () => {
    if (!base || !vagues) throw new Error('plan absent');
    expect(() => assemblerNiveauModerne(base, vagues)).not.toThrow();
  });
  it('refuse un événement, un chemin fermé ou une foule qui vise un indice hors du plan', () => {
    if (!base || !vagues) throw new Error('plan absent');
    const evenement = { vague: 1, delai: 1, type: 'nasse', chemin: 5, debut: 1, longueur: 3, duree: 5 } as const;
    expect(() => assemblerNiveauModerne({ ...base, evenements: [evenement] }, vagues)).toThrow(/hors du plan/);
    expect(() => assemblerNiveauModerne({ ...base, cheminsFermes: [{ chemin: 5, repli: 0 }] }, vagues)).toThrow(/hors du plan/);
    const foule: Foule = { cases: [{ cx: 1, cy: 1 }], condition: { type: 'payer', cout: 10 }, effet: { type: 'bloquer', chemin: 5, debut: 1, longueur: 3, duree: 5 }, recharge: 10 };
    expect(() => assemblerNiveauModerne({ ...base, foules: [foule] }, vagues)).toThrow(/hors du plan/);
  });
  it('refuse un plan dont les chemins ne sont pas l’identité 0..n-1 (les indices seraient décalés)', () => {
    if (!base || !vagues) throw new Error('plan absent');
    expect(() => assemblerNiveauModerne({ ...base, chemins: [1, 0] }, vagues)).toThrow(/identité/);
  });
});

describe('niveau 4 : le décor reste visible sous les fourgons du canon à eau', () => {
  it('aucun décor sous la silhouette du fourgon (4 tuiles de large, 3,4 de haut au-dessus de ses pieds) le long du chemin', () => {
    const plan = PLANS_MODERNE_R1[3];
    if (!plan) throw new Error('plan absent');
    const carte = CARTES_MODERNE_R1[plan.carte];
    const caches: string[] = [];
    for (const chemin of carte.chemins) {
      const c = calculerChemin(chemin);
      for (let d = 0; d <= c.longueur; d += 0.5) {
        const p = pointSurChemin(c, d);
        const fourgon = rectAutour(p.x, p.y, 2, 3.4, 2, 0.2);
        for (const dec of carte.decor) if (rectsSeChevauchent(empriseDecor(dec), fourgon)) caches.push(`${dec.sprite} en (${String(dec.x)}, ${String(dec.y)})`);
      }
    }
    expect([...new Set(caches)]).toEqual([]);
  });
});
