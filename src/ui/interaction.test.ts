import { describe, expect, it } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import { avancer, centreCase, creerPartie, estCaseDeChemin, estCaseInterdite, type Action, type CaseGrille, type EtatPartie } from '../engine';
import { ct, avancerPas, CONFIG } from '../engine/aides.test-utils';
import { Surbrillance } from '../render/rendu';
import { cibleTouchee, Interaction, rayonObjet, rayonSort } from './interaction';
import { elementsMenu as menuDe } from './menu-cercle';

const RAYON = 0.9;

const elementsMenu = (etat: EtatPartie, i: number) => menuDe(etat, ct(i));

/** Un point au centre de la case de test numéro `i` (voir `CASES_TEST`), décalé de (dx, dy) tuiles. */
function pt(i: number, dx = 0, dy = 0): [number, number] {
  const c = centreCase(ct(i).cx, ct(i).cy);
  return [c.x + dx, c.y + dy];
}

function partie(): EtatPartie {
  return creerPartie(NIVEAU_TEST, CONFIG);
}

/** Envoie l'action au moteur comme le fait la boucle de jeu. */
function envoyer(etat: EtatPartie, action: Action | null): void {
  expect(action).not.toBeNull();
  if (action) expect(avancer(etat, [action])[0]?.ok).toBe(true);
}

describe('cibleTouchee', () => {
  it('trouve la case qui contient le point, n’importe où dans la case', () => {
    const etat = partie();
    expect(cibleTouchee(etat, ...pt(0), RAYON)).toEqual({ type: 'case', ...ct(0) });
    expect(cibleTouchee(etat, ...pt(0, 0.9, -0.9), RAYON)).toEqual({ type: 'case', ...ct(0) });
    expect(cibleTouchee(etat, ...pt(0, -0.9, 0.9), RAYON)).toEqual({ type: 'case', ...ct(0) });
  });

  it('trouve aussi une case interdite (le refus se dit au toucher), mais le héros passe avant dans son rayon', () => {
    const etat = partie();
    // Le héros attend sur le chemin, dans la case (8, 6) : interdite.
    expect(cibleTouchee(etat, 17, 12.5, RAYON)).toEqual({ type: 'heros' });
    expect(cibleTouchee(etat, 17, 12.9, 0.1)).toEqual({ type: 'case', cx: 8, cy: 6 });
  });

  it('ne trouve rien hors de la carte', () => {
    const etat = partie();
    expect(cibleTouchee(etat, -1, 5, RAYON)).toBeNull();
    expect(cibleTouchee(etat, 5, 18.5, RAYON)).toBeNull();
    expect(cibleTouchee(etat, 32.5, 5, RAYON)).toBeNull();
    expect(cibleTouchee(etat, Number.NaN, 5, RAYON)).toBeNull();
  });

  it('ignore le héros tombé', () => {
    const etat = partie();
    const heros = etat.unites.find((u) => u.id === etat.heros);
    if (heros) heros.mort = true;
    expect(cibleTouchee(etat, 17, 12.5, RAYON)).toEqual({ type: 'case', cx: 8, cy: 6 });
  });
});

