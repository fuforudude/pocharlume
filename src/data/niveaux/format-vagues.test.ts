// Format compact des vagues figées : il traduit sans rien changer au contenu (les vagues des 50 niveaux sont comparées au
// générateur par niveaux.test.ts).
import { describe, expect, it } from 'vitest';
import type { Vague } from '../../engine/definitions';
import { CHAMPS_PAR_GROUPE, decoderVagues, encoderVagues } from './format-vagues';
import { VAGUES_REGIONS } from './campagne';

const VAGUES: readonly (readonly Vague[])[] = [
  [
    { paquets: [{ ennemi: 'glaneur', nombre: 5, intervalle: 0.3, chemin: 0, delai: 0 }, { ennemi: 'corbeau_noir', nombre: 12, intervalle: 0.2, chemin: 1, delai: 12.7, facteurPv: 2 }] },
    { paquets: [{ ennemi: 'la_faim', nombre: 1, intervalle: 0, chemin: 0, delai: 12 }] },
  ],
  [{ paquets: [] }],
];

describe('format compact des vagues', () => {
  it('encoder puis décoder rend les mêmes vagues, dans le même ordre de champs', () => {
    const { legende, niveaux } = encoderVagues(VAGUES);
    expect(legende).toEqual(['corbeau_noir', 'glaneur', 'la_faim']);
    const decodees = decoderVagues(legende, niveaux);
    expect(decodees).toEqual(VAGUES);
    expect(JSON.stringify(decodees)).toBe(JSON.stringify(VAGUES));
  });

  it('une vague est une suite plate de six nombres par groupe', () => {
    const { niveaux } = encoderVagues(VAGUES);
    expect(niveaux[0]?.[0]).toEqual([1, 5, 0.3, 0, 0, 1, 0, 12, 0.2, 1, 12.7, 2]);
    expect(niveaux[0]?.[0]?.length).toBe(2 * CHAMPS_PAR_GROUPE);
    expect(niveaux[1]?.[0]).toEqual([]);
  });

  it('refuse une vague tronquée ou un ennemi absent de la légende', () => {
    expect(() => decoderVagues(['glaneur'], [[[0, 5, 0.3, 0, 0]]])).toThrow('un multiple de 6');
    expect(() => decoderVagues(['glaneur'], [[[2, 5, 0.3, 0, 0, 1]]])).toThrow('absent de la légende');
    expect(() => decoderVagues(['glaneur'], [[[0, 5, 0.3, 0.5, 0, 1]]])).toThrow('un entier est attendu');
  });

  it('un groupe en couloir s’écrit avec le chemin −(couloir + 1) et se relit tel quel', () => {
    const vagues: readonly (readonly Vague[])[] = [
      [
        {
          paquets: [
            { ennemi: 'corbeau_noir', nombre: 4, intervalle: 0.5, chemin: 0, couloir: 0, delai: 0 },
            { ennemi: 'corbeau_noir', nombre: 2, intervalle: 1, chemin: 0, couloir: 2, delai: 3, facteurPv: 1.5 },
            { ennemi: 'glaneur', nombre: 3, intervalle: 1, chemin: 1, delai: 2 },
          ],
        },
      ],
    ];
    const { legende, niveaux } = encoderVagues(vagues);
    expect(niveaux[0]?.[0]).toEqual([0, 4, 0.5, -1, 0, 1, 0, 2, 1, -3, 3, 1.5, 1, 3, 1, 1, 2, 1]);
    expect(JSON.stringify(decoderVagues(legende, niveaux))).toBe(JSON.stringify(vagues));
  });

  it('les vagues décodées des 5 régions sont des groupes d’ennemis valides (nombre entier positif, intervalle et délai finis)', () => {
    for (const region of VAGUES_REGIONS) {
      for (const niveau of region) {
        for (const vague of niveau) {
          for (const p of vague.paquets) {
            expect(Number.isInteger(p.nombre) && p.nombre > 0).toBe(true);
            expect(Number.isInteger(p.chemin) && p.chemin >= 0).toBe(true);
            expect(Number.isFinite(p.intervalle) && p.intervalle >= 0).toBe(true);
            expect(Number.isFinite(p.delai) && p.delai >= 0).toBe(true);
          }
        }
      }
    }
  });
});
