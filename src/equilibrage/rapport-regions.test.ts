// Section du rapport pour les régions 2 à 10 : chiffres par région, difficulté et dieu, écarts
// aux bandes à titre d'information. Les évaluations sont fabriquées ici : le test ne joue aucune partie.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import type { Evaluation } from './campagne';
import { CAMPAGNE_MODERNE } from '../data/niveaux/campagne-moderne';
import { lireRegions } from './bandes.test-utils';
import { ecartsDeLaRegion, evaluationsDeRegion, lireCampagne, redigerBoss, redigerDefis, redigerRegions, regionsDe, REGIONS_DE_LA_CAMPAGNE, REGIONS_MODERNE_EVALUEES } from './rapport-regions';
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

describe('régions de la campagne', () => {
  it('se déduisent des niveaux : 1 à N, sans trou, 10 niveaux chacune', () => {
    const derniere = Math.ceil(CAMPAGNE.length / 10);
    expect(REGIONS_DE_LA_CAMPAGNE).toEqual(Array.from({ length: derniere }, (_, i) => i + 1));
  });

  it('chacune a sa machine dans la matrice des bandes de la CI de déploiement', () => {
    const flux = readFileSync(new URL('../../.github/workflows/deploiement.yml', import.meta.url), 'utf8');
    const matrice = /region:\s*\[([^\]]*)\]/.exec(flux)?.[1] ?? '';
    expect(matrice.split(',').map((r) => Number(r.trim()))).toEqual([...REGIONS_DE_LA_CAMPAGNE]);
  });
});

describe('campagne du DLC « Temps modernes »', () => {
  it('ses régions se déduisent de ses niveaux : 1 à 3, 10 niveaux chacune', () => {
    expect(REGIONS_MODERNE_EVALUEES).toEqual(Array.from({ length: Math.ceil(CAMPAGNE_MODERNE.length / 10) }, (_, i) => i + 1));
    expect(REGIONS_MODERNE_EVALUEES).toEqual([1, 2, 3]);
    expect(regionsDe('moderne')).toBe(REGIONS_MODERNE_EVALUEES);
    expect(regionsDe('histoire')).toBe(REGIONS_DE_LA_CAMPAGNE);
  });

  it('lit la campagne demandée et refuse le reste', () => {
    expect(lireCampagne(undefined)).toBe('histoire');
    expect(lireCampagne('')).toBe('histoire');
    expect(lireCampagne('histoire')).toBe('histoire');
    expect(lireCampagne('moderne')).toBe('moderne');
    expect(() => lireCampagne('dlc')).toThrow(/Campagne invalide/);
  });

  it('BANDES_REGIONS se lit dans les régions de la campagne testée', () => {
    expect(lireRegions('2', 'moderne')).toEqual([2]);
    expect(lireRegions(undefined, 'moderne')).toEqual([1, 2, 3]);
    expect(() => lireRegions('4', 'moderne')).toThrow(/BANDES_REGIONS invalide/);
    expect(lireRegions('11')).toEqual([11]);
  });

  it('préfixe ses écarts par « Temps modernes, région N » et titre ses sections par ses thèmes', () => {
    const evaluations = toutesLesEvaluations().filter((e) => e.niveau <= 30);
    const ecarts = ecartsDeLaRegion(evaluations, 2, 'moderne');
    expect(ecarts.length).toBeGreaterThan(0);
    for (const e of ecarts) expect(e).toMatch(/^Temps modernes, région 2 : /);
    const texte = redigerRegions(evaluations, [1, 2, 3], 'moderne');
    for (const titre of ['la Fac', 'la Manif', 'la Préfecture']) expect(texte).toContain(titre);
    expect(texte).toContain('### Temps modernes, région 3 : la Préfecture');
    expect(redigerDefis(evaluations, [1], 'moderne')).toContain('## Temps modernes : défis');
  });

  it('compte les boss tués et les victoires où le boss est passé', () => {
    const tue = { ...partie(true), bossTues: ['moderne_prefet'] };
    const passe = { ...partie(true), bossTues: [] };
    const evaluations: Evaluation[] = [{ dieu: 'plume', niveau: 30, difficulte: 'matou', bot: 'soigneux', parties: [tue, passe, partie(false)] }];
    expect(redigerBoss(evaluations, [30])).toContain('| 30 | Matou | soigneux | 1/3 | 2/3 | 1 |');
    expect(redigerBoss([], [10])).toContain('Aucun niveau de boss évalué.');
  });
});
