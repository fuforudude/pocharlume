// Écrans plein cadre en DOM : accueil, pause, fin de partie, « Tourne ton téléphone ».
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { bouton, el, image } from './dom';

/** Un niveau proposé en plus de « Jouer » (en attendant la carte du monde de la tâche 8). */
export interface ChoixNiveau {
  readonly libelle: string;
  readonly surChoisir: () => void;
}

export interface OptionsAccueil {
  surJouer: () => void;
  /** Autres niveaux jouables depuis l'accueil (niveau final, niveau de test). */
  readonly autres?: readonly ChoixNiveau[];
  /** Vague à laquelle reprendre une partie sauvegardée : affiche « Reprendre à la vague N ». */
  reprise?: { readonly vague: number; readonly surReprendre: () => void };
}

export function afficherAccueil(parent: HTMLElement, options: OptionsAccueil): HTMLElement {
  const ecran = el('div', 'ecran accueil');
  ecran.append(el('h1', 'titre', t('jeu.titre')));
  const boutons = el('div', 'colonne');
  const jouer = bouton('bouton grand', t('accueil.jouer'), options.surJouer);
  jouer.textContent = t('accueil.jouer');
  boutons.append(jouer);
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
  }
  ecran.append(boutons);
  parent.append(ecran);
  jouer.focus({ preventScroll: true });
  return ecran;
}

export interface ResultatAffiche {
  readonly statut: 'victoire' | 'defaite';
  readonly etoiles: number;
  readonly vies: number;
  readonly viesDepart: number;
}

export interface ActionsFin {
  surRejouer: () => void;
  /** Absent : pas de bouton pour quitter (aucun écran où revenir). */
  surQuitter?: () => void;
}

export function afficherFin(parent: HTMLElement, atlas: AtlasRendu, resultat: ResultatAffiche, actions: ActionsFin): HTMLElement {
  const victoire = resultat.statut === 'victoire';
  const ecran = el('div', `ecran fin ${victoire ? 'victoire' : 'defaite'}`);
  ecran.setAttribute('role', 'dialog');
  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', t(victoire ? 'fin.victoire' : 'fin.defaite')));
  carte.append(el('p', 'detail', t(victoire ? 'fin.victoire_detail' : 'fin.defaite_detail')));
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
  carte.append(el('p', 'detail', t('fin.vies', { n: Math.max(0, resultat.vies), m: resultat.viesDepart })));
  const boutons = el('div', 'rangee');
  const rejouer = bouton('bouton grand', t('fin.rejouer'), actions.surRejouer);
  rejouer.textContent = t('fin.rejouer');
  boutons.append(rejouer);
  const quitter = actions.surQuitter;
  if (quitter) {
    const b = bouton('bouton grand secondaire', t('fin.quitter'), quitter);
    b.textContent = t('fin.quitter');
    boutons.append(b);
  }
  carte.append(boutons);
  ecran.append(carte);
  parent.append(ecran);
  rejouer.focus({ preventScroll: true });
  return ecran;
}

export interface EcranPause {
  readonly noeud: HTMLElement;
  afficher(visible: boolean): void;
}

export function creerPause(parent: HTMLElement, surReprendre: () => void, surQuitter?: () => void): EcranPause {
  const ecran = el('div', 'ecran pause');
  ecran.hidden = true;
  ecran.setAttribute('role', 'dialog');
  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', t('pause.titre')));
  const boutons = el('div', 'rangee');
  const reprendre = bouton('bouton grand', t('pause.reprendre'), surReprendre);
  reprendre.textContent = t('pause.reprendre');
  boutons.append(reprendre);
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
    afficher(visible: boolean): void {
      if (ecran.hidden !== !visible) ecran.hidden = !visible;
      if (visible) reprendre.focus({ preventScroll: true });
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
