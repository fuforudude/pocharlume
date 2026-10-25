// Écran des options : volumes (rangés pour plus tard, il n'y a pas encore de son), vitesse par défaut, export de
// la progression en code à copier, import d'un code. Un import ne remplace rien sans confirmation, et un code
// refusé n'altère rien : la raison s'affiche (import-refus.ts).
import { t } from '../i18n';
import { totalEtoiles, type ResultatImport, type Reglages, type Sauvegarde, type Session, type VitesseJeu } from '../save';
import { bouton, el } from './dom';
import { texteImportRefus } from './import-refus';

export interface EcranOptions {
  readonly racine: HTMLElement;
  /** Retire l'écran sans appeler `surFermer`. */
  arreter(): void;
}

const VITESSES: readonly VitesseJeu[] = [1, 2];

/** Copie dans le presse-papiers ; false si le navigateur refuse (la sélection reste alors à copier à la main). */
async function copierTexte(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    return false;
  }
}

/** Un curseur de volume de 0 à 100 : `surChoix` est appelée une fois le curseur relâché. */
function curseurVolume(libelle: string, valeur: number, surChoix: (volume: number) => void): HTMLElement {
  const ligne = el('label', 'ligne-reglage');
  const nom = el('span', 'nom-reglage', libelle);
  const curseur = el('input', 'curseur');
  curseur.type = 'range';
  curseur.min = '0';
  curseur.max = '100';
  curseur.step = '5';
  curseur.value = String(valeur);
  const lecture = el('span', 'valeur-reglage', t('options.volume', { n: valeur }));
  curseur.addEventListener('input', () => { lecture.textContent = t('options.volume', { n: curseur.value }); });
  curseur.addEventListener('change', () => { surChoix(Number(curseur.value)); });
  ligne.append(nom, curseur, lecture);
  return ligne;
}

