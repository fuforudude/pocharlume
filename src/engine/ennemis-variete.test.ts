// Mécaniques des 20 ennemis ajoutés par la spec « variété » (2 par région), jouées avec les valeurs des données : au moins un test
// par ennemi, qui prouve le rôle que la spec lui donne (docs/specs/2026-11-03-lisibilite-bestiaire-variete.md).
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { avancerSecondes, compter, construireTour, ennemiDonnees, ennemisDe, evenementsPendant, heros, partieEssai, tourDe } from './aides.test-utils';
import { appliquerEffet, infligerDegats, partApresBouclier } from './degats';
import type { DefPiege, DefTourelle } from './definitions';
import type { Ennemi, EtatPartie, Unite } from './etat';
import { step } from './partie';
import { construireTourelle, poserPiege } from './structures';
import { enPas } from './temps';

/** Une caserne sur la case d'essai 0 dont les soldats ont pris leur place. */
function partieAvecCaserne(): EtatPartie {
  const etat = partieEssai();
  construireTour(etat, 0, 'caserne');
  avancerSecondes(etat, 2);
  return etat;
}

function unSoldat(etat: EtatPartie): Unite {
  const u = etat.unites.find((s) => s.genre === 'soldat' && !s.mort);
  if (!u) throw new Error('pas de soldat');
  return u;
}

/** L'ennemi des données avec sa vitesse réelle, increvable et inoffensif sauf indication contraire. */
function marcheur(etat: EtatPartie, id: keyof typeof ENNEMIS, x: number, surcharges: Parameters<typeof ennemiDonnees>[3] = {}): Ennemi {
  return ennemiDonnees(etat, id, x, { vitesse: ENNEMIS[id].vitesse, pv: 1e9, degats: [0, 0], ...surcharges });
}

const PIEGE: DefPiege = { degats: 1, typeDegats: 'physique', immobilisation: 1, rayon: 0.5 };
const TOURELLE: DefTourelle = { nom: 'tourelle.essai', portee: 3, degats: [1, 1], cadence: 1, typeDegats: 'physique', volants: false, effets: [], duree: 60 };

describe('Coupe-Bourse : vole 20 arêtes au premier soldat qui le retient, puis file', () => {
  it('prend 20 arêtes au contact, lâche le soldat et file à double vitesse sans plus s’arrêter', () => {
    const etat = partieAvecCaserne();
    const avant = etat.aretes;
    const voleur = marcheur(etat, 'coupe_bourse', 1);
    const vus = evenementsPendant(etat, 8);
    expect(compter(vus, 'vol')).toBe(1);
    expect(voleur.vole).toBe(true);
    expect(voleur.butin).toBe(20);
    expect(etat.aretes).toBe(avant - 20);
    expect(voleur.bloqueur).toBe(-1);
    expect(voleur.chargeVitesse).toBe(2);
    expect(voleur.charge).toBeGreaterThan(0);
  });

  it('tué, il rend son butin en plus de sa prime', () => {
    const etat = partieAvecCaserne();
    const voleur = marcheur(etat, 'coupe_bourse', 1);
    evenementsPendant(etat, 8);
    const apres = etat.aretes;
    infligerDegats(etat, voleur, 1e12, 'pur');
    expect(etat.aretes).toBe(apres + voleur.prime + 20);
  });

  it('échappé, le butin est perdu et la sortie coûte une vie', () => {
    const etat = partieAvecCaserne();
    const avant = etat.aretes;
    const vies = etat.vies;
    marcheur(etat, 'coupe_bourse', 1);
    evenementsPendant(etat, 40);
    expect(etat.aretes).toBe(avant - 20);
    expect(etat.vies).toBe(vies - 1);
  });

  it('sans soldat sur sa route, il vole à la sortie', () => {
    const etat = partieEssai();
    const avant = etat.aretes;
    marcheur(etat, 'coupe_bourse', 28);
    const vus = evenementsPendant(etat, 4);
    expect(compter(vus, 'vol')).toBe(1);
    expect(etat.aretes).toBe(avant - 20);
  });

  it('ne prend jamais plus d’arêtes que le joueur n’en a', () => {
    const etat = partieEssai();
    etat.aretes = 7;
    marcheur(etat, 'coupe_bourse', 28);
    evenementsPendant(etat, 4);
    expect(etat.aretes).toBe(0);
  });
});

