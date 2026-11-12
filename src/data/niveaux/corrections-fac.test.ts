// Corrections de contenu de la Fac (DLC « Temps modernes », région 1) après la relecture : foules qui servent, renforts sur le chemin,
// charges qui durent, recharges, chemins mobiles ouverts assez longtemps, plan cohérent avec sa carte, décor visible au niveau 4.
// Ce sont des vérifications de contenu : le moteur ne les fait pas (il ne regarde que la forme).
import { describe, expect, it } from 'vitest';
import { calculerChemin, pointSurChemin, projeterSurChemin } from '../../engine/chemins';
import type { Foule, Point } from '../../engine/definitions';
import { centreFoule } from '../../engine/evenements-niveau/foules';
import type { CaseGrille } from '../../engine/definitions';
import type { Decor } from '../visuel';
import { EVENEMENTS_NIVEAU } from '../evenements-niveau';
import { ENNEMIS } from '../ennemis';
import { REGLES } from '../regles';
import { decorVisible } from './assemblage';
import { assemblerNiveauModerne, casesDeLaScene, cheminsMobilesDuPlan } from './assemblage-moderne';
import { CARTES_MODERNE_R1 } from './cartes-moderne-r1';
import { distancePointChemin, rectAutour, rectsSeChevauchent } from './geometrie';
import { casesInterditesDuNiveau } from './grille-niveau';
import { empriseDecor, GRANDS_DECORS, zonesBloquantes } from './habillage';
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
        // Accélération courte (`dureeVitesse`, ou la valeur commune bornée à `duree`), puis l'allure normale jusqu'à la fin de la traversée.
        const acceleration = e.dureeVitesse ?? Math.min(EVENEMENTS_NIVEAU.accelerationCharge, e.duree);
        const parcouru = ENNEMIS[e.ennemi as keyof typeof ENNEMIS].vitesse * (e.facteurVitesse * acceleration + (e.duree - acceleration));
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
  it('refuse une fermeture dont le repli est le chemin fermé lui-même', () => {
    if (!base || !vagues) throw new Error('plan absent');
    const fermeture = { vague: 1, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 1 } as const;
    expect(() => assemblerNiveauModerne({ ...base, evenements: [fermeture] }, vagues)).toThrow(/lui-même/);
    expect(() => assemblerNiveauModerne({ ...base, cheminsFermes: [{ chemin: 1, repli: 1 }] }, vagues)).toThrow(/lui-même/);
  });
  it('refuse un plan dont les chemins ne sont pas l’identité 0..n-1 (les indices seraient décalés)', () => {
    if (!base || !vagues) throw new Error('plan absent');
    expect(() => assemblerNiveauModerne({ ...base, chemins: [1, 0] }, vagues)).toThrow(/identité/);
  });
});

const cleCase = (c: CaseGrille): string => `${String(c.cx)},${String(c.cy)}`;

interface DecorDuPlan {
  readonly modele: (typeof CARTES_MODERNE_R1)[keyof typeof CARTES_MODERNE_R1];
  readonly carte: Parameters<typeof decorVisible>[1];
  readonly fixes: Parameters<typeof casesInterditesDuNiveau>[0];
  readonly zones: ReturnType<typeof zonesBloquantes>;
  readonly decor: readonly Decor[];
}

/** La carte du niveau (chemins du plan), ses chemins fixes, ses zones bloquantes et son décor visible. */
function decorDuPlan(plan: PlanNiveauModerne): DecorDuPlan {
  const modele = CARTES_MODERNE_R1[plan.carte];
  const chemins = plan.chemins.map((i) => {
    const c = modele.chemins[i];
    if (!c) throw new Error(quoi(plan, `chemin ${String(i)} absent`));
    return c;
  });
  const carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins, departHeros: modele.departHeros };
  const mobiles = cheminsMobilesDuPlan(plan);
  const fixes = { ...carte, chemins: chemins.filter((_, i) => !mobiles.has(i)) };
  return { modele, carte, fixes, zones: zonesBloquantes(modele), decor: decorVisible(modele, carte) };
}

/** Cases interdites par le chemin fixe, les zones et la scène, sans aucun décor. */
function interditesSansDecor(plan: PlanNiveauModerne, decor: readonly Decor[]): Set<string> {
  const { modele, fixes, zones } = decorDuPlan(plan);
  return new Set([...casesInterditesDuNiveau(fixes, decor, zones), ...casesDeLaScene(modele.scene)].map(cleCase));
}

