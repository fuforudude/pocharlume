// Mécaniques des 14 ennemis des régions 6 à 10 (jalon 4), jouées avec les valeurs des données : un test par mécanique.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { TOURS } from '../data/tours';
import { avancerSecondes, compter, construireTour, ennemiDonnees, ennemiEssai, ennemisDe, evenementsPendant, heros, partieEssai } from './aides.test-utils';
import { infligerDegats } from './degats';
import { genererVague } from '../data/equilibrage';
import { ajouterEnnemi, mettreAJourEnnemis } from './ennemis';
import { EFFET, type Ennemi, type EtatPartie, type Unite } from './etat';
import { step } from './partie';
import { enPas } from './temps';
import { creerUnite, mourir } from './unites';

/** Une caserne sur la case d'essai 0 dont les soldats ont pris leur place. */
function partieAvecCaserne(): EtatPartie {
  const etat = partieEssai();
  construireTour(etat, 0, 'caserne');
  avancerSecondes(etat, 2);
  return etat;
}

/** Un soldat vivant de la partie. */
function unSoldat(etat: EtatPartie): Unite {
  const u = etat.unites.find((s) => s.genre === 'soldat' && !s.mort);
  if (!u) throw new Error('pas de soldat');
  return u;
}

/** Ennemi de test posé à `x` sur le chemin 0, immobile ou à la vitesse donnée, increvable et inoffensif. */
function passant(etat: EtatPartie, x: number, vitesse = 0): Ennemi {
  return ajouterEnnemi(etat, ennemiEssai({ pv: 1e9, vitesse, degats: [0, 0] }), 'paysan_affame', 0, x);
}

/** Distance parcourue en `secondes` par l'ennemi. */
function gain(etat: EtatPartie, e: Ennemi, secondes: number): number {
  const avant = e.distance;
  avancerSecondes(etat, secondes);
  return e.distance - avant;
}

describe('Fossoyeur : un soldat tué à 2 tuiles de lui met deux fois plus de temps à réapparaître', () => {
  function delaiDeReapparition(ecart: number): { delai: number; evenements: number } {
    const etat = partieAvecCaserne();
    const soldat = unSoldat(etat);
    ennemiDonnees(etat, 'fossoyeur', soldat.x + ecart, { pv: 1e9, degats: [0, 0] });
    etat.evenements = [];
    mourir(etat, soldat);
    const evenements = compter(etat.evenements, 'enterre');
    return { delai: soldat.reapparition, evenements };
  }

  it('le délai double à moins de 2 tuiles, et l’événement « enterre » est émis', () => {
    const normal = delaiDeReapparition(6);
    const enterre = delaiDeReapparition(1);
    expect(normal.evenements).toBe(0);
    expect(enterre.evenements).toBe(1);
    expect(normal.delai).toBeGreaterThan(0);
    expect(enterre.delai).toBe(normal.delai * 2);
  });

  it('le soldat enterré revient bien deux fois plus tard', () => {
    const attente = (ecart: number): number => {
      const etat = partieAvecCaserne();
      const soldat = unSoldat(etat);
      ennemiDonnees(etat, 'fossoyeur', soldat.x + ecart, { pv: 1e9, degats: [0, 0] });
      mourir(etat, soldat);
      let pas = 0;
      while (soldat.mort && pas < 5000) {
        step(etat);
        pas++;
      }
      return pas;
    };
    const normal = attente(8);
    const enterre = attente(1);
    expect(enterre).toBeGreaterThanOrEqual(normal * 2 - 2);
    expect(enterre).toBeLessThanOrEqual(normal * 2 + 2);
  });

  it('un Fossoyeur mort n’enterre plus', () => {
    const etat = partieAvecCaserne();
    const soldat = unSoldat(etat);
    const f = ennemiDonnees(etat, 'fossoyeur', soldat.x + 1, { pv: 1e9, degats: [0, 0] });
    f.vivant = false;
    mourir(etat, soldat);
    expect(soldat.reapparition).toBe(soldat.delaiReapparition);
  });
});