describe('Grand Manteau : à sa mort, trois Mendiants sortent de son manteau', () => {
  it('tué, il laisse 3 Mendiants sur son chemin, espacés vers l’entrée', () => {
    const etat = partieEssai();
    const manteau = ennemiDonnees(etat, 'grand_manteau', 12);
    const vague = manteau.vague;
    infligerDegats(etat, manteau, 1e9, 'pur');
    step(etat);
    const mendiants = ennemisDe(etat, 'mendiant');
    expect(mendiants).toHaveLength(3);
    expect(mendiants.map((m) => m.distance)).toEqual([12, 11.6, 11.2]);
    expect(mendiants.every((m) => m.chemin === 0 && m.vague === vague && !m.elite)).toBe(true);
    expect(compter(etat.evenements, 'division')).toBe(1);
    expect(etat.ennemis.includes(manteau)).toBe(false);
  });

  it('échappé, il ne se divise pas', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'grand_manteau', 29.9, { vitesse: 2 });
    avancerSecondes(etat, 2);
    expect(ennemisDe(etat, 'mendiant')).toHaveLength(0);
  });

  it('les fragments sont des ennemis comme les autres : le niveau n’est gagné qu’après eux', () => {
    const etat = partieEssai();
    const manteau = ennemiDonnees(etat, 'grand_manteau', 5);
    infligerDegats(etat, manteau, 1e9, 'pur');
    step(etat);
    expect(etat.ennemis.length).toBe(3);
  });
});

describe('Gerbe Ardente : kamikaze, explose au contact d’un soldat', () => {
  it('blesse les soldats autour d’elle et disparaît, sans prime ni vie perdue', () => {
    const etat = partieAvecCaserne();
    const pvAvant = etat.unites.filter((u) => u.genre === 'soldat').reduce((somme, u) => somme + u.pv, 0);
    const aretes = etat.aretes;
    const vies = etat.vies;
    const gerbe = marcheur(etat, 'gerbe_ardente', 1);
    const vus = evenementsPendant(etat, 8);
    expect(compter(vus, 'explosion')).toBe(1);
    expect(compter(vus, 'mort')).toBe(0);
    expect(gerbe.vivant).toBe(false);
    expect(etat.ennemis.includes(gerbe)).toBe(false);
    expect(etat.aretes).toBe(aretes);
    expect(etat.vies).toBe(vies);
    const pvApres = etat.unites.filter((u) => u.genre === 'soldat').reduce((somme, u) => somme + u.pv, 0);
    expect(pvApres).toBeLessThan(pvAvant);
  });

  it('inflige les dégâts des données (après armure) à chaque soldat dans le rayon', () => {
    const etat = partieAvecCaserne();
    const soldat = unSoldat(etat);
    const pv = soldat.pv;
    const gerbe = marcheur(etat, 'gerbe_ardente', soldat.x - 0.3);
    gerbe.bloqueur = soldat.id;
    soldat.bloques = 1;
    const armure = soldat.stats.armure;
    step(etat);
    expect(pv - soldat.pv).toBeCloseTo(22 * (1 - armure), 5);
  });

  it('abattue avant le contact, elle verse sa prime et n’explose pas', () => {
    const etat = partieAvecCaserne();
    const aretes = etat.aretes;
    const gerbe = marcheur(etat, 'gerbe_ardente', 1);
    infligerDegats(etat, gerbe, 1e12, 'pur');
    const vus = evenementsPendant(etat, 1);
    expect(compter(vus, 'explosion')).toBe(0);
    expect(etat.aretes).toBe(aretes + gerbe.prime);
  });
});

