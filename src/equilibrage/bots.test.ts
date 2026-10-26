import { describe, expect, it } from 'vitest';
import { DIFFICULTES } from '../data/difficultes';
import { NIVEAU_TEST, REGION1 } from '../data/niveaux/region1';
import { avancer, creerPartie, rejouer, serialiser } from '../engine';
import type { Action } from '../engine';
import { creerBotNaif } from './bot-naif';
import { creerBotSoigneux, noterPartie, optimiserBot, VARIANTES } from './bot-soigneux';
import { distance, echantillonner, etatInitial, longueurVue, poidsDesChemins } from './geometrie';
import { BOT_INACTIF, configPartie, jouerPartie, type Bot } from './simulation';

/** Marge de temps pour les tests qui jouent plusieurs parties des niveaux 9 et 10 (longues, et plus lentes sur une machine chargée). */
const DELAI_PARTIE_LONGUE = 30_000;

const niveau1 = REGION1[0]?.niveau ?? NIVEAU_TEST;

/** Rejoue une partie en gardant les actions acceptées, pour inspecter ce que le bot a fait. */
function actionsJouees(bot: Bot, graine: number, difficulte = 'matou', niveau = niveau1): Action[] {
  const etat = creerPartie(niveau, configPartie({ graine, difficulte }));
  while (etat.statut === 'en_cours') avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
  return etat.journal.map((e) => e.action);
}

describe('jouerPartie', () => {
  it('est déterministe : mêmes bot, graine et difficulté, même résultat', () => {
    const jouer = () => jouerPartie(niveau1, creerBotNaif({ graine: 5 }), { graine: 11, difficulte: 'matou' });
    expect(jouer()).toEqual(jouer());
  });

  it('sans défense, le héros seul perd le niveau 2 en Matou', () => {
    const niveau2 = REGION1[1]?.niveau ?? NIVEAU_TEST;
    const r = jouerPartie(niveau2, BOT_INACTIF, { graine: 1, difficulte: 'matou' });
    expect(r.statut).toBe('defaite');
    expect(r.vies).toBe(0);
    expect(r.viesDepart).toBe(DIFFICULTES.matou.vies);
    expect(r.actions).toBe(0);
    expect(r.choix).toEqual([]);
  });

  it('compte les vies perdues vague par vague : leur somme est le nombre de vies perdues', () => {
    const r = jouerPartie(niveau1, BOT_INACTIF, { graine: 2, difficulte: 'matou' });
    expect(r.viesPerduesParVague.length).toBe(niveau1.vagues.length);
    expect(r.viesPerduesParVague.reduce((a, b) => a + b, 0)).toBe(r.viesDepart - r.vies);
  });

  it('une partie qui dépasse la durée maximale est rendue en cours', () => {
    const r = jouerPartie(niveau1, BOT_INACTIF, { graine: 2, difficulte: 'chaton', secondesMax: 20 });
    expect(r.statut).toBe('en_cours');
    expect(r.secondes).toBeCloseTo(20, 5);
  });

  it('le résultat s’accorde avec le journal : la partie rejouée donne le même état', () => {
    const bot = creerBotSoigneux();
    const etat = creerPartie(niveau1, configPartie({ graine: 3, difficulte: 'matou' }));
    while (etat.statut === 'en_cours') avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
    const rejoue = rejouer(niveau1, etat.config, etat.journal);
    expect(serialiser(rejoue)).toBe(serialiser(etat));
  });
});

