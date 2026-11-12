import { describe, expect, it } from 'vitest';
import { fr } from '../i18n/fr';
import { CLES_REFUS_META, texteRefusMeta } from './raisons-meta';

/** Raisons propres à la collection et aux défis : leurs phrases sont sous `collection.refus.*`. */
const RAISONS_COLLECTION = [
  'type_inconnu',
  'eclats_insuffisants',
  'non_possede',
  'emplacement_invalide',
  'aleatoire_indisponible',
  'defi_inconnu',
  'defi_verrouille',
  // DLC « Temps modernes » : la caisse payée en badges (le code et le test de l'écran des caisses lisent collection.refus.*).
  'badges_insuffisants',
];

describe('textes de refus de la méta-progression', () => {
  it('chaque raison a une phrase qui existe dans la table de textes', () => {
    for (const [raison, cle] of Object.entries(CLES_REFUS_META)) {
      expect(Object.hasOwn(fr, cle), raison).toBe(true);
      const prefixe = RAISONS_COLLECTION.includes(raison) ? 'collection.refus' : 'meta.refus';
      expect(cle).toBe(`${prefixe}.${raison}`);
    }
    expect(texteRefusMeta('braises_insuffisantes')).toBe('Pas assez de braises.');
  });

  it('chaque phrase de refus de la table est utilisée par une raison', () => {
    const utilisees = new Set<string>(Object.values(CLES_REFUS_META));
    const cles = Object.keys(fr).filter((k) => k.startsWith('meta.refus.') || k.startsWith('collection.refus.'));
    for (const cle of cles) expect(utilisees.has(cle), cle).toBe(true);
  });

  it('les raisons de la collection, des caisses et des défis ont leur phrase', () => {
    for (const raison of RAISONS_COLLECTION) expect(Object.hasOwn(CLES_REFUS_META, raison), raison).toBe(true);
    expect(texteRefusMeta('eclats_insuffisants')).toBe('Pas assez d’éclats.');
    expect(texteRefusMeta('defi_verrouille')).toBe('Il faut d’abord les trois étoiles sur ce niveau.');
    expect(texteRefusMeta('badges_insuffisants')).toBe('Il te manque des badges : joue le DLC « Temps modernes » pour en gagner.');
    expect(texteRefusMeta('aleatoire_indisponible')).toBe('Les caisses ne peuvent pas s’ouvrir sur cet appareil.');
  });
});
