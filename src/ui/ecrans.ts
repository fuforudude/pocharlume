// Écrans plein cadre en DOM : accueil, pause, fin de partie, « Tourne ton téléphone ».
import { HEROS } from '../data/heros';
import { BRAISES_DEFI } from '../data/meta';
import { OBJETS } from '../data/objets';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import type { BilanPartie, RaisonFin } from '../save';
import { bouton, el, image } from './dom';
import { texteRefusMeta } from './raisons-meta';
import { REGIONS_MONDE } from './regions-monde';

/** Un niveau proposé en plus de « Jouer » (raccourcis de développement seulement). */
export interface ChoixNiveau {
  readonly libelle: string;
  readonly surChoisir: () => void;
}

export interface OptionsAccueil {
  /** « Jouer » : ouvre la carte du monde. */
  surJouer: () => void;
  /** « Options » : volumes, vitesse, export et import. */
  surOptions: () => void;
  /** Autres niveaux jouables depuis l'accueil : raccourcis de développement, absents du site public. */
  readonly autres?: readonly ChoixNiveau[];
  /** Vague à laquelle reprendre une partie sauvegardée : affiche « Reprendre à la vague N ». */
  reprise?: { readonly vague: number; readonly surReprendre: () => void };
  /** « Mode infini » : présent seulement quand le mode est ouvert (boss de la région 1 battu). */
  surInfini?: () => void;
}

export function afficherAccueil(parent: HTMLElement, options: OptionsAccueil): HTMLElement {
  const ecran = el('div', 'ecran accueil');
  ecran.append(el('h1', 'titre', t('jeu.titre')));
  const boutons = el('div', 'colonne');
  const jouer = bouton('bouton grand', t('accueil.jouer'), options.surJouer);
  jouer.textContent = t('accueil.jouer');
  let boutonFocus = jouer;
  boutons.append(jouer);
  if (options.surInfini) {
    const infini = bouton('bouton grand secondaire', t('accueil.infini'), options.surInfini);
    infini.textContent = t('accueil.infini');
    infini.dataset.cle = 'infini';
    boutons.append(infini);
  }
  const reglages = bouton('bouton grand secondaire', t('accueil.options'), options.surOptions);
  reglages.textContent = t('accueil.options');
  boutons.append(reglages);
  for (const choix of options.autres ?? []) {
    const b = bouton('bouton grand secondaire', choix.libelle, choix.surChoisir);
    b.textContent = choix.libelle;
    boutons.append(b);
  }
  if (options.reprise) {
    const { vague, surReprendre } = options.reprise;
    const libelle = t('accueil.reprendre', { n: vague });
    const reprendre = bouton('bouton grand', libelle, surReprendre);
    reprendre.textContent = libelle;
    boutons.prepend(reprendre);
    boutonFocus = reprendre;
  }
  ecran.append(boutons);
  parent.append(ecran);
  boutonFocus.focus({ preventScroll: true });
  return ecran;
}

export interface OptionsConfirmation {
  readonly titre: string;
  readonly detail: string;
  readonly confirmer: string;
  readonly annuler: string;
  /** L'écran est déjà retiré quand cette fonction est appelée. */
  surConfirmer: () => void;
  /** Idem, pour le bouton « annuler ». */
  surAnnuler: () => void;
}

/**
 * Demande de confirmation avant un geste qu'on ne peut pas défaire (perdre une partie en cours). Le focus va à
 * « annuler », le choix prudent. Le clavier (Échap) est à l'appelant, qui peut retirer l'écran lui-même.
 */
export function afficherConfirmation(parent: HTMLElement, options: OptionsConfirmation): HTMLElement {
  const ecran = el('div', 'ecran confirmation');
  ecran.setAttribute('role', 'alertdialog');
  ecran.setAttribute('aria-modal', 'true');
  ecran.setAttribute('aria-label', options.titre);
  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', options.titre), el('p', 'detail', options.detail));
  const rangee = el('div', 'rangee');
  const annuler = bouton('bouton grand', options.annuler, () => {
    ecran.remove();
    options.surAnnuler();
  });
  annuler.textContent = options.annuler;
  const confirmer = bouton('bouton grand secondaire', options.confirmer, () => {
    ecran.remove();
    options.surConfirmer();
  });
  confirmer.textContent = options.confirmer;
  rangee.append(annuler, confirmer);
  carte.append(rangee);
  ecran.append(carte);
  parent.append(ecran);
  annuler.focus({ preventScroll: true });
  return ecran;
}

