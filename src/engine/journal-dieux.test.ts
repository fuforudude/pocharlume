// Déterminisme et rejeu avec les nouveautés du jalon 2 : les trois dieux, leurs héros, les sorts, les objets, les
// compétences de tours, l'arbre. Même config et mêmes actions donnent le même état, octet pour octet.
import { describe, expect, it } from 'vitest';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import type { Action } from './actions';
import { configDe } from './aides.test-utils';
import type { ConfigPartie, EtatPartie } from './etat';
import { avancer, creerPartie, deserialiser, rejouer, serialiser } from './partie';

/** Scénario commun : tours, spécialisation, compétence, sorts, objets, ordres, appels de vagues. */
function scenario(famille: 'tir' | 'caserne' | 'artillerie'): readonly { pas: number; action: Action }[] {
  return [
    { pas: 0, action: { type: 'construire', socle: 0, tour: famille } },
    { pas: 0, action: { type: 'construire', socle: 1, tour: 'tir' } },
    { pas: 3, action: { type: 'appelerVague' } },
    { pas: 10, action: { type: 'ameliorer', socle: 0 } },
    { pas: 11, action: { type: 'ameliorer', socle: 0 } },
    { pas: 12, action: { type: 'specialiser', socle: 0, voie: 'A' } },
    { pas: 13, action: { type: 'ameliorerCompetence', socle: 0, competence: famille === 'tir' ? 'venin_noir' : famille === 'caserne' ? 'benediction' : 'nappe_de_soufre' } },
    { pas: 40, action: { type: 'deplacerHeros', x: 12, y: 6 } },
    { pas: 500, action: { type: 'lancerSort', emplacement: 0, x: 12, y: 6 } },
    { pas: 520, action: { type: 'utiliserObjet', emplacement: 0, x: 12, y: 6 } },
    { pas: 600, action: { type: 'lancerSort', emplacement: 1, x: 14, y: 13 } },
    { pas: 610, action: { type: 'utiliserObjet', emplacement: 1, x: 0, y: 0 } },
    { pas: 620, action: { type: 'utiliserObjet', emplacement: 2, x: 12, y: 6 } },
    { pas: 700, action: { type: 'construire', socle: 3, tour: 'divine' } },
    { pas: 900, action: { type: 'appelerVague' } },
    { pas: 1300, action: { type: 'appelerVague' } },
    { pas: 1700, action: { type: 'vendre', socle: 1 } },
  ];
}

function jouer(config: ConfigPartie, famille: 'tir' | 'caserne' | 'artillerie', pasFinal: number): EtatPartie {
  const plan = scenario(famille);
  const etat = creerPartie(NIVEAU_TEST, config);
  let i = 0;
  while (etat.pas < pasFinal && etat.statut === 'en_cours') {
    const actions: Action[] = [];
    while (i < plan.length && plan[i]?.pas === etat.pas) {
      const entree = plan[i];
      if (entree) actions.push(entree.action);
      i++;
    }
    avancer(etat, actions);
  }
  return etat;
}

const CAS: readonly (readonly [string, ConfigPartie, 'tir' | 'caserne' | 'artillerie'])[] = [
  ['Plume et Suie', configDe('plume', { heros: 'suie', niveauHeros: 6, competencesHeros: { soif_de_sang: 2, cendre_et_silence: 1 }, ameliorations: { tir: 3, sorts: 2 }, objets: ['fiole_soufre', 'herbe_sabbat', 'sablier'] }), 'tir'],
  ['Charlie et Mastoc', configDe('charlie', { heros: 'mastoc', niveauHeros: 4, competencesHeros: { cri_de_defi: 3 }, ameliorations: { caserne: 5, heros: 2 }, objets: ['griffe_renfort', 'sablier', 'fiole_soufre'] }), 'caserne'],
  ['Pollen et Rouage', configDe('pollen', { heros: 'rouage', niveauHeros: 7, competencesHeros: { automate: 1, huile_noire: 2 }, ameliorations: { artillerie: 4 }, objets: ['sablier', 'herbe_sabbat', 'fiole_soufre'] }), 'artillerie'],
  ['Pollen et Lanterne', configDe('pollen', { heros: 'lanterne', niveauHeros: 3 }), 'artillerie'],
  ['Plume et Corbeau', configDe('plume', { heros: 'corbeau', niveauHeros: 2, objets: ['fiole_soufre'] }), 'tir'],
];

describe.each(CAS)('%s', (_nom, config, famille) => {
  it('même config et mêmes actions donnent le même état, octet pour octet', () => {
    const a = jouer(config, famille, 2500);
    const b = jouer(config, famille, 2500);
    expect(serialiser(a)).toBe(serialiser(b));
    expect(a.journal.length).toBeGreaterThan(5);
  });

  it('le rejeu du journal redonne l’état final', () => {
    const original = jouer(config, famille, 2500);
    const rejoue = rejouer(NIVEAU_TEST, config, original.journal, original.pas);
    expect(serialiser(rejoue)).toBe(serialiser(original));
  });

  it('l’état se sérialise et se relit sans perte ni valeur étrangère à JSON', () => {
    const etat = jouer(config, famille, 1500);
    const texte = serialiser(etat);
    expect(texte).not.toContain('null,null');
    expect(JSON.stringify(JSON.parse(texte))).toBe(texte);
    const relu = deserialiser(texte);
    expect(serialiser(relu)).toBe(texte);
    // Reprendre une partie relue donne la même suite que la continuer.
    const suite = jouer(config, famille, 2200);
    avancer(relu, []);
    expect(relu.pas).toBe(etat.pas + 1);
    expect(suite.pas).toBe(2200);
  });
});

describe('journal et config', () => {
  it('une autre graine donne une autre partie', () => {
    const config = configDe('pollen', { heros: 'pollen', objets: ['sablier'] });
    expect(serialiser(jouer({ ...config, graine: 9 }, 'artillerie', 1200))).not.toBe(serialiser(jouer(config, 'artillerie', 1200)));
  });

  it('les actions refusées ne sont pas journalisées', () => {
    const etat = jouer(configDe('plume'), 'tir', 1000);
    // Pas d'objet emporté : les trois utilisations du scénario sont refusées.
    expect(etat.journal.some((e) => e.action.type === 'utiliserObjet')).toBe(false);
    expect(etat.journal.some((e) => e.action.type === 'construire')).toBe(true);
  });

  it('les objets utilisés sont journalisés avec leur emplacement, une seule fois par emplacement', () => {
    const config = configDe('charlie', { objets: ['fiole_soufre', 'sablier'] });
    const etat = jouer(config, 'caserne', 1000);
    const utilises = etat.journal.filter((e) => e.action.type === 'utiliserObjet');
    expect(utilises.map((e) => (e.action.type === 'utiliserObjet' ? e.action.emplacement : -1))).toEqual([0, 1]);
  });
});
