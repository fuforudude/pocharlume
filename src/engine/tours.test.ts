import { describe, expect, it } from 'vitest';
import { DIEUX } from '../data/dieux';
import { REGLES } from '../data/regles';
import { TOURS } from '../data/tours';
import { CONFIG, avancerPas, avancerSecondes, distance, ennemiEssai, niveauEssai } from './aides.test-utils';
import type { DefEnnemi } from './definitions';
import { ajouterEnnemi } from './ennemis';
import { EFFET, type EtatPartie } from './etat';
import type { Evenement } from './evenements';
import { ajusterMontant, partEntiere } from './argent';
import { appliquerEffet } from './degats';
import { appliquerAction, creerPartie, step, valeurRevente } from './partie';
import { blesserUnite } from './unites';

function partie(aretes = 5000): EtatPartie {
  return creerPartie(niveauEssai(undefined, aretes), CONFIG);
}

function construire(etat: EtatPartie, socle: number, tour: 'caserne' | 'tir' | 'magie' | 'artillerie' | 'divine', voie?: 'A' | 'B'): void {
  expect(appliquerAction(etat, { type: 'construire', socle, tour })).toEqual({ ok: true });
  if (voie) {
    appliquerAction(etat, { type: 'ameliorer', socle });
    appliquerAction(etat, { type: 'ameliorer', socle });
    expect(appliquerAction(etat, { type: 'specialiser', socle, voie })).toEqual({ ok: true });
  }
}

/** Ennemi immobile et increvable posé sur le chemin 0 à l'abscisse donnée. */
function cible(etat: EtatPartie, x: number, surcharges: Partial<DefEnnemi> = {}) {
  return ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 0, degats: [0, 0], ...surcharges }), 'paysan_affame', 0, x);
}

function evenementsPendant(etat: EtatPartie, secondes: number): Evenement[] {
  const vus: Evenement[] = [];
  for (let i = 0; i < secondes * 30; i++) {
    step(etat);
    vus.push(...etat.evenements);
  }
  return vus;
}

