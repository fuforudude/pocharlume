// Arbre d'améliorations : l'effet en partie de chacune des six branches.
import { describe, expect, it } from 'vitest';
import { BRANCHES } from '../data/ameliorations';
import { DIEUX } from '../data/dieux';
import { HEROS } from '../data/heros';
import { TOURS } from '../data/tours';
import { CONFIG, avancerSecondes, configDe, construireTour, ennemiFixe, heros, partieEssai } from './aides.test-utils';
import { appliquerAction } from './partie';

/** Effet total de la branche à un rang, lu dans les données (les valeurs d'équilibrage ne sont jamais recopiées ici). */
function effet(branche: keyof typeof BRANCHES, rang: number) {
  const e = BRANCHES[branche].effets[rang - 1];
  if (!e) throw new Error(`Rang ${String(rang)} inconnu pour ${branche}`);
  return e;
}

function avec(ameliorations: Record<string, number>, dieu = 'charlie') {
  return partieEssai(configDe(dieu, { ameliorations }));
}

describe('branche caserne : PV des soldats', () => {
  it('chaque rang ajoute des PV aux soldats, en plus du bonus de Charlie', () => {
    const base = partieEssai(CONFIG);
    construireTour(base, 0, 'caserne');
    const rang3 = avec({ caserne: 3 });
    construireTour(rang3, 0, 'caserne');
    const rang5 = avec({ caserne: 5 });
    construireTour(rang5, 0, 'caserne');
    const pv = (e: typeof base): number => e.tours[0]?.stats.soldats?.pv ?? 0;
    const nu = TOURS.caserne.niveaux[0].soldats?.pv ?? 0;
    expect(pv(base)).toBeCloseTo(nu * 1.25, 5);
    expect(pv(rang3)).toBeCloseTo(nu * (1.25 + effet('caserne', 3).pvSoldats), 5);
    expect(pv(rang5)).toBeCloseTo(nu * (1.25 + effet('caserne', 5).pvSoldats), 5);
    expect(rang5.unites.find((u) => u.genre === 'soldat')?.pv).toBeCloseTo(nu * (1.25 + effet('caserne', 5).pvSoldats), 5);
  });

  it('ne touche pas les autres familles', () => {
    const etat = avec({ caserne: 5 });
    construireTour(etat, 0, 'tir');
    expect(etat.tours[0]?.stats).toEqual(TOURS.tir.niveaux[0]);
  });
});

describe('branche tir : portée', () => {
  it('rang 5 : bonus de portée aux tours de tir seulement', () => {
    const etat = avec({ tir: 5 });
    construireTour(etat, 0, 'tir');
    construireTour(etat, 1, 'magie');
    expect(etat.tours[0]?.stats.portee).toBeCloseTo(TOURS.tir.niveaux[0].portee * (1 + effet('tir', 5).portee), 5);
    expect(etat.tours[1]?.stats.portee).toBe(TOURS.magie.niveaux[0].portee);
  });

  it('suit les niveaux et les spécialisations', () => {
    const etat = avec({ tir: 2 });
    construireTour(etat, 0, 'tir', 'B');
    expect(etat.tours[0]?.stats.portee).toBeCloseTo(TOURS.tir.specialisations.B.portee * (1 + effet('tir', 2).portee), 5);
  });
});

describe('branche magie : dégâts', () => {
  it('rang 5 : bonus de dégâts aux tours de magie', () => {
    const etat = avec({ magie: 5 });
    construireTour(etat, 0, 'magie');
    construireTour(etat, 1, 'artillerie');
    const [min, max] = TOURS.magie.niveaux[0].degats;
    expect(etat.tours[0]?.stats.degats[0]).toBeCloseTo(min * (1 + effet('magie', 5).degats), 5);
    expect(etat.tours[0]?.stats.degats[1]).toBeCloseTo(max * (1 + effet('magie', 5).degats), 5);
    expect(etat.tours[1]?.stats.degats).toEqual(TOURS.artillerie.niveaux[0].degats);
  });
});

