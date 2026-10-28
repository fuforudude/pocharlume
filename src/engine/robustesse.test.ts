// Entrées non fiables (journal relu, interface) et cohérence du blocage.
import { describe, expect, it } from 'vitest';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import { REGLES } from '../data/regles';
import { ce, CONFIG, avancerSecondes, distance, ennemiEssai, niveauEssai } from './aides.test-utils';
import type { Action } from './actions';
import { ajouterEnnemi } from './ennemis';
import type { EtatPartie } from './etat';
import { appliquerAction, avancer, creerPartie, serialiser, step, validerAction } from './partie';

const NOMS_PIEGES = ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'length'];
const NOMBRES_PIEGES: unknown[] = [Number.NaN, Infinity, -Infinity, 1.5, -1, 99, '0', null, undefined, ...NOMS_PIEGES];
const COORDONNEES_PIEGES: unknown[] = [Number.NaN, Infinity, -Infinity, '5', null, undefined];

function partiePrete(): EtatPartie {
  const etat = creerPartie(niveauEssai(), CONFIG);
  appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'caserne' });
  appliquerAction(etat, { type: 'construire', ...ce(1), tour: 'tir' });
  appliquerAction(etat, { type: 'ameliorer', ...ce(1) });
  appliquerAction(etat, { type: 'ameliorer', ...ce(1) });
  avancerSecondes(etat, 20);
  return etat;
}

function actionsPiegees(): unknown[] {
  const actions: unknown[] = [null, undefined, 42, 'appelerVague', [], {}];
  for (const type of [...NOMS_PIEGES, 'inconnue']) actions.push({ type });
  for (const tour of [...NOMS_PIEGES, 'divine ', 'TIR', 1]) actions.push({ type: 'construire', ...ce(2), tour });
  // Une colonne ou une ligne de case absurde, l'autre coordonnée valide.
  for (const valeur of NOMBRES_PIEGES) {
    for (const [cx, cy] of [[valeur, 3], [2, valeur], [valeur, valeur]]) {
      actions.push({ type: 'construire', cx, cy, tour: 'tir' });
      for (const type of ['ameliorer', 'vendre']) actions.push({ type, cx, cy });
      actions.push({ type: 'specialiser', cx, cy, voie: 'A' });
      actions.push({ type: 'deplacerRalliement', cx, cy, x: 5, y: 5 });
    }
  }
  for (const voie of ['C', 'a', '', ...NOMS_PIEGES, 1, null]) actions.push({ type: 'specialiser', ...ce(1), voie });
  for (const emplacement of NOMBRES_PIEGES) actions.push({ type: 'lancerSort', emplacement, x: 12, y: 5 });
  for (const c of COORDONNEES_PIEGES) {
    actions.push({ type: 'deplacerHeros', x: c, y: 5 }, { type: 'deplacerHeros', x: 12, y: c });
    actions.push({ type: 'deplacerRalliement', ...ce(0), x: c, y: 5 }, { type: 'deplacerRalliement', ...ce(0), x: 5, y: c });
    actions.push({ type: 'lancerSort', emplacement: 1, x: c, y: 5 }, { type: 'lancerSort', emplacement: 1, x: 12, y: c });
  }
  return actions;
}

describe('actions non fiables', () => {
  it('refuse chaque action invalide sans lever d’exception ni toucher à l’état', () => {
    for (const action of actionsPiegees()) {
      const etat = partiePrete();
      const avant = serialiser(etat);
      const texte = action === undefined ? 'undefined' : JSON.stringify(action);
      expect(() => validerAction(etat, action as Action), texte).not.toThrow();
      expect(validerAction(etat, action as Action), texte).not.toBeNull();
      const resultat = appliquerAction(etat, action as Action);
      expect(resultat.ok, texte).toBe(false);
      expect(serialiser(etat), texte).toBe(avant);
      expect(() => avancer(etat, [action as Action]), texte).not.toThrow();
    }
  });

  it('refuse à la création un dieu, une difficulté ou un ennemi aux noms piégés', () => {
    for (const nom of NOMS_PIEGES) {
      expect(() => creerPartie(NIVEAU_TEST, { ...CONFIG, dieu: nom })).toThrow(`Dieu inconnu : ${nom}`);
      expect(() => creerPartie(NIVEAU_TEST, { ...CONFIG, difficulte: nom })).toThrow(`Difficulté inconnue : ${nom}`);
      const niveau = niveauEssai([{ paquets: [{ ennemi: nom, nombre: 1, intervalle: 0, chemin: 0, delai: 0 }] }]);
      expect(() => creerPartie(niveau, CONFIG)).toThrow('ennemi inconnu');
    }
    for (const chemin of [1.5, -1, 2, Number.NaN]) {
      const niveau = niveauEssai([{ paquets: [{ ennemi: 'mendiant', nombre: 1, intervalle: 0, chemin, delai: 0 }] }]);
      expect(() => creerPartie(niveau, CONFIG)).toThrow('chemin inconnu');
    }
  });
});