describe('Creux : se relève une fois avec 50 % de ses PV, sauf s’il meurt de dégâts magiques', () => {
  it('tombe d’un coup physique, se relève avec la moitié de ses PV, puis meurt pour de bon', () => {
    const etat = partieEssai();
    const c = ennemiDonnees(etat, 'creux', 10);
    const avant = etat.aretes;
    infligerDegats(etat, c, 1e6, 'physique');
    expect(c.vivant).toBe(true);
    expect(c.pv).toBeCloseTo(c.pvMax * 0.5, 6);
    expect(c.invulnerable).toBe(enPas(1.5));
    expect(etat.aretes).toBe(avant);
    avancerSecondes(etat, 2);
    infligerDegats(etat, c, 1e6, 'physique');
    expect(c.vivant).toBe(false);
  });

  it('un coup magique mortel le tue sans relèvement', () => {
    const etat = partieEssai();
    const c = ennemiDonnees(etat, 'creux', 10);
    infligerDegats(etat, c, 1e6, 'magique');
    expect(c.vivant).toBe(false);
    expect(c.releves).toBe(1);
    expect(etat.aretes).toBeGreaterThan(5000);
  });

  it('des dégâts purs (brûlure, poison) ne l’empêchent pas de se relever', () => {
    const etat = partieEssai();
    const c = ennemiDonnees(etat, 'creux', 10);
    infligerDegats(etat, c, 1e6, 'pur');
    expect(c.vivant).toBe(true);
  });

  it('un dégât sur la durée (poison, brûlure, saignement) qui l’achève ne l’empêche pas de se relever', () => {
    // Aucune tour ni aucun sort magique ne pose d'effet sur la durée (les effets viennent de tours physiques et de
    // l'Oracle, dont les dégâts sont purs) : les dégâts sur la durée restent donc purs et le Creux se relève.
    const etat = partieEssai();
    const c = ennemiDonnees(etat, 'creux', 10);
    c.pv = 0.001;
    c.effetsPas[EFFET.poison] = 30;
    c.effetsValeur[EFFET.poison] = 50;
    mettreAJourEnnemis(etat);
    expect(c.vivant).toBe(true);
    expect(c.releves).toBe(0);
  });

  it('un Creux déjà relevé meurt pour de bon même sous un coup physique', () => {
    const etat = partieEssai();
    const c = ennemiDonnees(etat, 'creux', 10);
    infligerDegats(etat, c, 1e6, 'physique');
    avancerSecondes(etat, 2);
    infligerDegats(etat, c, 1e6, 'physique');
    expect(c.vivant).toBe(false);
  });
});

describe('Chauve-Souris : volante, essaim par groupes de 5, rapide et fragile', () => {
  it('passe au-dessus des soldats sans s’arrêter', () => {
    const etat = partieAvecCaserne();
    const c = ennemiDonnees(etat, 'chauve_souris', 2, { pv: 1e9, vitesse: ENNEMIS.chauve_souris.vitesse });
    const sol = ajouterEnnemi(etat, ennemiEssai({ pv: 1e9, vitesse: ENNEMIS.chauve_souris.vitesse }), 'paysan_affame', 0, 2);
    avancerSecondes(etat, 4);
    expect(c.bloqueur).toBe(-1);
    expect(c.distance).toBeCloseTo(2 + ENNEMIS.chauve_souris.vitesse * 4, 4);
    expect(sol.distance).toBeLessThan(c.distance - 2);
  });

  it('le générateur de vagues la fait arriver par multiples de 5', () => {
    const vague = genererVague({ niveau: 60, vague: 5, ennemis: [['chauve_souris', ENNEMIS.chauve_souris]], graine: 7, chemins: 2 });
    expect(vague.paquets.length).toBeGreaterThan(0);
    for (const p of vague.paquets) expect(p.nombre % 5).toBe(0);
  });

  it('est fragile et rapide par rapport à un ennemi ordinaire', () => {
    expect(ENNEMIS.chauve_souris.pv).toBeLessThan(ENNEMIS.mendiant.pv);
    expect(ENNEMIS.chauve_souris.vitesse).toBeGreaterThan(ENNEMIS.chien_errant.vitesse * 0.8);
  });
});

