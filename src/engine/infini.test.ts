// Mode infini (jalon 4) : vagues générées de façon déterministe, budget, élites, mini-boss, fin de partie, rejeu.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { budgetVague, EQUILIBRAGE, menaceEnnemi } from '../data/equilibrage';
import { INFINI } from '../data/infini';
import { NIVEAU_TEST, REGION1 } from '../data/niveaux/region1';
import { REGLES } from '../data/regles';
import { CONFIG, ct } from './aides.test-utils';
import type { Action } from './actions';
import { ajusterMontant } from './argent';
import { verifierConfig } from './config';
import { defEnnemi } from './contenu';
import type { DefEnnemi, Vague } from './definitions';
import type { ConfigPartie, EtatPartie } from './etat';
import { budgetInfini, ennemisInfini, genererVagueInfinie, partElites, pvMiniBoss, remplirBudget } from './infini';
import { infligerDegats } from './degats';
import { ajouterEnnemi } from './ennemis';
import { estCaseInterdite } from './grille';
import { appliquerAction, avancer, creerPartie, deserialiser, rejouer, serialiser, step } from './partie';
import { enPas } from './temps';
import { derniereVagueTerminee, lancerVague, vagueAtteinte } from './vagues';

function configInfinie(region = 1, surcharges: Partial<ConfigPartie> = {}): ConfigPartie {
  return { ...CONFIG, infini: { region }, ...surcharges };
}

const CHEMINS = NIVEAU_TEST.carte.chemins.length;

/** Le produit 1,22 × 1,22 … (n − 1 fois) : la formule du budget, écrite autrement que dans le moteur. */
function croissance(n: number): number {
  return Array.from({ length: n - 1 }).reduce<number>((produit) => produit * 1.22, 1);
}

/** Les groupes d'une vague qui ne sont pas le boss de la région. */
function ordinaires(vague: Vague, region: number): Vague['paquets'] {
  const boss = INFINI.regions[region - 1]?.boss;
  return vague.paquets.filter((p) => p.ennemi !== boss);
}

function menace(vague: Vague, region: number): number {
  return ordinaires(vague, region).reduce((total, p) => total + p.nombre * menaceEnnemi(ENNEMIS[p.ennemi as keyof typeof ENNEMIS] as DefEnnemi) * (p.facteurPv ?? 1), 0);
}

describe('budget de menace de la vague n', () => {
  it('suit budget(vague 1) × 1,22^(n − 1)', () => {
    expect(budgetInfini(1)).toBe(budgetVague(1, 1));
    expect(budgetInfini(1)).toBe(260);
    for (const n of [2, 3, 10, 25, 50, 100]) expect(budgetInfini(n) / (260 * croissance(n))).toBeCloseTo(1, 9);
    expect(budgetInfini(10)).toBeCloseTo(1556.7, 0);
    expect(budgetInfini(30)).toBeCloseTo(260 * croissance(30), 0);
  });

  it('chaque vague générée remplit son budget sans le dépasser, dans toutes les régions', () => {
    for (const region of [1, 3, 6, 10]) {
      const candidats = ennemisInfini(region);
      const petit = Math.min(...candidats.map(([, def]) => menaceEnnemi(def) * (def.pouvoirs?.essaim ?? 1)));
      for (let n = 1; n <= 16; n++) {
        const budget = budgetInfini(n);
        const vague = genererVagueInfinie(configInfinie(region), CHEMINS, n);
        const total = menace(vague, region);
        expect(total, `région ${String(region)} vague ${String(n)}`).toBeLessThanOrEqual(budget + 1e-6);
        expect(budget - total, `région ${String(region)} vague ${String(n)}`).toBeLessThan(petit);
      }
    }
  });

  it('les ennemis tirés sont ceux de la région de la carte et des précédentes, jamais ceux des suivantes ni un boss', () => {
    const region = 4;
    const permis = new Set(ennemisInfini(region).map(([id]) => id));
    const boss = INFINI.regions[region - 1]?.boss;
    expect(permis.has('noyeur')).toBe(true);
    expect(permis.has('paysan_affame')).toBe(true);
    expect(permis.has('rat_peste')).toBe(false);
    const vus = new Set<string>();
    for (let n = 1; n <= 30; n++) {
      for (const p of genererVagueInfinie(configInfinie(region), CHEMINS, n).paquets) {
        if (p.ennemi === boss) continue;
        expect(permis.has(p.ennemi), p.ennemi).toBe(true);
        vus.add(p.ennemi);
      }
    }
    // Les trois régions précédentes et la sienne se retrouvent bien dans les vagues.
    expect(vus.size).toBeGreaterThan(6);
  });

  it('les paquets pointent un chemin de la carte et les essaims gardent leur taille de groupe, élites comprises', () => {
    let essaims = 0;
    for (const n of [12, 25, 35, 60]) {
      for (const p of genererVagueInfinie(configInfinie(10), 2, n).paquets) {
        expect(p.chemin === 0 || p.chemin === 1).toBe(true);
        const taille = defEnnemi(p.ennemi)?.pouvoirs?.essaim;
        if (!taille) continue;
        essaims++;
        expect(p.nombre % taille, `${p.ennemi} vague ${String(n)}`).toBe(0);
      }
    }
    expect(essaims).toBeGreaterThan(0);
  });
});

