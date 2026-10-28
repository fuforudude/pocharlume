// Grille de construction : cases de 2×2 tuiles, tour centrée dans sa case, refus (hors carte, interdite, occupée), casernes
// qui exigent un chemin à portée, rejeu et sérialisation. Carte d'essai : chemins droits en y = 5 et y = 12 (voir aides.test-utils.ts).
import { describe, expect, it } from 'vitest';
import { REGLES } from '../data/regles';
import { VERSION_DONNEES } from '../data/version';
import { TOURS } from '../data/tours';
import { ce, CONFIG, avancerSecondes, configDe, ennemiFixe, niveauEssai, partieEssai } from './aides.test-utils';
import type { Action } from './actions';
import type { Niveau } from './definitions';
import { VERSION_ETAT } from './etat';
import {
  caseExiste,
  caseSousPoint,
  casesLibres,
  centreCase,
  colonnes,
  estCaseInterdite,
  lignes,
  ralliementParDefaut,
  toutesLesCases,
  tourSurCase,
} from './grille';
import { appliquerAction, avancer, creerPartie, deserialiser, rejouer, serialiser, step, validerAction } from './partie';

const construire = (cx: number, cy: number, tour: Extract<Action, { type: 'construire' }>['tour'] = 'tir'): Action => ({ type: 'construire', cx, cy, tour });

describe('géométrie de la grille', () => {
  const { carte } = niveauEssai();

  it('découpe une carte de 32 × 18 tuiles en 16 × 9 cases de 2 × 2 tuiles', () => {
    expect(REGLES.tailleCase).toBe(2);
    expect([colonnes(carte), lignes(carte)]).toEqual([16, 9]);
    expect(toutesLesCases(carte)).toHaveLength(144);
  });

  it('le centre d’une case est le milieu de ses 4 tuiles', () => {
    expect(centreCase(0, 0)).toEqual({ x: 1, y: 1 });
    expect(centreCase(2, 3)).toEqual({ x: 5, y: 7 });
    expect(centreCase(15, 8)).toEqual({ x: 31, y: 17 });
  });

  it('la case sous un point : toute la case, ses bords inclus au nord-ouest, rien hors de la carte', () => {
    expect(caseSousPoint(carte, 5, 7)).toEqual({ cx: 2, cy: 3 });
    expect(caseSousPoint(carte, 4, 6)).toEqual({ cx: 2, cy: 3 });
    expect(caseSousPoint(carte, 5.99, 7.99)).toEqual({ cx: 2, cy: 3 });
    expect(caseSousPoint(carte, 6, 8)).toEqual({ cx: 3, cy: 4 });
    expect(caseSousPoint(carte, 0, 0)).toEqual({ cx: 0, cy: 0 });
    expect(caseSousPoint(carte, 31.99, 17.99)).toEqual({ cx: 15, cy: 8 });
    for (const [x, y] of [[-0.01, 5], [5, -0.01], [32, 5], [5, 18], [Number.NaN, 5], [5, Infinity]] as const) {
      expect(caseSousPoint(carte, x, y), `${String(x)},${String(y)}`).toBeNull();
    }
  });

  it('la case sous le centre d’une case est cette case, pour toute la grille', () => {
    for (const c of toutesLesCases(carte)) {
      const centre = centreCase(c.cx, c.cy);
      expect(caseSousPoint(carte, centre.x, centre.y)).toEqual(c);
    }
  });

  it('une case existe si ses deux coordonnées sont des entiers dans la grille', () => {
    expect(caseExiste(carte, 0, 0)).toBe(true);
    expect(caseExiste(carte, 15, 8)).toBe(true);
    for (const [cx, cy] of [[16, 0], [0, 9], [-1, 0], [0, -1], [0.5, 0], [0, Number.NaN]] as const) expect(caseExiste(carte, cx, cy), `${String(cx)},${String(cy)}`).toBe(false);
  });
});

