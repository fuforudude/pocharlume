// Données des ennemis et boss des régions 6 à 10 (jalon 4) : ids, noms, valeurs de la spec.
import { describe, expect, it } from 'vitest';
import type { DefEnnemi } from '../engine/definitions';
import { fr } from '../i18n/fr';
import { ENNEMIS } from './ennemis';
import { INFINI } from './infini';

const table: Readonly<Record<string, DefEnnemi>> = ENNEMIS;

const REGIONS: Readonly<Record<number, { ennemis: readonly string[]; boss: string }>> = {
  6: { ennemis: ['fossoyeur', 'creux', 'chauve_souris'], boss: 'roi_fosses' },
  7: { ennemis: ['fantassin', 'porte_banniere', 'cavalier'], boss: 'prince_croise' },
  8: { ennemis: ['flagellant', 'inquisiteur', 'exorciste'], boss: 'grand_inquisiteur' },
  9: { ennemis: ['garde_royal', 'arbaletrier_elite', 'chevalier'], boss: 'roi_fou' },
  10: { ennemis: ['acolyte_cendre', 'ange_cendre'], boss: 'soleil_bleme' },
};

describe('ennemis des régions 6 à 10', () => {
  it('les 14 ennemis et 5 boss existent, avec un nom traduit', () => {
    let nombre = 0;
    for (const { ennemis, boss } of Object.values(REGIONS)) {
      for (const id of ennemis) {
        expect(table[id]?.boss, id).toBe(false);
        expect(Object.hasOwn(fr, table[id]?.nom ?? ''), id).toBe(true);
        nombre++;
      }
      expect(table[boss]?.boss, boss).toBe(true);
      expect(Object.hasOwn(fr, table[boss]?.nom ?? ''), boss).toBe(true);
    }
    expect(nombre).toBe(14);
  });

  it('les stats de la spec', () => {
    expect(ENNEMIS.chauve_souris.volant).toBe(true);
    expect(ENNEMIS.chauve_souris.pouvoirs?.essaim).toBe(5);
    expect(ENNEMIS.fantassin.armure).toBe(0.6);
    expect(ENNEMIS.cavalier.armure).toBe(0.3);
    expect(ENNEMIS.cavalier.vitesse).toBeGreaterThan(ENNEMIS.chien_errant.vitesse * 0.8);
    expect(ENNEMIS.exorciste.resistance).toBe(0.3);
    expect(ENNEMIS.garde_royal.armure).toBe(0.9);
    expect(ENNEMIS.arbaletrier_elite.distance?.portee).toBe(3.5);
    expect(ENNEMIS.chevalier).toMatchObject({ armure: 0.6, resistance: 0.3 });
    expect(ENNEMIS.acolyte_cendre.resistance).toBe(0.3);
    expect(ENNEMIS.ange_cendre).toMatchObject({ volant: true, armure: 0.3, resistance: 0.6 });
  });

  it('les mécaniques de la spec', () => {
    expect(ENNEMIS.fossoyeur.pouvoirs?.enterrement).toEqual({ rayon: 2, facteur: 2 });
    expect(ENNEMIS.creux.pouvoirs?.relevement).toEqual({ fois: 1, pv: 0.5, delai: 1.5, sauf: 'magique' });
    expect(ENNEMIS.porte_banniere.pouvoirs?.aura).toEqual({ rayon: 2, vitesse: 0.25 });
    expect(ENNEMIS.cavalier.pouvoirs?.renversement).toEqual({ etourdissement: 2 });
    expect(ENNEMIS.flagellant.pouvoirs?.rage).toEqual({ pv: 0.5, vitesse: 0.5, degats: 0.5 });
    expect(ENNEMIS.inquisiteur.pouvoirs?.periodiques).toEqual([{ cadence: 8, actions: [{ type: 'figer_tour', nombre: 1, duree: 3, rayon: 2.5 }] }]);
    expect(ENNEMIS.exorciste.pouvoirs?.periodiques).toEqual([{ cadence: 6, actions: [{ type: 'bannir', rayon: 2, etourdissement: 2 }] }]);
    expect(ENNEMIS.acolyte_cendre.pouvoirs?.periodiques).toEqual([{ cadence: 12, actions: [{ type: 'invoquer', ennemi: 'creux', nombre: 1, ecart: 0.5 }] }]);
  });

  it('les boss de la spec', () => {
    expect(ENNEMIS.roi_fosses.pouvoirs?.periodiques).toEqual([{ cadence: 15, actions: [{ type: 'relever_morts', nombre: 4, pv: 0.5 }] }]);
    expect(ENNEMIS.prince_croise.pouvoirs?.aura).toEqual({ rayon: 3, vitesse: 0.25 });
    expect(ENNEMIS.prince_croise.pouvoirs?.periodiques).toEqual([{ cadence: 10, actions: [{ type: 'charger', duree: 2, vitesse: 3 }] }]);
    expect(ENNEMIS.grand_inquisiteur.pouvoirs?.insensibleRalentissement).toBe(true);
    expect(ENNEMIS.grand_inquisiteur.pouvoirs?.periodiques).toEqual([{ cadence: 10, actions: [{ type: 'figer_tour', nombre: 2, duree: 4 }] }]);
    expect(ENNEMIS.roi_fou.pouvoirs?.paliers?.map((p) => p.pv)).toEqual([0.75, 0.5, 0.25]);
    for (const palier of ENNEMIS.roi_fou.pouvoirs?.paliers ?? []) {
      expect(palier.actions).toEqual([
        { type: 'invoquer', ennemi: 'garde_royal', nombre: 4, ecart: expect.any(Number) as number },
        { type: 'invulnerabilite', duree: 3 },
      ]);
    }
    const phases = ENNEMIS.soleil_bleme.pouvoirs?.periodiques ?? [];
    expect(phases.map((p) => p.phase)).toEqual([[1, 0.66], [0.66, 0.33], [0.33, 0]]);
    expect(phases[0]).toMatchObject({ cadence: 12, actions: [{ type: 'aveugler', rayon: 4, portee: 0.3, duree: 4 }] });
    expect(phases[1]).toMatchObject({ cadence: 10, actions: [{ type: 'invoquer', ennemi: 'ange_cendre', nombre: 2 }] });
    expect(phases[2]).toMatchObject({ actions: [{ type: 'affamer', rayon: 4, cadence: 0.3 }] });
  });

  it('les ennemis appelés existent et les phases se suivent sans trou ni recouvrement', () => {
    for (const [id, def] of Object.entries(table)) {
      const actions = [...(def.pouvoirs?.paliers ?? []).flatMap((p) => p.actions), ...(def.pouvoirs?.periodiques ?? []).flatMap((p) => p.actions)];
      for (const action of actions) if (action.type === 'invoquer') expect(Object.hasOwn(ENNEMIS, action.ennemi), `${id} appelle ${action.ennemi}`).toBe(true);
      const phases = (def.pouvoirs?.periodiques ?? []).flatMap((p) => (p.phase ? [p.phase] : []));
      phases.forEach((phase, i) => {
        expect(phase[0], id).toBeGreaterThan(phase[1]);
        const suivante = phases[i + 1];
        if (suivante) expect(suivante[0], id).toBe(phase[1]);
      });
    }
  });

  it('les boss sont insensibles à l’étourdissement et valent des vies et une prime de boss', () => {
    for (const { boss } of Object.values(REGIONS)) {
      expect(table[boss]?.insensibleEtourdissement, boss).toBe(true);
      expect(table[boss]?.coutVies, boss).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('paramètres de l’infini', () => {
  it('chaque région liste ses ennemis propres et son boss, dans l’ordre de la spec', () => {
    expect(INFINI.regions).toHaveLength(10);
    expect(INFINI.regions.slice(5).map((r) => r.boss)).toEqual(['roi_fosses', 'prince_croise', 'grand_inquisiteur', 'roi_fou', 'soleil_bleme']);
    for (const [region, { ennemis, boss }] of Object.entries(REGIONS)) {
      expect(INFINI.regions[Number(region) - 1]).toEqual({ ennemis, boss });
    }
  });
});
