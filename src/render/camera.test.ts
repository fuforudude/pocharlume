import { describe, expect, it } from 'vitest';
import { Camera } from './camera';

const MONDE_L = 512;
const MONDE_H = 288;

function camera(ecranL: number, ecranH: number): Camera {
  const c = new Camera(MONDE_L, MONDE_H);
  c.redimensionner(ecranL, ecranH);
  return c;
}

describe('Camera : choix du zoom', () => {
  it('bureau 1920×1080 : zoom 3 montre toute la carte, avec des bandes', () => {
    const c = camera(1920, 1080);
    expect(c.zoomMin).toBe(3);
    expect(c.zoom).toBe(3);
    expect(c.vueL * c.zoom).toBeGreaterThanOrEqual(1920);
    expect(c.vueL).toBeGreaterThan(MONDE_L);
  });

  it('téléphone en paysage à 2,6 pixels par pixel CSS (2112×975) : zoom 3, carte entière', () => {
    const c = camera(2112, 975);
    expect(c.zoomMin).toBe(3);
    expect(c.zoom).toBe(3);
  });

  it('petit écran 812×375 sans ratio : on part à 2 plutôt qu’à 1, et on peut revenir à 1', () => {
    const c = camera(812, 375);
    expect(c.zoomMin).toBe(1);
    expect(c.zoom).toBe(2);
    expect(c.definirZoom(1, 0, 0)).toBe(true);
    expect(c.zoom).toBe(1);
  });

  it('fenêtre plus petite que la carte : zoom 1', () => {
    const c = camera(300, 200);
    expect(c.zoom).toBe(1);
    expect(c.zoomMin).toBe(1);
  });

  it('le zoom est toujours un entier, dans les paliers', () => {
    for (const [l, h] of [[640, 360], [1280, 720], [2560, 1440], [3840, 2160], [2400, 1080]] as const) {
      const c = camera(l, h);
      expect(Number.isInteger(c.zoom)).toBe(true);
      expect(c.zoom).toBeGreaterThanOrEqual(c.zoomMin);
      expect(c.zoom).toBeLessThanOrEqual(c.zoomMax);
    }
  });

  it('une redimensionnement garde le zoom choisi tant qu’il reste permis', () => {
    const c = camera(1920, 1080);
    c.definirZoom(5, 0, 0);
    c.redimensionner(1920, 1000);
    expect(c.zoom).toBe(5);
    c.redimensionner(800, 450);
    expect(c.zoom).toBeLessThanOrEqual(c.zoomMax);
    expect(c.zoom).toBeGreaterThanOrEqual(c.zoomMin);
  });
});

describe('Camera : bornes', () => {
  it('centre la carte quand elle tient dans la vue', () => {
    const c = camera(1920, 1080);
    expect(c.x).toBeLessThan(0);
    expect(c.versEcranX(0)).toBeGreaterThan(0);
    expect(c.versEcranX(MONDE_L)).toBeLessThan(1920);
    c.deplacer(500, 500);
    expect(c.x).toBe((MONDE_L - c.vueL) / 2);
  });

  it('ne sort jamais de la carte quand on est zoomé', () => {
    const c = camera(1920, 1080);
    c.definirZoom(6, 960, 540);
    c.deplacer(100_000, 100_000);
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    c.deplacer(-100_000, -100_000);
    expect(c.x).toBe(MONDE_L - c.vueL);
    expect(c.y).toBe(MONDE_H - c.vueH);
  });

  it('glisser vers la droite fait apparaître la gauche de la carte', () => {
    const c = camera(812, 375);
    c.deplacer(-10_000, 0);
    const avant = c.x;
    c.deplacer(40, 0);
    expect(c.x).toBe(avant - 40 / c.zoom);
  });

  it('la vue reste dans la carte après chaque zoom', () => {
    const c = camera(812, 375);
    for (const z of [1, 2, 3, 4, 3, 2]) {
      c.definirZoom(z, 800, 370);
      if (c.mondeL > c.vueL) {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.x).toBeLessThanOrEqual(c.mondeL - c.vueL);
      }
      if (c.mondeH > c.vueH) {
        expect(c.y).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeLessThanOrEqual(c.mondeH - c.vueH);
      }
    }
  });
});