describe('cases et menu', () => {
  it('toucher une case libre ouvre son menu, la retoucher le ferme', () => {
    const etat = partie();
    const ui = new Interaction();
    expect(ui.toucher(etat, ...pt(0), RAYON)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'menu', ...ct(0) });
    ui.toucher(etat, ...pt(0), RAYON);
    expect(ui.mode).toEqual({ type: 'libre' });
  });

  it('toucher une autre case déplace le menu, toucher hors de la carte le ferme', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, ...pt(0), RAYON);
    ui.toucher(etat, ...pt(1), RAYON);
    expect(ui.mode).toEqual({ type: 'menu', ...ct(1) });
    ui.toucher(etat, -1, 5, RAYON);
    expect(ui.mode).toEqual({ type: 'libre' });
  });

  it('toucher le chemin n’ouvre rien et ne dit rien ; un menu ouvert se referme', () => {
    const etat = partie();
    const ui = new Interaction();
    expect(ui.toucher(etat, 6, 4, RAYON)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'libre' });
    ui.toucher(etat, ...pt(0), RAYON);
    expect(ui.mode).toEqual({ type: 'menu', ...ct(0) });
    expect(ui.toucher(etat, 6, 4, RAYON)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'libre' });
  });

  it('choisir une tour dans le menu renvoie l’action de construction et ferme le menu', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, ...pt(0), RAYON);
    const tir = elementsMenu(etat, 0).find((e) => e.id === 'construire:tir');
    expect(tir).toBeDefined();
    if (!tir) return;
    const issue = ui.choisirElement(tir);
    expect(issue).toEqual({ action: { type: 'construire', ...ct(0), tour: 'tir' }, refus: null });
    expect(ui.mode).toEqual({ type: 'libre' });
    envoyer(etat, issue.action);
    expect(etat.tours).toHaveLength(1);
  });

  it('un élément grisé renvoie la raison du refus et garde le menu ouvert', () => {
    const etat = partie();
    etat.aretes = 10;
    const ui = new Interaction();
    ui.toucher(etat, ...pt(0), RAYON);
    const magie = elementsMenu(etat, 0).find((e) => e.id === 'construire:magie');
    if (!magie) throw new Error('élément manquant');
    expect(ui.choisirElement(magie)).toEqual({ action: null, refus: 'aretes_insuffisantes' });
    expect(ui.mode).toEqual({ type: 'menu', ...ct(0) });
  });

  it('un élément pas encore débloqué renvoie aussi le niveau qui l’ouvre', () => {
    const etat = creerPartie({ ...NIVEAU_TEST, numero: 3 }, CONFIG);
    const ui = new Interaction();
    ui.toucher(etat, ...pt(0), RAYON);
    const divine = elementsMenu(etat, 0).find((e) => e.id === 'construire:divine');
    if (!divine) throw new Error('élément manquant');
    expect(ui.choisirElement(divine)).toEqual({ action: null, refus: 'non_debloque', deblocage: 10 });
    expect(ui.mode).toEqual({ type: 'menu', ...ct(0) });
  });

  it('le menu d’une tour offre améliorer, spécialiser et vendre, validés par le moteur', () => {
    const etat = partie();
    const ui = new Interaction();
    envoyer(etat, { type: 'construire', ...ct(1), tour: 'tir' });
    ui.toucher(etat, ...pt(1), RAYON);
    const ameliorer = elementsMenu(etat, 1).find((e) => e.id === 'ameliorer');
    if (!ameliorer) throw new Error('élément manquant');
    envoyer(etat, ui.choisirElement(ameliorer).action);
    expect(etat.tours[0]?.niveau).toBe(2);
    ui.toucher(etat, ...pt(1), RAYON);
    const vendre = elementsMenu(etat, 1).find((e) => e.id === 'vendre');
    if (!vendre) throw new Error('élément manquant');
    const avant = etat.aretes;
    envoyer(etat, ui.choisirElement(vendre).action);
    expect(etat.tours).toHaveLength(0);
    expect(etat.aretes).toBe(avant + Math.floor((180 * 70) / 100));
  });

  it('la caserne : ralliement puis toucher le chemin déplace le point de ralliement', () => {
    const etat = partie();
    const ui = new Interaction();
    envoyer(etat, { type: 'construire', ...ct(1), tour: 'caserne' });
    ui.toucher(etat, ...pt(1), RAYON);
    const ralliement = elementsMenu(etat, 1).find((e) => e.id === 'ralliement');
    if (!ralliement) throw new Error('élément manquant');
    expect(ui.choisirElement(ralliement)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'ralliement', ...ct(1) });
    // Trop loin de la tour : refusé, on reste en visée.
    expect(ui.toucher(etat, 24, 7, RAYON).refus).toBe('hors_portee');
    expect(ui.mode.type).toBe('ralliement');
    const issue = ui.toucher(etat, 20.5, 13, RAYON);
    expect(issue.action).toEqual({ type: 'deplacerRalliement', ...ct(1), x: 20.5, y: 13 });
    expect(ui.mode.type).toBe('libre');
    envoyer(etat, issue.action);
    expect(etat.tours[0]?.ralliementX).toBe(20.5);
  });

  it('touches 1 à 5 : construisent sur la case sélectionnée, sinon rien', () => {
    const etat = partie();
    const ui = new Interaction();
    expect(ui.construireSurSelection(etat, 'tir')).toEqual({ action: null, refus: null });
    ui.toucher(etat, ...pt(0), RAYON);
    const issue = ui.construireSurSelection(etat, 'magie');
    expect(issue.action).toEqual({ type: 'construire', ...ct(0), tour: 'magie' });
    envoyer(etat, issue.action);
    ui.toucher(etat, ...pt(0), RAYON);
    expect(ui.construireSurSelection(etat, 'tir')).toEqual({ action: null, refus: null });
  });

  it('touche 5 : tour divine ; refusée quand les arêtes manquent', () => {
    const etat = partie();
    etat.aretes = 150;
    const ui = new Interaction();
    ui.toucher(etat, ...pt(0), RAYON);
    expect(ui.construireSurSelection(etat, 'divine')).toEqual({ action: null, refus: 'aretes_insuffisantes' });
    expect(ui.mode.type).toBe('menu');
  });
});

