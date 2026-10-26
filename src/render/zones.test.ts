import { describe, expect, it } from 'vitest';
import { tuileTouchee } from './zones';

const TUILE = 16;

/** Toutes les tuiles du carré qui entoure le disque, filtrées par `tuileTouchee`. */
function tuilesCouvertes(cx: number, cy: number, r: number): Set<string> {
  const couvertes = new Set<string>();
  for (let ty = Math.floor((cy - r) / TUILE) - 1; ty <= Math.floor((cy + r) / TUILE) + 1; ty++) {
    for (let tx = Math.floor((cx - r) / TUILE) - 1; tx <= Math.floor((cx + r) / TUILE) + 1; tx++) {
      if (tuileTouchee(tx, ty, cx, cy, r, TUILE)) couvertes.add(`${String(tx)},${String(ty)}`);
    }
  }
  return couvertes;
}

describe('tuiles d’une zone (Voile de Nuit : rayon 2,5 tuiles)', () => {
  const cx = 10.3 * TUILE;
  const cy = 7.8 * TUILE;
  const r = 2.5 * TUILE;

  it('chaque point du disque est sur une tuile dessinée : le rayon réel est couvert', () => {
    const couvertes = tuilesCouvertes(cx, cy, r);
    for (let a = 0; a < 360; a += 3) {
      for (const fraction of [0, 0.5, 0.99]) {
        const x = cx + Math.cos((a * Math.PI) / 180) * r * fraction;
        const y = cy + Math.sin((a * Math.PI) / 180) * r * fraction;
        expect(couvertes.has(`${String(Math.floor(x / TUILE))},${String(Math.floor(y / TUILE))}`), `${String(x)},${String(y)}`).toBe(true);
      }
    }
  });

  it('aucune tuile entièrement hors du disque n’est dessinée', () => {
    expect(tuileTouchee(20, 7, cx, cy, r, TUILE)).toBe(false);
    expect(tuileTouchee(10, 12, cx, cy, r, TUILE)).toBe(false);
    for (const cle of tuilesCouvertes(cx, cy, r)) {
      const [tx, ty] = cle.split(',').map(Number);
      // Le coin de la tuile le plus proche du centre est dans le disque : la tuile le touche bien.
      const px = Math.min(Math.max(cx, (tx ?? 0) * TUILE), ((tx ?? 0) + 1) * TUILE);
      const py = Math.min(Math.max(cy, (ty ?? 0) * TUILE), ((ty ?? 0) + 1) * TUILE);
      expect(Math.hypot(cx - px, cy - py)).toBeLessThanOrEqual(r + 1e-9);
    }
  });

  it('la zone couvre une trentaine de tuiles, pas un simple point', () => {
    const n = tuilesCouvertes(cx, cy, r).size;
    expect(n).toBeGreaterThan(25);
    expect(n).toBeLessThan(50);
  });

  it('un rayon plus petit couvre moins de tuiles', () => {
    expect(tuilesCouvertes(cx, cy, 1.2 * TUILE).size).toBeLessThan(tuilesCouvertes(cx, cy, r).size);
  });
});
