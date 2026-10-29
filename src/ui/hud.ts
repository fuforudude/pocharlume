// Interface de partie en DOM léger par-dessus le canvas : barre du haut (vies, arêtes, vague, vitesse, pause),
// portrait du héros et sorts en bas à gauche, appel de vague en bas à droite, menu en cercle des cases.
//
// Pourquoi du DOM plutôt que du canvas : vrais boutons (cibles tactiles de 44 px, focus clavier, lecteurs
// d'écran), texte net à toute taille, aucune mise en page à recalculer à la main. Le coût reste faible : le
// DOM n'est réécrit que quand une valeur change (`TexteSuivi`, `basculerClasse`), jamais à chaque image.
import { DIEUX } from '../data/dieux';
import { HEROS } from '../data/heros';
import { OBJETS } from '../data/objets';
import type { EtatPartie } from '../engine';
import { validerAction } from '../engine';
import { chercherParId } from '../engine/recherche';
import { PAS_PAR_SECONDE, enPas } from '../engine/temps';
import { bonusAppel } from '../engine/vagues';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { habillageSort, iconeObjet, spriteUnite } from '../render/habillage';
import { basculerClasse, bouton, el, image, TexteSuivi } from './dom';
import type { Mode } from './interaction';
import { positionsCercle, type ElementMenu } from './menu-cercle';

export interface CommandesHud {
  appelerVague: () => void;
  changerVitesse: () => void;
  basculerPause: () => void;
  basculerSort: (emplacement: number) => void;
  basculerObjet: (emplacement: number) => void;
  basculerHeros: () => void;
  choisirElement: (element: ElementMenu) => void;
  /** Un bouton du menu en cercle est survolé à la souris ou pris au clavier (portée de la tour à construire) ; null quand il est quitté. */
  survolerElement: (element: ElementMenu | null) => void;
}

/** Ce que le HUD affiche et qui ne vient pas de l'état du moteur. */
export interface VueHud {
  readonly vitesse: number;
  readonly pause: boolean;
  readonly mode: Mode;
}

interface BoutonSort {
  readonly noeud: HTMLButtonElement;
  readonly recharge: HTMLElement;
  readonly secondes: TexteSuivi;
  derniereFraction: number;
}

/** Textes du rappel de touche des deux sorts et des trois objets (rappel affiché sur les boutons). */
const TOUCHES_SORTS = ['hud.touche_sort_1', 'hud.touche_sort_2'] as const;
const TOUCHES_OBJETS = ['hud.touche_objet_1', 'hud.touche_objet_2', 'hud.touche_objet_3'] as const;

interface BoutonObjet {
  readonly noeud: HTMLButtonElement;
  utilise: boolean;
}
const DUREE_MESSAGE = 2200;
const MARGE_MENU = 30;

export class Hud {
  readonly racine: HTMLElement;

  private readonly vies: TexteSuivi;
  private readonly puceVies: HTMLElement;
  private readonly aretes: TexteSuivi;
  private readonly vague: TexteSuivi;
  private readonly vitesse: TexteSuivi;
  private readonly boutonPause: HTMLElement;
  private readonly boutonVague: HTMLButtonElement;
  private readonly libelleVague: TexteSuivi;
  private readonly compteVague: TexteSuivi;
  private readonly portrait: HTMLButtonElement;
  private readonly barrePv: HTMLElement;
  private readonly etatHeros: TexteSuivi;
  private readonly sorts: BoutonSort[] = [];
  private readonly objets: BoutonObjet[] = [];
  private readonly invite: TexteSuivi;
  private readonly message: TexteSuivi;
  private readonly noeudMessage: HTMLElement;
  private readonly menu: HTMLElement;
  private minuteurMessage = 0;
  private viesPrecedentes = -1;
  private fractionPv = -1;
  private signatureMenu = '';
  private versionMenu = -1;
  private menuX = Number.NaN;
  private menuY = Number.NaN;

