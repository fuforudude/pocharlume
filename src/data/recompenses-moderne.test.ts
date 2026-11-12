// Récompenses du DLC « Temps modernes » : catalogue des skins et des titres, badges gagnés par une victoire, caisse payée en badges.
import { describe, expect, it } from 'vitest';
import { FAMILLES_BASE } from './collection';
import { NIVEAU_MAX_MODERNE } from './campagnes';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, IDS_DIEUX, IDS_HEROS, RARETES } from './meta';
import {
  BADGES_MODERNE,
  badgesDeLaVictoire,
  badgesDuDlcComplet,
  CATALOGUE_MODERNE,
  cibleDuSkinModerne,
  CIBLES_SKIN_MODERNE,
  DEFS_SKINS_MODERNES,
  DEFS_TITRES_MODERNES,
  estIdSkinModerne,
  PRIX_CAISSE_MODERNE,
  raretesCaisseModerne,
  skinModerneAcceptable,
  skinsCaisseModerne,
  titresMerites,
  type EtatRecompensesModerne,
} from './recompenses-moderne';

const vide: EtatRecompensesModerne = { etoiles: {}, defis: {} };

/** Les niveaux 1 à `n` du DLC réussis avec `etoiles` étoiles en Matou. */
function reussis(n: number, etoiles: 1 | 2 | 3): EtatRecompensesModerne['etoiles'] {
  const e: Record<string, { matou: number }> = {};
  for (let i = 1; i <= n; i++) e[String(i)] = { matou: etoiles };
  return e;
}

describe('catalogue du DLC', () => {
  it('est rempli : un skin par tour de base, un par tour divine, un par héros, et les titres', () => {
    expect(CATALOGUE_MODERNE).not.toBeNull();
    expect(CATALOGUE_MODERNE.skinsTours).toHaveLength(FAMILLES_BASE.length + IDS_DIEUX.length);
    expect(CATALOGUE_MODERNE.skinsHeros).toHaveLength(IDS_HEROS.length);
    expect(CATALOGUE_MODERNE.titres).toEqual(DEFS_TITRES_MODERNES.map((d) => d.id));
    expect(CATALOGUE_MODERNE.titres).toEqual(expect.arrayContaining(['fac_occupee', 'prefecture_tombee']));
  });

  it('a des identifiants bien formés pour la sauvegarde, uniques, sans nom hérité d’Object', () => {
    const ids = [...CATALOGUE_MODERNE.skinsTours, ...CATALOGUE_MODERNE.skinsHeros, ...CATALOGUE_MODERNE.titres];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z][a-z0-9_]{0,47}$/);
      expect(id in Object.prototype).toBe(false);
    }
  });

  it('donne à chaque cible (tour de base, tour divine d’un dieu, héros) exactement un skin', () => {
    expect(CIBLES_SKIN_MODERNE).toEqual([...FAMILLES_BASE, ...IDS_DIEUX.map((d) => `divine_${d}`), ...IDS_HEROS]);
    for (const cible of CIBLES_SKIN_MODERNE) expect(DEFS_SKINS_MODERNES.filter((d) => cibleDuSkinModerne(d) === cible)).toHaveLength(1);
  });

  it('accepte un skin sur sa cible seulement', () => {
    expect(skinModerneAcceptable('tir', 'skin_moderne_tir')).toBe(true);
    expect(skinModerneAcceptable('caserne', 'skin_moderne_tir')).toBe(false);
    expect(skinModerneAcceptable('divine_plume', 'skin_moderne_divine_plume')).toBe(true);
    expect(skinModerneAcceptable('plume', 'skin_moderne_divine_plume')).toBe(false);
    expect(skinModerneAcceptable('brise_os', 'skin_moderne_brise_os')).toBe(true);
    expect(skinModerneAcceptable('tir', 'skin_tir_2')).toBe(false);
    expect(skinModerneAcceptable('constructor', 'constructor')).toBe(false);
    expect(estIdSkinModerne('skin_moderne_lanterne')).toBe(true);
    expect(estIdSkinModerne('toString')).toBe(false);
  });
});

