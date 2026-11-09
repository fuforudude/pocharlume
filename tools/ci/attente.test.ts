// Délais de `npm run ci:attendre` : arrêt après 15 min sans machine (runner du VPS hors ligne), borne totale.
// Logique pure : l'heure est passée en argument.
import { describe, expect, it } from 'vitest';
import { ATTENTE_MACHINE_MAX_MS, ATTENTE_TOTALE_MAX_MS, commencerSuivi, messageSansMachine, suivre, type EtatRun } from './attente.ts';

const MINUTE = 60_000;
const T0 = 1_000_000;

function etat(statut: string, ...jobs: string[]): EtatRun {
  return { statut, jobs: jobs.map((s, i) => ({ nom: `job ${String(i)}`, statut: s })) };
}

describe('suivre : fin du run', () => {
  it('run terminé : termine', () => {
    expect(suivre(commencerSuivi(T0), etat('completed', 'completed'), T0 + MINUTE).decision).toBe('termine');
  });

  it('un job tourne : continuer, sans compter d’attente de machine', () => {
    const r = suivre(commencerSuivi(T0), etat('in_progress', 'completed', 'in_progress', 'queued'), T0 + 20 * MINUTE);
    expect(r.decision).toBe('continuer');
    expect(r.suivi.sansMachineDepuis).toBeNull();
  });
});

describe('suivre : aucune machine ne prend les jobs', () => {
  it('jobs en file sans aucun job en cours : on compte depuis la première observation', () => {
    const r = suivre(commencerSuivi(T0), etat('in_progress', 'completed', 'queued'), T0 + MINUTE);
    expect(r.decision).toBe('continuer');
    expect(r.suivi.sansMachineDepuis).toBe(T0 + MINUTE);
  });

  it('s’arrête après 15 min de file continue', () => {
    let s = commencerSuivi(T0);
    s = suivre(s, etat('queued', 'completed', 'queued'), T0).suivi;
    expect(suivre(s, etat('queued', 'completed', 'queued'), T0 + ATTENTE_MACHINE_MAX_MS - 1).decision).toBe('continuer');
    expect(suivre(s, etat('queued', 'completed', 'queued'), T0 + ATTENTE_MACHINE_MAX_MS).decision).toBe('sans-machine');
    expect(ATTENTE_MACHINE_MAX_MS).toBe(15 * MINUTE);
  });

  it('un job qui démarre remet le compteur à zéro', () => {
    let s = commencerSuivi(T0);
    s = suivre(s, etat('queued', 'queued'), T0).suivi;
    s = suivre(s, etat('in_progress', 'in_progress'), T0 + 10 * MINUTE).suivi;
    expect(s.sansMachineDepuis).toBeNull();
    s = suivre(s, etat('in_progress', 'completed', 'queued'), T0 + 11 * MINUTE).suivi;
    expect(suivre(s, etat('in_progress', 'completed', 'queued'), T0 + 20 * MINUTE).decision).toBe('continuer');
  });

  it('run en file sans job encore listé : compte aussi comme une attente de machine', () => {
    let s = suivre(commencerSuivi(T0), etat('queued'), T0).suivi;
    s = suivre(s, etat('queued'), T0 + 5 * MINUTE).suivi;
    expect(suivre(s, etat('queued'), T0 + 15 * MINUTE).decision).toBe('sans-machine');
  });

  it('les statuts waiting, pending et requested comptent comme en file', () => {
    for (const statut of ['waiting', 'pending', 'requested']) {
      expect(suivre(commencerSuivi(T0), etat('in_progress', statut), T0).suivi.sansMachineDepuis).toBe(T0);
    }
  });
});

describe('suivre : borne totale', () => {
  it('s’arrête après 6 h même si un job tourne', () => {
    expect(ATTENTE_TOTALE_MAX_MS).toBe(6 * 60 * MINUTE);
    expect(suivre(commencerSuivi(T0), etat('in_progress', 'in_progress'), T0 + ATTENTE_TOTALE_MAX_MS - 1).decision).toBe('continuer');
    expect(suivre(commencerSuivi(T0), etat('in_progress', 'in_progress'), T0 + ATTENTE_TOTALE_MAX_MS).decision).toBe('trop-long');
  });

  it('un run terminé l’emporte sur la borne', () => {
    expect(suivre(commencerSuivi(T0), etat('completed', 'completed'), T0 + ATTENTE_TOTALE_MAX_MS * 2).decision).toBe('termine');
  });
});

describe('messageSansMachine', () => {
  it('avertit et donne la relance sur GitHub et l’annulation du run bloqué', () => {
    const texte = messageSansMachine('agents/essai', 4242);
    expect(texte).toContain('runner du VPS hors ligne');
    expect(texte).toContain('gh run cancel 4242');
    expect(texte).toContain('gh workflow run tests.yml --ref agents/essai -f machine=github');
    expect(texte).toContain('-f equilibrage=true');
  });
});
