// Les 10 niveaux de la région 1 sont jouables de bout en bout : le bot soigneux du simulateur gagne en Matou,
// et sans aucune tour on perd. Le réglage fin de la difficulté (bandes de victoire de chaque bot dans chaque
// difficulté) est vérifié par src/equilibrage/bandes-*.test.ts ; ici, seulement la garantie qu'un niveau n'est
// ni impossible ni gagné d'avance. Les niveaux 101 à 110 (région 11, à gimmicks) se jouent jusqu'au bout sans erreur avec le plan
// de construction fixe, radeau compris ; leurs bots et leur équilibrage viennent avec la tâche suivante.
import { describe, expect, it } from 'vitest';
import type { Action } from '../../engine/actions';
import { rejouer, serialiser } from '../../engine/partie';
import { creerBotSoigneux, optimiserBot } from '../../equilibrage/bot-soigneux';
import { GRAINES_ENTRAINEMENT } from '../../equilibrage/campagne';
import { jouerPartie } from '../../equilibrage/simulation';
import { CONFIG_MATOU, jouer, planDeConstruction } from './bot.test-utils';
import { REGIONS } from './campagne';
import { REGION1 } from './region1';

describe('les niveaux de la région 11 se jouent jusqu’au bout', () => {
  for (const campagne of REGIONS[10] ?? []) {
    it(`niveau ${String(campagne.numero)} (${campagne.niveau.gimmick?.type ?? 'sans gimmick'}) : partie finie sans erreur, rejouable à l’identique`, () => {
      // Sur un niveau à Radeau, le plan commence par une tour de tir et une de magie sur le radeau, améliorées ensuite.
      const radeau: Action[] = campagne.niveau.gimmick?.type === 'radeau'
        ? [{ type: 'construire', place: 0, tour: 'tir' }, { type: 'construire', place: 1, tour: 'magie' }, { type: 'ameliorer', place: 0 }, { type: 'ameliorer', place: 1 }]
        : [];
      const bilan = jouer(campagne.niveau, [...radeau, ...planDeConstruction(campagne.niveau)]);
      expect(['victoire', 'defaite']).toContain(bilan.statut);
      if (radeau.length > 0) expect(bilan.etat.tours.some((t) => t.place >= 0), 'tour sur le radeau').toBe(true);
      expect(serialiser(rejouer(campagne.niveau, CONFIG_MATOU, bilan.etat.journal))).toBe(serialiser(bilan.etat));
    }, 120_000);
  }
});

/** Version complète (graines 7, 8 et 9) : seulement par `npm run test:equilibrage`. La suite habituelle joue la graine 7 : sur les 2 cœurs
 * d'une machine GitHub (dix fois plus lents qu'un poste de dev), les trois graines dépassaient 180 s dès les niveaux 6 à 8. */
const COMPLET = Boolean(process.env['EQUILIBRAGE_COMPLET']);
const GRAINES_GAGNEES = COMPLET ? [7, 8, 9] : [7];
const DELAI_PARTIE_LONGUE = COMPLET ? 900_000 : 600_000;

describe('les niveaux de la région 1 se jouent', () => {
  for (const campagne of REGION1) {
    it(`niveau ${String(campagne.numero)} : le bot soigneux gagne en Matou${COMPLET ? ', quelle que soit la graine' : ' (graine 7 ; les trois graines : npm run test:equilibrage)'}`, () => {
      // Matou est assez dur pour que le bot sans recherche perde parfois : on joue la variante retenue à l'entraînement, comme le simulateur.
      const { variante } = optimiserBot(campagne.niveau, 'matou', GRAINES_ENTRAINEMENT);
      for (const graine of GRAINES_GAGNEES) {
        const bilan = jouerPartie(campagne.niveau, creerBotSoigneux({ variante }), { graine, difficulte: 'matou' });
        expect(bilan.statut, `graine ${String(graine)}`).toBe('victoire');
        expect(bilan.etoiles).toBeGreaterThanOrEqual(1);
      }
    }, DELAI_PARTIE_LONGUE);

    it(`niveau ${String(campagne.numero)} : sans aucune tour, on perd en Matou`, () => {
      expect(jouer(campagne.niveau, null).statut).toBe('defaite');
    });
  }

  it('la partie est rejouable à l’identique à partir de son journal (niveau 3, une horde)', () => {
    const campagne = REGION1[2];
    if (!campagne) throw new Error('niveau 3 absent');
    const bilan = jouer(campagne.niveau, planDeConstruction(campagne.niveau));
    expect(bilan.etat.journal.length).toBeGreaterThan(8);
    const rejoue = rejouer(campagne.niveau, CONFIG_MATOU, bilan.etat.journal);
    expect(serialiser(rejoue)).toBe(serialiser(bilan.etat));
  });

  it('la partie est rejouable à l’identique sur un niveau à ennemis renforcés (niveau 5, facteur de PV dans les paquets)', () => {
    const campagne = REGION1[4];
    if (!campagne) throw new Error('niveau 5 absent');
    expect(campagne.niveau.vagues.some((v) => v.paquets.some((p) => (p.facteurPv ?? 1) > 1))).toBe(true);
    // Le plan de construction fixe perd ce niveau : peu d'actions suffisent (le Coupe-Bourse vole des arêtes au passage), le rejeu doit tout de même être exact.
    const bilan = jouer(campagne.niveau, planDeConstruction(campagne.niveau));
    expect(bilan.etat.journal.length).toBeGreaterThanOrEqual(2);
    const rejoue = rejouer(campagne.niveau, CONFIG_MATOU, bilan.etat.journal);
    expect(serialiser(rejoue)).toBe(serialiser(bilan.etat));
  });
});
