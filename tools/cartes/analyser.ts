// Analyse des chemins des cartes : segments non alignés, coordonnées paires (à cheval sur deux cases), imprime tout.
import { CARTES } from '../../src/data/niveaux/cartes-toutes.ts';

for (const [id, c] of Object.entries(CARTES)) {
  const diag: string[] = [];
  const pairs: string[] = [];
  c.chemins.forEach((ch, k) => {
    ch.points.forEach((p, i) => {
      const q = ch.points[i - 1];
      if (q && p.x !== q.x && p.y !== q.y) diag.push(`${k}:${i}`);
      if (p.x % 2 === 0 || p.y % 2 === 0) pairs.push(`${k}:${i}(${p.x},${p.y})`);
    });
  });
  console.log(id, c.largeur + 'x' + c.hauteur, 'diag', diag.join(' ') || '-', 'pairs', pairs.length, 'hero', JSON.stringify(c.departHeros));
  c.chemins.forEach((ch) => console.log('   ', ch.points.map((p) => `[${p.x},${p.y}]`).join('')));
}
