import { describe, expect, it } from 'vitest';
import { appliquerAction, avancer, creerPartie, validerAction, type Action, type EtatPartie, type Foule, type Niveau } from '../engine';
import { CONFIG, ennemiFixe, heros } from '../engine/aides.test-utils';
import { niveauDynamique } from '../engine/evenements-niveau/niveaux-essai.test-utils';
import { creerBotNaif } from './bot-naif';
import { activationRentable, posteDansFoule, SEUIL_FOULE } from './bot-foules';
import { creerBotSoigneux } from './bot-soigneux';
import { poidsDesChemins, trajetsEffectifs } from './geometrie';
import { jouerPartie } from './simulation';

const RALENTIR: Foule = { cases: [{ cx: 5, cy: 3 }], condition: { type: 'payer', cout: 50 }, effet: { type: 'ralentir', rayon: 3, facteur: 0.5, duree: 4 }, recharge: 10 };
const HEROS: Foule = { cases: [{ cx: 9, cy: 2 }], condition: { type: 'heros', duree: 2 }, effet: { type: 'renforts', nombre: 2, duree: 6, unite: 'etudiant' }, recharge: 20 };

/** Un niveau court à événements et foules, joué par les bots. */
function niveauBots(): Niveau {
  const paysans = (chemin: number, nombre: number, delai = 0): { ennemi: string; nombre: number; intervalle: number; chemin: number; delai: number } => ({
    ennemi: 'paysan_affame',
    nombre,
    intervalle: 0.8,
    chemin,
    delai,
  });
  return niveauDynamique({
    aretes: 300,
    mobiles: [1],
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    vagues: [{ paquets: [paysans(0, 8)] }, { paquets: [paysans(0, 8), paysans(1, 6, 2)] }, { paquets: [paysans(1, 10), paysans(0, 8)] }],
    evenements: [
      { vague: 1, delai: 6, type: 'nasse', chemin: 0, debut: 14, longueur: 2, duree: 4 },
      { vague: 2, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 2, delai: 8, type: 'charge', chemin: 0, ennemi: 'chien_errant', nombre: 3, intervalle: 0.5, facteurVitesse: 1.6, duree: 3 },
      { vague: 3, delai: 5, type: 'canon_a_eau', cy: 2, recul: 2, etourdissement: 1 },
      { vague: 3, delai: 6, type: 'renforts', x: 12, y: 5, nombre: 2, duree: 8, unite: 'etudiant' },
    ],
    foules: [RALENTIR, HEROS],
  });
}

describe('règle de la foule « payer » (activationRentable)', () => {
  it('active une foule prête et payable dès que son effet touche assez d’ennemis', () => {
    const etat = creerPartie(niveauDynamique({ foules: [RALENTIR] }), CONFIG);
    for (let i = 0; i < SEUIL_FOULE - 1; i++) ennemiFixe(etat, 10 + i * 0.5);
    expect(activationRentable(etat)).toBeNull();
    ennemiFixe(etat, 12);
    expect(activationRentable(etat)).toEqual({ type: 'activerFoule', foule: 0 });
  });

  it('un boss suffit ; jamais sans assez d’arêtes ni en recharge', () => {
    const etat = creerPartie(niveauDynamique({ foules: [RALENTIR] }), CONFIG);
    ennemiFixe(etat, 11, { boss: true });
    expect(activationRentable(etat)).toEqual({ type: 'activerFoule', foule: 0 });
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 }).ok).toBe(true);
    expect(activationRentable(etat)).toBeNull();
    const pauvre = creerPartie(niveauDynamique({ foules: [RALENTIR], aretes: 20 }), CONFIG);
    ennemiFixe(pauvre, 11, { boss: true });
    expect(activationRentable(pauvre)).toBeNull();
  });
});

describe('héros dans une foule « héros » (posteDansFoule)', () => {
  it('envoie le héros dans la foule quand des ennemis approchent de son effet, et nulle part sinon', () => {
    const etat = creerPartie(niveauDynamique({ foules: [HEROS] }), CONFIG);
    expect(posteDansFoule(etat)).toBeNull();
    for (let i = 0; i < SEUIL_FOULE; i++) ennemiFixe(etat, 14 + i);
    const poste = posteDansFoule(etat);
    if (!poste) throw new Error('pas de poste');
    expect(poste.x).toBeGreaterThanOrEqual(18);
    expect(poste.x).toBeLessThanOrEqual(20);
    expect(appliquerAction(etat, { type: 'deplacerHeros', x: poste.x, y: poste.y }).ok).toBe(true);
    heros(etat).x = poste.x;
  });
});

/** Joue le niveau avec le bot (une décision toutes les 15 pas) ; compte les constructions que le moteur refuse pour `case_interdite`. */
function jouerEnComptant(niveau: Niveau, bot: { decider: (etat: EtatPartie) => readonly Action[] }): { etat: EtatPartie; refusees: number } {
  const etat = creerPartie(niveau, CONFIG);
  let refusees = 0;
  while (etat.statut === 'en_cours' && etat.pas < 30 * 600) {
    const actions = etat.pas % 15 === 0 ? bot.decider(etat) : [];
    for (const a of actions) if (a.type === 'construire' && validerAction(etat, a) === 'case_interdite') refusees++;
    avancer(etat, actions);
  }
  return { etat, refusees };
}

/**
 * Niveau facile à événements : peu d'ennemis, beaucoup d'arêtes, une foule « payer » et une foule « héros » dont les cases sont les
 * meilleures du niveau (la foule « payer » couvre les rangées qui bordent le chemin 0), et le chemin 1 mobile, fermé au départ.
 */