describe('Fantassin : armure 60 %', () => {
  it('ne subit que 40 % des dégâts physiques', () => {
    const etat = partieEssai();
    const f = ennemiDonnees(etat, 'fantassin', 10);
    infligerDegats(etat, f, 100, 'physique');
    expect(f.pvMax - f.pv).toBeCloseTo(40, 6);
  });
});

describe('Porte-Bannière : +25 % de vitesse aux ennemis à 2 tuiles, non cumulable', () => {
  const VITESSE = 1;

  it('un ennemi à portée de l’aura va 25 % plus vite', () => {
    const sans = partieEssai();
    const temoin = passant(sans, 10, VITESSE);
    const avec = partieEssai();
    ennemiDonnees(avec, 'porte_banniere', 10.5);
    const allie = passant(avec, 10, VITESSE);
    expect(gain(avec, allie, 1)).toBeCloseTo(gain(sans, temoin, 1) * 1.25, 3);
  });

  it('deux porte-bannières ne cumulent pas leurs auras', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'porte_banniere', 10.5);
    ennemiDonnees(etat, 'porte_banniere', 10.7);
    const allie = passant(etat, 10, VITESSE);
    expect(gain(etat, allie, 1)).toBeCloseTo(1.25, 3);
  });

  it('hors des 2 tuiles, aucun bonus ; le porteur lui-même n’en profite pas', () => {
    const etat = partieEssai();
    const porteur = ennemiDonnees(etat, 'porte_banniere', 10, { vitesse: VITESSE });
    const loin = passant(etat, 14, VITESSE);
    expect(porteur.bonusVitesse).toBe(0);
    step(etat);
    expect(loin.bonusVitesse).toBe(0);
    expect(gain(etat, porteur, 1)).toBeCloseTo(1, 3);
  });

  it('un porte-bannière mort n’a plus d’aura', () => {
    const etat = partieEssai();
    const porteur = ennemiDonnees(etat, 'porte_banniere', 10.5);
    const allie = passant(etat, 10, VITESSE);
    step(etat);
    expect(allie.bonusVitesse).toBe(0.25);
    infligerDegats(etat, porteur, 1e9, 'pur');
    step(etat);
    expect(allie.bonusVitesse).toBe(0);
  });
});

