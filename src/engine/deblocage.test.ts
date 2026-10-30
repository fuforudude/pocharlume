// Déblocage progressif des tours : ce que le niveau joué permet de construire, d'après son seul numéro.
import { describe, expect, it } from 'vitest';
import { DEBLOCAGES, NIVEAU_TOUT_OUVERT, niveauOuverture, nouveautesDuNiveau } from '../data/deblocage';
import { FAMILLES } from '../data/tours';
import { ce, configDe, niveauEssai } from './aides.test-utils';
import type { Action } from './actions';
import type { IdFamille } from './definitions';
import type { ConfigPartie, EtatPartie } from './etat';
import { niveauDeblocage } from './deblocage';
import { appliquerAction, avancer, creerPartie, rejouer, serialiser, validerAction } from './partie';

function partieNumero(numero: number | undefined, config: ConfigPartie = configDe('charlie')): EtatPartie {
  const niveau = niveauEssai();
  return creerPartie(numero === undefined ? niveau : { ...niveau, numero }, config);
}

/** Pose une tour de la famille sur la case d'essai `i`, puis la monte jusqu'au palier voulu (refus = erreur). */
function monter(etat: EtatPartie, i: number, famille: IdFamille, palier: number): void {
  const actions: Action[] = [{ type: 'construire', ...ce(i), tour: famille }];
  for (let p = 2; p <= Math.min(palier, 3); p++) actions.push({ type: 'ameliorer', ...ce(i) });
  if (palier === 4) actions.push({ type: 'specialiser', ...ce(i), voie: 'A' });
  for (const a of actions) {
    const r = appliquerAction(etat, a);
    if (!r.ok) throw new Error(`${famille} palier ${String(palier)} : ${r.raison}`);
  }
}

describe('table du déblocage', () => {
  it('ouvre chaque palier de chaque famille et la tour divine une fois, entre les niveaux 1 et 10', () => {
    for (const famille of FAMILLES) {
      for (const palier of [1, 2, 3, 4] as const) {
        expect(DEBLOCAGES.filter((d) => d.famille === famille && d.palier === palier), `${famille} ${String(palier)}`).toHaveLength(1);
      }
    }
    expect(DEBLOCAGES.filter((d) => d.famille === 'divine')).toEqual([{ niveau: 10, famille: 'divine', palier: 1 }]);
    for (const d of DEBLOCAGES) expect(d.niveau).toBeLessThan(NIVEAU_TOUT_OUVERT);
  });

  it('suit le rythme décidé : bases au 1, niveaux 2 au 2 et au 3, niveaux 3 au 4 et au 5, spécialisations du 6 au 9, divine au 10', () => {
    const ouvre = (n: number): string[] => nouveautesDuNiveau(n).map((d) => `${d.famille}${String(d.palier)}`);
    expect(ouvre(1)).toEqual(['caserne1', 'tir1', 'magie1', 'artillerie1']);
    expect(ouvre(2)).toEqual(['caserne2', 'tir2']);
    expect(ouvre(3)).toEqual(['magie2', 'artillerie2']);
    expect(ouvre(4)).toEqual(['caserne3', 'tir3']);
    expect(ouvre(5)).toEqual(['magie3', 'artillerie3']);
    expect(ouvre(6)).toEqual(['caserne4']);
    expect(ouvre(7)).toEqual(['tir4']);
    expect(ouvre(8)).toEqual(['magie4']);
    expect(ouvre(9)).toEqual(['artillerie4']);
    expect(ouvre(10)).toEqual(['divine1']);
    expect(ouvre(11)).toEqual([]);
    expect(niveauOuverture('magie', 4)).toBe(8);
  });
});

