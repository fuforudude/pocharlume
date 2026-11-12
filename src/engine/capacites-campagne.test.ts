// Capacités de famille par campagne (docs/specs/2026-11-12-dlc-temps-modernes-campagne.md, décision technique 2) : chaque capacité
// testée seule dans la campagne `moderne`, avec la preuve que la campagne `histoire` (ou un niveau sans campagne) ne change pas.
import { describe, expect, it } from 'vitest';
import { CAPACITES_CAMPAGNE } from '../data/capacites-campagne';
import { avancerSecondes, CONFIG, compter, construireTour, ennemiFixe, evenementsPendant, niveauEssai, tourDe } from './aides.test-utils';
import { campagneDe, capaciteDe } from './capacites-campagne';
import type { DefEnnemi, IdCampagne, Niveau, Vague } from './definitions';
import { ajouterEnnemi, facteurVitesse } from './ennemis';
import type { EtatPartie, Unite } from './etat';
import { creerPartie, serialiser, step } from './partie';
import { creerZone } from './structures';
import { blesserUnite } from './unites';
import { ENNEMIS } from '../data/ennemis';

/** Le niveau d'essai dans une campagne donnée (`undefined` : sans le champ, comme les niveaux de l'histoire). */
function niveauDe(campagne: IdCampagne | undefined, vagues?: readonly Vague[]): Niveau {
  const n = niveauEssai(vagues);
  return campagne === undefined ? n : { ...n, campagne };
}

function partie(campagne: IdCampagne | undefined): EtatPartie {
  return creerPartie(niveauDe(campagne), CONFIG);
}

function soldats(etat: EtatPartie): Unite[] {
  return etat.unites.filter((u) => u.genre === 'soldat' && !u.mort);
}

const PIQUET = CAPACITES_CAMPAGNE.moderne.caserne;
const RENVOI = CAPACITES_CAMPAGNE.moderne.tir;
const SONO = CAPACITES_CAMPAGNE.moderne.magie;
const PERCAGE = CAPACITES_CAMPAGNE.moderne.artillerie;

describe('table des capacités de campagne', () => {
  it('la campagne moderne donne une capacité à chacune des quatre familles, l’histoire aucune', () => {
    expect(PIQUET?.type).toBe('piquet');
    expect(RENVOI?.type).toBe('renvoi');
    expect(SONO?.type).toBe('sono');
    expect(PERCAGE?.type).toBe('percage');
    expect(CAPACITES_CAMPAGNE.histoire).toEqual({});
  });

  it('un niveau sans campagne est de l’histoire ; la tour divine n’a jamais de capacité', () => {
    expect(campagneDe(niveauDe(undefined))).toBe('histoire');
    expect(campagneDe(niveauDe('moderne'))).toBe('moderne');
    expect(campagneDe({ ...niveauDe(undefined), campagne: 'inconnue' as IdCampagne })).toBe('histoire');
    const etat = partie('moderne');
    expect(capaciteDe(etat, 'divine')).toBeUndefined();
    expect(capaciteDe(partie(undefined), 'caserne')).toBeUndefined();
  });
});

describe('Barricade, « Piquet » : moins de dégâts tant que deux soldats tiennent la ligne', () => {
  /** Une caserne sur la case 0, soldats en place ; `tiennent` d'entre eux retiennent un ennemi (marqué à la main). */
  function caserne(campagne: IdCampagne | undefined, tiennent: number): { etat: EtatPartie; soldat: Unite } {
    const etat = partie(campagne);
    construireTour(etat, 0, 'caserne');
    avancerSecondes(etat, 2);
    const liste = soldats(etat);
    expect(liste.length).toBeGreaterThanOrEqual(2);
    liste.forEach((u, i) => {
      u.bloques = i < tiennent ? 1 : 0;
    });
    const soldat = liste[0];
    if (!soldat) throw new Error('pas de soldat');
    return { etat, soldat };
  }

  function degatsSubis(campagne: IdCampagne | undefined, tiennent: number): number {
    const { etat, soldat } = caserne(campagne, tiennent);
    const avant = soldat.pv;
    blesserUnite(etat, soldat, 20, 'pur');
    return avant - soldat.pv;
  }

  it('à deux soldats qui retiennent, le coup perd la part prévue', () => {
    expect(degatsSubis('moderne', 2)).toBeCloseTo(20 * (1 - (PIQUET?.type === 'piquet' ? PIQUET.reduction : 0)));
    expect(degatsSubis('moderne', 3)).toBeLessThan(20);
  });

  it('un soldat seul à retenir, ou aucun, encaisse tout', () => {
    expect(degatsSubis('moderne', 1)).toBeCloseTo(20);
    expect(degatsSubis('moderne', 0)).toBeCloseTo(20);
  });

  it('dans l’histoire, rien ne change', () => {
    expect(degatsSubis(undefined, 3)).toBeCloseTo(20);
    expect(degatsSubis('histoire', 3)).toBeCloseTo(20);
  });

  it('le héros n’en profite pas', () => {
    const { etat } = caserne('moderne', 3);
    const heros = etat.unites.find((u) => u.genre === 'heros');
    if (!heros) throw new Error('pas de héros');
    const avant = heros.pv;
    blesserUnite(etat, heros, 20, 'pur');
    expect(avant - heros.pv).toBeCloseTo(20);
  });
});

