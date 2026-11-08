import { describe, expect, it } from 'vitest';
import { fr } from '../i18n/fr';
import { importerCode, sauvegardeVide, exporterCode } from '../save';
import { TAILLE_MAX_CODE } from '../save/code';
import { CLES_IMPORT_REFUS, texteImportRefus } from './import-refus';

describe('textes de refus d’import', () => {
  it('chaque raison a une phrase, et la phrase existe dans la table de textes', () => {
    for (const [raison, cle] of Object.entries(CLES_IMPORT_REFUS)) {
      expect(Object.hasOwn(fr, cle), raison).toBe(true);
    }
  });

  it('chaque clé « import.refus » de la table de textes est utilisée par une raison', () => {
    const utilisees = new Set<string>(Object.values(CLES_IMPORT_REFUS));
    for (const cle of Object.keys(fr).filter((k) => k.startsWith('import.refus.'))) expect(utilisees.has(cle), cle).toBe(true);
  });

  it('les raisons rendues par l’import ont une phrase distincte', async () => {
    const code = await exporterCode(sauvegardeVide());
    const entrees = ['', 'x'.repeat(TAILLE_MAX_CODE + 1), 'bonjour', code.slice(0, -1)];
    const phrases = new Set<string>();
    for (const entree of entrees) {
      const resultat = await importerCode(entree);
      if (resultat.ok) throw new Error('un code invalide a été accepté');
      phrases.add(texteImportRefus(resultat.raison));
    }
    expect(phrases.size).toBe(entrees.length);
  });
});
