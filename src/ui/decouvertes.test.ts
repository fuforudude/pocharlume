import { describe, expect, it } from 'vitest';
import { DIEUX } from '../data/dieux';
import { TOURS } from '../data/tours';
import { apportTour, decouvertesDuNiveau } from './decouvertes';

describe('nouvelles découvertes d’un niveau', () => {
  it('niveau 1 : les quatre tours de base, avec leur sprite de niveau 1', () => {
    const d = decouvertesDuNiveau(1, 'plume');
    expect(d.map((x) => x.id)).toEqual(['caserne-1', 'tir-1', 'magie-1', 'artillerie-1']);
    expect(d.map((x) => x.icone)).toEqual(['tour-caserne-1', 'tour-tir-1', 'tour-magie-1', 'tour-artillerie-1']);
    expect(d[1]?.nom).toBe('Clocher des Archers');
  });

  it('niveau 2 : les niveaux 2 de la caserne et des archers, nommés comme tels', () => {
    const d = decouvertesDuNiveau(2, 'plume');
    expect(d.map((x) => x.id)).toEqual(['caserne-2', 'tir-2']);
    expect(d[0]?.nom).toBe('Grenier des Griffes, niveau 2');
  });

  it('niveau 6 : les deux spécialisations de la caserne ; niveau 10 : la tour divine du dieu choisi', () => {
    expect(decouvertesDuNiveau(6, 'plume').map((x) => x.id)).toEqual(['caserne-4A', 'caserne-4B']);
    const divine = decouvertesDuNiveau(10, 'pollen');
    expect(divine.map((x) => x.id)).toEqual(['divine']);
    expect(divine[0]?.apport).toContain(String(DIEUX.pollen.tourDivine.cout));
    expect(divine[0]?.icone).not.toBe(decouvertesDuNiveau(10, 'charlie')[0]?.icone);
  });

  it('rien de neuf à partir du niveau 11', () => {
    expect(decouvertesDuNiveau(11, 'plume')).toEqual([]);
    expect(decouvertesDuNiveau(57, 'charlie')).toEqual([]);
  });

  it('les chiffres viennent des données : soldats, ou dégâts, cadence et portée', () => {
    const caserne = TOURS.caserne.niveaux[1];
    const s = caserne.soldats;
    expect(apportTour(caserne)).toBe(`${String(s?.nombre)} soldats de ${String(s?.pv)} PV qui barrent le chemin, ${String(s?.degats[0])} à ${String(s?.degats[1])} dégâts par coup.`);
    const tir = TOURS.tir.niveaux[0];
    expect(apportTour(tir)).toBe(`${String(tir.degats[0])} à ${String(tir.degats[1])} dégâts physiques toutes les 0,8 s, portée 3,5.`);
    expect(apportTour(TOURS.magie.niveaux[0])).toContain('magiques');
    expect(apportTour(TOURS.artillerie.niveaux[0])).toContain('en zone');
  });

  it('aucun texte ne laisse de clé ni de paramètre non remplacé', () => {
    for (let n = 1; n <= 10; n++) {
      for (const d of decouvertesDuNiveau(n, 'charlie')) {
        expect(d.nom, d.id).not.toMatch(/[{}]|^(tour|famille|decouverte)\./);
        expect(d.apport, d.id).not.toMatch(/[{}]|NaN|undefined/);
      }
    }
  });
});
