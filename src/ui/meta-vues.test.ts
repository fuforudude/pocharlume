import { describe, expect, it } from 'vitest';
import { creerPartie } from '../engine';
import { REGION1 } from '../data/niveaux/region1';
import { PRIX_DISCIPLE } from '../data/meta';
import { sauvegardeVide, type Sauvegarde } from '../save';
import { configDuChoix } from './lancement';
import { choixJouable, objetsDansLeStock, vueArbre, vueFicheHeros, vueHerosDuDieu, vueObjetsBoutique, vueObjetsChoix } from './meta-vues';

function riche(): Sauvegarde {
  const s = sauvegardeVide();
  return {
    ...s,
    progression: { niveauMax: 4, etoiles: { '1': { matou: 3 }, '2': { matou: 2 } } },
    meta: {
      ...s.meta,
      monnaies: { aretes: 100, braises: 30 },
      heros: { ...s.meta.heros, suie: { xp: 400, competences: { lame_courte: 1 } } },
      objets: { ...s.meta.objets, sablier: 2, fiole_soufre: 1 },
    },
  };
}

describe('vues de la fiche de niveau', () => {
  it('un dieu propose ses trois héros : l’avatar possédé, les disciples verrouillés avec leur prix', () => {
    const vue = vueHerosDuDieu(sauvegardeVide(), 'plume');
    expect(vue.map((h) => h.id)).toEqual(['plume', 'suie', 'corbeau']);
    expect(vue[0]).toMatchObject({ possede: true, niveau: 1, prix: null });
    expect(vue[1]).toMatchObject({ possede: false, niveau: null, prix: PRIX_DISCIPLE });
  });

  it('un disciple acheté est proposé avec son niveau', () => {
    expect(vueHerosDuDieu(riche(), 'plume')[1]).toMatchObject({ possede: true, niveau: 3, prix: null });
  });

  it('le choix mémorisé est corrigé : héros non possédé devient l’avatar, objets au-delà du stock retirés', () => {
    const s = riche();
    const choix = choixJouable(s, { dieu: 'pollen', heros: 'rouage', objets: ['sablier', 'sablier', 'sablier', 'fiole_soufre'] });
    expect(choix).toEqual({ dieu: 'pollen', heros: 'pollen', objets: ['sablier', 'sablier', 'fiole_soufre'] });
    expect(choixJouable(s, { dieu: 'plume', heros: 'suie', objets: [] }).heros).toBe('suie');
    expect(choixJouable(s, { dieu: 'plume', heros: 'charlie', objets: [] }).heros).toBe('plume');
  });

  it('les objets emportés sont limités au stock et à trois emplacements', () => {
    expect(objetsDansLeStock(riche(), ['fiole_soufre', 'fiole_soufre', 'herbe_sabbat', 'sablier'])).toEqual(['fiole_soufre', 'sablier']);
    const vues = vueObjetsChoix(riche(), ['sablier']);
    expect(vues.find((v) => v.id === 'sablier')).toMatchObject({ stock: 2, emporte: 1, libre: 1 });
  });
});

describe('vue de la fiche d’un héros', () => {
  it('niveau, barre d’expérience et ultime verrouillée avant le niveau 6', () => {
    const vue = vueFicheHeros(riche(), 'suie');
    expect(vue.possede).toBe(true);
    expect(vue.niveau).toBe(3);
    expect(vue.xpSuivant).toBe(600);
    expect(vue.fractionXp).toBeCloseTo((400 - 350) / (600 - 350));
    expect(vue.points).toBe(2);
    expect(vue.pointsPlaces).toBe(1);
    expect(vue.competences).toHaveLength(4);
    const ultime = vue.competences[3];
    expect(ultime).toMatchObject({ ultime: true, verrouillee: true, peutPlacer: false });
    expect(vue.competences[0]).toMatchObject({ id: 'lame_courte', rang: 1, peutPlacer: true });
  });

  it('un héros sans point à placer ne propose aucun ajout', () => {
    const s = sauvegardeVide();
    const vue = vueFicheHeros(s, 'plume');
    expect(vue.points).toBe(1);
    const sans = { ...s, meta: { ...s.meta, heros: { ...s.meta.heros, plume: { xp: 0, competences: { pas_de_velours: 1 } } } } };
    expect(vueFicheHeros(sans, 'plume').competences.every((c) => !c.peutPlacer)).toBe(true);
  });

  it('un disciple pas recruté est montré sans niveau réel, avec son prix', () => {
    const vue = vueFicheHeros(sauvegardeVide(), 'lanterne');
    expect(vue).toMatchObject({ possede: false, prix: PRIX_DISCIPLE, points: 0, niveau: 1 });
    expect(vue.competences.every((c) => !c.peutPlacer)).toBe(true);
  });

  it('au niveau maximal, la barre est pleine', () => {
    const s = sauvegardeVide();
    const max = { ...s, meta: { ...s.meta, heros: { ...s.meta.heros, plume: { xp: 999_999, competences: {} } } } };
    expect(vueFicheHeros(max, 'plume')).toMatchObject({ niveau: 10, xpSuivant: null, fractionXp: 1 });
  });
});

