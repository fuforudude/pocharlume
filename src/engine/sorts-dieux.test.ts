// Les quatre sorts de Plume et de Pollen (ceux de Charlie sont dans heros.test.ts) : effet principal, recharge, refus.
import { describe, expect, it } from 'vitest';
import { REGLES } from '../data/regles';
import { TOURS } from '../data/tours';
import { avancerSecondes, compter, configDe, construireTour, ennemiFixe, evenementsPendant, partieEssai } from './aides.test-utils';
import { facteurVitesse } from './ennemis';
import { EFFET, type EtatPartie } from './etat';
import { appliquerAction, step } from './partie';
import { poserPiege } from './structures';
import { PAS_PAR_SECONDE } from './temps';

function partie(dieu: string): EtatPartie {
  return partieEssai(configDe(dieu));
}

/** Avance jusqu'à ce que le sort de cet emplacement soit rechargé. */
function attendreSort(etat: EtatPartie, emplacement: number): void {
  avancerSecondes(etat, (etat.sorts[emplacement]?.recharge ?? 0) / PAS_PAR_SECONDE);
}

describe('Voile de Nuit (Plume)', () => {
  it('ralentit de 40 % les ennemis de la zone, pas les autres, et se dissipe au bout de 8 s', () => {
    const etat = partie('plume');
    attendreSort(etat, 0);
    const dedans = ennemiFixe(etat, 10, { vitesse: 1 });
    const dehors = ennemiFixe(etat, 14, { vitesse: 1 });
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: true });
    expect(etat.zones).toHaveLength(1);
    expect(etat.zones[0]).toMatchObject({ x: 10, y: 5, rayon: 2.5, restant: 8 * PAS_PAR_SECONDE });
    expect(etat.evenements).toContainEqual({ type: 'zone', zone: etat.zones[0]?.id, x: 10, y: 5, rayon: 2.5, duree: 8 });
    step(etat);
    expect(facteurVitesse(dedans)).toBeCloseTo(0.6, 5);
    expect(facteurVitesse(dehors)).toBe(1);
    const vus = evenementsPendant(etat, 8);
    expect(compter(vus, 'zone_fin')).toBe(1);
    expect(etat.zones).toHaveLength(0);
    // Le ralentissement ne dure que le temps de la zone (quelques pas de plus).
    avancerSecondes(etat, 1);
    expect(facteurVitesse(dedans)).toBe(1);
  });

  it('un ennemi qui avance dans la zone parcourt 40 % de chemin en moins', () => {
    const libre = partie('plume');
    const voile = partie('plume');
    attendreSort(voile, 0);
    attendreSort(libre, 0);
    const a = ennemiFixe(libre, 8, { vitesse: 1 });
    const b = ennemiFixe(voile, 8, { vitesse: 1 });
    a.vitesse = 1 / PAS_PAR_SECONDE;
    b.vitesse = 1 / PAS_PAR_SECONDE;
    appliquerAction(voile, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 });
    avancerSecondes(libre, 2);
    avancerSecondes(voile, 2);
    expect(a.distance - 8).toBeCloseTo(2, 3);
    expect(b.distance - 8).toBeCloseTo(1.2, 1);
  });

  it('donne +50 points de critique aux tirs des tours sur un ennemi de la zone', () => {
    const etat = partie('plume');
    attendreSort(etat, 0);
    construireTour(etat, 1, 'tir');
    ennemiFixe(etat, 12.5);
    // Hors du voile : seulement les 10 points de critique du bonus de Plume.
    const sans = compter(evenementsPendant(etat, 10).filter((e) => e.type === 'tir' && e.critique), 'tir');
    appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 12.5, y: 5 });
    let avec = 0;
    let tirs = 0;
    for (const e of evenementsPendant(etat, 7.5)) {
      if (e.type !== 'tir') continue;
      tirs++;
      if (e.critique) avec++;
    }
    expect(tirs).toBeGreaterThanOrEqual(8);
    expect(avec / tirs).toBeGreaterThan(0.35);
    expect(sans).toBeLessThan(avec);
  });
});

describe('Griffes d’Ombre (Plume)', () => {
  it('tue net les non-boss de la zone, retire 15 % des PV d’un boss, laisse ceux qui sont dehors', () => {
    const etat = partie('plume');
    attendreSort(etat, 1);
    const a = ennemiFixe(etat, 10, { armure: 0.9, resistance: 0.9 });
    const b = ennemiFixe(etat, 10.3);
    const volant = ennemiFixe(etat, 10.2, { volant: true });
    const boss = ennemiFixe(etat, 10.5, { boss: true, pv: 1000 });
    const dehors = ennemiFixe(etat, 13);
    const aretes = etat.aretes;
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 1, x: 10, y: 5 })).toEqual({ ok: true });
    expect([a.vivant, b.vivant, volant.vivant]).toEqual([false, false, false]);
    expect(boss.vivant).toBe(true);
    expect(boss.pv).toBeCloseTo(boss.pvMax * 0.85, 5);
    expect(dehors.vivant).toBe(true);
    expect(dehors.pv).toBe(dehors.pvMax);
    expect(compter(etat.evenements, 'execution')).toBe(3);
    // Les primes sont versées comme pour une mort ordinaire.
    expect(etat.aretes).toBe(aretes + a.prime + b.prime + volant.prime);
    expect(etat.sorts[1]?.recharge).toBe(60 * PAS_PAR_SECONDE);
  });
});

