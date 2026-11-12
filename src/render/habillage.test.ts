import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AtlasJson } from '../../tools/art/atlas.ts';
import { DIEUX } from '../data/dieux';
import { IDS_FAMILIERS } from '../data/collection';
import { ENNEMIS } from '../data/ennemis';
import { HEROS } from '../data/heros';
import { BRANCHES_ARBRE, IDS_DIEUX, IDS_HEROS, IDS_OBJETS } from '../data/meta';
import { TOURS } from '../data/tours';
import type { DefNiveauTour } from '../engine/definitions';
import {
  effetObjet,
  habillageSort,
  iconeBranche,
  iconeDieu,
  iconeFamille,
  iconeObjet,
  idHerosDe,
  nomPointDeTir,
  portraitHeros,
  projectileTourne,
  spriteEnnemi,
  spriteEnnemiElite,
  spriteFamilier,
  spriteImpact,
  spriteProjectile,
  spriteStructure,
  spriteTireur,
  spriteTour,
  spriteUnite,
} from './habillage';

const atlas = JSON.parse(readFileSync('public/sprites/atlas.json', 'utf-8')) as AtlasJson;
const existe = (nom: string): boolean => Object.hasOwn(atlas.sprites, nom);
/** L'atlas à part du DLC « Temps modernes » (chargé seulement pour une partie de cette campagne). */
const atlasModerne = JSON.parse(readFileSync('public/sprites/atlas-moderne.json', 'utf-8')) as AtlasJson;
const existeModerne = (nom: string): boolean => Object.hasOwn(atlasModerne.sprites, nom);
/** Un ennemi du DLC : son sprite est dans l'atlas du DLC, pas dans celui de l'histoire. */
const estModerne = (type: string): boolean => type.startsWith('moderne_');

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
  // Ennemis des régions 6 à 10 (jalon 4) dont les sprites arrivent avec la tâche « Sprites » : vider cette liste à la fusion.
  const SPRITES_A_VENIR = new Set<string>();

  it('ennemis', () => {
    for (const type of Object.keys(ENNEMIS)) {
      if (SPRITES_A_VENIR.has(type)) continue;
      if (estModerne(type)) expect(existeModerne(spriteEnnemi(type)), type).toBe(true);
      else expect(existe(spriteEnnemi(type)), type).toBe(true);
    }
  });

  it('chaque ennemi ordinaire a sa version d’élite (les boss ne sont jamais élites ; le DLC n’en a pas encore, le rendu reprend alors le sprite de base)', () => {
    for (const [type, def] of Object.entries(ENNEMIS)) {
      if ((def as { boss: boolean }).boss || SPRITES_A_VENIR.has(type) || estModerne(type)) continue;
      expect(existe(spriteEnnemiElite(type)), type).toBe(true);
    }
  });

  it('familiers et effets d’état du jalon 3', () => {
    for (const id of IDS_FAMILIERS) expect(existe(spriteFamilier(id)), id).toBe(true);
    for (const nom of ['effet-nuage-toxique', 'effet-brulure', 'effet-tour-feu', 'effet-tour-affamee', 'effet-plongee']) {
      expect(existe(nom), nom).toBe(true);
    }
  });

  it('un ennemi de la liste « sprites à venir » dont le sprite existe en est retiré', () => {
    for (const type of SPRITES_A_VENIR) expect(existe(spriteEnnemi(type)), `${type} : retirer de SPRITES_A_VENIR`).toBe(false);
  });

  it('héros, soldats, spectres et renforts', () => {
    const noms = new Set<string>();
    for (const dieu of Object.values(DIEUX)) {
      noms.add(dieu.heros.nom);
      for (const sort of dieu.sorts) for (const effet of sort.effets) if (effet.type === 'invoquer') noms.add(effet.unite.nom);
      if (dieu.tourDivine.soldats) noms.add(dieu.tourDivine.soldats.nom);
    }
    for (const heros of Object.values(HEROS)) noms.add(heros.nom);
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

  it('la tour divine de chaque dieu a son sprite', () => {
    expect(spriteTour('divine', 1, null, 'plume')).toBe('tour-sanctuaire');
    expect(spriteTour('divine', 1, null, 'pollen')).toBe('tour-atelier');
    expect(spriteTour('divine', 1, null, 'charlie')).toBe('tour-totem');
    expect(spriteTour('divine', 1, null, 'constructor')).toBe('tour-totem');
    for (const dieu of IDS_DIEUX) expect(existe(spriteTour('divine', 1, null, dieu)), dieu).toBe(true);
  });

  it('icônes des dieux, portraits des héros, icônes des objets et des branches de l’arbre', () => {
    for (const dieu of IDS_DIEUX) expect(existe(iconeDieu(dieu)), dieu).toBe(true);
    for (const heros of IDS_HEROS) expect(existe(portraitHeros(heros)), heros).toBe(true);
    for (const objet of IDS_OBJETS) {
      expect(existe(iconeObjet(objet)), objet).toBe(true);
      expect(existe(effetObjet(objet)), objet).toBe(true);
    }
    for (const branche of BRANCHES_ARBRE) expect(existe(iconeBranche(branche)), branche).toBe(true);
    for (const nom of ['icone-competence', 'icone-cadenas', 'icone-braise']) expect(existe(nom), nom).toBe(true);
  });

  it('structures, pièges, zones et effets des mécaniques du jalon 2', () => {
    expect(existe(spriteStructure('unite.tourelle_de_l_atelier'))).toBe(true);
    for (const nom of [
      'piege', 'effet-voile-nuit-tuile', 'effet-ingeniosite', 'effet-soin', 'effet-rage', 'effet-execution', 'effet-ombre', 'effet-gel',
    ]) {
      expect(existe(nom), nom).toBe(true);
    }
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
    expect(effetObjet('constructor')).toBe('fumee');
  });

  it('noms d’élites, de familiers et de héros', () => {
    expect(spriteEnnemiElite('chien_errant')).toBe('chien-errant-elite');
    expect(spriteFamilier('familier_papillon_nuit')).toBe('familier-papillon-nuit');
    expect(idHerosDe('heros.brise_os')).toBe('brise_os');
    expect(idHerosDe('unite.chat_de_grange')).toBeNull();
  });

  it('les flèches et traits se tournent vers leur cible, pas les boules et pierres', () => {
    expect(projectileTourne('fleche')).toBe(true);
    expect(projectileTourne('pierre')).toBe(false);
  });
});

