// Mécaniques des 5 boss des régions 6 à 10 (jalon 4), jouées avec les valeurs des données : un test par mécanique.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import {
  avancerSecondes,
  compter,
  construireTour,
  ennemiDonnees,
  ennemiEssai,
  ennemisDe,
  evenementsPendant,
  partieEssai,
  tourDe,
} from './aides.test-utils';
import { appliquerEffet, infligerDegats } from './degats';
import { ajouterEnnemi } from './ennemis';
import { EFFET, type Ennemi, type EtatPartie, type Tour } from './etat';
import { step } from './partie';
import { enPas } from './temps';

function tourDeLaCase(etat: EtatPartie, i: number): Tour {
  const t = tourDe(etat, i);
  if (!t) throw new Error(`pas de tour sur la case d'essai ${String(i)}`);
  return t;
}

/** Ennemi de test posé à `x` sur le chemin 0, increvable et inoffensif. */
function passant(etat: EtatPartie, x: number, vitesse = 0): Ennemi {
  return ajouterEnnemi(etat, ennemiEssai({ pv: 1e9, vitesse, degats: [0, 0] }), 'paysan_affame', 0, x);
}

describe('Le Roi des Fosses : toutes les 15 s, relève les 4 derniers ennemis morts à 50 % de leurs PV', () => {
  /** Tue `nombre` paysans posés à x = 2, 3… ; le Roi des Fosses attend plus loin. */
  function partieAvecMorts(nombre: number): { etat: EtatPartie; roi: Ennemi } {
    const etat = partieEssai();
    const roi = ennemiDonnees(etat, 'roi_fosses', 25, { pv: 1e9, degats: [0, 0] });
    for (let i = 0; i < nombre; i++) {
      const e = ajouterEnnemi(etat, ennemiEssai({ pv: 40, vitesse: 0 }), 'paysan_affame', 0, 2 + i);
      infligerDegats(etat, e, 1e6, 'pur');
    }
    step(etat);
    return { etat, roi };
  }

  it('relève au bout de 15 s les 4 derniers morts, pas les plus anciens', () => {
    const { etat } = partieAvecMorts(6);
    expect(etat.morts).toHaveLength(6);
    avancerSecondes(etat, 14.5);
    expect(ennemisDe(etat, 'paysan_affame')).toHaveLength(0);
    const vus = evenementsPendant(etat, 1);
    expect(vus).toContainEqual(expect.objectContaining({ type: 'resurrection', nombre: 4 }));
    const releves = ennemisDe(etat, 'paysan_affame');
    expect(releves).toHaveLength(4);
    // Les morts les plus récents (x = 4 à 7) reviennent là où ils sont tombés (ils ont marché depuis), les deux premiers
    // (x = 2 et 3) restent morts.
    const distances = releves.map((e) => e.distance).sort((a, b) => a - b);
    expect(distances[0]).toBeGreaterThanOrEqual(4);
    expect(distances[0]).toBeLessThan(4.9);
    distances.forEach((d, i) => expect(d - (distances[0] ?? 0)).toBeCloseTo(i, 6));
    for (const e of releves) expect(e.pv).toBeCloseTo(e.pvMax * 0.5, 6);
  });

  it('relève les morts une seule fois : ils ne reviennent pas à chaque salve, mais reviennent s’ils meurent encore', () => {
    const { etat } = partieAvecMorts(2);
    avancerSecondes(etat, 15.5);
    const premiers = ennemisDe(etat, 'paysan_affame');
    expect(premiers).toHaveLength(2);
    expect(etat.morts).toHaveLength(0);
    avancerSecondes(etat, 15);
    expect(ennemisDe(etat, 'paysan_affame')).toHaveLength(2);
    // Morts une seconde fois, ils sont de nouveau en mémoire : le roi, qui attendait des morts, les relève aussitôt.
    for (const e of premiers) infligerDegats(etat, e, 1e6, 'pur');
    expect(etat.morts).toHaveLength(2);
    step(etat);
    expect(etat.morts).toHaveLength(0);
    expect(ennemisDe(etat, 'paysan_affame')).toHaveLength(2);
  });

  it('un ennemi d’élite revient en élite ; un boss mort n’est jamais relevé', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'roi_fosses', 25, { pv: 1e9, degats: [0, 0] });
    const elite = ajouterEnnemi(etat, ennemiEssai({ pv: 40, vitesse: 0 }), 'paysan_affame', 0, 5, true);
    const autreBoss = ennemiDonnees(etat, 'la_faim', 8, { pv: 10, degats: [0, 0] });
    infligerDegats(etat, elite, 1e6, 'pur');
    infligerDegats(etat, autreBoss, 1e6, 'pur');
    step(etat);
    expect(etat.morts).toHaveLength(1);
    avancerSecondes(etat, 15.5);
    const releve = ennemisDe(etat, 'paysan_affame')[0];
    expect(releve?.elite).toBe(true);
    expect(ennemisDe(etat, 'la_faim')).toHaveLength(0);
  });

  it('sans mort à relever, il réessaie au pas suivant au lieu d’attendre 15 s de plus', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'roi_fosses', 25, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 16);
    const e = ajouterEnnemi(etat, ennemiEssai({ pv: 40, vitesse: 0 }), 'paysan_affame', 0, 3);
    infligerDegats(etat, e, 1e6, 'pur');
    avancerSecondes(etat, 0.2);
    expect(ennemisDe(etat, 'paysan_affame')).toHaveLength(1);
  });

  it('un ennemi échappé n’est pas gardé en mémoire, et la mémoire est bornée', () => {
    const etat = partieEssai();
    for (let i = 0; i < 20; i++) {
      const e = passant(etat, 3 + i);
      e.pv = 1;
      infligerDegats(etat, e, 5, 'pur');
    }
    expect(etat.morts.length).toBeLessThanOrEqual(8);
    expect(etat.morts.length).toBeGreaterThan(4);
  });
});

