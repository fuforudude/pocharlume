// Écran de la carte du monde : le fond et les nœuds dans un canvas (render/carte-monde.ts), la barre du haut et
// la fiche d'un niveau en DOM. Toucher ou Entrée sur un nœud ouvre la fiche (nom, ambiance, meilleures étoiles par
// difficulté, choix de la difficulté, dieu, « Lancer »). Échap ou Retour arrière ferme la fiche, puis quitte la carte.
//
// Cet écran ne lance rien lui-même : il s'arrête puis appelle `surLancer` ou `surRetour`, et c'est l'appelant
// (main.ts) qui enchaîne sur la partie ou l'accueil. La sauvegarde est lue une fois à l'ouverture : pour la voir
// changer (victoire, import), on rouvre la carte.
import { DIEUX } from '../data/dieux';
import { NOEUDS_REGION1, TRACE_REGION1 } from '../data/niveaux/carte-du-monde';
import { REGION1, TEXTES_REGION1 } from '../data/niveaux/region1';
import type { NiveauCampagne } from '../data/visuel';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { RenduCarteMonde } from '../render/carte-monde';
import { DECOR_MONDE_REGION1 } from '../render/carte-monde-decor';
import { DIFFICULTES_SAUVEGARDE, NOMBRE_NIVEAUX, totalEtoiles, type DifficulteSauvegarde, type Sauvegarde } from '../save';
import {
  directionDeTouche,
  etoilesParDifficulte,
  nombreTroncons,
  noeudInitial,
  noeudToucheA,
  noeudVoisin,
  vueNoeuds,
  type VueNoeud,
} from './carte-monde-logique';
import { bouton, el, image } from './dom';
import { afficherConfirmation } from './ecrans';
import { Gestes } from './gestes';

export interface OptionsCarteMonde {
  readonly atlas: AtlasRendu;
  readonly sauvegarde: Sauvegarde;
  /** Difficulté cochée à l'ouverture d'une fiche. */
  readonly difficulte: DifficulteSauvegarde;
  /** « Lancer » dans la fiche : l'écran est déjà arrêté. */
  surLancer: (niveau: NiveauCampagne, difficulte: DifficulteSauvegarde) => void;
  /** « Options » : l'écran reste ouvert, l'appelant affiche les options par-dessus. */
  surOptions: () => void;
  /** « Retour » ou Échap sans fiche ouverte : l'écran est déjà arrêté. */
  surRetour: () => void;
  /**
   * Une partie en cours qu'on peut reprendre : lancer un niveau la remplacerait, donc « Lancer » demande d'abord
   * confirmation.
   */
  readonly partieEnCours?: { readonly niveau: number; readonly vague: number } | null;
}

export interface EcranCarteMonde {
  readonly racine: HTMLElement;
  /**
   * Met l'écran en sommeil (options ouvertes par-dessus) : plus de clavier, plus de dessin. `false` le réveille.
   */
  suspendre(suspendue: boolean): void;
  /** Retire tout ce que l'écran a installé (boucle, écouteurs, DOM). */
  arreter(): void;
}

const LIGNE_PIXELS = 40;
const PAGE_PIXELS = 400;

function nomDeDifficulte(d: DifficulteSauvegarde): string {
  return t(`difficulte.${d}`);
}

