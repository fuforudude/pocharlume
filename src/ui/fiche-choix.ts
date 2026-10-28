// Ce que la fiche d'un niveau demande en plus de la difficulté : le dieu (3 symboles), le héros parmi ceux du dieu
// (disciples pas encore recrutés grisés, cadenas et prix), et les objets emportés (3 emplacements pris dans le stock).
// Le dernier choix est mémorisé par la session (choisirHeros, equiperObjets) et proposé de nouveau la fois suivante.
// Cette vue ne décide d'aucune règle : chaque geste passe par la session, dont le refus s'affiche tel quel.
import { DIEUX } from '../data/dieux';
import { HEROS } from '../data/heros';
import {
  EMPLACEMENTS_OBJETS,
  IDS_DIEUX,
  PRIX_DISCIPLE,
  type IdDieu,
  type IdHeros,
  type IdObjet,
} from '../data/meta';
import { OBJETS } from '../data/objets';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { iconeDieu, iconeObjet, portraitHeros } from '../render/habillage';
import type { ChoixPartie, RaisonChoix, RaisonEquipement, ResultatTransaction, Sauvegarde } from '../save';
import { bouton, el, image } from './dom';
import { choixJouable, vueHerosDuDieu, vueObjetsChoix } from './meta-vues';
import { texteRefusMeta } from './raisons-meta';

/** Ce que la fiche demande à la session (la session en entier y répond). */
export interface SessionChoix {
  readonly sauvegarde: Sauvegarde;
  choisirHeros(dieu: string, heros: string): Promise<ResultatTransaction<RaisonChoix>>;
  equiperObjets(objets: readonly string[]): Promise<ResultatTransaction<RaisonEquipement>>;
  /** Prévient quand la sauvegarde change (autre onglet, écriture) ; rend la fonction qui retire l'écouteur. */
  surChangement?(ecouteur: () => void): () => void;
}

export interface ChoixFiche {
  readonly racine: HTMLElement;
  /** Le choix courant (dieu, héros, objets), déjà corrigé pour être jouable. */
  choix(): ChoixPartie;
  /**
   * En défi, rien ne s'emporte : la section des objets est remplacée par une phrase. Le choix mémorisé n'est pas touché
   * (il revient en quittant le défi).
   */
  definirDefi(enDefi: boolean): void;
}

function icone(atlas: AtlasRendu, nom: string, echelle: number, classe = 'icone'): HTMLImageElement {
  return image(atlas.iconeUrl(nom, echelle), classe);
}

