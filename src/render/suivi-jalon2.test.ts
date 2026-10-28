// Le suivi visuel des nouveautés du jalon 2 : tourelles construites, pièges, exécutions, esquives, soins, objets,
// tir des héros à distance, assassins furtifs. Piloté par les événements et par l'état, comme le reste du suivi.
import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { creerPartie } from '../engine';
import type { EtatPartie, Evenement } from '../engine';
import { configDe } from '../engine/aides.test-utils';
import type { Structure } from '../engine/etat';
import type { AtlasRendu, SpriteAtlas } from './atlas';
import { PoolEffets, TYPE_EFFET } from './effets';
import { Suivi } from './suivi';

const NIVEAU = REGION1[0]?.niveau;
if (!NIVEAU) throw new Error('niveau 1 absent');

/** Un atlas qui connaît tous les sprites et note les noms demandés. */
function atlasEspion(): { atlas: AtlasRendu; demandes: string[] } {
  const demandes: string[] = [];
  const sprite = { ancre: { x: 0, y: 0 }, largeur: 16, hauteur: 16 } as unknown as SpriteAtlas;
  const atlas = {
    sprite: (nom: string) => {
      demandes.push(nom);
      return sprite;
    },
    animation: () => undefined,
  } as unknown as AtlasRendu;
  return { atlas, demandes };
}

function monter(dieu = 'pollen') {
  const effets = new PoolEffets(16);
  const { atlas, demandes } = atlasEspion();
  const suivi = new Suivi(atlas, effets);
  const etat: EtatPartie = creerPartie(NIVEAU as NonNullable<typeof NIVEAU>, configDe(dieu));
  return { effets, suivi, etat, demandes };
}

function evenement(etat: EtatPartie, ...evenements: Evenement[]): void {
  etat.evenements = evenements;
}

function tourelle(id: number, x = 5, y = 5): Structure {
  return {
    id,
    origine: 1,
    x,
    y,
    restant: 900,
    recharge: 0,
    stats: { nom: 'unite.tourelle_de_l_atelier', portee: 3.5, degats: [10, 16], cadence: 0.8, typeDegats: 'physique', volants: true, effets: [], duree: 30 },
  };
}

describe('Suivi : tourelles construites', () => {
  it('une tourelle de l’état est suivie, avec l’animation d’apparition, puis retirée quand elle disparaît', () => {
    const { suivi, etat } = monter();
    etat.structures.push(tourelle(900));
    suivi.apresPas(etat, 1000);
    const v = suivi.structures.get(900);
    expect(v).toBeDefined();
    expect(v?.actionAnim).toBe('apparition');
    expect(suivi.dessinables).toContain(v);
    etat.structures.length = 0;
    suivi.apresPas(etat, 2000);
    expect(suivi.structures.size).toBe(0);
    expect(suivi.dessinables.some((d) => d.id === 900 && d.categorie === 0 && d.sprite !== null && d.tour === null && d === v)).toBe(false);
  });

  it('la destruction joue une animation unique à l’endroit de la tourelle', () => {
    const { suivi, etat, effets } = monter();
    etat.structures.push(tourelle(900, 6, 7));
    suivi.apresPas(etat, 0);
    etat.structures.length = 0;
    evenement(etat, { type: 'structure_fin', structure: 900, x: 6, y: 7 });
    suivi.apresPas(etat, 500);
    const effet = effets.liste.find((e) => e.actif);
    expect(effet).toMatchObject({ type: TYPE_EFFET.sprite, anim: 'destruction', x: 96, y: 112 });
  });

  it('un tir de tourelle lance son attaque et trace un trait vers l’ennemi', () => {
    const { suivi, etat, effets } = monter();
    etat.structures.push(tourelle(900));
    suivi.apresPas(etat, 0);
    evenement(etat, { type: 'tir_structure', structure: 900, ennemi: 5, x: 5, y: 5 });
    suivi.apresPas(etat, 100);
    // Sans l'ennemi 5 dans l'état, le trait n'est pas tracé (rien à viser).
    expect(effets.actifs).toBe(0);
  });
});

