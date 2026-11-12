import { describe, expect, it } from 'vitest';
import { CAMPAGNE_MODERNE } from '../data/niveaux/campagne-moderne';
import { REGION1 } from '../data/niveaux/region1';
import { fr } from '../i18n/fr';
import { ENNEMIS } from '../data/ennemis';
import type { Vague } from '../engine/definitions';
import { aTexte } from '../i18n';
import { cleParoleBoss, decompteParole } from './parole-boss';

describe('cleParoleBoss', () => {
  const niveau = REGION1.find((n) => n.boss);
  it('rend la parole de la région pour la vague du boss, rien pour les autres', () => {
    expect(niveau).toBeDefined();
    if (!niveau) return;
    const vagues = niveau.niveau.vagues;
    const indices = vagues.map((_, i) => cleParoleBoss(vagues, i, 1, true)).flatMap((c, i) => (c ? [i] : []));
    expect(indices.length).toBeGreaterThan(0);
    expect(cleParoleBoss(vagues, indices[0] ?? 0, 1, true)).toBe('boss.r1.parole');
    expect(cleParoleBoss(vagues, indices[0] ?? 0, 1, false)).toBeNull();
    expect(cleParoleBoss(vagues, 999, 1, true)).toBeNull();
    expect(indices.length).toBeLessThan(vagues.length);
  });
});

describe('paroles', () => {
  it('chaque région a la sienne dans les textes', () => {
    for (let n = 1; n <= 10; n++) expect(fr).toHaveProperty(`boss.r${String(n)}.parole`);
  });
});

describe('paroles du DLC « Temps modernes »', () => {
  /** Le boss de chaque région du DLC (la Fac, la Manif, la Préfecture). */
  const BOSS_PAR_REGION: Readonly<Record<string, number>> = { moderne_commissaire_boss: 1, moderne_centaure_boss: 2, moderne_prefet: 3 };
  const vagueDe = (ennemi: string): Vague[] => [{ paquets: [{ ennemi, nombre: 1, intervalle: 1, chemin: 0, delai: 0 }] }];

  it('chaque boss du DLC a sa réplique, sous une clé construite sur la campagne', () => {
    const boss = Object.entries(ENNEMIS).filter(([id, d]) => id.startsWith('moderne_') && d.boss).map(([id]) => id);
    expect(boss.sort()).toEqual(Object.keys(BOSS_PAR_REGION).sort());
    for (const id of boss) {
      const region = BOSS_PAR_REGION[id] ?? 0;
      const cle = cleParoleBoss(vagueDe(id), 0, region, true, true);
      expect(cle, id).toBe(`boss.m${String(region)}.parole`);
      expect(aTexte(cle ?? ''), id).toBe(true);
      expect(fr).toHaveProperty(cle ?? '');
    }
  });

  it('ne lève jamais d’erreur pour un boss sans texte : rend null', () => {
    expect(cleParoleBoss(vagueDe('moderne_commissaire_boss'), 0, 99, true, true)).toBeNull();
    expect(cleParoleBoss(vagueDe('moderne_commissaire_boss'), 0, 101, true)).toBeNull();
    expect(cleParoleBoss(vagueDe('moderne_commissaire_boss'), 0, 1, false, true)).toBeNull();
  });

  it('les niveaux du DLC : seule la vague du boss reçoit la réplique de sa région', () => {
    const niveau = CAMPAGNE_MODERNE.find((n) => n.boss);
    expect(niveau).toBeDefined();
    if (!niveau) return;
    const vagues = niveau.niveau.vagues;
    const region = Math.floor((niveau.numero - 1) / 10) + 1;
    const dites = vagues.flatMap((_, i) => (cleParoleBoss(vagues, i, region, true, true) ? [i] : []));
    expect(dites).toHaveLength(1);
  });
});

describe('decompteParole', () => {
  it('ne bouge pas en pause, descend en jeu, plus vite à ×2, sans passer sous zéro ni sauter après un long blocage', () => {
    expect(decompteParole(5000, 16, true, 1)).toBe(5000);
    expect(decompteParole(5000, 16, false, 1)).toBe(4984);
    expect(decompteParole(5000, 16, false, 2)).toBe(4968);
    expect(decompteParole(10, 16, false, 1)).toBe(0);
    expect(decompteParole(5000, 60_000, false, 1)).toBe(4900);
  });
});
