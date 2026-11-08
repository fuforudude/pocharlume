// Écran de la carte du monde : le fond et les nœuds dans un canvas (render/carte-monde.ts), la barre du haut, le choix de
// la région et la fiche d'un niveau en DOM. Toucher ou Entrée sur un nœud ouvre la fiche (nom, ambiance, mode Normal,
// Héroïque ou Fer, meilleures étoiles par difficulté, choix de la difficulté, du dieu, du héros et des objets emportés,
// « Lancer »). Échap ou Retour arrière ferme la fiche, puis quitte la carte. La barre du haut montre les monnaies (arêtes,
// braises, étoiles à dépenser) et mène aux écrans des héros, de la boutique et du recueil des inscriptions.
//
// Les régions (jalon 3) : une rangée de pastilles, de flèches et le clavier (Page haut, Page bas) passent d'une région
// ouverte à l'autre ; les régions pas encore ouvertes se voient grisées avec un cadenas et disent comment les ouvrir. Les
// défis réussis d'un niveau sont marqués par une icône à côté de son nœud.
//
// Cet écran ne lance rien lui-même : il s'arrête puis appelle `surLancer` ou `surRetour`, et c'est l'appelant
// (main.ts) qui enchaîne sur la partie ou l'accueil. La barre du haut suit la sauvegarde de la session (autre onglet,
// fermeture d'un dialogue) ; les nœuds de la carte sont lus à l'ouverture d'une région : pour voir une victoire ou un
// import, on rouvre la carte.
import { ENNEMIS } from '../data/ennemis';
import { BRAISES_DEFI, type IdDieu } from '../data/meta';
import type { NiveauCampagne } from '../data/visuel';
import type { DefiPartie } from '../engine';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { RenduCarteMonde } from '../render/carte-monde';
import { DIFFICULTES_SAUVEGARDE, etoilesDisponibles, NOMBRE_NIVEAUX, totalEtoiles, type ChoixPartie, type DifficulteSauvegarde } from '../save';
import { dessinerIconesDefis } from './carte-monde-defis';
import { ennemisDeLaFiche } from './bestiaire-logique';
import { ligneParticularite } from './particularites';
import { decouvertesDuNiveau } from './decouvertes';
import {
  directionDeTouche,
  etoilesParDifficulte,
  nombreTroncons,
  noeudInitial,
  noeudToucheA,
  noeudVoisin,
  regionInitiale,
  regionVisee,
  regionVoisine,
  vueNoeuds,
  vueRegions,
  type DeplacementRegion,
  type VueNoeud,
} from './carte-monde-logique';
import { attacherBulleEnnemi, attacherBulleTour, fermerBulle } from './bulle';
import { bossDuNiveau } from './bulle-contenus';
import { bouton, el, image } from './dom';
import { afficherConfirmation } from './ecrans';
import { creerChoixFiche, type SessionChoix } from './fiche-choix';
import { Gestes } from './gestes';
import { configDuChoix } from './lancement';
import { choixJouable, famillesDuFer, vueModes, type ModeNiveau } from './meta-vues';
import { texteRefusMeta } from './raisons-meta';
import { decalageDeRegion, REGIONS_MONDE, type RegionMonde } from './regions-monde';