describe('Porte-Herse : bouclier frontal', () => {
  it('arrête 75 % d’un coup venu de devant lui, pas d’un coup venu de derrière', () => {
    const etat = partieEssai();
    const herse = ennemiDonnees(etat, 'porte_herse', 8);
    // Le chemin 0 va vers les x croissants : (11, 7) est devant lui, (5, 7) derrière.
    expect(partApresBouclier(etat, herse, 11, 7)).toBeCloseTo(0.25, 9);
    expect(partApresBouclier(etat, herse, 5, 7)).toBe(1);
    expect(partApresBouclier(etat, ennemiDonnees(etat, 'paysan_affame', 8), 11, 7)).toBe(1);
  });

  it('une tour de tir placée devant lui le blesse quatre fois moins que la même placée derrière', () => {
    const pvPerdus = (x: number): number => {
      const etat = partieEssai();
      construireTour(etat, 1, 'tir');
      const herse = ennemiDonnees(etat, 'porte_herse', x);
      const pv = herse.pv;
      for (let i = 0; i < 120 && herse.pv === pv; i++) step(etat);
      return pv - herse.pv;
    };
    // La tour est en (11, 7) : l’ennemi à 9 la a devant lui, l’ennemi à 13 derrière lui, à la même distance.
    const devant = pvPerdus(9);
    const derriere = pvPerdus(13);
    expect(devant).toBeGreaterThan(0);
    expect(derriere / devant).toBeCloseTo(4, 3);
  });

  it('les soldats et les dégâts purs ne sont pas arrêtés', () => {
    const etat = partieEssai();
    const herse = ennemiDonnees(etat, 'porte_herse', 8);
    infligerDegats(etat, herse, 100, 'pur');
    expect(herse.pvMax - herse.pv).toBeCloseTo(100, 6);
  });
});

describe('Fagotier : met le feu à une tour proche toutes les 12 s', () => {
  it('désactive la tour à 3 tuiles 3 s, mais laisse celle qui est plus loin', () => {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    construireTour(etat, 3, 'tir');
    ennemiDonnees(etat, 'fagotier', 11, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 11.8);
    expect(tourDe(etat, 1)?.desactivee).toBe(0);
    avancerSecondes(etat, 0.5);
    const proche = tourDe(etat, 1);
    expect(proche?.desactivee).toBeGreaterThan(0);
    expect(proche?.desactivee).toBeLessThanOrEqual(enPas(3));
    expect(tourDe(etat, 3)?.desactivee).toBe(0);
    avancerSecondes(etat, 3.2);
    expect(proche?.desactivee).toBe(0);
  });

  it('sans tour à 3 tuiles, il n’agit pas (le boss, sans rayon, vise toujours la plus proche)', () => {
    const etat = partieEssai();
    construireTour(etat, 3, 'tir');
    ennemiDonnees(etat, 'fagotier', 5, { pv: 1e9, degats: [0, 0] });
    const vus = evenementsPendant(etat, 14);
    expect(compter(vus, 'tour_desactivee')).toBe(0);
    ennemiDonnees(etat, 'juge_flammes', 5, { pv: 1e9, degats: [0, 0] });
    expect(compter(evenementsPendant(etat, 13), 'tour_desactivee')).toBeGreaterThan(0);
  });
});

