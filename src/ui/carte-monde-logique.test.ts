import { describe, expect, it } from 'vitest';
import { NOEUDS_REGION1 } from '../data/niveaux/carte-du-monde';
import { enregistrerVictoire, sauvegardeVide, type Sauvegarde } from '../save';
import {
  directionDeTouche,
  etoilesParDifficulte,
  iconesDefis,
  nombreTroncons,
  noeudInitial,
  noeudToucheA,
  noeudVoisin,
  regionInitiale,
  regionVisee,
  regionVoisine,
  vueNoeuds,
  vueRegions,
  type RegionPourVue,
} from './carte-monde-logique';

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

/** Une sauvegarde où les niveaux 1 à `n` sont réussis, avec ces défis réussis. */
function avecDefis(n: number, defis: Sauvegarde['meta']['defis']): Sauvegarde {
  const s = reussis(n);
  return { ...s, meta: { ...s.meta, defis } };
}

describe('vueNoeuds : région d’après la campagne', () => {
  it('une région plus loin numérote ses nœuds avec les numéros de campagne (le nœud 3 de la région 2 est le niveau 13)', () => {
    const vues = vueNoeuds(reussis(12), NOEUDS_REGION1, 10);
    expect(vues.map((v) => v.numero)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(vues.filter((v) => v.boss).map((v) => v.numero)).toEqual([20]);
  });

  it('la visibilité, les étoiles et le clignotement se lisent sur le niveau de campagne', () => {
    const vues = vueNoeuds(reussis(12, 2), NOEUDS_REGION1, 10); // niveaux 1 à 12 réussis, 13 débloqué
    expect(vues.filter((v) => v.visible).map((v) => v.numero)).toEqual([11, 12, 13]);
    expect(vues.filter((v) => v.clignote).map((v) => v.numero)).toEqual([13]);
    expect(vues.slice(0, 2).map((v) => v.etoiles)).toEqual([2, 2]);
  });

  it('la région 1 garde ses numéros', () => {
    expect(vueNoeuds(reussis(2), NOEUDS_REGION1).map((v) => v.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('chaque nœud porte les défis réussis de son niveau', () => {
    const vues = vueNoeuds(avecDefis(4, { '2': { heroique: true }, '4': { heroique: true, fer: true } }), NOEUDS_REGION1);
    expect(vues.map((v) => v.defis)).toEqual([{}, { heroique: true }, {}, { heroique: true, fer: true }, {}, {}, {}, {}, {}, {}]);
  });

  it('les défis d’une autre région ne se mélangent pas à ceux-ci', () => {
    const s = avecDefis(1, { '12': { fer: true } });
    expect(vueNoeuds(s, NOEUDS_REGION1).every((v) => Object.keys(v.defis).length === 0)).toBe(true);
    expect(vueNoeuds(reussis(12), NOEUDS_REGION1, 10).some((v) => v.defis.fer === true)).toBe(false);
    const avec = { ...reussis(12), meta: { ...reussis(12).meta, defis: { '12': { fer: true as const } } } };
    expect(vueNoeuds(avec, NOEUDS_REGION1, 10)[1]?.defis).toEqual({ fer: true });
  });
});

describe('iconesDefis', () => {
  it('rien sans défi réussi', () => {
    expect(iconesDefis({})).toEqual([]);
  });

  it('une icône par défi réussi, Héroïque puis Fer, à des places différentes', () => {
    const [h] = iconesDefis({ heroique: true });
    const [f] = iconesDefis({ fer: true });
    expect(h?.sprite).toBe('icone-defi-heroique');
    expect(f?.sprite).toBe('icone-defi-fer');
    const deux = iconesDefis({ heroique: true, fer: true });
    expect(deux.map((i) => i.sprite)).toEqual(['icone-defi-heroique', 'icone-defi-fer']);
    expect(deux[0]?.dx).not.toBe(deux[1]?.dx);
  });
});

describe('régions du monde', () => {
  const regions: RegionPourVue[] = [1, 2, 3, 4, 5].map((numero) => ({ numero, nom: `region.${String(numero)}`, contenu: numero <= 2 ? {} : null }));
  const ouvertes = (regionMax: number): Sauvegarde => {
    const s = sauvegardeVide();
    return { ...s, meta: { ...s.meta, regionMax } };
  };

  it('une région est ouverte jusqu’à regionMax, les autres sont visibles mais verrouillées', () => {
    const vues = vueRegions(ouvertes(2), regions);
    expect(vues.map((v) => v.ouverte)).toEqual([true, true, false, false, false]);
    expect(vues).toHaveLength(5);
  });

  it('une région ouverte dont les niveaux ne sont pas livrés est dite indisponible', () => {
    const vues = vueRegions(ouvertes(3), regions);
    expect(vues.map((v) => v.disponible)).toEqual([true, true, false, false, false]);
  });

  it('s’ouvre sur la plus haute région ouverte, sans dépasser celles qu’on montre', () => {
    expect(regionInitiale(ouvertes(1), regions)).toBe(0);
    expect(regionInitiale(ouvertes(2), regions)).toBe(1);
    expect(regionInitiale(ouvertes(9), regions)).toBe(4);
  });

  it('la région suivante n’est atteinte que si elle est ouverte, sinon on dit laquelle est fermée', () => {
    expect(regionVoisine(ouvertes(2), regions, 0, 1)).toEqual({ index: 1, bloquee: false });
    expect(regionVoisine(ouvertes(2), regions, 1, 1)).toEqual({ index: 1, bloquee: true, visee: 3 });
    expect(regionVoisine(ouvertes(2), regions, 1, -1)).toEqual({ index: 0, bloquee: false });
  });

  it('aux deux bouts, la navigation ne bouge pas et ne se plaint pas', () => {
    expect(regionVoisine(ouvertes(1), regions, 0, -1)).toEqual({ index: 0, bloquee: false });
    expect(regionVoisine(ouvertes(9), regions, 4, 1)).toEqual({ index: 4, bloquee: false });
  });

  it('une région visée (touchée directement) suit la même règle', () => {
    expect(regionVisee(ouvertes(2), regions, 1)).toEqual({ index: 1, bloquee: false });
    expect(regionVisee(ouvertes(2), regions, 3)).toEqual({ index: -1, bloquee: true, visee: 4 });
    expect(regionVisee(ouvertes(2), regions, 9)).toEqual({ index: -1, bloquee: false });
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
