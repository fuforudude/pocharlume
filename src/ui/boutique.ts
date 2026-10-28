// Boutique (depuis la carte du monde) : l'arbre d'améliorations (6 branches de 5 rangs payés en étoiles, remise à
// zéro gratuite après confirmation) et les objets consommables (prix en arêtes, stock de 10 au plus). Les règles
// sont dans src/save/ : l'écran présente la sauvegarde, envoie les gestes à la session et affiche ses refus.
import { jouerInterface } from '../audio';
import { BRANCHES } from '../data/ameliorations';
import { etoilesDepensees } from '../save';
import { OBJETS } from '../data/objets';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { iconeBranche, iconeObjet } from '../render/habillage';
import type { RaisonAchatObjet, RaisonArbre, RaisonReinitialisation, ResultatTransaction, Sauvegarde } from '../save';
import { bouton, el, image } from './dom';
import { afficherConfirmation } from './ecrans';
import { creerEcranMeta, pastilles, redessiner, type EcranMeta } from './ecran-meta';
import { vueArbre, vueObjetsBoutique } from './meta-vues';
import { texteRefusMeta } from './raisons-meta';

/** Ce que la boutique demande à la session (la session en entier y répond). */
export interface SessionBoutique {
  readonly sauvegarde: Sauvegarde;
  acheterRangArbre(branche: string): Promise<ResultatTransaction<RaisonArbre | 'modifie_ailleurs'>>;
  reinitialiserArbre(): Promise<ResultatTransaction<RaisonReinitialisation>>;
  acheterObjet(objet: string, quantite?: number): Promise<ResultatTransaction<RaisonAchatObjet>>;
}

export type OngletBoutique = 'arbre' | 'objets';

export interface OptionsBoutique {
  readonly atlas: AtlasRendu;
  readonly session: SessionBoutique;
  readonly onglet?: OngletBoutique;
  readonly surFermer: () => void;
}

