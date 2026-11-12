// Récompenses du DLC « Temps modernes » : catalogue des skins et des titres, badges gagnés par une victoire, caisse payée en badges.
import { describe, expect, it } from 'vitest';
import { FAMILLES_BASE } from './collection';
import { NIVEAU_MAX_MODERNE } from './campagnes';
import { CAISSES_AVANT_GARANTIE, CHANCES_RARETE, IDS_DIEUX, IDS_HEROS, RARETES } from './meta';
import {
  BADGES_MODERNE,
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

describe('badges du DLC complet', () => {
  it('le total annoncé ouvre ~148 caisses (la règle d’une victoire est testée sur la fin de partie, src/save/recompenses-fin-moderne.test.ts)', () => {
    expect(badgesDuDlcComplet()).toBe(2220);
    expect(badgesDuDlcComplet()).toBe(
      NIVEAU_MAX_MODERNE * (BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.troisEtoiles + 2 * BADGES_MODERNE.defi) + 3 * BADGES_MODERNE.boss,
    );
    expect(Math.floor(badgesDuDlcComplet() / PRIX_CAISSE_MODERNE)).toBe(148);
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