describe('Crieur Public : aura de protection de 30 %', () => {
  it('les ennemis à 2,5 tuiles subissent 30 % de dégâts en moins, les autres non, lui non plus', () => {
    const etat = partieEssai();
    const crieur = ennemiDonnees(etat, 'crieur_public', 10, { pv: 1e6 });
    const proche = ennemiDonnees(etat, 'paysan_affame', 11.5, { pv: 1e6 });
    const loin = ennemiDonnees(etat, 'paysan_affame', 20, { pv: 1e6 });
    step(etat);
    infligerDegats(etat, proche, 100, 'physique');
    infligerDegats(etat, loin, 100, 'physique');
    infligerDegats(etat, crieur, 100, 'physique');
    expect(proche.pvMax - proche.pv).toBeCloseTo(70, 6);
    expect(loin.pvMax - loin.pv).toBeCloseTo(100, 6);
    expect(crieur.pvMax - crieur.pv).toBeCloseTo(100, 6);
  });

  it('vaut aussi pour la magie, jamais pour les dégâts purs, et ne se cumule pas', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'crieur_public', 10);
    ennemiDonnees(etat, 'crieur_public', 10.5);
    const proche = ennemiDonnees(etat, 'paysan_affame', 11.5, { pv: 1e6 });
    step(etat);
    expect(proche.bonusProtection).toBeCloseTo(0.3, 9);
    infligerDegats(etat, proche, 100, 'magique');
    expect(proche.pvMax - proche.pv).toBeCloseTo(70, 6);
    infligerDegats(etat, proche, 100, 'pur');
    expect(proche.pvMax - proche.pv).toBeCloseTo(170, 6);
  });

  it('mort, il ne protège plus', () => {
    const etat = partieEssai();
    const crieur = ennemiDonnees(etat, 'crieur_public', 10);
    const proche = ennemiDonnees(etat, 'paysan_affame', 11.5, { pv: 1e6 });
    infligerDegats(etat, crieur, 1e9, 'pur');
    step(etat);
    expect(proche.bonusProtection).toBe(0);
  });
});

describe('Crapaud Gonflé : bondit par-dessus le soldat qui le retient', () => {
  it('franchit 3 tuiles en un pas, sans étourdir le soldat, puis attend 4 s avant de bondir de nouveau', () => {
    const etat = partieAvecCaserne();
    const crapaud = marcheur(etat, 'crapaud_gonfle', 1);
    let avant = 0;
    let apres = 0;
    let bloqueurAvant = -1;
    for (let i = 0; i < 30 * 12; i++) {
      avant = crapaud.distance;
      bloqueurAvant = crapaud.bloqueur;
      step(etat);
      if (etat.evenements.some((e) => e.type === 'bond')) {
        apres = crapaud.distance;
        break;
      }
    }
    expect(apres - avant).toBeGreaterThanOrEqual(3);
    // Il ne retient plus le soldat qui l’arrêtait (un autre, plus loin, peut le retenir aussitôt : mais il ne bondira pas avant 4 s).
    expect(crapaud.bloqueur).not.toBe(bloqueurAvant);
    expect(etat.unites.every((u) => u.etourdi === 0)).toBe(true);
    expect(crapaud.bondPas).toBeGreaterThan(enPas(4) - 2);
    const vus = evenementsPendant(etat, 3.8);
    expect(compter(vus, 'bond')).toBe(0);
  });

  it('sans soldat sur sa route il avance normalement, et il peut bondir plusieurs fois', () => {
    const etat = partieEssai();
    const crapaud = marcheur(etat, 'crapaud_gonfle', 5);
    avancerSecondes(etat, 2);
    expect(crapaud.distance).toBeCloseTo(7, 3);
    const h = heros(etat);
    h.x = h.ancreX = 12;
    h.y = h.ancreY = 5;
    const vus = evenementsPendant(etat, 12);
    expect(compter(vus, 'bond')).toBeGreaterThanOrEqual(1);
  });
});

describe('Feu Follet : aveugle les tours proches', () => {
  it('toutes les 10 s, la tour à 3 tuiles perd 30 % de portée pendant 3 s', () => {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    ennemiDonnees(etat, 'feu_follet', 11, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 10.3);
    const tour = tourDe(etat, 1);
    expect(tour?.aveuglePas).toBeGreaterThan(0);
    expect(tour?.aveugleFacteur).toBeCloseTo(0.3, 9);
    avancerSecondes(etat, 3);
    expect(tour?.aveuglePas).toBe(0);
  });
});

