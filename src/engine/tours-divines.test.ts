// Tours divines de Plume (Sanctuaire de l'Ombre) et de Pollen (Atelier Boiteux). Le Totem de Charlie est dans tours.test.ts.
// La règle commune aux trois (une seule par partie, 400 arêtes) est en tête.
import { describe, expect, it } from 'vitest';
import { DIEUX } from '../data/dieux';
import { ce, avancerSecondes, compter, configDe, construireTour, ennemiFixe, evenementsPendant, partieEssai } from './aides.test-utils';
import type { Evenement } from './evenements';
import { appliquerAction, coutConstruction, validerAction } from './partie';
import { PAS_PAR_SECONDE } from './temps';

describe('une seule tour divine par partie, à 400 arêtes', () => {
  const dieux = Object.keys(DIEUX);

  it.each(dieux)('%s : coûte 400 arêtes', (dieu) => {
    const etat = partieEssai(configDe(dieu));
    expect(coutConstruction(etat, 'divine')).toBe(400);
    construireTour(etat, 0, 'divine');
    expect(etat.aretes).toBe(5000 - 400);
  });

  it.each(dieux)('%s : une seconde tour divine est refusée (une_seule_divine), sur n’importe quelle case', (dieu) => {
    const etat = partieEssai(configDe(dieu));
    construireTour(etat, 0, 'divine');
    const aretes = etat.aretes;
    for (const i of [1, 2, 3]) {
      const action = { type: 'construire', ...ce(i), tour: 'divine' } as const;
      expect(validerAction(etat, action)).toBe('une_seule_divine');
      expect(appliquerAction(etat, action)).toEqual({ ok: false, raison: 'une_seule_divine' });
    }
    expect(etat.tours.filter((t) => t.famille === 'divine')).toHaveLength(1);
    expect(etat.aretes).toBe(aretes);
  });

  it('le refus passe avant le manque d’arêtes : il dit la vraie raison', () => {
    const etat = partieEssai(configDe('plume'), 400);
    construireTour(etat, 0, 'divine');
    expect(etat.aretes).toBe(0);
    expect(validerAction(etat, { type: 'construire', ...ce(1), tour: 'divine' })).toBe('une_seule_divine');
  });

  it('n’empêche pas les tours communes à côté', () => {
    const etat = partieEssai(configDe('charlie'));
    construireTour(etat, 0, 'divine');
    expect(validerAction(etat, { type: 'construire', ...ce(1), tour: 'tir' })).toBeNull();
  });

  it.each(dieux)('%s : après la vente de la tour divine, on peut la reposer', (dieu) => {
    const etat = partieEssai(configDe(dieu));
    construireTour(etat, 0, 'divine');
    expect(appliquerAction(etat, { type: 'vendre', ...ce(0) })).toEqual({ ok: true });
    expect(etat.tours.some((t) => t.famille === 'divine')).toBe(false);
    expect(appliquerAction(etat, { type: 'construire', ...ce(1), tour: 'divine' })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'construire', ...ce(2), tour: 'divine' })).toEqual({ ok: false, raison: 'une_seule_divine' });
  });
});

