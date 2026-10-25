import { describe, expect, it } from 'vitest';
import { DIFFICULTES } from '../data/difficultes';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import { REGLES } from '../data/regles';
import { CONFIG, avancerPas, avancerSecondes, ennemiEssai, niveauEssai } from './aides-tests';
import { ajouterEnnemi } from './ennemis';
import { appliquerAction, avancer, creerPartie, etoilesPour, step, validerAction } from './partie';
import { PAS_PAR_SECONDE } from './temps';

describe('création d’une partie', () => {
  it('part des vies et des arêtes de la difficulté', () => {
    for (const [id, difficulte] of Object.entries(DIFFICULTES)) {
      const etat = creerPartie(NIVEAU_TEST, { ...CONFIG, difficulte: id });
      expect(etat.vies).toBe(difficulte.vies);
      expect(etat.viesDepart).toBe(difficulte.vies);
      expect(etat.aretes).toBe(Math.round(NIVEAU_TEST.aretesDepart * difficulte.aretesDepart));
      expect(etat.statut).toBe('en_cours');
      expect(etat.pas).toBe(0);
    }
  });

  it('copie le niveau : modifier la partie ne touche pas aux données', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    expect(etat.niveau).toEqual(NIVEAU_TEST);
    expect(etat.niveau).not.toBe(NIVEAU_TEST);
  });

  it('refuse une difficulté, un dieu ou un niveau de héros inconnus', () => {
    expect(() => creerPartie(NIVEAU_TEST, { ...CONFIG, difficulte: 'facile' })).toThrow('facile');
    expect(() => creerPartie(NIVEAU_TEST, { ...CONFIG, dieu: 'zeus' })).toThrow('zeus');
    expect(() => creerPartie(NIVEAU_TEST, { ...CONFIG, niveauHeros: 0 })).toThrow();
  });

  it('avance d’un pas à la fois', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    step(etat);
    step(etat);
    expect(etat.pas).toBe(2);
  });
});

describe('vagues', () => {
  const pasPremiereVague = REGLES.delaiPremiereVague * PAS_PAR_SECONDE;

  it('lance la première vague automatiquement après le compte à rebours', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    avancerPas(etat, pasPremiereVague);
    expect(etat.vagues.lancees).toBe(0);
    avancerPas(etat, 1);
    expect(etat.vagues.lancees).toBe(1);
    expect(etat.evenements).toContainEqual({ type: 'vague', index: 0, bonus: 0 });
  });

  it('fait apparaître les paquets à leur intervalle, sur leur chemin', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    appliquerAction(etat, { type: 'appelerVague' });
    step(etat);
    expect(etat.ennemis).toHaveLength(1);
    avancerSecondes(etat, 1.5);
    expect(etat.ennemis).toHaveLength(2);
    avancerSecondes(etat, 6);
    expect(etat.ennemis).toHaveLength(6);
    expect(etat.ennemis.every((e) => e.type === 'paysan_affame' && e.chemin === 0)).toBe(true);
  });

  it('donne un bonus d’arêtes quand le joueur appelle une vague en avance, sauf la première', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    const depart = etat.aretes;
    expect(avancer(etat, [{ type: 'appelerVague' }])).toEqual([{ ok: true }]);
    expect(etat.aretes).toBe(depart);
    const restant = etat.vagues.prochaine - etat.pas;
    const bonus = Math.floor((restant / PAS_PAR_SECONDE) * REGLES.aretesParSecondeAvance);
    expect(bonus).toBeGreaterThan(0);
    appliquerAction(etat, { type: 'appelerVague' });
    expect(etat.aretes).toBe(depart + bonus);
    expect(etat.evenements).toContainEqual({ type: 'vague', index: 1, bonus });
  });

  it('refuse d’appeler une vague quand il n’en reste plus', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    for (let i = 0; i < NIVEAU_TEST.vagues.length; i++) {
      expect(appliquerAction(etat, { type: 'appelerVague' })).toEqual({ ok: true });
    }
    expect(validerAction(etat, { type: 'appelerVague' })).toBe('plus_de_vague');
    expect(appliquerAction(etat, { type: 'appelerVague' })).toEqual({ ok: false, raison: 'plus_de_vague' });
  });

  it('applique le multiplicateur de PV de la difficulté aux ennemis', () => {
    const etat = creerPartie(NIVEAU_TEST, { ...CONFIG, difficulte: 'chaton' });
    appliquerAction(etat, { type: 'appelerVague' });
    step(etat);
    expect(etat.ennemis[0]?.pvMax).toBe(40 * DIFFICULTES.chaton.pvEnnemis);
  });
});

describe('fin de partie', () => {
  it('perd quand les vies tombent à 0, puis ne bouge plus et refuse les actions', () => {
    const etat = creerPartie(NIVEAU_TEST, CONFIG);
    for (let i = 0; i < 5; i++) appliquerAction(etat, { type: 'appelerVague' });
    avancerSecondes(etat, 400);
    expect(etat.statut).toBe('defaite');
    expect(etat.vies).toBe(0);
    expect(etat.etoiles).toBe(0);
    const pas = etat.pas;
    const fin = etat.evenements;
    step(etat);
    expect(etat.pas).toBe(pas);
    expect(etat.evenements).toEqual(fin);
    expect(appliquerAction(etat, { type: 'appelerVague' })).toEqual({ ok: false, raison: 'partie_terminee' });
  });

  it('gagne quand toutes les vagues sont passées et qu’il ne reste aucun ennemi', () => {
    const niveau = niveauEssai([{ paquets: [{ ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 0 }] }]);
    const etat = creerPartie(niveau, CONFIG);
    appliquerAction(etat, { type: 'construire', socle: 0, tour: 'tir' });
    appliquerAction(etat, { type: 'construire', socle: 1, tour: 'tir' });
    appliquerAction(etat, { type: 'construire', socle: 2, tour: 'magie' });
    appliquerAction(etat, { type: 'appelerVague' });
    let fin = false;
    for (let i = 0; i < 60 * PAS_PAR_SECONDE && !fin; i++) {
      step(etat);
      fin = etat.statut !== 'en_cours';
    }
    expect(etat.statut).toBe('victoire');
    expect(etat.etoiles).toBe(3);
    expect(etat.evenements).toContainEqual({ type: 'fin', statut: 'victoire', etoiles: 3 });
  });

  it('ne gagne pas tant qu’un ennemi ajouté hors vague est vivant', () => {
    const niveau = niveauEssai([{ paquets: [] }]);
    const etat = creerPartie(niveau, CONFIG);
    appliquerAction(etat, { type: 'appelerVague' });
    ajouterEnnemi(etat, ennemiEssai(), 'paysan_affame', 0, 0);
    step(etat);
    expect(etat.statut).toBe('en_cours');
  });

  it('compte les étoiles selon les vies restantes', () => {
    expect(etoilesPour(20, 20)).toBe(3);
    expect(etoilesPour(19, 20)).toBe(2);
    expect(etoilesPour(10, 20)).toBe(2);
    expect(etoilesPour(9, 20)).toBe(1);
    expect(etoilesPour(1, 20)).toBe(1);
    expect(etoilesPour(0, 20)).toBe(0);
  });
});
