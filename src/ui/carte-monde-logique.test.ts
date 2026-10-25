import { describe, expect, it } from 'vitest';
import { NOEUDS_REGION1 } from '../data/niveaux/carte-du-monde';
import { enregistrerVictoire, sauvegardeVide, type Sauvegarde } from '../save';
import { directionDeTouche, etoilesParDifficulte, nombreTroncons, noeudInitial, noeudToucheA, noeudVoisin, vueNoeuds } from './carte-monde-logique';

/** Une sauvegarde où les niveaux 1 à `n` sont réussis (3 étoiles en Matou). */
function reussis(n: number, etoiles = 3): Sauvegarde {
  let s = sauvegardeVide();
  for (let i = 1; i <= n; i++) s = enregistrerVictoire(s, i, 'matou', etoiles);
  return s;
}

describe('vueNoeuds', () => {
  it('nouveau joueur : seul le niveau 1 est visible, et il clignote', () => {
    const vues = vueNoeuds(sauvegardeVide(), NOEUDS_REGION1);
    expect(vues.filter((v) => v.visible).map((v) => v.numero)).toEqual([1]);
    expect(vues.filter((v) => v.clignote).map((v) => v.numero)).toEqual([1]);
    expect(vues.every((v) => v.etoiles === 0 && !v.reussi)).toBe(true);
  });

  it('après le niveau 2 : 1 à 3 visibles, 3 seul clignote, les étoiles obtenues sont données', () => {
    let s = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 2);
    s = enregistrerVictoire(s, 2, 'chaton', 1);
    const vues = vueNoeuds(s, NOEUDS_REGION1);
    expect(vues.filter((v) => v.visible).map((v) => v.numero)).toEqual([1, 2, 3]);
    expect(vues.filter((v) => v.clignote).map((v) => v.numero)).toEqual([3]);
    expect(vues.slice(0, 3).map((v) => v.etoiles)).toEqual([2, 1, 0]);
    expect(vues.slice(0, 2).every((v) => v.reussi)).toBe(true);
  });

  it('rejouer un niveau déjà réussi n’enlève jamais d’étoile ni ne fait clignoter le niveau', () => {
    let s = reussis(2);
    s = enregistrerVictoire(s, 1, 'matou', 1);
    const vues = vueNoeuds(s, NOEUDS_REGION1);
    expect(vues[0]?.etoiles).toBe(3);
    expect(vues[0]?.clignote).toBe(false);
  });

  it('prend le meilleur résultat toutes difficultés confondues', () => {
    let s = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 1);
    s = enregistrerVictoire(s, 1, 'vieux_sage', 3);
    expect(vueNoeuds(s, NOEUDS_REGION1)[0]?.etoiles).toBe(3);
  });

  it('région terminée : tout est visible, plus rien ne clignote, le boss est distinct', () => {
    const vues = vueNoeuds(reussis(10), NOEUDS_REGION1);
    expect(vues.every((v) => v.visible && v.reussi && !v.clignote)).toBe(true);
    expect(vues.filter((v) => v.boss).map((v) => v.numero)).toEqual([10]);
  });

  it('ne modifie pas les nœuds de données', () => {
    const avant = JSON.stringify(NOEUDS_REGION1);
    vueNoeuds(reussis(4), NOEUDS_REGION1);
    expect(JSON.stringify(NOEUDS_REGION1)).toBe(avant);
  });
});

describe('nombreTroncons', () => {
  it('relie les nœuds visibles, jamais plus', () => {
    expect(nombreTroncons(vueNoeuds(sauvegardeVide(), NOEUDS_REGION1))).toBe(0);
    expect(nombreTroncons(vueNoeuds(reussis(1), NOEUDS_REGION1))).toBe(1);
    expect(nombreTroncons(vueNoeuds(reussis(5), NOEUDS_REGION1))).toBe(5);
    expect(nombreTroncons(vueNoeuds(reussis(10), NOEUDS_REGION1))).toBe(9);
  });
});

describe('étoiles par difficulté', () => {
  it('donne les trois difficultés dans l’ordre, 0 pour celles jamais réussies', () => {
    let s = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 2);
    s = enregistrerVictoire(s, 1, 'vieux_sage', 1);
    expect(etoilesParDifficulte(s, 1)).toEqual([
      { difficulte: 'chaton', etoiles: 0 },
      { difficulte: 'matou', etoiles: 2 },
      { difficulte: 'vieux_sage', etoiles: 1 },
    ]);
    expect(etoilesParDifficulte(s, 2).every((e) => e.etoiles === 0)).toBe(true);
  });
});

describe('sélection', () => {
  it('commence sur le prochain niveau à jouer, ou sur le dernier visible si la région est finie', () => {
    expect(noeudInitial(vueNoeuds(reussis(3), NOEUDS_REGION1))).toBe(3);
    expect(noeudInitial(vueNoeuds(sauvegardeVide(), NOEUDS_REGION1))).toBe(0);
    expect(noeudInitial(vueNoeuds(reussis(10), NOEUDS_REGION1))).toBe(9);
  });

  it('les flèches suivent le chemin sans atteindre un nœud caché ni sortir de la carte', () => {
    const vues = vueNoeuds(reussis(2), NOEUDS_REGION1); // 1, 2, 3 visibles
    expect(noeudVoisin(vues, 0, 'droite')).toBe(1);
    expect(noeudVoisin(vues, 1, 'bas')).toBe(2);
    expect(noeudVoisin(vues, 2, 'droite')).toBe(2);
    expect(noeudVoisin(vues, 2, 'gauche')).toBe(1);
    expect(noeudVoisin(vues, 1, 'haut')).toBe(0);
    expect(noeudVoisin(vues, 0, 'gauche')).toBe(0);
    expect(noeudVoisin(vueNoeuds(reussis(10), NOEUDS_REGION1), 9, 'droite')).toBe(9);
  });

  it('traduit les flèches du clavier et ignore les autres touches', () => {
    expect(directionDeTouche('ArrowLeft')).toBe('gauche');
    expect(directionDeTouche('ArrowRight')).toBe('droite');
    expect(directionDeTouche('ArrowUp')).toBe('haut');
    expect(directionDeTouche('ArrowDown')).toBe('bas');
    expect(directionDeTouche('Enter')).toBeNull();
    expect(directionDeTouche('a')).toBeNull();
  });
});

describe('toucher un nœud', () => {
  const vues = vueNoeuds(reussis(3), NOEUDS_REGION1); // 1 à 4 visibles

  it('trouve le nœud visible sous le point, à rayon près', () => {
    const n2 = NOEUDS_REGION1[1];
    if (!n2) throw new Error('nœud 2 absent');
    expect(noeudToucheA(vues, n2.x, n2.y, 12)).toBe(1);
    expect(noeudToucheA(vues, n2.x + 8, n2.y - 8, 12)).toBe(1);
    expect(noeudToucheA(vues, n2.x + 20, n2.y, 12)).toBe(-1);
  });

  it('ne touche jamais un nœud verrouillé', () => {
    const n8 = NOEUDS_REGION1[7];
    if (!n8) throw new Error('nœud 8 absent');
    expect(noeudToucheA(vues, n8.x, n8.y, 30)).toBe(-1);
  });

  it('choisit le plus proche quand deux nœuds sont à portée', () => {
    const a = NOEUDS_REGION1[0];
    const b = NOEUDS_REGION1[1];
    if (!a || !b) throw new Error('nœuds absents');
    const x = (a.x * 3 + b.x) / 4;
    const y = (a.y * 3 + b.y) / 4;
    expect(noeudToucheA(vues, x, y, 200)).toBe(0);
  });
});