const DUREE_AVIS_MS = 7000;

/** Avis discret en bas de l'écran (sauvegarde illisible, stockage indisponible) : il disparaît seul ou au toucher. */
export function afficherAvis(parent: HTMLElement, texte: string): HTMLElement {
  const avis = el('div', 'avis', texte);
  avis.setAttribute('role', 'status');
  const retirer = (): void => { avis.remove(); };
  avis.addEventListener('click', retirer);
  window.setTimeout(retirer, DUREE_AVIS_MS);
  parent.append(avis);
  return avis;
}

export interface ResultatAffiche {
  readonly statut: 'victoire' | 'defaite';
  readonly etoiles: number;
  readonly vies: number;
  readonly viesDepart: number;
  /** Partie du mode infini : pas d'étoiles ni de vies restantes, le bilan dit la vague atteinte et le record. */
  readonly infini?: boolean;
}

/** Ce qu'une partie a rapporté, tel que l'écran de fin le reçoit (voir `afficherFin`). */
export interface ButinFin {
  readonly bilan: BilanPartie | null;
  readonly refus: RaisonFin | null;
  /**
   * Mode infini : les lignes du bilan de la partie (vague, record, paliers), à la place de celles de `bilan` ; null si les
   * gains n'ont pas pu être enregistrés. Absent : partie de campagne.
   */
  readonly lignesInfini?: readonly string[] | null;
}

/** Les lignes du butin : arêtes, braises, expérience, niveau gagné, objets consommés. Vide si la partie n'a rien rapporté. */
export function lignesBilan(bilan: BilanPartie): string[] {
  const lignes: string[] = [];
  if (bilan.aretes > 0) lignes.push(t('fin.bilan_aretes', { n: bilan.aretes }));
  // Les braises d'un défi réussi ont leur propre ligne plus bas : on ne les compte pas deux fois.
  const braisesHorsDefi = bilan.braises - (bilan.defiReussi !== undefined ? BRAISES_DEFI : 0);
  if (braisesHorsDefi > 0) lignes.push(t('fin.bilan_braises', { n: braisesHorsDefi }));
  const heros = bilan.heros !== null && Object.hasOwn(HEROS, bilan.heros) ? HEROS[bilan.heros] : null;
  const nom = heros ? tCle(heros.nom) : '';
  if (heros && bilan.xp > 0) lignes.push(t('fin.bilan_xp', { n: bilan.xp, nom }));
  if (heros && bilan.niveauHeros && bilan.niveauHeros.apres > bilan.niveauHeros.avant) {
    lignes.push(t('fin.bilan_niveau', { nom, n: bilan.niveauHeros.apres }));
  }
  if (bilan.objetsConsommes.length > 0) {
    lignes.push(t('fin.bilan_objets', { noms: bilan.objetsConsommes.map((o) => tCle(OBJETS[o].nom)).join(', ') }));
  }
  if (bilan.objetsRendus.length > 0) {
    lignes.push(t('fin.bilan_rendus', { noms: bilan.objetsRendus.map((o) => tCle(OBJETS[o].nom)).join(', ') }));
  }
  // Jalon 3 : un défi réussi pour la première fois (ses braises sont retirées de la ligne des braises ci-dessus), un disciple offert par un
  // boss, la région que cette victoire ouvre.
  if (bilan.defiReussi !== undefined) lignes.push(t('fin.bilan_defi', { defi: t(`fiche.mode_${bilan.defiReussi}`), n: BRAISES_DEFI }));
  if (bilan.discipleOffert !== undefined && Object.hasOwn(HEROS, bilan.discipleOffert)) {
    lignes.push(t('fin.bilan_disciple', { nom: tCle(HEROS[bilan.discipleOffert].nom) }));
  }
  if (bilan.regionDebloquee !== undefined) {
    const region = REGIONS_MONDE.find((r) => r.numero === bilan.regionDebloquee);
    lignes.push(region ? t('fin.bilan_region', { nom: tCle(region.nom) }) : t('fin.bilan_region_numero', { n: bilan.regionDebloquee }));
  }
  // Jalon 4 : la première victoire sur le boss de la région 1 ouvre le mode infini, celle sur le Soleil Blême finit la campagne.
  if (bilan.infiniDebloque === true) lignes.push(t('fin.bilan_infini_debloque'));
  if (bilan.campagneTerminee === true) lignes.push(t('fin.bilan_campagne'));
  return lignes;
}

