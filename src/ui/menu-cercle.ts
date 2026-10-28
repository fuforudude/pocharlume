// Menu en cercle autour d'une case de la grille : contenu (quelles actions, quel prix, lesquelles sont grisées) et
// placement des boutons. Logique pure : le DOM est dans hud.ts. Les actions sont celles du moteur, et c'est
// `validerAction` qui décide de ce qui est grisé : l'interface ne duplique aucune règle de jeu.
import type { Action, RaisonRefus } from '../engine';
import { coutCompetence, coutConstruction, tourSurCase, validerAction, valeurRevente } from '../engine';
import type { EtatPartie, FamilleTour, Tour } from '../engine/etat';
import { defNiveau, prix } from '../engine/tours';
import { RANG_MAX_COMPETENCE } from '../data/meta';
import { iconeFamille, spriteTour } from '../render/habillage';
import { t, tCle } from '../i18n';

export interface ElementMenu {
  /** Identifiant stable (clé de comparaison entre deux images) : « construire:tir », « ameliorer », « vendre »… */
  readonly id: string;
  /** Action envoyée au moteur ; null pour le ralliement, qui demande ensuite de toucher la carte. */
  readonly action: Action | null;
  /** Nom de sprite de l'atlas affiché dans le bouton. */
  readonly icone: string;
  /** Texte lu par les lecteurs d'écran et en info-bulle (déjà traduit). */
  readonly libelle: string;
  /** Prix en arêtes (construire, améliorer, spécialiser), sinon null. */
  readonly prix: number | null;
  /** Arêtes rendues (vendre), sinon null. */
  readonly gain: number | null;
  /** Rang atteint d'une compétence de spécialisation (« 1/3 »), sinon null. */
  readonly rang: string | null;
  /** Pourquoi l'action est refusée en ce moment ; null si elle est permise. Un élément refusé est grisé. */
  readonly refus: RaisonRefus | null;
}

export const FAMILLES_MENU: readonly FamilleTour[] = ['caserne', 'tir', 'magie', 'artillerie', 'divine'];

function nomFamille(famille: FamilleTour): string {
  return t(`famille.${famille}`);
}

/**
 * Les 4 familles et la tour divine, à construire sur une case libre. En défi Fer, les familles que le niveau n'autorise pas
 * ne sont pas proposées du tout (c'est `validerAction` qui le dit, par `famille_interdite` : aucune règle dupliquée ici).
 */
export function elementsCaseVide(etat: EtatPartie, cx: number, cy: number): ElementMenu[] {
  return FAMILLES_MENU.map((famille) => {
    const action: Action = { type: 'construire', cx, cy, tour: famille };
    const def = defNiveau(etat, famille, 1, null);
    return {
      id: `construire:${famille}`,
      action,
      icone: iconeFamille(famille, etat.config.dieu),
      libelle: t('menu.construire', { nom: def ? tCle(def.nom) : nomFamille(famille) }),
      prix: coutConstruction(etat, famille) ?? null,
      gain: null,
      rang: null,
      refus: validerAction(etat, action),
    };
  }).filter((element) => element.refus !== 'famille_interdite');
}

function tourDeLaCase(etat: EtatPartie, cx: number, cy: number): Tour | undefined {
  return tourSurCase(etat, cx, cy);
}

/** Améliorer (ou les deux spécialisations au niveau 3), vendre, et ralliement pour une caserne. */
export function elementsTour(etat: EtatPartie, cx: number, cy: number): ElementMenu[] {
  const tour = tourDeLaCase(etat, cx, cy);
  if (!tour) return [];
  const elements: ElementMenu[] = [];
  const famille = tour.famille;
  if (famille !== 'divine') {
    if (tour.niveau < 3) {
      const action: Action = { type: 'ameliorer', cx, cy };
      const def = defNiveau(etat, famille, tour.niveau + 1, null);
      elements.push({
        id: 'ameliorer',
        action,
        icone: 'icone-ameliorer',
        libelle: `${t('menu.ameliorer')} : ${t('menu.niveau', { n: tour.niveau + 1 })}`,
        prix: def ? prix(etat, famille, def) : null,
        gain: null,
        rang: null,
        refus: validerAction(etat, action),
      });
    } else if (tour.niveau === 3) {
      for (const voie of ['A', 'B'] as const) {
        const action: Action = { type: 'specialiser', cx, cy, voie };
        const def = defNiveau(etat, famille, 4, voie);
        elements.push({
          id: `specialiser:${voie}`,
          action,
          icone: spriteTour(famille, 4, voie),
          libelle: def ? tCle(def.nom) : t('menu.specialisation'),
          prix: def ? prix(etat, famille, def) : null,
          gain: null,
          rang: null,
          refus: validerAction(etat, action),
        });
      }
    } else {
      // Tour spécialisée : ses deux compétences, achetées avec des arêtes (le moteur dit le prix et ce qui est permis).
      tour.stats.competences.forEach((competence, i) => {
        const action: Action = { type: 'ameliorerCompetence', cx, cy, competence: competence.id };
        const rang = tour.rangs[i] ?? 0;
        const nom = tCle(competence.nom);
        elements.push({
          id: `competence:${competence.id}`,
          action,
          icone: 'icone-competence',
          libelle: rang >= RANG_MAX_COMPETENCE ? t('menu.competence_max', { nom }) : t('menu.competence', { nom, n: rang, m: RANG_MAX_COMPETENCE }),
          prix: coutCompetence(etat, cx, cy, competence.id) ?? null,
          gain: null,
          rang: t('menu.competence_rang', { n: rang, m: RANG_MAX_COMPETENCE }),
          refus: validerAction(etat, action),
        });
      });
    }
  }
  const vente: Action = { type: 'vendre', cx, cy };
  elements.push({
    id: 'vendre',
    action: vente,
    icone: 'icone-vendre',
    libelle: t('menu.vendre'),
    prix: null,
    gain: valeurRevente(etat, cx, cy),
    rang: null,
    refus: validerAction(etat, vente),
  });
  if (tour.stats.soldats) {
    elements.push({ id: 'ralliement', action: null, icone: 'icone-ralliement', libelle: t('menu.ralliement'), prix: null, gain: null, rang: null, refus: null });
  }
  return elements;
}

/** Éléments du menu d'une case, libre ou occupée. */
export function elementsMenu(etat: EtatPartie, cx: number, cy: number): ElementMenu[] {
  return tourDeLaCase(etat, cx, cy) ? elementsTour(etat, cx, cy) : elementsCaseVide(etat, cx, cy);
}

export interface PositionMenu {
  x: number;
  y: number;
}

/**
 * Centres des `n` boutons d'un menu en cercle de rayon `rayon` autour de (cx, cy), le premier en haut puis
 * dans le sens des aiguilles d'une montre. Si le cercle sortirait de l'écran (`largeur` × `hauteur`, avec
 * `marge`), il est décalé juste ce qu'il faut pour que tous les boutons restent entièrement visibles.
 * Unités : pixels CSS.
 */
export function positionsCercle(n: number, rayon: number, cx: number, cy: number, largeur: number, hauteur: number, marge: number): PositionMenu[] {
  const bord = rayon + marge;
  const centre = (valeur: number, taille: number): number => (taille <= 2 * bord ? taille / 2 : Math.min(Math.max(valeur, bord), taille - bord));
  const x0 = centre(cx, largeur);
  const y0 = centre(cy, hauteur);
  const positions: PositionMenu[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
    positions.push({ x: x0 + Math.cos(angle) * rayon, y: y0 + Math.sin(angle) * rayon });
  }
  return positions;
}
