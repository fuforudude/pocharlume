import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { VERSION_DONNEES } from '../data/version';
import { creerPartie } from '../engine';
import type { AtlasRendu, SpriteAtlas } from './atlas';
import { PoolEffets } from './effets';
import { Suivi } from './suivi';

const NIVEAU = REGION1[0]?.niveau;
if (!NIVEAU) throw new Error('niveau 1 absent');

/** Un atlas qui connaît tous les sprites : les événements peuvent alors lancer leurs effets. */
const SPRITE = { ancre: { x: 0, y: 0 }, largeur: 16, hauteur: 16 } as unknown as SpriteAtlas;
const ATLAS = { sprite: () => SPRITE, animation: () => undefined } as unknown as AtlasRendu;

function partie() {
  return creerPartie(NIVEAU as NonNullable<typeof NIVEAU>, { graine: 1, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES });
}

describe('Suivi : événements du pas', () => {
  it('un impact lance son effet', () => {
    const effets = new PoolEffets(8);
    const suivi = new Suivi(ATLAS, effets);
    const etat = partie();
    etat.evenements = [{ type: 'impact', projectile: 1, tour: -1, x: 5, y: 5, zone: 0 }];
    suivi.apresPas(etat, 0);
    expect(effets.actifs).toBe(1);
  });

  it('sans les événements (partie reprise), l’état est suivi mais aucun effet ne se déclenche', () => {
    const effets = new PoolEffets(8);
    const suivi = new Suivi(ATLAS, effets);
    const etat = partie();
    etat.evenements = [{ type: 'impact', projectile: 1, tour: -1, x: 5, y: 5, zone: 0 }];
    suivi.apresPas(etat, 0, false);
    expect(effets.actifs).toBe(0);
    // Le héros, lui, est bien suivi.
    expect(suivi.unites.size).toBe(etat.unites.length);
    expect(suivi.dessinables.length).toBeGreaterThan(0);
  });
});