describe('Cavalier : renverse le premier soldat qui le bloque (étourdi 2 s) et passe', () => {
  /** Avance pas à pas jusqu'au renversement ; rend la distance du cavalier avant et après ce pas. */
  function jusquAuRenversement(etat: EtatPartie, cavalier: Ennemi): { avant: number; apres: number } | null {
    for (let i = 0; i < 30 * 12; i++) {
      const avant = cavalier.distance;
      step(etat);
      if (etat.evenements.some((e) => e.type === 'renversement')) return { avant, apres: cavalier.distance };
    }
    return null;
  }

  it('étourdit le soldat qui le bloque 2 s, le lâche et continue sa route dans le même pas', () => {
    const etat = partieAvecCaserne();
    const cavalier = ennemiDonnees(etat, 'cavalier', 1, { vitesse: ENNEMIS.cavalier.vitesse, pv: 1e9, degats: [0, 0] });
    const mouvement = jusquAuRenversement(etat, cavalier);
    expect(mouvement).not.toBeNull();
    expect(mouvement?.apres).toBeGreaterThan(mouvement?.avant ?? Infinity);
    const evenement = etat.evenements.find((e) => e.type === 'renversement');
    if (evenement?.type !== 'renversement') throw new Error('événement manquant');
    const soldat = etat.unites.find((u) => u.id === evenement.unite);
    expect(soldat?.etourdi).toBeGreaterThanOrEqual(enPas(2) - 1);
    expect(soldat?.etourdi).toBeLessThanOrEqual(enPas(2));
    expect(soldat?.bloques).toBe(0);
    // Le soldat renversé ne le retient plus (un autre soldat peut le bloquer ensuite).
    expect(cavalier.bloqueur).not.toBe(evenement.unite);
    expect(cavalier.renversements).toBe(0);
  });

  it('un soldat étourdi ne frappe ni ne bloque, puis se réveille', () => {
    const etat = partieAvecCaserne();
    const cavalier = ennemiDonnees(etat, 'cavalier', 1, { vitesse: ENNEMIS.cavalier.vitesse, pv: 1e9, degats: [0, 0] });
    jusquAuRenversement(etat, cavalier);
    const evenement = etat.evenements.find((e) => e.type === 'renversement');
    if (evenement?.type !== 'renversement') throw new Error('événement manquant');
    const soldat = etat.unites.find((u) => u.id === evenement.unite);
    if (!soldat) throw new Error('soldat introuvable');
    const x = soldat.x;
    const vus = evenementsPendant(etat, 1.8);
    expect(vus.some((e) => e.type === 'coup' && e.unite === soldat.id)).toBe(false);
    expect(soldat.x).toBe(x);
    expect(soldat.etourdi).toBeGreaterThan(0);
    avancerSecondes(etat, 0.5);
    expect(soldat.etourdi).toBe(0);
  });

  it('un seul renversement : les soldats suivants le bloquent normalement', () => {
    const etat = partieAvecCaserne();
    ennemiDonnees(etat, 'cavalier', 1, { vitesse: ENNEMIS.cavalier.vitesse, pv: 1e9, degats: [0, 0] });
    const vus = evenementsPendant(etat, 12);
    expect(compter(vus, 'renversement')).toBe(1);
  });

  it('ne renverse pas le héros : il le bloque comme n’importe quel ennemi', () => {
    const etat = partieEssai();
    const h = heros(etat);
    h.x = h.ancreX = 10;
    h.y = h.ancreY = 5;
    const cavalier = ennemiDonnees(etat, 'cavalier', 8, { vitesse: ENNEMIS.cavalier.vitesse, pv: 1e9, degats: [0, 0] });
    const vus = evenementsPendant(etat, 6);
    expect(compter(vus, 'renversement')).toBe(0);
    expect(h.etourdi).toBe(0);
    expect(cavalier.renversements).toBe(1);
    expect(cavalier.distance).toBeLessThan(11);
  });
});

describe('Flagellant : sous 50 % de PV, +50 % de vitesse et de dégâts', () => {
  it('va 50 % plus vite sous la moitié de ses PV', () => {
    const etat = partieEssai();
    const f = ennemiDonnees(etat, 'flagellant', 5, { vitesse: 1, pv: 1e6, degats: [0, 0] });
    expect(gain(etat, f, 1)).toBeCloseTo(1, 3);
    f.pv = f.pvMax * 0.5;
    expect(gain(etat, f, 1)).toBeCloseTo(1.5, 3);
    f.pv = f.pvMax * 0.51;
    expect(gain(etat, f, 1)).toBeCloseTo(1, 3);
  });

  it('frappe 50 % plus fort sous la moitié de ses PV', () => {
    const premierCoup = (rage: boolean): number => {
      const etat = partieAvecCaserne();
      const soldat = unSoldat(etat);
      const f = ennemiDonnees(etat, 'flagellant', soldat.x - 0.3, { pv: 1e6, degats: [10, 10] });
      if (rage) f.pv = f.pvMax * 0.4;
      const avant = etat.unites.reduce((somme, u) => somme + u.pv, 0);
      for (let i = 0; i < 90; i++) {
        step(etat);
        if (etat.evenements.some((e) => e.type === 'coup_ennemi')) break;
      }
      return avant - etat.unites.reduce((somme, u) => somme + u.pv, 0);
    };
    const normal = premierCoup(false);
    const enrage = premierCoup(true);
    expect(normal).toBeGreaterThan(0);
    expect(enrage).toBeCloseTo(normal * 1.5, 3);
  });
});