describe('Montreur de Rats : lâche 2 Rats de Peste toutes les 10 s', () => {
  it('appelle 2 rats sur son chemin à sa hauteur', () => {
    const etat = partieEssai();
    const montreur = ennemiDonnees(etat, 'montreur_rats', 12, { pv: 1e9, degats: [0, 0] });
    expect(ennemisDe(etat, 'rat_peste')).toHaveLength(0);
    const vus = evenementsPendant(etat, 10.3);
    expect(compter(vus, 'appel')).toBe(1);
    const rats = ennemisDe(etat, 'rat_peste');
    expect(rats).toHaveLength(2);
    expect(rats[0]?.chemin).toBe(montreur.chemin);
    expect(rats[0]?.distance).toBeGreaterThan(11);
    expect(evenementsPendant(etat, 10)).toSatisfy((e: unknown[]) => compter(e as never, 'appel') === 1);
  });
});

describe('Bubonneux : récupère 3 % de ses PV maximaux par seconde', () => {
  it('se régénère, sans dépasser ses PV maximaux', () => {
    const etat = partieEssai();
    const b = ennemiDonnees(etat, 'bubonneux', 10);
    b.pv = b.pvMax * 0.5;
    avancerSecondes(etat, 1);
    expect(b.pv / b.pvMax).toBeCloseTo(0.53, 2);
    avancerSecondes(etat, 30);
    expect(b.pv).toBe(b.pvMax);
  });

  it('ne se soigne pas à terre : un ennemi relevé reste intouchable le temps du délai', () => {
    const etat = partieEssai();
    const b = ennemiDonnees(etat, 'bubonneux', 10);
    b.pv = 1;
    b.invulnerable = 30;
    avancerPas(etat, 5);
    expect(b.pv).toBe(1);
  });
});

function avancerPas(etat: EtatPartie, n: number): void {
  for (let i = 0; i < n; i++) step(etat);
}

describe('Déterreur : s’enfonce sous terre toutes les 9 s', () => {
  it('devient intouchable 2 s puis ressort 2,5 tuiles plus loin', () => {
    const etat = partieEssai();
    const d = ennemiDonnees(etat, 'deterreur', 10, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 9.2);
    expect(d.invulnerable).toBeGreaterThan(0);
    expect(infligerDegats(etat, d, 100, 'pur')).toBe(0);
    avancerSecondes(etat, 2.2);
    expect(d.invulnerable).toBe(0);
    expect(d.distance).toBeCloseTo(12.5, 3);
  });
});

describe('Fagot d’Os : épines', () => {
  it('chaque coup qu’il reçoit au corps-à-corps coûte 6 PV au soldat qui frappe', () => {
    const etat = partieAvecCaserne();
    const soldats = etat.unites.filter((u) => u.genre === 'soldat');
    const pvAvant = soldats.reduce((somme, u) => somme + u.pv, 0);
    marcheur(etat, 'fagot_os', 1, { vitesse: 0.5 });
    const vus = evenementsPendant(etat, 6);
    const coups = compter(vus, 'coup');
    expect(coups).toBeGreaterThan(0);
    const pvApres = soldats.reduce((somme, u) => somme + u.pv, 0);
    expect(pvAvant - pvApres).toBeCloseTo(coups * 6, 5);
  });

  it('un ennemi ordinaire ne blesse pas ceux qui le frappent', () => {
    const etat = partieAvecCaserne();
    const soldats = etat.unites.filter((u) => u.genre === 'soldat');
    const pvAvant = soldats.reduce((somme, u) => somme + u.pv, 0);
    ennemiDonnees(etat, 'paysan_affame', 1, { vitesse: 0.5, pv: 1e9, degats: [0, 0] });
    evenementsPendant(etat, 6);
    expect(soldats.reduce((somme, u) => somme + u.pv, 0)).toBe(pvAvant);
  });
});

