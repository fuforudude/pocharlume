import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { BANDES, correlationDeRang, courbeDifficulte, ecartsChaton, ecartsCourbe, ecartsEntreDieux, ecartsMatou, ecartsSansDefense, ecartsVieuxSage, verifierBandes } from './bandes';
import { dieuxDe, duDieu, evaluerCampagne, evaluerProfil, partiesDe, synthetiser, trouver, type Evaluation } from './campagne';
import { VARIANTES } from './bot-soigneux';
import { competencesNiveauMax, profilProgression, profilsDisciples, profilSansTourDivine } from './profils';
import { redigerRapport } from './rapport';
import { verifierConfig } from '../engine';
import { configPartie, type ResultatPartie } from './simulation';

function partie(statut: ResultatPartie['statut'], vies: number, viesPerduesParVague: number[] = [], extra: Partial<ResultatPartie> = {}): ResultatPartie {
  return { statut, vies, viesDepart: 20, etoiles: 0, secondes: 100, aretesFin: 50, viesPerduesParVague, choix: [], actions: 0, sorts: [0, 0], tourDivine: false, ...extra };
}

function evaluation(niveau: number, difficulte: string, bot: Evaluation['bot'], parties: ResultatPartie[], dieu = 'charlie'): Evaluation {
  return { dieu, niveau, difficulte, bot, parties };
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

describe('bandes par dieu et entre dieux', () => {
  const gagne = (n: number, vies = 20) => Array.from({ length: n }, () => partie('victoire', vies));
  const perdu = (n: number) => Array.from({ length: n }, () => partie('defaite', 0));

  it('chaque dieu est jugé à part : l’écart d’un seul dieu est signalé avec son nom', () => {
    const evals = [
      evaluation(1, 'chaton', 'naif', gagne(5), 'plume'),
      evaluation(1, 'chaton', 'naif', [...gagne(4), ...perdu(1)], 'pollen'),
      evaluation(1, 'chaton', 'naif', gagne(5), 'charlie'),
    ];
    expect(dieuxDe(evals)).toEqual(['plume', 'pollen', 'charlie']);
    expect(duDieu(evals, 'pollen')).toHaveLength(1);
    expect(ecartsChaton(evals)).toEqual([expect.stringContaining('Chaton (Pollen)')]);
  });

  it('Vieux Sage : la bande de 60 à 85 % vaut pour chaque dieu', () => {
    const taux = (dieu: string, gagnees: number) => evaluation(1, 'vieux_sage', 'soigneux', [...gagne(gagnees), ...perdu(20 - gagnees)], dieu);
    expect(ecartsVieuxSage([taux('plume', 14), taux('charlie', 15), taux('pollen', 16)])).toEqual([]);
    expect(ecartsVieuxSage([taux('plume', 11), taux('charlie', 15), taux('pollen', 16)])).toEqual([expect.stringContaining('Vieux Sage (Plume)')]);
    expect(ecartsVieuxSage([taux('plume', 14), taux('charlie', 15), taux('pollen', 18)])).toEqual([expect.stringContaining('Vieux Sage (Pollen)')]);
  });

  it('entre dieux : au plus 10 points de taux de victoire en Vieux Sage', () => {
    const taux = (dieu: string, gagnees: number) => evaluation(1, 'vieux_sage', 'soigneux', [...gagne(gagnees), ...perdu(20 - gagnees)], dieu);
    // 12/20 = 60 % et 14/20 = 70 % : dix points pile, accepté.
    expect(ecartsEntreDieux([taux('plume', 12), taux('charlie', 14), taux('pollen', 13)])).toEqual([]);
    // 12/20 = 60 % et 15/20 = 75 % : quinze points, refusé, et le message nomme les deux extrêmes.
    const ecarts = ecartsEntreDieux([taux('plume', 12), taux('charlie', 15), taux('pollen', 13)]);
    expect(ecarts).toHaveLength(1);
    expect(ecarts[0]).toContain('Charlie');
    expect(ecarts[0]).toContain('Plume');
    expect(ecarts[0]).toContain('15 points');
  });

  it('entre dieux : au plus 3 vies d’écart de vies moyennes du soigneux en Matou', () => {
    const vies = (dieu: string, v: number) => evaluation(1, 'matou', 'soigneux', gagne(4, v), dieu);
    expect(ecartsEntreDieux([vies('plume', 15), vies('charlie', 18), vies('pollen', 16)])).toEqual([]);
    const ecarts = ecartsEntreDieux([vies('plume', 14), vies('charlie', 18), vies('pollen', 16)]);
    expect(ecarts).toEqual([expect.stringContaining('Matou : Charlie (18 vies) et Plume (14 vies) sont à 4 vies')]);
    expect(BANDES.matou.ecartViesEntreDieuxMax).toBe(3);
    expect(BANDES.vieux_sage.ecartVictoiresEntreDieuxMax).toBe(0.1);
  });

  it('avec un seul dieu, il n’y a rien à comparer', () => {
    expect(ecartsEntreDieux([evaluation(1, 'vieux_sage', 'soigneux', gagne(4), 'charlie')])).toEqual([]);
    expect(ecartsEntreDieux([])).toEqual([]);
  });

  it('la courbe est jugée sur la moyenne des dieux et chaque dieu doit aussi monter ; le sans-défense est jugé pour chaque dieu', () => {
    const courbe = (dieu: string, vies: number[]): Evaluation[] => vies.map((v, i) => evaluation(i + 1, 'matou', 'naif', [partie(v > 0 ? 'victoire' : 'defaite', v)], dieu));
    const bonne = [20, 19, 18, 15, 12, 10, 8, 5, 2, 1];
    expect(ecartsCourbe([...courbe('plume', bonne), ...courbe('pollen', bonne)])).toEqual([]);
    const mauvaise = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    expect(ecartsCourbe([...courbe('plume', bonne), ...courbe('pollen', mauvaise)])).toEqual([expect.stringContaining('Matou (Pollen)')]);
    expect(ecartsSansDefense([evaluation(2, 'matou', 'inactif', gagne(1), 'plume')])).toEqual([expect.stringContaining('Sans défense (Plume)')]);
  });

  it('verifierBandes réunit les écarts par dieu et entre dieux', () => {
    const evals = [evaluation(1, 'vieux_sage', 'soigneux', [...gagne(12), ...perdu(8)], 'plume'), evaluation(1, 'vieux_sage', 'soigneux', [...gagne(18), ...perdu(2)], 'charlie')];
    const ecarts = verifierBandes(evals);
    expect(ecarts.some((e) => e.includes('Vieux Sage (Charlie)'))).toBe(true);
    expect(ecarts.some((e) => e.includes("points l'un de l'autre"))).toBe(true);
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
  const niveaux = REGION1.slice(0, 2);
  const premier = REGION1[0];
  if (!premier) throw new Error('Région 1 vide');
  const evaluations = evaluerCampagne({ niveaux, graines: [1, 2], grainesEntrainement: [9001], grainesSansDefense: [1] });
  const profils = [
    ...evaluerProfil(premier, 'matou', { id: 'suie', dieu: 'plume', heros: 'suie' }, { graines: [1, 2], grainesEntrainement: [9001] }),
    ...evaluerProfil(premier, 'vieux_sage', profilProgression('pollen', 'tout'), { graines: [1], grainesEntrainement: [9001] }),
    ...evaluerProfil(premier, 'matou', profilSansTourDivine('charlie'), { graines: [1, 2], grainesEntrainement: [9001], bots: ['soigneux'] }),
  ];

  it('joue chaque niveau dans chaque difficulté, avec chaque dieu et les trois bots, sur les graines demandées', () => {
    expect(evaluations.length).toBe(2 * 3 * 3 * 3);
    expect(dieuxDe(evaluations).sort()).toEqual(['charlie', 'plume', 'pollen']);
    expect(trouver(evaluations, 2, 'vieux_sage', 'naif', 'pollen')?.parties.length).toBe(2);
    expect(trouver(evaluations, 1, 'matou', 'inactif', 'plume')?.parties.length).toBe(1);
    expect(trouver(evaluations, 1, 'matou', 'soigneux', 'charlie')?.variante?.nom).toBeTruthy();
    expect(partiesDe(evaluations, 'chaton', 'soigneux').length).toBe(2 * 2 * 3);
    expect(partiesDe(evaluations, 'chaton', 'soigneux', 'plume').length).toBe(4);
  });

  it('chaque partie compte les lancers des deux sorts de son dieu', () => {
    for (const dieu of ['plume', 'charlie', 'pollen']) {
      const parties = partiesDe(evaluations, 'matou', 'soigneux', dieu);
      expect(parties.every((p) => p.sorts.length === 2), dieu).toBe(true);
      expect(parties.some((p) => p.sorts.some((n) => n > 0)), dieu).toBe(true);
    }
  });

  it('un profil joue avec son héros, son niveau, ses compétences et son arbre ; sans tour divine, le soigneux n’en construit jamais', () => {
    const suie = profils.filter((p) => p.profil === 'suie');
    expect(suie.map((p) => p.bot).sort()).toEqual(['naif', 'soigneux']);
    expect(suie.every((p) => p.heros === 'suie' && p.dieu === 'plume' && p.parties.length === 2)).toBe(true);
    const tout = profils.filter((p) => p.profil === 'tout');
    expect(tout.every((p) => p.heros === 'pollen' && p.difficulte === 'vieux_sage')).toBe(true);
    const sansDivine = profils.filter((p) => p.profil === 'sans_divine');
    expect(sansDivine).toHaveLength(1);
    expect(sansDivine[0]?.parties.every((p) => !p.tourDivine)).toBe(true);
  });

  it('le rapport contient les sections attendues, et il est identique d’un calcul à l’autre', () => {
    const rapport = redigerRapport(evaluations, 2, profils);
    for (const titre of [
      '# Rapport d’équilibrage',
      '## Bandes cibles',
      '### Dieu × difficulté',
      '### Écarts entre dieux',
      '## Plume',
      '## Charlie',
      '## Pollen',
      '### Plume : Chaton',
      '### Charlie : Matou',
      '### Pollen : Vieux Sage',
      '## Courbe de difficulté',
      '## Usage des sorts par le soigneux',
      '## Tours divines',
      '## Disciples comparés à leur avatar (Matou)',
      '## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)',
      '## Puissance des tours par palier de coût',
    ]) {
      expect(rapport).toContain(titre);
    }
    expect(rapport).toContain('Vague la plus meurtrière');
    expect(rapport).toContain('Arêtes inutilisées');
    expect(rapport).toContain('Soigneux : niveaux avec perte');
    expect(rapport).toContain('dix variantes (5 préférences × 2 diversités)');
    // Les sorts et les tours divines des trois dieux y sont.
    for (const nom of ['Voile de Nuit', 'Griffes d’Ombre', 'Chute du Colosse', 'Renforts', 'Pièges à Ressort', 'Ingéniosité', 'Sanctuaire de l’Ombre', 'Totem du Colosse', 'Atelier Boiteux']) {
      expect(rapport, nom).toContain(nom);
    }
    // Le texte annonce le vrai nombre de variantes de la recherche.
    expect(VARIANTES).toHaveLength(10);
    expect(rapport).toBe(redigerRapport(evaluations, 2, profils));
  });

  it('sans vérification supplémentaire, le rapport s’écrit quand même', () => {
    const rapport = redigerRapport(evaluations, 2);
    expect(rapport).not.toContain('## Disciples comparés');
    expect(rapport).toContain('## Tours divines');
  });
});

describe('profils des vérifications supplémentaires', () => {
  it('les six disciples, deux par dieu, jouent avec leur dieu', () => {
    const disciples = profilsDisciples();
    expect(disciples.map((p) => p.heros)).toEqual(['suie', 'corbeau', 'mastoc', 'brise_os', 'rouage', 'lanterne']);
    expect(disciples.map((p) => p.dieu)).toEqual(['plume', 'plume', 'charlie', 'charlie', 'pollen', 'pollen']);
  });

  it('l’arbre au maximum met les six branches au rang 5 ; le héros de niveau 10 place 10 points, l’ultime d’abord', () => {
    const arbre = profilProgression('plume', 'arbre');
    expect(Object.keys(arbre.ameliorations ?? {}).sort()).toEqual(['artillerie', 'caserne', 'heros', 'magie', 'sorts', 'tir']);
    expect(Object.values(arbre.ameliorations ?? {}).every((r) => r === 5)).toBe(true);
    expect(arbre.niveauHeros).toBeUndefined();

    const heros10 = profilProgression('charlie', 'heros10');
    expect(heros10.niveauHeros).toBe(10);
    expect(heros10.ameliorations).toBeUndefined();
    expect(competencesNiveauMax('charlie')).toEqual({ neuf_nuits: 3, poigne_de_fer: 3, peau_epaisse: 3, onde_de_choc: 1 });
    expect(Object.values(competencesNiveauMax('pollen')).reduce((a, b) => a + b, 0)).toBe(10);

    const tout = profilProgression('pollen', 'tout');
    expect(tout.niveauHeros).toBe(10);
    expect(tout.ameliorations).toBeDefined();
  });

  it('les configs des profils sont valides pour le moteur', () => {
    for (const dieu of ['plume', 'charlie', 'pollen']) {
      for (const id of ['arbre', 'heros10', 'tout'] as const) {
        const { id: profil, ...joueur } = profilProgression(dieu, id);
        expect(verifierConfig(configPartie({ ...joueur, graine: 1, difficulte: 'vieux_sage' })), `${dieu} ${profil}`).toBeNull();
      }
    }
    for (const p of profilsDisciples()) {
      const { id, ...joueur } = p;
      expect(verifierConfig(configPartie({ ...joueur, graine: 1, difficulte: 'matou' })), id).toBeNull();
    }
  });
});
