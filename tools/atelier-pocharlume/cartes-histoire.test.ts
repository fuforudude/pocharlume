// L'atelier lit les décors des cartes de l'histoire dans leurs fichiers source. Les identifiants du DLC « Temps modernes » sont distincts
// de ceux de l'histoire (unicité testée dans cartes-moderne.test.ts) : l'atelier ne doit pourtant jamais lire une carte du DLC à la place,
// sinon les cases interdites de l'histoire
// (donc la position de la statue) seraient jugées sur un autre décor. Ce test fige, pour chaque carte de l'histoire, les décors
// lus par l'atelier et les cases interdites qui en résultent.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARTES, type CarteModele } from '../../src/data/niveaux/cartes-toutes';
import { decorVisible } from '../../src/data/niveaux/assemblage';
import { casesInterditesDuNiveau } from '../../src/data/niveaux/grille-niveau';
import { zonesBloquantes } from '../../src/data/niveaux/habillage';
import type { Carte } from '../../src/engine/definitions';
import { lireDecors } from './cartes.ts';

const RACINE = join(import.meta.dirname, '..', '..');

describe('cartes de l’histoire dans l’atelier', () => {
  it('lit chaque carte dans un fichier de l’histoire, avec exactement les décors de la carte du jeu', () => {
    for (const [id, modele] of Object.entries(CARTES as Record<string, CarteModele>)) {
      const { carte } = lireDecors(RACINE, id);
      expect(carte.fichier, id).not.toContain('moderne');
      expect(carte.decors.map((d) => [d.sprite, d.x, d.y, d.miroir]), id).toEqual(modele.decor.map((d) => [d.sprite, d.x, d.y, d.miroir === true]));
    }
  });

  it('fige les cases interdites du carrefour (niveaux 4 et 8) : la statue (18,5 ; 15), case (9, 7), est sur une case que le décor interdit', () => {
    const modele = CARTES.carrefour;
    const carte: Carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins, departHeros: modele.departHeros };
    const interdites = casesInterditesDuNiveau(carte, decorVisible(modele, carte), zonesBloquantes(modele));
    expect(interdites).toContainEqual({ cx: 9, cy: 7 });
    // Les cases interdites de la carte entière, figées : un changement du décor ou de la règle de calcul doit être voulu.
    expect(interdites.map((c) => `${String(c.cx)},${String(c.cy)}`).join(' ')).toBe('4,0 5,0 6,0 8,0 10,0 13,0 14,0 5,1 6,1 8,1 11,1 12,1 13,1 14,1 0,2 1,2 2,2 3,2 4,2 8,2 11,2 12,2 4,3 8,3 11,3 12,3 14,3 15,3 4,4 5,4 6,4 7,4 8,4 9,4 10,4 0,5 4,5 10,5 4,6 10,6 11,6 12,6 13,6 14,6 15,6 0,7 1,7 2,7 3,7 4,7 6,7 7,7 8,7 9,7 13,7 8,8 9,8 13,8');
  });
});
