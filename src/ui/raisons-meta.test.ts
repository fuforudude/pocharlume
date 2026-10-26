import { describe, expect, it } from 'vitest';
import { fr } from '../i18n/fr';
import { CLES_REFUS_META, texteRefusMeta } from './raisons-meta';

describe('textes de refus de la méta-progression', () => {
  it('chaque raison a une phrase qui existe dans la table de textes', () => {
    for (const [raison, cle] of Object.entries(CLES_REFUS_META)) {
      expect(Object.hasOwn(fr, cle), raison).toBe(true);
      expect(cle).toBe(`meta.refus.${raison}`);
    }
    expect(texteRefusMeta('braises_insuffisantes')).toBe('Pas assez de braises.');
  });

  it('chaque phrase de refus de la table est utilisée par une raison', () => {
    const utilisees = new Set<string>(Object.values(CLES_REFUS_META));
    for (const cle of Object.keys(fr).filter((k) => k.startsWith('meta.refus.'))) expect(utilisees.has(cle), cle).toBe(true);
  });
});
