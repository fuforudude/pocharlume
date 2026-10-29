// Écran du mode infini (depuis l'accueil, ouvert par la victoire sur le boss de la région 1) : trois colonnes en paysage.
// À gauche les cartes qu'on peut jouer, chacune avec son record ; au milieu les six paliers, ce qu'ils rapportent et s'ils
// sont déjà payés ; à droite le dieu, le héros et les objets emportés, comme sur la fiche d'un niveau. « Lancer » démarre une
// partie sur la carte choisie. Aucune règle ici : tout vient de infini-vues.ts et de la sauvegarde.
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import type { ChoixPartie } from '../save';
import { bouton, el } from './dom';
import { creerEcranMeta, type EcranMeta } from './ecran-meta';
import { creerChoixFiche, type SessionChoix } from './fiche-choix';
import { vueCartesInfini, vuePaliers, type VueCarteInfini } from './infini-vues';
import { configInfini } from './lancement';
import { choixJouable } from './meta-vues';
import { texteRefusMeta } from './raisons-meta';
import { REGIONS_MONDE } from './regions-monde';

export interface OptionsEcranInfini {
  readonly atlas: AtlasRendu;
  readonly session: SessionChoix;
  /** Carte cochée à l'ouverture si elle est jouable (la dernière jouée) ; par défaut la première. */
  readonly carte?: string;
  /** « Lancer » : l'écran est déjà retiré. */
  readonly surLancer: (carte: VueCarteInfini, choix: ChoixPartie) => void;
  /** « Retour » ou Échap : l'écran est déjà retiré. */
  readonly surRetour: () => void;
}

export function afficherEcranInfini(parent: HTMLElement, options: OptionsEcranInfini): EcranMeta {
  const { atlas, session } = options;
  const controleur = new AbortController();
  const { signal } = controleur;
  const ecran = creerEcranMeta(parent, {
    classe: 'infini',
    titre: t('infini.titre'),
    fermer: t('infini.retour'),
    atlas,
    sauvegarde: session.sauvegarde,
    monnaies: ['aretes', 'braises'],
    surFermer: () => {
      controleur.abort();
      options.surRetour();
    },
  });
  const cartes = vueCartesInfini(session.sauvegarde);
  const depart = cartes.findIndex((c) => c.id === options.carte);
  let choisie = depart >= 0 ? depart : 0;

  // --- Colonne des cartes ---
  const colonneCartes = el('section', 'infini-colonne infini-cartes');
  colonneCartes.append(el('h3', 'choix-titre', t('infini.cartes')));
  const liste = el('div', 'infini-liste');
  liste.setAttribute('role', 'radiogroup');
  liste.setAttribute('aria-label', t('infini.cartes'));
  const boutonsCartes = cartes.map((carte, i) => {
    const region = tCle(REGIONS_MONDE[carte.region - 1]?.nom ?? 'region.1');
    const record = carte.record > 0 ? t('infini.record', { n: carte.record }) : t('infini.sans_record');
    const b = bouton('bouton infini-carte', t('infini.carte_aller', { nom: carte.nom, region, record }), () => { cocher(i); }, signal);
    b.setAttribute('role', 'radio');
    b.dataset.cle = `carte:${carte.id}`;
    b.append(el('span', 'infini-carte-nom', carte.nom), el('span', 'infini-carte-region', region), el('span', 'infini-carte-record', record));
    liste.append(b);
    return b;
  });
  if (cartes.length === 0) liste.append(el('p', 'choix-legende', t('infini.cartes_aucune')));
  colonneCartes.append(liste);

  const cocher = (i: number): void => {
    if (i < 0 || i >= cartes.length) return;
    choisie = i;
    boutonsCartes.forEach((b, k) => {
      b.classList.toggle('actif', k === i);
      b.setAttribute('aria-checked', String(k === i));
    });
  };

  // --- Colonne des paliers ---
  const colonnePaliers = el('section', 'infini-colonne infini-paliers');
  colonnePaliers.append(el('h3', 'choix-titre', t('infini.paliers')));
  const listePaliers = el('ul', 'infini-liste-paliers');
  for (const p of vuePaliers(session.sauvegarde)) {
    const ligne = el('li', p.paye ? 'palier paye' : 'palier');
    ligne.append(
      el('span', 'palier-vague', t('infini.palier', { n: p.palier })),
      el('span', 'palier-gain', t('infini.palier_gain', { aretes: p.aretes, braises: p.braises })),
      el('span', 'palier-etat', p.paye ? `✓ ${t('infini.palier_paye')}` : t('infini.palier_attendu')),
    );
    listePaliers.append(ligne);
  }
  colonnePaliers.append(listePaliers, el('p', 'choix-legende', t('infini.regles')));

  // --- Colonne du choix (dieu, héros, objets) et lancement ---
  const colonneChoix = el('section', 'infini-colonne infini-choix');
  const choisir = creerChoixFiche(atlas, session, signal);
  const lancer = bouton('bouton grand', t('infini.lancer'), () => {
    const carte = cartes[choisie];
    if (!carte) return;
    // Un choix qui ne tient plus (objet épuisé dans un autre onglet…) est refusé ici, avant de quitter l'écran.
    const choix = choixJouable(session.sauvegarde, choisir.choix());
    const compose = configInfini(session.sauvegarde, choix, 0, carte.region);
    if (!compose.ok) {
      ecran.dire(t('infini.lancement_refuse', { raison: texteRefusMeta(compose.raison) }), true);
      return;
    }
    controleur.abort();
    ecran.arreter();
    options.surLancer(carte, choix);
  }, signal);
  lancer.textContent = t('infini.lancer');
  lancer.classList.toggle('grise', cartes.length === 0);
  lancer.setAttribute('aria-disabled', String(cartes.length === 0));
  colonneChoix.append(choisir.racine);
  // « Lancer » dans la barre du haut : toujours visible, même quand les colonnes défilent.
  lancer.classList.remove('grand');
  lancer.classList.add('infini-lancer');
  ecran.racine.querySelector('.meta-entete')?.insertBefore(lancer, ecran.racine.querySelector('.meta-entete > .bouton'));

  const grille = el('div', 'infini-colonnes');
  grille.append(colonneCartes, colonnePaliers, colonneChoix);
  ecran.corps.append(grille);

  // Flèches haut et bas : d'une carte à l'autre.
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    if (document.activeElement instanceof HTMLElement && colonneChoix.contains(document.activeElement)) return;
    e.preventDefault();
    const i = Math.min(cartes.length - 1, Math.max(0, choisie + (e.key === 'ArrowDown' ? 1 : -1)));
    cocher(i);
    boutonsCartes[i]?.focus({ preventScroll: true });
  }, { signal });

  cocher(choisie);
  (boutonsCartes[choisie] ?? lancer).focus({ preventScroll: true });
  return {
    ...ecran,
    arreter: () => {
      controleur.abort();
      ecran.arreter();
    },
  };
}