  constructor(
    parent: HTMLElement,
    private readonly atlas: AtlasRendu,
    etat: EtatPartie,
    private readonly commandes: CommandesHud,
    signal: AbortSignal,
    private readonly infini?: { readonly record: () => number },
  ) {
    this.racine = el('div', 'hud');

    // Haut gauche : vies, arêtes, vague.
    const hautGauche = el('div', 'groupe haut-gauche');
    this.puceVies = this.puce(hautGauche, 'icone-vie', t('hud.vies'));
    this.vies = new TexteSuivi(el('span', 'valeur'));
    this.puceVies.append(this.vies.noeud);
    const puceAretes = this.puce(hautGauche, 'icone-arete', t('hud.aretes'));
    this.aretes = new TexteSuivi(el('span', 'valeur'));
    puceAretes.append(this.aretes.noeud);
    const puceVague = el('div', 'puce');
    this.vague = new TexteSuivi(el('span', 'valeur'));
    puceVague.append(this.vague.noeud);
    hautGauche.append(puceVague);

    // Haut droite : vitesse et pause.
    const hautDroite = el('div', 'groupe haut-droite');
    const vitesse = bouton('bouton', t('hud.vitesse', { n: 2 }), commandes.changerVitesse, signal);
    this.vitesse = new TexteSuivi(vitesse);
    vitesse.setAttribute('aria-live', 'polite');
    this.boutonPause = bouton('bouton pause', t('hud.pause'), commandes.basculerPause, signal);
    this.boutonPause.append(el('i'), el('i'));
    hautDroite.append(vitesse, this.boutonPause);

    // Bas gauche : héros et sorts.
    const basGauche = el('div', 'groupe bas-gauche');
    const dieu = Object.hasOwn(DIEUX, etat.config.dieu) ? DIEUX[etat.config.dieu as keyof typeof DIEUX] : undefined;
    // Le héros emmené (l'avatar du dieu ou l'un de ses disciples) donne son nom et son visage au portrait.
    const heros = Object.hasOwn(HEROS, etat.config.heros) ? HEROS[etat.config.heros as keyof typeof HEROS] : dieu?.heros;
    this.portrait = bouton('bouton portrait', heros ? tCle(heros.nom) : t('hud.heros'), commandes.basculerHeros, signal);
    if (heros) this.portrait.append(image(atlas.iconeUrl(spriteUnite('heros', heros.nom), 2), 'visage'));
    this.portrait.append(el('span', 'touche', t('hud.touche_heros')));
    const jauge = el('span', 'jauge');
    this.barrePv = el('span', 'rempli');
    jauge.append(this.barrePv);
    this.portrait.append(jauge);
    this.etatHeros = new TexteSuivi(el('span', 'etat'));
    this.portrait.append(this.etatHeros.noeud);
    basGauche.append(this.portrait);
    dieu?.sorts.forEach((sort, i) => {
      const libelle = tCle(sort.nom);
      const noeud = bouton('bouton sort', libelle, () => { commandes.basculerSort(i); }, signal);
      noeud.append(image(atlas.iconeUrl(habillageSort(etat.config.dieu, i).icone, 3), 'icone'));
      const recharge = el('span', 'recharge');
      const secondes = new TexteSuivi(el('span', 'secondes'));
      const cleTouche = TOUCHES_SORTS[i];
      noeud.append(recharge, secondes.noeud, el('span', 'touche', cleTouche ? t(cleTouche) : ''));
      basGauche.append(noeud);
      this.sorts.push({ noeud, recharge, secondes, derniereFraction: -1 });
    });

    // Les objets emportés (3 emplacements au plus) : toucher l'objet, puis la carte ; utilisé, il est grisé.
    etat.config.objets.forEach((id, i) => {
      if (!Object.hasOwn(OBJETS, id)) return;
      const libelle = t('hud.objet', { nom: tCle(OBJETS[id as keyof typeof OBJETS].nom) });
      const noeud = bouton('bouton objet', libelle, () => { commandes.basculerObjet(i); }, signal);
      noeud.append(image(atlas.iconeUrl(iconeObjet(id), 2), 'icone'));
      const cleTouche = TOUCHES_OBJETS[i];
      noeud.append(el('span', 'touche', cleTouche ? t(cleTouche) : ''));
      basGauche.append(noeud);
      this.objets.push({ noeud, utilise: false });
    });

    // Bas droite : appel de la vague suivante.
    const basDroite = el('div', 'groupe bas-droite');
    this.boutonVague = bouton('bouton vague', t('hud.appeler_vague'), commandes.appelerVague, signal);
    this.libelleVague = new TexteSuivi(el('span', 'libelle'));
    this.compteVague = new TexteSuivi(el('span', 'compte'));
    this.boutonVague.append(this.libelleVague.noeud, this.compteVague.noeud, el('span', 'touche', t('hud.touche_vague')));
    basDroite.append(this.boutonVague);

    // Invite de visée et messages de refus.
    this.invite = new TexteSuivi(el('div', 'invite'));
    this.noeudMessage = el('div', 'message');
    this.message = new TexteSuivi(this.noeudMessage);
    this.menu = el('div', 'menu-cercle');

    this.racine.append(hautGauche, hautDroite, basGauche, basDroite, this.invite.noeud, this.noeudMessage, this.menu);
    // Après un clic ou un toucher, le bouton ne garde pas le focus : Espace appelle la vague au lieu de
    // réactiver le dernier bouton touché. Une activation au clavier (detail = 0) garde son focus.
    this.racine.addEventListener('click', (e) => {
      if (e.detail > 0 && e.target instanceof Element) e.target.closest('button')?.blur();
    }, { signal });
    parent.append(this.racine);
  }