describe('construction, amélioration, revente', () => {
  it('construit sur un socle libre et paie le prix', () => {
    const etat = partie();
    construire(etat, 0, 'tir');
    expect(etat.aretes).toBe(5000 - TOURS.tir.niveaux[0].cout);
    expect(etat.tours).toHaveLength(1);
    expect(etat.tours[0]).toMatchObject({ socle: 0, famille: 'tir', niveau: 1, voie: null, x: 5, y: 7 });
    expect(etat.evenements).toContainEqual({ type: 'construction', tour: etat.tours[0]?.id, socle: 0, famille: 'tir' });
  });

  it('refuse un socle occupé, inconnu, ou sans assez d’arêtes', () => {
    const etat = partie(100);
    construire(etat, 0, 'tir');
    expect(appliquerAction(etat, { type: 'construire', socle: 0, tour: 'tir' })).toEqual({ ok: false, raison: 'socle_occupe' });
    expect(appliquerAction(etat, { type: 'construire', socle: 9, tour: 'tir' })).toEqual({ ok: false, raison: 'socle_inconnu' });
    expect(appliquerAction(etat, { type: 'construire', socle: 1, tour: 'tir' })).toEqual({ ok: false, raison: 'aretes_insuffisantes' });
    expect(etat.aretes).toBe(30);
  });

  it('améliore jusqu’au niveau 3, puis exige une spécialisation, puis s’arrête', () => {
    const etat = partie();
    construire(etat, 0, 'tir');
    expect(appliquerAction(etat, { type: 'specialiser', socle: 0, voie: 'A' })).toEqual({ ok: false, raison: 'specialisation_impossible' });
    expect(appliquerAction(etat, { type: 'ameliorer', socle: 0 })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'ameliorer', socle: 0 })).toEqual({ ok: true });
    expect(etat.tours[0]?.niveau).toBe(3);
    expect(appliquerAction(etat, { type: 'ameliorer', socle: 0 })).toEqual({ ok: false, raison: 'specialisation_requise' });
    expect(appliquerAction(etat, { type: 'specialiser', socle: 0, voie: 'B' })).toEqual({ ok: true });
    expect(etat.tours[0]).toMatchObject({ niveau: 4, voie: 'B' });
    expect(etat.tours[0]?.stats.nom).toBe(TOURS.tir.specialisations.B.nom);
    expect(appliquerAction(etat, { type: 'ameliorer', socle: 0 })).toEqual({ ok: false, raison: 'niveau_max' });
    expect(appliquerAction(etat, { type: 'specialiser', socle: 0, voie: 'A' })).toEqual({ ok: false, raison: 'specialisation_impossible' });
    expect(appliquerAction(etat, { type: 'ameliorer', socle: 1 })).toEqual({ ok: false, raison: 'socle_vide' });
  });

  it('revend à 70 % du coût cumulé et libère le socle', () => {
    const etat = partie();
    construire(etat, 0, 'tir', 'A');
    const t = TOURS.tir;
    const cumul = t.niveaux[0].cout + t.niveaux[1].cout + t.niveaux[2].cout + t.specialisations.A.cout;
    expect(etat.tours[0]?.coutCumule).toBe(cumul);
    const avant = etat.aretes;
    expect(appliquerAction(etat, { type: 'vendre', socle: 0 })).toEqual({ ok: true });
    expect(etat.aretes).toBe(avant + Math.floor((cumul * REGLES.tauxRevente) / 100));
    expect(etat.tours).toHaveLength(0);
    construire(etat, 0, 'magie');
  });

  it('revend sans erreur d’arrondi : 180 donne 126, 340 donne 238', () => {
    const etat = partie();
    construire(etat, 0, 'caserne');
    appliquerAction(etat, { type: 'ameliorer', socle: 0 });
    expect(etat.tours[0]?.coutCumule).toBe(180);
    expect(valeurRevente(etat, 0)).toBe(126);
    appliquerAction(etat, { type: 'ameliorer', socle: 0 });
    expect(etat.tours[0]?.coutCumule).toBe(340);
    expect(valeurRevente(etat, 0)).toBe(238);
    const avant = etat.aretes;
    appliquerAction(etat, { type: 'vendre', socle: 0 });
    expect(etat.aretes).toBe(avant + 238);
  });

  it('ajuste les montants par un pourcentage sans erreur d’arrondi', () => {
    expect(ajusterMontant(70, 0.85)).toBe(60);
    expect(ajusterMontant(15, 0.9)).toBe(14);
    expect(ajusterMontant(5, 1.1)).toBe(6);
    expect(ajusterMontant(260, 1.15)).toBe(299);
    expect(partEntiere(180, 70)).toBe(126);
    expect(partEntiere(340, 70)).toBe(238);
  });

  it('retire les soldats d’une caserne vendue et libère leurs ennemis', () => {
    const etat = partie();
    construire(etat, 1, 'caserne');
    avancerSecondes(etat, 2);
    const e = ajouterEnnemi(etat, ennemiEssai({ pv: 100000, degats: [0, 0] }), 'paysan_affame', 0, 8);
    avancerSecondes(etat, 3);
    expect(e.bloqueur).not.toBe(-1);
    appliquerAction(etat, { type: 'vendre', socle: 1 });
    expect(etat.unites.filter((u) => u.genre === 'soldat')).toHaveLength(0);
    expect(e.bloqueur).toBe(-1);
  });
});

describe('tirs et projectiles', () => {
  it('vise le premier ennemi sur le chemin', () => {
    const etat = partie();
    construire(etat, 0, 'tir');
    cible(etat, 4);
    const devant = cible(etat, 6);
    step(etat);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'tir', cible: devant.id }));
  });

  it('touche après le temps de vol du projectile', () => {
    const etat = partie();
    construire(etat, 0, 'tir');
    const e = cible(etat, 6);
    step(etat);
    expect(etat.projectiles).toHaveLength(1);
    expect(e.pv).toBe(e.pvMax);
    avancerPas(etat, 10);
    expect(etat.projectiles).toHaveLength(0);
    expect(e.pv).toBeLessThan(e.pvMax);
  });

  it('ne tire pas hors de portée', () => {
    const etat = partie();
    construire(etat, 0, 'tir');
    cible(etat, 12);
    avancerSecondes(etat, 2);
    expect(etat.projectiles).toHaveLength(0);
  });

  it('l’artillerie frappe une zone à l’impact', () => {
    const etat = partie();
    construire(etat, 1, 'artillerie');
    const groupe = [cible(etat, 9.8), cible(etat, 10), cible(etat, 10.2)];
    avancerSecondes(etat, 1.5);
    for (const e of groupe) expect(e.pv).toBeLessThan(e.pvMax);
  });

  it('l’artillerie ignore les volants, le tir les touche', () => {
    const etat = partie();
    construire(etat, 1, 'artillerie');
    const volant = cible(etat, 10, { volant: true });
    avancerSecondes(etat, 4);
    expect(volant.pv).toBe(volant.pvMax);
    construire(etat, 0, 'tir');
    const proche = cible(etat, 6, { volant: true });
    avancerSecondes(etat, 1);
    expect(proche.pv).toBeLessThan(proche.pvMax);
  });

  it('les furtifs ne sont vus que des tours qui révèlent, et le poison les révèle', () => {
    const etat = partie();
    construire(etat, 0, 'tir');
    const furtif = cible(etat, 6, { furtif: true });
    avancerSecondes(etat, 2);
    expect(furtif.pv).toBe(furtif.pvMax);
    appliquerAction(etat, { type: 'ameliorer', socle: 0 });
    appliquerAction(etat, { type: 'ameliorer', socle: 0 });
    appliquerAction(etat, { type: 'specialiser', socle: 0, voie: 'A' });
    avancerSecondes(etat, 1);
    expect(furtif.pv).toBeLessThan(furtif.pvMax);
    expect(furtif.effetsPas[EFFET.poison]).toBeGreaterThan(0);
  });
});