describe('Camera : zoom', () => {
  it('borne le zoom aux paliers', () => {
    const c = camera(1920, 1080);
    expect(c.definirZoom(99, 0, 0)).toBe(true);
    expect(c.zoom).toBe(c.zoomMax);
    expect(c.definirZoom(99, 0, 0)).toBe(false);
    c.definirZoom(0, 0, 0);
    expect(c.zoom).toBe(c.zoomMin);
  });

  it('arrondit un zoom fractionnaire à l’entier le plus proche', () => {
    const c = camera(1920, 1080);
    c.definirZoom(4.4, 0, 0);
    expect(c.zoom).toBe(4);
    c.definirZoom(5.6, 0, 0);
    expect(c.zoom).toBe(6);
  });

  it('garde le même point de la carte sous le foyer', () => {
    const c = camera(2112, 975);
    c.definirZoom(5, 0, 0);
    c.deplacer(-300, -100);
    const foyerX = 1200;
    const foyerY = 500;
    const avantX = c.versMondeX(foyerX);
    const avantY = c.versMondeY(foyerY);
    c.definirZoom(6, foyerX, foyerY);
    expect(Math.abs(c.versMondeX(foyerX) - avantX)).toBeLessThan(1);
    expect(Math.abs(c.versMondeY(foyerY) - avantY)).toBeLessThan(1);
  });

  it('molette : un cran (100) change d’un palier, vers le haut zoome', () => {
    const c = camera(1920, 1080);
    const z = c.zoom;
    expect(c.molette(-100, 960, 540)).toBe(true);
    expect(c.zoom).toBe(z + 1);
    expect(c.molette(100, 960, 540)).toBe(true);
    expect(c.zoom).toBe(z);
  });

  it('molette : les petits défilements d’un pavé tactile s’additionnent', () => {
    const c = camera(1920, 1080);
    const z = c.zoom;
    expect(c.molette(-20, 0, 0)).toBe(false);
    expect(c.molette(-20, 0, 0)).toBe(false);
    expect(c.zoom).toBe(z);
    expect(c.molette(-25, 0, 0)).toBe(true);
    expect(c.zoom).toBe(z + 1);
  });

  it('pincement : écarter les doigts zoome, les rapprocher dézoome, par paliers entiers', () => {
    const c = camera(1920, 1080);
    c.definirZoom(4, 0, 0);
    c.debutPincement();
    expect(c.pincement(1.1, 960, 540)).toBe(false);
    expect(c.zoom).toBe(4);
    expect(c.pincement(1.5, 960, 540)).toBe(true);
    expect(c.zoom).toBe(6);
    expect(c.pincement(0.5, 960, 540)).toBe(true);
    expect(c.zoom).toBe(2 >= c.zoomMin ? 2 : c.zoomMin);
    c.debutPincement();
    expect(c.pincement(1, 960, 540)).toBe(false);
  });
});

describe('Camera : conversions', () => {
  it('écran vers monde et retour sont inverses', () => {
    const c = camera(2112, 975);
    c.definirZoom(5, 400, 300);
    c.deplacer(-120, -60);
    for (const [wx, wy] of [[0, 0], [100, 50], [511, 287]] as const) {
      expect(c.versMondeX(c.versEcranX(wx))).toBeCloseTo(wx, 6);
      expect(c.versMondeY(c.versEcranY(wy))).toBeCloseTo(wy, 6);
    }
  });

  it('le décalage de dessin est entier : les pixels restent nets', () => {
    const c = camera(812, 375);
    c.deplacer(-3.3, -7.9);
    expect(Number.isInteger(c.decalageX)).toBe(true);
    expect(Number.isInteger(c.decalageY)).toBe(true);
  });
});

