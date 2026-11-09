// Choix de la machine des tests distants à partir de la réponse de l'API de facturation de GitHub.
// Les réponses sont fabriquées ici : aucun appel réseau.
import { describe, expect, it } from 'vitest';
import { choisirRunner, machineDemandee, MINUTES_INCLUSES_PAR_DEFAUT, minutesIncluses, type ReponseApi } from './quota.ts';

/** Une ligne du rapport d'usage (`GET /users/{username}/settings/billing/usage`) pour des minutes Linux. */
function ligneActions(minutes: number, netAmount = 0): Record<string, unknown> {
  return {
    date: '2026-11-03T00:00:00Z',
    product: 'actions',
    sku: 'actions_linux',
    quantity: minutes,
    unitType: 'Minutes',
    pricePerUnit: 0.008,
    grossAmount: minutes * 0.008,
    discountAmount: minutes * 0.008 - netAmount,
    netAmount,
    repositoryName: 'fuforudude/pocharlume',
  };
}

function reponse(corps: unknown, statut = 200): ReponseApi {
  return { statut, corps: JSON.stringify(corps) };
}

const AVEC_JETON = { jetonPresent: true, minutesIncluses: 2000 } as const;

describe('choisirRunner : rapport d’usage actuel', () => {
  it('100 % restant (aucune minute consommée) : GitHub, sans avertissement', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: reponse({ usageItems: [] }) });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.restant).toBe(1);
    expect(choix.avertissement).toBeNull();
  });

  it('10 % restant tout juste : encore GitHub (le relais part sous 10 %)', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: reponse({ usageItems: [ligneActions(1000), ligneActions(800)] }) });
    expect(choix.restant).toBeCloseTo(0.1);
    expect(choix.runner).toBe('ubuntu-latest');
  });

  it('9 % restant : le VPS', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: reponse({ usageItems: [ligneActions(1820)] }) });
    expect(choix.restant).toBeCloseTo(0.09);
    expect(choix.runner).toBe('vps');
    expect(choix.avertissement).toBeNull();
  });

  it('ne compte que les minutes d’Actions (pas le stockage, pas les autres produits)', () => {
    const items = [
      ligneActions(100),
      { ...ligneActions(5000), sku: 'actions_storage', unitType: 'GigabyteHours' },
      { ...ligneActions(5000), product: 'copilot', sku: 'copilot_premium_request', unitType: 'Requests' },
    ];
    expect(choisirRunner({ ...AVEC_JETON, reponse: reponse({ usageItems: items }) }).restant).toBeCloseTo(0.95);
  });

  it('des minutes déjà facturées (montant net positif) : quota épuisé, le VPS', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: reponse({ usageItems: [ligneActions(10, 0.5)] }) });
    expect(choix.restant).toBe(0);
    expect(choix.runner).toBe('vps');
  });

  it('plus de minutes que le quota : 0 %, jamais négatif', () => {
    expect(choisirRunner({ ...AVEC_JETON, reponse: reponse({ usageItems: [ligneActions(2600)] }) }).restant).toBe(0);
  });

  it('accepte aussi le résumé d’usage (grossQuantity, en aperçu public chez GitHub)', () => {
    const corps = { timePeriod: { year: 2026, month: 11 }, user: 'fuforudude', usageItems: [{ product: 'actions', sku: 'actions_linux', unitType: 'minutes', grossQuantity: 1900, netAmount: 0 }] };
    const choix = choisirRunner({ ...AVEC_JETON, reponse: reponse(corps) });
    expect(choix.restant).toBeCloseTo(0.05);
    expect(choix.runner).toBe('vps');
  });
});

describe('choisirRunner : ancienne API (/settings/billing/actions)', () => {
  it('prend le quota de la réponse elle-même', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: reponse({ total_minutes_used: 2850, total_paid_minutes_used: 0, included_minutes: 3000 }) });
    expect(choix.restant).toBeCloseTo(0.05);
    expect(choix.runner).toBe('vps');
  });

  it('100 % restant', () => {
    expect(choisirRunner({ ...AVEC_JETON, reponse: reponse({ total_minutes_used: 0, included_minutes: 3000 }) }).runner).toBe('ubuntu-latest');
  });
});

describe('choisirRunner : quota illimité', () => {
  it('GitHub, 100 % restant, quelle que soit la consommation', () => {
    const choix = choisirRunner({ jetonPresent: true, minutesIncluses: 'illimite', reponse: reponse({ usageItems: [ligneActions(99999)] }) });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.restant).toBe(1);
    expect(choix.avertissement).toBeNull();
  });
});