describe('Sanctuaire de l’Ombre (Plume)', () => {
  const sanctuaire = DIEUX.plume.tourDivine;

  it('se construit une seule fois pour son coût et fait sortir ses assassins', () => {
    const etat = partieEssai(configDe('plume'));
    construireTour(etat, 0, 'divine');
    expect(etat.aretes).toBe(5000 - sanctuaire.cout);
    expect(appliquerAction(etat, { type: 'construire', ...ce(1), tour: 'divine' })).toEqual({ ok: false, raison: 'une_seule_divine' });
    const assassins = etat.unites.filter((u) => u.genre === 'soldat');
    expect(assassins).toHaveLength(sanctuaire.soldats?.nombre ?? 0);
    expect(assassins.length).toBeGreaterThan(0);
    expect(assassins.every((u) => u.stats.capacites?.ciblable === false)).toBe(true);
  });

  it('ses assassins ne peuvent pas être ciblés : un tireur ennemi les ignore, et il tire sur une caserne voisine', () => {
    const tireur = { distance: { portee: 4, degats: [30, 30] as const, cadence: 0.5, typeDegats: 'pur' as const }, pv: 100000 };
    const seul = partieEssai(configDe('plume'));
    construireTour(seul, 0, 'divine');
    ennemiFixe(seul, 5, tireur);
    const vus = evenementsPendant(seul, 6);
    expect(compter(vus, 'coup_ennemi')).toBe(0);
    for (const u of seul.unites) expect(u.pv).toBe(u.stats.pv);

    const caserne = partieEssai(configDe('plume'));
    construireTour(caserne, 0, 'caserne');
    ennemiFixe(caserne, 5, tireur);
    expect(compter(evenementsPendant(caserne, 6), 'coup_ennemi')).toBeGreaterThan(0);
  });

  it('ne bloquent personne : l’ennemi qu’ils frappent continue d’avancer', () => {
    const etat = partieEssai(configDe('plume'));
    construireTour(etat, 0, 'divine');
    const e = ennemiFixe(etat, 4, { pv: 100000 });
    e.vitesse = 1 / PAS_PAR_SECONDE;
    avancerSecondes(etat, 3);
    expect(e.bloqueur).toBe(-1);
    expect(e.distance).toBeGreaterThan(5);
    expect(e.pv).toBeLessThan(e.pvMax);
  });

  it('exécute un non-boss sous 15 % de PV, mais pas un ennemi en bonne santé', () => {
    const faible = partieEssai(configDe('plume'));
    construireTour(faible, 0, 'divine');
    const cible = ennemiFixe(faible, 5, { pv: 100000 });
    cible.pv = cible.pvMax * 0.14;
    const vus = evenementsPendant(faible, 3);
    expect(cible.vivant).toBe(false);
    expect(vus.some((e: Evenement) => e.type === 'execution' && e.ennemi === cible.id)).toBe(true);

    const sain = partieEssai(configDe('plume'));
    construireTour(sain, 0, 'divine');
    const robuste = ennemiFixe(sain, 5, { pv: 100000 });
    robuste.pv = robuste.pvMax * 0.16;
    expect(compter(evenementsPendant(sain, 3), 'execution')).toBe(0);
    expect(robuste.vivant).toBe(true);
    expect(sanctuaire.soldats?.capacites?.execution).toBe(0.15);
  });

  it('n’exécute pas un boss, même presque mort', () => {
    const etat = partieEssai(configDe('plume'));
    construireTour(etat, 0, 'divine');
    const boss = ennemiFixe(etat, 5, { pv: 100000, boss: true });
    boss.pv = boss.pvMax * 0.05;
    expect(compter(evenementsPendant(etat, 4), 'execution')).toBe(0);
    expect(boss.vivant).toBe(true);
    expect(boss.pv).toBeLessThan(boss.pvMax * 0.05);
  });

  it('révèle les furtifs de sa portée : ses assassins les frappent, et les autres tours les voient aussi', () => {
    const avec = partieEssai(configDe('plume'));
    construireTour(avec, 0, 'divine');
    construireTour(avec, 5, 'tir');
    const proche = ennemiFixe(avec, 6, { furtif: true });
    const loin = ennemiFixe(avec, 25, { furtif: true });
    const vus = evenementsPendant(avec, 4);
    expect(proche.revele).toBeGreaterThan(0);
    expect(loin.revele).toBe(0);
    expect(proche.pv).toBeLessThan(proche.pvMax);
    expect(loin.pv).toBe(loin.pvMax);
    const tourDeTir = avec.tours.find((t) => t.famille === 'tir');
    expect(vus.some((e) => e.type === 'tir' && e.tour === tourDeTir?.id)).toBe(true);

    // Sans le Sanctuaire, la même tour de tir ne voit pas le furtif.
    const sans = partieEssai(configDe('plume'));
    construireTour(sans, 5, 'tir');
    const furtif = ennemiFixe(sans, 6, { furtif: true });
    expect(compter(evenementsPendant(sans, 4), 'tir')).toBe(0);
    expect(furtif.pv).toBe(furtif.pvMax);
  });
});

