import { describe, expect, it } from 'vitest';
import { ECART_MAX_MS, PAS_MAX_PAR_IMAGE, PasFixes } from './pas-fixes';

describe('PasFixes', () => {
  it('ne simule rien tant qu’un pas entier de 1/30 s n’est pas écoulé', () => {
    const p = new PasFixes();
    expect(p.avancer(16)).toBe(0);
    expect(p.alpha).toBeCloseTo(0.48, 5);
  });

  it('accumule les images courtes : deux images à 60 i/s font un pas', () => {
    const p = new PasFixes();
    let total = 0;
    for (let i = 0; i < 60; i++) total += p.avancer(1000 / 60);
    expect(total).toBe(30);
  });

  it('simule exactement 30 pas par seconde réelle à 1×, quelle que soit la cadence', () => {
    for (const cadence of [30, 45, 60, 90, 144]) {
      const p = new PasFixes();
      let total = 0;
      for (let i = 0; i < cadence; i++) total += p.avancer(1000 / cadence);
      expect(total).toBe(30);
    }
  });

  it('le double de pas à la vitesse ×2', () => {
    const p = new PasFixes();
    p.vitesse = 2;
    let total = 0;
    for (let i = 0; i < 60; i++) total += p.avancer(1000 / 60);
    expect(total).toBe(60);
  });

  it('un grand écart donne plusieurs pas et garde le reste pour l’interpolation', () => {
    const p = new PasFixes();
    expect(p.avancer(100)).toBe(3);
    expect(p.alpha).toBeCloseTo(0, 6);
    expect(p.avancer(50)).toBe(1);
    expect(p.alpha).toBeCloseTo(0.5, 6);
  });

  it('en pause, aucun pas et l’interpolation est figée', () => {
    const p = new PasFixes();
    p.avancer(50);
    const alpha = p.alpha;
    p.pause = true;
    expect(p.avancer(1000)).toBe(0);
    expect(p.alpha).toBe(alpha);
    p.pause = false;
    expect(p.avancer(33.4)).toBeGreaterThanOrEqual(1);
  });

  it('borne l’écart (onglet resté en arrière-plan) et le nombre de pas par image', () => {
    const p = new PasFixes();
    // 60 s réelles comptent pour 250 ms : 7 pas à ×1.
    expect(p.avancer(60_000)).toBe(7);
    expect(p.alpha).toBeCloseTo(0.5, 6);
    // À ×2 le même écart ferait 15 pas : on s'arrête à PAS_MAX_PAR_IMAGE et on abandonne le surplus.
    const q = new PasFixes();
    q.vitesse = 2;
    expect(q.avancer(ECART_MAX_MS)).toBe(PAS_MAX_PAR_IMAGE);
    expect(q.alpha).toBeLessThan(1);
  });

  it('ignore un écart négatif (horloge qui recule)', () => {
    const p = new PasFixes();
    expect(p.avancer(-50)).toBe(0);
    expect(p.alpha).toBe(0);
  });

  it('l’alpha reste toujours dans [0, 1[', () => {
    const p = new PasFixes();
    p.vitesse = 2;
    for (let i = 0; i < 1000; i++) {
      p.avancer(1 + ((i * 7) % 40));
      expect(p.alpha).toBeGreaterThanOrEqual(0);
      expect(p.alpha).toBeLessThan(1);
    }
  });

  it('réinitialiser remet le reste à zéro', () => {
    const p = new PasFixes();
    p.avancer(20);
    p.reinitialiser();
    expect(p.alpha).toBe(0);
  });
});