describe('blocage', () => {
  it('relâche un ennemi bloqué par une unité qui n’est plus au contact et ne le vise pas', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    appliquerAction(etat, { type: 'construire', ...ce(1), tour: 'caserne' });
    appliquerAction(etat, { type: 'ameliorer', ...ce(1) });
    appliquerAction(etat, { type: 'ameliorer', ...ce(1) });
    appliquerAction(etat, { type: 'specialiser', ...ce(1), voie: 'A' });
    avancerSecondes(etat, 3);
    const garde = etat.unites.find((u) => u.genre === 'soldat');
    if (!garde) throw new Error('pas de garde');
    // La garde vise A (immobile, au contact) et a provoqué B, dont elle s'est éloignée.
    const a = ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 0, degats: [0, 0] }), 'paysan_affame', 0, garde.x);
    const b = ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 1, degats: [0, 0] }), 'paysan_affame', 0, garde.x - 3);
    a.bloqueur = garde.id;
    b.bloqueur = garde.id;
    garde.cible = a.id;
    garde.bloques = 2;
    const depart = b.distance;
    step(etat);
    expect(b.bloqueur).toBe(-1);
    expect(b.distance).toBeGreaterThan(depart);
    expect(a.bloqueur).toBe(garde.id);
    expect(garde.bloques).toBe(1);
  });

  it('n’a jamais de blocage fantôme : un ennemi qui avance n’est bloqué que par l’unité qui le vise', () => {
    const etat = creerPartie(niveauEssai(), CONFIG);
    appliquerAction(etat, { type: 'construire', ...ce(1), tour: 'caserne' });
    appliquerAction(etat, { type: 'ameliorer', ...ce(1) });
    appliquerAction(etat, { type: 'ameliorer', ...ce(1) });
    appliquerAction(etat, { type: 'specialiser', ...ce(1), voie: 'A' });
    appliquerAction(etat, { type: 'construire', ...ce(2), tour: 'caserne' });
    avancerSecondes(etat, 3);
    for (let i = 0; i < 16; i++) {
      ajouterEnnemi(etat, ennemiEssai({ pv: 400, vitesse: 1.2 + (i % 3) * 0.4, degats: [1, 2] }), 'paysan_affame', 0, 7.5 - i * 0.4);
    }
    let provocations = 0;
    for (let n = 0; n < 40 * 30; n++) {
      const distances = new Map(etat.ennemis.map((e) => [e.id, e.distance]));
      const bloqueursAvant = new Map(etat.ennemis.map((e) => [e.id, e.bloqueur]));
      step(etat);
      for (const u of etat.unites) {
        const bloques = etat.ennemis.filter((e) => e.vivant && e.bloqueur === u.id);
        expect(u.bloques, `unité ${String(u.id)} au pas ${String(etat.pas)}`).toBe(bloques.length);
        if (u.bloques > 1) provocations++;
      }
      for (const e of etat.ennemis) {
        const avant = distances.get(e.id);
        if (avant === undefined || e.distance === avant || e.bloqueur === -1) continue;
        const bloqueur = etat.unites.find((u) => u.id === e.bloqueur);
        const message = `ennemi ${String(e.id)} avance en restant bloqué au pas ${String(etat.pas)}`;
        if (!bloqueur) throw new Error(message);
        if (bloqueursAvant.get(e.id) === e.bloqueur) {
          // Déjà bloqué avant le pas : il n'avance que si son bloqueur vient vers lui (sa cible).
          expect(bloqueur.cible, message).toBe(e.id);
        } else {
          // Bloqué pendant ce pas, après avoir avancé : par l'unité qui le vise, ou au contact (provocation).
          const auContact = distance(bloqueur.x, bloqueur.y, e.x, e.y) <= REGLES.distanceBlocage;
          expect(bloqueur.cible === e.id || auContact, message).toBe(true);
        }
      }
    }
    expect(provocations).toBeGreaterThan(0);
  });
});