describe('Inquisiteur : fige la tour la plus proche à 2,5 tuiles pendant 3 s, toutes les 8 s', () => {
  /** Tour de tir sur la case 1 (11, 7), une autre sur la case 3 (19, 7) ; l'inquisiteur à 2,15 tuiles de la première. */
  function partieInquisiteur(): { etat: EtatPartie; proche: number; loin: number } {
    const etat = partieEssai();
    construireTour(etat, 1, 'tir');
    construireTour(etat, 3, 'tir');
    ennemiDonnees(etat, 'inquisiteur', 12.2, { pv: 1e9, degats: [0, 0] });
    const [proche, loin] = etat.tours;
    if (!proche || !loin) throw new Error('tours manquantes');
    return { etat, proche: proche.id, loin: loin.id };
  }

  function tour(etat: EtatPartie, id: number) {
    const t = etat.tours.find((autre) => autre.id === id);
    if (!t) throw new Error('tour introuvable');
    return t;
  }

  it('toutes les 8 s, gèle 3 s la tour à portée et pas celle qui est trop loin', () => {
    const { etat, proche, loin } = partieInquisiteur();
    avancerSecondes(etat, 7.8);
    expect(tour(etat, proche).gel).toBe(0);
    const vus = evenementsPendant(etat, 0.4);
    expect(tour(etat, proche).gel).toBeGreaterThan(enPas(3) - 12);
    expect(tour(etat, proche).gel).toBeLessThanOrEqual(enPas(3));
    expect(tour(etat, loin).gel).toBe(0);
    expect(vus.some((e) => e.type === 'tour_gelee' && e.tour === proche && e.duree === 3)).toBe(true);
  });

  it('une tour gelée ne tire plus, puis reprend', () => {
    const { etat, proche } = partieInquisiteur();
    avancerSecondes(etat, 8.2);
    const t = tour(etat, proche);
    expect(t.gel).toBeGreaterThan(0);
    const pendant = evenementsPendant(etat, 2.5).filter((e) => e.type === 'tir' && e.tour === proche);
    expect(pendant).toHaveLength(0);
    const apres = evenementsPendant(etat, 1.5).filter((e) => e.type === 'tir' && e.tour === proche);
    expect(apres.length).toBeGreaterThan(0);
    expect(t.gel).toBe(0);
  });

  it('sans tour à 2,5 tuiles, il réessaie aussitôt qu’une tour est à portée au lieu d’attendre 8 s de plus', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'inquisiteur', 12.2, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 12);
    construireTour(etat, 1, 'tir');
    step(etat);
    step(etat);
    expect(etat.tours[0]?.gel).toBeGreaterThan(0);
  });
});

