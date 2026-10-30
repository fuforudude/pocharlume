import { describe, expect, it } from 'vitest';
import { fr } from './fr';
import { t, tCle } from './index';

const MARQUEUR = /\{(\w+)\}/g;
const A_MARQUEUR = /\{\w+\}/;

describe('t', () => {
  it('rend le texte français d’une clé', () => {
    expect(t('jeu.titre')).toBe('Pocharlume');
  });

  it('rend exactement la table fr pour chaque clé sans paramètre', () => {
    for (const cle of Object.keys(fr) as (keyof typeof fr)[]) {
      if (A_MARQUEUR.test(fr[cle])) continue;
      expect(t(cle)).toBe(fr[cle]);
    }
  });

  it('refuse une clé inconnue à la compilation', () => {
    // @ts-expect-error la clé n'existe pas dans fr.ts
    expect(() => t('cle.inconnue')).toThrow('cle.inconnue');
  });
});

describe('t avec paramètres', () => {
  it('remplace un paramètre par un nombre', () => {
    expect(t('accueil.reprendre', { n: 7 })).toBe('Reprendre à la vague 7');
  });

  it('remplace plusieurs paramètres, dans n’importe quel ordre', () => {
    expect(t('hud.vague', { m: 5, n: 2 })).toBe('Vague 2/5');
  });

  it('accepte des paramètres texte et le zéro', () => {
    expect(t('hud.vitesse', { n: '2' })).toBe('Vitesse ×2');
    expect(t('hud.vague', { n: 0, m: 0 })).toBe('Vague 0/0');
  });

  it('ignore les paramètres en trop', () => {
    expect(t('accueil.reprendre', { n: 3, inutile: 'x' })).toBe('Reprendre à la vague 3');
  });

  it('refuse un paramètre manquant plutôt que d’afficher {n}', () => {
    expect(() => t('accueil.reprendre')).toThrow('{n}');
    expect(() => t('hud.vague', { n: 1 })).toThrow('{m}');
  });

  it('ne lit que les propriétés propres des paramètres', () => {
    expect(() => t('accueil.reprendre', {})).toThrow('{n}');
    expect(() => t('accueil.reprendre', { constructor: 3 })).toThrow('{n}');
  });

  it('un texte sans marqueur n’est pas modifié par les paramètres', () => {
    expect(t('jeu.titre', { n: 1 })).toBe('Pocharlume');
  });

  it('chaque marqueur de la table se remplit avec un paramètre du même nom', () => {
    for (const cle of Object.keys(fr) as (keyof typeof fr)[]) {
      const noms = [...fr[cle].matchAll(MARQUEUR)].map((m) => m[1] ?? '');
      const parametres = Object.fromEntries(noms.map((nom) => [nom, 'X']));
      expect(t(cle, parametres)).not.toMatch(A_MARQUEUR);
    }
  });
});

describe('tCle', () => {
  it('lit une clé venue des données', () => {
    expect(tCle('tour.autel_des_cendres')).toBe('Autel des Cendres');
  });

  it('lève une erreur sur une clé inconnue, y compris un nom hérité de Object', () => {
    expect(() => tCle('cle.inconnue')).toThrow('cle.inconnue');
    expect(() => tCle('constructor')).toThrow('constructor');
  });
});

describe('héros : les points à placer s’appellent « XP »', () => {
  it('aucun texte de l’écran des héros ni de ses refus ne parle de « point(s) »', () => {
    const cles = Object.keys(fr).filter((cle) => cle.startsWith('heros.') || cle.startsWith('meta.refus.'));
    expect(cles.length).toBeGreaterThan(20);
    for (const cle of cles) expect(fr[cle as keyof typeof fr], cle).not.toMatch(/\bpoints?\b/i);
  });

  it('dit « XP » à la place', () => {
    expect(t('heros.points', { n: 3 })).toBe('XP à placer : 3');
    expect(t('heros.reinitialiser')).toBe('Reprendre l’XP');
    expect(t('heros.placer', { nom: 'Griffe' })).toBe('Placer de l’XP : Griffe');
    expect(t('heros.points_repris', { nom: 'Suie' })).toBe('L’XP de Suie est à replacer.');
    expect(t('meta.refus.plus_de_points')).toContain('XP');
    expect(t('meta.refus.competences_incoherentes')).toContain('XP');
  });
});