describe('Perchoir, « Renvoi » : dissipe les nuages à sa portée', () => {
  function avecNuage(campagne: IdCampagne | undefined, x: number, y: number, degatsAllies?: number): EtatPartie {
    const etat = partie(campagne);
    construireTour(etat, 1, 'tir');
    creerZone(etat, { duree: 10, effets: [], critique: 0, volants: true, ...(degatsAllies === undefined ? {} : { degatsAllies }) }, x, y, 1.5);
    return etat;
  }

  it('un nuage toxique à portée disparaît au pas suivant, avec un événement', () => {
    const etat = avecNuage('moderne', 11, 5, 6);
    const vus = evenementsPendant(etat, 0.1);
    expect(etat.zones).toHaveLength(0);
    expect(compter(vus, 'dissipation')).toBe(1);
  });

  it('un nuage hors de portée, ou une zone qui ne blesse pas les alliés, reste', () => {
    const loin = avecNuage('moderne', 28, 12, 6);
    step(loin);
    expect(loin.zones).toHaveLength(1);
    const nappe = avecNuage('moderne', 11, 5);
    step(nappe);
    expect(nappe.zones).toHaveLength(1);
  });

  it('une tour en feu ne dissipe rien', () => {
    const etat = avecNuage('moderne', 11, 5, 6);
    const tour = tourDe(etat, 1);
    if (tour) tour.desactivee = 30;
    step(etat);
    expect(etat.zones).toHaveLength(1);
  });

  it('dans l’histoire, le nuage reste', () => {
    for (const campagne of [undefined, 'histoire'] as const) {
      const etat = avecNuage(campagne, 11, 5, 6);
      step(etat);
      expect(etat.zones).toHaveLength(1);
    }
  });
});

describe('Sono, « Sono » : ralentissement léger et permanent autour de la tour', () => {
  /** Avance d'un pas un ennemi qui marche à 1 tuile/s posé à `x` sur le chemin 0 (ou volant) ; rend la distance parcourue. */
  function pasParcouru(campagne: IdCampagne | undefined, x: number, surcharges: Partial<DefEnnemi> = {}): number {
    const etat = partie(campagne);
    construireTour(etat, 1, 'magie');
    const e = ajouterEnnemi(etat, { ...ENNEMIS.paysan_affame, pv: 1e9, vitesse: 1, degats: [0, 0], ...surcharges }, 'paysan_affame', 0, x);
    const avant = e.distance;
    step(etat);
    return (e.distance - avant) * 30;
  }

  const facteur = 1 - (SONO?.type === 'sono' ? SONO.ralentissement : 0);

  it('un ennemi à portée va moins vite, volant compris', () => {
    expect(pasParcouru('moderne', 11)).toBeCloseTo(facteur);
    expect(pasParcouru('moderne', 11, { volant: true })).toBeCloseTo(facteur);
  });

  it('hors de portée, il garde sa vitesse', () => {
    expect(pasParcouru('moderne', 25)).toBeCloseTo(1);
  });

  it('un ralentissement plus fort l’emporte, sans cumul', () => {
    const etat = partie('moderne');
    construireTour(etat, 1, 'magie');
    const e = ajouterEnnemi(etat, { ...ENNEMIS.paysan_affame, pv: 1e9, vitesse: 1, degats: [0, 0] }, 'paysan_affame', 0, 11);
    e.effetsPas[0] = 60;
    e.effetsValeur[0] = 0.5;
    const avant = e.distance;
    step(etat);
    expect((e.distance - avant) * 30).toBeCloseTo(0.5);
    expect(facteurVitesse(e)).toBeCloseTo(0.5);
  });

  it('dans l’histoire, rien ne ralentit', () => {
    expect(pasParcouru(undefined, 11)).toBeCloseTo(1);
    expect(pasParcouru('histoire', 11)).toBeCloseTo(1);
  });
});