describe('furtifs, zones et chaînes', () => {
  it('une zone d’artillerie ne touche pas un furtif non révélé, mais touche un furtif empoisonné', () => {
    const etat = partie();
    construire(etat, 1, 'artillerie');
    const visible = cible(etat, 10);
    const furtif = cible(etat, 10.1, { furtif: true });
    const empoisonne = cible(etat, 9.9, { furtif: true });
    appliquerEffet(etat, empoisonne, { type: 'poison', chance: 1, duree: 60, valeur: 0 });
    avancerSecondes(etat, 1.5);
    expect(visible.pv).toBeLessThan(visible.pvMax);
    expect(empoisonne.pv).toBeLessThan(empoisonne.pvMax);
    expect(furtif.pv).toBe(furtif.pvMax);
  });

  it('une chaîne ne saute pas sur un furtif non révélé', () => {
    const etat = partie();
    construire(etat, 1, 'artillerie', 'B');
    const premier = cible(etat, 11);
    const furtif = cible(etat, 10, { furtif: true });
    const suivant = cible(etat, 9.8);
    avancerSecondes(etat, 1);
    expect(premier.pv).toBeLessThan(premier.pvMax);
    expect(furtif.pv).toBe(furtif.pvMax);
    expect(furtif.effetsPas[EFFET.ralentissement]).toBe(0);
    expect(suivant.pv).toBeLessThan(suivant.pvMax);
  });

  it('un sort de zone ne touche pas un furtif non révélé', () => {
    const etat = partie();
    avancerSecondes(etat, DIEUX.charlie.sorts[0].rechargeInitiale);
    const visible = cible(etat, 10);
    const furtif = cible(etat, 10.2, { furtif: true });
    appliquerAction(etat, { type: 'lancerSort', emplacement: 0, x: 10, y: 5 });
    expect(visible.pv).toBeLessThan(visible.pvMax);
    expect(furtif.pv).toBe(furtif.pvMax);
  });
});

