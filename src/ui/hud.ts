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
import { decompteParole } from './parole-boss';
import { chercherParId } from '../engine/recherche';
import { PAS_PAR_SECONDE, enPas } from '../engine/temps';
import { bonusAppel } from '../engine/vagues';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { habillageSort, iconeObjet, spriteUnite } from '../render/habillage';
import { attacherBulle } from './bulle';
import type { ContenuBulle } from './bulle-contenus';
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
  /** Bulle de description d'un bouton du menu en cercle (survol, appui long) ; null : pas de bulle. */
  decrireElement?: (element: ElementMenu) => ContenuBulle | null;
  /** Bulle de description du portrait du héros. */
  decrireHeros?: () => ContenuBulle | null;
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

/** Un bouton du menu en cercle, avec l'élément qu'il porte (remplacé en place quand prix ou grisé changent). */
interface BoutonMenu {
  readonly noeud: HTMLButtonElement;
  element: ElementMenu;
  readonly rang: HTMLElement | null;
  readonly prix: HTMLElement | null;
}

interface BoutonObjet {
  readonly noeud: HTMLButtonElement;
  utilise: boolean;
}
const DUREE_MESSAGE = 2200;
const DUREE_PAROLE = 7000;
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
  private readonly noeudParole: HTMLElement;
  /** Temps de jeu restant (ms) avant que le bandeau de parole s'efface ; 0 = caché. */
  private paroleRestante = 0;
  private derniereImage = 0;
  private viesPrecedentes = -1;
  private fractionPv = -1;
  private boutonsMenu: BoutonMenu[] = [];
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
    if (commandes.decrireHeros) attacherBulle(this.portrait, commandes.decrireHeros, { signal });
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
    this.noeudParole = el('div', 'parole');
    this.noeudParole.setAttribute('role', 'status');
    this.menu = el('div', 'menu-cercle');

    this.racine.append(hautGauche, hautDroite, basGauche, basDroite, this.invite.noeud, this.noeudMessage, this.noeudParole, this.menu);
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
    this.avancerParole(vue);
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

  /** Affiche un bandeau de quelques secondes de jeu (parole d'un boss) : rien n'est bloqué, il ne reçoit aucun toucher. */
  afficherParole(texte: string): void {
    this.noeudParole.textContent = texte;
    this.paroleRestante = DUREE_PAROLE;
    basculerClasse(this.noeudParole, 'visible', true);
  }

  /** Le bandeau compte en temps de jeu : il s'arrête en pause et passe plus vite à la vitesse ×2. */
  private avancerParole(vue: VueHud): void {
    const maintenant = performance.now();
    const ecart = this.derniereImage === 0 ? 0 : maintenant - this.derniereImage;
    this.derniereImage = maintenant;
    if (this.paroleRestante <= 0) return;
    this.paroleRestante = decompteParole(this.paroleRestante, ecart, vue.pause, vue.vitesse);
    if (this.paroleRestante <= 0) basculerClasse(this.noeudParole, 'visible', false);
  }

  /**
   * Montre le menu en cercle autour du point (cx, cy) en pixels CSS, ou le cache si `elements` est null.
   * Les boutons ne sont reconstruits que si leur contenu change (prix, grisé), et replacés que si le
   * point bouge.
   */
  placerMenu(elements: readonly ElementMenu[] | null, version: number, cx: number, cy: number, largeur: number, hauteur: number, rayon: number): void {
    if (!elements || elements.length === 0) {
      if (this.boutonsMenu.length > 0) {
        this.versionMenu = -1;
        this.boutonsMenu = [];
        this.menu.replaceChildren();
        this.commandes.survolerElement(null);
      }
      return;
    }
    const bouge = Math.abs(cx - this.menuX) > 0.5 || Math.abs(cy - this.menuY) > 0.5;
    // Le contenu n'est comparé que s'il a été recalculé (`version` change à chaque pas de simulation), pas à chaque image.
    let reconstruit = false;
    if (version !== this.versionMenu) {
      this.versionMenu = version;
      // La forme (id, icône, rang, prix, déblocage) décide : même forme, les boutons gardent leur nœud et reprennent les
      // nouveaux éléments (autre lieu, autre prix, autre icône) ; sinon on reconstruit.
      const forme = (e: ElementMenu): string => `${e.id}|${e.icone}|${String(e.rang !== null)}|${String(e.prix !== null || e.gain !== null)}|${String(e.deblocage)}`;
      const actuels = this.boutonsMenu;
      if (actuels.length === elements.length && elements.every((e, i) => forme(e) === forme(actuels[i]?.element ?? e))) {
        // Mêmes boutons : mis à jour en place (élément, prix, grisé, rang, icône, libellé), la bulle ouverte et un appui long en
        // cours restent attachés au bouton, et un clic vise le lieu courant.
        elements.forEach((e, i) => {
          const b = actuels[i];
          if (!b) return;
          this.remplirBouton(b, e);
          if (b.noeud.matches(':hover') || b.noeud === document.activeElement) this.commandes.survolerElement(e);
        });
      } else {
        this.boutonsMenu = elements.map((e) => this.boutonMenu(e));
        this.menu.replaceChildren(...this.boutonsMenu.map((b) => b.noeud));
        reconstruit = true;
        // Les boutons remplacés n'envoient pas de « pointeur parti » : on redit lequel est survolé, s'il y en a un.
        this.commandes.survolerElement(null);
        for (const b of this.boutonsMenu) {
          if (b.noeud.matches(':hover') || b.noeud === document.activeElement) this.commandes.survolerElement(b.element);
        }
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

  /** Un bouton du menu ; ses écouteurs lisent `element`, que `remplirBouton` remplace quand le menu est recalculé. */
  private boutonMenu(element: ElementMenu): BoutonMenu {
    const noeud = el('button', 'element-menu');
    noeud.type = 'button';
    noeud.append(image(this.atlas.iconeUrl(element.icone, element.icone.startsWith('tour-') ? 1 : 2), 'icone'));
    // Un élément pas encore débloqué dit où il se débloque : cadenas sur l'icône et, à la place du prix, le numéro du niveau de
    // campagne dans une pastille qui imite le nœud de la carte du monde (rond sombre cerclé de bronze). Un « Niv. N » se lisait
    // comme un niveau de tour ; le libellé lu (aria-label) dit la phrase entière.
    if (element.deblocage !== null) {
      noeud.classList.add('verrouille');
      noeud.append(image(this.atlas.iconeUrl('icone-cadenas', 1), 'cadenas'));
      const pastille = el('span', 'pastille-niveau', String(element.deblocage));
      pastille.setAttribute('aria-hidden', 'true');
      noeud.append(pastille);
    }
    const rang = element.rang !== null ? el('span', 'rang') : null;
    if (rang) noeud.append(rang);
    let prix: HTMLElement | null = null;
    if (element.deblocage === null && (element.prix !== null || element.gain !== null)) {
      const cadre = el('span', 'prix');
      prix = el('span');
      cadre.append(image(this.atlas.iconeUrl('icone-arete', 1), 'arete'), prix);
      noeud.append(cadre);
    }
    const b: BoutonMenu = { noeud, element, rang, prix };
    this.remplirBouton(b, element);
    // Souris seulement : au doigt, toucher un bouton le choisit tout de suite, il n'y a pas de survol.
    noeud.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') this.commandes.survolerElement(b.element);
    });
    noeud.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') this.commandes.survolerElement(null);
    });
    noeud.addEventListener('focus', () => { this.commandes.survolerElement(b.element); });
    noeud.addEventListener('blur', () => { this.commandes.survolerElement(null); });
    noeud.addEventListener('click', (e) => {
      e.stopPropagation();
      this.commandes.choisirElement(b.element);
    });
    const decrire = this.commandes.decrireElement;
    if (decrire) attacherBulle(noeud, () => decrire(b.element));
    return b;
  }

  /** Ce qui change d'un pas à l'autre sur un bouton : libellé, grisé, rang, prix. */
  private remplirBouton(b: BoutonMenu, element: ElementMenu): void {
    b.element = element;
    const noeud = b.noeud;
    const libelle = element.deblocage !== null ? t('menu.non_debloque', { nom: element.libelle, n: element.deblocage }) : element.libelle;
    noeud.setAttribute('aria-label', libelle);
    // Sans bulle de description, l'info-bulle du navigateur dit au moins le libellé.
    if (!this.commandes.decrireElement) noeud.title = libelle;
    noeud.setAttribute('aria-disabled', String(element.refus !== null));
    basculerClasse(noeud, 'grise', element.refus !== null);
    basculerClasse(noeud, 'trop-cher', element.refus === 'aretes_insuffisantes');
    basculerClasse(noeud, 'au-sommet', element.refus === 'competence_au_maximum');
    if (b.rang) b.rang.textContent = element.rang ?? '';
    if (b.prix) b.prix.textContent = `${element.gain !== null ? '+' : ''}${String(element.prix ?? element.gain)}`;
  }

  detruire(): void {
    window.clearTimeout(this.minuteurMessage);
    this.racine.remove();
  }
}