describe('habillage du DLC « Temps modernes » : les sprites moderne-* à la place des originaux, avec les mêmes animations', () => {
  const tours = niveauxDeTours();

  it('dans la campagne moderne, chaque tour et chaque tour divine prend son sprite DLC, présent dans l’atlas du DLC', () => {
    for (const { famille, niveau, voie } of tours) {
      const nom = spriteTour(famille, niveau, voie, 'charlie', 'moderne');
      expect(nom.startsWith('moderne-'), nom).toBe(true);
      expect(existeModerne(nom), nom).toBe(true);
    }
    for (const dieu of IDS_DIEUX) expect(existeModerne(spriteTour('divine', 1, null, dieu, 'moderne')), dieu).toBe(true);
  });

  it('contrat de conformité : chaque sprite DLC a les animations (noms et nombre d’images) de l’original qu’il remplace', () => {
    const paires: [string, string][] = [];
    for (const { famille, niveau, voie } of tours) {
      paires.push([spriteTour(famille, niveau, voie, 'charlie', 'moderne'), spriteTour(famille, niveau, voie)]);
      const tireur = spriteTireur(famille, niveau, voie);
      const tireurModerne = spriteTireur(famille, niveau, voie, 'moderne');
      if (tireur && tireurModerne) paires.push([tireurModerne, tireur]);
    }
    for (const dieu of IDS_DIEUX) paires.push([spriteTour('divine', 1, null, dieu, 'moderne'), spriteTour('divine', 1, null, dieu)]);
    for (const [moderne, original] of paires) {
      const m = atlasModerne.sprites[moderne];
      const o = atlas.sprites[original];
      expect(Object.keys(m?.animations ?? {}).sort(), `${moderne} / ${original}`).toEqual(Object.keys(o?.animations ?? {}).sort());
      for (const [anim, a] of Object.entries(o?.animations ?? {})) {
        expect(m?.animations[anim]?.cadres.length, `${moderne}/${anim}`).toBe(a.cadres.length);
      }
    }
  });

  it('les tours de tir ont leur chat tireur DLC ; le mégaphone d’or (magie niveau 4 voie A) devient un tireur', () => {
    for (const { famille, niveau, voie } of tours) {
      const tireur = spriteTireur(famille, niveau, voie, 'moderne');
      if (famille === 'tir') expect(tireur?.startsWith('moderne-'), `${famille} ${String(niveau)}`).toBe(true);
      if (tireur) expect(existeModerne(tireur), tireur).toBe(true);
    }
    expect(spriteTireur('magie', 4, 'A', 'moderne')).toBe('moderne-megaphone-chat');
    expect(spriteTireur('magie', 4, 'B', 'moderne')).toBeNull();
    expect(spriteTireur('magie', 3, null, 'moderne')).toBeNull();
    // Le rendu le pose au point de tir de l'estrade (« tir », confondu avec « tireur »).
    const estrade = atlasModerne.sprites['moderne-magie-megaphone'];
    expect(nomPointDeTir('magie')).toBe('tir');
    expect(estrade?.points?.tir).toEqual(estrade?.points?.tireur);
  });

  it('dans l’histoire (par défaut), rien ne change', () => {
    for (const { famille, niveau, voie } of tours) {
      expect(spriteTour(famille, niveau, voie, 'charlie', 'histoire')).toBe(spriteTour(famille, niveau, voie));
      expect(spriteTour(famille, niveau, voie).startsWith('moderne-')).toBe(false);
      expect(spriteTireur(famille, niveau, voie, 'histoire')).toBe(spriteTireur(famille, niveau, voie));
    }
    expect(spriteTireur('magie', 4, 'A')).toBeNull();
  });

  it('les ennemis du DLC (boss compris) ont leur propre sprite dans l’atlas du DLC, aucun dans celui de l’histoire', () => {
    const modernes = Object.keys(ENNEMIS).filter(estModerne);
    expect(modernes).toHaveLength(17);
    for (const type of modernes) {
      expect(existeModerne(spriteEnnemi(type)), type).toBe(true);
      expect(existe(spriteEnnemi(type)), type).toBe(false);
    }
    expect(atlasModerne.sprites['moderne-commissaire-boss']?.largeur).toBe(64);
    expect(atlasModerne.sprites['moderne-centaure-boss']?.largeur).toBe(64);
  });
});