describe('plafond du nombre d’ennemis par vague', () => {
  const ennemisDe = (vague: Vague, region: number): number => ordinaires(vague, region).reduce((somme, p) => somme + p.nombre, 0);

  it('aucune vague, jusqu’à la 150, ne dépasse le plafond, dans toutes les régions', () => {
    for (const region of [1, 4, 6, 10]) {
      for (let n = 1; n <= 150; n += 7) {
        expect(ennemisDe(genererVagueInfinie(configInfinie(region), CHEMINS, n), region), `région ${String(region)} vague ${String(n)}`).toBeLessThanOrEqual(INFINI.ennemisMaxParVague);
      }
    }
  });

  it('au-delà du plafond, le surplus de budget devient un facteur de PV : la menace totale (nombre × PV) reste celle du budget', () => {
    for (const region of [1, 10]) {
      for (const n of [60, 100, 150]) {
        const vague = genererVagueInfinie(configInfinie(region), CHEMINS, n);
        const totalPv = ordinaires(vague, region).reduce((somme, p) => somme + p.nombre * menaceEnnemi(ENNEMIS[p.ennemi as keyof typeof ENNEMIS] as DefEnnemi) * (p.facteurPv ?? 1), 0);
        expect(totalPv, `région ${String(region)} vague ${String(n)}`).toBeLessThanOrEqual(budgetInfini(n) * 1.0001);
        expect(totalPv, `région ${String(region)} vague ${String(n)}`).toBeGreaterThan(budgetInfini(n) * 0.8);
        expect(ordinaires(vague, region).every((p) => (p.facteurPv ?? 1) > 1)).toBe(true);
      }
    }
  });

  it('les vagues qui tiennent dans le plafond restent celles du budget, avec la seule robustesse des ennemis ordinaires', () => {
    const vague = genererVagueInfinie(configInfinie(1), CHEMINS, 12);
    const paquets = ordinaires(vague, 1);
    // Le dernier paquet peut être moins renforcé : le budget restant ne paie plus un ennemi à la robustesse pleine.
    expect(paquets.slice(0, -1).every((p) => p.facteurPv === EQUILIBRAGE.robustesseOrdinaires)).toBe(true);
    expect(paquets.every((p) => (p.facteurPv ?? 1) >= 1 && (p.facteurPv ?? 1) <= EQUILIBRAGE.robustesseOrdinaires)).toBe(true);
  });
});