export interface ActionsFin {
  surRejouer: () => void;
  /** Absent : pas de bouton pour quitter (aucun écran où revenir). */
  surQuitter?: () => void;
  /** Victoire seulement : « Continuer » vers la carte, bouton principal (« Rejouer » devient secondaire). */
  surContinuer?: () => void;
}

/**
 * L'écran de fin. `butin` (facultatif) est la promesse de ce que la partie a rapporté : le bloc « Butin » montre
 * « Enregistrement… » puis les gains, ou dit que les gains n'ont pas pu être enregistrés.
 */
export function afficherFin(
  parent: HTMLElement,
  atlas: AtlasRendu,
  resultat: ResultatAffiche,
  actions: ActionsFin,
  butin: Promise<ButinFin | null> | null = null,
): HTMLElement {
  const infini = resultat.infini === true;
  const victoire = resultat.statut === 'victoire' && !infini;
  const ecran = el('div', `ecran fin ${victoire ? 'victoire' : 'defaite'}${infini ? ' infini' : ''}`);
  ecran.setAttribute('role', 'dialog');
  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', t(infini ? 'fin.infini_titre' : victoire ? 'fin.victoire' : 'fin.defaite')));
  carte.append(el('p', 'detail', t(infini ? 'fin.infini_detail' : victoire ? 'fin.victoire_detail' : 'fin.defaite_detail')));
  if (victoire) {
    const etoiles = el('div', 'etoiles');
    etoiles.setAttribute('role', 'img');
    etoiles.setAttribute('aria-label', t('fin.etoiles', { n: resultat.etoiles }));
    for (let i = 1; i <= 3; i++) {
      const e = image(atlas.iconeUrl('icone-etoile', 4), i <= resultat.etoiles ? 'etoile' : 'etoile eteinte');
      etoiles.append(e);
    }
    carte.append(etoiles);
  }
  if (!infini) carte.append(el('p', 'detail', t('fin.vies', { n: Math.max(0, resultat.vies), m: resultat.viesDepart })));
  if (butin) {
    const bloc = el('div', 'bilan');
    bloc.setAttribute('role', 'status');
    bloc.append(el('p', 'bilan-attente', t('fin.bilan_attente')));
    carte.append(bloc);
    void butin.then((retour) => {
      bloc.replaceChildren();
      if (!retour) {
        bloc.remove();
        return;
      }
      if (retour.lignesInfini !== undefined) {
        const lignes = retour.lignesInfini;
        if (lignes === null) bloc.append(el('p', 'bilan-refus', t('fin.bilan_refuse')));
        else for (const ligne of lignes) bloc.append(el('p', 'bilan-ligne', ligne));
        return;
      }
      if (retour.refus !== null || !retour.bilan) {
        bloc.append(el('p', 'bilan-refus', retour.refus !== null ? `${t('fin.bilan_refuse')} ${texteRefusMeta(retour.refus)}` : t('fin.bilan_refuse')));
        return;
      }
      const lignes = lignesBilan(retour.bilan);
      if (lignes.length === 0) {
        bloc.remove();
        return;
      }
      for (const ligne of lignes) bloc.append(el('p', 'bilan-ligne', ligne));
    });
  }
  const boutons = el('div', 'rangee');
  const continuer = victoire ? actions.surContinuer : undefined;
  const rejouer = bouton(continuer ? 'bouton grand secondaire' : 'bouton grand', t('fin.rejouer'), actions.surRejouer);
  rejouer.textContent = t('fin.rejouer');
  let principal = rejouer;
  if (continuer) {
    principal = bouton('bouton grand', t('fin.continuer'), continuer);
    principal.textContent = t('fin.continuer');
    boutons.append(principal);
  }
  boutons.append(rejouer);
  const quitter = actions.surQuitter;
  if (quitter && !continuer) {
    const b = bouton('bouton grand secondaire', t('fin.quitter'), quitter);
    b.textContent = t('fin.quitter');
    boutons.append(b);
  }
  carte.append(boutons);
  ecran.append(carte);
  parent.append(ecran);
  principal.focus({ preventScroll: true });
  return ecran;
}

