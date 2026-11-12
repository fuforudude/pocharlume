// Les 10 cartes et les 10 niveaux de la Fac (DLC « Temps modernes », région 1). On y rejoue les règles des cartes de l'histoire
// (chemins-grille.test.ts, cartes-region11.test.ts : grille, bords, décor, cases libres), avec le jeu de tuiles et le décor de l'atlas du
// DLC, puis ce que la spec demande au contenu : mécaniques introduites une à une, foules dès le niveau 2, événements dès le niveau 3,
// carte qui bouge, boss commissaire avec sa mise en scène, vagues figées à jour.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../engine/aides.test-utils';
import type { CaseGrille, Point } from '../../engine/definitions';
import { casesLibresEnPartie, caseInterditeEnPartie, verifierDynamique } from '../../engine/evenements-niveau';
import { casesDuChemin } from '../../engine/evenements-niveau/chemins-mobiles';
import { centreCase, estCaseInterdite } from '../../engine/grille';
import { creerPartie } from '../../engine/partie';
import { ENNEMIS } from '../ennemis';
import { REGLES } from '../regles';
import { REGION_VISUELLE_FAC } from '../visuel';
import { casesDeLaScene, cheminsMobilesDuPlan } from './assemblage-moderne';
import { CAMPAGNE_MODERNE } from './campagne-moderne';
import { CARTES_MODERNE } from './cartes-moderne';
import { CARTES_MODERNE_R1, type CarteModerne } from './cartes-moderne-r1';
import { vaguesDuPlanModerne } from './generation';
import { distancePointChemin, distanceRectChemin, rectsSeChevauchent, type Rect } from './geometrie';
import { casesInterditesDuNiveau, tuilesDeChemin } from './grille-niveau';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, GRANDS_DECORS, MARGE_DECOR } from './habillage';
import { PLANS_MODERNE_R1 } from './plan-moderne-r1';
import { VAGUES_MODERNE_R1 } from './vagues-moderne-r1';

const ATLAS = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas-moderne.json', import.meta.url), 'utf8')) as { sprites: Record<string, { categorie: string; largeur: number }> }).sprites;
const T = REGLES.tailleCase;
const cartes: [string, CarteModerne][] = Object.entries(CARTES_MODERNE_R1);
const NIVEAUX = CAMPAGNE_MODERNE.slice(0, 10);
const cle = (c: CaseGrille): string => `${String(c.cx)},${String(c.cy)}`;
const rectCase = (c: CaseGrille): Rect => ({ x0: c.cx * T, y0: c.cy * T, x1: (c.cx + 1) * T, y1: (c.cy + 1) * T });

/** Cases traversées par l'axe des chemins (comme chemins-grille.test.ts). */
function casesDeLAxe(m: CarteModerne): Set<string> {
  const cases = new Set<string>();
  for (const c of m.chemins) {
    c.points.forEach((b, i) => {
      const a = c.points[i - 1];
      if (!a) return;
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) {
        for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
          const cx = Math.floor(x / T);
          const cy = Math.floor(y / T);
          if (cx >= 0 && cy >= 0 && cx < m.largeur / T && cy < m.hauteur / T) cases.add(`${String(cx)},${String(cy)}`);
        }
      }
    });
  }
  return cases;
}

