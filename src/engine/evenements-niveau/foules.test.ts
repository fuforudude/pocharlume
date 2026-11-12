import { describe, expect, it } from 'vitest';
import { CONFIG, avancerPas, avancerSecondes, ennemiEssai, ennemiFixe, heros } from '../aides.test-utils';
import type { Foule } from '../definitions';
import { calculerChemin } from '../chemins';
import { ajouterEnnemi } from '../ennemis';
import { EFFET, type EtatPartie } from '../etat';
import { ralliementParDefaut } from '../grille';
import { appliquerAction, creerPartie, step, validerAction } from '../partie';
import { enPas } from '../temps';
import { niveauDynamique } from './niveaux-essai.test-utils';

/** Foule sous le chemin 0 (case (5, 3), centre (11, 7)) : payer 50 arêtes ralentit les ennemis à 3 tuiles, recharge 10 s. */
const RALENTIR: Foule = {
  cases: [{ cx: 5, cy: 3 }],
  condition: { type: 'payer', cout: 50 },
  effet: { type: 'ralentir', rayon: 3, facteur: 0.5, duree: 4 },
  recharge: 10,
};

/** Foule sur le chemin 0 (case (5, 2), x de 10 à 12) : le héros y reste 2 s, deux étudiants viennent tenir 5 s. */
const RENFORTS_HEROS: Foule = {
  cases: [{ cx: 5, cy: 2 }],
  condition: { type: 'heros', duree: 2 },
  effet: { type: 'renforts', nombre: 2, duree: 5, unite: 'etudiant' },
  recharge: 20,
};

function partie(foules: readonly Foule[], aretes = 5000): EtatPartie {
  return creerPartie(niveauDynamique({ foules, aretes }), CONFIG);
}

/** Pose le héros (sans marcher) au point donné. */
function poserHeros(etat: EtatPartie, x: number, y: number): void {
  const h = heros(etat);
  h.x = x;
  h.y = y;
  h.ancreX = x;
  h.ancreY = y;
  h.enDeplacement = false;
}

describe('vérification des foules', () => {
  const avec = (foule: Foule): (() => EtatPartie) => () => partie([foule]);

  it('refuse une foule sans recharge ni nombre d’utilisations, un coût nul, une case hors de la grille', () => {
    expect(avec({ cases: [{ cx: 5, cy: 3 }], condition: { type: 'payer', cout: 50 }, effet: { type: 'ralentir', rayon: 3, facteur: 0.5, duree: 4 } })).toThrow(/recharge/);
    expect(avec({ ...RALENTIR, condition: { type: 'payer', cout: 0 } })).toThrow(/coût/);
    expect(avec({ ...RALENTIR, cases: [{ cx: 40, cy: 3 }] })).toThrow(/case/);
    expect(avec({ ...RALENTIR, cases: [] })).toThrow(/case/);
  });

  it('refuse une foule « héros » où le héros ne peut pas se poster (trop loin de tout chemin)', () => {
    expect(avec({ ...RENFORTS_HEROS, cases: [{ cx: 9, cy: 0 }] })).toThrow(/héros/);
  });

  it('refuse une foule « héros » dont seul le bord bas ou droit touche la portée d’un chemin (ce bord est dans la case voisine)', () => {
    // Case (5, 1) : y de 2 à 4, le chemin est à y = 5. Seul le bord bas (y = 4, case voisine) est à 1 tuile du chemin.
    expect(avec({ ...RENFORTS_HEROS, cases: [{ cx: 5, cy: 1 }] })).toThrow(/héros/);
    // Case (5, 2) : y de 4 à 6, le chemin la traverse : acceptée.
    expect(avec({ ...RENFORTS_HEROS, cases: [{ cx: 5, cy: 2 }] })).not.toThrow();
  });

  it('refuse un effet mal formé', () => {
    expect(avec({ ...RALENTIR, effet: { type: 'ralentir', rayon: 3, facteur: 1.5, duree: 4 } })).toThrow(/facteur/);
    expect(avec({ ...RALENTIR, effet: { type: 'bloquer', chemin: 7, debut: 3, longueur: 2, duree: 4 } })).toThrow(/chemin/);
    expect(avec({ ...RALENTIR, effet: { type: 'renforts', nombre: 2, duree: 4, unite: 'licorne' } })).toThrow(/unité/);
  });

  it('on ne construit pas sur une foule', () => {
    const etat = partie([RALENTIR]);
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 5, cy: 3 })).toBe('case_interdite');
  });
});

