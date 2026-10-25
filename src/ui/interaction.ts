// Ce que fait chaque geste du joueur : toucher un socle ouvre son menu, toucher le héros puis un point lui
// donne un ordre, toucher un sort puis la carte le lance. Machine à états pure (sans DOM) : elle ne modifie
// jamais l'état de la partie, elle renvoie l'action à envoyer au moteur (qui la valide et la met au journal).
import { DIEUX } from '../data/dieux';
import type { Action, EtatPartie, RaisonRefus } from '../engine';
import { validerAction } from '../engine';
import type { FamilleTour } from '../engine/etat';
import { chercherParId } from '../engine/recherche';
import { tCle } from '../i18n';
import type { Surbrillance } from '../render/rendu';
import type { ElementMenu } from './menu-cercle';

export type Mode =
  | { readonly type: 'libre' }
  /** Le menu en cercle d'un socle est ouvert. */
  | { readonly type: 'menu'; readonly socle: number }
  /** Le héros est sélectionné : le prochain point touché est son ordre. */
  | { readonly type: 'heros' }
  | { readonly type: 'sort'; readonly emplacement: number }
  /** Une caserne attend son point de ralliement. */
  | { readonly type: 'ralliement'; readonly socle: number };

/** Ce que le geste demande à la partie : une action pour le moteur, ou la raison d'un refus à afficher. */
export interface Issue {
  readonly action: Action | null;
  readonly refus: RaisonRefus | null;
}

const RIEN: Issue = { action: null, refus: null };
const LIBRE: Mode = { type: 'libre' };

export type CibleTouchee = { readonly type: 'heros' } | { readonly type: 'socle'; readonly socle: number };

/** Décalage entre le pied d'une tour ou d'un personnage et le centre de son sprite, en tuiles : on touche le corps. */
const CENTRE_SPRITE = 0.5;

/**
 * Ce qui est touché en (x, y) (tuiles) : le héros ou un socle, le plus proche dans `rayon` tuiles. Le rayon
 * vient de la taille de la cible tactile (44 px CSS) convertie en tuiles au zoom courant.
 */
export function cibleTouchee(etat: EtatPartie, x: number, y: number, rayon: number): CibleTouchee | null {
  let meilleure: CibleTouchee | null = null;
  let distanceMin = rayon * rayon;
  const heros = chercherParId(etat.unites, etat.heros);
  if (heros && !heros.mort) {
    const dx = heros.x - x;
    const dy = heros.y - CENTRE_SPRITE - y;
    const d = dx * dx + dy * dy;
    if (d <= distanceMin) {
      distanceMin = d;
      meilleure = { type: 'heros' };
    }
  }
  etat.niveau.carte.socles.forEach((s, i) => {
    const dx = s.x - x;
    const dy = s.y - CENTRE_SPRITE - y;
    const d = dx * dx + dy * dy;
    if (d <= distanceMin) {
      distanceMin = d;
      meilleure = { type: 'socle', socle: i };
    }
  });
  return meilleure;
}

/** Rayon (tuiles) du sort d'un emplacement, 0 s'il est inconnu. */
export function rayonSort(etat: EtatPartie, emplacement: number): number {
  const dieu = Object.hasOwn(DIEUX, etat.config.dieu) ? DIEUX[etat.config.dieu as keyof typeof DIEUX] : undefined;
  return dieu?.sorts[emplacement]?.rayon ?? 0;
}

export class Interaction {
  mode: Mode = LIBRE;
  /** Dernier mode dont on a rédigé l'invite : l'invite est appelée à chaque image, le texte n'est refait que si le mode change. */
  private modeInvite: Mode | null = null;
  private texteInvite: string | null = null;

  /** Un point de la carte a été touché (coordonnées en tuiles). */
  toucher(etat: EtatPartie, x: number, y: number, rayon: number): Issue {
    const mode = this.mode;
    const cible = cibleTouchee(etat, x, y, rayon);
    switch (mode.type) {
      case 'heros':
        if (cible?.type === 'heros') return this.annuler();
        return this.ordonner(etat, { type: 'deplacerHeros', x, y });
      case 'sort':
        return this.ordonner(etat, { type: 'lancerSort', emplacement: mode.emplacement, x, y });
      case 'ralliement':
        return this.ordonner(etat, { type: 'deplacerRalliement', socle: mode.socle, x, y });
      default:
        break;
    }
    if (!cible) return this.annuler();
    if (cible.type === 'heros') return this.selectionnerHeros(etat);
    this.mode = mode.type === 'menu' && mode.socle === cible.socle ? LIBRE : { type: 'menu', socle: cible.socle };
    return RIEN;
  }

