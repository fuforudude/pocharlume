// Quelles fiches « Nouvel ennemi » s'ouvrent : décidé avec une vraie session en mémoire.
import { describe, expect, it } from 'vitest';
import { Depot, Session, StockageMemoire, creerVerrouMemoire } from '../save';
import { ennemisAMontrer } from './fiches-ennemis';

async function ouvrir(): Promise<Session> {
  return Session.ouvrir(new Depot(new StockageMemoire()), null, { verrou: creerVerrouMemoire() });
}

const attendre = (): Promise<void> => new Promise((r) => setTimeout(r, 20));

describe('ennemisAMontrer', () => {
  it('un ennemi jamais rencontré est montré et noté ; la fois suivante, plus rien', async () => {
    const s = await ouvrir();
    expect(ennemisAMontrer(s, ['mendiant', 'chien_errant', 'mendiant'], false)).toEqual(['mendiant', 'chien_errant']);
    await attendre();
    expect(s.sauvegarde.meta.bestiaire.rencontres).toEqual(['chien_errant', 'mendiant']);
    expect(ennemisAMontrer(s, ['mendiant'], false)).toEqual([]);
  });

  it('l’option coupée ne montre rien mais note quand même les rencontres', async () => {
    const s = await ouvrir();
    await s.changerFichesEnnemis(false);
    expect(ennemisAMontrer(s, ['mendiant'], false)).toEqual([]);
    await attendre();
    expect(s.sauvegarde.meta.bestiaire.rencontres).toEqual(['mendiant']);
  });

  it('hors sauvegarde (niveau d’essai), ni fiche ni rencontre', async () => {
    const s = await ouvrir();
    expect(ennemisAMontrer(s, ['mendiant'], true)).toEqual([]);
    await attendre();
    expect(s.sauvegarde.meta.bestiaire.rencontres).toEqual([]);
  });

  it('un mélange de connus et d’inconnus ne montre que les inconnus', async () => {
    const s = await ouvrir();
    await s.rencontrerEnnemis(['paysan_affame']);
    expect(ennemisAMontrer(s, ['paysan_affame', 'corbeau_noir'], false)).toEqual(['corbeau_noir']);
  });
});