describe('déterminisme de la génération', () => {
  it('même graine, même région, même vague : même vague', () => {
    for (const n of [1, 7, 20, 33]) {
      expect(genererVagueInfinie(configInfinie(3), 2, n)).toEqual(genererVagueInfinie(configInfinie(3), 2, n));
    }
  });

  it('une autre graine ou une autre région donne d’autres vagues', () => {
    const base = JSON.stringify(genererVagueInfinie(configInfinie(3), 2, 15));
    expect(JSON.stringify(genererVagueInfinie(configInfinie(3, { graine: 43 }), 2, 15))).not.toBe(base);
    expect(JSON.stringify(genererVagueInfinie(configInfinie(5), 2, 15))).not.toBe(base);
  });

  it('une vague ne dépend ni de l’état de la partie ni de l’ordre dans lequel on les génère', () => {
    const seule = genererVagueInfinie(configInfinie(2), 2, 12);
    for (let n = 1; n < 12; n++) genererVagueInfinie(configInfinie(2), 2, n);
    expect(genererVagueInfinie(configInfinie(2), 2, 12)).toEqual(seule);
  });
});

describe('mini-boss toutes les 10 vagues', () => {
  it('une vague 10, 20, 30, 40… en compte un, aucune autre', () => {
    for (let n = 1; n <= 45; n++) {
      const boss = genererVagueInfinie(configInfinie(1), CHEMINS, n).paquets.filter((p) => p.ennemi === 'boucher_vaudrelle');
      expect(boss.length, `vague ${String(n)}`).toBe(n % 10 === 0 ? 1 : 0);
    }
  });

  it('c’est le boss de la région de la carte, à 30 % de ses PV, 15 points de plus par mini-boss déjà passé', () => {
    expect(pvMiniBoss(9)).toBe(0);
    expect(pvMiniBoss(10)).toBeCloseTo(0.3, 9);
    expect(pvMiniBoss(20)).toBeCloseTo(0.45, 9);
    expect(pvMiniBoss(30)).toBeCloseTo(0.6, 9);
    expect(pvMiniBoss(50)).toBeCloseTo(0.9, 9);
    INFINI.regions.forEach((r, i) => {
      for (const [n, part] of [[10, 0.3], [20, 0.45], [30, 0.6]] as const) {
        const boss = genererVagueInfinie(configInfinie(i + 1), 2, n).paquets.filter((p) => p.ennemi === r.boss);
        expect(boss).toHaveLength(1);
        expect(boss[0]?.nombre).toBe(1);
        expect(boss[0]?.facteurPv).toBeCloseTo(part, 9);
        expect(boss[0]?.elite).toBeUndefined();
      }
    });
  });

  it('il arrive avec la vague : son budget ordinaire reste celui de la formule', () => {
    const vague = genererVagueInfinie(configInfinie(1), CHEMINS, 10);
    expect(ordinaires(vague, 1).length).toBeGreaterThan(0);
    expect(menace(vague, 1)).toBeLessThanOrEqual(budgetInfini(10));
  });

  it('en partie, le mini-boss de la vague 10 apparaît avec 30 % des PV du boss et une prime réduite d’autant', () => {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(1));
    etat.vagues.lancees = 9;
    lancerVague(etat, 0);
    expect(vagueAtteinte(etat)).toBe(10);
    for (let i = 0; i < enPas(INFINI.miniBoss.delai) + 5; i++) step(etat);
    const boss = etat.ennemis.find((e) => e.type === 'boucher_vaudrelle');
    if (!boss) throw new Error('mini-boss absent');
    expect(boss.pvMax).toBeCloseTo(ENNEMIS.boucher_vaudrelle.pv * 1.08 * 0.3, 6);
    expect(boss.prime).toBe(ajusterMontant(ENNEMIS.boucher_vaudrelle.prime, 0.7 * 0.3));
    expect(boss.boss).toBe(true);
  });

  it('au troisième mini-boss, le boss a 60 % de ses PV', () => {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(6));
    etat.vagues.lancees = 29;
    lancerVague(etat, 0);
    for (let i = 0; i < enPas(INFINI.miniBoss.delai) + 5; i++) step(etat);
    const boss = etat.ennemis.find((e) => e.type === 'roi_fosses');
    expect(boss?.pvMax).toBeCloseTo(ENNEMIS.roi_fosses.pv * 1.08 * 0.6, 6);
  });
});