describe('choisirRunner : cas dégradés, toujours GitHub avec un avertissement', () => {
  it('secret absent', () => {
    const choix = choisirRunner({ jetonPresent: false, minutesIncluses: 2000, reponse: null });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.restant).toBeNull();
    expect(choix.avertissement).toContain('QUOTA_GITHUB');
  });

  it('API en erreur (statut HTTP)', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: { statut: 403, corps: '{"message":"Resource not accessible by personal access token"}' } });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.avertissement).toContain('403');
  });

  it('API injoignable (erreur réseau)', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: { erreur: 'délai dépassé' } });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.avertissement).toContain('délai dépassé');
  });

  it('corps qui n’est pas du JSON', () => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: { statut: 200, corps: '<html>' } });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.avertissement).not.toBeNull();
  });

  it.each([
    ['objet sans le champ attendu', { autre: 1 }],
    ['usageItems qui n’est pas une liste', { usageItems: 'rien' }],
    ['ligne d’Actions sans quantité', { usageItems: [{ product: 'actions', sku: 'actions_linux', unitType: 'Minutes' }] }],
    ['quantité négative', { usageItems: [ligneActions(-5)] }],
    ['ancienne API avec quota non numérique', { total_minutes_used: 10, included_minutes: 'beaucoup' }],
    ['ancienne API avec quota nul', { total_minutes_used: 10, included_minutes: 0 }],
    ['tableau nu', []],
    ['null', null],
  ])('réponse inattendue : %s', (_cas, corps) => {
    const choix = choisirRunner({ ...AVEC_JETON, reponse: reponse(corps) });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.restant).toBeNull();
    expect(choix.avertissement).not.toBeNull();
  });

  it('un quota inclus inutilisable (0) : GitHub avec avertissement', () => {
    const choix = choisirRunner({ jetonPresent: true, minutesIncluses: 0, reponse: reponse({ usageItems: [] }) });
    expect(choix.runner).toBe('ubuntu-latest');
    expect(choix.avertissement).not.toBeNull();
  });
});

describe('minutesIncluses (variable MINUTES_INCLUSES)', () => {
  it('par défaut, le quota du forfait gratuit', () => {
    expect(minutesIncluses(undefined)).toBe(MINUTES_INCLUSES_PAR_DEFAUT);
    expect(minutesIncluses('')).toBe(MINUTES_INCLUSES_PAR_DEFAUT);
    expect(MINUTES_INCLUSES_PAR_DEFAUT).toBe(2000);
  });

  it('un nombre entier positif, ou « illimite »', () => {
    expect(minutesIncluses('3000')).toBe(3000);
    expect(minutesIncluses(' illimite ')).toBe('illimite');
  });

  it('une valeur invalide retombe sur le défaut', () => {
    expect(minutesIncluses('beaucoup')).toBe(MINUTES_INCLUSES_PAR_DEFAUT);
    expect(minutesIncluses('-4')).toBe(MINUTES_INCLUSES_PAR_DEFAUT);
  });
});

describe('machineDemandee (entrée machine de workflow_dispatch)', () => {
  it('auto, github ou vps, sans tenir compte de la casse ni des espaces', () => {
    expect(machineDemandee('auto', 'fuforudude')).toBe('auto');
    expect(machineDemandee(' GitHub ', 'fuforudude')).toBe('github');
    expect(machineDemandee('vps', 'fuforudude')).toBe('vps');
  });

  it('absente (push) ou invalide : auto', () => {
    expect(machineDemandee(undefined, 'fuforudude')).toBe('auto');
    expect(machineDemandee('', 'fuforudude')).toBe('auto');
    expect(machineDemandee('ailleurs', 'fuforudude')).toBe('auto');
  });

  it('Dependabot ne part jamais sur le VPS, même forcé', () => {
    expect(machineDemandee('vps', 'dependabot[bot]')).toBe('github');
    expect(machineDemandee(undefined, 'dependabot[bot]')).toBe('github');
  });
});

describe('choisirRunner : machine choisie à la main', () => {
  const peuDeMinutes = reponse({ usageItems: [ligneActions(1990)] });

  it('github : GitHub même si le quota est presque épuisé, sans avertissement', () => {
    const choix = choisirRunner({ ...AVEC_JETON, machine: 'github', reponse: peuDeMinutes });
    expect(choix).toEqual({ runner: 'ubuntu-latest', restant: null, avertissement: null });
  });

  it('vps : le VPS même avec tout le quota, et même sans secret', () => {
    expect(choisirRunner({ ...AVEC_JETON, machine: 'vps', reponse: reponse({ usageItems: [] }) }).runner).toBe('vps');
    expect(choisirRunner({ jetonPresent: false, minutesIncluses: 2000, machine: 'vps', reponse: null })).toEqual({ runner: 'vps', restant: null, avertissement: null });
  });

  it('auto : le quota décide, comme sans entrée', () => {
    expect(choisirRunner({ ...AVEC_JETON, machine: 'auto', reponse: peuDeMinutes }).runner).toBe('vps');
    expect(choisirRunner({ ...AVEC_JETON, machine: 'auto', reponse: reponse({ usageItems: [] }) }).runner).toBe('ubuntu-latest');
  });
});
