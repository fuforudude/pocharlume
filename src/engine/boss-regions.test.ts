// Mécaniques des 4 boss des régions 2 à 5 (jalon 3), jouées avec les valeurs des données : un test par mécanique.
import { describe, expect, it } from 'vitest';
import { avancerSecondes, compter, construireTour, ennemiDonnees, ennemisDe, evenementsPendant, partieEssai, tourDe } from './aides.test-utils';
import { premierEnnemi } from './ciblage';
import { appliquerEffet, infligerDegats } from './degats';
import { EFFET, type EtatPartie, type Tour } from './etat';
import { step } from './partie';
import { enPas } from './temps';

/** Nombre de tirs de la tour pendant `secondes`. */
function tirsDe(etat: EtatPartie, tour: Tour, secondes: number): number {
  return evenementsPendant(etat, secondes).filter((e) => e.type === 'tir' && e.tour === tour.id).length;
}

function tourDeLaCase(etat: EtatPartie, i: number): Tour {
  const t = tourDe(etat, i);
  if (!t) throw new Error(`pas de tour sur la case d'essai ${String(i)}`);
  return t;
}

describe('La Faim : chaque quart de PV perdu affame les tours à portée', () => {
  function partieFaim(declencher: boolean): { etat: EtatPartie; proche: Tour; loin: Tour } {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    construireTour(etat, 3, 'tir');
    const boss = ennemiDonnees(etat, 'la_faim', 9, { pv: 1e6 });
    if (declencher) boss.pv = boss.pvMax * 0.7;
    return { etat, proche: tourDeLaCase(etat, 1), loin: tourDeLaCase(etat, 3) };
  }

  it('sous 75 % des PV, les tours à moins de 5 tuiles perdent 30 % de cadence pendant 5 s', () => {
    const { etat, proche, loin } = partieFaim(true);
    step(etat);
    expect(proche.affamePas).toBeGreaterThan(enPas(5) - 3);
    expect(proche.affameCadence).toBe(0.3);
    expect(loin.affamePas).toBe(0);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'famine', rayon: 5, duree: 5 }));
  });

  it('une tour affamée tire environ 30 % moins vite', () => {
    const normal = partieFaim(false);
    const affame = partieFaim(true);
    const tirsNormaux = tirsDe(normal.etat, normal.proche, 5);
    const tirsAffames = tirsDe(affame.etat, affame.proche, 5);
    expect(tirsAffames).toBeGreaterThan(0);
    expect(tirsAffames).toBeLessThanOrEqual(tirsNormaux * 0.8);
  });

  it('la famine finit après 5 s et ne se redéclenche pas au même palier', () => {
    const { etat, proche } = partieFaim(true);
    avancerSecondes(etat, 6);
    expect(proche.affamePas).toBe(0);
    const boss = ennemisDe(etat, 'la_faim')[0];
    expect(boss?.palier).toBe(1);
  });

  it('chaque palier (75, 50, 25 %) affame une fois, même franchis ensemble', () => {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    const boss = ennemiDonnees(etat, 'la_faim', 9, { pv: 1e6 });
    boss.pv = boss.pvMax * 0.2;
    step(etat);
    expect(compter(etat.evenements, 'famine')).toBe(3);
    expect(boss.palier).toBe(3);
  });
});

describe('Le Juge des Flammes : met le feu à la tour la plus proche, appelle des Porteurs de Torche', () => {
  it('toutes les 12 s, la tour la plus proche est désactivée 4 s', () => {
    const etat = partieEssai();
    construireTour(etat, 0, 'tir');
    construireTour(etat, 2, 'tir');
    ennemiDonnees(etat, 'juge_flammes', 14, { pv: 1e6 });
    const loin = tourDeLaCase(etat, 0);
    const proche = tourDeLaCase(etat, 2);
    avancerSecondes(etat, 11.9);
    expect(proche.desactivee).toBe(0);
    avancerSecondes(etat, 0.1);
    expect(proche.desactivee).toBeGreaterThan(enPas(4) - 3);
    expect(loin.desactivee).toBe(0);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'tour_desactivee', tour: proche.id, duree: 4 }));
    // Hors service : elle ne tire plus ; ensuite elle reprend.
    expect(tirsDe(etat, proche, 3.5)).toBe(0);
    avancerSecondes(etat, 1);
    expect(tirsDe(etat, proche, 3)).toBeGreaterThan(0);
  });

  it('une tour désactivée ne révèle plus les furtifs', () => {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir', 'A');
    const t = tourDeLaCase(etat, 1);
    const d = ennemiDonnees(etat, 'delateur', 10, { pv: 1e6 });
    t.desactivee = 100;
    avancerSecondes(etat, 2);
    expect(d.revele).toBe(0);
    expect(d.pv).toBe(d.pvMax);
  });

  it('à 50 % de PV, appelle 3 Porteurs de Torche sur son chemin, une seule fois', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'juge_flammes', 14, { pv: 1e6 });
    boss.pv = boss.pvMax * 0.45;
    step(etat);
    const porteurs = ennemisDe(etat, 'porteur_torche');
    expect(porteurs).toHaveLength(3);
    for (const p of porteurs) {
      expect(p.chemin).toBe(boss.chemin);
      expect(Math.abs(p.distance - boss.distance)).toBeLessThan(1);
      expect(p.elite).toBe(false);
    }
    expect(etat.evenements).toContainEqual({ type: 'appel', ennemi: boss.id, typeEnnemi: 'porteur_torche', nombre: 3 });
    avancerSecondes(etat, 3);
    expect(compter(evenementsPendant(etat, 2), 'appel')).toBe(0);
  });
});