export function afficherOptions(parent: HTMLElement, session: Session, surFermer: () => void): EcranOptions {
  const precedent = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const ecran = el('div', 'ecran options');
  ecran.setAttribute('role', 'dialog');
  ecran.setAttribute('aria-modal', 'true');
  ecran.setAttribute('aria-label', t('options.titre'));
  let arretee = false;
  const controleur = new AbortController();

  const arreter = (): void => {
    if (arretee) return;
    arretee = true;
    controleur.abort();
    ecran.remove();
    precedent?.focus({ preventScroll: true });
  };
  const fermer = (): void => {
    arreter();
    surFermer();
  };
  // Les touches de cet écran ne remontent pas à l'écran dessous (carte, accueil) ; Échap le ferme, même dans un champ.
  ecran.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      fermer();
    }
  });

  // Même si le focus est ailleurs (clic dans le vide), Échap ferme les options.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    fermer();
  }, { signal: controleur.signal });

  const carte = el('div', 'carte');
  // « Fermer » reste en haut : le contenu défile sur un petit écran, le bouton doit toujours se voir.
  const entete = el('div', 'options-entete');
  const fermerBouton = bouton('bouton', t('options.fermer'), fermer);
  fermerBouton.textContent = t('options.fermer');
  entete.append(el('h2', 'titre', t('options.titre')), fermerBouton);
  carte.append(entete);

  const colonnes = el('div', 'options-colonnes');
  const reglages = el('div', 'options-bloc');
  const echange = el('div', 'options-bloc');
  colonnes.append(reglages, echange);
  carte.append(colonnes);

  // --- Réglages : volumes et vitesse par défaut ---

  const lire = (): Reglages => session.sauvegarde.reglages;
  /** Dessine les réglages d'après la sauvegarde courante (à l'ouverture, et après un import qui les remplace). */
  const dessinerReglages = (): void => {
    const ligneVitesse = el('div', 'ligne-reglage');
    ligneVitesse.append(el('span', 'nom-reglage', t('options.vitesse')));
    const choixVitesse = el('span', 'choix-vitesse');
    choixVitesse.setAttribute('role', 'radiogroup');
    const boutonsVitesse = VITESSES.map((v) => {
      const b = bouton('bouton', t('hud.vitesse', { n: v }), () => {
        void session.changerReglages({ vitesse: v });
        majVitesse();
      });
      b.textContent = t('hud.vitesse', { n: v });
      b.setAttribute('role', 'radio');
      return b;
    });
    const majVitesse = (): void => {
      VITESSES.forEach((v, i) => {
        const b = boutonsVitesse[i];
        if (!b) return;
        b.classList.toggle('actif', lire().vitesse === v);
        b.setAttribute('aria-checked', String(lire().vitesse === v));
      });
    };
    majVitesse();
    choixVitesse.append(...boutonsVitesse);
    ligneVitesse.append(choixVitesse);
    reglages.replaceChildren(
      curseurVolume(t('options.son'), lire().son, (son) => { void session.changerReglages({ son }); }),
      curseurVolume(t('options.musique'), lire().musique, (musique) => { void session.changerReglages({ musique }); }),
      ligneVitesse,
    );
  };
  dessinerReglages();

  // --- Exporter ---

  const exporter = el('div', 'options-section');
  exporter.append(el('h3', 'sous-titre', t('options.exporter')), el('p', 'detail', t('options.exporter_aide')));
  const zoneCode = el('div', 'zone-code');
  zoneCode.hidden = true;
  const code = el('textarea', 'champ-code');
  code.readOnly = true;
  code.rows = 3;
  code.setAttribute('aria-label', t('options.exporter'));
  const retourCopie = el('span', 'retour');
  retourCopie.setAttribute('role', 'status');
  const copier = bouton('bouton', t('options.copier'), () => {
    code.select();
    void copierTexte(code.value).then((ok) => {
      retourCopie.textContent = ok ? t('options.copie') : t('options.copie_impossible');
    });
  });
  copier.textContent = t('options.copier');
  const rangeeCopie = el('div', 'rangee');
  rangeeCopie.append(copier);
  zoneCode.append(code, rangeeCopie, retourCopie);
  const produire = bouton('bouton', t('options.exporter'), () => {
    void session.exporter().then((texte) => {
      code.value = texte;
      zoneCode.hidden = false;
      retourCopie.textContent = '';
      code.select();
    });
  });
  produire.textContent = t('options.exporter');
  exporter.append(produire, zoneCode);

  // --- Importer ---

  const importer = el('div', 'options-section');
  importer.append(el('h3', 'sous-titre', t('options.importer')), el('p', 'detail', t('options.importer_aide')));
  const champ = el('textarea', 'champ-code');
  champ.rows = 3;
  champ.spellcheck = false;
  champ.autocapitalize = 'off';
  champ.setAttribute('aria-label', t('options.importer_champ'));
  const message = el('p', 'retour');
  message.setAttribute('role', 'alert');
  const confirmation = el('div', 'confirmation');
  confirmation.hidden = true;
  const valider = bouton('bouton', t('options.importer_valider'), () => {
    message.textContent = '';
    message.classList.remove('refus');
    void session.importer(champ.value).then((resultat) => { suite(resultat); });
  });
  valider.textContent = t('options.importer_valider');

  const suite = (resultat: ResultatImport): void => {
    if (!resultat.ok) {
      message.textContent = texteImportRefus(resultat.raison);
      message.classList.add('refus');
      return;
    }
    proposer(resultat.sauvegarde);
  };

  /** Demande confirmation avant de remplacer la progression : ce qu'on perd, ce qu'on gagne. */
  const proposer = (importee: Sauvegarde): void => {
    confirmation.replaceChildren();
    confirmation.append(
      el('h4', 'sous-titre', t('options.confirmer_titre')),
      el('p', 'detail', t('options.confirmer_detail', { n: totalEtoiles(session.sauvegarde), m: totalEtoiles(importee) })),
    );
    const rangee = el('div', 'rangee');
    const remplacer = bouton('bouton', t('options.confirmer'), () => {
      void session.appliquerImport(importee).then(() => {
        confirmation.hidden = true;
        valider.hidden = false;
        champ.value = '';
        message.textContent = t('options.import_ok');
        message.classList.remove('refus');
        zoneCode.hidden = true;
        dessinerReglages();
      });
    });
    remplacer.textContent = t('options.confirmer');
    const annuler = bouton('bouton secondaire', t('options.annuler'), () => {
      confirmation.hidden = true;
      valider.hidden = false;
      valider.focus({ preventScroll: true });
    });
    annuler.textContent = t('options.annuler');
    rangee.append(remplacer, annuler);
    confirmation.append(rangee);
    confirmation.hidden = false;
    valider.hidden = true;
    annuler.focus({ preventScroll: true });
    confirmation.scrollIntoView({ block: 'nearest' });
  };

  importer.append(champ, valider, confirmation, message);
  echange.append(exporter, importer);

  ecran.append(carte);
  parent.append(ecran);
  fermerBouton.focus({ preventScroll: true });
  return { racine: ecran, arreter };
}