describe('cases libres et interdites', () => {
  it('les cases du chemin sont interdites, les autres libres', () => {
    const niveau = niveauEssai();
    // Chemin 0 : axe y = 5, tuiles de rangées 4 et 5, donc la ligne de cases 2. Chemin 1 : axe y = 12, rangées 11 et 12, lignes 5 et 6.
    for (let cx = 0; cx < 16; cx++) {
      for (const cy of [2, 5, 6]) expect(estCaseInterdite(niveau, cx, cy), `(${String(cx)},${String(cy)})`).toBe(true);
      for (const cy of [0, 1, 3, 4, 7, 8]) expect(estCaseInterdite(niveau, cx, cy), `(${String(cx)},${String(cy)})`).toBe(false);
    }
  });

  it('casesLibres : toute la grille moins les cases interdites et les cases occupées, dans l’ordre de la grille', () => {
    const etat = partieEssai();
    const avant = casesLibres(etat);
    expect(avant).toHaveLength(144 - 48);
    expect(avant[0]).toEqual({ cx: 0, cy: 0 });
    appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'tir' });
    const apres = casesLibres(etat);
    expect(apres).toHaveLength(avant.length - 1);
    expect(apres).not.toContainEqual(ce(0));
    expect(apres.every((c) => !estCaseInterdite(etat.niveau, c.cx, c.cy))).toBe(true);
  });
});

describe('construire sur une case', () => {
  it('pose la tour au centre de la case, sur n’importe quelle case libre de la grille', () => {
    const etat = partieEssai();
    for (const c of casesLibres(etat)) {
      // Une tour de tir n'exige rien d'autre qu'une case libre : on la pose partout, une par case.
      etat.aretes = 100000;
      expect(appliquerAction(etat, construire(c.cx, c.cy)), `(${String(c.cx)},${String(c.cy)})`).toEqual({ ok: true });
      const tour = tourSurCase(etat, c.cx, c.cy);
      expect(tour).toMatchObject({ cx: c.cx, cy: c.cy, ...centreCase(c.cx, c.cy) });
    }
    expect(etat.tours).toHaveLength(96);
    expect(casesLibres(etat)).toEqual([]);
  });

  it('refuse une case interdite : le chemin, quelle que soit la famille', () => {
    const etat = partieEssai();
    for (const tour of ['caserne', 'tir', 'magie', 'artillerie', 'divine'] as const) {
      expect(validerAction(etat, construire(7, 2, tour)), tour).toBe('case_interdite');
    }
    expect(appliquerAction(etat, construire(7, 2))).toEqual({ ok: false, raison: 'case_interdite' });
    expect(appliquerAction(etat, construire(0, 5))).toEqual({ ok: false, raison: 'case_interdite' });
    expect(etat.tours).toEqual([]);
    expect(etat.journal).toEqual([]);
  });

  it('refuse une case occupée, et deux tours ne partagent jamais une case', () => {
    const etat = partieEssai();
    expect(appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'tir' })).toEqual({ ok: true });
    for (const tour of ['caserne', 'tir', 'magie', 'artillerie', 'divine'] as const) {
      expect(appliquerAction(etat, { type: 'construire', ...ce(0), tour }), tour).toEqual({ ok: false, raison: 'case_occupee' });
    }
    expect(etat.tours).toHaveLength(1);
    // La case voisine, elle, reste libre : l'écart entre deux tours tient à la taille de la case.
    expect(appliquerAction(etat, construire(ce(0).cx + 1, ce(0).cy))).toEqual({ ok: true });
    const [a, b] = etat.tours;
    expect(b && a ? b.x - a.x : 0).toBe(REGLES.tailleCase);
  });

  it('refuse une case hors de la grille ou mal formée', () => {
    const etat = partieEssai();
    for (const [cx, cy] of [[16, 0], [0, 9], [-1, 3], [3, -1], [99, 99]] as const) {
      expect(appliquerAction(etat, construire(cx, cy)), `${String(cx)},${String(cy)}`).toEqual({ ok: false, raison: 'case_hors_carte' });
    }
    for (const [cx, cy] of [[1.5, 3], [3, 1.5], [Number.NaN, 3], [3, Infinity]] as const) {
      expect(appliquerAction(etat, construire(cx, cy)), `${String(cx)},${String(cy)}`).toEqual({ ok: false, raison: 'action_invalide' });
    }
    expect(appliquerAction(etat, { type: 'construire', tour: 'tir' } as unknown as Action)).toEqual({ ok: false, raison: 'action_invalide' });
    expect(appliquerAction(etat, { type: 'construire', socle: 0, tour: 'tir' } as unknown as Action)).toEqual({ ok: false, raison: 'action_invalide' });
    expect(etat.tours).toEqual([]);
  });

  it('une case occupée libère la case quand la tour est vendue', () => {
    const etat = partieEssai();
    appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'tir' });
    expect(appliquerAction(etat, { type: 'vendre', ...ce(0) })).toEqual({ ok: true });
    expect(casesLibres(etat)).toContainEqual(ce(0));
    expect(appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'magie' })).toEqual({ ok: true });
  });

  it('vente, amélioration, spécialisation, compétence et ralliement visent la tour de la case', () => {
    const etat = partieEssai(configDe('charlie'), 20000);
    appliquerAction(etat, { type: 'construire', ...ce(1), tour: 'caserne' });
    appliquerAction(etat, { type: 'construire', ...ce(2), tour: 'tir' });
    const { cx, cy } = ce(1);
    expect(appliquerAction(etat, { type: 'ameliorer', cx, cy })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'ameliorer', cx, cy })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'specialiser', cx, cy, voie: 'A' })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'ameliorerCompetence', cx, cy, competence: 'mur' })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'deplacerRalliement', cx, cy, x: 12, y: 5 })).toEqual({ ok: true });
    expect(tourSurCase(etat, cx, cy)).toMatchObject({ famille: 'caserne', niveau: 4, voie: 'A', ralliementX: 12, ralliementY: 5 });
    expect(tourSurCase(etat, ce(2).cx, ce(2).cy)).toMatchObject({ famille: 'tir', niveau: 1 });
    // Une case vide, ou voisine de la tour, ne reçoit rien.
    for (const action of [
      { type: 'ameliorer', cx: cx + 1, cy },
      { type: 'vendre', cx: cx + 1, cy },
      { type: 'specialiser', cx: cx + 1, cy, voie: 'A' },
      { type: 'ameliorerCompetence', cx: cx + 1, cy, competence: 'mur' },
      { type: 'deplacerRalliement', cx: cx + 1, cy, x: 12, y: 5 },
    ] as const) {
      expect(validerAction(etat, action), action.type).toBe('case_vide');
    }
    expect(appliquerAction(etat, { type: 'vendre', cx, cy })).toEqual({ ok: true });
    expect(tourSurCase(etat, cx, cy)).toBeUndefined();
    expect(etat.tours).toHaveLength(1);
  });
});

