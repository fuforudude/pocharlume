// Mise en scène vivante du DLC : la foule réagit aux événements du moteur (humeur), sans rien dessiner pour une carte de l'histoire.
import { describe, expect, it } from 'vitest';
import { DessinSceneVivante, humeurDesEvenements } from './scene-vivante';

describe('humeur de la foule', () => {
  it('s’agite à l’annonce et au déclenchement d’un événement, quand un chemin bouge ou que le canon à eau balaie', () => {
    expect(humeurDesEvenements([])).toBeNull();
    expect(humeurDesEvenements([{ type: 'annonce_evenement', index: 0, typeEvenement: 'charge', chemin: 0, dans: 3 }])).toBe('agitee');
    expect(humeurDesEvenements([{ type: 'chemin_ouvert', chemin: 1 }])).toBe('agitee');
    expect(humeurDesEvenements([{ type: 'balayage', cy: 3, sens: 1, unites: 0 }])).toBe('agitee');
  });

  it('saute de joie pour des renforts ou une foule activée (la joie l’emporte)', () => {
    expect(humeurDesEvenements([{ type: 'evenement_niveau', index: 0, typeEvenement: 'renforts', chemin: -1 }])).toBe('joie');
    expect(humeurDesEvenements([{ type: 'chemin_ferme', chemin: 1, repli: 0 }, { type: 'foule_activee', foule: 0, x: 1, y: 1 }])).toBe('joie');
  });

  it('garde son humeur un moment, puis redevient calme ; inactive sans scène', () => {
    const scene = new DessinSceneVivante({} as CanvasRenderingContext2D, { groupes: [{ cx: 0, cy: 0 }], banderoles: [], fumigenes: [] });
    expect(scene.active).toBe(true);
    const etat = { evenements: [{ type: 'annonce_evenement', index: 0, typeEvenement: 'nasse', chemin: 0, dans: 3 }] } as unknown as Parameters<DessinSceneVivante['apresPas']>[0];
    scene.apresPas(etat, 1000);
    expect(scene.humeur(2000)).toBe('agitee');
    expect(scene.humeur(10_000)).toBe('calme');
    expect(new DessinSceneVivante({} as CanvasRenderingContext2D, undefined).active).toBe(false);
  });
});
