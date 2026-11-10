// Écran de secours « Notes » : un éditeur de texte qui recouvre le jeu. Il s'affiche au chargement ; la touche de
// secours (F2 ou Ctrl+Maj+Espace, trois doigts sur un écran tactile) bascule entre lui et le jeu. Le jeu est mis en
// pause à chaque affichage de l'éditeur (évènement `EVENEMENT_SECOURS`, écouté par la partie) et ne reçoit aucune touche
// tant que l'éditeur est là. Le texte reste dans ce navigateur.
import { t } from '../i18n';

export const CLE_NOTES = 'notes.texte';
/** Évènement du document, émis à chaque bascule : `detail.notes` vaut vrai quand l'éditeur vient de s'afficher. */
export const EVENEMENT_SECOURS = 'pocharlume:secours';

export interface ToucheClavier {
  readonly key: string;
  readonly code?: string;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

/** Vrai pour F2 seule ou Ctrl+Maj+Espace. */
export function estToucheDeSecours(e: ToucheClavier): boolean {
  if (e.altKey || e.metaKey) return false;
  if (e.ctrlKey && e.shiftKey) return e.code === 'Space' || e.key === ' ';
  return e.key === 'F2' && !e.ctrlKey && !e.shiftKey;
}

export interface MemoireNotes {
  lire(): string;
  ecrire(texte: string): void;
}

/** Notes gardées dans `localStorage` ; en mémoire si le navigateur refuse (navigation privée, stockage bloqué). */
export function memoireNotes(stockage?: Pick<Storage, 'getItem' | 'setItem'>): MemoireNotes {
  let secours = '';
  let utilisable = stockage;
  if (utilisable === undefined) {
    try {
      utilisable = window.localStorage;
    } catch {
      utilisable = undefined;
    }
  }
  return {
    lire() {
      try {
        return utilisable?.getItem(CLE_NOTES) ?? secours;
      } catch {
        return secours;
      }
    },
    ecrire(texte) {
      secours = texte;
      try {
        utilisable?.setItem(CLE_NOTES, texte);
      } catch {
        /* refusé : les notes restent en mémoire */
      }
    },
  };
}

// Icône de document neutre, la même jeu affiché ou non.
const ICONE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="11" height="13" rx="1" fill="#fff" stroke="#8a8f98"/><path d="M5 5h6M5 8h6M5 11h4" stroke="#8a8f98"/></svg>',
  );

function poserIcone(): void {
  let lien = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!lien) {
    lien = document.createElement('link');
    lien.rel = 'icon';
    document.head.append(lien);
  }
  lien.href = ICONE;
}

export interface EcranNotes {
  basculer(): void;
  /** Vrai quand l'éditeur est affiché (le jeu est caché). */
  estAffiche(): boolean;
}

/** Installe l'éditeur par-dessus `app` (le jeu) et l'affiche. À appeler une fois, avant le démarrage du jeu. */
/** `signal` retire les écouteurs de la fenêtre (tests) ; absent : ils restent tant que la page vit. */
export function installerNotes(app: HTMLElement, memoire: MemoireNotes = memoireNotes(), signal?: AbortSignal): EcranNotes {
  document.title = t('notes.titre');
  poserIcone();

  const ecran = document.createElement('section');
  ecran.className = 'notes';
  const barre = document.createElement('div');
  barre.className = 'notes-barre';
  const nom = document.createElement('b');
  nom.textContent = t('notes.titre');
  const aide = document.createElement('span');
  aide.textContent = t('notes.enregistre');
  barre.append(nom, aide);
  const zone = document.createElement('textarea');
  zone.className = 'notes-texte';
  zone.spellcheck = false;
  zone.placeholder = t('notes.vide');
  zone.setAttribute('aria-label', t('notes.titre'));
  zone.value = memoire.lire();
  zone.addEventListener('input', () => { memoire.ecrire(zone.value); });
  ecran.append(barre, zone);
  // Rien de ce qui se tape ici ne doit remonter jusqu'aux commandes du jeu (écoutées sur window / document).
  for (const type of ['keydown', 'keyup', 'keypress'] as const) ecran.addEventListener(type, (e) => { e.stopPropagation(); });
  document.body.append(ecran);

  const avecSignal = signal ? { signal } : {};
  let affiche = false;
  const afficher = (voulu: boolean): void => {
    affiche = voulu;
    ecran.hidden = !voulu;
    app.hidden = voulu;
    document.title = t('notes.titre');
    // Le jeu se met en pause avant que l'éditeur ne prenne le focus.
    document.dispatchEvent(new CustomEvent(EVENEMENT_SECOURS, { detail: { notes: voulu } }));
    if (voulu) zone.focus();
    else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };
  const basculer = (): void => { afficher(!affiche); };

  window.addEventListener(
    'keydown',
    (e) => {
      if (estToucheDeSecours(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) basculer();
        return;
      }
      // Focus perdu pendant l'édition : la touche ne va pas au jeu, et le curseur revient dans l'éditeur.
      if (affiche && !(e.target instanceof Node && ecran.contains(e.target))) {
        e.stopImmediatePropagation();
        zone.focus();
      }
    },
    { capture: true, ...avecSignal },
  );
  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 3) {
        e.preventDefault();
        basculer();
      }
    },
    { capture: true, passive: false, ...avecSignal },
  );

  afficher(true);
  return { basculer, estAffiche: () => affiche };
}