describe('casernes et point de ralliement par défaut', () => {
  // Chemin 0 : y = 5, tuiles 4 et 5. Cases de la ligne 1 (centre y = 3) et 3 (centre y = 7) : à 2 tuiles de l'axe.
  // Lignes 0 et 4 (centres y = 1 et 9) : à 4 tuiles, hors de la portée de la caserne (3,5) ; la ligne 4 est à 3 tuiles du chemin 1, donc à portée.
  const PORTEE_CASERNE = TOURS.caserne.niveaux[0].portee;

  it('la caserne se pose là où un chemin est à portée, et son ralliement est le point du chemin le plus proche', () => {
    const etat = partieEssai();
    expect(appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'caserne' })).toEqual({ ok: true });
    const tour = tourSurCase(etat, ce(0).cx, ce(0).cy);
    expect(tour).toMatchObject({ x: 5, y: 7, ralliementX: 5, ralliementY: 5 });
    // Au nord du chemin aussi.
    expect(appliquerAction(etat, construire(3, 1, 'caserne'))).toEqual({ ok: true });
    expect(tourSurCase(etat, 3, 1)).toMatchObject({ x: 7, y: 3, ralliementX: 7, ralliementY: 5 });
    // Les soldats rejoignent ce point.
    avancerSecondes(etat, 3);
    const soldats = etat.unites.filter((u) => u.genre === 'soldat' && u.tour === tour?.id);
    expect(soldats).toHaveLength(3);
    for (const s of soldats) expect(Math.sqrt((s.x - 5) * (s.x - 5) + (s.y - 5) * (s.y - 5))).toBeLessThan(1.1);
  });

  it('refuse la caserne sur une case sans chemin à portée, avec une raison claire, mais permet les autres familles', () => {
    const etat = partieEssai();
    // Case (3, 0) : centre (7, 1), à 4 tuiles du chemin 0 (y = 5) et 11 du chemin 1 : hors de portée (3,5).
    expect(PORTEE_CASERNE).toBe(3.5);
    expect(validerAction(etat, construire(3, 0, 'caserne'))).toBe('caserne_sans_chemin');
    expect(appliquerAction(etat, construire(3, 0, 'caserne'))).toEqual({ ok: false, raison: 'caserne_sans_chemin' });
    expect(etat.tours).toEqual([]);
    expect(etat.aretes).toBe(5000);
    for (const tour of ['tir', 'magie', 'artillerie', 'divine'] as const) {
      expect(validerAction(etat, construire(3, 0, tour)), tour).toBeNull();
    }
    expect(appliquerAction(etat, construire(3, 0, 'artillerie'))).toEqual({ ok: true });
    // Une case à une case du chemin, quel que soit l'axe, est à portée : (4, 7) est à 3 tuiles du chemin 1.
    expect(validerAction(etat, construire(4, 7, 'caserne'))).toBeNull();
  });

  it('la portée se compte depuis le centre de la case, bornes comprises', () => {
    const etat = partieEssai();
    // Centre à 2 tuiles de l'axe : à portée. Centre à 3 (de l'axe du chemin 1) : à portée de 3,5 et de 3 (borne comprise), pas de 2,9.
    // Centre à 4 tuiles (ligne 0) : hors de la portée de 3,5.
    expect(ralliementParDefaut(etat.chemins, 2, 3, PORTEE_CASERNE)).toEqual({ x: 5, y: 5 });
    expect(ralliementParDefaut(etat.chemins, 2, 4, PORTEE_CASERNE)).toEqual({ x: 5, y: 12 });
    expect(ralliementParDefaut(etat.chemins, 2, 4, 3)).toEqual({ x: 5, y: 12 });
    expect(ralliementParDefaut(etat.chemins, 2, 4, 2.9)).toBeNull();
    expect(ralliementParDefaut(etat.chemins, 2, 0, PORTEE_CASERNE)).toBeNull();
    expect(ralliementParDefaut([], 2, 3, 100)).toBeNull();
  });

  it('prend le chemin le plus proche quand il y en a deux', () => {
    const etat = partieEssai();
    // Case (3, 4) : centre (7, 9) ; chemin 0 (y = 5) à 4 tuiles, chemin 1 (y = 12) à 3 : le plus proche, puis la caserne s'y pose (3 <= 3,5).
    expect(validerAction(etat, construire(3, 4, 'caserne'))).toBeNull();
    expect(ralliementParDefaut(etat.chemins, 3, 4, PORTEE_CASERNE)).toEqual({ x: 7, y: 12 });
  });

  it('la tour divine de Plume (assassins, portée 3,5) suit la même règle ; celles de Charlie et de Pollen (sans soldats) non', () => {
    const plume = partieEssai(configDe('plume'));
    // Case (10, 0) : centre (21, 1), à 4 tuiles du chemin 0 ; case (2, 4) : centre (5, 9), à 3 tuiles du chemin 1.
    expect(validerAction(plume, construire(10, 0, 'divine'))).toBe('caserne_sans_chemin');
    expect(validerAction(plume, construire(2, 4, 'divine'))).toBeNull();
    expect(appliquerAction(plume, construire(2, 4, 'divine'))).toEqual({ ok: true });
    expect(tourSurCase(plume, 2, 4)).toMatchObject({ x: 5, y: 9, ralliementX: 5, ralliementY: 12 });
    for (const dieu of ['charlie', 'pollen']) {
      expect(validerAction(partieEssai(configDe(dieu)), construire(10, 0, 'divine')), dieu).toBeNull();
    }
  });

  it('les tours sans soldats ont leur ralliement au centre de leur case', () => {
    const etat = partieEssai();
    appliquerAction(etat, construire(4, 7, 'magie'));
    expect(tourSurCase(etat, 4, 7)).toMatchObject({ ralliementX: 9, ralliementY: 15 });
  });

  it('défi Fer : la caserne imposée reste soumise à la règle du chemin à portée', () => {
    const niveau: Niveau = { ...niveauEssai(), defiFer: { familles: ['caserne', 'tir'] } };
    const etat = creerPartie(niveau, { ...CONFIG, defi: 'fer', bonus: { tours: {}, heros: {} } });
    etat.aretes = 5000;
    expect(validerAction(etat, construire(3, 0, 'caserne'))).toBe('caserne_sans_chemin');
    expect(validerAction(etat, construire(4, 7, 'magie'))).toBe('famille_interdite');
    expect(validerAction(etat, construire(4, 7, 'tir'))).toBeNull();
    expect(validerAction(etat, construire(2, 3, 'caserne'))).toBeNull();
    // La case est vérifiée avant la famille : sur le chemin, c'est la case qui est dite interdite.
    expect(validerAction(etat, construire(2, 2, 'magie'))).toBe('case_interdite');
  });
});

