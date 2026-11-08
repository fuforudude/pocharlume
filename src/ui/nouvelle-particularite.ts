// La fiche « Nouvelle particularité » : elle s'ouvre au début d'une partie la première fois qu'on rencontre un gimmick (Vol de
// Corbeaux, Radeau…). Même mécanique et même allure que la fiche « Nouvel ennemi » (nouvel-ennemi.ts) : elle ne décide rien,
// l'appelant (partie.ts) met la partie en pause avant de l'ouvrir et la relance à la fermeture. Clavier : le focus est sur
// « Compris » (Entrée ou Espace), Échap referme aussi.
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { bouton, el, image } from './dom';
import type { NouvelEnnemiOuvert } from './nouvel-ennemi';
import { conseilParticularite, iconeParticularite, nomParticularite, phraseParticularite, type TypeParticularite } from './particularites';

/** Délai pendant lequel un clic sur « Compris » est ignoré après l'ouverture (clic fantôme d'un écran tactile). */
const DELAI_CLIC_FANTOME_MS = 250;

export interface OptionsNouvelleParticularite {
  readonly atlas: AtlasRendu;
  readonly type: TypeParticularite;
  /** Appelée une seule fois, quand la fiche se referme (par le bouton, Échap ou `fermer`). */
  readonly surFermer: () => void;
}

/** Le contenu de la fiche, sans le cadre ni le bouton : partagé avec l'onglet « Particularités » du Bestiaire. */
export function construireFicheParticularite(atlas: AtlasRendu, type: TypeParticularite): HTMLElement {
  const fiche = el('article', 'fiche-particularite');
  fiche.dataset.particularite = type;
  const tete = el('header', 'fiche-ennemi-tete');
  tete.append(image(atlas.iconeUrl(iconeParticularite(type), 4), 'fiche-particularite-icone'));
  const noms = el('div', 'fiche-ennemi-noms');
  noms.append(el('h3', 'fiche-ennemi-nom', nomParticularite(type)), el('p', 'fiche-particularite-phrase', phraseParticularite(type)));
  tete.append(noms);
  fiche.append(tete, el('h4', 'fiche-particularite-titre', t('gimmick.comment')), el('p', 'fiche-particularite-conseil', conseilParticularite(type)));
  return fiche;
}

export function afficherNouvelleParticularite(parent: HTMLElement, options: OptionsNouvelleParticularite): NouvelEnnemiOuvert {
  const controleur = new AbortController();
  const { signal } = controleur;
  let fermee = false;

  // Les classes de la fiche « Nouvel ennemi » donnent la même allure (cadre, titre, bouton) ; la seconde la distingue.
  const racine = el('div', 'ecran nouvel-ennemi nouvelle-particularite');
  racine.setAttribute('role', 'dialog');
  racine.setAttribute('aria-modal', 'true');
  racine.setAttribute('aria-label', t('gimmick.nouveau_libelle', { nom: nomParticularite(options.type) }));

  const carte = el('div', 'carte');
  carte.append(el('h2', 'titre', t('gimmick.nouveau_titre')));
  carte.append(construireFicheParticularite(options.atlas, options.type));
  carte.append(el('p', 'detail', t('gimmick.nouveau_aide')));
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