  private puce(parent: HTMLElement, sprite: string, libelle: string): HTMLElement {
    const puce = el('div', 'puce');
    puce.title = libelle;
    puce.setAttribute('aria-label', libelle);
    puce.append(image(this.atlas.iconeUrl(sprite, 2), 'icone'));
    parent.append(puce);
    return puce;
  }

  /** Reflète l'état de la partie. Appelée à chaque image : n'écrit dans le DOM que ce qui a changé. */
  mettreAJour(etat: EtatPartie, vue: VueHud, invite: string | null): void {
    // Vies : clignote en rouge quand on en perd.
    this.vies.mettreSelon(etat.vies, () => String(etat.vies));
    if (this.viesPrecedentes !== -1 && etat.vies < this.viesPrecedentes) {
      this.puceVies.classList.remove('degat');
      this.puceVies.getBoundingClientRect(); // force le calcul de style pour relancer l'animation
      this.puceVies.classList.add('degat');
    }
    this.viesPrecedentes = etat.vies;
    this.aretes.mettreSelon(etat.aretes, () => String(etat.aretes));
    if (this.infini) {
      // Mode infini : pas de total de vagues (le niveau n'en a aucune), mais le record de la carte.
      const record = this.infini.record();
      this.vague.mettreSelon(etat.vagues.lancees * 10_000 + record, () =>
        record > 0 ? t('hud.vague_infini_record', { n: etat.vagues.lancees, r: record }) : t('hud.vague_infini', { n: etat.vagues.lancees }),
      );
    } else {
      this.vague.mettreSelon(etat.vagues.lancees, () => t('hud.vague', { n: etat.vagues.lancees, m: etat.niveau.vagues.length }));
    }
    this.vitesse.mettreSelon(vue.vitesse, () => t('hud.vitesse', { n: vue.vitesse }));
    basculerClasse(this.boutonPause, 'actif', vue.pause);

    this.mettreAJourVague(etat);
    this.mettreAJourHeros(etat, vue.mode);
    this.mettreAJourSorts(etat, vue.mode);
    this.mettreAJourObjets(etat, vue.mode);
    this.invite.mettre(invite ?? '');
    basculerClasse(this.invite.noeud, 'visible', invite !== null);
  }