describe('La Dame du Puits : plonge à 66 % et 33 % de PV', () => {
  it('plonge intouchable 3 s, appelle 6 Sangsues, puis réapparaît 3 tuiles plus loin', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'dame_puits', 10, { pv: 1e6 });
    boss.pv = boss.pvMax * 0.6;
    step(etat);
    expect(boss.invulnerable).toBeGreaterThan(enPas(3) - 3);
    expect(ennemisDe(etat, 'sangsue')).toHaveLength(6);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'plongee', ennemi: boss.id, delai: 3 }));

    // Intouchable : ni dégâts, ni effets, ni cible des tours.
    const pv = boss.pv;
    expect(infligerDegats(etat, boss, 5000, 'pur')).toBe(0);
    appliquerEffet(etat, boss, { type: 'ralentissement', chance: 1, duree: 5, valeur: 0.5 });
    expect(boss.pv).toBe(pv);
    expect(boss.effetsPas[EFFET.ralentissement]).toBe(0);
    expect(premierEnnemi(etat, boss.x, boss.y, 3, true, false)?.type).not.toBe('dame_puits');

    // Elle ne bouge pas sous l'eau, puis saute de 3 tuiles.
    avancerSecondes(etat, 2.5);
    expect(boss.distance).toBe(10);
    const vus = evenementsPendant(etat, 0.6);
    expect(vus).toContainEqual(expect.objectContaining({ type: 'emergence', ennemi: boss.id }));
    expect(boss.invulnerable).toBe(0);
    expect(boss.distance).toBeCloseTo(13, 6);
    expect(boss.x).toBeCloseTo(13, 6);
    expect(infligerDegats(etat, boss, 100, 'pur')).toBeGreaterThan(0);
  });

  it('replonge à 33 % avec 6 Sangsues de plus ; chaque plongée n’a lieu qu’une fois', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'dame_puits', 10, { pv: 1e6 });
    boss.pv = boss.pvMax * 0.6;
    step(etat);
    avancerSecondes(etat, 4);
    expect(boss.palier).toBe(1);
    expect(ennemisDe(etat, 'sangsue')).toHaveLength(6);
    boss.pv = boss.pvMax * 0.3;
    step(etat);
    expect(boss.palier).toBe(2);
    expect(boss.invulnerable).toBeGreaterThan(0);
    expect(ennemisDe(etat, 'sangsue')).toHaveLength(12);
    avancerSecondes(etat, 4);
    expect(boss.distance).toBeCloseTo(16, 6);
    expect(ennemisDe(etat, 'sangsue')).toHaveLength(12);
  });

  it('un saut qui dépasse la sortie l’y mène : elle s’échappe', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'dame_puits', 28.5, { pv: 1e6 });
    boss.pv = boss.pvMax * 0.6;
    avancerSecondes(etat, 4);
    expect(etat.vies).toBeLessThan(etat.viesDepart);
    expect(boss.vivant).toBe(false);
  });
});

describe('La Mère des Rats : pond 4 Rats de Peste toutes les 6 s', () => {
  it('un groupe de 4 à 6 s, un autre à 12 s', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'mere_rats', 10, { pv: 1e6 });
    const rats = (vus: readonly { type: string; typeEnnemi?: string }[]): number => vus.filter((e) => e.type === 'apparition' && e.typeEnnemi === 'rat_peste').length;
    expect(rats(evenementsPendant(etat, 5.9))).toBe(0);
    const premier = evenementsPendant(etat, 0.2);
    expect(rats(premier)).toBe(4);
    expect(premier).toContainEqual({ type: 'appel', ennemi: boss.id, typeEnnemi: 'rat_peste', nombre: 4 });
    expect(rats(evenementsPendant(etat, 5.8))).toBe(0);
    expect(rats(evenementsPendant(etat, 0.2))).toBe(4);
  });

  it('les rats appelés partent de la hauteur de la Mère, sur son chemin', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'mere_rats', 10, { pv: 1e6 });
    avancerSecondes(etat, 6);
    const rats = ennemisDe(etat, 'rat_peste');
    expect(rats).toHaveLength(4);
    for (const r of rats) {
      expect(r.chemin).toBe(boss.chemin);
      expect(Math.abs(r.distance - boss.distance)).toBeLessThan(1.5);
    }
  });

  it('pas de ponte pendant qu’elle est à terre', () => {
    const etat = partieEssai();
    const boss = ennemiDonnees(etat, 'mere_rats', 10, { pv: 1e6 });
    boss.invulnerable = enPas(20);
    avancerSecondes(etat, 13);
    expect(ennemisDe(etat, 'rat_peste')).toHaveLength(0);
  });
});
