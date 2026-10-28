import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGLES } from '../data/regles';
import { TUILE } from './camera';
import { DECALAGE_BASE_TOUR } from './suivi';

interface CadreJson { dx: number; dy: number; largeur: number; hauteur: number }
interface SpriteJson { ancre: { x: number; y: number }; animations: { repos: { cadres: CadreJson[] } } }

const SPRITES = (JSON.parse(readFileSync('public/sprites/atlas.json', 'utf8')) as { sprites: Record<string, SpriteJson> }).sprites;
const TOURS = Object.entries(SPRITES).filter(([nom]) => nom.startsWith('tour-'));
const DEMI_CASE = (REGLES.tailleCase * TUILE) / 2;

describe('tours centrées dans leur case', () => {
  it('trouve les sprites de tour de l’atlas', () => {
    expect(TOURS.length).toBeGreaterThanOrEqual(20);
  });

  it('le pied de chaque tour, une fois décalé, reste dans la moitié basse de sa case, jamais dans la case voisine', () => {
    for (const [nom, sprite] of TOURS) {
      const bas = Math.max(...sprite.animations.repos.cadres.map((c) => c.dy + c.hauteur)) - sprite.ancre.y + DECALAGE_BASE_TOUR;
      expect(bas, nom).toBeGreaterThan(0);
      expect(bas, nom).toBeLessThanOrEqual(DEMI_CASE);
    }
  });

  it('chaque tour est centrée à moins de 2 pixels près dans la largeur de la case (l’ancre est au milieu)', () => {
    for (const [nom, sprite] of TOURS) {
      const gauche = Math.min(...sprite.animations.repos.cadres.map((c) => c.dx)) - sprite.ancre.x;
      const droite = Math.max(...sprite.animations.repos.cadres.map((c) => c.dx + c.largeur)) - sprite.ancre.x;
      expect(Math.abs(gauche + droite) / 2, nom).toBeLessThanOrEqual(2);
      expect(droite - gauche, nom).toBeLessThanOrEqual(REGLES.tailleCase * TUILE);
    }
  });
});
