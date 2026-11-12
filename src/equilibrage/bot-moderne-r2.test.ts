// Les 10 niveaux de la Manif (DLC « Temps modernes », région 2) se jouent jusqu'au bout par le bot soigneux, sans plantage : un essai par
// niveau, en Matou. Le résultat (victoire ou défaite, vies) est affiché pour la tâche d'équilibrage ; il ne bloque pas ici, les bandes
// du DLC sont réglées et imposées par la tâche 7 de la spec.
import { describe, expect, it } from 'vitest';
import { CAMPAGNE_MODERNE } from '../data/niveaux/campagne-moderne';
import { creerBotSoigneux } from './bot-soigneux';
import { jouerPartie } from './simulation';

describe('bot soigneux sur les niveaux de la Manif', () => {
  for (const n of CAMPAGNE_MODERNE.slice(10, 20)) {
    it(`niveau ${String(n.numero)} : joué jusqu’à la fin`, () => {
      const r = jouerPartie(n.niveau, creerBotSoigneux(), { graine: 7, difficulte: 'matou', secondesMax: 3600 });
      console.info(`Manif ${String(n.numero)} : ${r.statut}, ${String(r.vies)}/${String(r.viesDepart)} vies, ${String(Math.round(r.secondes))} s, ${String(r.aretesFin)} arêtes restantes`);
      expect(r.statut).not.toBe('en_cours');
    });
  }
});
