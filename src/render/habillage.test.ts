import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AtlasJson } from '../../tools/art/atlas.ts';
import { DIEUX } from '../data/dieux';
import { ENNEMIS } from '../data/ennemis';
import { TOURS } from '../data/tours';
import type { DefNiveauTour } from '../engine/definitions';
import {
  habillageSort,
  iconeFamille,
  nomPointDeTir,
  projectileTourne,
  spriteEnnemi,
  spriteImpact,
  spriteProjectile,
  spriteTireur,
  spriteTour,
  spriteUnite,
} from './habillage';

const atlas = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as AtlasJson;
const existe = (nom: string): boolean => Object.hasOwn(atlas.sprites, nom);

/** Tous les niveaux de tour du jeu : (famille, niveau, voie, définition). */
function niveauxDeTours(): { famille: 'caserne' | 'tir' | 'magie' | 'artillerie'; niveau: number; voie: 'A' | 'B' | null; def: DefNiveauTour }[] {
  const sortie: ReturnType<typeof niveauxDeTours> = [];
  for (const famille of ['caserne', 'tir', 'magie', 'artillerie'] as const) {
    const def = TOURS[famille];
    def.niveaux.forEach((d, i) => sortie.push({ famille, niveau: i + 1, voie: null, def: d }));
    for (const voie of ['A', 'B'] as const) sortie.push({ famille, niveau: 4, voie, def: def.specialisations[voie] });
  }
  return sortie;
}

describe('habillage : chaque sprite demandé existe dans l’atlas', () => {
  it('ennemis', () => {
    for (const type of Object.keys(ENNEMIS)) expect(existe(spriteEnnemi(type)), type).toBe(true);
  });

  it('héros, soldats, spectres et renforts', () => {
    const noms = new Set<string>();
    for (const dieu of Object.values(DIEUX)) {
      noms.add(dieu.heros.nom);
      for (const sort of dieu.sorts) for (const effet of sort.effets) if (effet.type === 'invoquer') noms.add(effet.unite.nom);
    }
    for (const { def } of niveauxDeTours()) {
      if (def.soldats) noms.add(def.soldats.nom);
      if (def.spectres) noms.add(def.spectres.nom);
    }
    for (const nom of noms) expect(existe(spriteUnite('soldat', nom)), nom).toBe(true);
  });

  it('tours : chaque niveau, chaque spécialisation et la tour divine', () => {
    for (const { famille, niveau, voie } of niveauxDeTours()) {
      expect(existe(spriteTour(famille, niveau, voie)), `${famille} ${String(niveau)} ${String(voie)}`).toBe(true);
    }
    expect(existe(spriteTour('divine', 1, null))).toBe(true);
  });

  it('tireurs, projectiles et impacts de chaque tour', () => {
    for (const { famille, niveau, voie, def } of niveauxDeTours()) {
      const tireur = spriteTireur(famille, niveau, voie);
      if (tireur) expect(existe(tireur), tireur).toBe(true);
      expect(existe(spriteProjectile(def.nom)), def.nom).toBe(true);
      expect(existe(spriteImpact(def.nom)), def.nom).toBe(true);
    }
  });

  it('point de tir : présent dans le sprite des tours qui en ont un', () => {
    for (const { famille, niveau, voie } of niveauxDeTours()) {
      const point = nomPointDeTir(famille);
      if (!point) continue;
      const sprite = atlas.sprites[spriteTour(famille, niveau, voie)];
      expect(sprite?.points, `${famille} ${String(niveau)}`).toHaveProperty([point]);
    }
  });

  it('sorts et icônes', () => {
    for (const [dieu, def] of Object.entries(DIEUX)) {
      def.sorts.forEach((_, i) => {
        const h = habillageSort(dieu, i);
        expect(existe(h.effet), h.effet).toBe(true);
        expect(existe(h.icone), h.icone).toBe(true);
      });
    }
    for (const f of ['caserne', 'tir', 'magie', 'artillerie', 'divine'] as const) expect(existe(iconeFamille(f)), f).toBe(true);
  });

  it('effets du rendu', () => {
    for (const nom of ['socle', 'sang', 'fumee', 'etourdi', 'onde-choc', 'impact', 'impact-cendre', 'icone-arete', 'icone-vie', 'icone-etoile']) {
      expect(existe(nom), nom).toBe(true);
    }
  });
});

describe('habillage : cas particuliers', () => {
  it('la tour de tir porte un chat tireur, pas les autres', () => {
    expect(spriteTireur('tir', 2, null)).toBe('archer-chat');
    expect(spriteTireur('tir', 4, 'A')).toBe('guetteur-chat');
    expect(spriteTireur('tir', 4, 'B')).toBe('arbaletrier-chat');
    expect(spriteTireur('caserne', 1, null)).toBeNull();
  });

  it('une clé inconnue ne lève pas d’erreur et ne lit pas les propriétés héritées', () => {
    expect(spriteUnite('soldat', 'constructor')).toBe('');
    expect(spriteProjectile('toString')).toBe('fleche');
    expect(spriteImpact('__proto__')).toBe('impact');
    expect(habillageSort('constructor', 0).effet).toBe('fumee');
  });

  it('les flèches et traits se tournent vers leur cible, pas les boules et pierres', () => {
    expect(projectileTourne('fleche')).toBe(true);
    expect(projectileTourne('pierre')).toBe(false);
  });
});
