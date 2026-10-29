import { describe, expect, it } from 'vitest';
import { BRAISES_DEFI } from '../data/meta';
import { t } from '../i18n';
import type { BilanPartie } from '../save';
import { lignesBilan } from './ecrans';

const BILAN: BilanPartie = {
  aretes: 0,
  braises: 0,
  xp: 0,
  nouvellesEtoiles: 0,
  heros: 'charlie',
  niveauHeros: { avant: 1, apres: 1 },
  objetsConsommes: [],
  objetsRendus: [],
};

describe('bilan de fin : défi, disciple offert, région ouverte', () => {
  it('rien à signaler : aucune ligne de plus', () => {
    expect(lignesBilan(BILAN)).toEqual([]);
  });

  it('un défi réussi pour la première fois dit lequel et la prime de braises', () => {
    const heroique = lignesBilan({ ...BILAN, braises: BRAISES_DEFI, defiReussi: 'heroique' });
    expect(heroique).toContain(t('fin.bilan_defi', { defi: 'Héroïque', n: BRAISES_DEFI }));
    expect(lignesBilan({ ...BILAN, braises: 4, defiReussi: 'fer' })).toContain(t('fin.bilan_defi', { defi: 'Fer', n: 4 }));
    expect(t('fin.bilan_defi', { defi: 'Fer', n: 4 })).toBe('Défi Fer réussi : +4 braises');
  });

  it('un disciple offert est annoncé par son nom', () => {
    expect(lignesBilan({ ...BILAN, discipleOffert: 'suie' })).toEqual([t('fin.bilan_disciple', { nom: 'Suie' })]);
  });

  it('une région débloquée est annoncée par son nom', () => {
    expect(lignesBilan({ ...BILAN, regionDebloquee: 2 })).toEqual([t('fin.bilan_region', { nom: 'Les Champs Brûlés' })]);
    expect(lignesBilan({ ...BILAN, regionDebloquee: 4 })).toEqual([t('fin.bilan_region', { nom: 'Les Marais de l’Ordalie' })]);
  });

  it('une région que l’écran ne connaît pas est annoncée par son numéro', () => {
    expect(lignesBilan({ ...BILAN, regionDebloquee: 11 })).toEqual([t('fin.bilan_region_numero', { n: 11 })]);
    expect(lignesBilan({ ...BILAN, regionDebloquee: 7 })).toEqual([t('fin.bilan_region', { nom: 'Les Routes de la Croisade' })]);
  });

  it('tout ensemble, après le butin habituel et dans l’ordre : défi, disciple, région', () => {
    const lignes = lignesBilan({ ...BILAN, aretes: 120, braises: 9, defiReussi: 'heroique', discipleOffert: 'mastoc', regionDebloquee: 3 });
    expect(lignes.map((l) => l.split(' ')[0])).toEqual(['+120', '+9', 'Défi', 'Mastoc', 'Région']);
  });
});
