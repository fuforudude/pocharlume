import { describe, expect, it } from 'vitest';
import { fr } from '../i18n/fr';
import { CLES_REFUS, texteRefus } from './refus';

describe('textes de refus', () => {
  it('chaque raison a une phrase, et la phrase existe dans la table de textes', () => {
    for (const [raison, cle] of Object.entries(CLES_REFUS)) {
      expect(Object.hasOwn(fr, cle), raison).toBe(true);
    }
    expect(texteRefus('aretes_insuffisantes')).toBe('Pas assez d’arêtes.');
  });

  it('le défi Fer dit pourquoi un type de tour est refusé', () => {
    expect(texteRefus('famille_interdite')).toBe('Ce défi n’autorise pas ce type de tour.');
  });

  it('une seule tour divine par partie, et un élément pas encore débloqué dit à quel niveau il s’ouvre', () => {
    expect(texteRefus('une_seule_divine')).toContain('Une seule tour divine par partie');
    expect(texteRefus('non_debloque', 4)).toBe('Se débloque au niveau 4.');
    expect(texteRefus('non_debloque')).toBe('Pas encore débloqué à ce niveau.');
  });

  it('chaque clé de refus de la table de textes est utilisée par une raison', () => {
    const utilisees = new Set<string>([...Object.values(CLES_REFUS), 'refus.non_debloque_au']);
    for (const cle of Object.keys(fr).filter((k) => k.startsWith('refus.'))) expect(utilisees.has(cle), cle).toBe(true);
  });
});