export function afficherBoutique(parent: HTMLElement, options: OptionsBoutique): EcranMeta {
  const { atlas, session } = options;
  let onglet: OngletBoutique = options.onglet ?? 'arbre';
  let occupe = false;

  const ecran = creerEcranMeta(parent, {
    classe: 'boutique',
    titre: t('boutique.titre'),
    fermer: t('boutique.fermer'),
    atlas,
    sauvegarde: session.sauvegarde,
    monnaies: ['aretes', 'etoiles'],
    surFermer: options.surFermer,
  });

  /** `achat` : le geste est un achat, qui sonne quand il réussit ; un refus sonne toujours. */
  const agir = async (geste: () => Promise<{ readonly ok: true } | { readonly ok: false; readonly raison: Parameters<typeof texteRefusMeta>[0] }>, succes = '', achat = false): Promise<void> => {
    if (occupe) return;
    occupe = true;
    try {
      const r = await geste();
      dessiner();
      if (!r.ok) jouerInterface('refus');
      else if (achat) jouerInterface('achat');
      ecran.dire(r.ok ? succes : texteRefusMeta(r.raison), !r.ok);
    } catch (erreur) {
      // La session lève si l'écriture échoue (verrou, stockage) : on le dit au lieu de laisser un rejet orphelin.
      console.error(erreur);
      dessiner();
      jouerInterface('refus');
      ecran.dire(t('erreur.sauvegarde'), true);
    } finally {
      occupe = false;
    }
  };

  function onglets(): HTMLElement {
    const rangee = el('div', 'boutique-onglets');
    rangee.setAttribute('role', 'tablist');
    for (const [id, cle] of [['arbre', 'boutique.onglet_arbre'], ['objets', 'boutique.onglet_objets']] as const) {
      const b = bouton('bouton onglet', t(cle), () => {
        if (id === onglet) return;
        onglet = id;
        ecran.dire('');
        dessiner();
      });
      b.dataset.cle = `onglet:${id}`;
      b.textContent = t(cle);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(id === onglet));
      b.classList.toggle('actif', id === onglet);
      rangee.append(b);
    }
    if (onglet === 'arbre') {
      const depensees = etoilesDepensees(session.sauvegarde.meta.arbre);
      const reinit = bouton('bouton', t('boutique.reinitialiser'), () => {
        afficherConfirmation(ecran.racine, {
          titre: t('boutique.reinit_titre'),
          detail: t('boutique.reinit_detail', { n: depensees }),
          confirmer: t('boutique.reinit_confirmer'),
          annuler: t('boutique.reinit_annuler'),
          surConfirmer: () => {
            void agir(() => session.reinitialiserArbre(), t('boutique.arbre_reinitialise', { n: depensees }));
          },
          surAnnuler: () => undefined,
        });
      });
      reinit.dataset.cle = 'reinitialiser';
      reinit.textContent = t('boutique.reinitialiser');
      reinit.classList.toggle('grise', depensees === 0);
      rangee.append(reinit);
    }
    return rangee;
  }

  function arbre(): HTMLElement {
    const grille = el('div', 'arbre');
    for (const vue of vueArbre(session.sauvegarde)) {
      const def = BRANCHES[vue.id];
      const nom = tCle(def.nom);
      const carte = el('div', 'branche');
      carte.classList.toggle('sommet', vue.cout === null);
      const texte = el('div', 'texte');
      const rangs = el('div', 'rangs');
      rangs.append(pastilles(vue.rang, vue.rangMax), el('span', 'rang', t('boutique.rang', { n: vue.rang, m: vue.rangMax })));
      texte.append(el('span', 'nom', nom), el('p', 'desc', tCle(def.description)), rangs);
      carte.append(image(atlas.iconeUrl(iconeBranche(vue.id), 2), 'icone'), texte);
      if (vue.cout === null) {
        carte.append(el('span', 'sommet-texte', t('boutique.au_maximum')));
      } else {
        const libelle = t('boutique.acheter_rang', { n: vue.rang + 1, nom });
        const acheter = bouton('bouton acheter', libelle, () => {
          void agir(() => session.acheterRangArbre(vue.id), '', true);
        });
        acheter.dataset.cle = `rang:${vue.id}`;
        acheter.title = t('boutique.cout_rang', { n: vue.rang + 1, c: vue.cout });
        acheter.append(el('span', '', String(vue.cout)), image(atlas.iconeUrl('icone-etoile', 1), 'icone'));
        acheter.classList.toggle('grise', !vue.achetable);
        carte.append(acheter);
      }
      grille.append(carte);
    }
    return grille;
  }

  function objets(): HTMLElement {
    const grille = el('div', 'objets');
    for (const vue of vueObjetsBoutique(session.sauvegarde)) {
      const def = OBJETS[vue.id];
      const nom = tCle(def.nom);
      const carte = el('div', 'objet');
      const texte = el('div', 'texte');
      texte.append(el('span', 'nom', nom), el('p', 'desc', tCle(def.description)), el('span', 'stock', t('boutique.stock', { n: vue.stock, m: vue.stockMax })));
      carte.append(image(atlas.iconeUrl(iconeObjet(vue.id), 3), 'icone'), texte);
      const acheter = bouton('bouton acheter', t('boutique.acheter_objet', { nom }), () => {
        void agir(() => session.acheterObjet(vue.id), t('boutique.achete', { nom }), true);
      });
      acheter.dataset.cle = `objet:${vue.id}`;
      acheter.append(el('span', '', vue.stock >= vue.stockMax ? t('boutique.stock_plein') : String(vue.prix)));
      if (vue.stock < vue.stockMax) acheter.append(image(atlas.iconeUrl('icone-arete', 1), 'icone'));
      acheter.title = t('boutique.prix_objet', { n: vue.prix });
      acheter.classList.toggle('grise', !vue.achetable);
      carte.append(acheter);
      grille.append(carte);
    }
    return grille;
  }

  function dessiner(): void {
    ecran.majMonnaies(session.sauvegarde);
    redessiner(ecran.corps, () => [onglets(), onglet === 'arbre' ? arbre() : objets()]);
  }

  ecran.corps.classList.add('boutique-corps');
  dessiner();
  return ecran;
}