export function afficherCarteMonde(parent: HTMLElement, options: OptionsCarteMonde): EcranCarteMonde {
  const { atlas, sauvegarde } = options;
  const vues: readonly VueNoeud[] = vueNoeuds(sauvegarde, NOEUDS_REGION1);
  const controleur = new AbortController();
  const { signal } = controleur;
  let arretee = false;
  let suspendue = false;
  let avertissement: HTMLElement | null = null;
  let identifiantImage = 0;
  let selection = noeudInitial(vues);
  let difficulte = options.difficulte;
  let fiche: HTMLElement | null = null;
  let boutonsDifficulte: readonly HTMLButtonElement[] = [];

  const racine = el('div', 'carte-monde');
  const canvas = el('canvas', 'jeu');
  racine.append(canvas);
  parent.append(racine);
  const rendu = new RenduCarteMonde(canvas, atlas, TRACE_REGION1, DECOR_MONDE_REGION1, nombreTroncons(vues));
  // La vue montre les niveaux débloqués et le premier qui ne l'est pas encore (on devine où mène la route).
  const premierCache = vues.findIndex((v) => !v.visible);
  const aVoir = premierCache === -1 ? vues : vues.slice(0, premierCache + 1);
  rendu.cadrer(aVoir, vues[selection] ?? aVoir[0] ?? { x: 0, y: 0 });

  // --- Barre du haut : retour, niveau sélectionné, total d'étoiles, options ---

  const barre = el('div', 'carte-barre');
  const retour = bouton('bouton', t('carte.retour'), () => {
    arreter();
    options.surRetour();
  }, signal);
  retour.textContent = t('carte.retour');
  const titre = el('div', 'carte-titre');
  const total = el('div', 'puce total');
  const libelleTotal = t('carte.total_etoiles_libelle', { n: totalEtoiles(sauvegarde), m: NOMBRE_NIVEAUX * 3 });
  total.title = libelleTotal;
  total.setAttribute('aria-label', libelleTotal);
  total.append(
    image(atlas.iconeUrl('icone-etoile', 2), 'icone'),
    el('span', '', t('carte.total_etoiles', { n: totalEtoiles(sauvegarde), m: NOMBRE_NIVEAUX * 3 })),
  );
  const reglages = bouton('bouton', t('carte.options'), options.surOptions, signal);
  reglages.textContent = t('carte.options');
  barre.append(retour, titre, total, reglages);
  racine.append(barre);

  const textesDe = (numero: number): { nom: string; ambiance: string } | null => {
    const textes = TEXTES_REGION1.find((x) => x.numero === numero);
    return textes ? { nom: tCle(textes.nom), ambiance: tCle(textes.ambiance) } : null;
  };

  const majTitre = (): void => {
    const vue = vues[selection];
    const textes = vue ? textesDe(vue.numero) : null;
    titre.textContent = vue && textes ? t('carte.niveau', { n: vue.numero, nom: textes.nom }) : '';
  };

  /** Change le nœud sélectionné ; la vue le suit s'il sort de l'écran. */
  const selectionner = (i: number): void => {
    const vue = vues[i];
    if (!vue?.visible) return;
    selection = i;
    majTitre();
    const cam = rendu.camera;
    const marge = 28;
    if (vue.x - cam.decalageX < marge || vue.x - cam.decalageX > cam.vueL - marge || vue.y - cam.decalageY < marge + 20 || vue.y - cam.decalageY > cam.vueH - marge) {
      rendu.centrerSur(vue.x, vue.y);
    }
  };
  majTitre();

  // --- Fiche d'un niveau ---

  const fermerFiche = (): void => {
    fiche?.remove();
    fiche = null;
    boutonsDifficulte = [];
  };

  const choisirDifficulte = (d: DifficulteSauvegarde): void => {
    difficulte = d;
    DIFFICULTES_SAUVEGARDE.forEach((id, k) => {
      const b = boutonsDifficulte[k];
      if (!b) return;
      b.classList.toggle('actif', id === d);
      b.setAttribute('aria-checked', String(id === d));
    });
  };

  const ouvrirFiche = (i: number): void => {
    const vue = vues[i];
    const niveau = vue ? REGION1.find((n) => n.numero === vue.numero) : undefined;
    const textes = vue ? textesDe(vue.numero) : null;
    if (!vue?.visible || !niveau || !textes) return;
    fermerFiche();
    selectionner(i);

    const ecran = el('div', 'ecran fiche');
    ecran.setAttribute('role', 'dialog');
    ecran.setAttribute('aria-modal', 'true');
    ecran.setAttribute('aria-label', textes.nom);
    ecran.addEventListener('click', (e) => {
      if (e.target === ecran) fermerFiche();
    }, { signal });

    const carte = el('div', 'carte');
    const entete = el('div', 'fiche-entete');
    entete.append(el('span', 'fiche-numero', t('accueil.niveau', { n: vue.numero })));
    if (vue.boss) entete.append(el('span', 'etiquette-boss', t('fiche.boss')));
    carte.append(entete, el('h2', 'titre', textes.nom), el('p', 'ambiance', textes.ambiance));
    carte.append(el('p', 'detail', t('fiche.dieu', { nom: tCle(DIEUX.charlie.nom) })));

    const groupe = el('div', 'difficultes');
    groupe.setAttribute('role', 'radiogroup');
    groupe.setAttribute('aria-label', t('fiche.difficulte'));
    const boutons: HTMLButtonElement[] = [];
    for (const { difficulte: id, etoiles } of etoilesParDifficulte(sauvegarde, vue.numero)) {
      const b = bouton('bouton difficulte', t('fiche.etoiles', { n: etoiles, difficulte: nomDeDifficulte(id) }), () => { choisirDifficulte(id); }, signal);
      b.setAttribute('role', 'radio');
      const rangee = el('span', 'etoiles petites');
      for (let k = 1; k <= 3; k++) rangee.append(image(atlas.iconeUrl('icone-etoile', 2), k <= etoiles ? 'etoile' : 'etoile eteinte'));
      b.append(el('span', 'nom-difficulte', nomDeDifficulte(id)), rangee);
      boutons.push(b);
      groupe.append(b);
    }
    boutonsDifficulte = boutons;
    carte.append(groupe);

    const actions = el('div', 'rangee');
    const lancer = bouton('bouton grand', t('fiche.lancer'), () => {
      const choisie = difficulte;
      const lancerVraiment = (): void => {
        arreter();
        options.surLancer(niveau, choisie);
      };
      const enCours = options.partieEnCours;
      if (!enCours) {
        lancerVraiment();
        return;
      }
      avertissement?.remove();
      avertissement = afficherConfirmation(racine, {
        titre: t('lancer.perte_titre'),
        detail: t('lancer.perte_detail', { n: enCours.niveau, m: enCours.vague }),
        confirmer: t('lancer.confirmer'),
        annuler: t('lancer.annuler'),
        surConfirmer: () => {
          avertissement = null;
          lancerVraiment();
        },
        surAnnuler: () => {
          avertissement = null;
          lancer.focus({ preventScroll: true });
        },
      });
    }, signal);
    lancer.textContent = t('fiche.lancer');
    const fermer = bouton('bouton grand secondaire', t('fiche.fermer'), fermerFiche, signal);
    fermer.textContent = t('fiche.fermer');
    actions.append(lancer, fermer);
    carte.append(actions);
    ecran.append(carte);
    racine.append(ecran);
    fiche = ecran;
    choisirDifficulte(difficulte);
    lancer.focus({ preventScroll: true });
  };

  // --- Entrées : toucher un nœud, glisser et pincer la carte, clavier ---

  const gestes = new Gestes({
    toucher: (x, y) => {
      if (fiche) return;
      const touche = noeudToucheA(vues, rendu.enMondeX(x), rendu.enMondeY(y), rendu.rayonToucher);
      if (touche !== -1) ouvrirFiche(touche);
    },
    glisser: (dx, dy) => { rendu.camera.deplacer(dx * rendu.ratio, dy * rendu.ratio); },
    debutPincement: () => { rendu.camera.debutPincement(); },
    pincer: (facteur, x, y) => { rendu.camera.pincement(facteur, x * rendu.ratio, y * rendu.ratio); },
    survol: () => undefined,
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    gestes.appuyer(e.pointerId, e.clientX, e.clientY);
  }, { signal });
  canvas.addEventListener('pointermove', (e) => { gestes.bouger(e.pointerId, e.clientX, e.clientY); }, { signal });
  canvas.addEventListener('pointerup', (e) => { gestes.relacher(e.pointerId, e.clientX, e.clientY); }, { signal });
  canvas.addEventListener('pointercancel', (e) => { gestes.annuler(e.pointerId); }, { signal });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const facteur = e.deltaMode === 1 ? LIGNE_PIXELS : e.deltaMode === 2 ? PAGE_PIXELS : 1;
    rendu.camera.molette(e.deltaY * facteur, e.clientX * rendu.ratio, e.clientY * rendu.ratio);
  }, { signal, passive: false });

  window.addEventListener('keydown', (e) => {
    if (suspendue || e.ctrlKey || e.altKey || e.metaKey) return;
    if (avertissement) {
      // L'avertissement est modal : Échap le ferme, les autres touches vont à ses boutons.
      if (e.key === 'Escape') {
        e.preventDefault();
        avertissement.remove();
        avertissement = null;
      }
      return;
    }
    // Un bouton qui a le focus garde Entrée et Espace.
    if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLButtonElement) return;
    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      if (fiche) {
        fermerFiche();
      } else {
        arreter();
        options.surRetour();
      }
      return;
    }
    if (fiche) {
      const direction = directionDeTouche(e.key);
      if (direction === 'gauche' || direction === 'droite') {
        e.preventDefault();
        const k = DIFFICULTES_SAUVEGARDE.indexOf(difficulte) + (direction === 'droite' ? 1 : -1);
        const suivante = DIFFICULTES_SAUVEGARDE[k];
        if (suivante) choisirDifficulte(suivante);
      }
      return;
    }
    const direction = directionDeTouche(e.key);
    if (direction) {
      e.preventDefault();
      selectionner(noeudVoisin(vues, selection, direction));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      ouvrirFiche(selection);
    }
  }, { signal });
  window.addEventListener('resize', () => { rendu.redimensionner(); }, { signal });
  window.addEventListener('orientationchange', () => { rendu.redimensionner(); }, { signal });

  // --- Boucle : le clignotement du prochain niveau et le chevron de sélection bougent à chaque image ---

  const boucle = (maintenant: number): void => {
    if (arretee || suspendue) return;
    identifiantImage = requestAnimationFrame(boucle);
    rendu.dessiner(vues, selection, maintenant);
  };
  identifiantImage = requestAnimationFrame(boucle);

  const suspendre = (veutSuspendre: boolean): void => {
    if (arretee || veutSuspendre === suspendue) return;
    suspendue = veutSuspendre;
    if (veutSuspendre) cancelAnimationFrame(identifiantImage);
    else identifiantImage = requestAnimationFrame(boucle);
  };

  function arreter(): void {
    if (arretee) return;
    arretee = true;
    cancelAnimationFrame(identifiantImage);
    controleur.abort();
    racine.remove();
  }

  return { racine, arreter, suspendre };
}