/** Cases de tour (hors chemin fixe, zone et scène) qu'un grand décor rend interdites, avec la distance de leur centre au chemin le plus proche. */
function casesPrisesParLeDecor(plan: PlanNiveauModerne, d: Decor): { c: CaseGrille; distance: number }[] {
  const { carte, fixes, zones } = decorDuPlan(plan);
  const sansDecor = interditesSansDecor(plan, []);
  const t = REGLES.tailleCase;
  return casesInterditesDuNiveau(fixes, [d], zones)
    .filter((c) => !sansDecor.has(cleCase(c)))
    .map((c) => ({ c, distance: Math.min(...carte.chemins.map((ch) => distancePointChemin(c.cx * t + t / 2, c.cy * t + t / 2, ch.points))) }));
}

/** Nombre de cases où l'on peut construire, avec le décor donné. */
function casesDeTour(plan: PlanNiveauModerne, decor: readonly Decor[]): number {
  const { modele } = decorDuPlan(plan);
  const t = REGLES.tailleCase;
  return Math.floor(modele.largeur / t) * Math.floor(modele.hauteur / t) - interditesSansDecor(plan, decor).size;
}

/**
 * Grands décors déjà posés à côté d'un chemin avant la règle « les grands décors se posent sur des cases sans valeur » (spec du DLC,
 * décisions de la vague 2) : écarts connus, signalés, à déplacer carte par carte. La liste ne doit que raccourcir.
 */
const ECARTS_DECOR_CONNUS: ReadonlySet<string> = new Set([
  'niveau 1 : moderne-gradins en (12, 11)',
  'niveau 1 : moderne-sono en (6, 6)',
  'niveau 2 : moderne-distributeur en (10, 4)',
  'niveau 2 : moderne-distributeur en (25, 3)',
  'niveau 2 : moderne-tableau en (20, 9)',
  'niveau 3 : moderne-platane en (8, 13)',
  'niveau 4 : moderne-etagere en (11, 17)',
  'niveau 4 : moderne-etagere en (12, 11)',
  'niveau 4 : moderne-etagere en (26, 15)',
  'niveau 5 : moderne-distributeur en (16, 3)',
  'niveau 5 : moderne-distributeur en (22, 13)',
  'niveau 6 : moderne-barrieres en (14, 11)',
  'niveau 7 : moderne-barricade en (4, 15)',
  'niveau 7 : moderne-barricade en (10, 6)',
  'niveau 7 : moderne-barricade en (16, 17)',
  'niveau 7 : moderne-tente en (5, 3)',
  'niveau 8 : moderne-gradins en (10, 7)',
  'niveau 8 : moderne-gradins en (13, 7)',
  'niveau 8 : moderne-gradins en (29, 7)',
  'niveau 8 : moderne-sono en (1, 7)',
  'niveau 8 : moderne-sono en (28, 14)',
  'niveau 9 : moderne-barricade en (8, 5)',
  'niveau 9 : moderne-distributeur en (20, 7)',
  'niveau 9 : moderne-etagere en (8, 13)',
  'niveau 9 : moderne-platane en (2, 7)',
  'niveau 9 : moderne-sono en (26, 9)',
  'niveau 10 : moderne-barricade en (31, 13)',
  'niveau 10 : moderne-platane en (19, 7)',
  'niveau 10 : moderne-sono en (29, 7)',
]);

/** Les grands décors de chaque niveau du DLC qui bloquent une case de tour à moins de 2 cases d'un chemin, avec ces cases. */
function decorsQuiPrennentDesCasesUtiles(): Map<string, string[]> {
  const fautifs = new Map<string, string[]>();
  for (const plan of PLANS_MODERNE_R1) {
    for (const d of decorDuPlan(plan).decor) {
      if (!GRANDS_DECORS.has(d.sprite)) continue;
      const cases = casesPrisesParLeDecor(plan, d).filter(({ distance }) => distance < 2 * REGLES.tailleCase);
      if (cases.length > 0) fautifs.set(quoi(plan, `${d.sprite} en (${String(d.x)}, ${String(d.y)})`), cases.map(({ c, distance }) => `(${String(c.cx)}, ${String(c.cy)}) à ${distance.toFixed(1)}`));
    }
  }
  return fautifs;
}

