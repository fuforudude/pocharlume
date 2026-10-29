// Section du rapport pour les régions 2 à 10 : chiffres par région, difficulté et dieu, écarts
// aux bandes à titre d'information. Les évaluations sont fabriquées ici : le test ne joue aucune partie.
import { describe, expect, it } from 'vitest';
import type { Evaluation } from './campagne';
import { evaluationsDeRegion, redigerRegions } from './rapport-regions';
import type { ResultatPartie } from './simulation';

function partie(gagnee: boolean, vies = 20): ResultatPartie {
  return {
    statut: gagnee ? 'victoire' : 'defaite',
    vies: gagnee ? vies : 0,
    viesDepart: 20,
    etoiles: gagnee ? 2 : 0,
    secondes: 300,
    aretesFin: 100,
    viesPerduesParVague: [0, 0, gagnee ? 20 - vies : 20],
    choix: [],
    actions: 10,
    sorts: [1, 1],
    tourDivine: true,
  };
}

function evaluation(niveau: number, difficulte: string, bot: Evaluation['bot'], dieu: string, gagnees: number, total = 4): Evaluation {
  return { dieu, niveau, difficulte, bot, parties: Array.from({ length: total }, (_, i) => partie(i < gagnees, 14)) };
}

function toutesLesEvaluations(): Evaluation[] {
  const evaluations: Evaluation[] = [];
  for (let niveau = 1; niveau <= 50; niveau++) {
    for (const difficulte of ['chaton', 'matou', 'vieux_sage']) {
      for (const dieu of ['plume', 'charlie', 'pollen']) {
        evaluations.push(evaluation(niveau, difficulte, 'naif', dieu, 2), evaluation(niveau, difficulte, 'soigneux', dieu, 4), evaluation(niveau, difficulte, 'inactif', dieu, 0, 3));
      }
    }
  }
  return evaluations;
}

describe('evaluationsDeRegion', () => {
  it('garde les niveaux de la région, par dizaines de numéros de campagne', () => {
    const toutes = toutesLesEvaluations();
    expect(new Set(evaluationsDeRegion(toutes, 1).map((e) => e.niveau))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    expect(Math.min(...evaluationsDeRegion(toutes, 3).map((e) => e.niveau))).toBe(21);
    expect(Math.max(...evaluationsDeRegion(toutes, 3).map((e) => e.niveau))).toBe(30);
    expect(evaluationsDeRegion(toutes, 6)).toEqual([]);
    expect(evaluationsDeRegion(toutes, 1).length + evaluationsDeRegion(toutes, 2).length).toBe(2 * 10 * 3 * 3 * 3);
  });
});

describe('redigerRegions', () => {
  const texte = redigerRegions(toutesLesEvaluations(), [2, 3, 4, 5]);

  it('a une section par région, avec son thème', () => {
    for (const titre of ['Région 2 : les Champs Brûlés', 'Région 3 : le Bourg des Bûchers', 'Région 4 : les Marais de l’Ordalie', 'Région 5 : la Ville Pestiférée']) {
      expect(texte).toContain(`### ${titre}`);
    }
    expect(texte).not.toContain('### Région 1');
  });

  it('dit que les bandes ne sont pas encore appliquées et liste les écarts constatés', () => {
    expect(texte).toContain('Écarts aux bandes');
    // Le naïf gagne 50 % et le soigneux tout : l'écart de Vieux Sage (soigneux 100 % > 85 %) est noté.
    expect(texte).toContain('Vieux Sage (Plume)');
  });

  it('donne, pour chaque niveau, le taux de victoire du soigneux et du naïf en Matou', () => {
    expect(texte).toMatch(/\| 11 \| 100 % \(12\/12\) \| 50 % \(6\/12\)/);
    expect(texte).toMatch(/\| 50 \| 100 % \(12\/12\) \| 50 % \(6\/12\)/);
  });

  it('est identique d’un appel à l’autre (ni date ni durée)', () => {
    expect(redigerRegions(toutesLesEvaluations(), [2, 3, 4, 5])).toBe(texte);
  });

  it('une région sans évaluation est signalée, pas inventée', () => {
    const seulement2 = redigerRegions(evaluationsDeRegion(toutesLesEvaluations(), 2), [2, 3]);
    expect(seulement2).toContain('### Région 3 : le Bourg des Bûchers');
    expect(seulement2).toContain('Pas d’évaluation');
  });
});