describe('élites : à partir de la vague 20', () => {
  /** Part d'élites parmi les ennemis ordinaires de plusieurs vagues et de plusieurs graines. */
  function partMesuree(region: number, vagues: readonly number[], graines: number): number {
    let total = 0;
    let elites = 0;
    for (let g = 0; g < graines; g++) {
      for (const n of vagues) {
        for (const p of ordinaires(genererVagueInfinie(configInfinie(region, { graine: 100 + g }), CHEMINS, n), region)) {
          total += p.nombre;
          if (p.elite === true) elites += p.nombre;
        }
      }
    }
    return elites / total;
  }

  it('10 % à la vague 20, +5 points toutes les 10 vagues, au plus 60 %', () => {
    expect(partElites(1)).toBe(0);
    expect(partElites(19)).toBe(0);
    expect(partElites(20)).toBeCloseTo(0.1, 9);
    expect(partElites(29)).toBeCloseTo(0.1, 9);
    expect(partElites(30)).toBeCloseTo(0.15, 9);
    expect(partElites(40)).toBeCloseTo(0.2, 9);
    expect(partElites(110)).toBeCloseTo(0.55, 9);
    expect(partElites(120)).toBeCloseTo(0.6, 9);
    expect(partElites(300)).toBeCloseTo(0.6, 9);
  });

  it('aucune élite avant la vague 20', () => {
    for (let n = 1; n < 20; n++) {
      for (const p of genererVagueInfinie(configInfinie(2), CHEMINS, n).paquets) expect(p.elite, `vague ${String(n)}`).toBeUndefined();
    }
  });

  it('les vagues générées contiennent la part d’élites annoncée (à quelques points près)', () => {
    expect(partMesuree(1, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29], 12)).toBeGreaterThan(0.08);
    expect(partMesuree(1, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29], 12)).toBeLessThan(0.12);
    expect(partMesuree(5, [30, 31, 32, 33, 34], 20)).toBeGreaterThan(0.125);
    expect(partMesuree(5, [30, 31, 32, 33, 34], 20)).toBeLessThan(0.175);
    expect(partMesuree(8, [40, 41, 42], 12)).toBeGreaterThan(0.17);
    expect(partMesuree(8, [40, 41, 42], 12)).toBeLessThan(0.23);
    expect(partMesuree(10, [70], 4)).toBeGreaterThan(0.3);
    expect(partMesuree(10, [70], 4)).toBeLessThan(0.4);
  });

  it('couper les groupes en élites et ordinaires garde l’effectif, les chemins et le rythme de la vague de base', () => {
    const config = configInfinie(3);
    const base = { paquets: remplirBudget(config, 3, CHEMINS, 25).paquets };
    const avec = genererVagueInfinie(config, CHEMINS, 25);
    expect(avec.paquets.some((p) => p.elite === true)).toBe(true);
    for (const [i, p] of base.paquets.entries()) {
      const morceaux = avec.paquets.filter((q) => q.ennemi === p.ennemi && q.chemin === p.chemin && q.intervalle === p.intervalle && q.delai >= p.delai && q.delai <= p.delai + p.nombre * p.intervalle);
      expect(morceaux.reduce((total, q) => total + q.nombre, 0), `groupe ${String(i)}`).toBeGreaterThanOrEqual(p.nombre);
    }
    expect(ordinaires(avec, 3).reduce((total, p) => total + p.nombre, 0)).toBe(base.paquets.reduce((total, p) => total + p.nombre, 0));
  });

  it('en partie, les groupes d’élites apparaissent en élites (PV × REGLES.elite.facteurPv)', () => {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(1, { graine: 5 }));
    etat.vagues.lancees = 19;
    lancerVague(etat, 0);
    const attendus = etat.vagues.paquets.filter((p) => p.elite).reduce((total, p) => total + p.restants, 0);
    expect(attendus).toBeGreaterThan(0);
    for (let i = 0; i < 30 * 60 && etat.vagues.paquets.length > 0; i++) step(etat);
    const elites = etat.ennemis.filter((e) => e.elite);
    expect(elites.length).toBeGreaterThan(0);
    const e = elites[0];
    if (!e) throw new Error('pas d’élite');
    const def = ENNEMIS[e.type as keyof typeof ENNEMIS] as DefEnnemi;
    expect(e.pvMax / (def.pv * 1.08 * REGLES.elite.facteurPv * EQUILIBRAGE.robustesseOrdinaires * remplirBudget(etat.config, 1, etat.chemins.length, 20).facteurPv)).toBeCloseTo(1, 6);
  });
});

