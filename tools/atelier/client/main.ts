// Page principale de l'atelier : barre du haut, onglets selon les modules de l'adaptateur, raccourcis.
import { monterCartes } from './cartes.ts';
import { monterPalette } from './palette.ts';
import { appeler, el } from './outils.ts';
import { monterSprites } from './sprites.ts';
import type { Contexte, Vue } from './vue.ts';

interface Info {
  readonly nom: string;
  readonly sprites: boolean;
  readonly palette: boolean;
  readonly cartes: boolean;
}

const vueRacine = document.getElementById('vue') as HTMLElement;
const onglets = document.getElementById('onglets') as HTMLElement;
const barreEtat = document.getElementById('etat') as HTMLElement;
const boutonEnregistrer = document.getElementById('enregistrer') as HTMLButtonElement;

let modifie = false;
const ctx: Contexte = {
  etat(message, type) {
    barreEtat.textContent = message;
    barreEtat.className = type ?? '';
  },
  signalerModif(m) {
    modifie = m;
    boutonEnregistrer.disabled = !m;
  },
};

window.addEventListener('beforeunload', (e) => {
  if (modifie) e.preventDefault();
});

let vue: Vue | null = null;
let courant = '';

async function afficher(nom: string, monter: (racine: HTMLElement, ctx: Contexte) => Promise<Vue>, element?: string): Promise<void> {
  if (nom === courant) return;
  if (modifie && !confirm('Des changements ne sont pas enregistrés. Les abandonner ?')) return;
  vue?.arreter();
  ctx.signalerModif(false);
  courant = nom;
  for (const b of onglets.querySelectorAll('button')) b.setAttribute('aria-selected', String(b.dataset['nom'] === nom));
  try {
    vue = await monter(vueRacine, ctx);
    if (element) await vue.ouvrir?.(decodeURIComponent(element));
  } catch (e) {
    vue = null;
    ctx.etat(e instanceof Error ? e.message : String(e), 'erreur');
  }
}

boutonEnregistrer.addEventListener('click', () => {
  void vue?.enregistrer().catch((e: unknown) => { ctx.etat(e instanceof Error ? e.message : String(e), 'erreur'); });
});

document.addEventListener('keydown', (e) => {
  const cible = e.target as HTMLElement;
  if (cible.tagName === 'INPUT' && (cible as HTMLInputElement).type !== 'checkbox') return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    boutonEnregistrer.click();
    return;
  }
  if (vue?.touche(e)) e.preventDefault();
});

const info = await appeler<Info>('/api/info');
document.title = `Atelier — ${info.nom}`;
(document.getElementById('titre') as HTMLElement).textContent = `Atelier — ${info.nom}`;
const modules: [string, string, boolean, (r: HTMLElement, c: Contexte) => Promise<Vue>][] = [
  ['sprites', 'Sprites', info.sprites, monterSprites],
  ['palette', 'Palette', info.palette, monterPalette],
  ['cartes', 'Cartes', info.cartes, monterCartes],
];
for (const [id, titre, present, monter] of modules) {
  if (!present) continue;
  const b = el('button', { type: 'button', role: 'tab', 'data-nom': id, 'aria-selected': 'false' }, titre);
  b.addEventListener('click', () => { void afficher(id, monter); });
  onglets.append(b);
}
// Lien direct : `#cartes/chaumes`, `#sprites/epouvantail`.
const [ongletLien, elementLien] = location.hash.replace(/^#/, '').split('/');
const premier = modules.find((m) => m[2] && m[0] === ongletLien) ?? modules.find((m) => m[2]);
if (premier) await afficher(premier[0], premier[3], premier[0] === ongletLien ? elementLien : undefined);