function niveauFacileFoulesSurLesMeilleuresCases(): Niveau {
  const bordure = [1, 3].flatMap((cy) => Array.from({ length: 12 }, (_, i) => ({ cx: 2 + i, cy })));
  const paysans = (chemin: number, nombre: number): { ennemi: string; nombre: number; intervalle: number; chemin: number; delai: number } => ({ ennemi: 'paysan_affame', nombre, intervalle: 1.5, chemin, delai: 0 });
  return niveauDynamique({
    aretes: 1500,
    mobiles: [1],
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    vagues: [{ paquets: [paysans(0, 3)] }, { paquets: [paysans(0, 3), paysans(1, 3)] }],
    evenements: [{ vague: 2, type: 'ouvrir_chemin', chemin: 1 }],
    foules: [
      { ...RALENTIR, cases: bordure },
      HEROS,
    ],
  });
}

const dansUneFoule = (niveau: Niveau, cx: number, cy: number): boolean => (niveau.foules ?? []).some((f) => f.cases.some((c) => c.cx === cx && c.cy === cy));

describe('héros dans une foule « héros » : hystérésis (posteDansFoule avec une foule visée)', () => {
  it('une fois envoyé, le héros garde la foule pour cible tant qu’elle est prête, même si les ennemis se font moins nombreux', () => {
    const etat = creerPartie(niveauDynamique({ foules: [HEROS] }), CONFIG);
    const ennemis = Array.from({ length: SEUIL_FOULE }, (_, i) => ennemiFixe(etat, 14 + i));
    const poste = posteDansFoule(etat);
    expect(poste?.foule).toBe(0);
    // Un ennemi meurt : sans mémoire, le bot renverrait le héros à son poste.
    const mort = ennemis[0];
    if (!mort) throw new Error('pas d’ennemi');
    mort.vivant = false;
    expect(posteDansFoule(etat)).toBeNull();
    expect(posteDansFoule(etat, 0)?.foule).toBe(0);
    // La foule activée (en recharge) n'est plus visée : le héros reprend son poste.
    const suivi = etat.dynamique.foules[0];
    if (!suivi) throw new Error('pas de foule');
    suivi.recharge = 100;
    expect(posteDansFoule(etat, 0)).toBeNull();
  });
});

describe('poids des chemins et chemins fermés', () => {
  it('la menace d’un chemin fermé va à son repli, puis revient au chemin une fois ouvert', () => {
    const groupe = (chemin: number): { ennemi: string; nombre: number; intervalle: number; chemin: number; delai: number } => ({ ennemi: 'paysan_affame', nombre: 5, intervalle: 1, chemin, delai: 0 });
    const niveau = niveauDynamique({
      mobiles: [1],
      cheminsFermes: [{ chemin: 1, repli: 0 }],
      vagues: [{ paquets: [groupe(1)] }, { paquets: [groupe(1)] }],
      evenements: [{ vague: 1, type: 'ouvrir_chemin', chemin: 1 }],
    });
    // Vague 1 : le chemin 1 est fermé, tout va au chemin 0. Vague 2 : il est ouvert depuis la vague 1, la moitié de la menace y passe.
    expect(trajetsEffectifs(niveau)).toEqual([[0], [1]]);
    const poids = poidsDesChemins(niveau);
    expect(poids[0]).toBeCloseTo(0.5, 5);
    expect(poids[1]).toBeCloseTo(0.5, 5);
  });
});

describe('les bots sur un niveau à événements et foules', () => {
  it('le soigneux le joue jusqu’au bout, paie la foule et y envoie son héros', () => {
    const etat = creerPartie(niveauBots(), CONFIG);
    const bot = creerBotSoigneux();
    while (etat.statut === 'en_cours' && etat.pas < 30 * 600) avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
    expect(etat.statut).not.toBe('en_cours');
    const actions = etat.journal.map((e) => e.action);
    expect(actions.some((a) => a.type === 'activerFoule')).toBe(true);
    expect(actions.some((a) => a.type === 'deplacerHeros' && a.x >= 18 && a.x <= 20 && a.y >= 4 && a.y <= 6)).toBe(true);
  });

  it('le naïf et le soigneux gagnent un niveau d’essai facile, malgré des foules sur les meilleures cases', () => {
    const niveau = niveauFacileFoulesSurLesMeilleuresCases();
    for (const [nom, bot] of [['naïf', creerBotNaif({ graine: 3 })], ['soigneux', creerBotSoigneux()]] as const) {
      const { etat, refusees } = jouerEnComptant(niveau, bot);
      expect(etat.statut, nom).toBe('victoire');
      // Ils construisent vraiment, jamais sur une foule ni sur le chemin mobile, et ne tentent pas ce que le moteur refuse.
      expect(etat.tours.length, nom).toBeGreaterThanOrEqual(2);
      for (const t of etat.tours) expect(dansUneFoule(niveau, t.cx, t.cy), `${nom} : tour en (${String(t.cx)}, ${String(t.cy)})`).toBe(false);
      expect(refusees, nom).toBe(0);
    }
  });

  it('le naïf construit sur un niveau où le moteur refuserait sa première case : il n’en reste pas bloqué', () => {
    const r = jouerPartie(niveauFacileFoulesSurLesMeilleuresCases(), creerBotNaif({ graine: 3 }), { graine: 7, difficulte: 'matou', secondesMax: 600 });
    expect(r.statut).toBe('victoire');
    expect(r.actions).toBeGreaterThan(2);
  });
});
