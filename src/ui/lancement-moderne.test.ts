// Lancement et reprise dans la bonne campagne : l'avertissement « tu perds ta partie » dit si elle vient du DLC, et les défis du DLC
// s'ouvrent d'après la progression du DLC (la vue `sauvegardeDeCampagne`), pas celle de l'histoire.
import { describe, expect, it } from 'vitest';
import { enregistrerVictoire, enregistrerVictoireModerne, sauvegardeDeCampagne, sauvegardeVide, type ChoixPartie, type Reprise } from '../save';
import { configDuChoix, detailPerte, partieEnCoursDe } from './lancement';

const reprise = (champs: Partial<Reprise>): Reprise => ({ niveau: 7, vague: 3, etat: {} as Reprise['etat'], ...champs });

describe('partie en cours et avertissement', () => {
  it('rien à reprendre : null', () => {
    expect(partieEnCoursDe(null)).toBeNull();
  });

  it('une partie du DLC garde sa campagne, une partie de l’histoire n’en a pas', () => {
    expect(partieEnCoursDe(reprise({ campagne: 'moderne' }))).toEqual({ niveau: 7, vague: 3, campagne: 'moderne' });
    expect(partieEnCoursDe(reprise({}))).toEqual({ niveau: 7, vague: 3 });
    expect(partieEnCoursDe(reprise({ carte: 'prairie' }))).toEqual({ niveau: 7, vague: 3, infini: true });
  });

  it('l’avertissement précise si la partie vient du DLC', () => {
    expect(detailPerte({ niveau: 7, vague: 3, campagne: 'moderne' })).toContain('Temps modernes');
    expect(detailPerte({ niveau: 7, vague: 3 })).not.toContain('Temps modernes');
    expect(detailPerte({ niveau: 7, vague: 3, infini: true })).toContain('infinie');
    for (const c of [{ campagne: 'moderne' as const }, {}]) expect(detailPerte({ niveau: 7, vague: 3, ...c })).toContain('niveau 7');
  });
});

describe('défi du DLC : la progression du DLC décide', () => {
  const choix: ChoixPartie = { dieu: 'charlie', heros: 'charlie', objets: [] };

  it('ouvert avec les 3 étoiles du DLC, fermé avec celles de l’histoire seules', () => {
    const dlc = enregistrerVictoireModerne(sauvegardeVide(), 1, 'matou', 3);
    const histoire = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3);
    const demande = { niveau: 1, defi: 'heroique' } as const;
    expect(configDuChoix(sauvegardeDeCampagne(dlc, 'moderne'), choix, 'matou', 1, demande).ok).toBe(true);
    expect(configDuChoix(sauvegardeDeCampagne(histoire, 'moderne'), choix, 'matou', 1, demande)).toEqual({ ok: false, raison: 'defi_verrouille' });
    expect(configDuChoix(sauvegardeDeCampagne(histoire, 'histoire'), choix, 'matou', 1, demande).ok).toBe(true);
  });
});