describe('Atelier Boiteux (Pollen)', () => {
  const atelier = DIEUX.pollen.tourDivine.atelier;

  it('construit jusqu’à deux tourelles à intervalles réguliers, qui disparaissent après 30 s', () => {
    const etat = partieEssai(configDe('pollen'));
    construireTour(etat, 0, 'divine');
    expect(etat.aretes).toBe(5000 - DIEUX.pollen.tourDivine.cout);
    expect(etat.structures).toHaveLength(0);
    const cadence = atelier?.constructeur?.cadence ?? 0;
    const vus = evenementsPendant(etat, cadence + 1);
    expect(etat.structures).toHaveLength(1);
    expect(compter(vus, 'structure')).toBe(1);
    expect(etat.structures[0]).toMatchObject({ origine: etat.tours[0]?.id, x: 5 + (atelier?.constructeur?.decalages[0]?.x ?? 0) });
    avancerSecondes(etat, cadence);
    expect(etat.structures).toHaveLength(2);
    avancerSecondes(etat, cadence * 2);
    // Jamais plus de deux tourelles vivantes.
    expect(etat.structures.length).toBeLessThanOrEqual(2);
    // La première, construite à ~10 s, disparaît à ~40 s.
    const fins = evenementsPendant(etat, 30);
    expect(compter(fins, 'structure_fin')).toBeGreaterThanOrEqual(1);
  });

  it('ses tourelles tirent seules sur le premier ennemi à portée', () => {
    const etat = partieEssai(configDe('pollen'));
    construireTour(etat, 0, 'divine');
    const e = ennemiFixe(etat, 5);
    const vus = evenementsPendant(etat, 14);
    expect(compter(vus, 'tir_structure')).toBeGreaterThan(0);
    expect(e.pv).toBeLessThan(e.pvMax);
    const hors = ennemiFixe(etat, 28);
    avancerSecondes(etat, 5);
    expect(hors.pv).toBe(hors.pvMax);
  });

  it('pose un piège toutes les 12 s sur le chemin le plus proche à portée', () => {
    const etat = partieEssai(configDe('pollen'));
    construireTour(etat, 0, 'divine');
    const cadence = atelier?.pieges?.cadence ?? 0;
    expect(cadence).toBe(12);
    const vus = evenementsPendant(etat, cadence + 0.5);
    expect(compter(vus, 'piege_pose')).toBe(1);
    expect(etat.pieges).toHaveLength(1);
    expect(etat.pieges[0]).toMatchObject({ x: 5, y: 5 });
    avancerSecondes(etat, cadence);
    expect(etat.pieges).toHaveLength(2);
  });

  it('un piège de l’Atelier prend un ennemi qui passe', () => {
    const etat = partieEssai(configDe('pollen'));
    construireTour(etat, 0, 'divine');
    avancerSecondes(etat, 13);
    const e = ennemiFixe(etat, 3.5, { vitesse: 1.4 });
    e.vitesse = 1.4 / PAS_PAR_SECONDE;
    const vus = evenementsPendant(etat, 4);
    expect(compter(vus, 'piege_declenche')).toBe(1);
  });

  it('vendre la tour fait disparaître ses tourelles', () => {
    const etat = partieEssai(configDe('pollen'));
    construireTour(etat, 0, 'divine');
    avancerSecondes(etat, 12);
    expect(etat.structures.length).toBeGreaterThan(0);
    appliquerAction(etat, { type: 'vendre', ...ce(0) });
    expect(etat.structures).toHaveLength(0);
  });
});
