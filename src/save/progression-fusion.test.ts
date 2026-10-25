import { describe, expect, it } from 'vitest';
import { sauvegardeRemplie } from './aides.test-utils';
import { sauvegardeVide } from './format';
import { enregistrerVictoire, etoilesDe, fusionnerProgressions } from './progression';
import { validerSauvegarde } from './validation';

describe('fusion de deux progressions', () => {
  it('garde le niveau débloqué le plus haut et les meilleures étoiles par niveau et par difficulté', () => {
    let a = sauvegardeVide();
    a = enregistrerVictoire(a, 1, 'matou', 1);
    a = enregistrerVictoire(a, 2, 'chaton', 3);
    let b = sauvegardeVide();
    b = enregistrerVictoire(b, 1, 'matou', 3);
    b = enregistrerVictoire(b, 2, 'chaton', 1);
    b = enregistrerVictoire(b, 2, 'matou', 2);
    b = enregistrerVictoire(b, 3, 'matou', 1);

    const m = fusionnerProgressions(a, b);
    expect(m.progression.niveauMax).toBe(4);
    expect(etoilesDe(m, 1, 'matou')).toBe(3);
    expect(etoilesDe(m, 2, 'chaton')).toBe(3);
    expect(etoilesDe(m, 2, 'matou')).toBe(2);
    expect(etoilesDe(m, 3, 'matou')).toBe(1);
    expect(validerSauvegarde(m).ok).toBe(true);
  });

  it('est symétrique pour la progression', () => {
    const a = enregistrerVictoire(sauvegardeVide(), 1, 'chaton', 2);
    const b = enregistrerVictoire(enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3), 2, 'matou', 1);
    expect(fusionnerProgressions(a, b).progression).toEqual(fusionnerProgressions(b, a).progression);
  });

  it('garde les réglages et la partie de la première sauvegarde', () => {
    const a = { ...sauvegardeRemplie(), reglages: { son: 1, musique: 2, vitesse: 2 as const } };
    const m = fusionnerProgressions(a, enregistrerVictoire(sauvegardeVide(), 1, 'matou', 1));
    expect(m.reglages).toEqual(a.reglages);
    expect(m.partie).toBe(a.partie);
  });

  it('ne change rien (même objet) quand la seconde n’apporte rien', () => {
    const a = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3);
    expect(fusionnerProgressions(a, sauvegardeVide())).toBe(a);
    expect(fusionnerProgressions(a, a)).toBe(a);
  });

  it('ne modifie aucune des deux sauvegardes', () => {
    const a = enregistrerVictoire(sauvegardeVide(), 1, 'chaton', 1);
    const b = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 2);
    const copieA = structuredClone(a);
    const copieB = structuredClone(b);
    fusionnerProgressions(a, b);
    expect(a).toEqual(copieA);
    expect(b).toEqual(copieB);
  });
});