describe('Camera : marges du HUD', () => {
  // iPhone en paysage : 844×390 pixels CSS à un ratio de 3.
  const ECRAN_L = 844 * 3;
  const ECRAN_H = 390 * 3;
  const MARGES = { haut: 52 * 3, bas: 78 * 3, gauche: 0, droite: 0 };

  function avecMarges(l = ECRAN_L, h = ECRAN_H): Camera {
    const c = camera(l, h);
    c.definirMarges(MARGES.haut, MARGES.bas, MARGES.gauche, MARGES.droite);
    return c;
  }

  it('sans marge, rien ne change : la carte ne dépasse jamais de la vue', () => {
    const c = camera(ECRAN_L, ECRAN_H);
    c.definirZoom(c.zoomMax, 0, 0);
    c.deplacer(100_000, 100_000);
    expect(c.y).toBe(0);
    c.deplacer(-100_000, -100_000);
    expect(c.y).toBe(MONDE_H - c.vueH);
  });

  it('la vue peut dépasser le bord haut de la carte de la hauteur de la barre du haut', () => {
    const c = avecMarges();
    c.deplacer(0, 100_000);
    expect(c.versEcranY(0)).toBeGreaterThanOrEqual(MARGES.haut - 2 * c.zoom);
    expect(c.versEcranY(0)).toBeLessThanOrEqual(MARGES.haut + 2 * c.zoom);
  });

  it('la vue peut dépasser le bord bas de la carte de la hauteur de la barre du bas', () => {
    const c = avecMarges();
    c.deplacer(0, -100_000);
    expect(c.versEcranY(MONDE_H)).toBeLessThanOrEqual(ECRAN_H - MARGES.bas + 2 * c.zoom);
    expect(c.versEcranY(MONDE_H)).toBeGreaterThanOrEqual(ECRAN_H - MARGES.bas - 2 * c.zoom);
  });

  it('tout point de la carte peut être amené dans la zone libre entre les barres, à tous les zooms', () => {
    for (const [l, h] of [[ECRAN_L, ECRAN_H], [844, 390], [1920, 1080], [2400, 1080]] as const) {
      const base = camera(l, h);
      const echelle = l === ECRAN_L ? 3 : 1;
      for (let z = base.zoomMin; z <= base.zoomMax; z++) {
        const c = camera(l, h);
        c.definirMarges(52 * echelle, 78 * echelle, 0, 0);
        c.definirZoom(z, l / 2, h / 2);
        const hautZone = 52 * echelle;
        const basZone = h - 78 * echelle;
        for (const wy of [0, 1.5 * 16]) {
          c.deplacer(0, 100_000);
          const ecranY = c.versEcranY(wy);
          expect(ecranY, `zoom ${String(z)} haut y=${String(wy)}`).toBeGreaterThanOrEqual(hautZone - 2 * c.zoom);
          expect(ecranY, `zoom ${String(z)} haut y=${String(wy)}`).toBeLessThanOrEqual(basZone);
        }
        for (const wy of [MONDE_H - 1.5 * 16, MONDE_H]) {
          c.deplacer(0, -100_000);
          const ecranY = c.versEcranY(wy);
          expect(ecranY, `zoom ${String(z)} bas y=${String(wy)}`).toBeLessThanOrEqual(basZone + 2 * c.zoom);
          expect(ecranY, `zoom ${String(z)} bas y=${String(wy)}`).toBeGreaterThanOrEqual(hautZone);
        }
      }
    }
  });

  it('les marges horizontales (encoche) jouent de la même façon', () => {
    const c = camera(ECRAN_L, ECRAN_H);
    c.definirMarges(0, 0, 47 * 3, 47 * 3);
    c.definirZoom(c.zoomMax, 0, 0);
    c.deplacer(100_000, 0);
    expect(Math.abs(c.versEcranX(0) - 47 * 3)).toBeLessThanOrEqual(2 * c.zoom);
    c.deplacer(-100_000, 0);
    expect(Math.abs(c.versEcranX(MONDE_L) - (ECRAN_L - 47 * 3))).toBeLessThanOrEqual(2 * c.zoom);
  });

  it('quand la carte tient entre les barres, elle est centrée dans la zone libre', () => {
    const c = camera(1920, 1080);
    c.definirMarges(100, 40, 0, 0);
    const haut = c.versEcranY(0);
    const bas = 1080 - c.versEcranY(MONDE_H);
    // Espace libre au-dessus de la carte : (zone libre - carte) / 2 en plus de la marge du haut.
    expect(Math.abs((haut - 100) - (bas - 40))).toBeLessThanOrEqual(2 * c.zoom);
  });

  it('ignore une marge négative ou qui n’est pas un nombre', () => {
    const c = camera(ECRAN_L, ECRAN_H);
    c.definirMarges(-5, Number.NaN, Number.POSITIVE_INFINITY, -1);
    c.deplacer(100_000, 100_000);
    expect(Number.isFinite(c.x)).toBe(true);
    expect(Number.isFinite(c.y)).toBe(true);
  });

  it('un changement de taille garde les marges et reste dans les bornes', () => {
    const c = avecMarges();
    c.redimensionner(ECRAN_L, ECRAN_H - 90);
    c.deplacer(0, 100_000);
    expect(c.versEcranY(0)).toBeLessThanOrEqual(MARGES.haut + 2 * c.zoom);
  });
});