  private mettreAJourVague(etat: EtatPartie): void {
    const v = etat.vagues;
    const toutesLancees = v.prochaine === -1;
    basculerClasse(this.boutonVague, 'cache', toutesLancees);
    if (toutesLancees) return;
    const refus = validerAction(etat, { type: 'appelerVague' });
    this.boutonVague.setAttribute('aria-disabled', String(refus !== null));
    basculerClasse(this.boutonVague, 'grise', refus !== null);
    const bonus = v.lancees > 0 ? bonusAppel(etat) : 0;
    this.libelleVague.mettreSelon(bonus, () => (bonus > 0 ? t('hud.appeler_vague_bonus', { n: bonus }) : t('hud.appeler_vague')));
    const secondes = Math.max(0, Math.ceil((v.prochaine - etat.pas) / PAS_PAR_SECONDE));
    this.compteVague.mettreSelon(secondes, () => t('hud.vague_dans', { s: secondes }));
  }

  private mettreAJourHeros(etat: EtatPartie, mode: Mode): void {
    const heros = chercherParId(etat.unites, etat.heros);
    const fraction = heros && !heros.mort ? Math.max(0, Math.min(1, heros.pv / heros.stats.pv)) : 0;
    const pourcent = Math.round(fraction * 100);
    if (pourcent !== this.fractionPv) {
      this.fractionPv = pourcent;
      this.barrePv.style.width = `${String(pourcent)}%`;
    }
    const tombe = !heros || heros.mort;
    basculerClasse(this.portrait, 'grise', tombe);
    basculerClasse(this.portrait, 'actif', mode.type === 'heros');
    // -1 : le héros est en vie, rien à dire ; sinon le nombre de secondes avant son retour.
    const retour = tombe && heros ? Math.max(0, Math.ceil(heros.reapparition / PAS_PAR_SECONDE)) : -1;
    this.etatHeros.mettreSelon(retour, () => (retour >= 0 ? t('hud.heros_revient', { s: retour }) : ''));
  }

  private mettreAJourSorts(etat: EtatPartie, mode: Mode): void {
    this.sorts.forEach((bouton, i) => {
      const dieu = Object.hasOwn(DIEUX, etat.config.dieu) ? DIEUX[etat.config.dieu as keyof typeof DIEUX] : undefined;
      const total = enPas(dieu?.sorts[i]?.recharge ?? 1);
      const restant = etat.sorts[i]?.recharge ?? 0;
      const fraction = total > 0 ? Math.min(1, restant / total) : 0;
      const pourcent = Math.round(fraction * 100);
      if (pourcent !== bouton.derniereFraction) {
        bouton.derniereFraction = pourcent;
        bouton.recharge.style.height = `${String(pourcent)}%`;
      }
      const secondes = restant > 0 ? Math.ceil(restant / PAS_PAR_SECONDE) : 0;
      bouton.secondes.mettreSelon(secondes, () => (secondes > 0 ? String(secondes) : ''));
      basculerClasse(bouton.noeud, 'grise', restant > 0);
      basculerClasse(bouton.noeud, 'actif', mode.type === 'sort' && mode.emplacement === i);
    });
  }

  private mettreAJourObjets(etat: EtatPartie, mode: Mode): void {
    this.objets.forEach((bouton, i) => {
      const utilise = etat.objetsUtilises[i] === true;
      if (utilise !== bouton.utilise) {
        bouton.utilise = utilise;
        const id = etat.config.objets[i];
        if (id !== undefined && Object.hasOwn(OBJETS, id)) {
          const libelle = t(utilise ? 'hud.objet_utilise' : 'hud.objet', { nom: tCle(OBJETS[id as keyof typeof OBJETS].nom) });
          bouton.noeud.title = libelle;
          bouton.noeud.setAttribute('aria-label', libelle);
        }
      }
      basculerClasse(bouton.noeud, 'grise', utilise);
      basculerClasse(bouton.noeud, 'actif', mode.type === 'objet' && mode.emplacement === i);
    });
  }

  /** Affiche un message court (refus d'un geste) qui s'efface seul. */
  afficherMessage(texte: string): void {
    this.message.mettre(texte);
    basculerClasse(this.noeudMessage, 'visible', true);
    window.clearTimeout(this.minuteurMessage);
    this.minuteurMessage = window.setTimeout(() => {
      basculerClasse(this.noeudMessage, 'visible', false);
    }, DUREE_MESSAGE);
  }