describe('condition « payer » et commande activerFoule', () => {
  it('payer active la foule : les arêtes sont prises, les ennemis proches ralentis, les autres non', () => {
    const etat = partie([RALENTIR]);
    const proche = ennemiFixe(etat, 11);
    const loin = ennemiFixe(etat, 25);
    const aretes = etat.aretes;
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 })).toEqual({ ok: true });
    expect(etat.aretes).toBe(aretes - 50);
    expect(etat.evenements).toContainEqual({ type: 'foule_activee', foule: 0, x: 11, y: 7 });
    expect(proche.effetsPas[EFFET.ralentissement]).toBe(enPas(4));
    expect(proche.effetsValeur[EFFET.ralentissement]).toBe(0.5);
    expect(loin.effetsPas[EFFET.ralentissement]).toBe(0);
    expect(etat.journal.at(-1)?.action).toEqual({ type: 'activerFoule', foule: 0 });
  });

  it('refusée en recharge, puis de nouveau possible', () => {
    const etat = partie([RALENTIR]);
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 }).ok).toBe(true);
    step(etat);
    expect(validerAction(etat, { type: 'activerFoule', foule: 0 })).toBe('foule_en_recharge');
    expect(etat.dynamique.foules[0]?.recharge).toBeGreaterThan(0);
    avancerSecondes(etat, 10);
    expect(validerAction(etat, { type: 'activerFoule', foule: 0 })).toBeNull();
  });

  it('refusée sans assez d’arêtes, sans rien changer', () => {
    const etat = partie([RALENTIR], 30);
    const avant = JSON.stringify(etat);
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 })).toEqual({ ok: false, raison: 'aretes_insuffisantes' });
    expect(JSON.stringify(etat)).toBe(avant);
  });

  it('refusée une fois ses utilisations épuisées', () => {
    const etat = partie([{ cases: RALENTIR.cases, condition: RALENTIR.condition, effet: RALENTIR.effet, utilisations: 1 }]);
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 }).ok).toBe(true);
    avancerSecondes(etat, 30);
    expect(validerAction(etat, { type: 'activerFoule', foule: 0 })).toBe('foule_epuisee');
  });

  it('refuse une foule inconnue, une foule qui ne se paie pas, une action mal formée', () => {
    const etat = partie([RALENTIR, RENFORTS_HEROS]);
    expect(validerAction(etat, { type: 'activerFoule', foule: 2 })).toBe('foule_inconnue');
    expect(validerAction(etat, { type: 'activerFoule', foule: -1 })).toBe('foule_inconnue');
    expect(validerAction(etat, { type: 'activerFoule', foule: 1 })).toBe('foule_sans_paiement');
    expect(validerAction(etat, { type: 'activerFoule', foule: 0.5 })).toBe('action_invalide');
    expect(validerAction(creerPartie(niveauDynamique(), CONFIG), { type: 'activerFoule', foule: 0 })).toBe('foule_inconnue');
  });
});

describe('condition « héros » et effet renforts', () => {
  it('le héros resté le temps voulu dans la zone l’active : renforts au chemin, puis recharge', () => {
    const etat = partie([RENFORTS_HEROS]);
    poserHeros(etat, 11, 5);
    avancerPas(etat, enPas(2) - 1);
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
    avancerPas(etat, 2);
    const renforts = etat.unites.filter((u) => u.genre === 'renfort');
    expect(renforts).toHaveLength(2);
    for (const u of renforts) expect(Math.abs(u.y - 5)).toBeLessThan(1);
    expect(etat.dynamique.foules[0]?.recharge).toBeGreaterThan(0);
    expect(etat.dynamique.foules[0]?.presence).toBe(0);
    avancerSecondes(etat, 5.1);
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
  });

  it('sortir de la zone avant le temps remet le compte à zéro', () => {
    const etat = partie([RENFORTS_HEROS]);
    poserHeros(etat, 11, 5);
    avancerSecondes(etat, 1.5);
    expect(etat.dynamique.foules[0]?.presence).toBeGreaterThan(0);
    poserHeros(etat, 20, 5);
    step(etat);
    expect(etat.dynamique.foules[0]?.presence).toBe(0);
    poserHeros(etat, 11, 5);
    avancerSecondes(etat, 1.5);
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
  });

  it('un héros mort n’active rien', () => {
    const etat = partie([RENFORTS_HEROS]);
    poserHeros(etat, 11, 5);
    heros(etat).mort = true;
    avancerSecondes(etat, 3);
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
  });
});

describe('effet « bloquer »', () => {
  it('coupe le passage un moment, comme une nasse', () => {
    const etat = partie([{ ...RALENTIR, effet: { type: 'bloquer', chemin: 0, debut: 8, longueur: 2, duree: 6 } }]);
    const e = ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 1, degats: [0, 0] }), 'paysan_affame', 0, 5);
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 }).ok).toBe(true);
    avancerSecondes(etat, 5);
    expect(e.distance).toBe(8);
    avancerSecondes(etat, 2);
    expect(e.distance).toBeGreaterThan(8.5);
  });
});

describe('foule « renforts » et chemins fermés', () => {
  it('les étudiants descendent sur le chemin ouvert, pas sur le chemin fermé plus proche', () => {
    // Case (5, 4) : centre (11, 9), plus près du chemin 1 (y = 12) que du chemin 0 (y = 5) ; le chemin 1 est fermé.
    const foule: Foule = { cases: [{ cx: 5, cy: 4 }], condition: { type: 'payer', cout: 10 }, effet: { type: 'renforts', nombre: 2, duree: 5, unite: 'etudiant' }, recharge: 10 };
    const etat = creerPartie(niveauDynamique({ foules: [foule], mobiles: [1], cheminsFermes: [{ chemin: 1, repli: 0 }] }), CONFIG);
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 }).ok).toBe(true);
    const renforts = etat.unites.filter((u) => u.genre === 'renfort');
    expect(renforts).toHaveLength(2);
    for (const u of renforts) expect(Math.abs(u.y - 5)).toBeLessThan(2);
  });

  it('le ralliement d’une caserne préfère le chemin ouvert à portée, et à défaut prend le chemin fermé', () => {
    const ouvert = calculerChemin({ points: [{ x: 0, y: 6 }, { x: 30, y: 6 }] });
    const ferme = calculerChemin({ points: [{ x: 0, y: 2 }, { x: 30, y: 2 }] });
    // Case (5, 1) : centre (11, 3), à 1 tuile du chemin fermé et à 3 du chemin ouvert (portée 3,5).
    expect(ralliementParDefaut([ferme, ouvert], 5, 1, 3.5)?.y).toBeCloseTo(2, 5);
    expect(ralliementParDefaut([ferme, ouvert], 5, 1, 3.5, [false, true])?.y).toBeCloseTo(6, 5);
    // Le chemin ouvert est trop loin : le chemin fermé sert encore (il peut s'ouvrir).
    expect(ralliementParDefaut([ferme, ouvert], 5, 1, 2, [false, true])?.y).toBeCloseTo(2, 5);
  });
});
