// Le cadrage de la carte du monde garde les nœuds, étoiles comprises, dans la zone visible : celle du canvas moins la bande de
// l'en-tête. Le calcul est celui de l'écran (`cadrerCamera`) sur une vraie caméra ; seule la hauteur de l'en-tête, mesurée dans
// le navigateur (barre, niveau, régions), est fixée ici.
import { describe, expect, it } from 'vitest';
import { NOEUDS_REGIONS_MODERNE } from '../data/niveaux/campagne-moderne';
import { HAUTEUR_CARTE_MONDE, LARGEUR_CARTE_MONDE, NOEUDS_REGION1, type NoeudNiveau } from '../data/niveaux/carte-du-monde';
import { Camera } from './camera';
import { cadrerCamera } from './carte-monde';

interface Ecran {
  readonly nom: string;
  /** Taille de la fenêtre, en pixels CSS. */
  readonly largeur: number;
  readonly hauteur: number;
  /** Pixels physiques par pixel CSS. */
  readonly ratio: number;
  /** Hauteur de l'en-tête, en pixels CSS (mesurée à l'écran : 1280 × 720 sur une ligne de barre, 740 × 360 sur deux). */
  readonly entete: number;
}

const ECRANS: readonly Ecran[] = [
  { nom: '1280×720', largeur: 1280, hauteur: 720, ratio: 1, entete: 110 },
  { nom: '1280×720 (écran 125 %)', largeur: 1280, hauteur: 720, ratio: 1.25, entete: 110 },
  { nom: '740×360', largeur: 740, hauteur: 360, ratio: 2, entete: 143 },
  { nom: '740×360 (ratio 1)', largeur: 740, hauteur: 360, ratio: 1, entete: 143 },
];

const REGIONS: readonly { nom: string; noeuds: readonly NoeudNiveau[] }[] = [
  { nom: 'histoire, région 1', noeuds: NOEUDS_REGION1 },
  { nom: 'DLC, la Fac', noeuds: NOEUDS_REGIONS_MODERNE[0] ?? [] },
  { nom: 'DLC, la Manif', noeuds: NOEUDS_REGIONS_MODERNE[1] ?? [] },
  { nom: 'DLC, la Préfecture', noeuds: NOEUDS_REGIONS_MODERNE[2] ?? [] },
];

/** Ce qui dépasse d'un nœud autour de son centre : le disque (plus grand pour le boss), l'ombre, les étoiles en dessous. */
function emprise(n: NoeudNiveau): { haut: number; bas: number; gauche: number; droite: number } {
  const r = n.boss ? 10 : 7;
  return { haut: r + 4, bas: r + 5 + 5 + 1, gauche: r + 4, droite: r + 4 };
}

/** La caméra telle que l'écran la règle à l'ouverture d'une région : `aVoir` doit tenir, sinon on centre sur `focus`. */
function cadrer(ecran: Ecran, aVoir: readonly NoeudNiveau[], focus: NoeudNiveau): Camera {
  const cam = new Camera(LARGEUR_CARTE_MONDE, HAUTEUR_CARTE_MONDE);
  cam.redimensionner(ecran.largeur * ecran.ratio, ecran.hauteur * ecran.ratio);
  cam.definirMarges(ecran.entete * ecran.ratio, 0, 0, 0);
  cadrerCamera(cam, aVoir, focus, ecran.ratio);
  return cam;
}

function horsZone(cam: Camera, n: NoeudNiveau): string | null {
  const e = emprise(n);
  const haut = cam.y + cam.margeHautLogique;
  const bas = cam.y + cam.vueH;
  const gauche = cam.x;
  const droite = cam.x + cam.vueL;
  const manques: string[] = [];
  if (n.y - e.haut < haut) manques.push('haut');
  if (n.y + e.bas > bas) manques.push('bas');
  if (n.x - e.gauche < gauche) manques.push('gauche');
  if (n.x + e.droite > droite) manques.push('droite');
  return manques.length > 0 ? `nœud ${String(n.numero)} (${String(n.x)}, ${String(n.y)}) coupé par le ${manques.join(' et ')}` : null;
}

describe('cadrage de la carte du monde', () => {
  for (const ecran of ECRANS) {
    for (const region of REGIONS) {
      describe(`${region.nom}, ${ecran.nom}`, () => {
        it('toute la région (nœuds ouverts + le suivant) tient dans la zone visible, étoiles comprises, à 1280 × 720', () => {
          if (ecran.largeur !== 1280) return;
          const cam = cadrer(ecran, region.noeuds, region.noeuds[0] as NoeudNiveau);
          const coupes = region.noeuds.map((n) => horsZone(cam, n)).filter((m) => m !== null);
          expect(coupes).toEqual([]);
        });

        it('à chaque étape de la progression, le niveau à jouer et les nœuds à voir restent dans la zone visible', () => {
          for (let ouverts = 1; ouverts <= region.noeuds.length; ouverts++) {
            const aVoir = region.noeuds.slice(0, Math.min(ouverts + 1, region.noeuds.length));
            const focus = region.noeuds[ouverts - 1] as NoeudNiveau;
            const cam = cadrer(ecran, aVoir, focus);
            expect(horsZone(cam, focus), `étape ${String(ouverts)}`).toBeNull();
            if (ecran.largeur === 1280) {
              expect(aVoir.map((n) => horsZone(cam, n)).filter((m) => m !== null), `étape ${String(ouverts)}`).toEqual([]);
            }
          }
        });
      });
    }
  }
});
