// Config d'une partie : le défi joué (Héroïque, Fer) et les bonus de la collection équipée.
import { describe, expect, it } from 'vitest';
import { VERSION_DONNEES } from '../data/version';
import { DEFS_TEST, sauvegardeRemplie } from './aides.test-utils';
import { configDepuisSauvegarde, type OptionsConfig, type OptionsConfigDefi, type ResultatConfig, type ResultatConfigDefi } from './config-partie';
import { sauvegardeVide, type Sauvegarde } from './format';

const BASE: OptionsConfig = {
  dieu: 'plume',
  heros: 'suie',
  objetsEquipes: ['sablier', 'fiole_soufre'],
  difficulte: 'vieux_sage',
  graine: 7,
  versionDonnees: VERSION_DONNEES,
  defsHeros: DEFS_TEST,
};

function defi(options: Partial<OptionsConfigDefi>, s: Sauvegarde = sauvegardeRemplie()): ResultatConfigDefi {
  return configDepuisSauvegarde(s, { ...BASE, niveau: 2, defi: 'heroique', ...options });
}

function config(r: ResultatConfig | ResultatConfigDefi) {
  if (!r.ok) throw new Error(r.raison);
  return r.config;
}

describe('configDepuisSauvegarde : sans défi', () => {
  it('la config porte `defi: null` et les bonus de la collection', () => {
    const c = config(configDepuisSauvegarde(sauvegardeRemplie(), BASE));
    expect(c.defi).toBeNull();
    expect(c.bonus).toEqual({ tours: { tir: { cadence: 0.0125 } }, heros: { degats: 0.045, cadence: 0.02625 } });
    expect(c.objets).toEqual(['sablier', 'fiole_soufre']);
  });

  it('une collection vide donne des bonus vides', () => {
    const c = config(configDepuisSauvegarde(sauvegardeVide(), { ...BASE, dieu: 'charlie', heros: 'charlie', objetsEquipes: [] }));
    expect(c.bonus).toEqual({ tours: {}, heros: {} });
  });

  it('`defi: null` explicite avec un niveau est une partie ordinaire', () => {
    const c = config(configDepuisSauvegarde(sauvegardeRemplie(), { ...BASE, niveau: 1, defi: null }));
    expect(c.defi).toBeNull();
    expect(c.difficulte).toBe('vieux_sage');
    expect(c.objets).toEqual(['sablier', 'fiole_soufre']);
  });
});

describe('configDepuisSauvegarde : défis', () => {
  it('Héroïque sur un niveau à 3 étoiles : défi posé, règles de Matou, objets vidés, bonus gardés', () => {
    // Niveau 2 : 3 étoiles en Matou dans la sauvegarde remplie.
    const c = config(defi({ defi: 'heroique' }));
    expect(c.defi).toBe('heroique');
    expect(c.difficulte).toBe('matou');
    expect(c.objets).toEqual([]);
    expect(c.bonus.heros).toEqual({ degats: 0.045, cadence: 0.02625 });
    expect(c.bonus.tours).toEqual({ tir: { cadence: 0.0125 } });
  });

  it('Fer : défi posé, règles de Matou, objets vidés, aucun bonus de collection', () => {
    const c = config(defi({ defi: 'fer' }));
    expect(c.defi).toBe('fer');
    expect(c.difficulte).toBe('matou');
    expect(c.objets).toEqual([]);
    expect(c.bonus).toEqual({ tours: {}, heros: {} });
  });

  it('la difficulté demandée est ignorée en défi (même une inconnue ne fait pas échouer : c’est Matou)', () => {
    expect(config(defi({ difficulte: 'chaton' })).difficulte).toBe('matou');
    expect(config(defi({ difficulte: 'vieux_sage' })).difficulte).toBe('matou');
  });

  it('les objets demandés sont ignorés : pas de contrôle du stock, rien n’est emporté', () => {
    const s = sauvegardeRemplie();
    const sansStock: Sauvegarde = { ...s, meta: { ...s.meta, objets: { fiole_soufre: 0, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 } } };
    expect(config(defi({ objetsEquipes: ['sablier', 'sablier', 'sablier'] }, sansStock)).objets).toEqual([]);
  });

  it('les 3 étoiles peuvent venir d’une autre difficulté que Matou (niveau 6 : 3 étoiles en Chaton)', () => {
    expect(config(defi({ niveau: 6 })).defi).toBe('heroique');
  });

  it('refusé sur un niveau sans 3 étoiles, jamais réussi, verrouillé ou invalide', () => {
    const refus = (options: Partial<OptionsConfigDefi>): string => {
      const r = defi(options);
      if (r.ok) throw new Error('le défi aurait dû être refusé');
      return r.raison;
    };
    expect(refus({ niveau: 1 })).toBe('defi_verrouille'); // 2 étoiles seulement
    expect(refus({ niveau: 3 })).toBe('defi_verrouille'); // 1 étoile
    expect(refus({ niveau: 13 })).toBe('defi_verrouille'); // débloqué mais jamais réussi
    expect(refus({ niveau: 40 })).toBe('defi_verrouille'); // verrouillé
    for (const niveau of [0, -1, 101, 1.5, Number.NaN, '2' as unknown as number]) expect(refus({ niveau }), String(niveau)).toBe('defi_verrouille');
    expect(refus({ niveau: 1, defi: 'fer' })).toBe('defi_verrouille');
  });

  it('refuse un défi inconnu', () => {
    for (const nom of ['normal', 'Fer', '', 'constructor', '__proto__']) {
      const r = defi({ defi: nom });
      expect(r, nom).toEqual({ ok: false, raison: 'defi_inconnu' });
    }
  });

  it('les autres refus gardent la priorité habituelle (héros non possédé, dieu inconnu…)', () => {
    expect(defi({ dieu: 'zeus' })).toEqual({ ok: false, raison: 'dieu_inconnu' });
    expect(defi({ dieu: 'charlie', heros: 'mastoc' })).toEqual({ ok: false, raison: 'heros_non_possede' });
  });

  it('le défi n’ouvre pas de droit : même ouvert, il ne modifie pas la sauvegarde', () => {
    const s = sauvegardeRemplie();
    const avant = structuredClone(s);
    defi({ defi: 'fer' }, s);
    expect(s).toEqual(avant);
  });
});