  /** Envoie l'action visée ; si le moteur la refuse, on reste en visée pour que le joueur retouche ailleurs. */
  private ordonner(etat: EtatPartie, action: Action): Issue {
    const refus = validerAction(etat, action);
    if (refus !== null) return { action: null, refus };
    this.mode = LIBRE;
    return { action, refus: null };
  }

  /** Un bouton du menu en cercle a été touché. */
  choisirElement(element: ElementMenu): Issue {
    const mode = this.mode;
    if (mode.type !== 'menu') return RIEN;
    if (element.refus !== null) return { action: null, refus: element.refus };
    if (element.id === 'ralliement') {
      this.mode = { type: 'ralliement', socle: mode.socle };
      return RIEN;
    }
    this.mode = LIBRE;
    return { action: element.action, refus: null };
  }

  private selectionnerHeros(etat: EtatPartie): Issue {
    const heros = chercherParId(etat.unites, etat.heros);
    if (!heros || heros.mort) return { action: null, refus: 'heros_mort' };
    this.mode = { type: 'heros' };
    return RIEN;
  }

  /** Bouton du héros ou touche E : sélectionne le héros, ou annule la sélection. */
  basculerHeros(etat: EtatPartie): Issue {
    if (this.mode.type === 'heros') return this.annuler();
    return this.selectionnerHeros(etat);
  }

  /** Bouton d'un sort ou touche Q/W : passe en visée, ou annule si ce sort était déjà en visée. */
  basculerSort(etat: EtatPartie, emplacement: number): Issue {
    if (this.mode.type === 'sort' && this.mode.emplacement === emplacement) return this.annuler();
    const sort = etat.sorts[emplacement];
    if (!sort) return { action: null, refus: 'sort_inconnu' };
    if (sort.recharge > 0) return { action: null, refus: 'sort_en_recharge' };
    this.mode = { type: 'sort', emplacement };
    return RIEN;
  }

  /** Touches 1 à 5 : construit sur le socle dont le menu est ouvert (s'il est vide). */
  construireSurSelection(etat: EtatPartie, famille: FamilleTour): Issue {
    const mode = this.mode;
    if (mode.type !== 'menu' || etat.tours.some((tour) => tour.socle === mode.socle)) return RIEN;
    return this.ordonner(etat, { type: 'construire', socle: mode.socle, tour: famille });
  }

  /** Échap, ou un toucher dans le vide : ferme les menus et abandonne la visée. */
  annuler(): Issue {
    this.mode = LIBRE;
    return RIEN;
  }

  /** Ramène le mode à un état valide quand la partie a changé sous lui (héros mort, tour vendue…). */
  rafraichir(etat: EtatPartie): void {
    const mode = this.mode;
    if (etat.statut !== 'en_cours') {
      this.mode = LIBRE;
      return;
    }
    if (mode.type === 'heros') {
      const heros = chercherParId(etat.unites, etat.heros);
      if (!heros || heros.mort) this.mode = LIBRE;
    } else if (mode.type === 'sort') {
      if ((etat.sorts[mode.emplacement]?.recharge ?? 1) > 0) this.mode = LIBRE;
    } else if (mode.type === 'ralliement') {
      if (!etat.tours.some((tour) => tour.socle === mode.socle && tour.stats.soldats)) this.mode = LIBRE;
    }
  }

  /** Recopie le mode dans ce que le rendu met en valeur sur la carte. */
  surbrillance(etat: EtatPartie, surb: Surbrillance): void {
    const mode = this.mode;
    surb.socle = -1;
    surb.portee = 0;
    surb.heros = mode.type === 'heros';
    surb.sortRayon = mode.type === 'sort' ? rayonSort(etat, mode.emplacement) : 0;
    if (mode.type === 'menu' || mode.type === 'ralliement') {
      surb.socle = mode.socle;
      const tour = etat.tours.find((autre) => autre.socle === mode.socle);
      surb.portee = tour?.stats.portee ?? 0;
    }
  }

  /** Invite affichée pendant une visée (« Touche un point du chemin… »), ou null. */
  invite(etat: EtatPartie): string | null {
    const mode = this.mode;
    if (mode === this.modeInvite) return this.texteInvite;
    this.modeInvite = mode;
    this.texteInvite = this.rediger(etat, mode);
    return this.texteInvite;
  }

  private rediger(etat: EtatPartie, mode: Mode): string | null {
    switch (mode.type) {
      case 'heros':
        return tCle('invite.heros');
      case 'ralliement':
        return tCle('invite.ralliement');
      case 'sort': {
        const dieu = Object.hasOwn(DIEUX, etat.config.dieu) ? DIEUX[etat.config.dieu as keyof typeof DIEUX] : undefined;
        const sort = dieu?.sorts[mode.emplacement];
        return sort ? tCle('invite.sort', { nom: tCle(sort.nom) }) : null;
      }
      default:
        return null;
    }
  }
}
