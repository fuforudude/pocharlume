import { describe, expect, it } from 'vitest';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import { avancer, creerPartie, type Action, type EtatPartie } from '../engine';
import { avancerPas, CONFIG } from '../engine/aides.test-utils';
import { Surbrillance } from '../render/rendu';
import { cibleTouchee, Interaction, rayonObjet, rayonSort } from './interaction';
import { elementsMenu } from './menu-cercle';

const RAYON = 0.9;

function partie(): EtatPartie {
  return creerPartie(NIVEAU_TEST, CONFIG);
}

/** Envoie l'action au moteur comme le fait la boucle de jeu. */
function envoyer(etat: EtatPartie, action: Action | null): void {
  expect(action).not.toBeNull();
  if (action) expect(avancer(etat, [action])[0]?.ok).toBe(true);
}

describe('cibleTouchee', () => {
  it('trouve un socle sur son corps, pas seulement à ses pieds', () => {
    const etat = partie();
    expect(cibleTouchee(etat, 8, 6, RAYON)).toEqual({ type: 'socle', socle: 0 });
    expect(cibleTouchee(etat, 8.2, 5.5, RAYON)).toEqual({ type: 'socle', socle: 0 });
  });

  it('trouve le héros et le préfère au socle quand il est plus proche', () => {
    const etat = partie();
    expect(cibleTouchee(etat, 16, 12.5, RAYON)).toEqual({ type: 'heros' });
  });

  it('ne trouve rien au-delà du rayon', () => {
    const etat = partie();
    expect(cibleTouchee(etat, 3, 12, RAYON)).toBeNull();
    expect(cibleTouchee(etat, 8, 6, 0.1)).toBeNull();
  });

  it('un rayon plus grand rend le toucher plus tolérant (cible tactile de 44 px)', () => {
    const etat = partie();
    expect(cibleTouchee(etat, 9.4, 5.5, 0.9)).toBeNull();
    expect(cibleTouchee(etat, 9.4, 5.5, 1.5)).toEqual({ type: 'socle', socle: 0 });
  });

  it('ignore le héros tombé', () => {
    const etat = partie();
    const heros = etat.unites.find((u) => u.id === etat.heros);
    if (heros) heros.mort = true;
    expect(cibleTouchee(etat, 16, 12.5, RAYON)).toBeNull();
  });
});

