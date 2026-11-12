import { describe, expect, it } from 'vitest';
import { creerPartie, type Foule } from '../engine';
import { Surbrillance } from '../render/rendu';
import { CONFIG } from '../engine/aides.test-utils';
import { niveauDynamique } from '../engine/evenements-niveau/niveaux-essai.test-utils';
import { Interaction } from './interaction';
import { fouleSous, fouleVisee, reunirParoles, texteBandeau, toucherFoule } from './evenements-niveau';

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

  it('dit l’effet d’une foule activée, et rien pour le reste', () => {
    expect(texteBandeau(etat, { type: 'foule_activee', foule: 0, x: 11, y: 7 })).toBe('La foule ralentit les ennemis !');
    expect(texteBandeau(etat, { type: 'vague', index: 0, bonus: 0 })).toBeNull();
  });
});

describe('paroles d’un même pas', () => {
  it('réunit en un seul bandeau l’annonce et la parole du boss, au lieu de laisser la seconde écraser la première', () => {
    expect(reunirParoles([])).toBeNull();
    expect(reunirParoles(['Charge sur le chemin 1 !'])).toBe('Charge sur le chemin 1 !');
    expect(reunirParoles(['Charge sur le chemin 1 !', 'Le boss parle.'])).toBe('Charge sur le chemin 1 ! Le boss parle.');
  });
});

describe('héros posté dans une foule', () => {
  /** Héros posé sur la case de la foule (5, 3) : centre (11, 7). */
  function heroDansLaFoule(foule: Foule): ReturnType<typeof creerPartie> {
    const etat = creerPartie(niveauDynamique({ foules: [foule] }), CONFIG);
    const h = etat.unites.find((u) => u.id === etat.heros);
    if (!h) throw new Error('pas de héros');
    h.x = 11;
    h.y = 7;
    return etat;
  }

  it('toucher le héros dans une foule « payer » le sélectionne et n’active pas la foule', () => {
    const etat = heroDansLaFoule(PAYER);
    expect(fouleSous(etat, 11, 7)).toBe(0);
    expect(fouleVisee(etat, 11, 7, 0.9)).toBe(-1);
    const aretes = etat.aretes;
    const issue = new Interaction();
    issue.toucher(etat, 11, 7, 0.9);
    expect(issue.mode.type).toBe('heros');
    expect(etat.aretes).toBe(aretes);
  });

  it('toucher la foule ailleurs que sur le héros l’active toujours', () => {
    const etat = heroDansLaFoule(PAYER);
    expect(fouleVisee(etat, 10.5, 6.5, 0.3)).toBe(0);
  });
});

describe('cases de foule et interface', () => {
  it('une case de foule ne s’éclaire pas comme constructible et n’ouvre pas de menu de construction', () => {
    const etat = creerPartie(niveauDynamique({ foules: [PAYER] }), CONFIG);
    const interaction = new Interaction();
    // Une case libre d’abord, pour avoir un menu ouvert : la case (5, 4).
    expect(interaction.toucher(etat, 11, 9, 0.1).refus).toBeNull();
    expect(interaction.mode.type).toBe('menu');
    expect(interaction.toucher(etat, 11, 7.2, 0.1)).toEqual({ action: null, refus: 'case_interdite' });
    interaction.viser(etat, 11, 7.2);
    const surbrillance = new Surbrillance();
    interaction.surbrillance(etat, surbrillance);
    expect(surbrillance.viseeInterdite).toBe(true);
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