describe('les 10 cartes de la Fac', () => {
  it('une par niveau, dans l’ordre des plans, 32 × 18, au jeu de tuiles de la Fac', () => {
    expect(cartes).toHaveLength(10);
    expect(PLANS_MODERNE_R1.map((p) => p.carte)).toEqual(Object.keys(CARTES_MODERNE_R1));
    for (const [, m] of cartes) {
      expect(m.region, m.id).toBe(REGION_VISUELLE_FAC);
      expect([m.largeur, m.hauteur]).toEqual([32, 18]);
    }
  });

  it('le jeu de tuiles de la Fac est complet dans l’atlas du DLC', () => {
    const bases = ['herbe-1', 'herbe-2', 'herbe-3', 'chemin-1', 'chemin-2', 'boue-1', 'boue-2', 'paves-1', 'paves-2',
      ...['n', 'e', 's', 'o'].map((s) => `chemin-bord-${s}`), ...['no', 'ne', 'se', 'so'].flatMap((s) => [`chemin-coin-ext-${s}`, `chemin-coin-int-${s}`])];
    for (const b of bases) expect(ATLAS[`moderne-fac-${b}`]?.categorie, b).toBe('tuile');
  });

  it.each(cartes)('%s : chemins sur la grille (segments droits, coordonnées impaires), entrée et sortie hors de la carte', (_id, m) => {
    for (const c of m.chemins) {
      c.points.forEach((p, i) => {
        expect(p.x % T !== 0 && p.y % T !== 0, `point ${String(i)}`).toBe(true);
        const q = c.points[i - 1];
        if (q) expect(p.x === q.x || p.y === q.y, `segment ${String(i)} en diagonale`).toBe(true);
      });
      const dehors = (p?: Point): boolean => p !== undefined && (p.x < 0 || p.y < 0 || p.x > m.largeur || p.y > m.hauteur);
      expect(dehors(c.points[0]) && dehors(c.points.at(-1))).toBe(true);
    }
  });

  it.each(cartes)('%s : les cases du chemin sont exactement celles de l’axe ; le héros attend sur le chemin, au centre d’une case', (_id, m) => {
    const interdites = new Set(casesInterditesDuNiveau(m, [], []).map(cle));
    expect([...interdites].sort()).toEqual([...casesDeLAxe(m)].sort());
    const { x, y } = m.departHeros;
    expect(casesDeLAxe(m).has(`${String(Math.floor(x / T))},${String(Math.floor(y / T))}`)).toBe(true);
    expect(x % T !== 0 && y % T !== 0).toBe(true);
  });

  it.each(cartes)('%s : au moins 40 décors, 4 grands, 8 sprites différents de l’atlas du DLC, 3 zones dans la carte', (_id, m) => {
    expect(m.decor.length).toBeGreaterThanOrEqual(40);
    expect(m.decor.filter((d) => GRANDS_DECORS.has(d.sprite)).length).toBeGreaterThanOrEqual(4);
    expect(new Set(m.decor.map((d) => d.sprite)).size).toBeGreaterThanOrEqual(8);
    for (const d of m.decor) {
      expect(ATLAS[d.sprite]?.categorie, d.sprite).toBe('decor');
      expect(GRANDS_DECORS.has(d.sprite), d.sprite).toBe(ATLAS[d.sprite]?.largeur === 32);
    }
    expect(m.zones.length).toBeGreaterThanOrEqual(3);
    for (const z of m.zones) expect(z.x >= 0 && z.y >= 0 && z.x + z.largeur <= m.largeur && z.y + z.hauteur <= m.hauteur).toBe(true);
  });

  it.each(cartes)('%s : le décor reste dans la carte, loin des chemins, hors des cases de la scène et des foules', (id, m) => {
    const plan = PLANS_MODERNE_R1.find((p) => p.carte === id);
    const reservees = [...casesDeLaScene(m.scene), ...(plan?.foules ?? []).flatMap((f) => f.cases)].map(rectCase);
    const problemes: string[] = [];
    for (const d of m.decor) {
      const r = empriseDecor(d);
      const quoi = `${d.sprite} en (${String(d.x)}, ${String(d.y)})`;
      if (!(r.x0 >= 0 && r.x1 <= m.largeur && r.y0 >= 0 && r.y1 <= m.hauteur)) problemes.push(`${quoi} sort de la carte`);
      if (m.chemins.some((c) => distanceRectChemin(r, c.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR)) problemes.push(`${quoi} sur le chemin`);
      if (reservees.some((c) => rectsSeChevauchent(r, c))) problemes.push(`${quoi} sur une case réservée`);
    }
    expect(problemes).toEqual([]);
  });

  it.each(cartes)('%s : la scène (groupes, banderoles, fumigènes) est dans la carte et hors des chemins', (_id, m) => {
    const axe = casesDeLAxe(m);
    for (const c of casesDeLaScene(m.scene)) {
      expect(c.cx >= 0 && c.cy >= 0 && c.cx < m.largeur / T && c.cy < m.hauteur / T, cle(c)).toBe(true);
      expect(axe.has(cle(c)), `case de scène ${cle(c)} sur un chemin`).toBe(false);
    }
    expect(m.scene.groupes.length).toBeGreaterThan(0);
    for (const f of m.scene.fumigenes) expect(f.x >= 0 && f.x <= m.largeur && f.y >= 0 && f.y <= m.hauteur).toBe(true);
  });
});

describe('les 10 niveaux de la Fac', () => {
  it('sont les 10 premiers de la campagne moderne, assemblés depuis leur plan', () => {
    expect(NIVEAUX.map((n) => [n.numero, n.campagne, n.niveau.campagne, n.niveau.id])).toEqual(
      PLANS_MODERNE_R1.map((p) => [p.numero, 'moderne', 'moderne', `m1-${String(p.numero).padStart(2, '0')}`]),
    );
    expect(NIVEAUX.every((n) => n.visuel.region === REGION_VISUELLE_FAC && n.visuel.scene !== undefined)).toBe(true);
  });

  it('les vagues figées sont celles que produit le plan (sinon : npm run niveaux -- moderne)', () => {
    PLANS_MODERNE_R1.forEach((p, i) => {
      expect(VAGUES_MODERNE_R1[i], `niveau ${String(p.numero)}`).toEqual(vaguesDuPlanModerne(p));
    });
  });

  it.each(NIVEAUX.map((n) => [n.numero, n.niveau] as const))('niveau %i : événements et foules valides, la partie se crée en Matou et en défi Fer', (_n, niveau) => {
    expect(() => {
      verifierDynamique(niveau);
    }).not.toThrow();
    expect(() => creerPartie(niveau, CONFIG)).not.toThrow();
    expect(() => creerPartie(niveau, { ...CONFIG, defi: 'fer' })).not.toThrow();
  });

  it.each(NIVEAUX.map((n, i) => [n.numero, n.niveau, i] as const))('niveau %i : chemins mobiles hors des cases interdites (le moteur les interdit), scène dedans ; assez de cases libres', (_n, niveau, i) => {
    const plan = PLANS_MODERNE_R1[i];
    const carte = CARTES_MODERNE[plan?.carte ?? 'amphi'];
    if (!plan) throw new Error('plan absent');
    const fixes = new Set<number>();
    niveau.carte.chemins.forEach((_, k) => {
      if (!cheminsMobilesDuPlan(plan).has(k)) for (const c of casesDuChemin(niveau.carte, k)) fixes.add(c);
    });
    const colonnes = niveau.carte.largeur / T;
    for (const k of cheminsMobilesDuPlan(plan)) {
      for (const c of casesDuChemin(niveau.carte, k)) {
        if (fixes.has(c)) continue;
        const cx = c % colonnes;
        const cy = Math.floor(c / colonnes);
        expect(estCaseInterdite(niveau, cx, cy), `chemin mobile ${String(k)} en (${String(cx)}, ${String(cy)})`).toBe(false);
        expect(caseInterditeEnPartie({ niveau }, cx, cy)).toBe(true);
      }
    }
    for (const c of casesDeLaScene(carte.scene)) expect(estCaseInterdite(niveau, c.cx, c.cy), `scène ${cle(c)}`).toBe(true);
    const libres = casesLibresEnPartie({ niveau, tours: [] });
    expect(libres.length).toBeGreaterThanOrEqual(40);
    const proches = libres.filter((c) => {
      const p = centreCase(c.cx, c.cy);
      return Math.min(...niveau.carte.chemins.map((ch) => distancePointChemin(p.x, p.y, ch.points))) <= 3.5;
    });
    expect(proches.length).toBeGreaterThanOrEqual(12);
  });

  it('foules : au moins une par niveau dès le niveau 2 (aucune au niveau 1), à payer ou à tenir avec le héros, trois effets', () => {
    expect(NIVEAUX[0]?.niveau.foules).toBeUndefined();
    for (const n of NIVEAUX.slice(1)) expect(n.niveau.foules?.length ?? 0, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(1);
    const foules = NIVEAUX.flatMap((n) => n.niveau.foules ?? []);
    expect(new Set(foules.map((f) => f.condition.type))).toEqual(new Set(['payer', 'heros']));
    expect(new Set(foules.map((f) => f.effet.type))).toEqual(new Set(['ralentir', 'renforts', 'bloquer']));
    // Une foule « payer » se tient hors du chemin ; une foule « héros » sur le chemin (le héros ne se poste qu'à une tuile de l'axe).
    for (const n of NIVEAUX) {
      const axe = new Set<string>();
      const colonnes = n.niveau.carte.largeur / T;
      n.niveau.carte.chemins.forEach((_, k) => {
        for (const c of casesDuChemin(n.niveau.carte, k)) axe.add(`${String(c % colonnes)},${String(Math.floor(c / colonnes))}`);
      });
      for (const f of n.niveau.foules ?? []) for (const c of f.cases) expect(axe.has(cle(c)), `niveau ${String(n.numero)} : foule ${f.condition.type} en ${cle(c)}`).toBe(f.condition.type === 'heros');
    }
  });

  it('événements datés dès le niveau 3, et des cartes qui bougent (chemin qui s’ouvre, chemin qui se ferme)', () => {
    expect(NIVEAUX.slice(0, 2).every((n) => n.niveau.evenements === undefined)).toBe(true);
    for (const n of NIVEAUX.slice(2)) expect(n.niveau.evenements?.length ?? 0, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(2);
    const types = new Set(NIVEAUX.flatMap((n) => (n.niveau.evenements ?? []).map((e) => e.type)));
    expect(types).toEqual(new Set(['charge', 'nasse', 'canon_a_eau', 'renforts', 'ouvrir_chemin', 'fermer_chemin']));
    const bougent = NIVEAUX.filter((n) => (n.niveau.evenements ?? []).some((e) => e.type === 'ouvrir_chemin' || e.type === 'fermer_chemin'));
    expect(bougent.length).toBeGreaterThanOrEqual(1);
  });

  it('les mécaniques arrivent une à une : ennemis simples, puis canon à eau, puis LBD, puis BRAV-M', () => {
    const premier = (id: string): number => NIVEAUX.findIndex((n) => n.niveau.vagues.some((v) => v.paquets.some((p) => p.ennemi === id)) || (n.niveau.evenements ?? []).some((e) => e.type === 'charge' && e.ennemi === id)) + 1;
    expect(premier('moderne_gendarme')).toBe(1);
    const canon = Math.min(premier('moderne_canon_a_eau'), NIVEAUX.findIndex((n) => (n.niveau.evenements ?? []).some((e) => e.type === 'canon_a_eau')) + 1);
    expect(canon).toBeGreaterThan(2);
    expect(premier('moderne_tireur_lbd')).toBeGreaterThan(canon);
    expect(premier('moderne_bravm')).toBeGreaterThan(premier('moderne_tireur_lbd'));
  });

  it('le niveau 10 est le boss commissaire, dans sa dernière vague, avec sa propre mise en scène (au moins 4 événements de cette vague)', () => {
    const boss = NIVEAUX[9];
    if (!boss) throw new Error('niveau 10 absent');
    expect(boss.boss).toBe(true);
    expect(NIVEAUX.slice(0, 9).every((n) => !n.boss)).toBe(true);
    const derniere = boss.niveau.vagues.length;
    expect(boss.niveau.vagues[derniere - 1]?.paquets.some((p) => p.ennemi === 'moderne_commissaire_boss')).toBe(true);
    expect(ENNEMIS.moderne_commissaire_boss.boss).toBe(true);
    expect((boss.niveau.evenements ?? []).filter((e) => e.vague === derniere).length).toBeGreaterThanOrEqual(4);
  });

  // Ce test ne mesure PAS la difficulté : `niveauBudget` n'est que le budget annoncé (niveau de l'histoire dont le budget de menace sert). Le budget
  // effectif (× `facteurBudget`) baisse au fil des niveaux ; l'équilibrage réel (tâche 7, bots) viendra plus tard.
  it('le budget annoncé (niveauBudget) monte de niveau en niveau, le nombre de vagues ne baisse pas ; une horde, jamais au boss', () => {
    PLANS_MODERNE_R1.forEach((p, i) => {
      const avant = PLANS_MODERNE_R1[i - 1];
      if (!avant) return;
      expect(p.vagues.nombre).toBeGreaterThanOrEqual(avant.vagues.nombre);
      expect(p.vagues.niveauBudget).toBeGreaterThan(avant.vagues.niveauBudget);
    });
    const hordes = PLANS_MODERNE_R1.filter((p) => p.vagues.horde === true);
    expect(hordes.length).toBeGreaterThanOrEqual(1);
    expect(hordes.every((p) => p.vagues.boss === undefined)).toBe(true);
    expect(NIVEAUX.map((n) => n.horde)).toEqual(PLANS_MODERNE_R1.map((p) => p.vagues.horde === true));
  });

  it('le masque des tuiles de chemin et les cases interdites ne débordent pas de la carte', () => {
    for (const n of NIVEAUX) {
      const masque = tuilesDeChemin(n.niveau.carte);
      expect(masque.length).toBe(32 * 18);
      for (const c of n.niveau.casesInterdites) expect(c.cx >= 0 && c.cy >= 0 && c.cx < 16 && c.cy < 9).toBe(true);
    }
  });
});
