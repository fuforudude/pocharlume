import { describe, expect, it } from 'vitest';
import { appliquerAction, creerPartie, step } from '../engine';
import { CONFIG, avancerSecondes } from '../engine/aides.test-utils';
import { niveauDynamique } from '../engine/evenements-niveau/niveaux-essai.test-utils';
import { ESSAI_EVENEMENTS } from '../ui/niveau-essai-evenements';
import { DessinEvenementsNiveau } from './evenements-niveau';

/** Un faux contexte 2D qui retient les rectangles peints et leur couleur. */
function fauxContexte(): { ctx: CanvasRenderingContext2D; rects: { x: number; y: number; l: number; h: number; couleur: string }[] } {
  const rects: { x: number; y: number; l: number; h: number; couleur: string }[] = [];
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, l: number, h: number) {
      rects.push({ x, y, l, h, couleur: this.fillStyle });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, rects };
}

describe('rendu des événements et des foules', () => {
  it('peint la zone d’une foule prête en jaune, puis en gris pendant sa recharge', () => {
    const etat = creerPartie(niveauDynamique({ foules: [{ cases: [{ cx: 5, cy: 3 }], condition: { type: 'payer', cout: 10 }, effet: { type: 'ralentir', rayon: 2, facteur: 0.5, duree: 2 }, recharge: 5 }] }), CONFIG);
    const { ctx, rects } = fauxContexte();
    const dessin = new DessinEvenementsNiveau(ctx);
    dessin.dessinerSol(etat, 0, 0);
    expect(rects.some((r) => r.x === 160 && r.y === 96 && r.l === 32 && r.couleur.includes('244, 196, 64'))).toBe(true);
    expect(appliquerAction(etat, { type: 'activerFoule', foule: 0 }).ok).toBe(true);
    step(etat);
    rects.length = 0;
    dessin.dessinerSol(etat, 0, 0);
    expect(rects.some((r) => r.x === 160 && r.y === 96 && r.l === 32 && r.couleur.includes('130, 130, 140'))).toBe(true);
  });

  it('montre un chemin mobile fermé, une coupure et le jet du canon à eau', () => {
    const etat = creerPartie(
      niveauDynamique({
        mobiles: [1],
        cheminsFermes: [{ chemin: 1, repli: 0 }],
        evenements: [
          { vague: 1, type: 'nasse', chemin: 0, debut: 5, longueur: 2, duree: 5 },
          { vague: 1, type: 'canon_a_eau', cy: 8, recul: 1, etourdissement: 1 },
        ],
      }),
      CONFIG,
    );
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const { ctx, rects } = fauxContexte();
    const dessin = new DessinEvenementsNiveau(ctx);
    let temps = 0;
    for (let i = 0; i < 95; i++) {
      step(etat);
      temps += 1000 / 30;
      dessin.apresPas(etat, temps);
    }
    dessin.dessinerSol(etat, 0, 0);
    dessin.dessinerDessus(etat, temps + 100, 0, 0);
    expect(rects.some((r) => r.couleur.includes('16, 14, 20'))).toBe(true);
    expect(rects.some((r) => r.couleur.includes('214, 48, 48'))).toBe(true);
    expect(rects.some((r) => r.couleur.includes('96, 170, 255'))).toBe(true);
  });

  it('le niveau d’essai du développement est valide et se joue sans erreur', () => {
    const etat = creerPartie(ESSAI_EVENEMENTS.niveau, CONFIG);
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const { ctx } = fauxContexte();
    const dessin = new DessinEvenementsNiveau(ctx);
    for (let s = 0; s < 120 && etat.statut === 'en_cours'; s++) {
      avancerSecondes(etat, 1);
      if (etat.vagues.paquets.length === 0) appliquerAction(etat, { type: 'appelerVague' });
      dessin.apresPas(etat, s * 1000);
      dessin.dessinerSol(etat, 0, 0);
    }
    expect(etat.dynamique.evenements.filter((e) => e.declenche).length).toBeGreaterThanOrEqual(5);
  });
});