describe('Le Prince Croisé : charge toutes les 10 s et porte l’aura du Porte-Bannière à 3 tuiles', () => {
  const VITESSE = ENNEMIS.prince_croise.vitesse;

  it('à 10 s, sa vitesse est multipliée par 3 pendant 2 s, puis redevient normale', () => {
    const etat = partieEssai();
    const prince = ennemiDonnees(etat, 'prince_croise', 2, { vitesse: VITESSE, pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 9.5);
    expect(prince.charge).toBe(0);
    let debut = -1;
    for (let i = 0; i < 30 && debut < 0; i++) {
      step(etat);
      if (compter(etat.evenements, 'charge') > 0) debut = prince.distance;
    }
    expect(debut).toBeGreaterThan(0);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'charge', ennemi: prince.id, duree: 2 }));
    avancerSecondes(etat, 2);
    expect(prince.distance - debut).toBeCloseTo(VITESSE * 3 * 2, 1);
    const apres = prince.distance;
    avancerSecondes(etat, 1);
    expect(prince.distance - apres).toBeCloseTo(VITESSE, 2);
  });

  it('en pleine charge il ignore les soldats qui le bloquaient, puis un soldat peut de nouveau l’arrêter', () => {
    const etat = partieEssai();
    construireTour(etat, 0, 'caserne');
    const prince = ennemiDonnees(etat, 'prince_croise', 3, { vitesse: VITESSE, pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 9.8);
    expect(prince.bloqueur).not.toBe(-1);
    const bloque = prince.distance;
    avancerSecondes(etat, 0.4);
    expect(prince.charge).toBeGreaterThan(0);
    expect(prince.bloqueur).toBe(-1);
    avancerSecondes(etat, 1.2);
    expect(prince.distance - bloque).toBeGreaterThan(VITESSE * 3 * 1.2 - 0.5);
    expect(etat.unites.every((u) => u.cible !== prince.id)).toBe(true);
  });

  it('porte l’aura : +25 % de vitesse aux ennemis à 3 tuiles, pas au-delà', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'prince_croise', 10);
    const proche = passant(etat, 12.5, 1);
    const loin = passant(etat, 14, 1);
    step(etat);
    expect(proche.bonusVitesse).toBe(0.25);
    expect(loin.bonusVitesse).toBe(0);
  });

  it('son aura ne se cumule pas avec celle d’un Porte-Bannière', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'prince_croise', 10);
    ennemiDonnees(etat, 'porte_banniere', 10.3);
    const allie = passant(etat, 11, 1);
    step(etat);
    expect(allie.bonusVitesse).toBe(0.25);
  });
});