describe('le moteur refuse ce que le niveau n’a pas encore débloqué', () => {
  it('niveau 1 : les quatre tours de base se posent, mais ne s’améliorent pas ; pas de tour divine', () => {
    const etat = partieNumero(1);
    FAMILLES.forEach((famille, i) => {
      expect(appliquerAction(etat, { type: 'construire', ...ce(i), tour: famille })).toEqual({ ok: true });
      expect(validerAction(etat, { type: 'ameliorer', ...ce(i) })).toBe('non_debloque');
    });
    const aretes = etat.aretes;
    expect(appliquerAction(etat, { type: 'construire', ...ce(4), tour: 'divine' })).toEqual({ ok: false, raison: 'non_debloque' });
    expect(appliquerAction(etat, { type: 'ameliorer', ...ce(0) })).toEqual({ ok: false, raison: 'non_debloque' });
    expect(etat.aretes).toBe(aretes);
    expect(etat.tours.every((t) => t.niveau === 1)).toBe(true);
  });

  it('niveaux 2 à 5 : les niveaux 2 puis 3, caserne et archers d’abord, magie et artillerie ensuite', () => {
    const plafond = (numero: number, famille: IdFamille): number => {
      const etat = partieNumero(numero);
      monter(etat, 0, famille, 1);
      let palier = 1;
      while (palier < 3 && validerAction(etat, { type: 'ameliorer', ...ce(0) }) === null) {
        appliquerAction(etat, { type: 'ameliorer', ...ce(0) });
        palier++;
      }
      if (palier < 3) expect(validerAction(etat, { type: 'ameliorer', ...ce(0) })).toBe('non_debloque');
      return palier;
    };
    const attendus: Record<number, Record<IdFamille, number>> = {
      2: { caserne: 2, tir: 2, magie: 1, artillerie: 1 },
      3: { caserne: 2, tir: 2, magie: 2, artillerie: 2 },
      4: { caserne: 3, tir: 3, magie: 2, artillerie: 2 },
      5: { caserne: 3, tir: 3, magie: 3, artillerie: 3 },
    };
    for (const [numero, parFamille] of Object.entries(attendus)) {
      for (const famille of FAMILLES) expect(plafond(Number(numero), famille), `niveau ${numero}, ${famille}`).toBe(parFamille[famille]);
    }
  });

  it('niveaux 6 à 9 : les deux spécialisations d’une famille par niveau (caserne, archers, magie, artillerie)', () => {
    const ordre: readonly IdFamille[] = ['caserne', 'tir', 'magie', 'artillerie'];
    for (let numero = 5; numero <= 9; numero++) {
      const etat = partieNumero(numero);
      FAMILLES.forEach((famille, i) => {
        monter(etat, i, famille, 3);
        const ouverte = ordre.indexOf(famille) + 6 <= numero;
        for (const voie of ['A', 'B'] as const) {
          expect(validerAction(etat, { type: 'specialiser', ...ce(i), voie }), `niveau ${String(numero)}, ${famille} ${voie}`).toBe(ouverte ? null : 'non_debloque');
        }
      });
    }
  });

  it('niveau 10 : la tour divine se pose (une seule)', () => {
    expect(validerAction(partieNumero(9), { type: 'construire', ...ce(0), tour: 'divine' })).toBe('non_debloque');
    const etat = partieNumero(10);
    expect(appliquerAction(etat, { type: 'construire', ...ce(0), tour: 'divine' })).toEqual({ ok: true });
    expect(validerAction(etat, { type: 'construire', ...ce(1), tour: 'divine' })).toBe('une_seule_divine');
  });

  it.each([11, 42, 100])('niveau %i : tout est ouvert', (numero) => {
    const etat = partieNumero(numero);
    FAMILLES.forEach((famille, i) => {
      monter(etat, i, famille, 4);
    });
    expect(appliquerAction(etat, { type: 'construire', ...ce(4), tour: 'divine' })).toEqual({ ok: true });
  });

  it('mode infini et niveau sans numéro (essai) : tout est ouvert', () => {
    const infini = partieNumero(2, configDe('charlie', { infini: { region: 1 } }));
    monter(infini, 0, 'magie', 4);
    expect(validerAction(infini, { type: 'construire', ...ce(1), tour: 'divine' })).toBeNull();
    const essai = partieNumero(undefined);
    monter(essai, 0, 'artillerie', 4);
    expect(validerAction(essai, { type: 'construire', ...ce(1), tour: 'divine' })).toBeNull();
  });

  it('les défis Héroïque et Fer suivent le rythme du niveau', () => {
    const heroique = partieNumero(2, configDe('charlie', { defi: 'heroique' }));
    monter(heroique, 0, 'tir', 2);
    expect(validerAction(heroique, { type: 'ameliorer', ...ce(0) })).toBe('non_debloque');
    const niveauFer = { ...niveauEssai(), numero: 3, defiFer: { familles: ['magie', 'tir'] as [IdFamille, IdFamille] } };
    const fer = creerPartie(niveauFer, configDe('charlie', { defi: 'fer' }));
    fer.aretes = 5000;
    monter(fer, 0, 'magie', 2);
    expect(validerAction(fer, { type: 'ameliorer', ...ce(0) })).toBe('non_debloque');
    // Une famille que le Fer interdit garde sa raison propre.
    expect(validerAction(fer, { type: 'construire', ...ce(1), tour: 'caserne' })).toBe('famille_interdite');
  });

  it('dit à quel niveau un élément refusé se débloque, et rien pour un élément ouvert', () => {
    const etat = partieNumero(3);
    monter(etat, 0, 'magie', 2);
    monter(etat, 1, 'tir', 2);
    expect(niveauDeblocage(etat, { type: 'ameliorer', ...ce(0) })).toBe(5);
    expect(niveauDeblocage(etat, { type: 'ameliorer', ...ce(1) })).toBe(4);
    expect(niveauDeblocage(etat, { type: 'construire', ...ce(2), tour: 'divine' })).toBe(10);
    expect(niveauDeblocage(etat, { type: 'construire', ...ce(2), tour: 'caserne' })).toBeNull();
    expect(niveauDeblocage(etat, { type: 'vendre', ...ce(0) })).toBeNull();
    expect(niveauDeblocage(partieNumero(12), { type: 'construire', ...ce(2), tour: 'divine' })).toBeNull();
  });

  it('le rejeu du journal redonne le même état, refus compris', () => {
    const niveau = { ...niveauEssai(), numero: 2 };
    const config = configDe('plume');
    const etat = creerPartie(niveau, config);
    avancer(etat, [{ type: 'construire', ...ce(0), tour: 'tir' }]);
    avancer(etat, [{ type: 'ameliorer', ...ce(0) }]);
    expect(avancer(etat, [{ type: 'ameliorer', ...ce(0) }])).toEqual([{ ok: false, raison: 'non_debloque' }]);
    for (let i = 0; i < 30; i++) avancer(etat, []);
    expect(etat.tours[0]?.niveau).toBe(2);
    const rejoue = rejouer(niveau, config, etat.journal, etat.pas);
    expect(serialiser(rejoue)).toBe(serialiser(etat));
  });
});
