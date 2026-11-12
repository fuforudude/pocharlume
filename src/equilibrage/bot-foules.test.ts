import { describe, expect, it } from 'vitest';
import { appliquerAction, avancer, creerPartie, type Foule, type Niveau } from '../engine';
import { CONFIG, ennemiFixe, heros } from '../engine/aides.test-utils';
import { niveauDynamique } from '../engine/evenements-niveau/niveaux-essai.test-utils';
import { creerBotNaif } from './bot-naif';
import { activationRentable, posteDansFoule, SEUIL_FOULE } from './bot-foules';
import { creerBotSoigneux } from './bot-soigneux';
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

describe('les bots sur un niveau à événements et foules', () => {
  it('le soigneux le joue jusqu’au bout sans planter, paie la foule et y envoie son héros', () => {
    const etat = creerPartie(niveauBots(), CONFIG);
    const bot = creerBotSoigneux();
    while (etat.statut === 'en_cours' && etat.pas < 30 * 600) avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
    expect(etat.statut).not.toBe('en_cours');
    const actions = etat.journal.map((e) => e.action);
    expect(actions.some((a) => a.type === 'activerFoule')).toBe(true);
    expect(actions.some((a) => a.type === 'deplacerHeros' && a.x >= 18 && a.x <= 20 && a.y >= 4 && a.y <= 6)).toBe(true);
  });

  it('le naïf l’ignore sans planter', () => {
    const r = jouerPartie(niveauBots(), creerBotNaif({ graine: 3 }), { graine: 7, difficulte: 'matou', secondesMax: 600 });
    expect(['victoire', 'defaite']).toContain(r.statut);
  });
});