describe('Le Grand Inquisiteur : fige les 2 tours les plus proches pendant 4 s toutes les 10 s, insensible aux ralentissements', () => {
  function partieGrandInquisiteur(): EtatPartie {
    const etat = partieEssai();
    construireTour(etat, 0, 'tir');
    construireTour(etat, 1, 'tir');
    construireTour(etat, 2, 'tir');
    // À x = 13 : les tours des cases 1 (11, 7) et 2 (15, 7) sont à 2,8 tuiles, celle de la case 0 (5, 7) à plus de 8.
    ennemiDonnees(etat, 'grand_inquisiteur', 13, { pv: 1e9, degats: [0, 0] });
    return etat;
  }

  it('toutes les 10 s, gèle 4 s les deux tours les plus proches, pas la troisième', () => {
    const etat = partieGrandInquisiteur();
    avancerSecondes(etat, 9.8);
    expect(etat.tours.every((t) => t.gel === 0)).toBe(true);
    const vus = evenementsPendant(etat, 0.5);
    expect(compter(vus, 'tour_gelee')).toBe(2);
    expect(tourDeLaCase(etat, 1).gel).toBeGreaterThan(enPas(4) - 12);
    expect(tourDeLaCase(etat, 2).gel).toBeGreaterThan(enPas(4) - 12);
    expect(tourDeLaCase(etat, 0).gel).toBe(0);
  });

  it('une tour gelée ne tire pas pendant 4 s, puis la salve revient 10 s plus tard', () => {
    const etat = partieGrandInquisiteur();
    avancerSecondes(etat, 10.2);
    const gelee = tourDeLaCase(etat, 1);
    const pendant = evenementsPendant(etat, 3.5).filter((e) => e.type === 'tir' && e.tour === gelee.id);
    expect(pendant).toHaveLength(0);
    avancerSecondes(etat, 7);
    expect(gelee.gel).toBeGreaterThan(0);
  });

  it('aucun ralentissement ne l’atteint, contrairement à un ennemi ordinaire ; il reste insensible à l’étourdissement', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'grand_inquisiteur', 10);
    const temoin = passant(etat, 12);
    const ralentissement = { type: 'ralentissement', chance: 1, duree: 5, valeur: 0.5 } as const;
    appliquerEffet(etat, boss, ralentissement);
    appliquerEffet(etat, temoin, ralentissement);
    appliquerEffet(etat, boss, { type: 'etourdissement', chance: 1, duree: 2, valeur: 0 });
    expect(boss.effetsPas[EFFET.ralentissement]).toBe(0);
    expect(boss.effetsPas[EFFET.etourdissement]).toBe(0);
    expect(temoin.effetsPas[EFFET.ralentissement]).toBeGreaterThan(0);
  });
});

