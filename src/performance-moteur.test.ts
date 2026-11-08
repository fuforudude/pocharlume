// Banc léger du moteur : 150 ennemis et 30 tours. Cible 2 ms par pas dans Node ; le seuil du test est
// large (10 ms) pour que `npm run verifier` reste stable sur une machine chargée.
// Hors de src/engine : le moteur n'a pas le droit de lire l'horloge, le banc si.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from './data/ennemis';
import { CONFIG } from './engine/aides.test-utils';
import { casesInterditesDuNiveau } from './data/niveaux/grille-niveau';
import type { CaseGrille, IdFamille, Niveau } from './engine/definitions';
import { ajouterEnnemi } from './engine/ennemis';
import type { ConfigPartie, EtatPartie } from './engine/etat';
import { appliquerAction, creerPartie, step } from './engine/partie';

/** Axes des quatre lignes du serpentin : impairs, donc chacun n'interdit qu'une ligne de cases (lignes 1, 3, 5 et 7). */
const LIGNES = [3, 7, 11, 15];

function niveauBanc(): Niveau {
  // Serpentin sur 4 lignes ; 30 cases entre les lignes (3 rangées de 10), chacune à 2 tuiles d'un axe.
  const points = LIGNES.flatMap((y, i) => (i % 2 === 0 ? [{ x: 0, y }, { x: 31, y }] : [{ x: 31, y }, { x: 0, y }]));
  const carte = { largeur: 32, hauteur: 18, chemins: [{ points }], departHeros: { x: 16, y: 7 } };
  return {
    id: 'banc',
    aretesDepart: 100000,
    carte,
    casesInterdites: casesInterditesDuNiveau(carte, [], []),
    vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 0, chemin: 0, delai: 3600 }] }],
  };
}

/** Les 30 cases du banc : les rangées 2, 4 et 6 de la grille, 10 colonnes réparties entre les bords, qui sont traversés par les liaisons du serpentin. */
function casesDuBanc(): CaseGrille[] {
  const cases: CaseGrille[] = [];
  for (const cy of [2, 4, 6]) for (let i = 0; i < 10; i++) cases.push({ cx: 1 + Math.floor(i * 1.4), cy });
  return cases;
}

/** Prépare le banc (30 tours, 150 ennemis) et mesure 600 pas. `divine` : la tour divine du dieu sur la case 1. */
function mesurer(config: ConfigPartie, divine: boolean): { parPas: number; etat: EtatPartie } {
  const niveau = niveauBanc();
  const etat = creerPartie(niveau, config);
  const familles: IdFamille[] = ['caserne', 'tir', 'magie', 'artillerie'];
  casesDuBanc().forEach(({ cx, cy }, i) => {
    if (divine && i === 1) {
      appliquerAction(etat, { type: 'construire', cx, cy, tour: 'divine' });
      return;
    }
    appliquerAction(etat, { type: 'construire', cx, cy, tour: familles[i % 4] ?? 'tir' });
    appliquerAction(etat, { type: 'ameliorer', cx, cy });
    appliquerAction(etat, { type: 'ameliorer', cx, cy });
    if (i % 3 === 0) {
      appliquerAction(etat, { type: 'specialiser', cx, cy, voie: i % 2 === 0 ? 'A' : 'B' });
      const competence = etat.tours.find((t) => t.cx === cx && t.cy === cy)?.stats.competences[0]?.id;
      if (competence) appliquerAction(etat, { type: 'ameliorerCompetence', cx, cy, competence });
    }
  });
  for (let i = 0; i < 150; i++) {
    ajouterEnnemi(etat, { ...ENNEMIS.paysan_affame, pv: 1e7, vitesse: 0.5 }, 'paysan_affame', 0, (i * 125) / 150);
  }
  expect(etat.tours).toHaveLength(30);

  for (let i = 0; i < 100; i++) step(etat);
  // Un objet et les deux sorts jouent leurs effets pendant la mesure.
  appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 8, y: 7 });
  for (let emplacement = 0; emplacement < 2; emplacement++) appliquerAction(etat, { type: 'lancerSort', emplacement, x: 8, y: 7 });
  const pas = 600;
  const debut = performance.now();
  for (let i = 0; i < pas; i++) step(etat);
  return { parPas: (performance.now() - debut) / pas, etat };
}

describe('performance du moteur', () => {
  it('150 ennemis et 30 tours : moins de 10 ms par pas en moyenne (cible réelle : 2 ms, mesure affichée)', () => {
    const { parPas, etat } = mesurer(CONFIG, false);
    expect(etat.ennemis).toHaveLength(150);
    console.info(`Banc moteur : ${parPas.toFixed(3)} ms par pas (150 ennemis, 30 tours, ${String(etat.unites.length)} unités)`);
    expect(parPas).toBeLessThan(10);
  });

  it.each([
    ['plume', 'suie'],
    ['pollen', 'rouage'],
    ['charlie', 'mastoc'],
  ])('%s avec %s, sa tour divine, ses sorts et un objet : moins de 10 ms par pas', (dieu, heros) => {
    const config: ConfigPartie = { ...CONFIG, dieu, heros, niveauHeros: 6, objets: ['fiole_soufre'] };
    const { parPas, etat } = mesurer(config, true);
    console.info(`Banc ${dieu} : ${parPas.toFixed(3)} ms par pas (${String(etat.unites.length)} unités, ${String(etat.pieges.length)} pièges, ${String(etat.structures.length)} tourelles)`);
    expect(parPas).toBeLessThan(10);
  });
});
