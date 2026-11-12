import { describe, expect, it } from 'vitest';
import { CONFIG } from '../aides.test-utils';
import type { Action } from '../actions';
import type { Niveau } from '../definitions';
import type { EtatPartie } from '../etat';
import { avancer, creerPartie, deserialiser, rejouer, serialiser } from '../partie';
import { niveauDynamique } from './niveaux-essai.test-utils';

/** Un niveau qui a de tout : charge, nasse, canon à eau, renforts, chemin qui s'ouvre, foules des deux conditions. */
function niveauComplet(): Niveau {
  const paysans = (chemin: number, nombre: number): { ennemi: string; nombre: number; intervalle: number; chemin: number; delai: number } => ({
    ennemi: 'paysan_affame',
    nombre,
    intervalle: 1,
    chemin,
    delai: 1,
  });
  return niveauDynamique({
    aretes: 400,
    mobiles: [1],
    cheminsFermes: [{ chemin: 1, repli: 0 }],
    vagues: [{ paquets: [paysans(0, 6), paysans(1, 4)] }, { paquets: [paysans(1, 6), paysans(0, 6)] }, { paquets: [paysans(0, 8)] }],
    evenements: [
      { vague: 1, delai: 4, type: 'charge', chemin: 0, ennemi: 'chien_errant', nombre: 3, intervalle: 0.5, facteurVitesse: 1.8, duree: 3 },
      { vague: 1, delai: 6, type: 'nasse', chemin: 0, debut: 12, longueur: 3, duree: 4 },
      { vague: 2, type: 'ouvrir_chemin', chemin: 1 },
      { vague: 2, delai: 8, type: 'canon_a_eau', cy: 2, recul: 2, etourdissement: 1.5 },
      { vague: 3, type: 'renforts', x: 14, y: 5, nombre: 2, duree: 6, unite: 'etudiant' },
    ],
    foules: [
      { cases: [{ cx: 5, cy: 3 }], condition: { type: 'payer', cout: 40 }, effet: { type: 'ralentir', rayon: 3, facteur: 0.5, duree: 3 }, recharge: 12 },
      { cases: [{ cx: 8, cy: 2 }], condition: { type: 'heros', duree: 2 }, effet: { type: 'bloquer', chemin: 0, debut: 20, longueur: 2, duree: 3 }, utilisations: 2 },
    ],
  });
}

/** Les gestes du joueur, par pas : tours, foule payée à deux reprises, héros envoyé dans la foule. */
const GESTES: Readonly<Record<number, readonly Action[]>> = {
  0: [{ type: 'construire', tour: 'tir', cx: 7, cy: 3 }, { type: 'construire', tour: 'tir', cx: 4, cy: 6 }, { type: 'appelerVague' }],
  60: [{ type: 'deplacerHeros', x: 17, y: 5 }],
  150: [{ type: 'activerFoule', foule: 0 }],
  500: [{ type: 'activerFoule', foule: 0 }],
  900: [{ type: 'activerFoule', foule: 0 }, { type: 'construire', tour: 'artillerie', cx: 9, cy: 3 }],
};

function jouerJusqua(etat: EtatPartie, pasFinal: number): void {
  while (etat.statut === 'en_cours' && etat.pas < pasFinal) avancer(etat, GESTES[etat.pas] ?? []);
}

describe('rejeu et reprise avec événements et foules', () => {
  it('rejouer la graine et le journal redonne le même état, octet pour octet', () => {
    const niveau = niveauComplet();
    const etat = creerPartie(niveau, CONFIG);
    jouerJusqua(etat, 1800);
    // La partie a bien vu passer ce qu'on veut rejouer.
    expect(etat.journal.some((e) => e.action.type === 'activerFoule')).toBe(true);
    expect(etat.dynamique.cheminsActifs).toEqual([true, true]);
    expect(etat.dynamique.evenements.filter((e) => e.declenche).length).toBeGreaterThanOrEqual(4);
    const rejoue = rejouer(niveau, CONFIG, etat.journal, etat.pas);
    expect(serialiser(rejoue)).toBe(serialiser(etat));
  });

  it('reprendre une sauvegarde en pleine partie (nasse et recharge en cours) redonne le même état qu’une partie sans interruption', () => {
    const niveau = niveauComplet();
    const continue_ = creerPartie(niveau, CONFIG);
    const coupee = creerPartie(niveau, CONFIG);
    jouerJusqua(continue_, 230);
    jouerJusqua(coupee, 230);
    expect(coupee.dynamique.barrages.length + coupee.dynamique.foules.filter((f) => f.recharge > 0).length).toBeGreaterThan(0);
    const reprise = deserialiser(serialiser(coupee));
    jouerJusqua(continue_, 1500);
    jouerJusqua(reprise, 1500);
    expect(serialiser(reprise)).toBe(serialiser(continue_));
  });
});