describe('badges d’une victoire', () => {
  it('première victoire : la prime, et la prime de boss aux niveaux 10, 20 et 30', () => {
    expect(badgesDeLaVictoire(1, { etoiles: 2, defi: null }, vide)).toBe(BADGES_MODERNE.premiereVictoire);
    for (const boss of [10, 20, 30]) {
      expect(badgesDeLaVictoire(boss, { etoiles: 1, defi: null }, vide)).toBe(BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.boss);
    }
  });

  it('3 étoiles la première fois : la prime d’étoiles, même au-dessus d’une première victoire', () => {
    expect(badgesDeLaVictoire(4, { etoiles: 3, defi: null }, vide)).toBe(BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.troisEtoiles);
    const deuxEtoiles: EtatRecompensesModerne = { etoiles: { '4': { chaton: 2 } }, defis: {} };
    expect(badgesDeLaVictoire(4, { etoiles: 3, defi: null }, deuxEtoiles)).toBe(BADGES_MODERNE.troisEtoiles);
  });

  it('rejouer un niveau sans mieux faire ne rapporte rien', () => {
    const fait: EtatRecompensesModerne = { etoiles: { '4': { matou: 3 } }, defis: {} };
    expect(badgesDeLaVictoire(4, { etoiles: 3, defi: null }, fait)).toBe(0);
    expect(badgesDeLaVictoire(4, { etoiles: 1, defi: null }, { etoiles: { '4': { chaton: 1 } }, defis: {} })).toBe(0);
  });

  it('un défi rapporte sa prime la première fois, sur un niveau à 3 étoiles seulement', () => {
    const troisEtoiles: EtatRecompensesModerne = { etoiles: { '7': { vieux_sage: 3 } }, defis: {} };
    expect(badgesDeLaVictoire(7, { etoiles: 3, defi: 'heroique' }, troisEtoiles)).toBe(BADGES_MODERNE.defi);
    expect(badgesDeLaVictoire(7, { etoiles: 3, defi: 'fer' }, { ...troisEtoiles, defis: { '7': { heroique: true } } })).toBe(BADGES_MODERNE.defi);
    expect(badgesDeLaVictoire(7, { etoiles: 3, defi: 'fer' }, { ...troisEtoiles, defis: { '7': { fer: true } } })).toBe(0);
    expect(badgesDeLaVictoire(7, { etoiles: 3, defi: 'fer' }, { etoiles: { '7': { matou: 2 } }, defis: {} })).toBe(0);
  });

  it('une victoire absurde ne rapporte rien', () => {
    expect(badgesDeLaVictoire(0, { etoiles: 3, defi: null }, vide)).toBe(0);
    expect(badgesDeLaVictoire(NIVEAU_MAX_MODERNE + 1, { etoiles: 3, defi: null }, vide)).toBe(0);
    expect(badgesDeLaVictoire(2.5, { etoiles: 3, defi: null }, vide)).toBe(0);
    expect(badgesDeLaVictoire(2, { etoiles: 4, defi: null }, vide)).toBe(0);
    expect(badgesDeLaVictoire(2, { etoiles: 0, defi: null }, vide)).toBe(0);
  });

  it('lit les étoiles et les défis en propriétés propres seulement', () => {
    const piege = { etoiles: Object.create({ '3': { matou: 3 } }) as EtatRecompensesModerne['etoiles'], defis: {} };
    expect(badgesDeLaVictoire(3, { etoiles: 1, defi: null }, piege)).toBe(BADGES_MODERNE.premiereVictoire);
  });

  it('tout le DLC avec ses défis rapporte le total annoncé, qui ouvre ~148 caisses', () => {
    let etat: EtatRecompensesModerne = vide;
    let total = 0;
    for (let n = 1; n <= NIVEAU_MAX_MODERNE; n++) {
      total += badgesDeLaVictoire(n, { etoiles: 3, defi: null }, etat);
      etat = { ...etat, etoiles: { ...etat.etoiles, [String(n)]: { matou: 3 } } };
      for (const defi of ['heroique', 'fer'] as const) {
        total += badgesDeLaVictoire(n, { etoiles: 3, defi }, etat);
        etat = { ...etat, defis: { ...etat.defis, [String(n)]: { ...etat.defis[String(n)], [defi]: true } } };
      }
    }
    expect(total).toBe(badgesDuDlcComplet());
    expect(total).toBe(2220);
    expect(Math.floor(total / PRIX_CAISSE_MODERNE)).toBe(148);
  });
});

describe('caisse Temps modernes', () => {
  it('a toutes les raretés des caisses actuelles, jamais vides, avec les mêmes chances et la même garantie', () => {
    expect(raretesCaisseModerne()).toEqual(RARETES);
    for (const rarete of RARETES) expect(skinsCaisseModerne(rarete).length).toBeGreaterThan(0);
    const total = RARETES.reduce((somme, r) => somme + skinsCaisseModerne(r).length, 0);
    expect(total).toBe(DEFS_SKINS_MODERNES.length);
    expect(RARETES.reduce((s, r) => s + CHANCES_RARETE[r], 0)).toBe(100);
    expect(CAISSES_AVANT_GARANTIE).toBe(10);
    expect(PRIX_CAISSE_MODERNE).toBeGreaterThan(0);
  });
});

describe('titres', () => {
  it('rien de mérité au départ', () => {
    expect(titresMerites(vide)).toEqual([]);
  });

  it('les boss battus donnent les titres de région, dans l’ordre alphabétique', () => {
    expect(titresMerites({ etoiles: reussis(10, 1), defis: {} })).toEqual(['fac_occupee']);
    expect(titresMerites({ etoiles: reussis(30, 1), defis: {} })).toEqual(['cortege_de_tete', 'fac_occupee', 'prefecture_tombee']);
  });

  it('30 niveaux à 3 étoiles, puis tous les défis', () => {
    expect(titresMerites({ etoiles: reussis(30, 3), defis: {} })).toContain('mention_tres_bien');
    expect(titresMerites({ etoiles: reussis(29, 3), defis: {} })).not.toContain('mention_tres_bien');
    const defis: Record<string, { heroique: true; fer: true }> = {};
    for (let n = 1; n <= NIVEAU_MAX_MODERNE; n++) defis[String(n)] = { heroique: true, fer: true };
    expect(titresMerites({ etoiles: reussis(30, 3), defis })).toEqual([...CATALOGUE_MODERNE.titres].sort());
    const presque = { ...defis, '30': { heroique: true as const } };
    expect(titresMerites({ etoiles: reussis(30, 3), defis: presque })).not.toContain('greve_generale');
  });
});
