// Planche d'aperçu du jalon 4 (art/apercu/_jalon4.png) : pour chacune des régions 6 à 10, le décor (grands et petits), le jeu de
// tuiles, les ennemis avec leurs élites et le boss, sur le sol de la région ; puis l'illustration de fin de campagne.
// Sert seulement à juger les sprites en situation.
import type { Couche } from './couche.ts';
import { agrandirImage, poser } from './apercu.ts';
import type { SpriteDessine } from './dessin.ts';
import { nouvelleImage, type Image } from './png.ts';

interface Region {
  readonly numero: number;
  readonly grands: readonly string[];
  readonly petits: readonly string[];
  readonly ennemis: readonly string[];
  readonly boss: string;
}

export const REGIONS_J4: readonly Region[] = [
  { numero: 6, grands: ['arbre-ossements-1', 'arbre-ossements-2', 'mausolee-brise', 'ossuaire'], petits: ['crane-charnier', 'croix-tombale', 'pelle-plantee', 'os-epars'],
    ennemis: ['fossoyeur', 'creux', 'chauve-souris'], boss: 'roi-fosses' },
  { numero: 7, grands: ['tente-croisee-1', 'tente-croisee-2', 'baliste-brisee', 'chariot-armes'], petits: ['banniere-dechiree', 'epee-plantee', 'bouclier-abattu', 'brasero-camp'],
    ennemis: ['fantassin', 'porte-banniere', 'cavalier'], boss: 'prince-croise' },
  { numero: 8, grands: ['arche-cloitre', 'clocher-noir', 'statue-moine', 'fontaine-noire'], petits: ['cierge-noir', 'livre-brule', 'crucifix', 'dalle-gravee'],
    ennemis: ['flagellant', 'inquisiteur', 'exorciste'], boss: 'grand-inquisiteur' },
  { numero: 9, grands: ['tourelle-royale', 'fontaine-royale', 'statue-roi', 'herse-brisee'], petits: ['etendard', 'vase-royal', 'torchere', 'couronne-sol'],
    ennemis: ['garde-royal', 'arbaletrier-elite', 'chevalier'], boss: 'roi-fou' },
  { numero: 10, grands: ['pilier-brise-1', 'pilier-brise-2', 'vitrail-brise', 'autel-bleme', 'statue-ange'], petits: ['cierge-bleme', 'plume-cendre', 'calice-brise', 'dalle-solaire'],
    ennemis: ['acolyte-cendre', 'ange-cendre'], boss: 'soleil-bleme' },
];

/** Noms des tuiles montrées pour une région, dans l'ordre. */
const TUILES = [
  'herbe-1', 'herbe-2', 'herbe-3', 'chemin-1', 'chemin-2', 'chemin-bord-n', 'chemin-coin-ext-no', 'chemin-coin-int-no',
  'boue-1', 'boue-2', 'paves-1', 'paves-2',
] as const;

const LARGEUR = 340;
const HAUT_DECOR = 50;
const HAUT_TUILES = 18;
const HAUT_CREATURES = 68;
const HAUT_REGION = HAUT_DECOR + HAUT_TUILES + HAUT_CREATURES;

export const ILLUSTRATION_FIN = 'fin-campagne';

export function planJalon4(sprites: readonly SpriteDessine[], illustrations: readonly SpriteDessine[] = [], facteur = 3): Image {
  const parNom = new Map(sprites.map((s) => [s.nom, s]));
  const cadre = (nom: string, anim = 'repos', indice = 0): Couche | undefined => {
    const a = parNom.get(nom)?.anims.find((x) => x.nom === anim);
    return a?.cadres[Math.min(indice, (a.cadres.length || 1) - 1)]?.couche;
  };
  const pose = (nom: string, x: number, y: number, anim = 'repos', indice = 0): void => {
    const s = parNom.get(nom);
    const c = cadre(nom, anim, indice);
    if (s && c) poser(image, c, x - s.ancre[0], y - s.ancre[1]);
  };
  const illustration = illustrations.find((s) => s.nom === ILLUSTRATION_FIN);
  const haut = REGIONS_J4.length * HAUT_REGION + (illustration ? illustration.hauteur + 4 : 0);
  const image = nouvelleImage(LARGEUR, haut);

  REGIONS_J4.forEach((region, r) => {
    const y0 = r * HAUT_REGION;
    const tuile = (base: string): Couche | undefined => cadre(`r${String(region.numero)}-${base}`);
    // Fond : herbe de la région, un chemin sous les créatures.
    for (let y = 0; y < HAUT_REGION; y += 16) {
      for (let x = 0; x < LARGEUR; x += 16) {
        const sur = y >= HAUT_DECOR + HAUT_TUILES + 24;
        const t = sur ? tuile('chemin-1') : tuile(`herbe-${String(1 + (((x >> 4) * 7 + (y >> 4) * 13) % 5 === 0 ? 1 : 0))}`);
        if (t) poser(image, t, x, y0 + y);
      }
    }
    // Décor : les grands, puis les petits.
    region.grands.forEach((nom, i) => { pose(nom, 18 + i * 34, y0 + HAUT_DECOR - 1); });
    region.petits.forEach((nom, i) => { pose(nom, 18 + region.grands.length * 34 + 10 + i * 22, y0 + HAUT_DECOR - 1); });
    // Tuiles.
    TUILES.forEach((nom, i) => { const t = tuile(nom); if (t) poser(image, t, 2 + i * 17, y0 + HAUT_DECOR + 1); });
    // Créatures : ennemis normaux, leurs élites, puis le boss.
    const base = y0 + HAUT_DECOR + HAUT_TUILES + HAUT_CREATURES - 4;
    let x = 16;
    for (const nom of region.ennemis) { pose(nom, x, base); x += 26; }
    for (const nom of region.ennemis) { pose(`${nom}-elite`, x, base); x += 26; }
    pose(region.boss, Math.max(x + 24, LARGEUR - 40), base);
  });

  if (illustration) {
    const c = illustration.anims[0]?.cadres[0]?.couche;
    if (c) poser(image, c, Math.floor((LARGEUR - illustration.largeur) / 2), REGIONS_J4.length * HAUT_REGION + 2);
  }
  return agrandirImage(image, facteur);
}
