import { describe, expect, it } from 'vitest';
import { DIEUX } from '../data/dieux';
import { REGLES } from '../data/regles';
import { CONFIG, avancerSecondes, distance, ennemiEssai, niveauEssai } from './aides.test-utils';
import type { DefEnnemi } from './definitions';
import { ajouterEnnemi } from './ennemis';
import { EFFET, type EtatPartie, type Unite } from './etat';
import { appliquerAction, creerPartie, step } from './partie';
import { PAS_PAR_SECONDE } from './temps';
import { blesserUnite } from './unites';

const charlie = DIEUX.charlie;

function partie(niveauHeros = 1): EtatPartie {
  return creerPartie(niveauEssai(), { ...CONFIG, niveauHeros });
}

function heros(etat: EtatPartie): Unite {
  const h = etat.unites.find((u) => u.id === etat.heros);
  if (!h) throw new Error('pas de héros');
  return h;
}

function cible(etat: EtatPartie, x: number, surcharges: Partial<DefEnnemi> = {}) {
  return ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 0, degats: [0, 0], ...surcharges }), 'paysan_affame', 0, x);
}

describe('héros', () => {
  it('commence au point de départ avec des PV selon son niveau', () => {
    const h1 = heros(partie(1));
    expect(h1).toMatchObject({ genre: 'heros', x: 28, y: 16, pv: charlie.heros.pv });
    const h5 = heros(partie(5));
    expect(h5.pv).toBe(charlie.heros.pv + 4 * charlie.heros.pvParNiveau);
    expect(h5.stats.degats[0]).toBe(charlie.heros.degats[0] + 4 * charlie.heros.degatsParNiveau);
  });

  it('va au point ordonné sur ou près du chemin, à sa vitesse', () => {
    const etat = partie();
    expect(appliquerAction(etat, { type: 'deplacerHeros', x: 25, y: 5.5 })).toEqual({ ok: true });
    expect(etat.evenements).toContainEqual({ type: 'ordre_heros', x: 25, y: 5.5 });
    const h = heros(etat);
    const trajet = distance(28, 16, 25, 5.5);
    avancerSecondes(etat, 1);
    expect(distance(h.x, h.y, 28, 16)).toBeCloseTo(charlie.heros.vitesse, 5);
    avancerSecondes(etat, trajet / charlie.heros.vitesse);
    expect(h.x).toBeCloseTo(25, 5);
    expect(h.y).toBeCloseTo(5.5, 5);
  });

  it('refuse un point loin des chemins ou hors de la carte', () => {
    const etat = partie();
    expect(appliquerAction(etat, { type: 'deplacerHeros', x: 25, y: 8 })).toEqual({ ok: false, raison: 'hors_chemin' });
    expect(appliquerAction(etat, { type: 'deplacerHeros', x: -3, y: 5 })).toEqual({ ok: false, raison: 'hors_carte' });
  });

  it('bloque un ennemi et frappe en zone avec une chance d’étourdir', () => {
    const etat = partie();
    appliquerAction(etat, { type: 'deplacerHeros', x: 20, y: 5 });
    avancerSecondes(etat, 10);
    const a = cible(etat, 20.3);
    const b = cible(etat, 20.6);
    avancerSecondes(etat, 10);
    expect(a.pv).toBeLessThan(a.pvMax);
    expect(b.pv).toBeLessThan(b.pvMax);
    expect([a.bloqueur, b.bloqueur]).toContain(etat.heros);
  });

  it('réapparaît au départ 15 s après sa mort, et ne reçoit pas d’ordre en attendant', () => {
    const etat = partie();
    appliquerAction(etat, { type: 'deplacerHeros', x: 20, y: 5 });
    avancerSecondes(etat, 2);
    const h = heros(etat);
    blesserUnite(etat, h, 100000, 'pur');
    expect(h.mort).toBe(true);
    expect(appliquerAction(etat, { type: 'deplacerHeros', x: 22, y: 5 })).toEqual({ ok: false, raison: 'heros_mort' });
    avancerSecondes(etat, REGLES.reapparitionHeros);
    step(etat);
    expect(h).toMatchObject({ mort: false, x: 28, y: 16, pv: h.stats.pv });
  });
});

describe('sorts de Charlie', () => {
  it('Chute du Colosse : dégâts et étourdissement en zone, puis recharge', () => {
    const etat = partie();
    const sort = charlie.sorts[0];
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: false, raison: 'sort_en_recharge' });
    avancerSecondes(etat, sort.rechargeInitiale);
    const dedans = cible(etat, 10);
    const dehors = cible(etat, 14);
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: true });
    expect(etat.evenements).toContainEqual({ type: 'sort', emplacement: 0, x: 10, y: 5 });
    expect(dedans.pv).toBeLessThan(dedans.pvMax);
    expect(dedans.effetsPas[EFFET.etourdissement]).toBe(Math.round(2.5 * PAS_PAR_SECONDE));
    expect(dehors.pv).toBe(dehors.pvMax);
    expect(etat.sorts[0]?.recharge).toBe(sort.recharge * PAS_PAR_SECONDE);
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: false, raison: 'sort_en_recharge' });
  });

  it('Renforts : deux gros matous qui bloquent puis repartent', () => {
    const etat = partie();
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 1, x: 12, y: 5 })).toEqual({ ok: true });
    const renforts = etat.unites.filter((u) => u.genre === 'renfort');
    expect(renforts).toHaveLength(2);
    const e = ajouterEnnemi(etat, ennemiEssai({ pv: 100000, degats: [0, 0] }), 'paysan_affame', 0, 10);
    avancerSecondes(etat, 3);
    expect(renforts.map((u) => u.id)).toContain(e.bloqueur);
    avancerSecondes(etat, 17);
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
    expect(e.bloqueur).toBe(-1);
  });

  it('refuse un sort inconnu, hors carte, ou un sort de chemin loin du chemin', () => {
    const etat = partie();
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 2, x: 12, y: 5 })).toEqual({ ok: false, raison: 'sort_inconnu' });
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 1, x: 12, y: 9 })).toEqual({ ok: false, raison: 'hors_chemin' });
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 1, x: 40, y: 5 })).toEqual({ ok: false, raison: 'hors_carte' });
  });
});
