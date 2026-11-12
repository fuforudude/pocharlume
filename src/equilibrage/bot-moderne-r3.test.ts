// Les 10 niveaux de la Préfecture (DLC « Temps modernes », région 3, niveaux 21 à 30) se jouent par le bot soigneux, un essai par niveau,
// en Matou (graine 7, comme la Fac et la Manif). Contrairement aux régions 1 et 2, le test exige le résultat : le bot gagne chaque niveau,
// et au niveau 30 il tue le préfet (le laisser passer en perdant des vies ne compte pas, spec « boss tuables »).
import { describe, expect, it } from 'vitest';
import { CAMPAGNE_MODERNE } from '../data/niveaux/campagne-moderne';
import { creerBotSoigneux } from './bot-soigneux';
import { jouerPartie } from './simulation';

describe('bot soigneux sur les niveaux de la Préfecture', () => {
  for (const n of CAMPAGNE_MODERNE.slice(20, 30)) {
    it(`niveau ${String(n.numero)} : victoire${n.numero === 30 ? ' et préfet tué' : ''}`, () => {
      const r = jouerPartie(n.niveau, creerBotSoigneux(), { graine: 7, difficulte: 'matou', secondesMax: 3600 });
      expect(r.statut, `${String(r.vies)}/${String(r.viesDepart)} vies, pertes par vague ${r.viesPerduesParVague.join(',')}`).toBe('victoire');
      if (n.numero === 30) expect(r.bossTues ?? []).toContain('moderne_prefet');
    });
  }
});