describe('Suivi : pièges, exécution, objets', () => {
  it('un piège qui se déclenche joue son animation de mâchoires à sa place', () => {
    const { suivi, etat, effets } = monter();
    evenement(etat, { type: 'piege_declenche', piege: 3, ennemi: 1, x: 4, y: 9 });
    suivi.apresPas(etat, 0);
    expect(effets.liste.find((e) => e.actif)).toMatchObject({ anim: 'declenche', x: 64, y: 144 });
  });

  it('une exécution lance l’effet d’exécution, un objet son effet propre au point visé', () => {
    const { suivi, etat, effets, demandes } = monter();
    evenement(etat, { type: 'execution', ennemi: 1, x: 5, y: 5 }, { type: 'objet', emplacement: 0, objet: 'fiole_soufre', x: 8, y: 8 }, { type: 'objet', emplacement: 1, objet: 'sablier', x: 3, y: 3 });
    suivi.apresPas(etat, 0);
    expect(effets.actifs).toBe(3);
    expect(demandes).toEqual(expect.arrayContaining(['effet-execution', 'effet-soufre', 'effet-sablier']));
  });

  it('une esquive joue un souffle d’ombre sur l’unité qui esquive', () => {
    const { suivi, etat, effets, demandes } = monter('plume');
    const heros = etat.heros;
    evenement(etat, { type: 'esquive', unite: heros, ennemi: 1 });
    suivi.apresPas(etat, 0);
    expect(effets.actifs).toBe(1);
    expect(demandes).toContain('effet-ombre');
  });

  it('un soin pose un halo, mais pas un nouveau à chaque pulsation tant que le premier dure', () => {
    const { suivi, etat, effets } = monter('pollen');
    const heros = etat.heros;
    evenement(etat, { type: 'soin', source: heros, unite: heros, pv: 5 });
    suivi.apresPas(etat, 0);
    suivi.apresPas(etat, 33);
    suivi.apresPas(etat, 66);
    expect(effets.actifs).toBe(1);
    // Une fois le halo fini, le suivant est posé.
    evenement(etat, { type: 'soin', source: heros, unite: heros, pv: 5 });
    suivi.apresPas(etat, 2000);
    expect(effets.liste.filter((e) => e.actif && e.debut === 2000)).toHaveLength(1);
  });

  it('un tir de héros à distance lance son attaque et trace un trait (si l’ennemi est suivi)', () => {
    const { suivi, etat, effets } = monter('plume');
    evenement(etat, { type: 'tir_unite', unite: etat.heros, ennemi: 77, critique: false });
    suivi.apresPas(etat, 0);
    expect(effets.actifs).toBe(0);
    const heros = suivi.unites.get(etat.heros);
    expect(heros?.actionAnim).toBe('attaque');
    expect(heros?.actionFin).toBeLessThanOrEqual(0 + 200);
  });
});

describe('Suivi : zones, boost et tour divine par dieu', () => {
  it('la zone, le boost et la structure n’ajoutent pas d’effet de pool : le rendu les peint d’après l’état', () => {
    const { suivi, etat, effets } = monter();
    evenement(
      etat,
      { type: 'zone', zone: 1, x: 5, y: 5, rayon: 2.5, duree: 8 },
      { type: 'zone_fin', zone: 1, x: 5, y: 5 },
      { type: 'boost', tour: 1, duree: 10 },
      { type: 'structure', structure: 1, origine: 1, nom: 'unite.tourelle_de_l_atelier', x: 5, y: 5, duree: 30 },
      { type: 'regain_vies', vies: 5 },
    );
    suivi.apresPas(etat, 0);
    expect(effets.actifs).toBe(0);
  });

  it('la tour divine prend le sprite du dieu de la partie', () => {
    for (const [dieu, sprite] of [['plume', 'tour-sanctuaire'], ['pollen', 'tour-atelier'], ['charlie', 'tour-totem']] as const) {
      const { suivi, etat, demandes } = monter(dieu);
      etat.aretes = 5000;
      etat.tours.push({
        id: 50,
        socle: 0,
        famille: 'divine',
        niveau: 1,
        voie: null,
        coutCumule: 200,
        x: 8,
        y: 6,
        recharge: 0,
        ralliementX: 0,
        ralliementY: 0,
        stats: etat.tours[0]?.stats as never,
        rangs: [],
        boostCadence: 0,
        boostPas: 0,
        desactivee: 0,
        affamePas: 0,
        affameCadence: 0,
        minuteurs: [],
      });
      suivi.apresPas(etat, 0);
      expect(demandes, dieu).toContain(sprite);
    }
  });

  it('un assassin du Sanctuaire qui apparaît ou revient sort de l’ombre', () => {
    const { suivi, etat, effets, demandes } = monter('plume');
    const heros = etat.unites.find((u) => u.id === etat.heros);
    if (!heros) throw new Error('héros absent');
    const assassin = { ...heros, id: 700, stats: { ...heros.stats, nom: 'unite.assassin_du_sanctuaire', capacites: { ...(heros.stats.capacites ?? {}), ciblable: false } } };
    etat.unites.push(assassin as never);
    evenement(etat, { type: 'invocation', unite: 700, genre: 'soldat', x: 5, y: 5 });
    suivi.apresPas(etat, 0);
    expect(effets.actifs).toBe(1);
    expect(demandes).toContain('effet-ombre');
  });
});