describe('Le Roi Fou : à 75, 50 et 25 % de PV, appelle 4 Gardes Royaux et devient invulnérable 3 s', () => {
  function partieRoiFou(): { etat: EtatPartie; roi: Ennemi } {
    const etat = partieEssai();
    const roi = ennemiDonnees(etat, 'roi_fou', 20, { pv: 1e6, degats: [0, 0] });
    return { etat, roi };
  }

  it('sous 75 % de PV : 4 Gardes Royaux apparaissent et le roi devient intouchable 3 s', () => {
    const { etat, roi } = partieRoiFou();
    roi.pv = roi.pvMax * 0.74;
    step(etat);
    expect(ennemisDe(etat, 'garde_royal')).toHaveLength(4);
    expect(roi.invulnerable).toBeGreaterThan(enPas(3) - 3);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'appel', typeEnnemi: 'garde_royal', nombre: 4 }));
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'invulnerabilite', duree: 3 }));
    const pv = roi.pv;
    expect(infligerDegats(etat, roi, 1000, 'pur')).toBe(0);
    appliquerEffet(etat, roi, { type: 'poison', chance: 1, duree: 3, valeur: 100 });
    expect(roi.effetsPas[EFFET.poison]).toBe(0);
    expect(roi.pv).toBe(pv);
  });

  it('redevient vulnérable après 3 s', () => {
    const { etat, roi } = partieRoiFou();
    roi.pv = roi.pvMax * 0.74;
    avancerSecondes(etat, 2.8);
    expect(infligerDegats(etat, roi, 1000, 'pur')).toBe(0);
    avancerSecondes(etat, 0.5);
    expect(roi.invulnerable).toBe(0);
    expect(infligerDegats(etat, roi, 1000, 'pur')).toBeGreaterThan(0);
  });

  it('un seuil ne se déclenche qu’une fois ; les seuils de 50 et de 25 % appellent chacun 4 Gardes de plus', () => {
    const { etat, roi } = partieRoiFou();
    roi.pv = roi.pvMax * 0.74;
    avancerSecondes(etat, 4);
    expect(ennemisDe(etat, 'garde_royal').length).toBe(4);
    roi.pv = roi.pvMax * 0.49;
    avancerSecondes(etat, 4);
    expect(ennemisDe(etat, 'garde_royal').length).toBe(8);
    roi.pv = roi.pvMax * 0.24;
    avancerSecondes(etat, 4);
    expect(ennemisDe(etat, 'garde_royal').length).toBe(12);
    avancerSecondes(etat, 4);
    expect(ennemisDe(etat, 'garde_royal').length).toBe(12);
  });

  it('plusieurs seuils franchis d’un coup les déclenchent tous', () => {
    const { etat, roi } = partieRoiFou();
    roi.pv = roi.pvMax * 0.2;
    step(etat);
    expect(ennemisDe(etat, 'garde_royal')).toHaveLength(12);
    expect(roi.palier).toBe(3);
  });
});