describe('vues de la boutique', () => {
  it('l’arbre montre le coût du rang suivant et ce qu’on peut acheter avec les étoiles disponibles', () => {
    // 5 étoiles gagnées (3 + 2).
    const vue = vueArbre(riche());
    expect(vue).toHaveLength(6);
    expect(vue[0]).toMatchObject({ id: 'caserne', rang: 0, cout: 1, achetable: true });
    const depense = riche();
    const arbre = { ...depense.meta.arbre, caserne: 2, tir: 2 };
    const apres = vueArbre({ ...depense, meta: { ...depense.meta, arbre } });
    expect(apres[0]).toMatchObject({ rang: 2, cout: 3, achetable: false });
    const sommet = vueArbre({ ...depense, meta: { ...depense.meta, arbre: { ...depense.meta.arbre, caserne: 5 } } });
    expect(sommet[0]).toMatchObject({ rang: 5, cout: null, achetable: false });
  });

  it('les objets montrent prix, stock et possibilité d’achat', () => {
    const vue = vueObjetsBoutique(riche());
    expect(vue.find((o) => o.id === 'fiole_soufre')).toMatchObject({ prix: 60, stock: 1, stockMax: 10, achetable: true });
    expect(vue.find((o) => o.id === 'sablier')).toMatchObject({ prix: 100, achetable: true });
    const pauvre = vueObjetsBoutique(sauvegardeVide());
    expect(pauvre.every((o) => !o.achetable)).toBe(true);
    const plein = riche();
    const rempli = { ...plein, meta: { ...plein.meta, objets: { ...plein.meta.objets, sablier: 10 } } };
    expect(vueObjetsBoutique(rempli).find((o) => o.id === 'sablier')?.achetable).toBe(false);
  });
});

describe('composition de la config d’une partie', () => {
  const niveau = REGION1[0]?.niveau;
  if (!niveau) throw new Error('niveau 1 absent');

  it('une config valide pour le moteur : héros, niveau, compétences, arbre et objets de la sauvegarde', () => {
    const s = riche();
    const r = configDuChoix(s, { dieu: 'plume', heros: 'suie', objets: ['sablier'] }, 'matou', 7);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.config).toMatchObject({ dieu: 'plume', heros: 'suie', niveauHeros: 3, competencesHeros: { lame_courte: 1 }, objets: ['sablier'], graine: 7 });
    expect(() => creerPartie(niveau, r.config)).not.toThrow();
  });

  it('refuse un héros qu’on n’a pas, un objet absent du stock, une difficulté inconnue', () => {
    const s = riche();
    expect(configDuChoix(s, { dieu: 'plume', heros: 'corbeau', objets: [] }, 'matou', 1)).toEqual({ ok: false, raison: 'heros_non_possede' });
    expect(configDuChoix(s, { dieu: 'plume', heros: 'plume', objets: ['herbe_sabbat'] }, 'matou', 1)).toEqual({ ok: false, raison: 'objet_hors_stock' });
    expect(configDuChoix(s, { dieu: 'plume', heros: 'plume', objets: [] }, 'facile', 1)).toEqual({ ok: false, raison: 'difficulte_inconnue' });
  });
});
