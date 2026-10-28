// Mécaniques des 12 ennemis des régions 2 à 5 (jalon 3), jouées avec les valeurs des données : un test par mécanique.
import { describe, expect, it } from 'vitest';
import { DIEUX } from '../data/dieux';
import { ENNEMIS } from '../data/ennemis';
import { avancerSecondes, compter, configDe, construireTour, ennemiDonnees, ennemiEssai, evenementsPendant, heros, partieEssai } from './aides.test-utils';
import { appliquerEffet, infligerDegats } from './degats';
import { ajouterEnnemi } from './ennemis';
import { EFFET, type EtatPartie } from './etat';
import type { Evenement } from './evenements';
import { appliquerAction, step } from './partie';
import { enPas } from './temps';

/** Une caserne sur le socle 0 dont les soldats ont pris leur place. */
function partieAvecCaserne(): EtatPartie {
  const etat = partieEssai();
  construireTour(etat, 0, 'caserne');
  avancerSecondes(etat, 2);
  return etat;
}

/** Avance jusqu'à un événement (ou `maxSecondes`) ; rend les événements vus, le dernier étant celui cherché. */
function jusquA(etat: EtatPartie, trouve: (e: Evenement) => boolean, maxSecondes: number): Evenement[] {
  const vus: Evenement[] = [];
  for (let i = 0; i < Math.round(maxSecondes * 30); i++) {
    step(etat);
    vus.push(...etat.evenements);
    if (etat.evenements.some(trouve)) break;
  }
  return vus;
}

describe('Glaneur : tire de loin sur les soldats et le héros', () => {
  it('blesse un soldat à moins de 2 tuiles, sans être bloqué', () => {
    const etat = partieAvecCaserne();
    const g = ennemiDonnees(etat, 'glaneur', 7.25);
    const vus = evenementsPendant(etat, 1);
    const tirs = vus.filter((e) => e.type === 'coup_ennemi' && e.distance);
    expect(tirs.length).toBeGreaterThanOrEqual(1);
    expect(g.bloqueur).toBe(-1);
    expect(etat.unites.some((u) => u.genre === 'soldat' && u.pv < u.stats.pv)).toBe(true);
  });

  it('ne tire pas au-delà de sa portée', () => {
    const etat = partieAvecCaserne();
    ennemiDonnees(etat, 'glaneur', 8.5);
    const vus = evenementsPendant(etat, 3);
    expect(compter(vus, 'coup_ennemi')).toBe(0);
  });

  it('tire aussi sur le héros', () => {
    const etat = partieEssai();
    const h = heros(etat);
    h.x = h.ancreX = 10.5;
    h.y = h.ancreY = 5;
    ennemiDonnees(etat, 'glaneur', 12.3);
    const vus = evenementsPendant(etat, 1);
    expect(vus.some((e) => e.type === 'coup_ennemi' && e.distance && e.unite === h.id)).toBe(true);
    expect(h.pv).toBeLessThan(h.stats.pv);
  });
});

describe('Corbeau Noir : volant', () => {
  it('passe au-dessus des soldats sans s’arrêter, contrairement à un ennemi au sol', () => {
    const etat = partieAvecCaserne();
    const corbeau = ennemiDonnees(etat, 'corbeau_noir', 2, { pv: 100000, vitesse: 1.8 });
    const paysan = ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 1.8 }), 'paysan_affame', 0, 2);
    avancerSecondes(etat, 4);
    expect(corbeau.bloqueur).toBe(-1);
    expect(corbeau.distance).toBeCloseTo(2 + 1.8 * 4, 4);
    expect(paysan.distance).toBeLessThan(corbeau.distance - 2);
    expect(etat.unites.every((u) => u.cible !== corbeau.id)).toBe(true);
  });

  it('la tour de tir le touche, pas l’artillerie', () => {
    const degatsSubis = (famille: 'tir' | 'artillerie'): number => {
      const etat = partieEssai();
      construireTour(etat, 1, famille);
      const corbeau = ennemiDonnees(etat, 'corbeau_noir', 10, { pv: 100000 });
      avancerSecondes(etat, 6);
      return corbeau.pvMax - corbeau.pv;
    };
    expect(degatsSubis('tir')).toBeGreaterThan(0);
    expect(degatsSubis('artillerie')).toBe(0);
  });
});

