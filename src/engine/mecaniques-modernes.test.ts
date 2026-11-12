// Les trois mécaniques d'ennemis du DLC « Temps modernes » (docs/specs/2026-11-12-dlc-temps-modernes-campagne.md), en données et
// sans nom d'ennemi dans le moteur : repousse (action `repousser`), tir sur les tours (action `tirer_tour`, et le « Renvoi » du
// Perchoir dans la campagne moderne), binôme (pouvoir `binome`).
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { avancerSecondes, CONFIG, compter, construireTour, ennemiEssai, ennemiFixe, evenementsPendant, heros, niveauEssai, tourDe } from './aides.test-utils';
import { infligerDegats } from './degats';
import type { ActionEnnemi, DefEnnemi, IdCampagne } from './definitions';
import { ajouterEnnemi, facteurVitesse } from './ennemis';
import { EFFET, type Ennemi, type EtatPartie } from './etat';
import type { Evenement } from './evenements';
import { appliquerAction, creerPartie, step } from './partie';

function partie(campagne?: IdCampagne): EtatPartie {
  const n = niveauEssai();
  return creerPartie(campagne === undefined ? n : { ...n, campagne }, CONFIG);
}

/** Ennemi immobile et increvable qui répète une action toutes les `cadence` secondes. */
function lanceur(etat: EtatPartie, x: number, action: ActionEnnemi, cadence = 1, chemin = 0): Ennemi {
  return ennemiFixe(etat, x, { pouvoirs: { periodiques: [{ cadence, actions: [action] }] } }, chemin);
}

/** Avance pas à pas jusqu'au premier événement de ce type (au plus `max` secondes) ; rend les événements de ce pas, ou null. */
function jusquA(etat: EtatPartie, type: Evenement['type'], max: number, avant?: () => void): Evenement[] | null {
  for (let i = 0; i < max * 30; i++) {
    avant?.();
    step(etat);
    if (etat.evenements.some((e) => e.type === type)) return etat.evenements;
  }
  return null;
}

describe('repousse : le canon à eau repousse soldats et héros devant lui et les étourdit', () => {
  const REPOUSSE: ActionEnnemi = { type: 'repousser', portee: 2.5, distance: 2, etourdissement: 1.5 };

  it('les soldats devant lui reculent de N tuiles dans le sens de sa marche, étourdis, et le lâchent', () => {
    const etat = partie();
    construireTour(etat, 0, 'caserne');
    avancerSecondes(etat, 2);
    const canon = lanceur(etat, 3, REPOUSSE);
    let avant = new Map<number, { x: number; y: number }>();
    const vus = jusquA(etat, 'repousse', 3, () => {
      avant = new Map(etat.unites.map((u) => [u.id, { x: u.x, y: u.y }]));
    });
    expect(vus).not.toBeNull();
    const pousses = etat.unites.filter((u) => u.genre === 'soldat' && u.etourdi > 0);
    expect(pousses.length).toBeGreaterThan(0);
    for (const u of pousses) {
      const a = avant.get(u.id);
      expect(u.x - (a?.x ?? 0)).toBeCloseTo(2, 5);
      expect(u.y).toBeCloseTo(a?.y ?? 0, 5);
      expect(u.bloques).toBe(0);
    }
    expect(canon.bloqueur).toBe(-1);
  });

  it('le héros devant lui est repoussé aussi ; ce qui est derrière lui ne l’est pas', () => {
    const etat = partie();
    const canon = lanceur(etat, 10, REPOUSSE);
    const h = heros(etat);
    h.x = 11.5;
    h.y = 5;
    h.ancreX = h.x;
    h.ancreY = h.y;
    let avant = h.x;
    const vus = jusquA(etat, 'repousse', 2, () => {
      avant = h.x;
    });
    expect(vus).not.toBeNull();
    expect(h.x - avant).toBeCloseTo(2, 5);
    expect(h.etourdi).toBeGreaterThan(0);
    // Derrière lui : personne n'est poussé, l'action attend.
    h.x = 8;
    h.ancreX = 8;
    h.etourdi = 0;
    expect(jusquA(etat, 'repousse', 2)).toBeNull();
    expect(canon.vivant).toBe(true);
  });

  it('sans personne devant lui, rien ne se passe et l’action est retentée au pas suivant', () => {
    const etat = partie();
    lanceur(etat, 3, REPOUSSE);
    expect(jusquA(etat, 'repousse', 3)).toBeNull();
    const h = heros(etat);
    h.x = 4;
    h.y = 5;
    h.ancreX = 4;
    h.ancreY = 5;
    step(etat);
    expect(etat.evenements.some((e) => e.type === 'repousse')).toBe(true);
  });
});