describe('Sapeur : détruit les pièges et les tourelles proches', () => {
  it('toutes les 6 s, désamorce ce qui est à 2 tuiles et laisse le reste', () => {
    const etat = partieEssai();
    poserPiege(etat, PIEGE, 11, 6.4);
    poserPiege(etat, PIEGE, 25, 5);
    construireTourelle(etat, -1, TOURELLE, 11.5, 6);
    construireTourelle(etat, -1, TOURELLE, 25, 8);
    ennemiDonnees(etat, 'sapeur', 11, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 5.5);
    expect(etat.pieges).toHaveLength(2);
    const vus = evenementsPendant(etat, 1);
    expect(compter(vus, 'desamorcage')).toBe(1);
    expect(etat.pieges.map((p) => p.x)).toEqual([25]);
    expect(etat.structures.map((s) => s.x)).toEqual([25]);
  });

  it('sans rien à désamorcer, il retente à chaque pas : un piège posé juste après saute aussitôt', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'sapeur', 11, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 7);
    poserPiege(etat, PIEGE, 11.5, 5);
    step(etat);
    step(etat);
    expect(etat.pieges).toHaveLength(0);
  });
});

describe('Aumônier de Guerre : purifie ralentissement et étourdissement', () => {
  it('toutes les 5 s, retire ces effets aux ennemis à 3 tuiles (lui compris), pas aux autres', () => {
    const etat = partieEssai();
    const aumonier = ennemiDonnees(etat, 'aumonier', 10, { pv: 1e9, degats: [0, 0] });
    const proche = ennemiDonnees(etat, 'paysan_affame', 12, { pv: 1e9 });
    const loin = ennemiDonnees(etat, 'paysan_affame', 20, { pv: 1e9 });
    for (const e of [aumonier, proche, loin]) {
      appliquerEffet(etat, e, { type: 'ralentissement', chance: 1, duree: 60, valeur: 0.5 });
      appliquerEffet(etat, e, { type: 'etourdissement', chance: 1, duree: 60, valeur: 1 });
    }
    avancerSecondes(etat, 4.5);
    expect(proche.effetsPas[0]).toBeGreaterThan(0);
    const vus = evenementsPendant(etat, 1);
    expect(compter(vus, 'purification')).toBe(1);
    for (const e of [aumonier, proche]) {
      expect(e.effetsPas[0]).toBe(0);
      expect(e.effetsPas[1]).toBe(0);
    }
    expect(loin.effetsPas[0]).toBeGreaterThan(0);
    expect(loin.effetsPas[1]).toBeGreaterThan(0);
  });

  it('ne retire ni la brûlure ni le poison', () => {
    const etat = partieEssai();
    const proche = ennemiDonnees(etat, 'paysan_affame', 11, { pv: 1e9 });
    ennemiDonnees(etat, 'aumonier', 10, { pv: 1e9, degats: [0, 0] });
    appliquerEffet(etat, proche, { type: 'brulure', chance: 1, duree: 60, valeur: 1 });
    avancerSecondes(etat, 6);
    expect(proche.effetsPas[2]).toBeGreaterThan(0);
  });
});

describe('Chantre : terrifie les soldats et le héros proches', () => {
  it('toutes les 9 s, étourdit 1,5 s les unités à 2 tuiles et leur fait lâcher leurs ennemis', () => {
    const etat = partieAvecCaserne();
    const soldat = unSoldat(etat);
    const chantre = ennemiDonnees(etat, 'chantre', soldat.x, { pv: 1e9, degats: [0, 0] });
    chantre.y = soldat.y;
    const h = heros(etat);
    expect(h.x).toBeGreaterThan(20);
    let terrifie = false;
    for (let i = 0; i < 30 * 10 && !terrifie; i++) {
      step(etat);
      terrifie = etat.evenements.some((e) => e.type === 'terreur');
    }
    expect(terrifie).toBe(true);
    // Les soldats à moins de 2 tuiles du chantre sont étourdis ; le héros, loin, ne l'est pas.
    const proches = etat.unites.filter((u) => u.genre === 'soldat' && (u.x - chantre.x) ** 2 + (u.y - chantre.y) ** 2 <= 4);
    expect(proches.length).toBeGreaterThan(0);
    expect(proches.every((u) => u.etourdi > 0)).toBe(true);
    expect(h.etourdi).toBe(0);
  });

  it('un soldat étourdi par le chant ne bloque plus personne', () => {
    const etat = partieEssai();
    construireTour(etat, 0, 'caserne');
    avancerSecondes(etat, 2);
    const soldat = unSoldat(etat);
    const paysan = ennemiDonnees(etat, 'paysan_affame', soldat.x, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 1);
    expect(paysan.bloqueur).not.toBe(-1);
    const chantre = ennemiDonnees(etat, 'chantre', soldat.x, { pv: 1e9, degats: [0, 0] });
    chantre.minuteurs[0] = 1;
    step(etat);
    expect(soldat.etourdi).toBeGreaterThanOrEqual(enPas(1.5) - 1);
    expect(soldat.bloques).toBe(0);
  });
});