describe('socles et menu', () => {
  it('toucher un socle ouvre son menu, le retoucher le ferme', () => {
    const etat = partie();
    const ui = new Interaction();
    expect(ui.toucher(etat, 8, 5.5, RAYON)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'menu', socle: 0 });
    ui.toucher(etat, 8, 5.5, RAYON);
    expect(ui.mode).toEqual({ type: 'libre' });
  });

  it('toucher un autre socle déplace le menu, toucher le vide le ferme', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, 8, 5.5, RAYON);
    ui.toucher(etat, 10, 8.5, RAYON);
    expect(ui.mode).toEqual({ type: 'menu', socle: 1 });
    ui.toucher(etat, 3, 12, RAYON);
    expect(ui.mode).toEqual({ type: 'libre' });
  });

  it('choisir une tour dans le menu renvoie l’action de construction et ferme le menu', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, 8, 5.5, RAYON);
    const tir = elementsMenu(etat, 0).find((e) => e.id === 'construire:tir');
    expect(tir).toBeDefined();
    if (!tir) return;
    const issue = ui.choisirElement(tir);
    expect(issue).toEqual({ action: { type: 'construire', socle: 0, tour: 'tir' }, refus: null });
    expect(ui.mode).toEqual({ type: 'libre' });
    envoyer(etat, issue.action);
    expect(etat.tours).toHaveLength(1);
  });

  it('un élément grisé renvoie la raison du refus et garde le menu ouvert', () => {
    const etat = partie();
    etat.aretes = 10;
    const ui = new Interaction();
    ui.toucher(etat, 8, 5.5, RAYON);
    const magie = elementsMenu(etat, 0).find((e) => e.id === 'construire:magie');
    if (!magie) throw new Error('élément manquant');
    expect(ui.choisirElement(magie)).toEqual({ action: null, refus: 'aretes_insuffisantes' });
    expect(ui.mode).toEqual({ type: 'menu', socle: 0 });
  });

  it('le menu d’une tour offre améliorer, spécialiser et vendre, validés par le moteur', () => {
    const etat = partie();
    const ui = new Interaction();
    envoyer(etat, { type: 'construire', socle: 1, tour: 'tir' });
    ui.toucher(etat, 10, 8.5, RAYON);
    const ameliorer = elementsMenu(etat, 1).find((e) => e.id === 'ameliorer');
    if (!ameliorer) throw new Error('élément manquant');
    envoyer(etat, ui.choisirElement(ameliorer).action);
    expect(etat.tours[0]?.niveau).toBe(2);
    ui.toucher(etat, 10, 8.5, RAYON);
    const vendre = elementsMenu(etat, 1).find((e) => e.id === 'vendre');
    if (!vendre) throw new Error('élément manquant');
    const arentes = etat.aretes;
    envoyer(etat, ui.choisirElement(vendre).action);
    expect(etat.tours).toHaveLength(0);
    expect(etat.aretes).toBe(arentes + Math.floor((180 * 70) / 100));
  });

  it('la caserne : ralliement puis toucher le chemin déplace le point de ralliement', () => {
    const etat = partie();
    const ui = new Interaction();
    envoyer(etat, { type: 'construire', socle: 1, tour: 'caserne' });
    ui.toucher(etat, 10, 8.5, RAYON);
    const ralliement = elementsMenu(etat, 1).find((e) => e.id === 'ralliement');
    if (!ralliement) throw new Error('élément manquant');
    expect(ui.choisirElement(ralliement)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'ralliement', socle: 1 });
    // Trop loin de la tour : refusé, on reste en visée.
    expect(ui.toucher(etat, 24, 7, RAYON).refus).toBe('hors_portee');
    expect(ui.mode.type).toBe('ralliement');
    const issue = ui.toucher(etat, 11.8, 9, RAYON);
    expect(issue.action).toEqual({ type: 'deplacerRalliement', socle: 1, x: 11.8, y: 9 });
    expect(ui.mode.type).toBe('libre');
    envoyer(etat, issue.action);
    expect(etat.tours[0]?.ralliementX).toBe(11.8);
  });

  it('touches 1 à 5 : construisent sur le socle sélectionné, sinon rien', () => {
    const etat = partie();
    const ui = new Interaction();
    expect(ui.construireSurSelection(etat, 'tir')).toEqual({ action: null, refus: null });
    ui.toucher(etat, 8, 5.5, RAYON);
    const issue = ui.construireSurSelection(etat, 'magie');
    expect(issue.action).toEqual({ type: 'construire', socle: 0, tour: 'magie' });
    envoyer(etat, issue.action);
    ui.toucher(etat, 8, 5.5, RAYON);
    expect(ui.construireSurSelection(etat, 'tir')).toEqual({ action: null, refus: null });
  });

  it('touche 5 : tour divine ; refusée quand les arêtes manquent', () => {
    const etat = partie();
    etat.aretes = 150;
    const ui = new Interaction();
    ui.toucher(etat, 8, 5.5, RAYON);
    expect(ui.construireSurSelection(etat, 'divine')).toEqual({ action: null, refus: 'aretes_insuffisantes' });
    expect(ui.mode.type).toBe('menu');
  });
});

describe('héros', () => {
  it('toucher le héros puis un point du chemin envoie l’ordre de déplacement', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, 16, 12.5, RAYON);
    expect(ui.mode).toEqual({ type: 'heros' });
    const issue = ui.toucher(etat, 20, 13, RAYON);
    expect(issue).toEqual({ action: { type: 'deplacerHeros', x: 20, y: 13 }, refus: null });
    expect(ui.mode.type).toBe('libre');
    envoyer(etat, issue.action);
    const heros = etat.unites.find((u) => u.id === etat.heros);
    expect(heros?.ancreX).toBe(20);
  });

  it('un point hors du chemin est refusé et le héros reste sélectionné', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.basculerHeros(etat);
    expect(ui.toucher(etat, 3, 16, RAYON)).toEqual({ action: null, refus: 'hors_chemin' });
    expect(ui.mode.type).toBe('heros');
  });

  it('retoucher le héros annule la sélection, comme la touche E', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, 16, 12.5, RAYON);
    ui.toucher(etat, 16, 12.5, RAYON);
    expect(ui.mode.type).toBe('libre');
    ui.basculerHeros(etat);
    expect(ui.mode.type).toBe('heros');
    ui.basculerHeros(etat);
    expect(ui.mode.type).toBe('libre');
  });

  it('le héros tombé ne se sélectionne pas, et la sélection tombe avec lui', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.basculerHeros(etat);
    const heros = etat.unites.find((u) => u.id === etat.heros);
    if (heros) heros.mort = true;
    ui.rafraichir(etat);
    expect(ui.mode.type).toBe('libre');
    expect(ui.basculerHeros(etat)).toEqual({ action: null, refus: 'heros_mort' });
  });
});

