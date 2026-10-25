import { describe, expect, it } from 'vitest';
import { FIXTURE_V1, StockageTruque, variante } from './aides.test-utils';
import { CLE_SAUVEGARDE, CLE_SECOURS, Depot } from './depot';
import { sauvegardeVide, VERSION_SAUVEGARDE } from './format';
import { enregistrerVictoire } from './progression';

describe('relecture de la sauvegarde', () => {
  it('rend la sauvegarde enregistrée, sans rien écrire', async () => {
    const stockage = new StockageTruque();
    const depot = new Depot(stockage);
    const s = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 2);
    await depot.enregistrer(s);
    const avant = stockage.ecritures;
    const lecture = await depot.relire();
    expect(lecture).toEqual({ etat: 'ok', sauvegarde: s });
    expect(stockage.ecritures).toBe(avant);
  });

  it('distingue « rien d’enregistré » d’un stockage qui ne répond pas', async () => {
    const stockage = new StockageTruque();
    const depot = new Depot(stockage);
    expect(await depot.relire()).toEqual({ etat: 'vide' });
    stockage.panneLecture = true;
    expect(await depot.relire()).toEqual({ etat: 'echec' });
  });

  it('signale un contenu illisible ou plus récent sans y toucher ni le mettre de côté', async () => {
    const stockage = new StockageTruque();
    const depot = new Depot(stockage);
    stockage.donnees.set(CLE_SAUVEGARDE, '{pas du json');
    expect(await depot.relire()).toEqual({ etat: 'illisible' });
    stockage.donnees.set(CLE_SAUVEGARDE, JSON.stringify(variante({ version: VERSION_SAUVEGARDE + 1 })));
    expect(await depot.relire()).toEqual({ etat: 'illisible' });
    expect(stockage.donnees.has(CLE_SECOURS)).toBe(false);
    expect(stockage.ecritures).toBe(0);
  });

  it('lit une ancienne version en la migrant en mémoire, sans la réécrire', async () => {
    const stockage = new StockageTruque();
    stockage.donnees.set(CLE_SAUVEGARDE, FIXTURE_V1);
    const lecture = await new Depot(stockage).relire();
    expect(lecture.etat).toBe('ok');
    expect(stockage.donnees.get(CLE_SAUVEGARDE)).toBe(FIXTURE_V1);
  });
});
