// Les cartes du DLC réunies (cartes-moderne.ts) : la fusion par décomposition écrase sans rien dire une carte dont l'identifiant existe
// déjà dans une autre région. Ce test le rend visible (relecture de la Préfecture, point 4).
import { describe, expect, it } from 'vitest';
import { CARTES } from './cartes-toutes';
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

  it('identifiants uniques dans tout le jeu : histoire et DLC réunis (clés et champ id)', () => {
    const histoire = Object.entries(CARTES).map(([cle, carte]) => ({ cle, id: carte.id }));
    const dlc = Object.entries(CARTES_MODERNE).map(([cle, carte]) => ({ cle, id: carte.id }));
    for (const { cle, id } of [...histoire, ...dlc]) expect(id, `clé ${cle}`).toBe(cle);
    const tous = [...histoire, ...dlc].map((c) => c.id);
    const doublons = tous.filter((id, i) => tous.indexOf(id) !== i);
    expect(doublons).toEqual([]);
  });
});