describe('partie infinie', () => {
  /** Une partie scénarisée sur NIVEAU_TEST : tours, appels de vagues, héros, sorts. */
  const SCENARIO: readonly { pas: number; action: Action }[] = [
    { pas: 0, action: { type: 'construire', ...ct(0), tour: 'caserne' } },
    { pas: 0, action: { type: 'construire', ...ct(1), tour: 'tir' } },
    { pas: 5, action: { type: 'appelerVague' } },
    { pas: 30, action: { type: 'construire', ...ct(2), tour: 'artillerie' } },
    { pas: 60, action: { type: 'deplacerHeros', x: 12, y: 8 } },
    { pas: 400, action: { type: 'lancerSort', emplacement: 0, x: 12, y: 6 } },
    { pas: 600, action: { type: 'appelerVague' } },
    { pas: 700, action: { type: 'ameliorer', ...ct(1) } },
    { pas: 1200, action: { type: 'appelerVague' } },
    { pas: 1500, action: { type: 'construire', ...ct(4), tour: 'magie' } },
  ];

  function jouer(config: ConfigPartie, pasFinal: number): EtatPartie {
    const etat = creerPartie(NIVEAU_TEST, config);
    let i = 0;
    while (etat.pas < pasFinal && etat.statut === 'en_cours') {
      const actions: Action[] = [];
      while (SCENARIO[i]?.pas === etat.pas) {
        const entree = SCENARIO[i];
        if (entree) actions.push(entree.action);
        i++;
      }
      avancer(etat, actions);
    }
    return etat;
  }

  it('même graine et mêmes actions donnent le même état, octet pour octet', () => {
    const a = jouer(configInfinie(1), 3000);
    const b = jouer(configInfinie(1), 3000);
    expect(serialiser(a)).toBe(serialiser(b));
    expect(a.vagues.lancees).toBeGreaterThanOrEqual(3);
    expect(a.ennemis.length + a.tours.length).toBeGreaterThan(0);
  });

  it('une autre graine donne une autre partie', () => {
    expect(serialiser(jouer(configInfinie(1, { graine: 9 }), 1500))).not.toBe(serialiser(jouer(configInfinie(1), 1500)));
  });

  it('le journal rejoue la partie exactement', () => {
    const etat = jouer(configInfinie(1), 3000);
    const rejoue = rejouer(NIVEAU_TEST, configInfinie(1), etat.journal, etat.pas);
    expect(serialiser(rejoue)).toBe(serialiser(etat));
  });

  it('un état sérialisé puis relu continue à l’identique', () => {
    const original = jouer(configInfinie(2), 1800);
    const copie = deserialiser(serialiser(original));
    expect(copie).toEqual(original);
    for (let i = 0; i < 20 * 30; i++) {
      step(original);
      step(copie);
    }
    expect(serialiser(copie)).toBe(serialiser(original));
  });

  it('les vagues du niveau sont ignorées, les vagues viennent du moteur (compte à rebours sans fin)', () => {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(1));
    expect(etat.niveau.vagues).toHaveLength(0);
    expect(etat.vagues.prochaine).toBe(enPas(REGLES.delaiPremiereVague));
    for (let i = 0; i < enPas(REGLES.delaiPremiereVague) + 1; i++) step(etat);
    expect(etat.vagues.lancees).toBe(1);
    expect(etat.vagues.prochaine).not.toBe(-1);
    expect(etat.evenements.some((e) => e.type === 'apparition')).toBe(true);
  });

  it('la vague 1 est la première vague générée, la suivante lancée appelle la vague 2', () => {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(1));
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const premiere = genererVagueInfinie(configInfinie(1), CHEMINS, 1);
    expect(etat.vagues.paquets.map((p) => p.ennemi)).toEqual(premiere.paquets.map((p) => p.ennemi));
    expect(etat.vagues.paquets.map((p) => p.restants)).toEqual(premiere.paquets.map((p) => p.nombre));
  });

  it('ne se gagne jamais : toutes les vagues vaincues, la partie continue ; elle finit à la dernière vie', () => {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(1));
    etat.vagues.lancees = 12;
    etat.vagues.prochaine = 1e9;
    step(etat);
    step(etat);
    expect(etat.statut).toBe('en_cours');
    etat.vies = 0;
    step(etat);
    expect(etat.statut).toBe('defaite');
    expect(etat.etoiles).toBe(0);
  });

  it('se joue avec les règles de Matou et 20 vies, quelle que soit la difficulté de la config', () => {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(1, { difficulte: 'vieux_sage' }));
    expect(etat.vies).toBe(20);
    expect(etat.viesDepart).toBe(20);
    etat.vagues.lancees = 0;
    lancerVague(etat, 0);
    for (let i = 0; i < 90; i++) step(etat);
    const e = etat.ennemis[0];
    if (!e) throw new Error('aucun ennemi');
    // Les règles de Matou (PV × 1,08) et la robustesse des ordinaires (au plus `robustesseOrdinaires`, moins si le budget restant est court).
    const rapport = e.pvMax / ((ENNEMIS[e.type as keyof typeof ENNEMIS] as DefEnnemi).pv * 1.08);
    expect(rapport).toBeGreaterThanOrEqual(1);
    expect(rapport).toBeLessThanOrEqual(EQUILIBRAGE.robustesseOrdinaires + 1e-9);
  });

  it('joue sur la carte du niveau : ses chemins et ses cases interdites', () => {
    const niveau = REGION1[2]?.niveau;
    if (!niveau) throw new Error('niveau manquant');
    const etat = creerPartie(niveau, configInfinie(1));
    expect(etat.chemins).toHaveLength(niveau.carte.chemins.length);
    expect(etat.niveau.casesInterdites).toEqual(niveau.casesInterdites);
    const interdite = niveau.casesInterdites[0];
    if (!interdite) throw new Error('aucune case interdite');
    expect(estCaseInterdite(etat.niveau, interdite.cx, interdite.cy)).toBe(true);
    expect(appliquerAction(etat, { type: 'construire', cx: interdite.cx, cy: interdite.cy, tour: 'tir' })).toEqual({ ok: false, raison: 'case_interdite' });
    // Les ennemis suivent les chemins de la carte.
    etat.vagues.lancees = 0;
    lancerVague(etat, 0);
    expect(etat.vagues.paquets.every((p) => p.chemin >= 0 && p.chemin < niveau.carte.chemins.length)).toBe(true);
    for (let i = 0; i < 60; i++) step(etat);
    expect(etat.ennemis.length).toBeGreaterThan(0);
  });
});

