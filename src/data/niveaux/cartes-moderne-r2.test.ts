// Les 10 cartes et les 10 niveaux de la Manif (DLC « Temps modernes », région 2), sur le modèle de cartes-moderne-r1.test.ts : règles des
// cartes de l'histoire (grille, bords, décor de l'atlas du DLC, cases libres), puis ce que la région demande au contenu : foules à chaque
// niveau, cortège qui avance (au moins 4 cartes qui bougent), charges, nasses et canons à eau mis en avant, difficulté qui prend la suite
// de la Fac, boss Centaure avec sa mise en scène, vagues figées à jour.
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
import { REGION_VISUELLE_MANIF } from '../visuel';
import { casesDeLaScene, cheminsMobilesDuPlan } from './assemblage-moderne';
import { CAMPAGNE_MODERNE } from './campagne-moderne';
import type { CarteModerne } from './cartes-moderne-r1';
import { CARTES_MODERNE_R2 } from './cartes-moderne-r2';
import { vaguesDuPlanModerne } from './generation';
import { distancePointChemin, distanceRectChemin, rectsSeChevauchent, type Rect } from './geometrie';
import { casesInterditesDuNiveau, tuilesDeChemin } from './grille-niveau';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, GRANDS_DECORS, MARGE_DECOR } from './habillage';
import { PLANS_MODERNE_R1 } from './plan-moderne-r1';
import { PLANS_MODERNE_R2 } from './plan-moderne-r2';
import { VAGUES_MODERNE_R2 } from './vagues-moderne-r2';

const ATLAS = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas-moderne.json', import.meta.url), 'utf8')) as { sprites: Record<string, { categorie: string; largeur: number }> }).sprites;
const T = REGLES.tailleCase;
const cartes: [string, CarteModerne][] = Object.entries(CARTES_MODERNE_R2);
const NIVEAUX = CAMPAGNE_MODERNE.slice(10, 20);
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

