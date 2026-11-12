import { describe, expect, it } from 'vitest';
import { creerPartie, type Foule } from '../engine';
import { CONFIG } from '../engine/aides.test-utils';
import { niveauDynamique } from '../engine/evenements-niveau/niveaux-essai.test-utils';
import { fouleSous, texteBandeau, toucherFoule } from './evenements-niveau';

const PAYER: Foule = { cases: [{ cx: 5, cy: 3 }], condition: { type: 'payer', cout: 50 }, effet: { type: 'ralentir', rayon: 3, facteur: 0.5, duree: 4 }, recharge: 10 };
const HEROS: Foule = { cases: [{ cx: 5, cy: 2 }], condition: { type: 'heros', duree: 2 }, effet: { type: 'renforts', nombre: 2, duree: 5, unite: 'etudiant' }, recharge: 20 };

describe('bandeau des événements', () => {
  const etat = creerPartie(niveauDynamique({ foules: [PAYER] }), CONFIG);

  it('annonce chaque type avec le numéro du chemin compté à partir de 1', () => {
    expect(texteBandeau(etat, { type: 'annonce_evenement', index: 0, typeEvenement: 'charge', chemin: 1, dans: 3 })).toBe('Charge sur le chemin 2 !');
    expect(texteBandeau(etat, { type: 'annonce_evenement', index: 0, typeEvenement: 'nasse', chemin: 0, dans: 3 })).toBe('Nasse sur le chemin 1 !');
    expect(texteBandeau(etat, { type: 'annonce_evenement', index: 0, typeEvenement: 'canon_a_eau', chemin: -1, dans: 3 })).toBe('Canon à eau !');
    for (const type of ['renforts', 'ouvrir_chemin', 'fermer_chemin'] as const) {
      expect(texteBandeau(etat, { type: 'annonce_evenement', index: 0, typeEvenement: type, chemin: 0, dans: 3 })).toBeTruthy();
    }
  });

  it('dit la vente d’office et l’effet d’une foule activée, et rien pour le reste', () => {
    expect(texteBandeau(etat, { type: 'vente_office', tour: 1, cx: 1, cy: 1, place: -1, x: 3, y: 3, aretes: 120 })).toContain('120');
    expect(texteBandeau(etat, { type: 'foule_activee', foule: 0, x: 11, y: 7 })).toBe('La foule ralentit les ennemis !');
    expect(texteBandeau(etat, { type: 'vague', index: 0, bonus: 0 })).toBeNull();
  });
});

describe('toucher une foule', () => {
  it('trouve la foule sous le doigt', () => {
    const etat = creerPartie(niveauDynamique({ foules: [PAYER, HEROS] }), CONFIG);
    expect(fouleSous(etat, 11, 7)).toBe(0);
    expect(fouleSous(etat, 11, 5)).toBe(1);
    expect(fouleSous(etat, 20, 7)).toBe(-1);
  });

  it('une foule « payer » prête donne la commande ; sans assez d’arêtes, la bulle redit le prix', () => {
    expect(toucherFoule(creerPartie(niveauDynamique({ foules: [PAYER] }), CONFIG), 0).action).toEqual({ type: 'activerFoule', foule: 0 });
    const pauvre = toucherFoule(creerPartie(niveauDynamique({ foules: [PAYER], aretes: 10 }), CONFIG), 0);
    expect(pauvre.action).toBeNull();
    expect(pauvre.refus).toBe('aretes_insuffisantes');
    expect(pauvre.message).toContain('50');
  });

  it('une foule « héros » explique comment l’activer', () => {
    const geste = toucherFoule(creerPartie(niveauDynamique({ foules: [HEROS] }), CONFIG), 0);
    expect(geste.action).toBeNull();
    expect(geste.message).toContain('héros');
  });
});