  /**
   * Montre le menu en cercle autour du point (cx, cy) en pixels CSS, ou le cache si `elements` est null.
   * Les boutons ne sont reconstruits que si leur contenu change (prix, grisé), et replacés que si le
   * point bouge.
   */
  placerMenu(elements: readonly ElementMenu[] | null, version: number, cx: number, cy: number, largeur: number, hauteur: number, rayon: number): void {
    if (!elements || elements.length === 0) {
      if (this.signatureMenu !== '') {
        this.signatureMenu = '';
        this.versionMenu = -1;
        this.menu.replaceChildren();
        this.commandes.survolerElement(null);
      }
      return;
    }
    const bouge = Math.abs(cx - this.menuX) > 0.5 || Math.abs(cy - this.menuY) > 0.5;
    // La signature (id, prix, gain, refus de chaque élément) n'est recalculée que si le contenu a été recalculé
    // (`version` change à chaque pas de simulation), pas à chaque image.
    let reconstruit = false;
    if (version !== this.versionMenu) {
      this.versionMenu = version;
      const signature = elements.map((e) => `${e.id}|${String(e.prix)}|${String(e.gain)}|${String(e.rang)}|${String(e.refus)}`).join(';');
      if (signature !== this.signatureMenu) {
        this.signatureMenu = signature;
        const boutons = elements.map((e) => this.boutonMenu(e));
        this.menu.replaceChildren(...boutons);
        reconstruit = true;
        // Les boutons remplacés n'envoient pas de « pointeur parti » : on redit lequel est survolé, s'il y en a un.
        this.commandes.survolerElement(null);
        boutons.forEach((b, i) => {
          if (b.matches(':hover') || b === document.activeElement) this.commandes.survolerElement(elements[i] ?? null);
        });
      }
    }
    if (!reconstruit && !bouge) return;
    this.menuX = cx;
    this.menuY = cy;
    const positions = positionsCercle(elements.length, rayon, cx, cy, largeur, hauteur, MARGE_MENU);
    this.menu.childNodes.forEach((noeud, i) => {
      const p = positions[i];
      if (p && noeud instanceof HTMLElement) {
        noeud.style.left = `${String(Math.round(p.x))}px`;
        noeud.style.top = `${String(Math.round(p.y))}px`;
      }
    });
  }

  private boutonMenu(element: ElementMenu): HTMLButtonElement {
    const b = el('button', 'element-menu');
    b.type = 'button';
    b.title = element.libelle;
    b.setAttribute('aria-label', element.libelle);
    b.setAttribute('aria-disabled', String(element.refus !== null));
    if (element.refus !== null) b.classList.add('grise');
    if (element.refus === 'aretes_insuffisantes') b.classList.add('trop-cher');
    if (element.refus === 'competence_au_maximum') b.classList.add('au-sommet');
    b.append(image(this.atlas.iconeUrl(element.icone, element.icone.startsWith('tour-') ? 1 : 2), 'icone'));
    if (element.rang !== null) b.append(el('span', 'rang', element.rang));
    if (element.prix !== null || element.gain !== null) {
      const prix = el('span', 'prix');
      prix.append(image(this.atlas.iconeUrl('icone-arete', 1), 'arete'), el('span', '', `${element.gain !== null ? '+' : ''}${String(element.prix ?? element.gain)}`));
      b.append(prix);
    }
    // Souris seulement : au doigt, toucher un bouton le choisit tout de suite, il n'y a pas de survol.
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') this.commandes.survolerElement(element);
    });
    b.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') this.commandes.survolerElement(null);
    });
    b.addEventListener('focus', () => { this.commandes.survolerElement(element); });
    b.addEventListener('blur', () => { this.commandes.survolerElement(null); });
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      this.commandes.choisirElement(element);
    });
    return b;
  }

  detruire(): void {
    window.clearTimeout(this.minuteurMessage);
    this.racine.remove();
  }
}