describe('rejeu et sérialisation', () => {
  /** Une partie courte jouée sur la carte d'essai, avec des constructions de plusieurs familles à plusieurs cases. */
  function jouerUnePartie(): ReturnType<typeof creerPartie> {
    const etat = creerPartie(niveauEssai([{ paquets: [{ ennemi: 'paysan_affame', nombre: 6, intervalle: 1, chemin: 0, delai: 0 }] }], 3000), CONFIG);
    const plan: readonly (readonly [number, Action])[] = [
      [0, construire(2, 3, 'caserne')],
      [0, construire(5, 3, 'tir')],
      [0, construire(7, 1, 'magie')],
      [0, construire(2, 2)], // refusée : chemin
      [30, { type: 'ameliorer', cx: 5, cy: 3 }],
      [60, construire(9, 3, 'artillerie')],
      [90, { type: 'vendre', cx: 7, cy: 1 }],
      [120, construire(7, 1, 'tir')],
      [150, { type: 'deplacerRalliement', cx: 2, cy: 3, x: 6, y: 5 }],
    ];
    while (etat.statut === 'en_cours' && etat.pas < 2400) {
      avancer(etat, plan.filter(([pas]) => pas === etat.pas).map(([, a]) => a));
    }
    return etat;
  }

  it('le rejeu du journal redonne exactement le même état', () => {
    const jouee = jouerUnePartie();
    expect(jouee.tours.length).toBeGreaterThanOrEqual(4);
    expect(jouee.journal.some((e) => e.action.type === 'construire' && e.action.cx === 2 && e.action.cy === 2)).toBe(false);
    const rejouee = rejouer(niveauEssai([{ paquets: [{ ennemi: 'paysan_affame', nombre: 6, intervalle: 1, chemin: 0, delai: 0 }] }], 3000), CONFIG, jouee.journal, jouee.pas);
    expect(serialiser(rejouee)).toBe(serialiser(jouee));
  });

  it('un état se sérialise et se relit à l’identique, cases comprises', () => {
    const jouee = jouerUnePartie();
    const relue = deserialiser(serialiser(jouee));
    expect(relue.tours.map((t) => [t.cx, t.cy])).toEqual(jouee.tours.map((t) => [t.cx, t.cy]));
    expect(relue.niveau.casesInterdites).toEqual(jouee.niveau.casesInterdites);
    expect(serialiser(relue)).toBe(serialiser(jouee));
    // Les cases interdites se lisent dans l'état relu, pas dans le niveau d'origine.
    expect(estCaseInterdite(relue.niveau, 2, 2)).toBe(true);
    expect(estCaseInterdite(relue.niveau, 2, 3)).toBe(false);
  });

  it('refuse l’état d’une version précédente (tours posées sur des socles)', () => {
    const jouee = jouerUnePartie();
    const ancien = JSON.parse(serialiser(jouee)) as { version: number };
    ancien.version = VERSION_ETAT - 1;
    expect(() => deserialiser(JSON.stringify(ancien))).toThrow(/version/i);
    const anciennesDonnees = JSON.parse(serialiser(jouee)) as { versionDonnees: number };
    anciennesDonnees.versionDonnees = VERSION_DONNEES - 1;
    expect(() => deserialiser(JSON.stringify(anciennesDonnees))).toThrow(/version/i);
  });

  it('rejouer un journal de l’ancien format (actions sur des socles) est refusé sans exception', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    const ancienne = { type: 'construire', socle: 0, tour: 'tir' } as unknown as Action;
    expect(appliquerAction(etat, ancienne)).toEqual({ ok: false, raison: 'action_invalide' });
    expect(etat.journal).toEqual([]);
  });
});

describe('les ennemis passent entre les tours : une tour sur une case libre ne bloque rien', () => {
  it('une tour posée juste à côté du chemin tire sur l’ennemi qui passe', () => {
    const etat = partieEssai();
    appliquerAction(etat, { type: 'construire', ...ce(1), tour: 'tir' });
    ennemiFixe(etat, 11);
    const pv = etat.ennemis[0]?.pv ?? 0;
    for (let i = 0; i < 90; i++) step(etat);
    expect(etat.ennemis[0]?.pv ?? 0).toBeLessThan(pv);
  });
});
