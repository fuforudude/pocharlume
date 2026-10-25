import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { BANDES, correlationDeRang, courbeDifficulte, ecartsChaton, ecartsCourbe, ecartsMatou, ecartsSansDefense, ecartsVieuxSage } from './bandes';
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
    // 2 vies perdues dans la victoire, les 20 dans la défaite.
    expect(s.viesPerduesMoyennes).toBe(11);
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

  it('Matou : naïf de 30 à 70 %, soigneux à 100 % avec des pertes de vies sur la moitié des niveaux et moins de 250 arêtes inutilisées', () => {
    // Soigneux : 2 vies perdues en moyenne (18 restantes) sur les niveaux « avec perte », 20 restantes sinon.
    const soigneux = (avecPerte: number, aretes = 100): Evaluation[] =>
      Array.from({ length: 10 }, (_, n) =>
        evaluation(n + 1, 'matou', 'soigneux', n < avecPerte ? [partie('victoire', 18, [], { aretesFin: aretes }), partie('victoire', 18, [], { aretesFin: aretes })] : [partie('victoire', 20, [], { aretesFin: aretes })]),
      );
    const naif = (gagnees: number, total = 10): Evaluation[] =>
      Array.from({ length: 10 }, (_, n) => evaluation(n + 1, 'matou', 'naif', [...gagne(Math.round((gagnees * total) / 10)), ...perdu(total - Math.round((gagnees * total) / 10))]));
    expect(ecartsMatou([...soigneux(5), ...naif(5)])).toEqual([]);

    // Bande du naïf : 30 % et 70 % passent, 20 % et 80 % non.
    expect(ecartsMatou([...soigneux(5), ...naif(3)])).toEqual([]);
    expect(ecartsMatou([...soigneux(5), ...naif(7)])).toEqual([]);
    expect(ecartsMatou([...soigneux(5), ...naif(2)]).join()).toContain('naïf');
    expect(ecartsMatou([...soigneux(5), ...naif(8)]).join()).toContain('naïf');

    // Pertes : 5 niveaux sur 10 suffisent, 4 non ; une perte moyenne inférieure à une vie ne compte pas.
    expect(ecartsMatou([...soigneux(4), ...naif(5)]).join()).toContain('perd au moins une vie sur 4 niveaux');
    const demiVie = Array.from({ length: 10 }, (_, n) => evaluation(n + 1, 'matou', 'soigneux', [partie('victoire', 19), partie('victoire', 20), partie('victoire', 20)]));
    expect(ecartsMatou([...demiVie, ...naif(5)]).join()).toContain('perd au moins une vie sur 0 niveaux');

    // Arêtes inutilisées : 249 passe, 250 est un écart, signalé pour le niveau en cause.
    expect(ecartsMatou([...soigneux(5, 249), ...naif(5)])).toEqual([]);
    expect(ecartsMatou([...soigneux(5, 250), ...naif(5)]).filter((e) => e.includes('arêtes inutilisées'))).toHaveLength(10);
    const unSeul = soigneux(5).map((e) => (e.niveau === 10 ? { ...e, parties: [partie('victoire', 20, [], { aretesFin: 1710 })] } : e));
    expect(ecartsMatou([...unSeul, ...naif(5)])).toEqual([expect.stringContaining('niveau 10 laisse 1710 arêtes inutilisées')]);

    // Soigneux : une défaite est un écart.
    const faible = soigneux(5).map((e) => (e.niveau === 1 ? { ...e, parties: perdu(2) } : e));
    expect(ecartsMatou([...faible, ...naif(5)]).join()).toContain('soigneux gagne');
    expect(BANDES.matou.naifMin).toBe(0.3);
    expect(BANDES.matou.naifMax).toBe(0.7);
  });

  it('Vieux Sage : le bot soigneux doit gagner entre 60 et 85 %', () => {
    const taux = (gagnees: number) => [evaluation(1, 'vieux_sage', 'soigneux', [...gagne(gagnees), ...perdu(20 - gagnees)])];
    expect(ecartsVieuxSage(taux(12))).toEqual([]);
    expect(ecartsVieuxSage(taux(17))).toEqual([]);
    expect(ecartsVieuxSage(taux(11)).join()).toContain('55 %');
    expect(ecartsVieuxSage(taux(18)).join()).toContain('90 %');
    expect(ecartsVieuxSage(taux(20))).toHaveLength(1);
  });

  it('sans défense : une victoire est un écart, sauf en Chaton au niveau 1', () => {
    expect(ecartsSansDefense([evaluation(2, 'matou', 'inactif', perdu(3))])).toEqual([]);
    expect(ecartsSansDefense([evaluation(2, 'matou', 'inactif', [...perdu(2), ...gagne(1)])])).toHaveLength(1);
    expect(ecartsSansDefense([evaluation(2, 'chaton', 'inactif', gagne(1))])).toHaveLength(1);
    expect(ecartsSansDefense([evaluation(1, 'chaton', 'inactif', gagne(1))])).toEqual([]);
  });
});

describe('garde de la courbe de difficulté en Matou', () => {
  const courbe = (vies: number[]): Evaluation[] => vies.map((v, i) => evaluation(i + 1, 'matou', 'naif', [partie(v > 0 ? 'victoire' : 'defaite', v)]));

  it('accepte une courbe qui descend avec le niveau 10 parmi les plus durs', () => {
    expect(ecartsCourbe(courbe([20, 19, 18, 15, 12, 10, 8, 5, 2, 1]))).toEqual([]);
    // Le niveau 10 est le troisième plus dur (égalité comprise) : accepté.
    expect(ecartsCourbe(courbe([20, 19, 18, 16, 14, 12, 10, 2, 1, 2]))).toEqual([]);
  });

  it('refuse une courbe plate ou croissante, ou un niveau 10 facile', () => {
    expect(ecartsCourbe(courbe([10, 10, 10, 10, 10, 10, 10, 10, 10, 10])).join()).toContain('corrélation');
    expect(ecartsCourbe(courbe([1, 2, 5, 8, 10, 12, 15, 18, 19, 20])).join()).toContain('corrélation');
    expect(ecartsCourbe(courbe([20, 19, 18, 15, 12, 10, 8, 5, 2, 9])).join()).toContain('niveau 10');
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
    expect(rapport).toContain('Bilan par difficulté');
    expect(rapport).toContain('Soigneux : niveaux avec perte');
    expect(rapport).toContain('dix variantes (5 préférences × 2 diversités)');
    // Le texte annonce le vrai nombre de variantes de la recherche.
    expect(VARIANTES).toHaveLength(10);
    expect(rapport).toBe(redigerRapport(evaluations, 2));
  });
});