describe('sorts', () => {
  it('un sort en recharge ne passe pas en visée', () => {
    const etat = partie();
    const ui = new Interaction();
    expect(ui.basculerSort(etat, 0)).toEqual({ action: null, refus: 'sort_en_recharge' });
    expect(ui.mode.type).toBe('libre');
  });

  it('un sort prêt : le toucher puis la carte envoie le sort ; le moteur valide la cible', () => {
    const etat = partie();
    avancerPas(etat, 301);
    const ui = new Interaction();
    expect(ui.basculerSort(etat, 1)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'sort', emplacement: 1 });
    // Renforts : la cible doit être près du chemin.
    expect(ui.toucher(etat, 3, 16, RAYON)).toEqual({ action: null, refus: 'hors_chemin' });
    expect(ui.mode.type).toBe('sort');
    const issue = ui.toucher(etat, 20, 13, RAYON);
    expect(issue.action).toEqual({ type: 'lancerSort', emplacement: 1, x: 20, y: 13 });
    envoyer(etat, issue.action);
    expect(etat.sorts[1]?.recharge).toBeGreaterThan(0);
    expect(ui.mode.type).toBe('libre');
  });

  it('retoucher le même sort annule, un autre sort remplace la visée', () => {
    const etat = partie();
    avancerPas(etat, 301);
    const ui = new Interaction();
    ui.basculerSort(etat, 0);
    ui.basculerSort(etat, 1);
    expect(ui.mode).toEqual({ type: 'sort', emplacement: 1 });
    ui.basculerSort(etat, 1);
    expect(ui.mode.type).toBe('libre');
    expect(ui.basculerSort(etat, 7)).toEqual({ action: null, refus: 'sort_inconnu' });
  });

  it('un sort qui repart en recharge sort du mode de visée', () => {
    const etat = partie();
    avancerPas(etat, 301);
    const ui = new Interaction();
    ui.basculerSort(etat, 0);
    envoyer(etat, { type: 'lancerSort', emplacement: 0, x: 14, y: 10 });
    ui.rafraichir(etat);
    expect(ui.mode.type).toBe('libre');
  });
});

describe('annulation et fin de partie', () => {
  it('Échap ferme les menus et abandonne la visée', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, 8, 5.5, RAYON);
    ui.annuler();
    expect(ui.mode.type).toBe('libre');
    ui.basculerHeros(etat);
    ui.annuler();
    expect(ui.mode.type).toBe('libre');
  });

  it('la fin de la partie ferme tout', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, 8, 5.5, RAYON);
    etat.statut = 'defaite';
    ui.rafraichir(etat);
    expect(ui.mode.type).toBe('libre');
  });
});

describe('surbrillance et invites', () => {
  it('montre la portée de la tour dont le menu est ouvert, rien pour un socle vide', () => {
    const etat = partie();
    const ui = new Interaction();
    const surb = new Surbrillance();
    envoyer(etat, { type: 'construire', socle: 1, tour: 'tir' });
    ui.toucher(etat, 8, 5.5, RAYON);
    ui.surbrillance(etat, surb);
    expect(surb.socle).toBe(0);
    expect(surb.portee).toBe(0);
    ui.toucher(etat, 10, 8.5, RAYON);
    ui.surbrillance(etat, surb);
    expect(surb.socle).toBe(1);
    expect(surb.portee).toBe(3.5);
    ui.annuler();
    ui.surbrillance(etat, surb);
    expect(surb.socle).toBe(-1);
    expect(surb.portee).toBe(0);
  });

  it('montre le héros sélectionné et le rayon du sort visé', () => {
    const etat = partie();
    avancerPas(etat, 301);
    const ui = new Interaction();
    const surb = new Surbrillance();
    ui.basculerHeros(etat);
    ui.surbrillance(etat, surb);
    expect(surb.heros).toBe(true);
    ui.basculerSort(etat, 0);
    ui.surbrillance(etat, surb);
    expect(surb.heros).toBe(false);
    expect(surb.sortRayon).toBe(rayonSort(etat, 0));
    expect(surb.sortRayon).toBeGreaterThan(0);
  });

  it('une invite pour chaque visée, aucune sinon', () => {
    const etat = partie();
    avancerPas(etat, 301);
    const ui = new Interaction();
    expect(ui.invite(etat)).toBeNull();
    ui.basculerHeros(etat);
    expect(ui.invite(etat)).toMatch(/héros/);
    ui.basculerSort(etat, 0);
    expect(ui.invite(etat)).toContain('Chute du Colosse');
    expect(rayonSort(etat, 9)).toBe(0);
  });
});

