import { describe, expect, it } from 'vitest';
import { PoolEffets, TYPE_EFFET } from './effets';

describe('PoolEffets', () => {
  it('réutilise les mêmes objets : la taille du pool ne change jamais', () => {
    const pool = new PoolEffets(8);
    const objets = new Set(pool.liste);
    for (let i = 0; i < 100; i++) {
      const e = pool.prendre(TYPE_EFFET.sprite, i * 10, 50);
      expect(objets.has(e)).toBe(true);
      pool.nettoyer(i * 10 + 60);
    }
    expect(pool.liste).toHaveLength(8);
  });

  it('prend d’abord les effets libres, sans toucher aux actifs', () => {
    const pool = new PoolEffets(4);
    const a = pool.prendre(TYPE_EFFET.sprite, 0, 1000);
    const b = pool.prendre(TYPE_EFFET.sprite, 0, 1000);
    expect(a).not.toBe(b);
    expect(pool.actifs).toBe(2);
  });

  it('quand tout est occupé, recycle le plus ancien plutôt que de grossir', () => {
    const pool = new PoolEffets(3);
    const premiers = [0, 1, 2].map((i) => pool.prendre(TYPE_EFFET.sprite, i, 1000));
    premiers.forEach((e, i) => { e.valeur = i + 1; });
    const recycle = pool.prendre(TYPE_EFFET.texte, 5, 1000);
    expect(recycle).toBe(premiers[0]);
    expect(recycle.valeur).toBe(0);
    expect(recycle.type).toBe(TYPE_EFFET.texte);
    expect(pool.actifs).toBe(3);
    expect(pool.liste).toHaveLength(3);
  });

  it('remet l’effet à zéro quand on le reprend', () => {
    const pool = new PoolEffets(1);
    const e = pool.prendre(TYPE_EFFET.sprite, 0, 10);
    e.x = 40;
    e.echelle = 3;
    e.miroir = true;
    pool.nettoyer(100);
    const f = pool.prendre(TYPE_EFFET.sprite, 200, 10);
    expect(f).toBe(e);
    expect(f.x).toBe(0);
    expect(f.echelle).toBe(1);
    expect(f.miroir).toBe(false);
    expect(f.debut).toBe(200);
  });

  it('libère les effets dont la durée est écoulée, et eux seulement', () => {
    const pool = new PoolEffets(4);
    pool.prendre(TYPE_EFFET.sprite, 0, 100);
    pool.prendre(TYPE_EFFET.sprite, 0, 300);
    pool.nettoyer(150);
    expect(pool.actifs).toBe(1);
    pool.nettoyer(300);
    expect(pool.actifs).toBe(0);
  });
});
