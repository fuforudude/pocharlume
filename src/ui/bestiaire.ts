// L'écran « Bestiaire », ouvert depuis la carte du monde et depuis la pause : deux onglets, Ennemis (classés par région, ceux jamais
// rencontrés en silhouette et « ??? ») et Tours (chaque famille, ses niveaux et ses spécialisations, la tour divine de chaque dieu, ce que la
// campagne n'a pas encore ouvert montré verrouillé). À gauche la liste, à droite la fiche de ce qu'on a touché. Tout est lu dans les données
// par `bestiaire-logique.ts` ; l'écran ne calcule rien. Même contrat que les Options : il couvre l'écran dessous, Échap le ferme.
import { DIEUX } from '../data/dieux';
import { ENNEMIS } from '../data/ennemis';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import type { Sauvegarde } from '../save';
import { contenuDeTour, ennemisParRegion, groupesDeTours, nomDeTour, type EntreeTour, type GroupeEnnemis } from './bestiaire-logique';
import { bouton, el, image } from './dom';
import { construireChiffres, construireFicheEnnemi, construireFicheInconnue } from './fiche-ennemi';
import { REGIONS_MONDE } from './regions-monde';
import { creerSpriteAnime } from './sprite-anime';

export interface OptionsBestiaire {
  readonly atlas: AtlasRendu;
  /** Seule la sauvegarde courante est lue (rencontres, niveau le plus avancé atteint). */
  readonly session: { readonly sauvegarde: Sauvegarde };
  /** Appelée une fois, quand l'écran se ferme (bouton Fermer ou Échap). */
  readonly surFermer: () => void;
  /** Onglet ouvert au départ ; Ennemis par défaut. */
  readonly onglet?: 'ennemis' | 'tours';
}

export interface EcranBestiaire {
  readonly racine: HTMLElement;
  /** Retire l'écran sans appeler `surFermer`. */
  arreter(): void;
}

type Onglet = 'ennemis' | 'tours';

function nomDeRegion(groupe: GroupeEnnemis): string {
  if (groupe.region === 0) return t('bestiaire.region_autres');
  const region = REGIONS_MONDE.find((r) => r.numero === groupe.region);
  return t('bestiaire.region', { n: groupe.region, nom: region ? tCle(region.nom) : '' });
}