describe('Pièges à Ressort (Pollen)', () => {
  it('pose trois pièges sur le chemin autour du point visé, puis recharge', () => {
    const etat = partie('pollen');
    attendreSort(etat, 0);
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 12, y: 5.4 })).toEqual({ ok: true });
    expect(etat.pieges).toHaveLength(3);
    etat.pieges.forEach((p, i) => { expect(p.x).toBeCloseTo(12 + (i - 1) * 0.9, 5); });
    expect(etat.pieges.every((p) => p.y === 5)).toBe(true);
    expect(compter(etat.evenements, 'piege_pose')).toBe(3);
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 12, y: 5 })).toEqual({ ok: false, raison: 'sort_en_recharge' });
  });

  it('refuse un point loin du chemin', () => {
    const etat = partie('pollen');
    attendreSort(etat, 0);
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 12, y: 9 })).toEqual({ ok: false, raison: 'hors_chemin' });
    expect(etat.pieges).toHaveLength(0);
  });

  it('chaque piège inflige 60 dégâts physiques et immobilise 1,5 s le premier ennemi au sol qui passe', () => {
    const etat = partie('pollen');
    attendreSort(etat, 0);
    appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 12, y: 5 });
    const marcheur = ennemiFixe(etat, 10, { armure: 0.3 });
    marcheur.vitesse = 1.4 / PAS_PAR_SECONDE;
    const volant = ennemiFixe(etat, 12, { volant: true });
    let vus = 0;
    for (let i = 0; i < 6 * PAS_PAR_SECONDE && vus === 0; i++) {
      step(etat);
      vus += compter(etat.evenements, 'piege_declenche');
    }
    expect(vus).toBe(1);
    expect(etat.pieges).toHaveLength(2);
    // 60 dégâts physiques, réduits de 30 % d'armure.
    expect(marcheur.pvMax - marcheur.pv).toBeCloseTo(42, 5);
    expect(marcheur.effetsPas[EFFET.etourdissement]).toBeGreaterThan(Math.round(1.4 * PAS_PAR_SECONDE));
    expect(volant.pv).toBe(volant.pvMax);
    // Immobilisé, il ne déclenche pas les pièges suivants tant qu'il est pris.
    const x = marcheur.distance;
    avancerSecondes(etat, 1);
    expect(marcheur.distance).toBe(x);
    expect(etat.pieges).toHaveLength(2);
  });

  it('le nombre de pièges est plafonné : le plus ancien disparaît', () => {
    const etat = partie('pollen');
    for (let i = 0; i < REGLES.piegesMax + 3; i++) poserPiege(etat, { degats: 1, typeDegats: 'pur', immobilisation: 1, rayon: 0.5 }, i, 5);
    expect(etat.pieges).toHaveLength(REGLES.piegesMax);
    expect(etat.pieges[0]?.x).toBe(3);
  });
});

describe('Ingéniosité (Pollen)', () => {
  it('donne 40 arêtes et fait tirer plus vite les tours voisines pendant 10 s', () => {
    const etat = partie('pollen');
    attendreSort(etat, 1);
    construireTour(etat, 1, 'tir');
    construireTour(etat, 2, 'tir');
    const proche = etat.tours.find((t) => t.socle === 1);
    const loin = etat.tours.find((t) => t.socle === 2);
    ennemiFixe(etat, 12.5);
    const aretes = etat.aretes;
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 1, x: 10, y: 5 })).toEqual({ ok: true });
    expect(etat.aretes).toBe(aretes + 40);
    expect(proche).toMatchObject({ boostCadence: 0.3, boostPas: 10 * PAS_PAR_SECONDE });
    expect(loin).toMatchObject({ boostCadence: 0, boostPas: 0 });
    expect(compter(etat.evenements, 'boost')).toBe(1);
    const tirs = { proche: 0, loin: 0 };
    for (const e of evenementsPendant(etat, 10)) {
      if (e.type !== 'tir') continue;
      if (e.tour === proche?.id) tirs.proche++;
      else tirs.loin++;
    }
    // Cadence 0,8 s contre 0,8 / 1,3 s : au moins 3 tirs d'écart sur 10 s.
    expect(tirs.proche).toBeGreaterThanOrEqual(tirs.loin + 3);
    expect(proche?.boostPas).toBe(0);
    expect(proche?.boostCadence).toBe(0);
    expect(TOURS.tir.niveaux[0].cadence).toBe(0.8);
  });
});