describe('Épouvantail : se relève une fois avec 40 % de ses PV', () => {
  it('tombe, reste intouchable à terre, puis repart ; la seconde mort est définitive', () => {
    const etat = partieEssai();
    const e = ennemiDonnees(etat, 'epouvantail', 10, { vitesse: ENNEMIS.epouvantail.vitesse });
    const avant = etat.aretes;
    infligerDegats(etat, e, 1e6, 'pur');
    expect(e.vivant).toBe(true);
    expect(e.pv).toBeCloseTo(e.pvMax * 0.4, 6);
    expect(e.invulnerable).toBe(enPas(1.5));
    expect(etat.aretes).toBe(avant);
    expect(etat.evenements).toContainEqual({ type: 'releve', ennemi: e.id, x: e.x, y: e.y, delai: 1.5 });

    // À terre : ni blessé, ni affecté, ni en mouvement.
    const pv = e.pv;
    expect(infligerDegats(etat, e, 50, 'pur')).toBe(0);
    appliquerEffet(etat, e, { type: 'ralentissement', chance: 1, duree: 5, valeur: 0.5 });
    expect(e.pv).toBe(pv);
    expect(e.effetsPas[EFFET.ralentissement]).toBe(0);
    const distance = e.distance;
    const vus = evenementsPendant(etat, 1);
    expect(e.distance).toBe(distance);
    vus.push(...evenementsPendant(etat, 1));
    expect(e.distance).toBeGreaterThan(distance);
    expect(vus).toContainEqual(expect.objectContaining({ type: 'emergence', ennemi: e.id }));

    // Seconde mort : définitive, prime versée.
    infligerDegats(etat, e, 1e6, 'pur');
    expect(e.vivant).toBe(false);
    expect(etat.aretes).toBe(avant + e.prime);
  });

  it('un coup mortel qui dépasse largement ses PV le relève quand même, une seule fois', () => {
    const etat = partieEssai();
    const e = ennemiDonnees(etat, 'epouvantail', 10);
    infligerDegats(etat, e, 5, 'pur');
    expect(e.releves).toBe(1);
    infligerDegats(etat, e, 1e9, 'pur');
    expect(e.releves).toBe(0);
    expect(e.pv).toBeCloseTo(e.pvMax * 0.4, 6);
  });
});

describe('Porteur de Torche : brûle les soldats au contact', () => {
  it('met le feu à l’unité qu’il frappe, des dégâts purs sur 3 s qui ne se cumulent pas', () => {
    const etat = partieAvecCaserne();
    const porteur = ennemiDonnees(etat, 'porteur_torche', 5, { degats: [1, 1], pv: 100000 });
    const vus = jusquA(etat, (e) => e.type === 'brulure', 5);
    const brulure = vus.find((e) => e.type === 'brulure');
    expect(brulure).toBeDefined();
    const id = brulure?.type === 'brulure' ? brulure.unite : -1;
    const unite = etat.unites.find((u) => u.id === id);
    expect(unite?.brulure).toBeGreaterThan(0);
    expect(unite?.brulure).toBeLessThanOrEqual(enPas(3));
    expect(unite?.brulureDegats).toBe(4);

    // Le porteur meurt : il ne reste que la brûlure.
    infligerDegats(etat, porteur, 1e9, 'pur');
    const restant = unite?.brulure ?? 0;
    const pv = unite?.pv ?? 0;
    avancerSecondes(etat, 4);
    expect(unite?.brulure).toBe(0);
    expect(pv - (unite?.pv ?? 0)).toBeCloseTo((restant * 4) / 30, 5);
  });
});

