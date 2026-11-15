// Rythme de la Manif (DLC « Temps modernes », région 2), spec docs/specs/2026-11-15-dlc-rythme.md : 8 à 10 vagues par niveau, la menace
// totale de chaque niveau gardée (vagues plus denses), les événements replacés sur les vagues qui existent, les trois arrivées de la Manif
// inchangées (Cavalier au 13, Hélicoptère au 16, Centaure au 18).
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../ennemis';
import { menaceVague } from '../equilibrage';
import { PLANS_MODERNE_R2 } from './plan-moderne-r2';
import { VAGUES_MODERNE_R2 } from './vagues-moderne-r2';

/** Menace totale des vagues figées de chaque niveau 11 à 19, relevée sur la branche de base avant le passage à 8-10 vagues (13 à 15). */
const MENACE_AVANT: Readonly<Record<number, number>> = {
  11: 13191,
  12: 13888,
  13: 14834,
  14: 16478,
  15: 25861,
  16: 17506,
  17: 19008,
  18: 20205,
  19: 21370,
};

const niveaux = PLANS_MODERNE_R2.map((plan, i) => ({ plan, vagues: VAGUES_MODERNE_R2[i] ?? [] }));

describe('rythme de la Manif', () => {
  it.each(niveaux.map((n) => [n.plan.numero, n] as const))('niveau %i : 8 à 10 vagues', (_numero, { plan, vagues }) => {
    expect(vagues.length).toBe(plan.vagues.nombre);
    expect(vagues.length).toBeGreaterThanOrEqual(8);
    expect(vagues.length).toBeLessThanOrEqual(10);
  });

  it.each(niveaux.filter((n) => n.plan.numero < 20).map((n) => [n.plan.numero, n] as const))('niveau %i : menace totale entre 85 et 115 % de celle d’avant', (numero, { vagues }) => {
    const total = vagues.reduce((s, v) => s + menaceVague(v, ENNEMIS), 0);
    const avant = MENACE_AVANT[numero] ?? 0;
    expect(total / avant).toBeGreaterThanOrEqual(0.85);
    expect(total / avant).toBeLessThanOrEqual(1.15);
  });

  it.each(niveaux.map((n) => [n.plan.numero, n] as const))('niveau %i : aucun événement ni boss au-delà de la dernière vague', (_numero, { plan, vagues }) => {
    for (const e of plan.evenements ?? []) expect(e.vague, `${e.type} vague ${String(e.vague)}`).toBeLessThanOrEqual(vagues.length);
    for (const e of plan.evenements ?? []) expect(e.vague).toBeGreaterThanOrEqual(1);
    if (plan.vagues.boss) expect(plan.vagues.boss.vague).toBe(vagues.length);
  });

  it('les arrivées de la Manif ne bougent pas : Cavalier au 13, Hélicoptère au 16, Centaure au 18', () => {
    const premier = (id: string): number | undefined =>
      niveaux.find(({ plan, vagues }) => vagues.some((v) => v.paquets.some((p) => p.ennemi === id)) || (plan.evenements ?? []).some((e) => e.type === 'charge' && e.ennemi === id))?.plan.numero;
    expect(premier('moderne_cavalier_monte')).toBe(13);
    expect(premier('moderne_helicoptere')).toBe(16);
    expect(premier('moderne_centaure')).toBe(18);
  });
});
