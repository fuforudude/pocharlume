// Classement des écarts en imposés et suspendus : les régions à deux chiffres (10) comptent comme les autres.
import { describe, expect, it } from 'vitest';
import { ecartsImposes, ecartsSelonRegion, estSuspendu, REGIONS_SUSPENDUES } from './bandes';

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

  it('suspend toutes les bandes de la région 11, le temps que les bots sachent jouer ses gimmicks', () => {
    expect(REGIONS_SUSPENDUES).toEqual([11]);
    for (const phrase of ['Région 11 : Chaton (Plume) : a', 'Région 11 : Défi Fer : c', 'Région 11 : Sans défense (Pollen) : b']) expect(estSuspendu(phrase), phrase).toBe(true);
    expect(estSuspendu('Région 1 : Chaton (Plume) : a')).toBe(false);
    expect(ecartsSelonRegion(11, ['Région 11 : Chaton : a'])).toEqual([]);
    expect(ecartsSelonRegion(10, ['Région 10 : Chaton : a'])).toEqual(['Région 10 : Chaton : a']);
  });
});
