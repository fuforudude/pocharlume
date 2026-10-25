import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { BANDES, correlationDeRang, courbeDifficulte, ecartsChaton, ecartsMatou, ecartsSansDefense, ecartsVieuxSage } from './bandes';
import { evaluerCampagne, partiesDe, synthetiser, trouver, type Evaluation } from './campagne';
import { VARIANTES } from './bot-soigneux';
import { redigerRapport } from './rapport';
import type { ResultatPartie } from './simulation';

function partie(statut: ResultatPartie['statut'], vies: number, viesPerduesParVague: number[] = [], extra: Partial<ResultatPartie> = {}): ResultatPartie {
  return { statut, vies, viesDepart: 20, etoiles: 0, secondes: 100, aretesFin: 50, viesPerduesParVague, choix: [], actions: 0, ...extra };
}

function evaluation(niveau: number, difficulte: string, bot: Evaluation['bot'], parties: ResultatPartie[]): Evaluation {
  return { niveau, difficulte, bot, parties };
}

describe('synthetiser', () => {
  it('calcule taux de victoire, vies, arêtes, durée et vague la plus meurtrière', () => {
    const s = synthetiser([
      partie('victoire', 18, [0, 2, 0], { aretesFin: 100, secondes: 200 }),
      partie('defaite', 0, [0, 4, 16], { aretesFin: 0, secondes: 100 }),
    ]);
    expect(s.parties).toBe(2);
    expect(s.victoires).toBe(1);
    expect(s.tauxVictoire).toBe(0.5);
    expect(s.viesMoyennes).toBe(9);
    expect(s.aretesFinMoyennes).toBe(50);
    expect(s.secondesMoyennes).toBe(150);
    expect(s.aPerduDesVies).toBe(true);
    expect(s.vagueMeurtriere).toBe(3);
    expect(s.viesPerduesVagueMeurtriere).toBe(8);
  });

  it('sans vie perdue, il n’y a pas de vague meurtrière', () => {
    const s = synthetiser([partie('victoire', 20, [0, 0])]);
    expect(s.vagueMeurtriere).toBeNull();
    expect(s.aPerduDesVies).toBe(false);
  });

  it('une liste vide ne plante pas', () => {
    expect(synthetiser([]).tauxVictoire).toBe(0);
  });
});

describe('bandes', () => {
  const gagne = (n: number) => Array.from({ length: n }, () => partie('victoire', 20));
  const perdu = (n: number) => Array.from({ length: n }, () => partie('defaite', 0));

  it('Chaton : le moindre échec du bot naïf est signalé', () => {
    expect(ecartsChaton([evaluation(1, 'chaton', 'naif', gagne(5))])).toEqual([]);
    expect(ecartsChaton([evaluation(1, 'chaton', 'naif', [...gagne(4), ...perdu(1)])])).toHaveLength(1);
  });

  it('Matou : bande du bot naïf de 50 à 90 %, soigneux à 100 %, et des pertes de vies dans au moins 6 niveaux', () => {
    const niveaux = (gagnees: number): Evaluation[] =>
      Array.from({ length: 10 }, (_, i) => i + 1).flatMap((n) => [
        evaluation(n, 'matou', 'soigneux', gagne(4)),
        evaluation(n, 'matou', 'naif', [...gagne(gagnees), ...perdu(4 - gagnees)]),
      ]);
    expect(ecartsMatou(niveaux(3))).toEqual([]);
    expect(ecartsMatou(niveaux(4)).join()).toContain('bande');
    expect(ecartsMatou(niveaux(1)).join()).toContain('bande');
    // Les 5 premiers niveaux sans la moindre perte, les 5 derniers à moitié perdus : 75 % de victoires, mais trop peu de niveaux avec pertes.
    const sansPertes = niveaux(2).map((e) => (e.bot === 'naif' && e.niveau <= 5 ? { ...e, parties: gagne(4) } : e));
    expect(ecartsMatou(sansPertes).join()).toContain('perd des vies');
    const faible = niveaux(3).map((e) => (e.bot === 'soigneux' ? { ...e, parties: perdu(4) } : e));
    expect(ecartsMatou(faible).join()).toContain('soigneux');
    expect(BANDES.matou.naifMin).toBe(0.5);
  });

  it('Vieux Sage : le bot soigneux doit gagner au moins 80 %', () => {
    expect(ecartsVieuxSage([evaluation(1, 'vieux_sage', 'soigneux', [...gagne(8), ...perdu(2)])])).toEqual([]);
    expect(ecartsVieuxSage([evaluation(1, 'vieux_sage', 'soigneux', [...gagne(7), ...perdu(3)])])).toHaveLength(1);
  });

  it('sans défense : une victoire est un écart, sauf en Chaton au niveau 1', () => {
    expect(ecartsSansDefense([evaluation(2, 'matou', 'inactif', perdu(3))])).toEqual([]);
    expect(ecartsSansDefense([evaluation(2, 'matou', 'inactif', [...perdu(2), ...gagne(1)])])).toHaveLength(1);
    expect(ecartsSansDefense([evaluation(2, 'chaton', 'inactif', gagne(1))])).toHaveLength(1);
    expect(ecartsSansDefense([evaluation(1, 'chaton', 'inactif', gagne(1))])).toEqual([]);
  });
});

