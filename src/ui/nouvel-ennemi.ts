// La fiche « Nouvel ennemi » : elle s'ouvre en pleine partie la première fois qu'un ennemi paraît. Même mécanique que la fenêtre d'une
// inscription de statue (inscription-partie.ts) : elle ne décide rien, l'appelant (partie.ts) met la partie en pause avant de l'ouvrir et
// la relance à la fermeture. Clavier : le focus est sur « Compris » (Entrée ou Espace), Échap referme aussi.
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { bouton, el } from './dom';
import { construireFicheEnnemi } from './fiche-ennemi';
import { ENNEMIS } from '../data/ennemis';

/** Délai pendant lequel un clic sur « Compris » est ignoré après l'ouverture (clic fantôme d'un écran tactile). */
const DELAI_CLIC_FANTOME_MS = 250;

export interface OptionsNouvelEnnemi {
  readonly atlas: AtlasRendu;
  /** Identifiant de l'ennemi (clé de src/data/ennemis.ts). */
  readonly id: string;
  /** Appelée une seule fois, quand la fiche se referme (par le bouton, Échap ou `fermer`). */
  readonly surFermer: () => void;
}

export interface NouvelEnnemiOuvert {
  readonly racine: HTMLElement;
  /** Referme la fiche (sans effet si elle est déjà fermée). */
  fermer(): void;
}

export function afficherNouvelEnnemi(parent: HTMLElement, options: OptionsNouvelEnnemi): NouvelEnnemiOuvert {
  const controleur = new AbortController();
  const { signal } = controleur;
  let fermee = false;
  const nom = Object.hasOwn(ENNEMIS, options.id) ? tCle(ENNEMIS[options.id as keyof typeof ENNEMIS].nom) : options.id;

  const racine = el('div', 'ecran nouvel-ennemi');
  racine.setAttribute('role', 'dialog');
  racine.setAttribute('aria-modal', 'true');
  racine.setAttribute('aria-label', t('bestiaire.nouveau_libelle', { nom }));

  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', t('bestiaire.nouveau_titre')));
  carte.append(construireFicheEnnemi(options.atlas, options.id, { courte: true, signal }));
  carte.append(el('p', 'detail', t('bestiaire.nouveau_aide')));
  const ouverteA = performance.now();
  const continuer = bouton('bouton grand', t('bestiaire.nouveau_continuer'), () => {
    if (performance.now() - ouverteA >= DELAI_CLIC_FANTOME_MS) fermer();
  }, signal);
  continuer.textContent = t('bestiaire.nouveau_continuer');
  const rangee = el('div', 'rangee');
  rangee.append(continuer);
  carte.append(rangee);
  racine.append(carte);
  parent.append(racine);
  continuer.focus({ preventScroll: true });

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
