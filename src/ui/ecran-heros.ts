// Écran des héros (depuis la carte du monde) : par dieu, ses trois héros ; niveau et barre d'expérience, quatre
// compétences avec leurs rangs (l'ultime est verrouillée avant le niveau 6), points à placer ou à reprendre
// gratuitement, et l'achat d'un disciple (30 braises) après confirmation. Les règles sont dans src/save/ : cet
// écran présente la sauvegarde, envoie les gestes à la session et affiche ses refus.
import { jouerInterface } from '../audio';
import { DIEUX } from '../data/dieux';
import { HEROS } from '../data/heros';
import { dieuDuHeros, HEROS_PAR_DIEU, IDS_DIEUX, PRIX_DISCIPLE, type IdDieu, type IdHeros } from '../data/meta';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { iconeDieu, portraitHeros } from '../render/habillage';
import type { RaisonDisciple, RaisonPoint, RaisonPoints, ResultatTransaction, Sauvegarde } from '../save';
import { bouton, el, image } from './dom';
import { afficherConfirmation } from './ecrans';
import { creerEcranMeta, pastilles, redessiner, type EcranMeta } from './ecran-meta';
import { texteRefusMeta } from './raisons-meta';
import { vueFicheHeros } from './meta-vues';

/** Ce que l'écran demande à la session (la session en entier y répond). */
export interface SessionHeros {
  readonly sauvegarde: Sauvegarde;
  repartirPoint(heros: string, competence: string): Promise<ResultatTransaction<RaisonPoint | 'modifie_ailleurs' | 'definitions_absentes'>>;
  reinitialiserPoints(heros: string): Promise<ResultatTransaction<RaisonPoints>>;
  acheterDisciple(heros: string): Promise<ResultatTransaction<RaisonDisciple>>;
}

export interface OptionsEcranHeros {
  readonly atlas: AtlasRendu;
  readonly session: SessionHeros;
  /** Héros montré à l'ouverture (le dernier choisi sur la fiche d'un niveau, par exemple). */
  readonly heros?: IdHeros;
  readonly surFermer: () => void;
}