describe('bot naïf', () => {
  it('est déterministe selon sa graine, et deux graines jouent différemment', () => {
    expect(actionsJouees(creerBotNaif({ graine: 1 }), 4)).toEqual(actionsJouees(creerBotNaif({ graine: 1 }), 4));
    expect(actionsJouees(creerBotNaif({ graine: 1 }), 4)).not.toEqual(actionsJouees(creerBotNaif({ graine: 2 }), 4));
  });

  it('construit, améliore et spécialise seulement : ni sorts, ni ordres au héros, ni appel de vague', () => {
    const actions = actionsJouees(creerBotNaif({ graine: 9 }), 4);
    const types = new Set(actions.map((a) => a.type));
    expect(types.has('construire')).toBe(true);
    expect(types.has('ameliorer')).toBe(true);
    for (const interdit of ['lancerSort', 'deplacerHeros', 'appelerVague', 'vendre', 'deplacerRalliement'] as const) {
      expect(types.has(interdit), interdit).toBe(false);
    }
  });

  it('construit d’abord sur les socles les plus proches du chemin', () => {
    const etat = etatInitial(niveau1);
    const echantillons = echantillonner(etat);
    const proximite = etat.niveau.carte.socles.map((s) => Math.min(...echantillons.map((e) => distance(e, s))));
    const premiers = actionsJouees(creerBotNaif({ graine: 3 }), 4).flatMap((a) => (a.type === 'construire' ? [a.socle] : [])).slice(0, 2);
    const mediane = [...proximite].sort((a, b) => a - b)[Math.floor(proximite.length / 2)] ?? 0;
    expect(premiers.length).toBe(2);
    for (const socle of premiers) expect(proximite[socle] ?? Infinity).toBeLessThanOrEqual(mediane + 1.5);
  });
});

describe('bot soigneux', () => {
  it('utilise le héros et les sorts, et appelle les vagues en avance', () => {
    const types = new Set(actionsJouees(creerBotSoigneux(), 4).map((a) => a.type));
    expect(types.has('deplacerHeros')).toBe(true);
    expect(types.has('lancerSort')).toBe(true);
    expect(types.has('appelerVague')).toBe(true);
  });

  it('améliore et spécialise ses tours quand le niveau est long', () => {
    const types = new Set(actionsJouees(creerBotSoigneux(), 4, 'matou', REGION1[9]?.niveau).map((a) => a.type));
    expect(types.has('ameliorer')).toBe(true);
    expect(types.has('specialiser')).toBe(true);
  }, DELAI_PARTIE_LONGUE);

  it('sans option, il n’utilise ni sorts ni héros ni appel en avance', () => {
    const types = new Set(actionsJouees(creerBotSoigneux({ sorts: false, appelerEnAvance: false }), 4).map((a) => a.type));
    for (const interdit of ['lancerSort', 'deplacerHeros', 'appelerVague'] as const) expect(types.has(interdit), interdit).toBe(false);
  });

  it('gagne mieux que le bot naïf sur un niveau où les deux sont éprouvés', () => {
    const niveau = REGION1[8]?.niveau ?? niveau1;
    let soigneux = 0;
    let naif = 0;
    for (const graine of [101, 102, 103]) {
      soigneux += jouerPartie(niveau, creerBotSoigneux(), { graine, difficulte: 'matou' }).vies;
      naif += jouerPartie(niveau, creerBotNaif({ graine: graine * 31 + 7 }), { graine, difficulte: 'matou' }).vies;
    }
    expect(soigneux).toBeGreaterThan(naif);
  }, DELAI_PARTIE_LONGUE);

  it('la recherche en amont est déterministe, retient une variante connue et note toutes les variantes', () => {
    const a = optimiserBot(niveau1, 'matou', [9001]);
    const b = optimiserBot(niveau1, 'matou', [9001]);
    expect(a.variante.nom).toBe(b.variante.nom);
    expect(VARIANTES.map((v) => v.nom)).toContain(a.variante.nom);
    expect(a.notes.length).toBe(VARIANTES.length);
    expect(Math.max(...a.notes.map((n) => n.note))).toBe(a.notes.find((n) => n.variante === a.variante)?.note);
  }, DELAI_PARTIE_LONGUE);

  it('noterPartie préfère toujours une victoire, puis plus de vies, à une défaite', () => {
    const base = { viesDepart: 20, etoiles: 0, secondes: 500, aretesFin: 0, viesPerduesParVague: [], choix: [], actions: 0, sorts: [], tourDivine: false } as const;
    expect(noterPartie({ ...base, statut: 'victoire', vies: 1 })).toBeGreaterThan(noterPartie({ ...base, statut: 'defaite', vies: 0, secondes: 3000 }));
    expect(noterPartie({ ...base, statut: 'victoire', vies: 12 })).toBeGreaterThan(noterPartie({ ...base, statut: 'victoire', vies: 11 }));
  });
});

