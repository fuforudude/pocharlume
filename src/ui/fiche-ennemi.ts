// Le contenu d'une fiche d'ennemi, partagé par le Bestiaire (fiche complète) et la fiche « Nouvel ennemi » en partie (fiche courte) :
// le sprite animé, le nom, les chiffres, ce qu'il fait, comment le contrer, la phrase de lore. Tout vient de `bestiaire-logique.ts`.
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { ficheEnnemi } from './bestiaire-logique';
import { el } from './dom';
import { creerSpriteAnime } from './sprite-anime';

export interface OptionsFicheEnnemi {
  /** Fiche courte (en pleine partie) : pas de tableau de chiffres, seulement ce qu'il fait et comment le contrer. */
  readonly courte?: boolean;
  /** Arrête l'animation du sprite. */
  readonly signal: AbortSignal;
}

function liste(classe: string, phrases: readonly string[]): HTMLElement {
  const ul = el('ul', classe);
  for (const phrase of phrases) ul.append(el('li', '', phrase));
  return ul;
}

/** Les lignes « libellé : valeur » d'une fiche (ennemi ou tour) : une paire par ligne, qui passe à la ligne suivante si la place manque. */
export function construireChiffres(lignes: readonly { readonly libelle: string; readonly valeur: string }[]): HTMLElement {
  const dl = el('dl', 'fiche-ennemi-chiffres');
  for (const l of lignes) {
    const paire = el('div', 'chiffre');
    paire.append(el('dt', '', l.libelle), el('dd', '', l.valeur));
    dl.append(paire);
  }
  return dl;
}

/** La fiche d'un ennemi rencontré. */
export function construireFicheEnnemi(atlas: AtlasRendu, id: string, options: OptionsFicheEnnemi): HTMLElement {
  const f = ficheEnnemi(id);
  const racine = el('article', options.courte === true ? 'fiche-ennemi courte' : 'fiche-ennemi');
  racine.dataset.ennemi = id;

  const tete = el('header', 'fiche-ennemi-tete');
  tete.append(creerSpriteAnime(atlas, f.sprite, { echelle: options.courte === true ? 3 : 4, animation: 'marche', signal: options.signal }));
  const noms = el('div', 'fiche-ennemi-noms');
  noms.append(el('h3', 'fiche-ennemi-nom', f.contenu.titre));
  if (f.contenu.sousTitre) noms.append(el('span', 'fiche-ennemi-boss', f.contenu.sousTitre));
  if (f.lore) noms.append(el('p', 'fiche-ennemi-lore', f.lore));
  tete.append(noms);
  racine.append(tete);

  const corps = el('div', 'fiche-ennemi-corps');
  if (options.courte !== true) {
    corps.append(construireChiffres(f.contenu.lignes));
  }
  const colonne = el('div', 'fiche-ennemi-textes');
  if (f.contenu.notes.length > 0) {
    colonne.append(el('h4', 'fiche-ennemi-sous-titre', t('bestiaire.particularites')), liste('fiche-ennemi-liste particularites', f.contenu.notes));
  }
  colonne.append(el('h4', 'fiche-ennemi-sous-titre', t('bestiaire.contrer')), liste('fiche-ennemi-liste contrer', f.contrer));
  corps.append(colonne);
  racine.append(corps);
  return racine;
}

/** La fiche d'un ennemi jamais rencontré : une silhouette et « ??? », rien de plus. */
export function construireFicheInconnue(atlas: AtlasRendu, id: string, signal: AbortSignal): HTMLElement {
  const racine = el('article', 'fiche-ennemi inconnue');
  racine.dataset.ennemi = id;
  const tete = el('header', 'fiche-ennemi-tete');
  tete.append(creerSpriteAnime(atlas, id.replaceAll('_', '-'), { echelle: 4, animation: 'repos', silhouette: true, signal }));
  const noms = el('div', 'fiche-ennemi-noms');
  noms.append(el('h3', 'fiche-ennemi-nom', t('bestiaire.inconnu')), el('p', 'fiche-ennemi-lore', t('bestiaire.inconnu_detail')));
  tete.append(noms);
  racine.append(tete);
  return racine;
}