describe('spécialisations', () => {
  it('Arbalétriers du Beffroi : longue portée et coups critiques', () => {
    const etat = partie();
    construire(etat, 0, 'tir', 'B');
    cible(etat, 10);
    const tirs = evenementsPendant(etat, 60).filter((ev) => ev.type === 'tir');
    expect(tirs.length).toBeGreaterThan(30);
    expect(tirs.some((ev) => ev.critique)).toBe(true);
    expect(tirs.some((ev) => !ev.critique)).toBe(true);
  });

  it('Oracle de la Braise : rayon instantané en dégâts purs', () => {
    const etat = partie();
    construire(etat, 0, 'magie', 'A');
    const e = cible(etat, 6, { armure: 0.9, resistance: 0.9 });
    step(etat);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'tir', cible: e.id, projectile: -1 }));
    const perdu = e.pvMax - e.pv;
    const [min, max] = TOURS.magie.specialisations.A.degats;
    expect(perdu).toBeGreaterThanOrEqual(min);
    expect(perdu).toBeLessThanOrEqual(max);
  });

  it('Nécromancien des Neuf Vies : relève en spectre un chat tombé à portée', () => {
    const etat = partie();
    construire(etat, 0, 'caserne');
    construire(etat, 5, 'magie', 'B');
    avancerSecondes(etat, 2);
    const soldat = etat.unites.find((u) => u.genre === 'soldat');
    if (!soldat) throw new Error('pas de soldat');
    blesserUnite(etat, soldat, 100000, 'pur');
    const spectres = etat.unites.filter((u) => u.genre === 'spectre');
    expect(spectres).toHaveLength(1);
    expect(spectres[0]?.tour).toBe(etat.tours[1]?.id);
    avancerSecondes(etat, TOURS.magie.specialisations.B.spectres?.duree ?? 0);
    expect(etat.unites.filter((u) => u.genre === 'spectre')).toHaveLength(0);
  });

  it('Mortier de Soufre : brûle dans une grande zone', () => {
    const etat = partie();
    construire(etat, 1, 'artillerie', 'A');
    const groupe = [cible(etat, 9), cible(etat, 10.2)];
    avancerSecondes(etat, 1.5);
    for (const e of groupe) {
      expect(e.pv).toBeLessThan(e.pvMax);
      expect(e.effetsPas[EFFET.brulure]).toBeGreaterThan(0);
    }
  });

  it('Baliste à Chaînes : enchaîne les ennemis proches et les ralentit', () => {
    const etat = partie();
    construire(etat, 1, 'artillerie', 'B');
    const ligne = [cible(etat, 9), cible(etat, 10), cible(etat, 11)];
    avancerSecondes(etat, 1);
    for (const e of ligne) {
      expect(e.pv).toBeLessThan(e.pvMax);
      expect(e.effetsPas[EFFET.ralentissement]).toBeGreaterThan(0);
    }
  });

  it('Garde du Cloître : un soldat bloque plusieurs ennemis (provocation)', () => {
    const etat = partie();
    construire(etat, 1, 'caserne', 'A');
    avancerSecondes(etat, 2);
    const vague = [6, 6.5, 7, 7.5, 8, 8.5].map((x) =>
      ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 0.9, degats: [0, 0] }), 'paysan_affame', 0, x));
    avancerSecondes(etat, 6);
    expect(vague.filter((e) => e.bloqueur !== -1).length).toBeGreaterThan(3);
    for (const u of etat.unites) expect(u.bloques).toBeLessThanOrEqual(u.stats.capacite);
  });

  it('Écorcheurs : deux lames qui font saigner', () => {
    const etat = partie();
    construire(etat, 1, 'caserne', 'B');
    avancerSecondes(etat, 2);
    const e = ajouterEnnemi(etat, ennemiEssai({ pv: 100000, degats: [0, 0] }), 'paysan_affame', 0, 8);
    let saigne = false;
    for (let i = 0; i < 10 * 30 && !saigne; i++) {
      step(etat);
      saigne = (e.effetsPas[EFFET.saignement] ?? 0) > 0;
    }
    expect(saigne).toBe(true);
  });
});