describe('bot soigneux avec chaque dieu', () => {
  const niveau3 = REGION1[2]?.niveau ?? NIVEAU_TEST;

  function jouer(dieu: string, graine: number) {
    const bot = creerBotSoigneux();
    const etat = creerPartie(niveau3, configPartie({ graine, difficulte: 'matou', dieu }));
    while (etat.statut === 'en_cours' && etat.pas < 30 * 2400) avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
    return etat;
  }

  it.each(['plume', 'charlie', 'pollen'])('%s : joue un niveau, la partie se rejoue à l’identique', (dieu) => {
    const etat = jouer(dieu, 21);
    expect(etat.tours.length).toBeGreaterThan(2);
    const rejoue = rejouer(niveau3, etat.config, etat.journal, etat.pas);
    expect(serialiser(rejoue)).toBe(serialiser(etat));
  }, DELAI_PARTIE_LONGUE);

  it('les trois dieux construisent leur tour divine, sauf si on la retire au bot', () => {
    for (const dieu of ['plume', 'charlie', 'pollen']) {
      const etat = jouer(dieu, 33);
      expect(etat.tours.some((t) => t.famille === 'divine'), dieu).toBe(true);
    }
    const sans = creerBotSoigneux({ tourDivine: false });
    const etat = creerPartie(niveau3, configPartie({ graine: 33, difficulte: 'matou', dieu: 'charlie' }));
    while (etat.statut === 'en_cours' && etat.pas < 30 * 2400) avancer(etat, etat.pas % 15 === 0 ? sans.decider(etat) : []);
    expect(etat.tours.some((t) => t.famille === 'divine')).toBe(false);
  }, DELAI_PARTIE_LONGUE);

  it('chaque dieu lance ses deux sorts dans une partie longue, et le résultat les compte', () => {
    const niveau = REGION1[7]?.niveau ?? niveau3;
    for (const dieu of ['plume', 'charlie', 'pollen']) {
      const r = jouerPartie(niveau, creerBotSoigneux(), { graine: 41, difficulte: 'matou', dieu });
      expect(r.sorts.length, dieu).toBe(2);
      expect(r.sorts[0], `${dieu} : premier sort`).toBeGreaterThan(0);
      expect(r.sorts[1], `${dieu} : second sort`).toBeGreaterThan(0);
      expect(r.tourDivine, dieu).toBe(true);
      expect(r.sorts.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(r.actions);
    }
  }, DELAI_PARTIE_LONGUE);

  it('Pollen compte la remise de famille sur l’artillerie : à budget égal, son bot en construit plus souvent que Charlie', () => {
    const compte = (dieu: string): number => {
      const bot = creerBotSoigneux({ variante: { nom: 'artillerie', poids: { caserne: 0.5, tir: 0.5, magie: 0.5, artillerie: 2 } } });
      const etat = creerPartie(niveau3, configPartie({ graine: 5, difficulte: 'matou', dieu }));
      while (etat.statut === 'en_cours' && etat.pas < 30 * 600) avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
      return etat.tours.filter((t) => t.famille === 'artillerie').length;
    };
    expect(compte('pollen')).toBeGreaterThanOrEqual(compte('charlie'));
  }, DELAI_PARTIE_LONGUE);
});

describe('géométrie des cartes', () => {
  it('les poids des chemins somment à 1 et chaque socle voit du chemin', () => {
    for (const campagne of REGION1) {
      const poids = poidsDesChemins(campagne.niveau);
      expect(poids.length).toBe(campagne.niveau.carte.chemins.length);
      expect(poids.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      const etat = etatInitial(campagne.niveau);
      const echantillons = echantillonner(etat);
      for (const s of campagne.niveau.carte.socles) expect(longueurVue(echantillons, poids, s, 4)).toBeGreaterThan(0);
    }
  });
});