describe('Chasseur de Sorcières : armure moyenne, double dégâts contre le héros', () => {
  it('a 30 % d’armure', () => {
    const etat = partieEssai();
    const e = ennemiDonnees(etat, 'chasseur_sorcieres', 10, { pv: 100000 });
    expect(infligerDegats(etat, e, 100, 'physique')).toBeCloseTo(70, 6);
  });

  it('frappe le héros deux fois plus fort qu’un ennemi ordinaire de mêmes dégâts', () => {
    const perteDuHeros = (id: 'chasseur_sorcieres' | 'paysan_affame'): number => {
      const etat = partieEssai();
      const h = heros(etat);
      h.x = h.ancreX = 10.5;
      h.y = h.ancreY = 5;
      ennemiDonnees(etat, id, 10, { degats: [10, 10], cadence: 100, pv: 1e6, insensibleEtourdissement: true });
      avancerSecondes(etat, 2);
      return h.stats.pv - h.pv;
    };
    const ordinaire = perteDuHeros('paysan_affame');
    expect(ordinaire).toBeGreaterThan(0);
    expect(perteDuHeros('chasseur_sorcieres')).toBeCloseTo(2 * ordinaire, 6);
  });

  it('ne double pas ses dégâts contre un soldat', () => {
    const perteDuSoldat = (id: 'chasseur_sorcieres' | 'paysan_affame'): number => {
      const etat = partieAvecCaserne();
      ennemiDonnees(etat, id, 5, { degats: [10, 10], cadence: 100, pv: 1e6, insensibleEtourdissement: true });
      avancerSecondes(etat, 2);
      return etat.unites.filter((u) => u.genre === 'soldat').reduce((total, u) => total + (u.stats.pv - u.pv), 0);
    };
    expect(perteDuSoldat('chasseur_sorcieres')).toBeCloseTo(perteDuSoldat('paysan_affame'), 6);
  });
});

describe('Délateur : furtif', () => {
  it('une tour qui ne révèle pas ne le voit pas', () => {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    const d = ennemiDonnees(etat, 'delateur', 10, { pv: 100000 });
    avancerSecondes(etat, 5);
    expect(d.pv).toBe(d.pvMax);
  });

  it('les Guetteurs des Toits le révèlent et le touchent', () => {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir', 'A');
    const d = ennemiDonnees(etat, 'delateur', 10, { pv: 100000 });
    avancerSecondes(etat, 5);
    expect(d.pv).toBeLessThan(d.pvMax);
  });

  it('le Voile de Nuit le révèle aux tours de la zone', () => {
    const etat = partieEssai(configDe('plume'));
    construireTour(etat, 1, 'tir');
    const d = ennemiDonnees(etat, 'delateur', 10, { pv: 100000 });
    avancerSecondes(etat, DIEUX.plume.sorts[0].rechargeInitiale + 0.2);
    expect(d.pv).toBe(d.pvMax);
    expect(appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: true });
    avancerSecondes(etat, 3);
    expect(d.pv).toBeLessThan(d.pvMax);
  });
});

