// Ossature commune des écrans de méta-progression (héros, boutique) : un panneau plein cadre avec une barre du haut
// (titre, monnaies, fermer), un corps qu'on redessine après chaque achat, et une ligne de message pour les refus.
// Le clavier : Échap ferme, sauf quand une confirmation est ouverte par-dessus (elle garde Échap).
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import type { Sauvegarde } from '../save';
import { etoilesDisponibles } from '../save';
import { bouton, el, image } from './dom';

export interface EcranMeta {
  readonly racine: HTMLElement;
  /** Zone qu'on remplit et remplace à chaque redessin. */
  readonly corps: HTMLElement;
  /** Remet les monnaies de la barre à jour d'après la sauvegarde. */
  majMonnaies(s: Sauvegarde): void;
  /** Affiche un message court (refus, confirmation d'achat) sous le corps. */
  dire(texte: string, refus?: boolean): void;
  /** Retire l'écran et ses écouteurs, sans appeler `surFermer`. */
  arreter(): void;
}

export interface OptionsEcranMeta {
  readonly classe: string;
  readonly titre: string;
  readonly fermer: string;
  readonly atlas: AtlasRendu;
  readonly sauvegarde: Sauvegarde;
  /** Quelles monnaies la barre montre : les braises (héros, caisses), les arêtes et les étoiles (boutique), les éclats (collection). */
  readonly monnaies: readonly ('aretes' | 'braises' | 'etoiles' | 'eclats')[];
  readonly surFermer: () => void;
}

/** Une rangée de pastilles pleines et vides (rangs d'une compétence ou d'une branche). */
export function pastilles(rang: number, max: number): HTMLElement {
  const rangee = el('span', 'pastilles');
  for (let i = 1; i <= max; i++) rangee.append(el('i', i <= rang ? 'pleine' : ''));
  return rangee;
}

export function creerEcranMeta(parent: HTMLElement, options: OptionsEcranMeta): EcranMeta {
  const { atlas } = options;
  const precedent = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const controleur = new AbortController();
  const { signal } = controleur;
  let arretee = false;

  const racine = el('div', `ecran panneau-meta ${options.classe}`);
  racine.setAttribute('role', 'dialog');
  racine.setAttribute('aria-modal', 'true');
  racine.setAttribute('aria-label', options.titre);

  const carte = el('div', 'carte');
  const entete = el('div', 'meta-entete');
  entete.append(el('h2', 'titre', options.titre));
  const monnaies = el('div', 'meta-monnaies');
  const puces = new Map<string, HTMLElement>();
  const icones = { aretes: 'icone-arete', braises: 'icone-braise', etoiles: 'icone-etoile', eclats: 'icone-eclat' } as const;
  for (const monnaie of options.monnaies) {
    const puce = el('div', 'puce monnaie');
    puce.append(image(atlas.iconeUrl(icones[monnaie], 2), 'icone'), el('span'));
    puces.set(monnaie, puce);
    monnaies.append(puce);
  }
  const fermer = bouton('bouton', options.fermer, () => {
    arreter();
    options.surFermer();
  }, signal);
  fermer.textContent = options.fermer;
  entete.append(monnaies, fermer);

  const corps = el('div', 'meta-corps');
  const message = el('p', 'meta-message');
  message.setAttribute('role', 'status');
  carte.append(entete, corps, message);
  racine.append(carte);
  parent.append(racine);

  const majMonnaies = (s: Sauvegarde): void => {
    const valeurs = { aretes: s.meta.monnaies.aretes, braises: s.meta.monnaies.braises, etoiles: etoilesDisponibles(s), eclats: s.meta.collection.eclats };
    const libelles = {
      aretes: t('monnaie.aretes', { n: valeurs.aretes }),
      braises: t('monnaie.braises', { n: valeurs.braises }),
      etoiles: t('monnaie.etoiles', { n: valeurs.etoiles }),
      eclats: t('monnaie.eclats', { n: valeurs.eclats }),
    };
    for (const [nom, puce] of puces) {
      const cle = nom as keyof typeof valeurs;
      const texte = puce.querySelector('span');
      if (texte) texte.textContent = String(valeurs[cle]);
      puce.title = libelles[cle];
      puce.setAttribute('aria-label', libelles[cle]);
    }
  };
  majMonnaies(options.sauvegarde);

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.ctrlKey || e.altKey || e.metaKey) return;
    // Une confirmation (ou la révélation d'une caisse) ouverte par-dessus garde Échap pour elle.
    if (document.querySelector('.ecran.confirmation, .revelation')) return;
    e.preventDefault();
    arreter();
    options.surFermer();
  }, { signal });

  function arreter(): void {
    if (arretee) return;
    arretee = true;
    controleur.abort();
    racine.remove();
    precedent?.focus({ preventScroll: true });
  }

  return {
    racine,
    corps,
    majMonnaies,
    dire(texte: string, refus = false): void {
      message.textContent = texte;
      message.classList.toggle('refus', refus);
    },
    arreter,
  };
}

/**
 * Redessine `corps` avec `construire`, en rendant le focus au bouton qui l'avait (repéré par `data-cle`) : un achat au
 * clavier ne renvoie pas au début de l'écran.
 */
export function redessiner(corps: HTMLElement, construire: () => readonly Node[]): void {
  const cle = document.activeElement instanceof HTMLElement && corps.contains(document.activeElement) ? document.activeElement.dataset.cle : undefined;
  const defilement = corps.scrollTop;
  corps.replaceChildren(...construire());
  corps.scrollTop = defilement;
  if (!cle) return;
  for (const b of corps.querySelectorAll<HTMLElement>('[data-cle]')) {
    if (b.dataset.cle === cle) {
      b.focus({ preventScroll: true });
      return;
    }
  }
}
