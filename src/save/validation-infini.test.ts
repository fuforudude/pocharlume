// Validation du mode infini de la sauvegarde v5 : records par carte et paliers payés.
import { describe, expect, it } from 'vitest';
import { sauvegardeRemplie } from './aides.test-utils';
import { exporterCode, importerCode } from './code';
import type { Sauvegarde } from './format';
import { validerSauvegarde } from './validation';

function avecInfini(infini: unknown): unknown {
  const s = sauvegardeRemplie();
  return JSON.parse(JSON.stringify({ ...s, meta: { ...s.meta, infini } }));
}

describe('validation du mode infini (v5)', () => {
  it('accepte une sauvegarde sans record ni palier', () => {
    expect(validerSauvegarde(avecInfini({ records: {}, paliers: [] })).ok).toBe(true);
  });

  it('accepte des records et des paliers cohérents, et rend une copie', () => {
    const brut = avecInfini({ records: { chaumes: 31, gue: 4 }, paliers: [10, 20, 30] });
    const r = validerSauvegarde(brut);
    if (!r.ok) throw new Error(r.raison);
    expect(r.valeur.meta.infini).toEqual({ records: { chaumes: 31, gue: 4 }, paliers: [10, 20, 30] });
    expect(r.valeur.meta.infini).not.toBe((brut as Sauvegarde).meta.infini);
  });

  it('refuse un infini absent ou avec une clé en trop', () => {
    const s = sauvegardeRemplie();
    const sans = JSON.parse(JSON.stringify(s)) as { meta: Record<string, unknown> };
    Reflect.deleteProperty(sans.meta, 'infini');
    expect(validerSauvegarde(sans).ok).toBe(false);
    expect(validerSauvegarde(avecInfini({ records: {}, paliers: [], extra: 1 })).ok).toBe(false);
    expect(validerSauvegarde(avecInfini({ records: {} })).ok).toBe(false);
  });

  const piegees: [string, unknown][] = [
    ['record à 0', { records: { chaumes: 0 }, paliers: [] }],
    ['record négatif', { records: { chaumes: -3 }, paliers: [] }],
    ['record fractionnaire', { records: { chaumes: 2.5 }, paliers: [] }],
    ['record en texte', { records: { chaumes: '12' }, paliers: [] }],
    ['record démesuré', { records: { chaumes: 1e9 }, paliers: [] }],
    ['carte au nom invalide', { records: { 'Chau mes': 3 }, paliers: [] }],
    ['carte au nom hérité', { records: { constructor: 3 }, paliers: [] }],
    ['carte vide', { records: { '': 3 }, paliers: [] }],
    ['records en liste', { records: [3], paliers: [] }],
    ['palier inconnu', { records: { chaumes: 60 }, paliers: [15] }],
    ['palier en texte', { records: { chaumes: 60 }, paliers: ['10'] }],
    ['paliers en doublon', { records: { chaumes: 60 }, paliers: [10, 10] }],
    ['paliers dans le désordre', { records: { chaumes: 60 }, paliers: [20, 10] }],
    ['palier payé sans record qui l’atteigne', { records: { chaumes: 19 }, paliers: [10, 20] }],
    ['palier payé sans aucun record', { records: {}, paliers: [10] }],
    ['paliers en objet', { records: {}, paliers: {} }],
  ];
  it.each(piegees)('refuse : %s', (_nom, infini) => {
    expect(validerSauvegarde(avecInfini(infini)).ok).toBe(false);
  });

  it('refuse plus de 64 cartes', () => {
    const records = Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`carte_${String(i)}`, 1]));
    expect(validerSauvegarde(avecInfini({ records, paliers: [] })).ok).toBe(false);
  });
});

describe('export et import du mode infini', () => {
  it('le code redonne exactement les records et les paliers', async () => {
    const s = sauvegardeRemplie();
    const source: Sauvegarde = { ...s, meta: { ...s.meta, infini: { records: { chaumes: 52, gue: 11, quarantaine: 3 }, paliers: [10, 20, 30, 50] } } };
    const r = await importerCode(await exporterCode(source));
    if (!r.ok) throw new Error(r.detail);
    expect(r.sauvegarde.meta.infini).toEqual(source.meta.infini);
  });

  it('un code aux records piégés est refusé', async () => {
    const s = sauvegardeRemplie();
    const piege: Sauvegarde = { ...s, meta: { ...s.meta, infini: { records: { chaumes: 5 }, paliers: [100] } } };
    expect((await importerCode(await exporterCode(piege))).ok).toBe(false);
  });
});
