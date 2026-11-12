// Les cartes du DLC réunies (cartes-moderne.ts) : la fusion par décomposition écrase sans rien dire une carte dont l'identifiant existe
// déjà dans une autre région. Ce test le rend visible (relecture de la Préfecture, point 4).
import { describe, expect, it } from 'vitest';
import { CARTES_MODERNE } from './cartes-moderne';
import { CARTES_MODERNE_R1 } from './cartes-moderne-r1';
import { CARTES_MODERNE_R2 } from './cartes-moderne-r2';
import { CARTES_MODERNE_R3 } from './cartes-moderne-r3';

describe('cartes du DLC réunies', () => {
  it('aucune collision d’identifiant : autant de cartes réunies que dans les trois régions', () => {
    const regions = [CARTES_MODERNE_R1, CARTES_MODERNE_R2, CARTES_MODERNE_R3];
    const somme = regions.reduce((total, r) => total + Object.keys(r).length, 0);
    expect(Object.keys(CARTES_MODERNE)).toHaveLength(somme);
  });
});