describe('Exorciste : toutes les 6 s, tue une invocation à 2 tuiles ou étourdit le héros 2 s', () => {
  /** Une invocation (spectre) posée près de l'exorciste. */
  function spectre(etat: EtatPartie, x: number): Unite {
    const stats = TOURS.caserne.niveaux[0].soldats;
    if (!stats) throw new Error('stats de soldat manquantes');
    return creerUnite(etat, { genre: 'spectre', tour: -1, emplacement: 0, x, y: 5, ancreX: x, ancreY: 5, stats, delaiReapparition: -1, duree: -1, zone: null });
  }

  it('bannit une invocation à moins de 2 tuiles, pas celle qui est plus loin', () => {
    const etat = partieEssai();
    ennemiDonnees(etat, 'exorciste', 10, { pv: 1e9, degats: [0, 0] });
    const proche = spectre(etat, 11.5);
    const loin = spectre(etat, 14);
    avancerSecondes(etat, 5.8);
    expect(proche.mort).toBe(false);
    const vus = evenementsPendant(etat, 0.5);
    expect(proche.mort).toBe(true);
    expect(loin.mort).toBe(false);
    expect(vus.some((e) => e.type === 'bannissement' && e.unite === proche.id)).toBe(true);
  });

  it('sans invocation, étourdit le héros à portée 2 s : il ne bouge plus', () => {
    const etat = partieEssai();
    const h = heros(etat);
    h.x = h.ancreX = 11;
    h.y = h.ancreY = 5;
    ennemiDonnees(etat, 'exorciste', 10, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 6.2);
    expect(h.etourdi).toBeGreaterThan(enPas(2) - 8);
    h.ancreX = 12;
    h.enDeplacement = true;
    const x = h.x;
    avancerSecondes(etat, 1);
    expect(h.x).toBe(x);
    avancerSecondes(etat, 1.5);
    expect(h.etourdi).toBe(0);
  });

  it('préfère l’invocation au héros quand les deux sont à portée', () => {
    const etat = partieEssai();
    const h = heros(etat);
    h.x = h.ancreX = 11;
    h.y = h.ancreY = 5;
    ennemiDonnees(etat, 'exorciste', 10, { pv: 1e9, degats: [0, 0] });
    const s = spectre(etat, 10.8);
    avancerSecondes(etat, 6.2);
    expect(s.mort).toBe(true);
    expect(h.etourdi).toBe(0);
  });

  it('personne à portée : il réessaie au pas suivant dès que le héros approche', () => {
    const etat = partieEssai();
    const h = heros(etat);
    ennemiDonnees(etat, 'exorciste', 10, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 9);
    expect(h.etourdi).toBe(0);
    h.x = h.ancreX = 11;
    h.y = h.ancreY = 5;
    avancerSecondes(etat, 0.2);
    expect(h.etourdi).toBeGreaterThan(0);
  });

  it('a 30 % de résistance magique', () => {
    const etat = partieEssai();
    const e = ennemiDonnees(etat, 'exorciste', 10);
    infligerDegats(etat, e, 100, 'magique');
    expect(e.pvMax - e.pv).toBeCloseTo(70, 6);
  });
});

describe('Garde Royal : armure 90 %, lent', () => {
  it('ne subit que 10 % des dégâts physiques et avance moins vite que tous les ennemis courants', () => {
    const etat = partieEssai();
    const g = ennemiDonnees(etat, 'garde_royal', 10);
    infligerDegats(etat, g, 100, 'physique');
    expect(g.pvMax - g.pv).toBeCloseTo(10, 6);
    for (const [id, def] of Object.entries(ENNEMIS)) if (!def.boss && id !== 'garde_royal') expect(def.vitesse, id).toBeGreaterThanOrEqual(ENNEMIS.garde_royal.vitesse);
  });
});

describe('Arbalétrier d’Élite : tire sur les soldats et le héros à 3,5 tuiles', () => {
  it('blesse le héros à 3,3 tuiles sans être bloqué, mais pas à 3,9', () => {
    const tirs = (x: number): { coups: number; bloque: boolean } => {
      const etat = partieEssai();
      const h = heros(etat);
      h.x = h.ancreX = 10;
      h.y = h.ancreY = 5;
      const a = ennemiDonnees(etat, 'arbaletrier_elite', x);
      const vus = evenementsPendant(etat, 2);
      return { coups: vus.filter((e) => e.type === 'coup_ennemi' && e.distance && e.unite === h.id).length, bloque: a.bloqueur !== -1 };
    };
    expect(tirs(13.3).coups).toBeGreaterThanOrEqual(1);
    expect(tirs(13.3).bloque).toBe(false);
    expect(tirs(13.9).coups).toBe(0);
  });

  it('tire aussi sur un soldat', () => {
    const etat = partieAvecCaserne();
    const soldat = unSoldat(etat);
    ennemiDonnees(etat, 'arbaletrier_elite', soldat.x + 3.2);
    const vus = evenementsPendant(etat, 2);
    expect(vus.some((e) => e.type === 'coup_ennemi' && e.distance)).toBe(true);
  });
});