describe('vague atteinte et dernière vague terminée', () => {
  function partie(): EtatPartie {
    const etat = creerPartie(NIVEAU_TEST, configInfinie(1));
    etat.vagues.prochaine = 1e9;
    return etat;
  }

  const def = ENNEMIS.paysan_affame as DefEnnemi;

  it('rien de terminé avant que la première vague le soit', () => {
    const etat = partie();
    expect(vagueAtteinte(etat)).toBe(0);
    expect(derniereVagueTerminee(etat)).toBe(0);
    appliquerAction(etat, { type: 'appelerVague' });
    expect(vagueAtteinte(etat)).toBe(1);
    expect(derniereVagueTerminee(etat)).toBe(0);
  });

  it('une vague est terminée quand tous ses groupes sont apparus et tous ses ennemis disparus', () => {
    const etat = partie();
    appliquerAction(etat, { type: 'appelerVague' });
    // Elle apparaît petit à petit : tant qu'il reste des groupes à faire apparaître, elle n'est pas terminée.
    for (let i = 0; i < 30 && etat.vagues.paquets.length > 0; i++) step(etat);
    expect(etat.vagues.paquets.length + etat.ennemis.length).toBeGreaterThan(0);
    expect(derniereVagueTerminee(etat)).toBe(0);
    etat.vagues.paquets.length = 0;
    for (const e of etat.ennemis) infligerDegats(etat, e, 1e9, 'pur');
    step(etat);
    expect(derniereVagueTerminee(etat)).toBe(1);
  });

  it('un ennemi en retard d’une vague empêche les suivantes de compter', () => {
    const etat = partie();
    etat.vagues.lancees = 4;
    const retard = ajouterEnnemi(etat, def, 'paysan_affame', 0, 3, false, { vague: 1 });
    ajouterEnnemi(etat, def, 'paysan_affame', 0, 3, false, { vague: 3 });
    expect(derniereVagueTerminee(etat)).toBe(1);
    infligerDegats(etat, retard, 1e9, 'pur');
    step(etat);
    expect(derniereVagueTerminee(etat)).toBe(3);
    etat.ennemis.length = 0;
    expect(derniereVagueTerminee(etat)).toBe(4);
  });

  it('les ennemis appelés par un autre gardent la vague de celui qui les a appelés', () => {
    const etat = partie();
    etat.vagues.lancees = 5;
    const roi = ajouterEnnemi(etat, ENNEMIS.roi_fou, 'roi_fou', 0, 10, false, { vague: 2 });
    roi.pv = roi.pvMax * 0.7;
    step(etat);
    const gardes = etat.ennemis.filter((e) => e.type === 'garde_royal');
    expect(gardes).toHaveLength(4);
    for (const g of gardes) expect(g.vague).toBe(2);
    expect(derniereVagueTerminee(etat)).toBe(2);
  });

  it('un ennemi échappé ne retient plus la vague', () => {
    const etat = partie();
    etat.vagues.lancees = 2;
    const rapide = ajouterEnnemi(etat, { ...def, vitesse: 60 }, 'paysan_affame', 0, 1, false, { vague: 0 });
    expect(derniereVagueTerminee(etat)).toBe(0);
    for (let i = 0; i < 60; i++) step(etat);
    expect(rapide.vivant).toBe(false);
    expect(derniereVagueTerminee(etat)).toBe(2);
  });
});

