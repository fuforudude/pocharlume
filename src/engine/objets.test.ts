// Objets consommables : effet principal de chacun, un emplacement ne sert qu'une fois, refus.
import { describe, expect, it } from 'vitest';
import { REGLES } from '../data/regles';
import { CONFIG, avancerSecondes, compter, ennemiFixe, partieEssai } from './aides.test-utils';
import { EFFET, type EtatPartie } from './etat';
import { appliquerAction, validerAction } from './partie';
import { PAS_PAR_SECONDE } from './temps';

function partie(...objets: string[]): EtatPartie {
  return partieEssai({ ...CONFIG, objets });
}

describe('Fiole de Soufre', () => {
  it('inflige 150 dégâts purs aux ennemis au sol de la zone, armure ou pas, et épargne les autres', () => {
    const etat = partie('fiole_soufre');
    const dedans = ennemiFixe(etat, 10, { armure: 0.9, resistance: 0.9 });
    const proche = ennemiFixe(etat, 11.2);
    const dehors = ennemiFixe(etat, 13);
    const volant = ennemiFixe(etat, 10, { volant: true });
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: true });
    expect(dedans.pvMax - dedans.pv).toBe(150);
    expect(proche.pvMax - proche.pv).toBe(150);
    expect(dehors.pv).toBe(dehors.pvMax);
    expect(volant.pv).toBe(volant.pvMax);
    expect(etat.evenements).toContainEqual({ type: 'objet', emplacement: 0, objet: 'fiole_soufre', x: 10, y: 5 });
  });

  it('ne sert qu’une fois par partie', () => {
    const etat = partie('fiole_soufre');
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 10, y: 5 })).toEqual({ ok: false, raison: 'objet_utilise' });
    expect(etat.objetsUtilises).toEqual([true]);
  });

  it('refuse un point hors de la carte', () => {
    const etat = partie('fiole_soufre');
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: -2, y: 5 })).toEqual({ ok: false, raison: 'hors_carte' });
    expect(etat.objetsUtilises).toEqual([false]);
  });
});

describe('Herbe de Sabbat', () => {
  it('rend 5 vies', () => {
    const etat = partie('herbe_sabbat');
    etat.vies = etat.viesDepart - 8;
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 0, y: 0 })).toEqual({ ok: true });
    expect(etat.vies).toBe(etat.viesDepart - 3);
    expect(etat.evenements).toContainEqual({ type: 'regain_vies', vies: 5 });
  });

  it('ne dépasse pas les vies de départ', () => {
    const etat = partie('herbe_sabbat');
    etat.vies = etat.viesDepart - 2;
    appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 0, y: 0 });
    expect(etat.vies).toBe(etat.viesDepart);
    expect(etat.evenements).toContainEqual({ type: 'regain_vies', vies: 2 });
  });
});

describe('Griffe de Renfort', () => {
  it('fait venir un chat soldat fort sur le chemin, qui bloque puis repart au bout de 30 s', () => {
    const etat = partie('griffe_renfort');
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 12, y: 5 })).toEqual({ ok: true });
    const renforts = etat.unites.filter((u) => u.genre === 'renfort');
    expect(renforts).toHaveLength(1);
    expect(renforts[0]?.stats.pv).toBe(350);
    const e = ennemiFixe(etat, 11, { degats: [0, 0] });
    avancerSecondes(etat, 3);
    expect(e.bloqueur).toBe(renforts[0]?.id);
    avancerSecondes(etat, 28);
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
    expect(e.bloqueur).toBe(-1);
  });

  it('exige un point sur le chemin', () => {
    const etat = partie('griffe_renfort');
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 12, y: 9 })).toEqual({ ok: false, raison: 'hors_chemin' });
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
  });
});

describe('Sablier', () => {
  it('gèle tous les ennemis ordinaires 5 s où qu’ils soient, et ne fait que ralentir les boss', () => {
    const etat = partie('sablier');
    const proche = ennemiFixe(etat, 3);
    const loin = ennemiFixe(etat, 28, {}, 1);
    const volant = ennemiFixe(etat, 15, { volant: true });
    const boss = ennemiFixe(etat, 10, { boss: true, insensibleEtourdissement: false });
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 0, y: 0 })).toEqual({ ok: true });
    for (const e of [proche, loin, volant]) expect(e.effetsPas[EFFET.etourdissement]).toBe(5 * PAS_PAR_SECONDE);
    expect(boss.effetsPas[EFFET.etourdissement]).toBe(0);
    expect(boss.effetsPas[EFFET.ralentissement]).toBe(5 * PAS_PAR_SECONDE);
    expect(boss.effetsValeur[EFFET.ralentissement]).toBeCloseTo(0.4, 5);
  });

  it('un ennemi gelé n’avance plus pendant 5 s', () => {
    const etat = partie('sablier');
    const e = ennemiFixe(etat, 3, { vitesse: 1 });
    e.vitesse = 1 / PAS_PAR_SECONDE;
    appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 0, y: 0 });
    avancerSecondes(etat, 4.9);
    expect(e.distance).toBe(3);
    avancerSecondes(etat, 2);
    expect(e.distance).toBeGreaterThan(3);
  });
});

describe('emplacements', () => {
  it('trois objets, un par emplacement, chacun utilisable à son tour', () => {
    const etat = partie('fiole_soufre', 'herbe_sabbat', 'sablier');
    expect(etat.objetsUtilises).toEqual([false, false, false]);
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 2, x: 0, y: 0 })).toEqual({ ok: true });
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 1, x: 0, y: 0 })).toEqual({ ok: true });
    expect(etat.objetsUtilises).toEqual([false, true, true]);
    expect(REGLES.emplacementsObjets).toBe(3);
  });

  it('refuse un emplacement vide, négatif, trop grand ou mal formé, sans rien changer', () => {
    const etat = partie('sablier');
    for (const emplacement of [1, 2, -1, 99]) {
      expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement, x: 0, y: 0 }), String(emplacement)).toEqual({ ok: false, raison: 'objet_inconnu' });
    }
    for (const mauvaise of [
      { type: 'utiliserObjet', emplacement: 0.5, x: 0, y: 0 },
      { type: 'utiliserObjet', emplacement: 0, x: Number.NaN, y: 0 },
      { type: 'utiliserObjet', emplacement: '0', x: 0, y: 0 },
      { type: 'utiliserObjet', emplacement: 0, x: 0 },
    ]) {
      expect(validerAction(etat, mauvaise as never), JSON.stringify(mauvaise)).toBe('action_invalide');
    }
    expect(etat.journal).toHaveLength(0);
    expect(etat.objetsUtilises).toEqual([false]);
    expect(compter(etat.evenements, 'objet')).toBe(0);
  });

  it('sans objet emporté, rien ne s’utilise', () => {
    const etat = partie();
    expect(appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 0, y: 0 })).toEqual({ ok: false, raison: 'objet_inconnu' });
  });
});
