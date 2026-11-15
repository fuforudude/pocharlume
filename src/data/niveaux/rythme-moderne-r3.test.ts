// Rythme plus nerveux (spec docs/specs/2026-11-15-dlc-rythme.md) pour la Préfecture (région 3 du DLC, niveaux 21 à 30) : 9 à 11 vagues par
// niveau, la menace totale d'un niveau gardée (vagues plus denses), et aucun événement, chemin ou foule sur une vague qui n'existe plus.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../ennemis';
import { menaceVague } from '../equilibrage';
import { PLANS_MODERNE_R3 } from './plan-moderne-r3';
import { VAGUES_MODERNE_R3 } from './vagues-moderne-r3';

/**
 * Relevé d'avant (branche agents/dlc-rythme, 12 à 15 vagues par niveau) : somme des menaces des vagues figées, préfet exclu (niveau 30 :
 * seules ses vagues ordinaires comptent, la mise en scène du boss est hors budget).
 */
const MENACE_AVANT: readonly number[] = [17202, 16735, 21058, 21135, 19825, 13946, 19336, 19585, 15905, 20308];

const sansBoss = (paquets: readonly { ennemi: string }[]) => ({ paquets: paquets.filter((p) => p.ennemi !== 'moderne_prefet') });

describe('rythme de la Préfecture', () => {
  it('chaque niveau compte de 9 à 11 vagues, et le plan et les vagues figées sont d’accord', () => {
    expect(PLANS_MODERNE_R3).toHaveLength(10);
    PLANS_MODERNE_R3.forEach((p, i) => {
      const n = VAGUES_MODERNE_R3[i]?.length ?? 0;
      expect(n, `niveau ${String(p.numero)}`).toBeGreaterThanOrEqual(9);
      expect(n, `niveau ${String(p.numero)}`).toBeLessThanOrEqual(11);
      expect(p.vagues.nombre, `niveau ${String(p.numero)}`).toBe(n);
    });
  });

  it('la menace totale des vagues de chaque niveau reste entre 85 et 115 % de celle d’avant', () => {
    PLANS_MODERNE_R3.forEach((p, i) => {
      const vagues = VAGUES_MODERNE_R3[i] ?? [];
      const total = vagues.reduce((s, v) => s + menaceVague(sansBoss(v.paquets) as never, ENNEMIS), 0);
      const avant = MENACE_AVANT[i] ?? 0;
      expect(total / avant, `niveau ${String(p.numero)} : ${String(Math.round(total))} contre ${String(avant)} avant`).toBeGreaterThanOrEqual(0.85);
      expect(total / avant, `niveau ${String(p.numero)} : ${String(Math.round(total))} contre ${String(avant)} avant`).toBeLessThanOrEqual(1.15);
    });
  });

  it('aucun événement, chemin fermé ou foule ne pointe vers une vague qui n’existe pas', () => {
    PLANS_MODERNE_R3.forEach((p) => {
      const n = p.vagues.nombre;
      const problemes: string[] = [];
      const parcourir = (x: unknown, chemin: string): void => {
        if (Array.isArray(x)) return x.forEach((e, k) => { parcourir(e, `${chemin}[${String(k)}]`); });
        if (typeof x !== 'object' || x === null) return;
        for (const [cle, valeur] of Object.entries(x)) {
          if (cle === 'vague' && typeof valeur === 'number' && (valeur < 1 || valeur > n)) problemes.push(`${chemin} : vague ${String(valeur)}`);
          else parcourir(valeur, `${chemin}.${cle}`);
        }
      };
      parcourir(p.evenements, 'evenements');
      parcourir(p.cheminsFermes, 'cheminsFermes');
      parcourir(p.foules, 'foules');
      expect(problemes, `niveau ${String(p.numero)} (${String(n)} vagues)`).toEqual([]);
    });
  });

  it('le boss du niveau 30 reste dans la dernière vague', () => {
    const p = PLANS_MODERNE_R3[9];
    expect(p?.vagues.boss?.vague).toBe(p?.vagues.nombre);
  });
});