describe('objets emportés', () => {
  function avecObjets(...objets: string[]): EtatPartie {
    return creerPartie(NIVEAU_TEST, { ...CONFIG, objets });
  }

  it('toucher l’objet puis un point du chemin l’utilise ; l’emplacement est alors grisé', () => {
    const etat = avecObjets('fiole_soufre', 'sablier');
    const interaction = new Interaction();
    expect(interaction.basculerObjet(etat, 0)).toEqual({ action: null, refus: null });
    expect(interaction.mode).toEqual({ type: 'objet', emplacement: 0 });
    const issue = interaction.toucher(etat, 10, 5, RAYON);
    expect(issue.action).toEqual({ type: 'utiliserObjet', emplacement: 0, x: 10, y: 5 });
    expect(interaction.mode.type).toBe('libre');
    envoyer(etat, issue.action);
    expect(etat.objetsUtilises).toEqual([true, false]);
    // Un objet utilisé n'est plus sélectionnable.
    expect(interaction.basculerObjet(etat, 0)).toEqual({ action: null, refus: 'objet_utilise' });
    expect(interaction.mode.type).toBe('libre');
  });

  it('un emplacement sans objet est refusé', () => {
    const etat = avecObjets('sablier');
    expect(new Interaction().basculerObjet(etat, 2)).toEqual({ action: null, refus: 'objet_inconnu' });
  });

  it('toucher de nouveau le même objet annule la visée', () => {
    const etat = avecObjets('sablier');
    const interaction = new Interaction();
    interaction.basculerObjet(etat, 0);
    interaction.basculerObjet(etat, 0);
    expect(interaction.mode.type).toBe('libre');
  });

  it('un point refusé par le moteur laisse la visée ouverte, avec la raison', () => {
    const etat = avecObjets('griffe_renfort');
    const interaction = new Interaction();
    interaction.basculerObjet(etat, 0);
    const issue = interaction.toucher(etat, 25, 1, RAYON);
    expect(issue).toEqual({ action: null, refus: 'hors_chemin' });
    expect(interaction.mode).toEqual({ type: 'objet', emplacement: 0 });
  });

  it('un objet qui agit partout s’utilise en touchant n’importe où sur la carte', () => {
    const etat = avecObjets('sablier');
    const interaction = new Interaction();
    interaction.basculerObjet(etat, 0);
    expect(interaction.toucher(etat, 3, 1, RAYON).action).toEqual({ type: 'utiliserObjet', emplacement: 0, x: 3, y: 1 });
  });

  it('la visée tombe si l’objet est utilisé, et la surbrillance montre son rayon', () => {
    const etat = avecObjets('fiole_soufre');
    const interaction = new Interaction();
    interaction.basculerObjet(etat, 0);
    const surb = new Surbrillance();
    interaction.surbrillance(etat, surb);
    expect(surb.sortRayon).toBe(rayonObjet(etat, 0));
    expect(surb.sortRayon).toBeGreaterThan(0);
    etat.objetsUtilises[0] = true;
    interaction.rafraichir(etat);
    expect(interaction.mode.type).toBe('libre');
  });

  it('l’invite nomme l’objet', () => {
    const etat = avecObjets('fiole_soufre');
    const interaction = new Interaction();
    interaction.basculerObjet(etat, 0);
    expect(interaction.invite(etat)).toBe('Touche la carte pour utiliser : Fiole de Soufre.');
  });
});