describe('tir sur les tours : le tireur de LBD met une tour hors service par projectile', () => {
  const TIR: ActionEnnemi = { type: 'tirer_tour', portee: 5, vitesse: 6, duree: 0.5 };

  it('un projectile part vers la tour la plus proche, qui est hors service à son arrivée', () => {
    const etat = partie();
    construireTour(etat, 1, 'magie');
    lanceur(etat, 9, TIR, 2);
    const depart = jusquA(etat, 'tir_tour', 3);
    expect(depart).not.toBeNull();
    expect(etat.tirsEnnemis).toHaveLength(1);
    const tour = tourDe(etat, 1);
    expect(tour?.desactivee).toBe(0);
    const arrivee = jusquA(etat, 'tour_desactivee', 2);
    expect(arrivee).not.toBeNull();
    expect(tour?.desactivee).toBeGreaterThan(0);
    expect(etat.tirsEnnemis).toHaveLength(0);
  });

  it('sans tour à portée, il ne tire pas (et retente au pas suivant) ; une tour vendue en plein vol n’est pas touchée', () => {
    const etat = partie();
    construireTour(etat, 3, 'magie');
    lanceur(etat, 2, TIR, 1);
    expect(jusquA(etat, 'tir_tour', 3)).toBeNull();
    const proche = partie();
    construireTour(proche, 1, 'magie');
    lanceur(proche, 9, TIR, 1);
    expect(jusquA(proche, 'tir_tour', 2)).not.toBeNull();
    const { cx, cy } = { cx: tourDe(proche, 1)?.cx ?? 0, cy: tourDe(proche, 1)?.cy ?? 0 };
    expect(appliquerAction(proche, { type: 'vendre', cx, cy }).ok).toBe(true);
    step(proche);
    expect(proche.tirsEnnemis).toHaveLength(0);
  });

  /** Trois tirs successifs ; rend le nombre de tours mises hors service, de renvois, et le tireur. */
  function troisTirs(campagne: IdCampagne | undefined, cible: 'perchoir' | 'voisine'): { touchees: number; renvois: number; tireur: Ennemi; etourdi: boolean } {
    const etat = partie(campagne);
    if (cible === 'perchoir') {
      construireTour(etat, 1, 'tir');
    } else {
      construireTour(etat, 1, 'tir', 'B');
      construireTour(etat, 2, 'magie');
    }
    const tireur = lanceur(etat, cible === 'perchoir' ? 9 : 17, TIR, 2);
    let touchees = 0;
    let renvois = 0;
    let etourdi = false;
    for (let i = 0; i < 30 * 7; i++) {
      step(etat);
      touchees += compter(etat.evenements, 'tour_desactivee');
      renvois += compter(etat.evenements, 'renvoi');
      if ((tireur.effetsPas[EFFET.etourdissement] ?? 0) > 0) etourdi = true;
    }
    return { touchees, renvois, tireur, etourdi };
  }

  it('Renvoi (campagne moderne) : le Perchoir visé renvoie un tir sur trois au tireur, qui est étourdi', () => {
    const r = troisTirs('moderne', 'perchoir');
    expect(r.touchees).toBe(2);
    expect(r.renvois).toBe(1);
    expect(r.etourdi).toBe(true);
  });

  it('Renvoi : il protège aussi une tour voisine à sa portée', () => {
    const r = troisTirs('moderne', 'voisine');
    expect(r.touchees).toBe(2);
    expect(r.renvois).toBe(1);
  });

  it('dans l’histoire, aucun tir n’est renvoyé', () => {
    const r = troisTirs(undefined, 'perchoir');
    expect(r.touchees).toBe(3);
    expect(r.renvois).toBe(0);
    expect(r.etourdi).toBe(false);
  });
});

describe('binôme : une apparition crée deux ennemis liés ; quand l’un tombe, l’autre accélère', () => {
  const BINOME: DefEnnemi = ennemiEssai({ pv: 100, vitesse: 1, degats: [0, 0], pouvoirs: { binome: { ecart: 0.6, vitesse: 0.5 } } });

  it('crée deux ennemis du même type, liés l’un à l’autre, le second un peu devant', () => {
    const etat = partie();
    const a = ajouterEnnemi(etat, BINOME, 'paysan_affame', 0, 5);
    expect(etat.ennemis).toHaveLength(2);
    const b = etat.ennemis[1];
    if (!b) throw new Error('pas de second');
    expect(a.binome).toBe(b.id);
    expect(b.binome).toBe(a.id);
    expect(b.type).toBe(a.type);
    expect(b.distance).toBeCloseTo(5.6);
  });

  it('l’un tué, l’autre va plus vite jusqu’à la fin', () => {
    const etat = partie();
    const a = ajouterEnnemi(etat, BINOME, 'paysan_affame', 0, 5);
    const b = etat.ennemis[1];
    if (!b) throw new Error('pas de second');
    expect(facteurVitesse(b)).toBeCloseTo(1);
    infligerDegats(etat, a, 1e6, 'pur');
    expect(b.binomeSeul).toBe(true);
    expect(etat.evenements.some((e) => e.type === 'binome_seul')).toBe(true);
    expect(facteurVitesse(b)).toBeCloseTo(1.5);
    const avant = b.distance;
    step(etat);
    expect((b.distance - avant) * 30).toBeCloseTo(1.5);
  });

  it('un groupe de vague de N binômes donne 2N ennemis', () => {
    const etat = creerPartie(niveauEssai([{ paquets: [{ ennemi: 'moderne_bravm', nombre: 2, intervalle: 1, chemin: 0, delai: 0 }] }]), CONFIG);
    const vus = evenementsPendant(etat, 40);
    expect(vus.filter((e) => e.type === 'apparition' && e.typeEnnemi === 'moderne_bravm')).toHaveLength(4);
  });

  it('sans le pouvoir, un seul ennemi', () => {
    const etat = partie();
    ajouterEnnemi(etat, ENNEMIS.chevalier, 'chevalier', 0, 5);
    expect(etat.ennemis).toHaveLength(1);
    expect(etat.ennemis[0]?.binome).toBe(-1);
  });
});
