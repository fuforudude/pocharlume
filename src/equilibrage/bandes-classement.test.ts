// Classement des écarts en imposés et suspendus : les régions à deux chiffres (10) comptent comme les autres.
import { describe, expect, it } from 'vitest';
import { ecartsImposes, ecartsSelonRegion, estSuspendu, REGIONS_MODERNE_SUSPENDUES, REGIONS_SUSPENDUES } from './bandes';

describe('écarts suspendus et imposés', () => {
  it('reconnaît Matou et Vieux Sage, avec ou sans numéro de région, y compris la région 10', () => {
    for (const phrase of ['Matou (Plume) : x', 'Vieux Sage : y', 'Région 3 : Matou (Pollen) : z', 'Région 10 : Matou : courbe', 'Région 10 : Vieux Sage (Charlie) : w']) {
      expect(estSuspendu(phrase), phrase).toBe(true);
    }
  });

  it('garde imposés Chaton, sans défense, défis et puissance', () => {
    const imposes = ['Région 10 : Chaton (Plume) : a', 'Région 7 : Sans défense (Pollen) : b', 'Région 10 : Défi Fer : c', 'Puissance : d'];
    for (const phrase of imposes) expect(estSuspendu(phrase), phrase).toBe(false);
    expect(ecartsImposes([...imposes, 'Région 10 : Matou : e'])).toEqual(imposes);
  });

  it('impose les bandes de la région 11 depuis que les bots jouent ses gimmicks : aucune région n’est suspendue', () => {
    expect(REGIONS_SUSPENDUES).toEqual([]);
    for (const phrase of ['Région 11 : Chaton (Plume) : a', 'Région 11 : Défi Fer : c', 'Région 11 : Sans défense (Pollen) : b']) expect(estSuspendu(phrase), phrase).toBe(false);
    expect(estSuspendu('Région 11 : Matou : e')).toBe(true);
    expect(ecartsSelonRegion(11, ['Région 11 : Chaton : a'])).toEqual(['Région 11 : Chaton : a']);
    expect(ecartsSelonRegion(10, ['Région 10 : Chaton : a'])).toEqual(['Région 10 : Chaton : a']);
  });
});

describe('écarts des régions du DLC « Temps modernes »', () => {
  it('mêmes familles suspendues que l’histoire, avec le préfixe « Temps modernes, région N »', () => {
    expect(estSuspendu('Temps modernes, région 2 : Matou (Plume) : x')).toBe(true);
    expect(estSuspendu('Temps modernes, région 3 : Vieux Sage : y')).toBe(true);
    for (const phrase of ['Temps modernes, région 1 : Chaton (Plume) : a', 'Temps modernes, région 2 : Sans défense (Pollen) : b', 'Temps modernes, région 3 : Défi Fer : c']) {
      expect(estSuspendu(phrase), phrase).toBe(false);
    }
    expect(ecartsImposes(['Temps modernes, région 1 : Défi Héroïque : a', 'Temps modernes, région 1 : Matou : b'])).toEqual(['Temps modernes, région 1 : Défi Héroïque : a']);
  });

  it('aucune région du DLC n’est suspendue, quelle que soit la liste de l’histoire', () => {
    expect(REGIONS_MODERNE_SUSPENDUES).toEqual([]);
    expect(ecartsSelonRegion(1, ['Temps modernes, région 1 : Chaton : a'], 'moderne')).toEqual(['Temps modernes, région 1 : Chaton : a']);
  });
});
