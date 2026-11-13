// Boss tuables (spec du DLC, « Décisions après les relectures de la vague 2 ») : sur chaque niveau de boss du DLC (10, 20, 30), le bot
// soigneux en Matou doit TUER le boss ; le laisser passer en perdant des vies ne compte pas comme une victoire de conception. Un boss peut
// demander une stratégie précise (le Centaure, très blindé : percer l'armure) ; le bot générique, lui, ne doit jamais « gagner » en le
// laissant passer, et cela sur toutes les graines d'évaluation (décision de l'équilibrage), pas seulement la graine 7 des tests de bot.
import { beforeAll, describe, expect, it } from 'vitest';
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

/** Version complète (3 boss, 3 dieux, 10 graines : environ 6 minutes) : seulement par `npm run test:equilibrage`. */
const COMPLET = Boolean(process.env['EQUILIBRAGE_COMPLET']);

/** Une partie de bot sur un boss, mesurée de 25 s (machine libre) à plus de 30 s (machine chargée) : marge large. */
const DELAI_RAPIDE = 180_000;

// Version rapide (suite habituelle) : une graine (la 7), un boss par cas. Pour chaque boss, la stratégie dédiée le tue et jamais une
// victoire en le laissant passer. Le Centaure demande de percer l'armure ; les deux autres tombent au soigneux générique.
const STRATEGIES = {
  moderne_commissaire_boss: () => creerBotSoigneux(),
  moderne_centaure_boss: () => creerBotPerceArmure(),
  moderne_prefet: () => creerBotSoigneux(),
} as const;

describe.each(BOSS_DU_DLC)('niveau %i, version rapide (graine 7) : %s', (numero, boss) => {
  let res: ReturnType<typeof jouerPartie>;
  beforeAll(() => {
    res = jouerPartie(niveau(numero), STRATEGIES[boss](), options);
  }, DELAI_RAPIDE);

  it('la stratégie dédiée tue le boss', () => {
    expect(res.bossTues ?? []).toContain(boss);
    expect(res.statut).toBe('victoire');
  });

  it('aucune victoire en laissant passer le boss', () => {
    if (res.statut === 'victoire') expect(res.bossTues ?? []).toContain(boss);
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

describe.skipIf(!COMPLET).each(BOSS_DU_DLC)('niveau %i : une victoire du soigneux implique que le boss (%s) a été tué, sur toutes les graines d’évaluation', (numero, boss) => {
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
