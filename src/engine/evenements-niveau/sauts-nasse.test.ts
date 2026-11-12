// Règle décidée : le sauteur (Crapaud Gonflé) et le plongeur (Dame du Puits) FRANCHISSENT une nasse. Leur saut n'est pas borné par la
// coupure : seuls les ennemis qui marchent s'arrêtent à son entrée. Ces tests figent cette règle (voir aussi la fiche du Bestiaire :
// « saute par-dessus les nasses »).
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../../data/ennemis';
import { CONFIG, avancerSecondes, ennemiDonnees, evenementsPendant } from '../aides.test-utils';
import { appliquerAction, creerPartie, step } from '../partie';
import type { EtatPartie } from '../etat';
import { niveauDynamique } from './niveaux-essai.test-utils';

/** Nasse sur le chemin 0 de la tuile 8 à la tuile 12, active après 3 s et pour 40 s ; une caserne dont les soldats tiennent la route. */
function partieAvecNasse(): EtatPartie {
  const etat = creerPartie(niveauDynamique({ evenements: [{ vague: 1, type: 'nasse', chemin: 0, debut: 8, longueur: 4, duree: 40 }] }), CONFIG);
  expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
  expect(appliquerAction(etat, { type: 'construire', tour: 'caserne', cx: 3, cy: 3 }).ok).toBe(true);
  avancerSecondes(etat, 3.5);
  expect(etat.dynamique.barrages).toHaveLength(1);
  return etat;
}

describe('une nasse n’arrête pas ceux qui sautent', () => {
  it('un ennemi qui marche s’arrête à l’entrée de la nasse (témoin)', () => {
    const etat = partieAvecNasse();
    const marcheur = ennemiDonnees(etat, 'paysan_affame', 1, { vitesse: 1.5, pv: 1e9, degats: [0, 0] });
    avancerSecondes(etat, 10);
    expect(marcheur.distance).toBeLessThanOrEqual(8);
  });

  it('le sauteur retenu par un soldat bondit par-dessus l’entrée : il se retrouve dans la nasse', () => {
    const etat = partieAvecNasse();
    const crapaud = ennemiDonnees(etat, 'crapaud_gonfle', 1, { vitesse: ENNEMIS.crapaud_gonfle.vitesse, pv: 1e9, degats: [0, 0] });
    let bond = false;
    for (let i = 0; i < 30 * 12 && !bond; i++) {
      step(etat);
      bond = etat.evenements.some((e) => e.type === 'bond');
    }
    expect(bond).toBe(true);
    expect(crapaud.distance).toBeGreaterThan(8);
  });

  it('le plongeur ressort plus loin, au-delà de l’entrée de la nasse', () => {
    const etat = partieAvecNasse();
    const dame = ennemiDonnees(etat, 'dame_puits', 6, { pv: 1e6 });
    dame.pv = dame.pvMax * 0.6;
    const vus = evenementsPendant(etat, 4);
    expect(vus.some((e) => e.type === 'emergence' && e.ennemi === dame.id)).toBe(true);
    expect(dame.distance).toBeGreaterThan(8);
  });
});