describe('Engin bricolé, « Perçage » : bouclier frontal et armure', () => {
  it('les tours d’artillerie ignorent une part d’armure en plus et passent le bouclier, les autres familles non', () => {
    const moderne = partie('moderne');
    const histoire = partie(undefined);
    for (const etat of [moderne, histoire]) {
      construireTour(etat, 0, 'artillerie');
      construireTour(etat, 3, 'artillerie', 'B');
      construireTour(etat, 1, 'tir');
    }
    const ajout = PERCAGE?.type === 'percage' ? PERCAGE.ignoreArmure : 0;
    for (const i of [0, 3]) {
      const m = tourDe(moderne, i)?.stats;
      const h = tourDe(histoire, i)?.stats;
      expect(m?.ignoreArmure).toBeCloseTo((h?.ignoreArmure ?? 0) + ajout);
      expect(m?.percageBouclier).toBe(true);
      expect(h?.percageBouclier).toBeUndefined();
    }
    expect(tourDe(moderne, 1)?.stats).toEqual(tourDe(histoire, 1)?.stats);
  });

  /** PV perdus en 6 s par un ennemi à bouclier frontal, immobile, que la baliste (voie B, case 3) vise de face. */
  function pvPerdus(campagne: IdCampagne | undefined, surcharges: Partial<DefEnnemi>): number {
    const etat = partie(campagne);
    construireTour(etat, 3, 'artillerie', 'B');
    const e = ennemiFixe(etat, 17, surcharges);
    const avant = e.pv;
    avancerSecondes(etat, 6);
    return avant - e.pv;
  }

  it('la baliste qui tire de face perce le bouclier dans la campagne moderne, pas dans l’histoire', () => {
    const bouclier = { pouvoirs: { bouclier: { reduction: 0.75 } } };
    const moderne = pvPerdus('moderne', bouclier);
    const histoire = pvPerdus(undefined, bouclier);
    expect(moderne).toBeGreaterThan(0);
    expect(histoire).toBeCloseTo(moderne * 0.25, 0);
  });

  it('contre l’armure, la campagne moderne perce davantage', () => {
    expect(pvPerdus('moderne', { armure: 0.6 })).toBeGreaterThan(pvPerdus(undefined, { armure: 0.6 }));
  });
});

describe('dans l’histoire, rien ne change', () => {
  /** Une partie complète et chargée : les quatre familles, des ennemis à bouclier, à nuage et à tir sur les tours, 40 s de jeu. */
  function jouer(campagne: IdCampagne | undefined): string {
    const vagues: Vague[] = [
      {
        paquets: [
          { ennemi: 'porte_herse', nombre: 4, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'pestifere', nombre: 4, intervalle: 1.5, chemin: 0, delai: 2 },
          { ennemi: 'moderne_tireur_lbd', nombre: 3, intervalle: 2, chemin: 0, delai: 1 },
          { ennemi: 'fantassin', nombre: 3, intervalle: 1, chemin: 1, delai: 0 },
        ],
      },
    ];
    const etat = creerPartie(niveauDe(campagne, vagues), CONFIG);
    construireTour(etat, 0, 'caserne');
    construireTour(etat, 1, 'tir');
    construireTour(etat, 2, 'magie');
    construireTour(etat, 3, 'artillerie', 'B');
    construireTour(etat, 4, 'artillerie');
    avancerSecondes(etat, 40);
    return serialiser({ ...etat, niveau: { ...etat.niveau, campagne: 'histoire' } });
  }

  it('un niveau sans campagne et un niveau de l’histoire se jouent à l’identique, octet pour octet', () => {
    expect(jouer('histoire')).toBe(jouer(undefined));
  });

  it('la même partie dans la campagne moderne se déroule autrement (les capacités agissent)', () => {
    expect(jouer('moderne')).not.toBe(jouer(undefined));
  });
});