export function afficherEcranHeros(parent: HTMLElement, options: OptionsEcranHeros): EcranMeta {
  const { atlas, session } = options;
  const depart: IdHeros = options.heros ?? session.sauvegarde.meta.choix.heros;
  let dieu: IdDieu = dieuDuHeros(depart);
  let heros: IdHeros = depart;
  let occupe = false;

  const ecran = creerEcranMeta(parent, {
    classe: 'ecran-heros',
    titre: t('heros.titre'),
    fermer: t('heros.fermer'),
    atlas,
    sauvegarde: session.sauvegarde,
    monnaies: ['braises'],
    surFermer: options.surFermer,
  });

  const nomDe = (id: IdHeros): string => tCle(HEROS[id].nom);

  /** Passe un geste à la session, puis redessine ; le refus éventuel est dit. */
  const agir = async (geste: () => Promise<{ readonly ok: true } | { readonly ok: false; readonly raison: Parameters<typeof texteRefusMeta>[0] }>, succes?: string, achat = false): Promise<void> => {
    if (occupe) return;
    occupe = true;
    try {
      const r = await geste();
      dessiner();
      if (!r.ok) jouerInterface('refus');
      else if (achat) jouerInterface('achat');
      ecran.dire(r.ok ? (succes ?? '') : texteRefusMeta(r.raison), !r.ok);
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

  const recruter = (id: IdHeros): void => {
    const braises = session.sauvegarde.meta.monnaies.braises;
    if (braises < PRIX_DISCIPLE) return;
    afficherConfirmation(ecran.racine, {
      titre: t('heros.confirmer_titre', { nom: nomDe(id) }),
      detail: t('heros.confirmer_detail', { n: PRIX_DISCIPLE, m: Math.max(0, braises - PRIX_DISCIPLE) }),
      confirmer: t('heros.confirmer'),
      annuler: t('heros.annuler'),
      surConfirmer: () => {
        void agir(() => session.acheterDisciple(id), t('heros.recrute', { nom: nomDe(id) }), true);
      },
      surAnnuler: () => undefined,
    });
  };

  function rail(): HTMLElement {
    const colonne = el('div', 'heros-rail');
    const onglets = el('div', 'heros-dieux');
    onglets.setAttribute('role', 'tablist');
    for (const id of IDS_DIEUX) {
      const nom = tCle(DIEUX[id].nom);
      const b = bouton('bouton onglet-dieu', nom, () => {
        if (id === dieu) return;
        dieu = id;
        heros = HEROS_PAR_DIEU[id][0];
        ecran.dire('');
        dessiner();
      });
      b.dataset.cle = `dieu:${id}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(id === dieu));
      b.classList.toggle('actif', id === dieu);
      b.append(image(atlas.iconeUrl(iconeDieu(id), 2), 'icone'));
      onglets.append(b);
    }
    colonne.append(onglets);
    // Sans visage : l'épithète et la phrase du dieu choisi sous ses symboles.
    colonne.append(el('p', 'desc', `${tCle(DIEUX[dieu].nom)} : ${tCle(DIEUX[dieu].description)}`));
    const liste = el('div', 'heros-liste');
    for (const id of HEROS_PAR_DIEU[dieu]) {
      const vue = vueFicheHeros(session.sauvegarde, id);
      const b = bouton('bouton ligne-heros', nomDe(id), () => {
        heros = id;
        ecran.dire('');
        dessiner();
      });
      b.dataset.cle = `heros:${id}`;
      b.classList.toggle('actif', id === heros);
      b.classList.toggle('verrouille', !vue.possede);
      b.append(image(atlas.iconeUrl(portraitHeros(id), 2), 'portrait'));
      const texte = el('span', 'texte');
      texte.append(el('span', 'nom', nomDe(id)));
      if (vue.possede) {
        texte.append(el('span', 'sous', t('heros.niveau', { n: vue.niveau })));
        if (vue.points > 0) texte.append(el('span', 'pastille-points', String(vue.points)));
      } else {
        texte.append(el('span', 'sous', t('heros.verrouille')));
        b.append(image(atlas.iconeUrl('icone-cadenas', 1), 'cadenas'));
      }
      b.append(texte);
      liste.append(b);
    }
    colonne.append(liste);
    return colonne;
  }

  function detail(): HTMLElement {
    const vue = vueFicheHeros(session.sauvegarde, heros);
    const def = HEROS[heros];
    const panneau = el('div', 'heros-detail');

    const tete = el('div', 'heros-tete');
    tete.append(image(atlas.iconeUrl(portraitHeros(heros), 3), 'portrait grand'));
    const identite = el('div', 'identite');
    identite.append(el('h3', 'nom', nomDe(heros)), el('p', 'role', tCle(def.role)));
    if (vue.possede) {
      const niveau = vue.xpSuivant === null ? t('heros.niveau_max', { n: vue.niveau }) : t('heros.niveau', { n: vue.niveau });
      identite.append(el('p', 'niveau', niveau));
      const barre = el('div', 'barre-xp');
      barre.setAttribute('role', 'progressbar');
      barre.setAttribute('aria-valuemin', '0');
      barre.setAttribute('aria-valuemax', '100');
      barre.setAttribute('aria-valuenow', String(Math.round(vue.fractionXp * 100)));
      const rempli = el('span', 'rempli');
      rempli.style.width = `${String(Math.round(vue.fractionXp * 100))}%`;
      barre.append(rempli);
      identite.append(barre);
      identite.append(
        el('p', 'xp', vue.xpSuivant === null ? t('heros.xp_max', { xp: vue.xp }) : t('heros.xp', { xp: vue.xp, max: vue.xpSuivant })),
      );
    } else {
      identite.append(el('p', 'desc', tCle(def.description)));
    }
    tete.append(identite);

    const actions = el('div', 'heros-actions');
    if (vue.possede) {
      actions.append(el('p', 'points', t('heros.points', { n: vue.points })));
      const reprendre = bouton('bouton', t('heros.reinitialiser'), () => {
        void agir(() => session.reinitialiserPoints(heros), t('heros.points_repris', { nom: nomDe(heros) }));
      });
      reprendre.dataset.cle = 'reprendre';
      reprendre.textContent = t('heros.reinitialiser');
      reprendre.classList.toggle('grise', vue.pointsPlaces === 0);
      actions.append(reprendre);
    } else {
      const acheter = bouton('bouton grand', t('heros.acheter', { n: PRIX_DISCIPLE }), () => { recruter(heros); });
      acheter.dataset.cle = 'recruter';
      acheter.append(image(atlas.iconeUrl('icone-braise', 2), 'icone'), el('span', '', t('heros.acheter', { n: PRIX_DISCIPLE })));
      // Sans assez de braises, le bouton est désactivé et dit ce qui manque : pas de confirmation trompeuse.
      const manque = PRIX_DISCIPLE - session.sauvegarde.meta.monnaies.braises;
      acheter.disabled = manque > 0;
      acheter.classList.toggle('grise', manque > 0);
      actions.append(acheter);
      if (manque > 0) actions.append(el('p', 'manque-braises', t('heros.manque_braises', { n: manque })));
    }
    tete.append(actions);
    panneau.append(tete);

    const grille = el('div', 'competences');
    def.competences.forEach((c, i) => {
      const comp = vue.competences[i];
      if (!comp) return;
      const carte = el('div', 'competence');
      carte.classList.toggle('ultime', comp.ultime);
      carte.classList.toggle('verrouillee', comp.verrouillee || !vue.possede);
      const entete = el('div', 'competence-entete');
      entete.append(image(atlas.iconeUrl(comp.verrouillee && vue.possede ? 'icone-cadenas' : 'icone-competence', 2), 'icone'));
      const noms = el('span', 'noms');
      const titre = el('span', 'nom', tCle(c.nom));
      if (comp.ultime) titre.append(el('span', 'etiquette-ultime', t('heros.ultime')));
      noms.append(titre);
      noms.append(
        el('span', 'sous', comp.verrouillee ? t('heros.niveau_requis', { n: comp.niveauRequis }) : t('heros.rang', { n: comp.rang, m: comp.rangMax })),
      );
      entete.append(noms, pastilles(comp.rang, comp.rangMax));
      if (vue.possede && !comp.verrouillee) {
        const libelle = t('heros.placer', { nom: tCle(c.nom) });
        const plus = bouton('bouton placer', libelle, () => {
          void agir(() => session.repartirPoint(heros, c.id));
        });
        plus.dataset.cle = `placer:${c.id}`;
        plus.textContent = t('heros.plus');
        plus.classList.toggle('grise', !comp.peutPlacer);
        entete.append(plus);
      }
      carte.append(entete, el('p', 'desc', tCle(c.description)));
      grille.append(carte);
    });
    panneau.append(grille);
    return panneau;
  }

  function dessiner(): void {
    ecran.majMonnaies(session.sauvegarde);
    redessiner(ecran.corps, () => [rail(), detail()]);
  }

  ecran.corps.classList.add('heros-corps');
  dessiner();
  return ecran;
}