export function afficherBestiaire(parent: HTMLElement, options: OptionsBestiaire): EcranBestiaire {
  const { atlas, session } = options;
  const precedent = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const controleur = new AbortController();
  const { signal } = controleur;
  let arretee = false;
  let onglet: Onglet = options.onglet ?? 'ennemis';
  /** Ce que le détail montre : annulé à chaque nouvelle sélection (arrête l'animation du sprite précédent). */
  let controleurDetail: AbortController | null = null;

  const ecran = el('div', 'ecran bestiaire');
  ecran.setAttribute('role', 'dialog');
  ecran.setAttribute('aria-modal', 'true');
  ecran.setAttribute('aria-label', t('bestiaire.titre'));

  const arreter = (): void => {
    if (arretee) return;
    arretee = true;
    controleur.abort();
    controleurDetail?.abort();
    ecran.remove();
    precedent?.focus({ preventScroll: true });
  };
  const fermer = (): void => {
    arreter();
    options.surFermer();
  };
  // Les touches de cet écran ne remontent pas à l'écran dessous (carte, partie en pause) ; Échap le ferme, même dans un champ.
  ecran.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      fermer();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    fermer();
  }, { signal });

  const carte = el('div', 'carte');
  const entete = el('div', 'bestiaire-entete');
  const titre = el('h2', 'titre', t('bestiaire.titre'));
  const onglets = el('div', 'bestiaire-onglets');
  onglets.setAttribute('role', 'tablist');
  onglets.setAttribute('aria-label', t('bestiaire.onglets'));
  const boutonsOnglets = new Map<Onglet, HTMLButtonElement>();
  for (const id of ['ennemis', 'tours'] as const) {
    const libelle = t(id === 'ennemis' ? 'bestiaire.onglet_ennemis' : 'bestiaire.onglet_tours');
    const b = bouton('bouton onglet', libelle, () => { choisirOnglet(id); }, signal);
    b.textContent = libelle;
    b.setAttribute('role', 'tab');
    b.dataset.onglet = id;
    boutonsOnglets.set(id, b);
    onglets.append(b);
  }
  const compte = el('span', 'bestiaire-compte');
  const fermerBouton = bouton('bouton', t('bestiaire.fermer'), fermer, signal);
  fermerBouton.textContent = t('bestiaire.fermer');
  entete.append(titre, onglets, compte, fermerBouton);

  const corps = el('div', 'bestiaire-corps');
  const liste = el('nav', 'bestiaire-liste');
  const detail = el('section', 'bestiaire-detail');
  detail.setAttribute('aria-live', 'polite');
  corps.append(liste, detail);
  carte.append(entete, corps);
  ecran.append(carte);
  parent.append(ecran);

  /** Remplace le contenu du détail ; l'animation précédente s'arrête. */
  const montrer = (construire: (signalDetail: AbortSignal) => HTMLElement): void => {
    controleurDetail?.abort();
    controleurDetail = new AbortController();
    detail.replaceChildren(construire(AbortSignal.any([signal, controleurDetail.signal])));
    detail.scrollTop = 0;
  };

  const marquerActif = (tuiles: ReadonlyMap<string, HTMLElement>, id: string): void => {
    for (const [cle, tuile] of tuiles) {
      tuile.classList.toggle('actif', cle === id);
      tuile.setAttribute('aria-pressed', String(cle === id));
    }
  };

  // --- Onglet Ennemis ---

  const dessinerEnnemis = (): void => {
    const groupes = ennemisParRegion(session.sauvegarde);
    const tous = groupes.flatMap((g) => g.ennemis);
    compte.textContent = t('bestiaire.compte_ennemis', { n: tous.filter((e) => e.rencontre).length, m: tous.length });
    liste.setAttribute('aria-label', t('bestiaire.liste_ennemis'));
    const tuiles = new Map<string, HTMLElement>();
    const sections: HTMLElement[] = [];
    const choisir = (id: string, rencontre: boolean): void => {
      marquerActif(tuiles, id);
      montrer((s) => (rencontre ? construireFicheEnnemi(atlas, id, { signal: s }) : construireFicheInconnue(atlas, id, s)));
    };
    for (const groupe of groupes) {
      const section = el('section', 'bestiaire-groupe');
      section.append(el('h3', 'bestiaire-groupe-titre', nomDeRegion(groupe)));
      const grille = el('div', 'bestiaire-grille');
      for (const e of groupe.ennemis) {
        const nom = tCle(ENNEMIS[e.id as keyof typeof ENNEMIS].nom);
        const libelle = e.rencontre ? nom : t('bestiaire.inconnu_libelle');
        const b = bouton(e.rencontre ? 'bestiaire-tuile' : 'bestiaire-tuile inconnue', libelle, () => { choisir(e.id, e.rencontre); }, signal);
        b.dataset.ennemi = e.id;
        b.dataset.rencontre = String(e.rencontre);
        b.append(image(atlas.iconeUrl(e.id.replaceAll('_', '-'), 2), 'bestiaire-icone'));
        tuiles.set(e.id, b);
        grille.append(b);
      }
      section.append(grille);
      sections.push(section);
    }
    liste.replaceChildren(...sections);
    const premier = tous.find((e) => e.rencontre) ?? tous[0];
    if (premier) choisir(premier.id, premier.rencontre);
    else montrer(() => el('p', 'detail', t('bestiaire.choisir')));
  };

  // --- Onglet Tours ---

  const dessinerTours = (): void => {
    const niveauMax = session.sauvegarde.progression.niveauMax;
    const groupes = groupesDeTours(niveauMax);
    const toutes = groupes.flatMap((g) => g.tours);
    compte.textContent = t('bestiaire.compte_tours', { n: toutes.filter((x) => !x.verrouillee).length, m: toutes.length });
    liste.setAttribute('aria-label', t('bestiaire.liste_tours'));
    const tuiles = new Map<string, HTMLElement>();

    const fiche = (tour: EntreeTour, s: AbortSignal): HTMLElement => {
      const racine = el('article', tour.verrouillee ? 'fiche-tour verrouillee' : 'fiche-tour');
      racine.dataset.tour = tour.id;
      const tete = el('header', 'fiche-ennemi-tete');
      tete.append(creerSpriteAnime(atlas, tour.sprite, { echelle: 3, animation: 'repos', signal: s, silhouette: tour.verrouillee }));
      const noms = el('div', 'fiche-ennemi-noms');
      noms.append(el('h3', 'fiche-ennemi-nom', nomDeTour(tour)));
      if (tour.verrouillee) {
        noms.append(el('span', 'fiche-ennemi-boss', t('bestiaire.tour_verrouillee')), el('p', 'fiche-ennemi-lore', t('bestiaire.tour_verrou_detail', { n: tour.ouvertAuNiveau })));
        tete.append(noms);
        racine.append(tete);
        return racine;
      }
      const contenu = contenuDeTour(tour);
      if (contenu.sousTitre) noms.append(el('p', 'fiche-ennemi-lore', contenu.sousTitre));
      tete.append(noms);
      racine.append(tete);
      const corps2 = el('div', 'fiche-ennemi-corps');
      corps2.append(construireChiffres(contenu.lignes));
      if (contenu.notes.length > 0) {
        const textes = el('div', 'fiche-ennemi-textes');
        const ul = el('ul', 'fiche-ennemi-liste particularites');
        for (const n of contenu.notes) ul.append(el('li', '', n));
        textes.append(ul);
        corps2.append(textes);
      }
      racine.append(corps2);
      return racine;
    };

    const choisir = (tour: EntreeTour): void => {
      marquerActif(tuiles, tour.id);
      montrer((s) => fiche(tour, s));
    };
    const sections: HTMLElement[] = [];
    for (const groupe of groupes) {
      const section = el('section', 'bestiaire-groupe');
      section.append(el('h3', 'bestiaire-groupe-titre', groupe.famille === 'divine' ? t('bestiaire.famille_divine') : tCle(`famille.${groupe.famille}`)));
      const grille = el('div', 'bestiaire-grille');
      for (const tour of groupe.tours) {
        const nom = groupe.famille === 'divine' ? tCle(DIEUX[tour.dieu ?? 'plume'].tourDivine.nom) : nomDeTour(tour);
        const b = bouton(tour.verrouillee ? 'bestiaire-tuile verrouillee' : 'bestiaire-tuile', tour.verrouillee ? `${nom} (${t('bestiaire.tour_verrouillee')})` : nom, () => { choisir(tour); }, signal);
        b.dataset.tour = tour.id;
        b.dataset.verrouillee = String(tour.verrouillee);
        b.append(image(atlas.iconeUrl(tour.sprite, 2), 'bestiaire-icone'));
        if (tour.palier > 1 || tour.voie) b.append(el('span', 'bestiaire-palier', tour.voie ? `★${tour.voie}` : String(tour.palier)));
        if (tour.verrouillee) b.append(image(atlas.iconeUrl('icone-cadenas', 1), 'bestiaire-cadenas'));
        tuiles.set(tour.id, b);
        grille.append(b);
      }
      section.append(grille);
      sections.push(section);
    }
    liste.replaceChildren(...sections);
    const premiere = toutes[0];
    if (premiere) choisir(premiere);
  };

  function choisirOnglet(id: Onglet): void {
    onglet = id;
    for (const [cle, b] of boutonsOnglets) {
      b.classList.toggle('actif', cle === id);
      b.setAttribute('aria-selected', String(cle === id));
    }
    ecran.dataset.onglet = id;
    liste.scrollTop = 0;
    if (id === 'ennemis') dessinerEnnemis();
    else dessinerTours();
  }

  choisirOnglet(onglet);
  fermerBouton.focus({ preventScroll: true });
  return { racine: ecran, arreter };
}
