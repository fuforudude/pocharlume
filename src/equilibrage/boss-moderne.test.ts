// Boss tuables (spec du DLC, « Décisions après les relectures de la vague 2 ») : sur chaque niveau de boss du DLC (10, 20, 30), le bot
// soigneux en Matou doit TUER le boss ; le laisser passer en perdant des vies ne compte pas comme une victoire de conception. Un boss peut
// demander une stratégie précise (le Centaure, très blindé : percer l'armure) ; le bot générique, lui, ne doit jamais « gagner » en le
// laissant passer, et cela sur toutes les graines d'évaluation (décision de l'équilibrage), pas seulement la graine 7 des tests de bot.
import { describe, expect, it } from 'vitest';
import { CAMPAGNE_MODERNE } from '../data/niveaux/campagne-moderne';
import { creerBotPerceArmure } from './bot-perce-armure';
import { creerBotSoigneux, optimiserBot } from './bot-soigneux';
import { DIEUX_EVALUES, GRAINES_ENTRAINEMENT, GRAINES_EVALUATION } from './campagne';
import { jouerPartie } from './simulation';

const options = { graine: 7, difficulte: 'matou', secondesMax: 3600 } as const;
const niveau = (numero: number) => {
  const n = CAMPAGNE_MODERNE.find((x) => x.numero === numero);
  if (!n) throw new Error(`Niveau ${String(numero)} introuvable`);
  return n.niveau;
};

/** Les trois boss du DLC, par numéro de niveau dans la campagne `moderne`. */
const BOSS_DU_DLC = [
  [10, 'moderne_commissaire_boss'],
  [20, 'moderne_centaure_boss'],
  [30, 'moderne_prefet'],
] as const;

/** Une recherche de variante (24 parties) et dix parties par dieu : une minute environ sur une machine chargée. */
const DELAI_BOSS = 600_000;

describe('boss du DLC tuables par le bot', () => {
  it('niveau 10 : le bot soigneux tue le commissaire divisionnaire', () => {
    const r = jouerPartie(niveau(10), creerBotSoigneux(), options);
    expect(r.bossTues ?? []).toContain('moderne_commissaire_boss');
    expect(r.statut).toBe('victoire');
  });

  it('niveau 30 : le bot soigneux tue le préfet', () => {
    const r = jouerPartie(niveau(30), creerBotSoigneux(), options);
    expect(r.bossTues ?? []).toContain('moderne_prefet');
    expect(r.statut).toBe('victoire');
  });

  it('niveau 20 : une stratégie dédiée (percer l’armure) tue le Grand Centaure', () => {
    const r = jouerPartie(niveau(20), creerBotPerceArmure(), options);
    expect(r.bossTues ?? []).toContain('moderne_centaure_boss');
    expect(r.statut).toBe('victoire');
  });
});

// Le soigneux générique joue chaque niveau de boss comme `npm run balance` : pour chaque dieu, sa variante est choisie sur les graines
// d'entraînement, puis il joue les dix graines d'évaluation en Matou (toutes : c'est la décision ; environ 6 minutes pour le fichier sur une
// machine chargée, 2 à 3 minutes sinon). Toute victoire doit avoir tué le boss.
//
// Plus aucun écart connu : un boss du DLC qui passe coûte 20 vies (src/data/ennemis.ts), soit toute la réserve de Matou, donc le laisser
// passer est une défaite. Un écart futur s'ajoute ici sous la forme « niveau:dieu » et se garde en `it.fails` (le test passe au rouge dès
// que l'écart disparaît : le retirer alors de la liste).
const ECARTS_CONNUS: ReadonlySet<string> = new Set<string>();

describe.each(BOSS_DU_DLC)('niveau %i : une victoire du soigneux implique que le boss (%s) a été tué, sur toutes les graines d’évaluation', (numero, boss) => {
  for (const dieu of DIEUX_EVALUES) {
    const cas = ECARTS_CONNUS.has(`${String(numero)}:${dieu}`) ? it.fails : it;
    cas(dieu, () => {
      const n = niveau(numero);
      const { variante } = optimiserBot(n, 'matou', GRAINES_ENTRAINEMENT, { dieu });
      const passe: number[] = [];
      for (const graine of GRAINES_EVALUATION) {
        const r = jouerPartie(n, creerBotSoigneux({ variante }), { graine, difficulte: 'matou', dieu, secondesMax: 3600 });
        if (r.statut === 'victoire' && !(r.bossTues ?? []).includes(boss)) passe.push(graine);
      }
      expect(passe, `graines gagnées en laissant passer ${boss}`).toEqual([]);
    }, DELAI_BOSS);
  }
});