describe('configuration du mode infini', () => {
  it('accepte une région de 1 à 10, refuse le reste et les défis', () => {
    expect(verifierConfig(configInfinie(1))).toBeNull();
    expect(verifierConfig(configInfinie(10))).toBeNull();
    expect(verifierConfig({ ...CONFIG, infini: null })).toBeNull();
    for (const region of [0, 11, -1, 1.5, '2', null, undefined]) {
      expect(verifierConfig({ ...CONFIG, infini: { region } }), String(region)).toMatch(/Infini/);
    }
    expect(verifierConfig({ ...CONFIG, infini: { region: 1, autre: 1 } })).toMatch(/Infini/);
    expect(verifierConfig({ ...CONFIG, infini: 3 })).toMatch(/Infini/);
    expect(verifierConfig(configInfinie(1, { defi: 'heroique' }))).toMatch(/défi/);
  });

  it('une partie de campagne garde une config sans infini (même état qu’avant)', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    expect('infini' in etat.config).toBe(false);
    expect(creerPartie(NIVEAU_TEST, configInfinie(3)).config.infini).toEqual({ region: 3 });
  });

  it('refuse de créer une partie infinie avec une région inconnue', () => {
    expect(() => creerPartie(NIVEAU_TEST, configInfinie(11))).toThrow('Infini');
  });

  it('les paramètres sont complets : dix régions, des ennemis et un boss qui existent', () => {
    expect(INFINI.regions).toHaveLength(10);
    for (const r of INFINI.regions) {
      expect(defEnnemi(r.boss)?.boss, r.boss).toBe(true);
      for (const id of r.ennemis) expect(defEnnemi(id)?.boss, id).toBe(false);
    }
    expect(INFINI.croissance).toBe(1.22);
    expect(INFINI.miniBoss).toMatchObject({ intervalle: 10, pvDepart: 0.3, pvParMiniBoss: 0.15 });
    expect(INFINI.elites).toMatchObject({ premiereVague: 20, partDepart: 0.1, partParPalier: 0.05, intervalle: 10, partMax: 0.6 });
  });
});
