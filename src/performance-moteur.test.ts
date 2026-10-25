// Banc léger du moteur : 150 ennemis et 30 tours. Cible 2 ms par pas dans Node ; le seuil du test est
// large (10 ms) pour que `npm run verifier` reste stable sur une machine chargée.
// Hors de src/engine : le moteur n'a pas le droit de lire l'horloge, le banc si.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from './data/ennemis';
import { CONFIG } from './engine/aides.test-utils';
import type { IdFamille, Niveau, Socle } from './engine/definitions';
import { ajouterEnnemi } from './engine/ennemis';
import type { ConfigPartie, EtatPartie } from './engine/etat';
import { appliquerAction, creerPartie, step } from './engine/partie';

const LIGNES = [2, 6, 10, 14];

function niveauBanc(): Niveau {
  // Serpentin sur 4 lignes ; 30 socles entre les lignes, ralliement sur la ligne du dessus.
  const points = LIGNES.flatMap((y, i) => (i % 2 === 0 ? [{ x: 0, y }, { x: 31, y }] : [{ x: 31, y }, { x: 0, y }]));
  const socles: Socle[] = [];
  for (const y of [4, 8, 12]) {
    for (let x = 2; x <= 29; x += 3) socles.push({ x, y, ralliement: { x, y: y - 2 } });
  }
  return {
    id: 'banc',
    aretesDepart: 100000,
    carte: { largeur: 32, hauteur: 18, chemins: [{ points }], socles, departHeros: { x: 16, y: 6 } },
    vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 0, chemin: 0, delai: 3600 }] }],
  };
}

/** Prépare le banc (30 tours, 150 ennemis) et mesure 600 pas. `divine` : la tour divine du dieu sur le socle 1. */
function mesurer(config: ConfigPartie, divine: boolean): { parPas: number; etat: EtatPartie } {
  const niveau = niveauBanc();
  const etat = creerPartie(niveau, config);
  const familles: IdFamille[] = ['caserne', 'tir', 'magie', 'artillerie'];
  niveau.carte.socles.forEach((_, socle) => {
    if (divine && socle === 1) {
      appliquerAction(etat, { type: 'construire', socle, tour: 'divine' });
      return;
    }
    appliquerAction(etat, { type: 'construire', socle, tour: familles[socle % 4] ?? 'tir' });
    appliquerAction(etat, { type: 'ameliorer', socle });
    appliquerAction(etat, { type: 'ameliorer', socle });
    if (socle % 3 === 0) {
      appliquerAction(etat, { type: 'specialiser', socle, voie: socle % 2 === 0 ? 'A' : 'B' });
      const competence = etat.tours.find((t) => t.socle === socle)?.stats.competences[0]?.id;
      if (competence) appliquerAction(etat, { type: 'ameliorerCompetence', socle, competence });
    }
  });
  for (let i = 0; i < 150; i++) {
    ajouterEnnemi(etat, { ...ENNEMIS.paysan_affame, pv: 1e7, vitesse: 0.5 }, 'paysan_affame', 0, (i * 125) / 150);
  }
  expect(etat.tours).toHaveLength(30);

  for (let i = 0; i < 100; i++) step(etat);
  // Un objet et les deux sorts jouent leurs effets pendant la mesure.
  appliquerAction(etat, { type: 'utiliserObjet', emplacement: 0, x: 8, y: 6 });
  for (let emplacement = 0; emplacement < 2; emplacement++) appliquerAction(etat, { type: 'lancerSort', emplacement, x: 8, y: 6 });
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