describe('Chevalier : rapide, armure 60 %, résistance magique 30 %', () => {
  it('encaisse 40 % du physique et 70 % du magique, et va plus vite que le Fantassin', () => {
    const etat = partieEssai();
    const c = ennemiDonnees(etat, 'chevalier', 10);
    infligerDegats(etat, c, 100, 'physique');
    expect(c.pvMax - c.pv).toBeCloseTo(40, 6);
    c.pv = c.pvMax;
    infligerDegats(etat, c, 100, 'magique');
    expect(c.pvMax - c.pv).toBeCloseTo(70, 6);
    expect(ENNEMIS.chevalier.vitesse).toBeGreaterThan(ENNEMIS.fantassin.vitesse * 1.5);
  });
});

describe('Acolyte de Cendre : résistance magique 30 %, invoque 1 Creux toutes les 12 s (réglage du jalon 4)', () => {
  it('appelle 1 Creux à chaque salve, derrière lui sur son chemin', () => {
    const etat = partieEssai();
    const a = ennemiDonnees(etat, 'acolyte_cendre', 3, { pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 11.6);
    expect(ennemisDe(etat, 'creux')).toHaveLength(0);
    const vus = evenementsPendant(etat, 0.6);
    expect(vus).toContainEqual(expect.objectContaining({ type: 'appel', ennemi: a.id, typeEnnemi: 'creux', nombre: 1 }));
    const creux = ennemisDe(etat, 'creux');
    expect(creux).toHaveLength(1);
    for (const c of creux) expect(c.distance).toBeLessThanOrEqual(3.5);
    expect(Math.max(...creux.map((c) => c.distance))).toBeGreaterThan(2.5);
    avancerSecondes(etat, 12.6);
    expect(ennemisDe(etat, 'creux')).toHaveLength(2);
  });

  it('résiste à 30 % de la magie', () => {
    const etat = partieEssai();
    const a = ennemiDonnees(etat, 'acolyte_cendre', 10);
    infligerDegats(etat, a, 100, 'magique');
    expect(a.pvMax - a.pv).toBeCloseTo(70, 6);
  });
});

describe('Ange de Cendre : volant, armure 30 %, résistance magique 60 %', () => {
  it('encaisse 70 % du physique et 40 % du magique', () => {
    const etat = partieEssai();
    const a = ennemiDonnees(etat, 'ange_cendre', 10);
    infligerDegats(etat, a, 100, 'physique');
    expect(a.pvMax - a.pv).toBeCloseTo(70, 6);
    a.pv = a.pvMax;
    infligerDegats(etat, a, 100, 'magique');
    expect(a.pvMax - a.pv).toBeCloseTo(40, 6);
  });

  it('vole : ni bloqué par un soldat, ni touché par l’artillerie', () => {
    const etat = partieAvecCaserne();
    const a = ennemiDonnees(etat, 'ange_cendre', 2, { pv: 1e9, vitesse: ENNEMIS.ange_cendre.vitesse });
    avancerSecondes(etat, 3);
    expect(a.bloqueur).toBe(-1);
    expect(a.distance).toBeCloseTo(2 + ENNEMIS.ange_cendre.vitesse * 3, 4);
    const etat2 = partieEssai();
    construireTour(etat2, 1, 'artillerie');
    const cible = ennemiDonnees(etat2, 'ange_cendre', 10, { pv: 1e9 });
    avancerSecondes(etat2, 6);
    expect(cible.pv).toBe(cible.pvMax);
  });
});
