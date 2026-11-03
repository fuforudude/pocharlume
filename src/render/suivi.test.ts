import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { VERSION_DONNEES } from '../data/version';
import { avancer, casesLibres, creerPartie } from '../engine';
import type { AtlasRendu, SpriteAtlas } from './atlas';
import { PoolEffets, TYPE_EFFET } from './effets';
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

describe('Suivi : amélioration d’une tour', () => {
  /** Une tour de tir posée puis améliorée ; rend le suivi, le pool et le visuel de la tour après l’amélioration. */
  function ameliorer(reduit: boolean) {
    const effets = new PoolEffets(16);
    const suivi = new Suivi(ATLAS, effets);
    suivi.animationsReduites = () => reduit;
    const etat = partie();
    etat.aretes = 10_000;
    etat.config.infini = { region: 1 };
    const c = casesLibres(etat)[0];
    if (!c) throw new Error('aucune case libre');
    avancer(etat, [{ type: 'construire', cx: c.cx, cy: c.cy, tour: 'tir' }]);
    suivi.apresPas(etat, 0);
    expect(effets.actifs).toBeGreaterThan(0);
    for (const e of effets.liste) e.actif = false;
    const res = avancer(etat, [{ type: 'ameliorer', cx: c.cx, cy: c.cy }]);
    expect(res[0]).toEqual({ ok: true });
    suivi.apresPas(etat, 1000);
    const tour = suivi.tours.values().next().value;
    if (!tour) throw new Error('tour absente');
    return { effets, tour };
  }

  it('anneau, poussière, flash et sursaut', () => {
    const { effets, tour } = ameliorer(false);
    expect(effets.liste.filter((e) => e.actif && e.type === TYPE_EFFET.anneau)).toHaveLength(1);
    expect(effets.liste.filter((e) => e.actif && e.type === TYPE_EFFET.poussiere)).toHaveLength(1);
    expect(tour.sursautDebut).toBe(1000);
    expect(tour.flashDebut).toBe(1000);
  });

  it('en réduisant les animations, seulement la poussière', () => {
    const { effets, tour } = ameliorer(true);
    expect(effets.liste.filter((e) => e.actif && e.type === TYPE_EFFET.anneau)).toHaveLength(0);
    expect(effets.liste.filter((e) => e.actif && e.type === TYPE_EFFET.poussiere)).toHaveLength(1);
    expect(tour.sursautDebut).toBeLessThan(0);
    expect(tour.flashDebut).toBeLessThan(0);
  });
});