describe('Noyeur : entraîne un soldat bloquant sous l’eau', () => {
  it('le soldat meurt 3 s plus tard, sans pouvoir frapper entre-temps', () => {
    const etat = partieAvecCaserne();
    ennemiDonnees(etat, 'noyeur', 5, { pv: 1e6 });
    const vus = jusquA(etat, (e) => e.type === 'noyade', 5);
    const noyade = vus.find((e) => e.type === 'noyade');
    expect(noyade).toMatchObject({ type: 'noyade', delai: 3 });
    const id = noyade?.type === 'noyade' ? noyade.unite : -1;
    const unite = etat.unites.find((u) => u.id === id);
    // L'unité a déjà avancé d'un pas dans le pas où la noyade a commencé.
    expect(unite?.noyade).toBeGreaterThan(enPas(3) - 3);
    expect(unite?.noyade).toBeLessThanOrEqual(enPas(3));
    expect(unite?.genre).toBe('soldat');

    const suite = evenementsPendant(etat, 3.2);
    expect(suite).toContainEqual(expect.objectContaining({ type: 'mort_unite', unite: id }));
    expect(suite.some((e) => e.type === 'coup' && e.unite === id)).toBe(false);
  });

  it('si le noyeur meurt avant, le soldat est libéré', () => {
    const etat = partieAvecCaserne();
    const noyeur = ennemiDonnees(etat, 'noyeur', 5, { pv: 1e6 });
    const vus = jusquA(etat, (e) => e.type === 'noyade', 5);
    const noyade = vus.find((e) => e.type === 'noyade');
    const id = noyade?.type === 'noyade' ? noyade.unite : -1;
    avancerSecondes(etat, 1);
    infligerDegats(etat, noyeur, 1e9, 'pur');
    avancerSecondes(etat, 4);
    const unite = etat.unites.find((u) => u.id === id);
    expect(unite?.mort).toBe(false);
    expect(unite?.noyade).toBe(0);
  });

  it('n’entraîne pas le héros', () => {
    const etat = partieEssai();
    const h = heros(etat);
    h.x = h.ancreX = 5.5;
    h.y = h.ancreY = 5;
    ennemiDonnees(etat, 'noyeur', 5, { pv: 1e6 });
    const vus = evenementsPendant(etat, 5);
    expect(compter(vus, 'noyade')).toBe(0);
    expect(h.mort).toBe(false);
  });
});

describe('Pèlerin Voilé : résistance magique 60 %', () => {
  it('ne subit que 40 % des dégâts magiques', () => {
    const etat = partieEssai();
    const e = ennemiDonnees(etat, 'pelerin_voile', 10, { pv: 100000 });
    expect(infligerDegats(etat, e, 100, 'magique')).toBeCloseTo(40, 6);
    expect(infligerDegats(etat, e, 100, 'physique')).toBeCloseTo(100, 6);
  });
});

describe('Sangsue : drain', () => {
  it('retire 1 PV/s au soldat qu’elle touche et s’en soigne', () => {
    const etat = partieAvecCaserne();
    // Un seul soldat, qui ne blesse personne : seul le drain joue.
    etat.unites = etat.unites.filter((u) => u.genre !== 'soldat' || u.emplacement === 0);
    const soldat = etat.unites.find((u) => u.genre === 'soldat');
    if (!soldat) throw new Error('pas de soldat');
    soldat.stats = { ...soldat.stats, degats: [0, 0] };
    const sangsue = ennemiDonnees(etat, 'sangsue', 5, { degats: [0, 0], pv: 100 });
    sangsue.pv = sangsue.pvMax / 2;
    avancerSecondes(etat, 1);
    expect(sangsue.bloqueur).toBe(soldat.id);
    const pvSoldat = soldat.pv;
    const pvSangsue = sangsue.pv;
    avancerSecondes(etat, 3);
    expect(pvSoldat - soldat.pv).toBeCloseTo(3, 4);
    expect(sangsue.pv - pvSangsue).toBeCloseTo(3, 4);
  });

  it('ne dépasse pas ses PV maximaux', () => {
    const etat = partieAvecCaserne();
    const sangsue = ennemiDonnees(etat, 'sangsue', 5, { degats: [0, 0], pv: 100 });
    avancerSecondes(etat, 2);
    expect(sangsue.pv).toBeLessThanOrEqual(sangsue.pvMax);
  });
});

describe('Rat de Peste et Sangsue : essaims', () => {
  it('sont déclarés en essaim, le rat est très rapide et coûte 1 vie', () => {
    expect(ENNEMIS.rat_peste.pouvoirs?.essaim).toBe(8);
    expect(ENNEMIS.sangsue.pouvoirs?.essaim).toBe(6);
    expect(ENNEMIS.rat_peste.vitesse).toBeGreaterThan(2 * ENNEMIS.paysan_affame.vitesse);
    expect(ENNEMIS.rat_peste.coutVies).toBe(1);
  });
});