describe('héros', () => {
  it('toucher le héros puis un point du chemin envoie l’ordre de déplacement', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, 17, 12.5, RAYON);
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
    ui.toucher(etat, 17, 12.5, RAYON);
    ui.toucher(etat, 17, 12.5, RAYON);
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
    ui.toucher(etat, ...pt(0), RAYON);
    ui.annuler();
    expect(ui.mode.type).toBe('libre');
    ui.basculerHeros(etat);
    ui.annuler();
    expect(ui.mode.type).toBe('libre');
  });

  it('la fin de la partie ferme tout', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, ...pt(0), RAYON);
    etat.statut = 'defaite';
    ui.rafraichir(etat);
    expect(ui.mode.type).toBe('libre');
  });
});

describe('surbrillance et invites', () => {
  it('montre la portée de la tour dont le menu est ouvert, rien pour une case libre', () => {
    const etat = partie();
    const ui = new Interaction();
    const surb = new Surbrillance();
    envoyer(etat, { type: 'construire', ...ct(1), tour: 'tir' });
    ui.toucher(etat, ...pt(0), RAYON);
    ui.surbrillance(etat, surb);
    expect([surb.cx, surb.cy]).toEqual([ct(0).cx, ct(0).cy]);
    expect(surb.portee).toBe(0);
    ui.toucher(etat, ...pt(1), RAYON);
    ui.surbrillance(etat, surb);
    expect([surb.cx, surb.cy]).toEqual([ct(1).cx, ct(1).cy]);
    expect(surb.portee).toBe(3.5);
    ui.annuler();
    ui.surbrillance(etat, surb);
    expect([surb.cx, surb.cy]).toEqual([-1, -1]);
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

  it('un objet global (Sablier) s’utilise directement, sans toucher la carte ni passer en visée', () => {
    const etat = avecObjets('sablier');
    const interaction = new Interaction();
    const { carte } = etat.niveau;
    const issue = interaction.basculerObjet(etat, 0);
    expect(issue).toEqual({ action: { type: 'utiliserObjet', emplacement: 0, x: carte.largeur / 2, y: carte.hauteur / 2 }, refus: null });
    expect(interaction.mode.type).toBe('libre');
    envoyer(etat, issue.action);
    expect(etat.objetsUtilises).toEqual([true]);
  });

  it('l’Herbe de Sabbat avec les vies pleines est refusée sans passer en visée ni être consommée', () => {
    const etat = avecObjets('herbe_sabbat');
    const interaction = new Interaction();
    expect(interaction.basculerObjet(etat, 0)).toEqual({ action: null, refus: 'vies_pleines' });
    expect(interaction.mode.type).toBe('libre');
    expect(etat.objetsUtilises).toEqual([false]);
  });

  it('l’Herbe de Sabbat s’utilise directement dès qu’une vie manque', () => {
    const etat = avecObjets('herbe_sabbat');
    etat.vies = etat.viesDepart - 3;
    const issue = new Interaction().basculerObjet(etat, 0);
    expect(issue.refus).toBeNull();
    expect(issue.action?.type).toBe('utiliserObjet');
  });

  it('un objet global déjà utilisé reste refusé', () => {
    const etat = avecObjets('sablier');
    etat.objetsUtilises[0] = true;
    expect(new Interaction().basculerObjet(etat, 0)).toEqual({ action: null, refus: 'objet_utilise' });
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

describe('visée de case', () => {
  it('éclaire la case libre sous le pointeur, ni le chemin ni rien hors de la carte', () => {
    const etat = partie();
    const ui = new Interaction();
    const surb = new Surbrillance();
    ui.surbrillance(etat, surb);
    expect(surb.viseeCx).toBe(-1);
    ui.viser(etat, ...pt(0, 0.4, -0.3));
    ui.surbrillance(etat, surb);
    expect([surb.viseeCx, surb.viseeCy, surb.viseeInterdite]).toEqual([ct(0).cx, ct(0).cy, false]);
    // Le chemin ne s'éclaire pas (jalon 5) : on n'y construit rien.
    ui.viser(etat, 6, 4);
    ui.surbrillance(etat, surb);
    expect(surb.viseeCx).toBe(-1);
    ui.viser(etat, -1, 5);
    ui.surbrillance(etat, surb);
    expect(surb.viseeCx).toBe(-1);
  });

  it('une case qui porte une tour reste « libre » (on peut l’ouvrir) ; la case redevient claire si la tour est vendue', () => {
    const etat = partie();
    const ui = new Interaction();
    const surb = new Surbrillance();
    envoyer(etat, { type: 'construire', ...ct(1), tour: 'tir' });
    ui.viser(etat, ...pt(1));
    ui.surbrillance(etat, surb);
    expect(surb.viseeInterdite).toBe(false);
    expect(surb.viseeCx).toBe(ct(1).cx);
  });

  it('cesserDeViser efface la case ; pendant la visée du héros, d’un sort ou d’un objet, aucune case n’est éclairée', () => {
    const etat = partie();
    const ui = new Interaction();
    const surb = new Surbrillance();
    ui.viser(etat, ...pt(0));
    ui.cesserDeViser();
    ui.surbrillance(etat, surb);
    expect(surb.viseeCx).toBe(-1);
    ui.basculerHeros(etat);
    ui.viser(etat, ...pt(0));
    ui.surbrillance(etat, surb);
    expect(surb.viseeCx).toBe(-1);
  });

  it('toucher le chemin n’ouvre pas de menu, même quand on le visait', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.viser(etat, 6, 4);
    expect(ui.toucher(etat, 6, 4, RAYON)).toEqual({ action: null, refus: null });
    expect(ui.mode).toEqual({ type: 'libre' });
  });

  it('les touches 1 à 5 construisent sur la case survolée, sans menu ouvert', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.viser(etat, ...pt(2));
    const issue = ui.construireSurSelection(etat, 'tir');
    expect(issue).toEqual({ action: { type: 'construire', ...ct(2), tour: 'tir' }, refus: null });
  });

  it('la case survolée passe avant celle du menu ; sur le chemin, la touche dit pourquoi et ne construit pas sur la case du menu', () => {
    const etat = partie();
    const ui = new Interaction();
    ui.toucher(etat, ...pt(0), RAYON);
    ui.viser(etat, ...pt(2));
    expect(ui.construireSurSelection(etat, 'tir').action).toEqual({ type: 'construire', ...ct(2), tour: 'tir' });
    ui.mode = { type: 'menu', ...ct(0) };
    ui.viser(etat, 6, 4);
    expect(ui.construireSurSelection(etat, 'tir')).toEqual({ action: null, refus: 'case_interdite' });
    ui.cesserDeViser();
    expect(ui.construireSurSelection(etat, 'tir').action).toEqual({ type: 'construire', ...ct(0), tour: 'tir' });
  });

  it('sans case visée ni menu, une touche de construction ne fait rien', () => {
    const etat = partie();
    expect(new Interaction().construireSurSelection(etat, 'tir')).toEqual({ action: null, refus: null });
  });
});

describe('aperçu de la tour au survol du menu', () => {
  it('montre la portée de la famille survolée depuis la case du menu, et le ralliement de la caserne', () => {
    const etat = partie();
    const ui = new Interaction();
    const surb = new Surbrillance();
    ui.toucher(etat, ...pt(0), RAYON);
    const elements = elementsMenu(etat, 0);
    const tir = elements.find((e) => e.id === 'construire:tir');
    const caserne = elements.find((e) => e.id === 'construire:caserne');
    if (!tir || !caserne) throw new Error('éléments manquants');
    ui.survolerElement(tir);
    ui.surbrillance(etat, surb);
    expect(surb.apercuPortee).toBeGreaterThan(0);
    expect(surb.apercuRalliement).toBe(false);
    ui.survolerElement(caserne);
    ui.surbrillance(etat, surb);
    expect(surb.apercuRalliement).toBe(true);
    expect(Number.isFinite(surb.apercuRalliementX) && Number.isFinite(surb.apercuRalliementY)).toBe(true);
    ui.survolerElement(null);
    ui.surbrillance(etat, surb);
    expect([surb.apercuPortee, surb.apercuRalliement]).toEqual([0, false]);
  });

  it('un aperçu disparaît avec le menu, et un bouton grisé montre quand même sa portée', () => {
    const etat = partie();
    etat.aretes = 0;
    const ui = new Interaction();
    const surb = new Surbrillance();
    ui.toucher(etat, ...pt(0), RAYON);
    const tir = elementsMenu(etat, 0).find((e) => e.id === 'construire:tir');
    if (!tir) throw new Error('élément manquant');
    expect(tir.refus).toBe('aretes_insuffisantes');
    ui.survolerElement(tir);
    ui.surbrillance(etat, surb);
    expect(surb.apercuPortee).toBeGreaterThan(0);
    ui.annuler();
    ui.surbrillance(etat, surb);
    expect(surb.apercuPortee).toBe(0);
  });
});

describe('le chemin n’offre aucune pose (jalon 5), sur une carte de campagne alignée', () => {
  const niveau = CAMPAGNE[0]?.niveau;
  if (!niveau) throw new Error('niveau 1 absent');
  const carte = niveau.carte;
  const partieCampagne = (): EtatPartie => creerPartie(niveau, CONFIG);
  /** Une case du chemin et une case libre voisine (ni chemin ni décor), pour viser des deux côtés de la même bordure. */
  const cases = ((): { chemin: CaseGrille; libre: CaseGrille } => {
    for (let cy = 0; cy < 9; cy++) {
      for (let cx = 0; cx < 16; cx++) {
        if (!estCaseDeChemin(carte, cx, cy)) continue;
        for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) {
          const v = { cx: cx + dx, cy: cy + dy };
          if (v.cx >= 0 && v.cy >= 0 && v.cx < 16 && v.cy < 9 && !estCaseDeChemin(carte, v.cx, v.cy) && !estCaseInterdite(niveau, v.cx, v.cy)) return { chemin: { cx, cy }, libre: v };
        }
      }
    }
    throw new Error('aucune case libre voisine du chemin');
  })();
  const centre = (c: CaseGrille): [number, number] => {
    const p = centreCase(c.cx, c.cy);
    return [p.x, p.y];
  };

  it('toucher une case du chemin n’ouvre pas le menu et ne dit rien ; la case n’est pas éclairée', () => {
    const etat = partieCampagne();
    const ui = new Interaction();
    expect(ui.toucher(etat, ...centre(cases.chemin), RAYON)).toEqual({ action: null, refus: null });
    expect(ui.mode.type).toBe('libre');
    const surb = new Surbrillance();
    ui.viser(etat, ...centre(cases.chemin));
    ui.surbrillance(etat, surb);
    expect(ui.visee).toBeNull();
    expect(surb.viseeCx).toBe(-1);
  });

  it('la case libre voisine s’éclaire (claire, pas rouge) et s’ouvre au toucher', () => {
    const etat = partieCampagne();
    const ui = new Interaction();
    const surb = new Surbrillance();
    ui.viser(etat, ...centre(cases.libre));
    ui.surbrillance(etat, surb);
    expect([surb.viseeCx, surb.viseeCy, surb.viseeInterdite]).toEqual([cases.libre.cx, cases.libre.cy, false]);
    ui.toucher(etat, ...centre(cases.libre), RAYON);
    expect(ui.mode).toEqual({ type: 'menu', ...cases.libre });
  });

  it('toucher le chemin referme un menu ouvert', () => {
    const etat = partieCampagne();
    const ui = new Interaction();
    ui.toucher(etat, ...centre(cases.libre), RAYON);
    expect(ui.mode.type).toBe('menu');
    expect(ui.toucher(etat, ...centre(cases.chemin), RAYON)).toEqual({ action: null, refus: null });
    expect(ui.mode.type).toBe('libre');
  });

  it('une touche de construction, souris sur le chemin et menu ouvert ailleurs, ne construit nulle part et dit « case interdite »', () => {
    const etat = partieCampagne();
    const ui = new Interaction();
    ui.toucher(etat, ...centre(cases.libre), RAYON);
    ui.viser(etat, ...centre(cases.chemin));
    expect(ui.construireSurSelection(etat, 'tir')).toEqual({ action: null, refus: 'case_interdite' });
    expect(etat.tours).toHaveLength(0);
    // La souris quitte la carte : la touche retrouve la case du menu.
    ui.cesserDeViser();
    expect(ui.construireSurSelection(etat, 'tir').action).toEqual({ type: 'construire', ...cases.libre, tour: 'tir' });
  });
});
