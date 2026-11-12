// Textes des capacités de famille du DLC « Temps modernes » : la bulle d'une tour à construire les dit dans la campagne moderne (et
// seulement là), et le Bestiaire montre la ligne « Capacité DLC » de chaque famille.
import { describe, expect, it } from 'vitest';
import { CAPACITES_CAMPAGNE } from '../data/capacites-campagne';
import { FAMILLES } from '../data/tours';
import { CONFIG, niveauEssai } from '../engine/aides.test-utils';
import type { IdCampagne } from '../engine/definitions';
import { creerPartie } from '../engine/partie';
import { t } from '../i18n';
import { contenuDeTour } from './bestiaire-logique';
import { notesCapacite, texteCapacite } from './bulle-contenus';

function partie(campagne?: IdCampagne) {
  const n = niveauEssai();
  return creerPartie(campagne === undefined ? n : { ...n, campagne }, CONFIG);
}

describe('capacités de famille dans les bulles et le Bestiaire', () => {
  it('chaque capacité a son texte, chiffres compris', () => {
    for (const famille of FAMILLES) {
      const capacite = CAPACITES_CAMPAGNE.moderne[famille];
      if (!capacite) throw new Error(`pas de capacité pour ${famille}`);
      const texte = texteCapacite(capacite);
      expect(texte, famille).not.toMatch(/\{|\}/);
      expect(texte.length, famille).toBeGreaterThan(20);
    }
    expect(texteCapacite({ type: 'piquet', reduction: 0.25, soldats: 2 })).toContain('25');
    expect(texteCapacite({ type: 'renvoi', chaque: 3, degats: 9 })).toMatch(/9 dégâts.*sur 3/);
    expect(texteCapacite({ type: 'sono', rayon: 1, ralentissement: 0.15, volants: true })).toContain('15');
  });

  it('la bulle d’une tour la dit dans la campagne moderne, pas dans l’histoire ni pour la tour divine', () => {
    const moderne = partie('moderne');
    expect(notesCapacite(moderne, 'caserne').join(' ')).toContain('Piquet');
    expect(notesCapacite(moderne, 'artillerie').join(' ')).toContain('Perçage');
    expect(notesCapacite(moderne, 'divine')).toEqual([]);
    expect(notesCapacite(partie(), 'caserne')).toEqual([]);
    expect(notesCapacite(partie('histoire'), 'tir')).toEqual([]);
  });

  it('le Bestiaire du DLC montre la ligne « Capacité DLC » de la famille, pas pour la tour divine ni dans le Bestiaire de l’histoire', () => {
    for (const famille of FAMILLES) {
      const entree = { id: `${famille}-1`, famille, palier: 1, voie: null, dieu: null, sprite: '', niveau: 1, ouvert: true } as never;
      expect(contenuDeTour(entree).lignes.some((l) => l.libelle === t('bulle.tour.capacite_dlc')), famille).toBe(false);
      expect(contenuDeTour(entree, 'histoire').lignes.some((l) => l.libelle === t('bulle.tour.capacite_dlc')), famille).toBe(false);
      const contenu = contenuDeTour(entree, 'moderne');
      const ligne = contenu.lignes.find((l) => l.libelle === t('bulle.tour.capacite_dlc'));
      expect(ligne?.valeur, famille).toBe(texteCapacite(CAPACITES_CAMPAGNE.moderne[famille] ?? { type: 'percage', ignoreArmure: 0 }));
    }
    const divine = contenuDeTour({ id: 'divine', famille: 'divine', palier: 1, voie: null, dieu: 'plume', sprite: '', niveau: 1, ouvert: true } as never, 'moderne');
    expect(divine.lignes.some((l) => l.libelle === t('bulle.tour.capacite_dlc'))).toBe(false);
  });
});