describe('les 10 cartes de la Manif', () => {
  it('une par niveau, dans l’ordre des plans, 32 × 18, au jeu de tuiles de la Manif', () => {
    expect(cartes).toHaveLength(10);
    expect(PLANS_MODERNE_R2.map((p) => p.carte)).toEqual(Object.keys(CARTES_MODERNE_R2));
    for (const [, m] of cartes) {
      expect(m.region, m.id).toBe(REGION_VISUELLE_MANIF);
      expect([m.largeur, m.hauteur]).toEqual([32, 18]);
    }
  });

  it('le jeu de tuiles « bitume et pavés » est complet dans l’atlas du DLC', () => {
    const bases = ['herbe-1', 'herbe-2', 'herbe-3', 'chemin-1', 'chemin-2', 'boue-1', 'boue-2', 'paves-1', 'paves-2',
      ...['n', 'e', 's', 'o'].map((s) => `chemin-bord-${s}`), ...['no', 'ne', 'se', 'so'].flatMap((s) => [`chemin-coin-ext-${s}`, `chemin-coin-int-${s}`])];
    for (const b of bases) expect(ATLAS[`moderne-manif-${b}`]?.categorie, b).toBe('tuile');
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
    const plan = PLANS_MODERNE_R2.find((p) => p.carte === id);
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

describe('les 10 niveaux de la Manif', () => {
  it('sont les niveaux 11 à 20 de la campagne moderne, assemblés depuis leur plan', () => {
    expect(NIVEAUX.map((n) => [n.numero, n.campagne, n.niveau.campagne, n.niveau.id])).toEqual(
      PLANS_MODERNE_R2.map((p) => [p.numero, 'moderne', 'moderne', `m2-${String(p.numero - 10).padStart(2, '0')}`]),
    );
    expect(NIVEAUX.every((n) => n.visuel.region === REGION_VISUELLE_MANIF && n.visuel.scene !== undefined)).toBe(true);
  });

  it('les vagues figées sont celles que produit le plan (sinon : npm run niveaux -- moderne)', () => {
    PLANS_MODERNE_R2.forEach((p, i) => {
      expect(VAGUES_MODERNE_R2[i], `niveau ${String(p.numero)}`).toEqual(vaguesDuPlanModerne(p));
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
    const plan = PLANS_MODERNE_R2[i];
    const carte = CARTES_MODERNE_R2[plan?.carte ?? 'rendez_vous'];
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


  it('foules à chaque niveau (au moins deux), à payer ou à tenir avec le héros, les trois effets ; payer hors du chemin, héros dessus', () => {
    for (const n of NIVEAUX) expect(n.niveau.foules?.length ?? 0, `niveau ${String(n.numero)}`).toBeGreaterThanOrEqual(2);
    const foules = NIVEAUX.flatMap((n) => n.niveau.foules ?? []);
    expect(new Set(foules.map((f) => f.condition.type))).toEqual(new Set(['payer', 'heros']));
    expect(new Set(foules.map((f) => f.effet.type))).toEqual(new Set(['ralentir', 'renforts', 'bloquer']));
    // Les deux conditions et les trois effets se croisent : chaque effet existe avec chaque condition quelque part dans la région.
    for (const c of ['payer', 'heros']) for (const e of ['ralentir', 'renforts', 'bloquer']) expect(foules.some((f) => f.condition.type === c && f.effet.type === e), `${c} → ${e}`).toBe(true);
    for (const n of NIVEAUX) {
      const axe = new Set<string>();
      const colonnes = n.niveau.carte.largeur / T;
      n.niveau.carte.chemins.forEach((_, k) => {
        for (const c of casesDuChemin(n.niveau.carte, k)) axe.add(`${String(c % colonnes)},${String(Math.floor(c / colonnes))}`);
      });
      for (const f of n.niveau.foules ?? []) for (const c of f.cases) expect(axe.has(cle(c)), `niveau ${String(n.numero)} : foule ${f.condition.type} en ${cle(c)}`).toBe(f.condition.type === 'heros');
    }
  });

  it('le cortège avance (au moins 4 cartes qui bougent), et chaque niveau a des charges, une nasse et des canons à eau sur des lignes que traverse un chemin', () => {
    const bougent = NIVEAUX.filter((n) => (n.niveau.evenements ?? []).some((e) => e.type === 'ouvrir_chemin' || e.type === 'fermer_chemin'));
    expect(bougent.length).toBeGreaterThanOrEqual(4);
    for (const n of NIVEAUX) {
      const evs = n.niveau.evenements ?? [];
      const quoi = `niveau ${String(n.numero)}`;
      expect(evs.filter((e) => e.type === 'charge').length, quoi).toBeGreaterThanOrEqual(2);
      expect(evs.some((e) => e.type === 'nasse'), quoi).toBe(true);
      // Charges écrites sans `dureeVitesse` : l'accélération prend la valeur commune.
      for (const e of evs) if (e.type === 'charge') expect('dureeVitesse' in e, quoi).toBe(false);
      const lignes = new Set<number>();
      n.niveau.carte.chemins.forEach((_, k) => {
        for (const c of casesDuChemin(n.niveau.carte, k)) lignes.add(Math.floor(c / (n.niveau.carte.largeur / T)));
      });
      for (const e of evs) if (e.type === 'canon_a_eau') expect(lignes.has(e.cy), `${quoi} : canon sur la ligne ${String(e.cy)}`).toBe(true);
    }
    const canons = NIVEAUX.reduce((s, n) => s + (n.niveau.evenements ?? []).filter((e) => e.type === 'canon_a_eau').length, 0);
    expect(canons).toBeGreaterThanOrEqual(15);
    const nasses = NIVEAUX.reduce((s, n) => s + (n.niveau.evenements ?? []).filter((e) => e.type === 'nasse').length, 0);
    expect(nasses).toBeGreaterThanOrEqual(12);
  });

  it('la difficulté prend la suite de la Fac : plus de vagues, budget annoncé croissant, mélange d’ennemis plus large ; les ennemis neufs arrivent un à un', () => {
    const tous = [...PLANS_MODERNE_R1, ...PLANS_MODERNE_R2];
    tous.forEach((p, i) => {
      const avant = tous[i - 1];
      if (!avant) return;
      expect(p.vagues.nombre, `niveau ${String(p.numero)}`).toBeGreaterThanOrEqual(avant.vagues.nombre);
      expect(p.vagues.niveauBudget, `niveau ${String(p.numero)}`).toBeGreaterThan(avant.vagues.niveauBudget);
    });
    const fac = PLANS_MODERNE_R1.slice(5).reduce((s, p) => s + p.vagues.ennemis.length, 0) / 5;
    const manif = PLANS_MODERNE_R2.reduce((s, p) => s + p.vagues.ennemis.length, 0) / 10;
    expect(manif).toBeGreaterThan(fac);
    const premier = (id: string): number => NIVEAUX.findIndex((n) => n.niveau.vagues.some((v) => v.paquets.some((p) => p.ennemi === id)) || (n.niveau.evenements ?? []).some((e) => e.type === 'charge' && e.ennemi === id)) + 11;
    expect(premier('moderne_cavalier_monte')).toBeLessThan(premier('moderne_helicoptere'));
    expect(premier('moderne_helicoptere')).toBeLessThan(premier('moderne_centaure'));
    expect(premier('moderne_centaure')).toBeLessThan(20);
    const hordes = PLANS_MODERNE_R2.filter((p) => p.vagues.horde === true);
    expect(hordes).toHaveLength(1);
    expect(hordes.every((p) => p.vagues.boss === undefined)).toBe(true);
  });

  it('le niveau 20 est le boss Centaure (version boss), dans sa dernière vague, avec sa propre mise en scène (au moins 4 événements de cette vague)', () => {
    const boss = NIVEAUX[9];
    if (!boss) throw new Error('niveau 20 absent');
    expect(boss.boss).toBe(true);
    expect(NIVEAUX.slice(0, 9).every((n) => !n.boss)).toBe(true);
    const derniere = boss.niveau.vagues.length;
    expect(boss.niveau.vagues[derniere - 1]?.paquets.some((p) => p.ennemi === 'moderne_centaure_boss')).toBe(true);
    expect(ENNEMIS.moderne_centaure_boss.boss).toBe(true);
    const scene = (boss.niveau.evenements ?? []).filter((e) => e.type !== 'ouvrir_chemin' && e.vague === derniere);
    expect(scene.length).toBeGreaterThanOrEqual(4);
    expect(new Set(scene.map((e) => e.type)).size).toBeGreaterThanOrEqual(3);
  });

  it('le masque des tuiles de chemin et les cases interdites ne débordent pas de la carte', () => {
    for (const n of NIVEAUX) {
      const masque = tuilesDeChemin(n.niveau.carte);
      expect(masque.length).toBe(32 * 18);
      for (const c of n.niveau.casesInterdites) expect(c.cx >= 0 && c.cy >= 0 && c.cx < 16 && c.cy < 9).toBe(true);
    }
  });
});

describe('ondes des camionnettes sono', () => {
  it.each(cartes)('%s : chaque camionnette a ses ondes sur son haut-parleur (même x, deux tuiles plus haut), et chaque onde est dans la carte', (_nom, m) => {
    const camions = m.decor.filter((d) => d.sprite === 'moderne-camion-sono');
    const sonos = m.scene.sonos ?? [];
    expect(sonos.length, 'autant d’ondes que de camionnettes').toBe(camions.length);
    for (const s of sonos) {
      // Dans la carte, avec une tuile de marge : les ondes montent et ne doivent pas sortir par le haut.
      expect(s.x, `ondes en (${String(s.x)}, ${String(s.y)})`).toBeGreaterThanOrEqual(1);
      expect(s.x).toBeLessThanOrEqual(m.largeur - 1);
      expect(s.y).toBeGreaterThanOrEqual(1);
      expect(s.y).toBeLessThanOrEqual(m.hauteur - 1);
      const proche = camions.some((c) => Math.abs(c.x - s.x) < 1 && s.y - c.y >= -2.5 && s.y - c.y <= -0.5);
      expect(proche, `ondes en (${String(s.x)}, ${String(s.y)}) loin de toute camionnette`).toBe(true);
    }
    for (const c of camions) {
      expect(sonos.some((s) => Math.abs(c.x - s.x) < 1 && s.y - c.y >= -2.5 && s.y - c.y <= -0.5), `camionnette en (${String(c.x)}, ${String(c.y)}) sans ondes`).toBe(true);
    }
  });
});