describe('courbe de difficulté', () => {
  it('la corrélation de rang vaut −1 pour une baisse régulière, +1 pour une hausse, 0 sans variation', () => {
    const courbe = (vies: number[]) => vies.map((v, i) => ({ niveau: i + 1, vies: v }));
    expect(correlationDeRang(courbe([20, 18, 15, 10, 4]))).toBeCloseTo(-1, 9);
    expect(correlationDeRang(courbe([4, 10, 15, 18, 20]))).toBeCloseTo(1, 9);
    expect(correlationDeRang(courbe([7, 7, 7, 7]))).toBe(0);
    expect(correlationDeRang(courbe([20, 15, 18, 10, 12, 4]))).toBeLessThan(-0.7);
  });

  it('lit les vies restantes moyennes du bot naïf niveau par niveau', () => {
    const evals = [
      evaluation(2, 'matou', 'naif', [partie('victoire', 10), partie('victoire', 20)]),
      evaluation(1, 'matou', 'naif', [partie('victoire', 20)]),
      evaluation(1, 'matou', 'soigneux', [partie('victoire', 5)]),
    ];
    expect(courbeDifficulte(evals)).toEqual([
      { niveau: 1, vies: 20 },
      { niveau: 2, vies: 15 },
    ]);
  });
});

describe('évaluation d’une région et rapport', () => {
  const evaluations = evaluerCampagne({ niveaux: REGION1.slice(0, 2), graines: [1, 2], grainesEntrainement: [9001], grainesSansDefense: [1] });

  it('joue chaque niveau dans chaque difficulté avec les trois bots, sur les graines demandées', () => {
    expect(evaluations.length).toBe(2 * 3 * 3);
    expect(trouver(evaluations, 2, 'vieux_sage', 'naif')?.parties.length).toBe(2);
    expect(trouver(evaluations, 1, 'matou', 'inactif')?.parties.length).toBe(1);
    expect(trouver(evaluations, 1, 'matou', 'soigneux')?.variante?.nom).toBeTruthy();
    expect(partiesDe(evaluations, 'chaton', 'soigneux').length).toBe(4);
  });

  it('le rapport contient les sections attendues, et il est identique d’un calcul à l’autre', () => {
    const rapport = redigerRapport(evaluations, 2);
    for (const titre of ['# Rapport d’équilibrage', '## Bandes cibles', '## Chaton', '## Matou', '## Vieux Sage', '## Courbe de difficulté', '## Tours choisies par le bot soigneux', '## Puissance des tours par palier de coût']) {
      expect(rapport).toContain(titre);
    }
    expect(rapport).toContain('Vague la plus meurtrière');
    expect(rapport).toContain('Arêtes inutilisées');
    expect(rapport).toContain('dix variantes (5 préférences × 2 diversités)');
    // Le texte annonce le vrai nombre de variantes de la recherche.
    expect(VARIANTES).toHaveLength(10);
    expect(rapport).toBe(redigerRapport(evaluations, 2));
  });
});
