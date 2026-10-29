// Le sol dessiné et les cases interdites par le chemin sont les mêmes cases (jalon 5) : on ne voit jamais une case libre à moitié
// recouverte de chemin, ni un chemin dessiné sur une case où l'on peut construire.
import { describe, expect, it } from 'vitest';
import { REGLES } from '../data/regles';
import { CARTES } from '../data/niveaux/cartes-toutes';
import { decorVisible } from '../data/niveaux/assemblage';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { empriseDecor, GRANDS_DECORS } from '../data/niveaux/habillage';
import { construireSol } from './sol';

const T = REGLES.tailleCase;

describe.each(Object.entries(CARTES))('sol et cases interdites, carte %s', (_id, modele) => {
  const carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins, departHeros: modele.departHeros };
  const interdites = new Set(casesInterditesDuNiveau(carte, []).map((c) => `${String(c.cx)},${String(c.cy)}`));
  const sol = construireSol(carte, { region: modele.region, zones: modele.zones, decor: modele.decor });

  it('l’ensemble des cases interdites par le chemin est celui des cases dont le sol est dessiné en chemin', () => {
    const dessinees = new Set<string>();
    for (let cy = 0; cy < modele.hauteur / T; cy++) {
      for (let cx = 0; cx < modele.largeur / T; cx++) {
        const noms = [];
        for (let dy = 0; dy < T; dy++) for (let dx = 0; dx < T; dx++) noms.push(sol.tuiles[(cy * T + dy) * modele.largeur + cx * T + dx] ?? '');
        const chemin = noms.filter((n) => n.includes('chemin'));
        expect(chemin.length === 0 || chemin.length === noms.length, `case ${String(cx)},${String(cy)} à moitié dessinée en chemin`).toBe(true);
        if (chemin.length > 0) dessinees.add(`${String(cx)},${String(cy)}`);
      }
    }
    expect([...dessinees].sort()).toEqual([...interdites].sort());
  });

  it('toute case voisine du chemin est constructible, sauf si un grand décor visible la recouvre (décor réel de la carte)', () => {
    const decor = decorVisible(modele, carte);
    const reelles = new Set(casesInterditesDuNiveau(carte, decor).map((c) => `${String(c.cx)},${String(c.cy)}`));
    const grands = decor.filter((d) => GRANDS_DECORS.has(d.sprite)).map((d) => empriseDecor(d));
    const recouverte = (cx: number, cy: number): boolean => grands.some((e) => e.x0 < (cx + 1) * T && e.x1 > cx * T && e.y0 < (cy + 1) * T && e.y1 > cy * T);
    for (const clef of interdites) {
      const [cx = 0, cy = 0] = clef.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const voisine = `${String(cx + dx)},${String(cy + dy)}`;
        const existe = cx + dx >= 0 && cy + dy >= 0 && cx + dx < modele.largeur / T && cy + dy < modele.hauteur / T;
        if (!existe || interdites.has(voisine)) continue;
        // Interdite avec le décor réel : un grand décor visible la recouvre vraiment (sinon la case est libre).
        if (reelles.has(voisine)) expect(recouverte(cx + dx, cy + dy), `case ${voisine} interdite sans grand décor dessus`).toBe(true);
      }
    }
  });
});