describe('grands décors et cases de tour', () => {
  it('pour chaque niveau du DLC, aucun grand décor ne bloque une case de tour à moins de 2 cases d’un chemin (hors écarts connus)', () => {
    const nouveaux = [...decorsQuiPrennentDesCasesUtiles()].filter(([cle]) => !ECARTS_DECOR_CONNUS.has(cle)).map(([cle, cases]) => `${cle} : ${cases.join(', ')}`);
    expect(nouveaux).toEqual([]);
  });

  it('chaque écart connu existe encore (un décor déplacé sort de la liste)', () => {
    const fautifs = decorsQuiPrennentDesCasesUtiles();
    expect([...ECARTS_DECOR_CONNUS].filter((cle) => !fautifs.has(cle))).toEqual([]);
  });

  it('niveau 4 : le plan de jeu a au moins les cases de tour d’avant le déplacement du décor (étagère en (9, 2), tableau en (12, 2))', () => {
    const plan = PLANS_MODERNE_R1[3];
    if (!plan) throw new Error('plan absent');
    const grands = decorDuPlan(plan).decor.filter((d) => GRANDS_DECORS.has(d.sprite));
    // Les grands décors de la carte avant b8a8eaf (tous visibles), dont l'étagère et le tableau au bord nord.
    const avant: Decor[] = [
      { sprite: 'moderne-etagere', x: 9, y: 2 },
      { sprite: 'moderne-tableau', x: 12, y: 2 },
      { sprite: 'moderne-gradins', x: 19, y: 6 },
      { sprite: 'moderne-etagere', x: 12, y: 11 },
      { sprite: 'moderne-etagere', x: 26, y: 15 },
      { sprite: 'moderne-etagere', x: 11, y: 17 },
    ];
    expect(casesDeTour(plan, grands)).toBeGreaterThanOrEqual(casesDeTour(plan, avant));
  });
});

/**
 * Décors que le fourgon cache déjà, avant la règle : le niveau 10 (Rectorat), relevé à la relecture de b8a8eaf. Ils sont presque tous
 * petits (pancartes, tags, cônes) : les déplacer est une passe de décor à part, signalée.
 */
const ECARTS_FOURGON_CONNUS: Readonly<Record<number, readonly string[]>> = {
  10: [
    'moderne-pancarte en (0.5, 6)',
    'moderne-tag en (1.5, 7.5)',
    'moderne-fumigene en (3, 7.5)',
    'moderne-cartons en (7, 8.5)',
    'moderne-cone en (3, 3.5)',
    'moderne-pancarte en (4, 1.5)',
    'moderne-tag en (10, 1)',
    'moderne-pancarte en (12, 1.5)',
    'moderne-pancarte en (16.5, 2)',
    'moderne-fumigene en (17, 6)',
    'moderne-platane en (19, 7)',
    'moderne-tag en (21.5, 6.5)',
    'moderne-sono en (29, 7)',
    'moderne-pancarte en (5.5, 13)',
    'moderne-pneus en (7, 13.5)',
    'moderne-palette en (11, 13)',
    'moderne-tag en (11, 15)',
    'moderne-cone en (9, 7.5)',
    'moderne-fumigene en (11, 6)',
    'moderne-pancarte en (23, 16.5)',
    'moderne-cartons en (19, 11.5)',
  ],
};

/** Les niveaux où passe le fourgon du canon à eau (dans leurs vagues figées). */
const AVEC_FOURGON = PLANS_MODERNE_R1.filter((_, i) => (VAGUES_MODERNE_R1[i] ?? []).some((v) => v.paquets.some((p) => p.ennemi === 'moderne_canon_a_eau')));

describe('le décor reste visible sous les fourgons du canon à eau', () => {
  it('les niveaux 4 et 10 ont des fourgons ; le niveau 8 n’en a pas', () => {
    const numeros = AVEC_FOURGON.map((p) => p.numero);
    expect(numeros).toContain(4);
    expect(numeros).toContain(10);
    expect(numeros).not.toContain(8);
  });

  it.each(AVEC_FOURGON.map((p) => [p.numero, p] as const))('niveau %i : aucun décor sous la silhouette du fourgon (4 tuiles de large, 3,4 de haut au-dessus de ses pieds), hors écarts connus', (numero, plan) => {
    const { carte, decor } = decorDuPlan(plan);
    const caches: string[] = [];
    for (const chemin of carte.chemins) {
      const c = calculerChemin(chemin);
      for (let d = 0; d <= c.longueur; d += 0.5) {
        const p = pointSurChemin(c, d);
        const fourgon = rectAutour(p.x, p.y, 2, 3.4, 2, 0.2);
        for (const dec of decor) if (rectsSeChevauchent(empriseDecor(dec), fourgon)) caches.push(`${dec.sprite} en (${String(dec.x)}, ${String(dec.y)})`);
      }
    }
    const connus = ECARTS_FOURGON_CONNUS[numero] ?? [];
    expect([...new Set(caches)].filter((c) => !connus.includes(c))).toEqual([]);
    // La liste des écarts ne garde que des décors encore cachés.
    expect(connus.filter((c) => !caches.includes(c))).toEqual([]);
  });
});