describe('Frère Sans-Porte : insaisissable', () => {
  it('passe entre les soldats sans que personne l’arrête ni le vise', () => {
    const etat = partieAvecCaserne();
    const frere = marcheur(etat, 'frere_sans_porte', 1);
    let bloque = false;
    const x0 = frere.distance;
    for (let i = 0; i < 30 * 10; i++) {
      step(etat);
      if (frere.bloqueur !== -1) bloque = true;
    }
    expect(bloque).toBe(false);
    expect(frere.distance - x0).toBeCloseTo(10 * ENNEMIS.frere_sans_porte.vitesse, 3);
    expect(etat.unites.every((u) => u.cible !== frere.id)).toBe(true);
  });

  it('un ennemi ordinaire de même vitesse, lui, est arrêté', () => {
    const etat = partieAvecCaserne();
    const paysan = ennemiDonnees(etat, 'paysan_affame', 1, { vitesse: 1, pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 10);
    expect(paysan.distance).toBeLessThan(10);
  });

  it('les tours le touchent comme un ennemi au sol', () => {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    const frere = ennemiDonnees(etat, 'frere_sans_porte', 10);
    avancerSecondes(etat, 3);
    expect(frere.pv).toBeLessThan(frere.pvMax);
  });
});

describe('Effigie du Roi : armure et résistance s’échangent', () => {
  it('armure 60 % puis résistance 60 %, toutes les 5 s', () => {
    const etat = partieEssai();
    const e = ennemiDonnees(etat, 'effigie_roi', 10, { pv: 1e9, degats: [0, 0] });
    expect([e.armure, e.resistance]).toEqual([0.6, 0]);
    avancerSecondes(etat, 5.1);
    expect([e.armure, e.resistance]).toEqual([0, 0.6]);
    const pv = e.pv;
    infligerDegats(etat, e, 100, 'physique');
    expect(pv - e.pv).toBeCloseTo(100, 6);
    avancerSecondes(etat, 5);
    expect([e.armure, e.resistance]).toEqual([0.6, 0]);
  });

  it('la version d’élite échange ses protections renforcées', () => {
    const etat = partieEssai();
    const e = ennemiDonnees(etat, 'effigie_roi', 10, { pv: 1e9, degats: [0, 0] }, 0, true);
    expect([e.armure, e.resistance]).toEqual([0.9, 0.3]);
    avancerSecondes(etat, 5.1);
    expect([e.armure, e.resistance]).toEqual([0.3, 0.9]);
  });
});

describe('Bourreau du Roi : tue un soldat d’un coup', () => {
  it('dévore le soldat qui le retient toutes les 5 s', () => {
    const etat = partieAvecCaserne();
    marcheur(etat, 'bourreau_roi', 1, { degats: [0, 0] });
    const vus = evenementsPendant(etat, 14);
    expect(compter(vus, 'devore')).toBeGreaterThanOrEqual(1);
  });
});

describe('Gargouille : de pierre, elle se fige et ignore les contrôles', () => {
  it('ni ralentie ni étourdie', () => {
    const etat = partieEssai();
    const g = ennemiDonnees(etat, 'gargouille', 10);
    appliquerEffet(etat, g, { type: 'ralentissement', chance: 1, duree: 5, valeur: 0.5 });
    appliquerEffet(etat, g, { type: 'etourdissement', chance: 1, duree: 5, valeur: 1 });
    expect(g.effetsPas[0]).toBe(0);
    expect(g.effetsPas[1]).toBe(0);
  });

  it('toutes les 8 s, elle devient intouchable 2 s sans avancer', () => {
    const etat = partieEssai();
    const g = marcheur(etat, 'gargouille', 5);
    avancerSecondes(etat, 8.2);
    expect(g.invulnerable).toBeGreaterThan(0);
    const x = g.distance;
    expect(infligerDegats(etat, g, 100, 'pur')).toBe(0);
    avancerSecondes(etat, 1);
    expect(g.distance).toBe(x);
    avancerSecondes(etat, 1.5);
    expect(g.invulnerable).toBe(0);
    expect(g.distance).toBeGreaterThan(x);
  });
});

describe('Martyr Blême : sa dernière lueur soigne les ennemis proches', () => {
  it('à sa mort, rend 35 % des PV maximaux aux ennemis blessés à 3 tuiles, pas aux autres', () => {
    const etat = partieEssai();
    const martyr = ennemiDonnees(etat, 'martyr_bleme', 10);
    const proche = ennemiDonnees(etat, 'paysan_affame', 12, { pv: 100 });
    const loin = ennemiDonnees(etat, 'paysan_affame', 20, { pv: 100 });
    proche.pv = 10;
    loin.pv = 10;
    infligerDegats(etat, martyr, 1e9, 'pur');
    step(etat);
    expect(proche.pv).toBeCloseTo(10 + 0.35 * proche.pvMax, 6);
    expect(loin.pv).toBe(10);
    expect(compter(etat.evenements, 'derniere_lueur')).toBe(1);
  });

  it('un martyr qui s’échappe ne soigne personne', () => {
    const etat = partieEssai();
    const proche = ennemiDonnees(etat, 'paysan_affame', 28, { pv: 100 });
    proche.pv = 10;
    ennemiDonnees(etat, 'martyr_bleme', 29.9, { vitesse: 2 });
    avancerSecondes(etat, 1);
    expect(proche.pv).toBe(10);
  });

  it('ne soigne pas un ennemi à terre', () => {
    const etat = partieEssai();
    const martyr = ennemiDonnees(etat, 'martyr_bleme', 10);
    const proche = ennemiDonnees(etat, 'paysan_affame', 11, { pv: 100 });
    proche.pv = 10;
    proche.invulnerable = 60;
    infligerDegats(etat, martyr, 1e9, 'pur');
    step(etat);
    expect(proche.pv).toBe(10);
  });
});

describe('déterminisme', () => {
  it('deux parties identiques avec les 20 nouveaux ennemis donnent le même état', () => {
    const jouer = (): string => {
      const etat = partieAvecCaserne();
      construireTour(etat, 1, 'tir');
      let x = 1;
      for (const id of ['coupe_bourse', 'grand_manteau', 'gerbe_ardente', 'porte_herse', 'fagotier', 'crieur_public', 'crapaud_gonfle', 'feu_follet', 'montreur_rats', 'bubonneux', 'deterreur', 'fagot_os', 'sapeur', 'aumonier', 'chantre', 'frere_sans_porte', 'effigie_roi', 'bourreau_roi', 'gargouille', 'martyr_bleme'] as const) {
        marcheur(etat, id, x, { pv: ENNEMIS[id].pv, degats: ENNEMIS[id].degats });
        x += 0.5;
      }
      avancerSecondes(etat, 30);
      return JSON.stringify({ ennemis: etat.ennemis, vies: etat.vies, aretes: etat.aretes, rng: etat.rng });
    };
    expect(jouer()).toBe(jouer());
  });
});