export interface EcranPause {
  readonly noeud: HTMLElement;
  /** `prendreFocus` faux : un écran est ouvert par-dessus (fiche, Bestiaire), le focus ne doit pas lui être volé. */
  afficher(visible: boolean, prendreFocus?: boolean): void;
}

export function creerPause(parent: HTMLElement, surReprendre: () => void, surQuitter?: () => void, surBestiaire?: () => void): EcranPause {
  const ecran = el('div', 'ecran pause');
  ecran.hidden = true;
  ecran.setAttribute('role', 'dialog');
  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', t('pause.titre')));
  const boutons = el('div', 'rangee');
  const reprendre = bouton('bouton grand', t('pause.reprendre'), surReprendre);
  reprendre.textContent = t('pause.reprendre');
  boutons.append(reprendre);
  if (surBestiaire) {
    const bestiaire = bouton('bouton grand secondaire', t('bestiaire.bouton'), surBestiaire);
    bestiaire.textContent = t('bestiaire.bouton');
    boutons.append(bestiaire);
  }
  if (surQuitter) {
    const quitter = bouton('bouton grand secondaire', t('fin.quitter'), surQuitter);
    quitter.textContent = t('fin.quitter');
    boutons.append(quitter);
  }
  carte.append(boutons);
  ecran.append(carte);
  parent.append(ecran);
  return {
    noeud: ecran,
    afficher(visible: boolean, prendreFocus = true): void {
      if (ecran.hidden !== !visible) ecran.hidden = !visible;
      if (visible && prendreFocus) reprendre.focus({ preventScroll: true });
    },
  };
}

/** Voile « Tourne ton téléphone » ; il ne s'affiche qu'en portrait, et seulement pendant une partie (voir style.css). */
export function creerAvisPaysage(parent: HTMLElement): HTMLElement {
  const voile = el('div', 'tourne');
  voile.setAttribute('role', 'alert');
  voile.append(el('div', 'pictogramme-tourne'));
  voile.append(el('p', 'titre', t('ecran.tourne')));
  voile.append(el('p', 'detail', t('ecran.tourne_detail')));
  parent.append(voile);
  return voile;
}

export interface OptionsFinCampagne {
  /** Adresse de l'illustration (hors atlas : public/illustrations/fin-campagne.png). */
  readonly illustration: string;
  readonly surContinuer: () => void;
}

/**
 * L'écran de fin de campagne, à la première victoire sur le Soleil Blême : l'illustration, un court texte, « Continuer ».
 * En paysage 812 x 375 l'illustration (320 x 180, en taille réelle) est à gauche et le texte à droite, qui défile s'il est trop long.
 */
export function afficherFinCampagne(parent: HTMLElement, options: OptionsFinCampagne): HTMLElement {
  const ecran = el('div', 'ecran fin-campagne');
  ecran.setAttribute('role', 'dialog');
  ecran.setAttribute('aria-label', t('campagne.fin_titre'));
  const carte = el('div', 'carte');
  const illustration = image(options.illustration, 'illustration-fin', t('campagne.fin_illustration'));
  const texte = el('div', 'texte-fin');
  texte.append(
    el('h2', 'titre', t('campagne.fin_titre')),
    el('p', 'lore', t('campagne.fin_p1')),
    el('p', 'lore', t('campagne.fin_p2')),
    el('p', 'lore', t('campagne.fin_p3')),
  );
  const continuer = bouton('bouton grand', t('campagne.fin_continuer'), () => {
    ecran.remove();
    options.surContinuer();
  });
  continuer.textContent = t('campagne.fin_continuer');
  texte.append(continuer);
  carte.append(illustration, texte);
  ecran.append(carte);
  parent.append(ecran);
  continuer.focus({ preventScroll: true });
  return ecran;
}