describe('Le Soleil Blême : trois phases', () => {
  /** Soleil furtif (les tours ne le visent pas) à 3,9 tuiles de la tour de la case 1 (11, 7), et un témoin à portée de tir de cette tour. */
  function partieSoleil(part: number): { etat: EtatPartie; soleil: Ennemi; tour: Tour; loin: Tour } {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    construireTour(etat, 3, 'tir');
    const soleil = ennemiDonnees(etat, 'soleil_pale', 13, { pv: 1e9, degats: [0, 0], furtif: true });
    soleil.pv = soleil.pvMax * part;
    return { etat, soleil, tour: tourDeLaCase(etat, 1), loin: tourDeLaCase(etat, 3) };
  }

  it('phase 1 (au-dessus de 66 %) : toutes les 12 s, la portée des tours à 4 tuiles baisse de 30 % pendant 4 s', () => {
    const { etat, tour, loin } = partieSoleil(1);
    // 13 est à 2,8 tuiles de (11, 7) et à 6,3 de (19, 7) : seule la première tour est à 4 tuiles.
    avancerSecondes(etat, 11.8);
    expect(tour.aveuglePas).toBe(0);
    const vus = evenementsPendant(etat, 0.5);
    expect(vus).toContainEqual(expect.objectContaining({ type: 'aveuglement', rayon: 4, duree: 4 }));
    expect(tour.aveugleFacteur).toBe(0.3);
    expect(tour.aveuglePas).toBeGreaterThan(enPas(4) - 15);
    expect(loin.aveuglePas).toBe(0);
    avancerSecondes(etat, 4);
    expect(tour.aveuglePas).toBe(0);
    expect(tour.aveugleFacteur).toBe(0);
  });

  it('une tour aveuglée ne touche plus un ennemi qui n’est plus à sa portée réduite', () => {
    const tirs = (aveugle: boolean): number => {
      const { etat, tour } = partieSoleil(1);
      const portee = tour.stats.portee;
      // Témoin à 85 % de la portée de la tour (elle est à 2 tuiles de l'axe du chemin) : dans sa portée normale, hors de sa
      // portée réduite de 30 % (70 %).
      passant(etat, tour.x + Math.sqrt(portee * 0.85 * portee * 0.85 - 4));
      if (aveugle) {
        tour.aveuglePas = enPas(4);
        tour.aveugleFacteur = 0.3;
      }
      return evenementsPendant(etat, 1).filter((e) => e.type === 'tir' && e.tour === tour.id).length;
    };
    expect(tirs(false)).toBeGreaterThan(0);
    expect(tirs(true)).toBe(0);
  });

  it('phase 2 (entre 66 et 33 %) : plus d’aveuglement, mais 2 Anges de Cendre toutes les 10 s', () => {
    const { etat, tour } = partieSoleil(0.5);
    avancerSecondes(etat, 9.8);
    expect(ennemisDe(etat, 'ange_cendre')).toHaveLength(0);
    const vus = evenementsPendant(etat, 0.5);
    expect(vus).toContainEqual(expect.objectContaining({ type: 'appel', typeEnnemi: 'ange_cendre', nombre: 2 }));
    expect(ennemisDe(etat, 'ange_cendre')).toHaveLength(2);
    avancerSecondes(etat, 10);
    expect(ennemisDe(etat, 'ange_cendre')).toHaveLength(4);
    expect(compter(vus, 'aveuglement')).toBe(0);
    expect(tour.aveuglePas).toBe(0);
    expect(tour.affamePas).toBe(0);
  });

  it('phase 3 (sous 33 %) : cadence −30 % aux tours à 4 tuiles tant qu’il vit, rien d’autre', () => {
    const { etat, soleil, tour, loin } = partieSoleil(0.2);
    avancerSecondes(etat, 3);
    expect(tour.affameCadence).toBe(0.3);
    expect(tour.affamePas).toBeGreaterThan(0);
    expect(loin.affamePas).toBe(0);
    avancerSecondes(etat, 9);
    expect(tour.affamePas).toBeGreaterThan(0);
    expect(tour.aveuglePas).toBe(0);
    expect(ennemisDe(etat, 'ange_cendre')).toHaveLength(0);
    infligerDegats(etat, soleil, 1e12, 'pur');
    avancerSecondes(etat, 3);
    expect(tour.affamePas).toBe(0);
  });

  it('une tour affamée tire environ 30 % moins vite en phase 3', () => {
    const tirsEnPhase = (part: number): number => {
      const { etat } = partieSoleil(part);
      const tour = tourDeLaCase(etat, 1);
      passant(etat, tour.x + 1);
      avancerSecondes(etat, 2);
      return evenementsPendant(etat, 8).filter((e) => e.type === 'tir' && e.tour === tour.id).length;
    };
    const normal = tirsEnPhase(1);
    const affame = tirsEnPhase(0.2);
    expect(affame).toBeGreaterThan(0);
    expect(affame).toBeLessThanOrEqual(normal * 0.8);
  });

  it('une phase repart de zéro quand le boss y entre : la première action vient une cadence après', () => {
    const { etat, soleil } = partieSoleil(1);
    avancerSecondes(etat, 11);
    soleil.pv = soleil.pvMax * 0.5;
    avancerSecondes(etat, 9);
    expect(ennemisDe(etat, 'ange_cendre')).toHaveLength(0);
    avancerSecondes(etat, 1.2);
    expect(ennemisDe(etat, 'ange_cendre')).toHaveLength(2);
  });
});
