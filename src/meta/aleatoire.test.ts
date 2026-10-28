import { describe, expect, it } from 'vitest';
import { sourceCrypto, sourceRejouable } from './aleatoire';
import { sourceListe } from './aides.test-utils';

describe('sourceCrypto', () => {
  it('lit crypto.getRandomValues et rend un nombre dans [0, 1)', () => {
    const appels: number[] = [];
    const faux = {
      getRandomValues: <T extends ArrayBufferView | null>(tableau: T): T => {
        const t = tableau as unknown as Uint32Array;
        t[0] = 0x80000000;
        appels.push(t.length);
        return tableau;
      },
    };
    const source = sourceCrypto(faux);
    expect(source?.()).toBe(0.5);
    expect(appels).toEqual([1]);
  });

  it('ne rend jamais 1, même pour la plus grande valeur 32 bits', () => {
    const faux = {
      getRandomValues: <T extends ArrayBufferView | null>(tableau: T): T => {
        (tableau as unknown as Uint32Array)[0] = 0xffffffff;
        return tableau;
      },
    };
    const v = sourceCrypto(faux)?.() ?? 2;
    expect(v).toBeLessThan(1);
    expect(v).toBeGreaterThan(0.999999);
  });

  it('rend null sans crypto (le tirage est alors refusé, jamais fait avec Math.random)', () => {
    expect(sourceCrypto(null)).toBeNull();
    expect(sourceCrypto({} as unknown as Crypto)).toBeNull();
  });

  it('le crypto de la plateforme donne des nombres dans [0, 1) qui ne se répètent pas', () => {
    const source = sourceCrypto();
    if (!source) throw new Error('crypto absent de cet environnement de test');
    const valeurs = Array.from({ length: 200 }, () => source());
    for (const v of valeurs) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(new Set(valeurs).size).toBeGreaterThan(190);
  });
});

describe('sourceRejouable', () => {
  it('tire la réserve une seule fois et la rejoue à l’identique, à chaque fois depuis le début', () => {
    const rejouable = sourceRejouable(sourceListe([0.1, 0.2, 0.3]), 2);
    const premiere = rejouable();
    expect([premiere(), premiere()]).toEqual([0.1, 0.2]);
    const seconde = rejouable();
    expect([seconde(), seconde()]).toEqual([0.1, 0.2]);
  });

  it('refuse un tirage au-delà de la réserve plutôt que de rendre un nombre au hasard', () => {
    const source = sourceRejouable(sourceListe([0.4]), 1)();
    source();
    expect(() => source()).toThrow('réserve');
  });
});