/** Construit la partie « dieu, héros, objets » d'une fiche. `signal` retire les écouteurs avec la fiche. */
export function creerChoixFiche(atlas: AtlasRendu, session: SessionChoix, signal: AbortSignal): ChoixFiche {
  const racine = el('div', 'choix-fiche');
  let choix = choixJouable(session.sauvegarde);
  let message = '';
  let enDefi = false;

  const dire = (texte: string, cleFocus?: string): void => {
    message = texte;
    rendre(cleFocus);
  };

  // Deux choix rapides se suivent avant que la session ait répondu au premier : seule la réponse à la dernière
  // demande compte. Une réponse périmée (refus du premier choix, par exemple) ne doit ni annuler le second ni
  // afficher un message qui ne le concerne plus. Une file par sorte de choix, pour que le héros et les objets ne
  // s'annulent pas entre eux.
  let requeteHeros = 0;
  let requeteObjets = 0;

  /** Mémorise le dieu et le héros ; en cas de refus, on garde l'ancien choix et on dit pourquoi. */
  const retenirHeros = (dieu: IdDieu, heros: IdHeros, cleFocus: string): void => {
    const avant = { dieu: choix.dieu, heros: choix.heros };
    const numero = ++requeteHeros;
    choix = { ...choix, dieu, heros };
    session.choisirHeros(dieu, heros).then(
      (r) => {
        if (numero !== requeteHeros || r.ok) return;
        choix = { ...choix, ...avant };
        dire(texteRefusMeta(r.raison), cleFocus);
      },
      (erreur: unknown) => {
        console.error(erreur);
        if (numero !== requeteHeros) return;
        choix = { ...choix, ...avant };
        dire(t('erreur.sauvegarde'), cleFocus);
      },
    );
    dire('', cleFocus);
  };

  const retenirObjets = (objets: IdObjet[], cleFocus: string): void => {
    const avant = choix.objets;
    const numero = ++requeteObjets;
    choix = { ...choix, objets };
    session.equiperObjets(objets).then(
      (r) => {
        if (numero !== requeteObjets || r.ok) return;
        choix = { ...choix, objets: avant };
        dire(texteRefusMeta(r.raison), cleFocus);
      },
      (erreur: unknown) => {
        console.error(erreur);
        if (numero !== requeteObjets) return;
        choix = { ...choix, objets: avant };
        dire(t('erreur.sauvegarde'), cleFocus);
      },
    );
    dire('', cleFocus);
  };

  function sectionDieu(): HTMLElement {
    const section = el('div', 'choix-section');
    section.append(el('h3', 'choix-titre', t('fiche.choix_dieu')));
    const rangee = el('div', 'choix-rangee');
    rangee.setAttribute('role', 'radiogroup');
    rangee.setAttribute('aria-label', t('fiche.choix_dieu'));
    for (const dieu of IDS_DIEUX) {
      const nom = tCle(DIEUX[dieu].nom);
      const b = bouton('bouton choix-dieu', nom, () => {
        if (dieu === choix.dieu) return;
        const premier = vueHerosDuDieu(session.sauvegarde, dieu)[0];
        // Le héros mémorisé pour ce dieu n'est pas gardé : on repart de son avatar, toujours possédé.
        if (premier) retenirHeros(dieu, premier.id, `dieu:${dieu}`);
      }, signal);
      b.dataset.cle = `dieu:${dieu}`;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(dieu === choix.dieu));
      b.classList.toggle('actif', dieu === choix.dieu);
      b.append(icone(atlas, iconeDieu(dieu), 2), el('span', 'nom', nom));
      rangee.append(b);
    }
    section.append(rangee);
    return section;
  }

  function sectionHeros(): HTMLElement {
    const section = el('div', 'choix-section');
    section.append(el('h3', 'choix-titre', t('fiche.choix_heros')));
    const rangee = el('div', 'choix-rangee');
    rangee.setAttribute('role', 'radiogroup');
    rangee.setAttribute('aria-label', t('fiche.choix_heros'));
    for (const vue of vueHerosDuDieu(session.sauvegarde, choix.dieu)) {
      const nom = tCle(HEROS[vue.id].nom);
      const b = bouton('bouton choix-heros', nom, () => {
        if (!vue.possede) {
          dire(t('fiche.heros_verrouille', { nom, n: PRIX_DISCIPLE }), `heros:${vue.id}`);
          return;
        }
        if (vue.id !== choix.heros) retenirHeros(choix.dieu, vue.id, `heros:${vue.id}`);
      }, signal);
      b.dataset.cle = `heros:${vue.id}`;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(vue.possede && vue.id === choix.heros));
      b.classList.toggle('actif', vue.possede && vue.id === choix.heros);
      b.classList.toggle('verrouille', !vue.possede);
      b.append(icone(atlas, portraitHeros(vue.id), 2, 'portrait'));
      if (vue.possede) {
        b.append(el('span', 'detail-heros', t('fiche.heros_niveau', { n: vue.niveau ?? 1 })));
      } else {
        const prix = el('span', 'detail-heros prix');
        prix.append(icone(atlas, 'icone-braise', 1, 'petite'), el('span', '', String(vue.prix ?? PRIX_DISCIPLE)));
        b.append(icone(atlas, 'icone-cadenas', 1, 'cadenas'), prix);
        b.title = `${nom} : ${t('fiche.heros_prix', { n: vue.prix ?? PRIX_DISCIPLE })}`;
        b.setAttribute('aria-label', b.title);
      }
      rangee.append(b);
    }
    section.append(rangee);
    const actuel = HEROS[choix.heros];
    section.append(el('p', 'choix-legende', `${tCle(actuel.nom)} : ${tCle(actuel.role)}`));
    return section;
  }

  function sectionObjets(): HTMLElement {
    const section = el('div', 'choix-section');
    section.append(el('h3', 'choix-titre', t('fiche.choix_objets')));
    if (enDefi) {
      section.append(el('p', 'choix-legende', t('fiche.defi_sans_objet')));
      return section;
    }
    const emplacements = el('div', 'choix-rangee emplacements');
    for (let i = 0; i < EMPLACEMENTS_OBJETS; i++) {
      const objet = choix.objets[i];
      const libelle = objet ? t('fiche.objet_retirer', { nom: tCle(OBJETS[objet].nom) }) : t('fiche.objet_libre');
      const b = bouton('bouton choix-slot', libelle, () => {
        if (objet) retenirObjets(choix.objets.filter((_, k) => k !== i), `slot:${String(i)}`);
      }, signal);
      b.dataset.cle = `slot:${String(i)}`;
      if (objet) b.append(icone(atlas, iconeObjet(objet), 2));
      else b.classList.add('vide');
      emplacements.append(b);
    }
    section.append(emplacements);

    const stocks = vueObjetsChoix(session.sauvegarde, choix.objets);
    const possedes = stocks.filter((v) => v.stock > 0);
    if (possedes.length === 0) {
      section.append(el('p', 'choix-legende', t('fiche.sans_objet')));
      return section;
    }
    const rangee = el('div', 'choix-rangee');
    for (const vue of possedes) {
      const nom = tCle(OBJETS[vue.id].nom);
      const b = bouton('bouton choix-objet', t('fiche.objet_ajouter', { nom, n: vue.stock }), () => {
        if (choix.objets.length >= EMPLACEMENTS_OBJETS) {
          dire(t('fiche.objets_pleins'), `objet:${vue.id}`);
        } else if (vue.libre <= 0) {
          dire(t('fiche.objet_stock_vide', { nom }), `objet:${vue.id}`);
        } else {
          retenirObjets([...choix.objets, vue.id], `objet:${vue.id}`);
        }
      }, signal);
      b.dataset.cle = `objet:${vue.id}`;
      b.classList.toggle('grise', vue.libre <= 0 || choix.objets.length >= EMPLACEMENTS_OBJETS);
      b.append(icone(atlas, iconeObjet(vue.id), 2), el('span', 'detail-heros', t('fiche.objet_reste', { n: vue.libre })));
      rangee.append(b);
    }
    section.append(rangee);
    return section;
  }

  function rendre(cleFocus?: string): void {
    const actif = cleFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement.dataset.cle : undefined);
    const msg = el('p', 'choix-message', message);
    msg.setAttribute('role', 'status');
    racine.replaceChildren(sectionDieu(), sectionHeros(), sectionObjets(), msg);
    if (actif && racine.isConnected) {
      for (const b of racine.querySelectorAll<HTMLElement>('button')) {
        if (b.dataset.cle === actif) {
          b.focus({ preventScroll: true });
          break;
        }
      }
    }
  }

  rendre();
  return {
    racine,
    choix: () => ({ ...choix, objets: [...choix.objets] }),
    definirDefi: (valeur) => {
      if (valeur === enDefi) return;
      enDefi = valeur;
      rendre();
    },
  };
}