export interface OptionsCarteMonde {
  readonly atlas: AtlasRendu;
  /** La session : la sauvegarde courante est lue à l'ouverture, les choix de la fiche (héros, objets) y sont mémorisés. */
  readonly session: SessionChoix;
  /** Difficulté cochée à l'ouverture d'une fiche. */
  readonly difficulte: DifficulteSauvegarde;
  /**
   * « Lancer » dans la fiche : l'écran est déjà arrêté. `defi` est le défi choisi (Héroïque, Fer), null pour une partie
   * ordinaire ; en défi, `difficulte` est celle de Matou, imposée.
   */
  surLancer: (niveau: NiveauCampagne, difficulte: DifficulteSauvegarde, choix: ChoixPartie, defi: DefiPartie | null) => void;
  /** « Options » : l'écran reste ouvert, l'appelant affiche les options par-dessus. */
  surOptions: () => void;
  /** « Héros » : l'écran reste ouvert, l'appelant affiche l'écran des héros par-dessus. */
  surHeros: () => void;
  /** « Boutique » : idem pour la boutique (arbre et objets). */
  surBoutique: () => void;
  /** « Inscriptions » : idem pour le recueil des inscriptions des statues. Absent : pas de bouton. */
  surInscriptions?: () => void;
  /** « Bestiaire » : idem pour l'écran du Bestiaire. Absent : pas de bouton. */
  surBestiaire?: () => void;
  /** « Revoir la fin » (campagne terminée) : l'écran est déjà arrêté. Absent : pas de bouton. */
  surRevoirFin?: () => void;
  /** « Retour » ou Échap sans fiche ouverte : l'écran est déjà arrêté. */
  surRetour: () => void;
  /**
   * Une partie en cours qu'on peut reprendre : lancer un niveau la remplacerait, donc « Lancer » demande d'abord
   * confirmation.
   */
  readonly partieEnCours?: { readonly niveau: number; readonly vague: number; readonly infini?: true } | null;
  /** Les régions montrées ; par défaut celles du jeu (`REGIONS_MONDE`). */
  readonly regions?: readonly RegionMonde[];
  /** Numéro de la région montrée à l'ouverture si elle est ouverte ; par défaut la plus haute région ouverte. */
  readonly region?: number;
  /** Appelée à chaque changement de région (numéro de la région), pour la retrouver à la réouverture de la carte. */
  readonly surRegion?: (numero: number) => void;
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

function nomDeMode(mode: ModeNiveau): string {
  return t(`fiche.mode_${mode}`);
}

export function afficherCarteMonde(parent: HTMLElement, options: OptionsCarteMonde): EcranCarteMonde {
  const { atlas, session } = options;
  const regions = options.regions ?? REGIONS_MONDE;
  const controleur = new AbortController();
  const { signal } = controleur;
  let arretee = false;
  let suspendue = false;
  let avertissement: HTMLElement | null = null;
  let identifiantImage = 0;
  let difficulte = options.difficulte;
  let mode: ModeNiveau = 'normal';
  let fiche: HTMLElement | null = null;
  let boutonsDifficulte: readonly HTMLButtonElement[] = [];
  let controleurFiche: AbortController | null = null;

  // La région montrée, ses nœuds d'après la sauvegarde, et son rendu (null tant que ses niveaux ne sont pas livrés).
  let indiceRegion = 0;
  let vues: readonly VueNoeud[] = [];
  let selection = -1;
  let rendu: RenduCarteMonde | null = null;

  const racine = el('div', 'carte-monde');
  const canvas = el('canvas', 'jeu');
  racine.append(canvas);
  parent.append(racine);
  const contexte = canvas.getContext('2d');
  const regionVide = el('p', 'carte-region-vide', t('carte.region_bientot'));
  regionVide.hidden = true;
  racine.append(regionVide);

  const regionCourante = (): RegionMonde | undefined => regions[indiceRegion];

  // --- Barre du haut : retour, niveau sélectionné, monnaies, accès aux écrans ---

  const barre = el('div', 'carte-barre');
  const retour = bouton('bouton', t('carte.retour'), () => {
    arreter();
    options.surRetour();
  }, signal);
  retour.textContent = t('carte.retour');
  const titre = el('div', 'carte-titre');
  const monnaies = el('div', 'carte-monnaies');
  const puceMonnaie = (sprite: string): { puce: HTMLElement; valeur: HTMLElement } => {
    const puce = el('div', 'puce monnaie');
    const valeur = el('span');
    puce.append(image(atlas.iconeUrl(sprite, 2), 'icone'), valeur);
    return { puce, valeur };
  };
  const puceAretes = puceMonnaie('icone-arete');
  const puceBraises = puceMonnaie('icone-braise');
  const puceEtoiles = puceMonnaie('icone-etoile');
  const remplirPuce = (p: { puce: HTMLElement; valeur: HTMLElement }, libelle: string, valeur: number): void => {
    p.puce.title = libelle;
    p.puce.setAttribute('aria-label', libelle);
    p.valeur.textContent = String(valeur);
  };
  /**
   * Remet la barre du haut (arêtes, braises, étoiles à dépenser et gagnées) d'après la sauvegarde d'aujourd'hui : elle
   * change quand un autre onglet écrit, ou quand un dialogue ouvert par-dessus se ferme.
   */
  const majEntete = (): void => {
    const courante = session.sauvegarde;
    const libelleTotal = t('carte.total_etoiles_libelle', { n: totalEtoiles(courante), m: NOMBRE_NIVEAUX * 3 });
    const disponibles = etoilesDisponibles(courante);
    remplirPuce(puceAretes, t('monnaie.aretes', { n: courante.meta.monnaies.aretes }), courante.meta.monnaies.aretes);
    remplirPuce(puceBraises, t('monnaie.braises', { n: courante.meta.monnaies.braises }), courante.meta.monnaies.braises);
    remplirPuce(puceEtoiles, `${t('monnaie.etoiles', { n: disponibles })} (${libelleTotal})`, disponibles);
  };
  majEntete();
  monnaies.append(puceAretes.puce, puceBraises.puce, puceEtoiles.puce);
  const retirerEcouteur = session.surChangement?.(majEntete);
  const heros = bouton('bouton', t('carte.heros'), options.surHeros, signal);
  heros.textContent = t('carte.heros');
  const boutique = bouton('bouton', t('carte.boutique'), options.surBoutique, signal);
  boutique.textContent = t('carte.boutique');
  const surInscriptions = options.surInscriptions;
  const inscriptions = surInscriptions ? bouton('bouton', t('carte.inscriptions'), surInscriptions, signal) : null;
  if (inscriptions) inscriptions.textContent = t('carte.inscriptions');
  const surBestiaire = options.surBestiaire;
  const bestiaire = surBestiaire ? bouton('bouton', t('bestiaire.bouton'), surBestiaire, signal) : null;
  if (bestiaire) {
    // Sur écran étroit la CSS ne garde que l'icône : le nom reste lu (aria-label) et affiché au survol (title).
    bestiaire.classList.add('bouton-bestiaire');
    bestiaire.setAttribute('aria-label', t('bestiaire.bouton'));
    bestiaire.title = t('bestiaire.bouton');
    bestiaire.replaceChildren(el('span', 'bouton-bestiaire-icone', '📖'), el('span', 'bouton-bestiaire-texte', t('bestiaire.bouton')));
    bestiaire.querySelector('.bouton-bestiaire-icone')?.setAttribute('aria-hidden', 'true');
  }
  const reglages = bouton('bouton', t('carte.options'), options.surOptions, signal);
  reglages.textContent = t('carte.options');
  const revoirFin = options.surRevoirFin;
  const revoir = revoirFin
    ? bouton('bouton', t('carte.revoir_fin'), () => {
        arreter();
        revoirFin();
      }, signal)
    : null;
  if (revoir) revoir.textContent = t('carte.revoir_fin');
  barre.append(retour, titre, monnaies, heros, boutique, ...(inscriptions ? [inscriptions] : []), ...(bestiaire ? [bestiaire] : []), ...(revoir ? [revoir] : []), reglages);
  // La barre et la rangée des régions s'empilent dans un même bloc : si la barre passe sur deux lignes (écran étroit, bouton en
  // plus), la rangée descend avec elle au lieu de la recouvrir.
  const haut = el('div', 'carte-haut');
  haut.append(barre);
  racine.append(haut);

  const textesDe = (numero: number): { nom: string; ambiance: string } | null => {
    const textes = regionCourante()?.contenu?.textes.find((x) => x.numero === numero);
    return textes ? { nom: tCle(textes.nom), ambiance: tCle(textes.ambiance) } : null;
  };

  const majTitre = (): void => {
    const vue = vues[selection];
    const textes = vue ? textesDe(vue.numero) : null;
    titre.textContent = vue && textes ? t('carte.niveau', { n: vue.numero, nom: textes.nom }) : '';
  };

  // --- Choix de la région : flèches, pastilles (les régions fermées sont grisées), nom ---

  const rangeeRegions = el('div', 'carte-regions');
  rangeeRegions.setAttribute('role', 'group');
  rangeeRegions.setAttribute('aria-label', t('carte.regions'));
  const flechePrecedente = bouton('bouton region-fleche', t('carte.region_precedente'), () => { aller(regionVoisine(session.sauvegarde, regions, indiceRegion, -1)); }, signal);
  flechePrecedente.textContent = '‹';
  const flecheSuivante = bouton('bouton region-fleche', t('carte.region_suivante'), () => { aller(regionVoisine(session.sauvegarde, regions, indiceRegion, 1)); }, signal);
  flecheSuivante.textContent = '›';
  const puces: HTMLButtonElement[] = regions.map((region, i) => {
    const nom = tCle(region.nom);
    const b = bouton('bouton region-puce', t('carte.region_aller', { n: region.numero, nom }), () => { aller(regionVisee(session.sauvegarde, regions, i)); }, signal);
    b.dataset.cle = `region:${String(region.numero)}`;
    b.append(el('span', 'numero', String(region.numero)));
    return b;
  });
  const nomRegion = el('div', 'region-nom');
  nomRegion.setAttribute('role', 'status');
  rangeeRegions.append(flechePrecedente, ...puces, flecheSuivante, nomRegion);
  haut.append(rangeeRegions);

  /** Texte à côté des pastilles : le nom de la région montrée, ou pourquoi une région touchée reste fermée. */
  const direRegion = (texte: string, refus: boolean): void => {
    nomRegion.textContent = texte;
    nomRegion.classList.toggle('refus', refus);
  };

  const majRegionsUI = (): void => {
    const vuesRegions = vueRegions(session.sauvegarde, regions);
    vuesRegions.forEach((vr, i) => {
      const b = puces[i];
      if (!b) return;
      const courante = i === indiceRegion;
      b.classList.toggle('actif', courante);
      b.classList.toggle('verrouillee', !vr.ouverte);
      b.classList.toggle('grise', !vr.ouverte);
      b.setAttribute('aria-current', String(courante));
      b.setAttribute('aria-disabled', String(!vr.ouverte));
      b.querySelector('img.cadenas')?.remove();
      if (!vr.ouverte) b.append(image(atlas.iconeUrl('icone-cadenas', 1), 'cadenas'));
    });
    const precedenteOuverte = indiceRegion > 0;
    const suivanteOuverte = vuesRegions[indiceRegion + 1]?.ouverte ?? false;
    flechePrecedente.classList.toggle('grise', !precedenteOuverte);
    flechePrecedente.setAttribute('aria-disabled', String(!precedenteOuverte));
    flecheSuivante.classList.toggle('grise', !suivanteOuverte);
    flecheSuivante.setAttribute('aria-disabled', String(!suivanteOuverte));
    const region = regionCourante();
    direRegion(region ? t('carte.region_nom', { n: region.numero, nom: tCle(region.nom) }) : '', false);
  };

  /** Montre la région d'indice `i` : ses nœuds d'après la sauvegarde, son fond, la sélection. */
  const chargerRegion = (i: number): void => {
    const region = regions[i];
    if (!region) return;
    indiceRegion = i;
    const contenu = region.contenu;
    vues = contenu ? vueNoeuds(session.sauvegarde, contenu.noeuds, decalageDeRegion(region)) : [];
    selection = noeudInitial(vues);
    rendu = contenu ? new RenduCarteMonde(canvas, atlas, contenu.trace, contenu.decor, nombreTroncons(vues)) : null;
    regionVide.hidden = contenu !== null;
    if (rendu) {
      // La vue montre les niveaux débloqués et le premier qui ne l'est pas encore (on devine où mène la route).
      const premierCache = vues.findIndex((v) => !v.visible);
      const aVoir = premierCache === -1 ? vues : vues.slice(0, premierCache + 1);
      rendu.cadrer(aVoir, vues[selection] ?? aVoir[0] ?? { x: 0, y: 0 });
    } else {
      contexte?.clearRect(0, 0, canvas.width, canvas.height);
    }
    majTitre();
    majRegionsUI();
  };

  /** Va là où la demande mène ; une région fermée reste fermée et dit comment l'ouvrir. */
  const aller = (deplacement: DeplacementRegion): void => {
    if (fiche || avertissement) return;
    if (deplacement.bloquee) {
      direRegion(t('carte.region_fermee', { n: deplacement.visee, m: deplacement.visee - 1 }), true);
      return;
    }
    if (deplacement.index < 0 || deplacement.index === indiceRegion) return;
    chargerRegion(deplacement.index);
    const region = regionCourante();
    if (region) options.surRegion?.(region.numero);
    const actif = puces[deplacement.index];
    if (actif && document.activeElement instanceof HTMLButtonElement && rangeeRegions.contains(document.activeElement)) actif.focus({ preventScroll: true });
  };

  // La région d'ouverture : celle qu'on demande si elle est ouverte, sinon la plus haute région ouverte.
  const demandee = options.region === undefined ? -1 : regions.findIndex((r) => r.numero === options.region);
  const depart = demandee >= 0 && !regionVisee(session.sauvegarde, regions, demandee).bloquee ? demandee : regionInitiale(session.sauvegarde, regions);
  chargerRegion(depart);

  /** Change le nœud sélectionné ; la vue le suit s'il sort de l'écran. */
  const selectionner = (i: number): void => {
    const vue = vues[i];
    if (!vue?.visible || !rendu) return;
    selection = i;
    majTitre();
    const cam = rendu.camera;
    const marge = 28;
    if (vue.x - cam.decalageX < marge || vue.x - cam.decalageX > cam.vueL - marge || vue.y - cam.decalageY < marge + 20 || vue.y - cam.decalageY > cam.vueH - marge) {
      rendu.centrerSur(vue.x, vue.y);
    }
  };

  // --- Fiche d'un niveau ---

  const fermerFiche = (): void => {
    fermerBulle();
    controleurFiche?.abort();
    controleurFiche = null;
    fiche?.remove();
    fiche = null;
    boutonsDifficulte = [];
    majEntete();
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

  /**
   * L'encadré « Nouvelles découvertes » d'un niveau, ou null s'il n'apporte rien. Chaque élément porte la classe `decouverte` et
   * ses data-attributs (`data-tour`, `data-palier`, `data-voie`, `data-niveau`) pour qu'on puisse y brancher une description.
   */
  const encadreDecouvertes = (numero: number, dieu: IdDieu, signalFiche: AbortSignal): HTMLElement | null => {
    const liste = decouvertesDuNiveau(numero, dieu);
    if (liste.length === 0) return null;
    const encadre = el('section', 'decouvertes');
    encadre.dataset.niveau = String(numero);
    encadre.setAttribute('aria-label', t('fiche.decouvertes'));
    encadre.append(el('h3', 'decouvertes-titre', t('fiche.decouvertes')));
    const ul = el('ul', 'decouvertes-liste');
    for (const d of liste) {
      const li = el('li', 'decouverte');
      li.dataset.decouverte = d.id;
      li.dataset.tour = d.famille;
      li.dataset.palier = String(d.palier);
      if (d.voie) li.dataset.voie = d.voie;
      li.dataset.niveau = String(numero);
      // Sur un écran bas, seules les icônes restent visibles : le libellé lu garde le nom et l'apport.
      li.setAttribute('aria-label', t('decouverte.libelle', { nom: d.nom, apport: d.apport }));
      const texte = el('div', 'decouverte-texte');
      texte.append(el('strong', 'decouverte-nom', d.nom), el('span', 'decouverte-apport', d.apport));
      li.append(image(atlas.iconeUrl(d.icone, 1), 'decouverte-icone'), texte);
      // La même bulle que dans le menu de construction : chiffres et pouvoir de ce qu'on vient de débloquer.
      attacherBulleTour(li, d.famille, d.famille === 'divine' ? { dieu } : { niveau: d.palier, ...(d.voie ? { voie: d.voie } : {}) }, { signal: signalFiche });
      ul.append(li);
    }
    encadre.append(ul);
    return encadre;
  };

  /**
   * La rangée des ennemis d'un niveau (icônes tirées de ses vagues figées), ou null s'il n'en a pas. Un ennemi jamais rencontré est signalé
   * « nouveau » ; chaque icône a sa bulle (les PV de la difficulté cochée, comme le boss).
   */
  const rangeeEnnemis = (niveau: NiveauCampagne, signalFiche: AbortSignal): HTMLElement | null => {
    const ennemis = ennemisDeLaFiche(niveau.niveau, session.sauvegarde);
    if (ennemis.length === 0) return null;
    const encadre = el('section', 'ennemis-niveau');
    encadre.dataset.niveau = String(niveau.numero);
    encadre.setAttribute('aria-label', t('bestiaire.niveau_titre'));
    encadre.append(el('h3', 'ennemis-niveau-titre', t('bestiaire.niveau_titre')));
    const ul = el('ul', 'ennemis-niveau-liste');
    for (const e of ennemis) {
      const li = el('li', e.nouveau ? 'ennemi-niveau nouveau' : 'ennemi-niveau');
      li.dataset.ennemi = e.id;
      const nom = tCle(ENNEMIS[e.id as keyof typeof ENNEMIS].nom);
      li.setAttribute('aria-label', e.nouveau ? t('bestiaire.niveau_libelle_nouveau', { nom }) : nom);
      li.append(image(atlas.iconeUrl(e.id.replaceAll('_', '-'), 2), 'ennemi-niveau-icone'));
      if (e.nouveau) {
        // Pastille dorée dans le coin de l'icône (un mot entier se chevauchait entre icônes serrées) ; le mot reste dans l'aria-label du li.
        const marque = el('span', 'ennemi-niveau-nouveau', '★');
        marque.setAttribute('aria-hidden', 'true');
        li.append(marque);
      }
      attacherBulleEnnemi(li, e.id, { signal: signalFiche, difficulte: () => (mode === 'normal' ? difficulte : 'matou') });
      ul.append(li);
    }
    encadre.append(ul);
    return encadre;
  };

  const ouvrirFiche = (i: number): void => {
    const vue = vues[i];
    const niveau = vue ? regionCourante()?.contenu?.niveaux.find((n) => n.numero === vue.numero) : undefined;
    const textes = vue ? textesDe(vue.numero) : null;
    if (!vue?.visible || !niveau || !textes) return;
    fermerFiche();
    selectionner(i);
    mode = 'normal';

    const ecran = el('div', 'ecran fiche');
    ecran.setAttribute('role', 'dialog');
    ecran.setAttribute('aria-modal', 'true');
    ecran.setAttribute('aria-label', textes.nom);
    ecran.addEventListener('click', (e) => {
      if (e.target === ecran) fermerFiche();
    }, { signal });

    const carte = el('div', 'carte');
    // Deux colonnes en paysage : le niveau, son mode et sa difficulté à gauche, le dieu, le héros et les objets à droite.
    const colonnes = el('div', 'fiche-colonnes');
    const gauche = el('div', 'fiche-colonne');
    const droite = el('div', 'fiche-colonne');
    const entete = el('div', 'fiche-entete');
    entete.append(el('span', 'fiche-numero', t('accueil.niveau', { n: vue.numero })));
    controleurFiche = new AbortController();
    const signalFiche = AbortSignal.any([signal, controleurFiche.signal]);
    if (vue.boss) {
      // Le boss annoncé se décrit au survol ou à l'appui long, avec les PV de la difficulté cochée (Matou en défi).
      const etiquette = el('span', 'etiquette-boss', t('fiche.boss'));
      const boss = bossDuNiveau(niveau.niveau);
      if (boss) attacherBulleEnnemi(etiquette, boss, { signal: signalFiche, difficulte: () => (mode === 'normal' ? difficulte : 'matou') });
      entete.append(etiquette);
    }
    if (niveau.horde) entete.append(el('span', 'etiquette-horde', t('fiche.horde')));
    gauche.append(entete, el('h2', 'titre', textes.nom), el('p', 'ambiance', textes.ambiance));
    if (niveau.horde) gauche.append(el('p', 'horde-aide', t('fiche.horde_aide')));
    // La particularité du niveau (régions 11 à 15), tirée de son gimmick : une ligne, rien pour un niveau ordinaire.
    const particularite = ligneParticularite(niveau.niveau);
    if (particularite) {
      const ligne = el('p', 'fiche-particularite-ligne', particularite);
      if (niveau.niveau.gimmick) ligne.dataset.particularite = niveau.niveau.gimmick.type;
      gauche.append(ligne);
    }
    const ennemisNiveau = rangeeEnnemis(niveau, signalFiche);
    const choisir = creerChoixFiche(atlas, session, signalFiche);
    droite.append(choisir.racine);

    const message = el('p', 'fiche-message');
    message.setAttribute('role', 'status');

    // Mode : Normal, Héroïque ou Fer. Un défi s'ouvre avec les trois étoiles ; fermé, il dit ce qui manque.
    const vuesModes = vueModes(session.sauvegarde, niveau);
    const groupeModes = el('div', 'modes');
    groupeModes.setAttribute('role', 'radiogroup');
    groupeModes.setAttribute('aria-label', t('fiche.mode'));
    const boutonsModes = new Map<ModeNiveau, HTMLButtonElement>();
    // La difficulté (Normal) et les règles du défi (Héroïque, Fer) se partagent la même place.
    const groupe = el('div', 'difficultes');
    groupe.setAttribute('role', 'radiogroup');
    groupe.setAttribute('aria-label', t('fiche.difficulte'));
    const regles = el('div', 'defi-regles');
    regles.hidden = true;

    const remplirRegles = (defi: DefiPartie): void => {
      const vm = vuesModes.find((v) => v.mode === defi);
      const lignes = [t(defi === 'fer' ? 'fiche.defi_fer' : 'fiche.defi_heroique'), t('fiche.defi_regles')];
      const familles = famillesDuFer(niveau);
      if (defi === 'fer' && familles) lignes.push(t('fiche.defi_familles', { noms: familles.map((f) => tCle(`famille.${f}`)).join(', ') }));
      lignes.push(vm?.reussi === true ? t('fiche.defi_deja') : t('fiche.defi_prime', { n: BRAISES_DEFI }));
      regles.replaceChildren(...lignes.map((ligne, k) => el('p', k === lignes.length - 1 ? 'defi-prime' : '', ligne)));
    };

    const choisirMode = (m: ModeNiveau): void => {
      mode = m;
      for (const [id, b] of boutonsModes) {
        b.classList.toggle('actif', id === m);
        b.setAttribute('aria-checked', String(id === m));
      }
      const enDefi = m !== 'normal';
      groupe.hidden = enDefi;
      regles.hidden = !enDefi;
      if (m !== 'normal') remplirRegles(m);
      choisir.definirDefi(enDefi);
      message.textContent = '';
    };

    for (const vm of vuesModes) {
      const nom = nomDeMode(vm.mode);
      const libelle = vm.reussi ? t('fiche.mode_reussi', { mode: nom }) : nom;
      const b = bouton('bouton mode', libelle, () => {
        if (!vm.ouvert) {
          message.textContent = t(vm.manque === 'pas_de_fer' ? 'fiche.mode_pas_de_fer' : 'fiche.mode_trois_etoiles');
          return;
        }
        choisirMode(vm.mode);
      }, signalFiche);
      b.setAttribute('role', 'radio');
      b.dataset.cle = `mode:${vm.mode}`;
      b.classList.toggle('grise', !vm.ouvert);
      b.classList.toggle('reussi', vm.reussi);
      b.setAttribute('aria-disabled', String(!vm.ouvert));
      if (vm.mode !== 'normal') b.append(image(atlas.iconeUrl(vm.ouvert ? `icone-defi-${vm.mode}` : 'icone-cadenas', 1), 'icone-mode'));
      b.append(el('span', 'nom-mode', nom));
      if (vm.reussi) b.append(el('span', 'coche', '✓'));
      boutonsModes.set(vm.mode, b);
      groupeModes.append(b);
    }
    gauche.append(groupeModes);

    const boutons: HTMLButtonElement[] = [];
    for (const { difficulte: id, etoiles } of etoilesParDifficulte(session.sauvegarde, vue.numero)) {
      const b = bouton('bouton difficulte', t('fiche.etoiles', { n: etoiles, difficulte: nomDeDifficulte(id) }), () => { choisirDifficulte(id); }, signal);
      b.setAttribute('role', 'radio');
      const rangee = el('span', 'etoiles petites');
      for (let k = 1; k <= 3; k++) rangee.append(image(atlas.iconeUrl('icone-etoile', 2), k <= etoiles ? 'etoile' : 'etoile eteinte'));
      b.append(el('span', 'nom-difficulte', nomDeDifficulte(id)), rangee);
      boutons.push(b);
      groupe.append(b);
    }
    boutonsDifficulte = boutons;
    gauche.append(groupe, regles);

    // Ce que ce niveau débloque (déblocage progressif), juste avant « Lancer » ; rien s'il n'apporte rien de neuf. La tour
    // divine est celle du dieu choisi : l'encadré se refait quand le joueur en change.
    let decouvertes = encadreDecouvertes(vue.numero, choisir.choix().dieu, signalFiche);
    // Les ennemis du niveau et les découvertes se partagent une rangée (sur un écran bas, titre des ennemis masqué : icônes seules), pour que
    // « Lancer » reste visible sans défiler.
    const infos = el('div', 'fiche-infos');
    if (ennemisNiveau) infos.append(ennemisNiveau);
    if (decouvertes) infos.append(decouvertes);
    if (infos.childElementCount > 0) gauche.append(infos);
    choisir.surDieu((dieu) => {
      const nouveau = encadreDecouvertes(vue.numero, dieu, signalFiche);
      if (!decouvertes || !nouveau) return;
      decouvertes.replaceWith(nouveau);
      decouvertes = nouveau;
    });

    const actions = el('div', 'rangee');
    const lancer = bouton('bouton grand', t('fiche.lancer'), () => {
      const defi: DefiPartie | null = mode === 'normal' ? null : mode;
      // Un défi se joue en Matou (la difficulté choisie est ignorée) ; sinon celle qui est cochée.
      const choisie: DifficulteSauvegarde = defi === null ? difficulte : 'matou';
      // Un choix qui ne tient plus (objet épuisé dans un autre onglet…) est refusé ici, avant de quitter la carte.
      const choix = choixJouable(session.sauvegarde, choisir.choix());
      const compose = configDuChoix(session.sauvegarde, choix, choisie, 0, defi === null ? undefined : { niveau: niveau.numero, defi });
      if (!compose.ok) {
        message.textContent = t('fiche.lancement_refuse', { raison: texteRefusMeta(compose.raison) });
        return;
      }
      const lancerVraiment = (): void => {
        arreter();
        options.surLancer(niveau, choisie, choix, defi);
      };
      const enCours = options.partieEnCours;
      if (!enCours) {
        lancerVraiment();
        return;
      }
      avertissement?.remove();
      avertissement = afficherConfirmation(racine, {
        titre: t('lancer.perte_titre'),
        detail: t(enCours.infini ? 'lancer.perte_detail_infini' : 'lancer.perte_detail', { n: enCours.niveau, m: enCours.vague }),
        confirmer: t('lancer.confirmer'),
        annuler: t('lancer.annuler'),
        surConfirmer: () => {
          avertissement = null;
          lancerVraiment();
        },
        surAnnuler: () => {
          avertissement = null;
          majEntete();
          lancer.focus({ preventScroll: true });
        },
      });
    }, signal);
    lancer.textContent = t('fiche.lancer');
    const fermer = bouton('bouton grand secondaire', t('fiche.fermer'), fermerFiche, signal);
    fermer.textContent = t('fiche.fermer');
    actions.append(lancer, fermer);
    gauche.append(actions, message);
    colonnes.append(gauche, droite);
    carte.append(colonnes);
    ecran.append(carte);
    racine.append(ecran);
    fiche = ecran;
    choisirDifficulte(difficulte);
    choisirMode('normal');
    lancer.focus({ preventScroll: true });
  };

  // --- Entrées : toucher un nœud, glisser et pincer la carte, clavier ---

  const gestes = new Gestes({
    toucher: (x, y) => {
      if (fiche || !rendu) return;
      const touche = noeudToucheA(vues, rendu.enMondeX(x), rendu.enMondeY(y), rendu.rayonToucher);
      if (touche !== -1) ouvrirFiche(touche);
    },
    glisser: (dx, dy) => { rendu?.camera.deplacer(dx * rendu.ratio, dy * rendu.ratio); },
    debutPincement: () => { rendu?.camera.debutPincement(); },
    pincer: (facteur, x, y) => { rendu?.camera.pincement(facteur, x * rendu.ratio, y * rendu.ratio); },
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
    if (!rendu) return;
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
      if ((direction === 'gauche' || direction === 'droite') && mode === 'normal') {
        e.preventDefault();
        const k = DIFFICULTES_SAUVEGARDE.indexOf(difficulte) + (direction === 'droite' ? 1 : -1);
        const suivante = DIFFICULTES_SAUVEGARDE[k];
        if (suivante) choisirDifficulte(suivante);
      }
      return;
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      aller(regionVoisine(session.sauvegarde, regions, indiceRegion, e.key === 'PageUp' ? -1 : 1));
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
  window.addEventListener('resize', () => { rendu?.redimensionner(); }, { signal });
  window.addEventListener('orientationchange', () => { rendu?.redimensionner(); }, { signal });

  // --- Boucle : le clignotement du prochain niveau et le chevron de sélection bougent à chaque image ---

  const boucle = (maintenant: number): void => {
    if (arretee || suspendue) return;
    identifiantImage = requestAnimationFrame(boucle);
    if (!rendu) return;
    rendu.dessiner(vues, selection, maintenant);
    // Les défis réussis, marqués par-dessus les nœuds.
    if (contexte) dessinerIconesDefis(contexte, atlas, rendu.camera, vues);
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
    fermerBulle();
    retirerEcouteur?.();
    racine.remove();
  }

  return { racine, arreter, suspendre };
}