describe('Pestiféré : nuage toxique à sa mort', () => {
  it('blesse les soldats et le héros de la zone pendant 3 s, pas les ennemis', () => {
    const etat = partieAvecCaserne();
    const soldat = etat.unites.find((u) => u.genre === 'soldat' && u.emplacement === 0);
    const h = heros(etat);
    h.x = h.ancreX = 5.5;
    h.y = h.ancreY = 5.5;
    const autre = ennemiDonnees(etat, 'paysan_affame', 5.2, { pv: 100000, degats: [0, 0] });
    const pestifere = ennemiDonnees(etat, 'pestifere', 5.5);
    infligerDegats(etat, pestifere, 1e9, 'pur');
    step(etat);
    expect(etat.zones).toHaveLength(1);
    expect(etat.zones[0]).toMatchObject({ rayon: 1.5, degatsAllies: 6 });
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'zone', rayon: 1.5, duree: 3 }));

    const pvSoldat = soldat?.pv ?? 0;
    const pvHeros = h.pv;
    const pvAutre = autre.pv;
    avancerSecondes(etat, 3.5);
    expect(etat.zones).toHaveLength(0);
    expect(pvSoldat - (soldat?.pv ?? 0)).toBeCloseTo(18, 4);
    expect(pvHeros - h.pv).toBeCloseTo(18, 4);
    expect(autre.pv).toBeLessThanOrEqual(pvAutre);
  });

  it('épargne les unités hors du nuage', () => {
    const etat = partieEssai();
    const h = heros(etat);
    const pestifere = ennemiDonnees(etat, 'pestifere', 5);
    infligerDegats(etat, pestifere, 1e9, 'pur');
    avancerSecondes(etat, 4);
    expect(h.pv).toBe(h.stats.pv);
  });

  it('ne laisse rien s’il s’échappe au lieu de mourir', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'pestifere', 29.99, { vitesse: 0.9 });
    step(etat);
    expect(compter(etat.evenements, 'fuite')).toBe(1);
    expect(etat.zones).toHaveLength(0);
  });
});

describe('Médecin de Peste : soigne les ennemis proches', () => {
  it('rend 5 % des PV maximaux toutes les 4 s aux ennemis à portée, pas aux autres ni à lui-même', () => {
    const etat = partieEssai();
    const medecin = ennemiDonnees(etat, 'medecin_peste', 10);
    const proche = ennemiDonnees(etat, 'paysan_affame', 11, { pv: 1000 });
    const loin = ennemiDonnees(etat, 'paysan_affame', 20, { pv: 1000 });
    for (const e of [medecin, proche, loin]) e.pv = e.pvMax / 2;

    avancerSecondes(etat, 3.9);
    expect(proche.pv).toBeCloseTo(proche.pvMax / 2, 6);
    const vus = evenementsPendant(etat, 0.3);
    expect(proche.pv).toBeCloseTo(proche.pvMax * 0.55, 6);
    expect(vus).toContainEqual({ type: 'soin_ennemi', source: medecin.id, ennemi: proche.id, pv: proche.pvMax * 0.05 });
    expect(loin.pv).toBeCloseTo(loin.pvMax / 2, 6);
    expect(medecin.pv).toBeCloseTo(medecin.pvMax / 2, 6);

    avancerSecondes(etat, 4);
    expect(proche.pv).toBeCloseTo(proche.pvMax * 0.6, 6);
  });

  it('ne dépasse pas les PV maximaux et ne soigne pas un ennemi à terre', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'medecin_peste', 10);
    const presque = ennemiDonnees(etat, 'paysan_affame', 11, { pv: 1000 });
    presque.pv = presque.pvMax - 1;
    const aTerre = ennemiDonnees(etat, 'paysan_affame', 10.5, { pv: 1000 });
    aTerre.pv = aTerre.pvMax / 2;
    aTerre.invulnerable = 1000;
    avancerSecondes(etat, 4.2);
    expect(presque.pv).toBe(presque.pvMax);
    expect(aTerre.pv).toBeCloseTo(aTerre.pvMax / 2, 6);
  });
});
