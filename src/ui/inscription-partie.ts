// La petite fenêtre qui s'ouvre quand on touche une vieille statue pendant une partie : l'inscription, une ligne pour dire si elle est
// nouvelle dans le recueil, et « Refermer ». Elle ne décide rien : l'appelant (partie.ts) met la partie en pause avant de
// l'ouvrir et la relance à la fermeture, et c'est lui qui range l'inscription dans la sauvegarde.
// Clavier : le focus est sur « Refermer » (Entrée ou Espace), Échap referme aussi.
import { t, tCle } from '../i18n';
import { cleInscription, type IdInscription } from '../data/niveaux/statues';
import { bouton, el } from './dom';

/** Délai pendant lequel un clic sur « Refermer » est ignoré après l'ouverture. */
const DELAI_CLIC_FANTOME_MS = 250;

export interface OptionsInscription {
  readonly id: IdInscription;
  /** Vrai : première lecture (elle entre au recueil) ; faux : déjà trouvée ; null : rien à en dire (partie hors sauvegarde). */
  readonly nouvelle: boolean | null;
  /** Appelée une seule fois, quand la fenêtre se referme (par le bouton, Échap ou `fermer`). */
  readonly surFermer: () => void;
}

export interface InscriptionOuverte {
  readonly racine: HTMLElement;
  /** Referme la fenêtre (sans effet si elle est déjà fermée). */
  fermer(): void;
}

export function afficherInscription(parent: HTMLElement, options: OptionsInscription): InscriptionOuverte {
  const controleur = new AbortController();
  const { signal } = controleur;
  let fermee = false;

  const racine = el('div', 'ecran inscription-statue');
  racine.setAttribute('role', 'dialog');
  racine.setAttribute('aria-modal', 'true');
  racine.setAttribute('aria-label', t('inscriptions.statue_libelle'));

  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', t('inscriptions.statue')));
  const texte = el('p', 'inscription-texte', tCle(cleInscription(options.id)));
  carte.append(texte);
  if (options.nouvelle !== null) carte.append(el('p', 'detail', t(options.nouvelle ? 'inscriptions.nouvelle' : 'inscriptions.relue')));
  // Un toucher qui vient d'ouvrir la fenêtre ne doit pas la refermer aussitôt (clic fantôme d'un écran tactile).
  const ouverteA = performance.now();
  const refermer = bouton('bouton grand', t('inscriptions.refermer'), () => {
    if (performance.now() - ouverteA >= DELAI_CLIC_FANTOME_MS) fermer();
  }, signal);
  refermer.textContent = t('inscriptions.refermer');
  const rangee = el('div', 'rangee');
  rangee.append(refermer);
  carte.append(rangee);
  racine.append(carte);
  parent.append(racine);
  refermer.focus({ preventScroll: true });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    e.preventDefault();
    fermer();
  }, { signal });

  function fermer(): void {
    if (fermee) return;
    fermee = true;
    controleur.abort();
    racine.remove();
    options.surFermer();
  }

  return { racine, fermer };
}