describe('branche artillerie : zone', () => {
  it('rang 5 : bonus de rayon d’impact, seulement pour l’artillerie', () => {
    const etat = avec({ artillerie: 5 });
    construireTour(etat, 0, 'artillerie');
    construireTour(etat, 1, 'tir');
    expect(etat.tours[0]?.stats.zone).toBeCloseTo(TOURS.artillerie.niveaux[0].zone * (1 + effet('artillerie', 5).zone), 5);
    expect(etat.tours[1]?.stats.zone).toBe(0);
  });

  it('élargit vraiment l’impact : un voisin juste au-delà du rayon de base n’est éclaboussé qu’avec la branche', () => {
    const eclabousse = (ameliorations: Record<string, number>): boolean => {
      const etat = avec(ameliorations);
      construireTour(etat, 1, 'artillerie');
      const cible = ennemiFixe(etat, 13.1);
      // Entre le rayon de base et le rayon élargi du rang 5.
      const voisin = ennemiFixe(etat, 13.1 - TOURS.artillerie.niveaux[0].zone * (1 + effet('artillerie', 5).zone / 2));
      cible.decalage = 0;
      voisin.decalage = 0;
      avancerSecondes(etat, 4);
      return voisin.pv < voisin.pvMax;
    };
    expect(eclabousse({})).toBe(false);
    expect(eclabousse({ artillerie: 5 })).toBe(true);
  });
});

describe('branche sorts : recharge', () => {
  it('rang 5 : recharge et délai initial réduits', () => {
    const base = partieEssai(CONFIG);
    const etat = avec({ sorts: 5 });
    const [chute] = DIEUX.charlie.sorts;
    expect(base.sorts[0]?.recharge).toBe(Math.round(chute.rechargeInitiale * 30));
    expect(etat.sorts[0]?.recharge).toBe(Math.round(chute.rechargeInitiale * (1 - effet('sorts', 5).recharge) * 30));
    avancerSecondes(etat, chute.rechargeInitiale * (1 - effet('sorts', 5).recharge));
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: true });
    expect(etat.sorts[0]?.recharge).toBe(Math.round(chute.recharge * (1 - effet('sorts', 5).recharge) * 30));
  });

  it('vaut pour les sorts de chaque dieu', () => {
    for (const dieu of ['plume', 'pollen'] as const) {
      const etat = avec({ sorts: 3 }, dieu);
      const sort = DIEUX[dieu].sorts[0];
      expect(etat.sorts[0]?.recharge).toBe(Math.round(sort.rechargeInitiale * (1 - effet('sorts', 3).recharge) * 30));
    }
  });
});

describe('branche héros : PV et dégâts', () => {
  it('rang 5 : bonus de PV et de dégâts', () => {
    const base = heros(partieEssai(CONFIG)).stats;
    const haut = heros(avec({ heros: 5 })).stats;
    expect(haut.pv).toBe(Math.round(base.pv * (1 + effet('heros', 5).pvHeros)));
    expect(haut.degats[0]).toBeCloseTo(base.degats[0] * (1 + effet('heros', 5).degatsHeros), 5);
    expect(haut.degats[1]).toBeCloseTo(base.degats[1] * (1 + effet('heros', 5).degatsHeros), 5);
  });

  it('vaut aussi pour un tireur', () => {
    const base = heros(partieEssai(configDe('plume', { heros: 'corbeau' }))).stats;
    const haut = heros(partieEssai(configDe('plume', { heros: 'corbeau', ameliorations: { heros: 5 } }))).stats;
    expect(haut.capacites?.distance?.degats[1]).toBeCloseTo((base.capacites?.distance?.degats[1] ?? 0) * (1 + effet('heros', 5).degatsHeros), 5);
    expect(HEROS.corbeau.capacites.distance).not.toBeNull();
  });
});

describe('arbre en général', () => {
  it('sans amélioration, les stats sont celles des données', () => {
    const etat = partieEssai(CONFIG);
    construireTour(etat, 0, 'tir');
    expect(etat.tours[0]?.stats).toEqual(TOURS.tir.niveaux[0]);
  });

  it('chaque branche a un effet sensible à chaque rang', () => {
    for (const [id, branche] of Object.entries(BRANCHES)) {
      for (let rang = 1; rang <= branche.rangMax; rang++) {
        expect(JSON.stringify(branche.effets[rang - 1]), `${id} ${String(rang)}`).not.toBe(JSON.stringify(branche.effets[rang - 2] ?? {}));
      }
    }
  });
});
