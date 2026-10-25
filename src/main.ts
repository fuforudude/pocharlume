// Point d'entrée : pour l'instant un écran noir avec le titre, en pixels nets à zoom entier.
import { t } from './i18n';

type Rvb = readonly [number, number, number];

/** Hauteur logique visée en pixels de jeu : le zoom entier est choisi pour s'en approcher. */
const HAUTEUR_LOGIQUE = 180;
const FOND: Rvb = [0x0b, 0x0a, 0x0d];
const TITRE: Rvb = [0xc8, 0xb4, 0x8a];

const css = ([r, v, b]: Rvb): string => `rgb(${String(r)} ${String(v)} ${String(b)})`;

const canvas = document.querySelector<HTMLCanvasElement>('#jeu');
if (!canvas) throw new Error('Canvas #jeu introuvable');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Contexte 2D indisponible');

// Tampon basse résolution : on y dessine en pixels de jeu, puis on l'agrandit sans lissage.
const ctxTampon = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
if (!ctxTampon) throw new Error('Contexte 2D indisponible');

function dessiner(ecran: HTMLCanvasElement, ctxEcran: CanvasRenderingContext2D, ctxBas: CanvasRenderingContext2D): void {
  // Taille réelle en pixels physiques, pour ne pas laisser le navigateur flouter l'agrandissement.
  const ratio = window.devicePixelRatio || 1;
  const largeur = Math.max(1, Math.round(ecran.clientWidth * ratio));
  const hauteur = Math.max(1, Math.round(ecran.clientHeight * ratio));
  ecran.width = largeur;
  ecran.height = hauteur;

  const zoom = Math.max(1, Math.floor(hauteur / HAUTEUR_LOGIQUE));
  const bas = ctxBas.canvas;
  bas.width = Math.ceil(largeur / zoom);
  bas.height = Math.ceil(hauteur / zoom);

  ctxBas.fillStyle = css(FOND);
  ctxBas.fillRect(0, 0, bas.width, bas.height);
  ctxBas.fillStyle = css(TITRE);
  ctxBas.font = 'bold 16px monospace';
  ctxBas.textAlign = 'center';
  ctxBas.textBaseline = 'middle';
  ctxBas.fillText(t('jeu.titre'), Math.floor(bas.width / 2), Math.floor(bas.height / 2));
  binariser(ctxBas);

  ctxEcran.imageSmoothingEnabled = false;
  ctxEcran.drawImage(bas, 0, 0, bas.width * zoom, bas.height * zoom);
}

/** Supprime l'anticrénelage du texte : chaque pixel prend soit la couleur du fond, soit celle du titre. */
function binariser(ctxBas: CanvasRenderingContext2D): void {
  const { width, height } = ctxBas.canvas;
  const image = ctxBas.getImageData(0, 0, width, height);
  const d = image.data;
  // Seuil à mi-chemin sur le canal rouge, le plus contrasté entre les deux couleurs.
  const seuil = (FOND[0] + TITRE[0]) / 2;
  for (let i = 0; i < d.length; i += 4) {
    const [r, v, b] = (d[i] ?? 0) < seuil ? FOND : TITRE;
    d[i] = r;
    d[i + 1] = v;
    d[i + 2] = b;
    d[i + 3] = 255;
  }
  ctxBas.putImageData(image, 0, 0);
}

const redessiner = (): void => { dessiner(canvas, ctx, ctxTampon); };
window.addEventListener('resize', redessiner);
redessiner();