describe('caserne', () => {
  it('fait sortir 3 soldats qui rejoignent le point de ralliement', () => {
    const etat = partie();
    construire(etat, 1, 'caserne');
    const soldats = etat.unites.filter((u) => u.genre === 'soldat');
    expect(soldats).toHaveLength(3);
    avancerSecondes(etat, 3);
    for (const s of soldats) expect(distance(s.x, s.y, 10, 5)).toBeLessThan(1);
  });

  it('chaque soldat bloque un ennemi, le quatrième passe', () => {
    const etat = partie();
    construire(etat, 1, 'caserne');
    avancerSecondes(etat, 3);
    const vague = [6, 6.6, 7.2, 7.8].map((x) =>
      ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 0.9, degats: [0, 0] }), 'paysan_affame', 0, x));
    avancerSecondes(etat, 6);
    const bloques = vague.filter((e) => e.bloqueur !== -1);
    expect(bloques).toHaveLength(3);
    expect(new Set(bloques.map((e) => e.bloqueur)).size).toBe(3);
    const libre = vague.find((e) => e.bloqueur === -1);
    expect(libre?.x).toBeGreaterThan(11);
    for (const e of bloques) expect(e.x).toBeLessThan(11);
  });

  it('fait réapparaître un soldat mort après son délai', () => {
    const etat = partie();
    construire(etat, 1, 'caserne');
    const soldat = etat.unites.find((u) => u.genre === 'soldat');
    if (!soldat) throw new Error('pas de soldat');
    blesserUnite(etat, soldat, 100000, 'pur');
    expect(soldat.mort).toBe(true);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'mort_unite', unite: soldat.id }));
    avancerSecondes(etat, TOURS.caserne.niveaux[0].soldats?.reapparition ?? 0);
    expect(soldat.mort).toBe(true);
    step(etat);
    expect(soldat.mort).toBe(false);
    expect(soldat.pv).toBe(soldat.stats.pv);
    expect(etat.evenements).toContainEqual({ type: 'reapparition', unite: soldat.id, genre: 'soldat' });
  });

  it('déplace le point de ralliement, dans la portée et près du chemin seulement', () => {
    const etat = partie();
    construire(etat, 1, 'caserne');
    construire(etat, 0, 'tir');
    expect(appliquerAction(etat, { type: 'deplacerRalliement', socle: 1, x: 11.5, y: 5 })).toEqual({ ok: true });
    avancerSecondes(etat, 3);
    for (const s of etat.unites.filter((u) => u.genre === 'soldat')) expect(distance(s.x, s.y, 11.5, 5)).toBeLessThan(1);
    expect(appliquerAction(etat, { type: 'deplacerRalliement', socle: 1, x: 13, y: 5 })).toEqual({ ok: false, raison: 'hors_portee' });
    expect(appliquerAction(etat, { type: 'deplacerRalliement', socle: 1, x: 10, y: 8.5 })).toEqual({ ok: false, raison: 'hors_chemin' });
    expect(appliquerAction(etat, { type: 'deplacerRalliement', socle: 0, x: 5, y: 5 })).toEqual({ ok: false, raison: 'pas_une_caserne' });
    expect(appliquerAction(etat, { type: 'deplacerRalliement', socle: 2, x: 15, y: 5 })).toEqual({ ok: false, raison: 'socle_vide' });
  });

  it('applique le bonus de Charlie : +25 % PV et coups étourdissants', () => {
    const etat = partie();
    construire(etat, 1, 'caserne');
    const soldat = etat.unites.find((u) => u.genre === 'soldat');
    const base = TOURS.caserne.niveaux[0].soldats?.pv ?? 0;
    expect(soldat?.stats.pv).toBe(base * (1 + DIEUX.charlie.bonus.pvSoldats));
    expect(soldat?.stats.effets).toContainEqual(DIEUX.charlie.bonus.effets[0]);
  });

  it('remet les soldats à neuf avec les stats du nouveau niveau', () => {
    const etat = partie();
    construire(etat, 1, 'caserne');
    appliquerAction(etat, { type: 'ameliorer', socle: 1 });
    const soldats = etat.unites.filter((u) => u.genre === 'soldat');
    const pv = (TOURS.caserne.niveaux[1].soldats?.pv ?? 0) * (1 + DIEUX.charlie.bonus.pvSoldats);
    for (const s of soldats) expect(s.pv).toBe(pv);
  });
});

describe('tour divine de Charlie : Totem du Colosse', () => {
  it('se construit une seule fois par carte et ne s’améliore pas', () => {
    const etat = partie();
    construire(etat, 0, 'divine');
    expect(etat.aretes).toBe(5000 - DIEUX.charlie.tourDivine.cout);
    expect(etat.tours[0]?.famille).toBe('divine');
    expect(appliquerAction(etat, { type: 'construire', socle: 1, tour: 'divine' })).toEqual({ ok: false, raison: 'tour_divine_unique' });
    expect(appliquerAction(etat, { type: 'ameliorer', socle: 0 })).toEqual({ ok: false, raison: 'niveau_max' });
    expect(appliquerAction(etat, { type: 'specialiser', socle: 0, voie: 'A' })).toEqual({ ok: false, raison: 'specialisation_impossible' });
  });

  it('lance une onde de choc qui étourdit les ennemis au sol autour de lui', () => {
    const etat = partie();
    construire(etat, 1, 'divine');
    const sol = cible(etat, 10);
    const loin = cible(etat, 14);
    const volant = cible(etat, 10.5, { volant: true });
    step(etat);
    expect(etat.evenements).toContainEqual(expect.objectContaining({ type: 'onde', rayon: DIEUX.charlie.tourDivine.portee }));
    expect(sol.pv).toBeLessThan(sol.pvMax);
    expect(sol.effetsPas[EFFET.etourdissement]).toBeGreaterThan(0);
    expect(loin.pv).toBe(loin.pvMax);
    expect(volant.pv).toBe(volant.pvMax);
  });
});
