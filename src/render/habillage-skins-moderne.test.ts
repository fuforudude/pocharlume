// Skins du DLC portés dans l'histoire : la tour ou le héros prend son apparence du DLC (atlas à part), et chaque sprite qu'un skin du DLC
// demande existe dans l'atlas du DLC.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFS_SKINS_MODERNES } from '../data/recompenses-moderne';
import type { AtlasJson } from './atlas';
import { apparenceModerne, campagneDApparence, cibleModerneDeTour, spriteHerosModerne, spriteTireur, spriteTour } from './habillage';

const moderne = JSON.parse(readFileSync('public/sprites/atlas-moderne.json', 'utf-8')) as AtlasJson;

describe('apparence du DLC dans l’histoire', () => {
  it('la cible d’une tour est sa famille, ou `divine_<dieu>` pour la tour divine', () => {
    expect(cibleModerneDeTour('tir', 'plume')).toBe('tir');
    expect(cibleModerneDeTour('divine', 'plume')).toBe('divine_plume');
  });

  it('une tour habillée d’un skin du DLC se dessine en campagne `moderne` ; sinon, la campagne de la partie', () => {
    const skins = { tir: 'skin_moderne_tir', divine_pollen: 'skin_moderne_divine_pollen', caserne: 'skin_moderne_tir', magie: 'skin_inconnu' };
    expect(campagneDApparence('histoire', skins, 'tir')).toBe('moderne');
    expect(campagneDApparence('histoire', skins, 'divine_pollen')).toBe('moderne');
    expect(campagneDApparence('histoire', skins, 'caserne')).toBe('histoire');
    expect(campagneDApparence('histoire', skins, 'magie')).toBe('histoire');
    expect(campagneDApparence('histoire', skins, 'artillerie')).toBe('histoire');
    expect(campagneDApparence('histoire', skins, 'constructor')).toBe('histoire');
    expect(campagneDApparence('moderne', {}, 'tir')).toBe('moderne');
  });

  it('le héros de la partie prend son sprite du DLC s’il en porte le skin', () => {
    expect(spriteHerosModerne('brise_os')).toBe('moderne-heros-brise-os');
    expect(apparenceModerne({ suie: 'skin_moderne_suie' }, 'suie')).toBe(true);
    expect(apparenceModerne({ suie: 'skin_moderne_corbeau' }, 'suie')).toBe(false);
    expect(apparenceModerne({}, 'suie')).toBe(false);
  });

  it('chaque sprite qu’un skin du DLC demande est dans l’atlas du DLC', () => {
    const manquants: string[] = [];
    const voir = (nom: string | null): void => {
      if (nom !== null && !Object.hasOwn(moderne.sprites, nom)) manquants.push(nom);
    };
    for (const def of DEFS_SKINS_MODERNES) {
      if (def.cible.type === 'heros') voir(spriteHerosModerne(def.cible.heros));
      else if (def.cible.type === 'divine') voir(spriteTour('divine', 1, null, def.cible.dieu, 'moderne'));
      else {
        const famille = def.cible.famille;
        for (const [niveau, voie] of [[1, null], [2, null], [3, null], [4, 'A'], [4, 'B']] as const) {
          voir(spriteTour(famille, niveau, voie, 'charlie', 'moderne'));
          voir(spriteTireur(famille, niveau, voie, 'moderne'));
        }
      }
    }
    expect(manquants).toEqual([]);
  });
});
