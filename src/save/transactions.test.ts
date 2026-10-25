// Transactions de la méta-progression : chacune rend { ok, sauvegarde } ou { ok:false, raison }, sans jamais modifier la
// sauvegarde reçue.
import { describe, expect, it } from 'vitest';
import { EMPLACEMENTS_OBJETS, IDS_OBJETS, PLAFOND_MONNAIE, STOCK_MAX_OBJET } from '../data/meta';
import { DEFS_TEST } from './aides.test-utils';
import { sauvegardeVide, type Meta, type Sauvegarde } from './format';
import { enregistrerVictoire, totalEtoiles } from './progression';
import {
  acheterDisciple,
  acheterObjet,
  acheterRangArbre,
  choisirHeros,
  enregistrerFinDePartie,
  equiperObjets,
  etoilesDisponibles,
  niveauDuHeros,
  niveauHerosDepuisXp,
  pointsDisponibles,
  reinitialiserArbre,
  reinitialiserPoints,
  repartirPoint,
  type Transaction,
} from './transactions';
import { validerSauvegarde } from './validation';

/** Un joueur qui a gagné `etoiles` étoiles (par trois, sur les premiers niveaux) et qui a de quoi acheter. */
function joueur(opts: { niveaux?: number; aretes?: number; braises?: number; meta?: Partial<Meta> } = {}): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= (opts.niveaux ?? 0); n++) s = enregistrerVictoire(s, n, 'matou', 3);
  return { ...s, meta: { ...s.meta, ...opts.meta, monnaies: { aretes: opts.aretes ?? 0, braises: opts.braises ?? 0 } } };
}

function reussie(t: Transaction<string>): Sauvegarde {
  if (!t.ok) throw new Error(`transaction refusée : ${t.raison}`);
  expect(validerSauvegarde(JSON.parse(JSON.stringify(t.sauvegarde)), DEFS_TEST).ok).toBe(true);
  return t.sauvegarde;
}

function raison(t: Transaction<string>): string {
  if (t.ok) throw new Error('la transaction aurait dû être refusée');
  return t.raison;
}

/** Vérifie qu'une transaction n'a pas touché à la sauvegarde qu'on lui a donnée. */
function sansEffet<T>(s: Sauvegarde, action: (s: Sauvegarde) => T): T {
  const avant = structuredClone(s);
  const resultat = action(s);
  expect(s).toEqual(avant);
  return resultat;
}

describe('niveauHerosDepuisXp', () => {
  const seuils = DEFS_TEST.seuilsXp;

  it('1 + le nombre de seuils atteints, jusqu’au niveau maximal', () => {
    expect([0, 99, 100, 249, 250, 449, 450, 3199, 3200, 99_999].map((xp) => niveauHerosDepuisXp(xp, seuils))).toEqual([1, 1, 2, 2, 3, 3, 4, 9, 10, 10]);
  });

  it('sans seuil, le héros reste au niveau 1', () => {
    expect(niveauHerosDepuisXp(5000, [])).toBe(1);
  });
});

describe('arbre d’améliorations', () => {
  it('le rang n coûte n étoiles : rang 1 puis 2 puis 3 = 6 étoiles', () => {
    let s = joueur({ niveaux: 4 }); // 12 étoiles
    expect(etoilesDisponibles(s)).toBe(12);
    s = reussie(acheterRangArbre(s, 'tir'));
    expect(s.meta.arbre.tir).toBe(1);
    expect(etoilesDisponibles(s)).toBe(11);
    s = reussie(acheterRangArbre(s, 'tir'));
    expect(etoilesDisponibles(s)).toBe(9);
    s = reussie(acheterRangArbre(s, 'tir'));
    expect(s.meta.arbre.tir).toBe(3);
    expect(etoilesDisponibles(s)).toBe(6);
    expect(totalEtoiles(s)).toBe(12); // les étoiles gagnées ne bougent pas
  });

  it('ne modifie pas la sauvegarde reçue', () => {
    const s = joueur({ niveaux: 2 });
    sansEffet(s, (x) => acheterRangArbre(x, 'caserne'));
  });

  it('refuse sans changer de branche : étoiles insuffisantes, rang maximal, branche inconnue', () => {
    expect(raison(acheterRangArbre(joueur(), 'tir'))).toBe('etoiles_insuffisantes');
    // 6 étoiles : les rangs 1, 2 et 3 d'une branche, puis plus rien (le rang 4 coûte 4).
    let s = joueur({ niveaux: 2 });
    for (let i = 0; i < 3; i++) s = reussie(acheterRangArbre(s, 'magie'));
    expect(raison(acheterRangArbre(s, 'magie'))).toBe('etoiles_insuffisantes');
    expect(raison(acheterRangArbre(s, 'caserne'))).toBe('etoiles_insuffisantes');
    // Rang maximal : 15 étoiles pour le 5e rang, puis le 6e est refusé même avec des étoiles de reste.
    let riche = joueur({ niveaux: 20 });
    for (let i = 0; i < 5; i++) riche = reussie(acheterRangArbre(riche, 'sorts'));
    expect(riche.meta.arbre.sorts).toBe(5);
    expect(raison(acheterRangArbre(riche, 'sorts'))).toBe('rang_max');
    for (const branche of ['piege', 'constructor', '__proto__', 'Tir', '', 3, undefined, null] as unknown[]) {
      expect(raison(acheterRangArbre(riche, branche as string)), String(branche)).toBe('branche_inconnue');
    }
  });

  it('on ne peut jamais dépenser plus d’étoiles qu’on n’en a gagné', () => {
    let s = joueur({ niveaux: 5 }); // 15 étoiles
    for (const branche of ['caserne', 'tir', 'magie', 'artillerie', 'sorts', 'heros', 'caserne', 'tir', 'magie', 'artillerie', 'sorts', 'heros', 'caserne', 'tir', 'magie']) {
      const t = acheterRangArbre(s, branche);
      if (t.ok) s = t.sauvegarde;
      expect(etoilesDisponibles(s)).toBeGreaterThanOrEqual(0);
    }
    expect(etoilesDisponibles(s)).toBeLessThan(2); // tout ce qui pouvait être payé l'a été
  });

  it('la réinitialisation rend toutes les étoiles dépensées et rien d’autre', () => {
    let s = joueur({ niveaux: 6, aretes: 77, braises: 5 });
    for (const branche of ['caserne', 'caserne', 'tir', 'sorts', 'sorts', 'sorts']) s = reussie(acheterRangArbre(s, branche));
    expect(etoilesDisponibles(s)).toBe(18 - 3 - 1 - 6);
    const r = reussie(reinitialiserArbre(s));
    expect(etoilesDisponibles(r)).toBe(18);
    expect(Object.values(r.meta.arbre)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(r.meta.monnaies).toEqual({ aretes: 77, braises: 5 });
    expect(r.progression).toEqual(s.progression);
    sansEffet(s, (x) => reinitialiserArbre(x));
  });

  it('réinitialiser un arbre vide est refusé', () => {
    expect(raison(reinitialiserArbre(joueur({ niveaux: 3 })))).toBe('rien_a_reinitialiser');
  });
});

describe('disciples', () => {
  it('acheter un disciple retire 30 braises et le fait posséder, à 0 d’expérience', () => {
    const s = joueur({ braises: 100 });
    const r = reussie(acheterDisciple(s, 'suie'));
    expect(r.meta.monnaies.braises).toBe(70);
    expect(r.meta.heros.suie).toEqual({ xp: 0, competences: {} });
    expect(Object.keys(r.meta.heros).sort()).toEqual(['charlie', 'plume', 'pollen', 'suie']);
    sansEffet(s, (x) => acheterDisciple(x, 'suie'));
  });

  it('exactement 30 braises suffisent, 29 non', () => {
    expect(raison(acheterDisciple(joueur({ braises: 29 }), 'corbeau'))).toBe('braises_insuffisantes');
    expect(reussie(acheterDisciple(joueur({ braises: 30 }), 'corbeau')).meta.monnaies.braises).toBe(0);
  });

  it('refuse un héros déjà possédé (avatar offert ou disciple déjà acheté) sans débiter', () => {
    const s = joueur({ braises: 100 });
    for (const avatar of ['plume', 'charlie', 'pollen']) expect(raison(acheterDisciple(s, avatar)), avatar).toBe('deja_possede');
    const apres = reussie(acheterDisciple(s, 'mastoc'));
    expect(raison(acheterDisciple(apres, 'mastoc'))).toBe('deja_possede');
    expect(apres.meta.monnaies.braises).toBe(70);
  });

  it('refuse un héros inconnu', () => {
    for (const heros of ['zeus', 'constructor', '__proto__', '', 4]) expect(raison(acheterDisciple(joueur({ braises: 100 }), heros as string)), String(heros)).toBe('heros_inconnu');
  });

  it('les six disciples s’achètent chacun pour 30 braises', () => {
    let s = joueur({ braises: 200 });
    for (const disciple of ['suie', 'corbeau', 'mastoc', 'brise_os', 'rouage', 'lanterne']) s = reussie(acheterDisciple(s, disciple));
    expect(s.meta.monnaies.braises).toBe(20);
    expect(Object.keys(s.meta.heros)).toHaveLength(9);
  });
});

describe('objets consommables', () => {
  it('acheter un objet retire son prix en arêtes et ajoute un au stock', () => {
    const s = joueur({ aretes: 500 });
    const prix = { fiole_soufre: 60, herbe_sabbat: 80, griffe_renfort: 60, sablier: 100 };
    for (const objet of IDS_OBJETS) {
      const r = reussie(acheterObjet(s, objet));
      expect(r.meta.objets[objet]).toBe(1);
      expect(r.meta.monnaies.aretes).toBe(500 - prix[objet]);
    }
    sansEffet(s, (x) => acheterObjet(x, 'sablier'));
  });

  it('plusieurs d’un coup', () => {
    const r = reussie(acheterObjet(joueur({ aretes: 500 }), 'herbe_sabbat', 5));
    expect(r.meta.objets.herbe_sabbat).toBe(5);
    expect(r.meta.monnaies.aretes).toBe(100);
  });

  it('refuse faute d’arêtes, sans rien débiter', () => {
    expect(raison(acheterObjet(joueur({ aretes: 59 }), 'fiole_soufre'))).toBe('aretes_insuffisantes');
    expect(raison(acheterObjet(joueur({ aretes: 179 }), 'herbe_sabbat', 3))).toBe('aretes_insuffisantes');
    expect(reussie(acheterObjet(joueur({ aretes: 60 }), 'fiole_soufre')).meta.monnaies.aretes).toBe(0);
  });

  it('refuse un stock qui dépasserait 10', () => {
    const plein = joueur({ aretes: 5000, meta: { objets: { fiole_soufre: STOCK_MAX_OBJET, herbe_sabbat: 9, griffe_renfort: 0, sablier: 0 } } });
    expect(raison(acheterObjet(plein, 'fiole_soufre'))).toBe('stock_plein');
    expect(raison(acheterObjet(plein, 'herbe_sabbat', 2))).toBe('stock_plein');
    expect(reussie(acheterObjet(plein, 'herbe_sabbat')).meta.objets.herbe_sabbat).toBe(10);
    expect(reussie(acheterObjet(plein, 'sablier', 10)).meta.objets.sablier).toBe(10);
    expect(raison(acheterObjet(plein, 'sablier', 11))).toBe('stock_plein');
  });

  it('refuse un objet inconnu et une quantité qui n’est pas un entier positif', () => {
    const s = joueur({ aretes: 5000 });
    for (const objet of ['potion', 'constructor', '__proto__', '']) expect(raison(acheterObjet(s, objet)), objet).toBe('objet_inconnu');
    for (const q of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) expect(raison(acheterObjet(s, 'sablier', q)), String(q)).toBe('quantite_invalide');
  });

  it('équiper : trois emplacements, un même objet peut en occuper plusieurs, dans la limite du stock', () => {
    const s = joueur({ meta: { objets: { fiole_soufre: 2, herbe_sabbat: 1, griffe_renfort: 0, sablier: 3 } } });
    expect(EMPLACEMENTS_OBJETS).toBe(3);
    expect(reussie(equiperObjets(s, ['sablier', 'sablier', 'herbe_sabbat'])).meta.choix.objets).toEqual(['sablier', 'sablier', 'herbe_sabbat']);
    expect(reussie(equiperObjets(s, [])).meta.choix.objets).toEqual([]);
    expect(reussie(equiperObjets(s, ['fiole_soufre'])).meta.choix.objets).toEqual(['fiole_soufre']);
    sansEffet(s, (x) => equiperObjets(x, ['sablier']));
  });

  it('équiper refuse plus de trois objets, un objet inconnu ou absent du stock', () => {
    const s = joueur({ meta: { objets: { fiole_soufre: 2, herbe_sabbat: 1, griffe_renfort: 0, sablier: 3 } } });
    expect(raison(equiperObjets(s, ['sablier', 'sablier', 'sablier', 'fiole_soufre']))).toBe('trop_d_objets');
    expect(raison(equiperObjets(s, ['potion']))).toBe('objet_inconnu');
    expect(raison(equiperObjets(s, ['constructor']))).toBe('objet_inconnu');
    expect(raison(equiperObjets(s, ['griffe_renfort']))).toBe('objet_hors_stock');
    expect(raison(equiperObjets(s, ['herbe_sabbat', 'herbe_sabbat']))).toBe('objet_hors_stock');
    expect(raison(equiperObjets(s, 'sablier' as unknown as string[]))).toBe('objet_inconnu');
  });
});

describe('choix du dieu et du héros', () => {
  it('retient le dieu et un de ses héros possédés', () => {
    const s = joueur({ braises: 30 });
    expect(reussie(choisirHeros(s, 'pollen', 'pollen')).meta.choix).toMatchObject({ dieu: 'pollen', heros: 'pollen' });
    const avecSuie = reussie(acheterDisciple(s, 'suie'));
    expect(reussie(choisirHeros(avecSuie, 'plume', 'suie')).meta.choix).toMatchObject({ dieu: 'plume', heros: 'suie' });
  });

  it('refuse un dieu ou un héros inconnu, un héros d’un autre dieu, un héros non possédé', () => {
    const s = joueur();
    expect(raison(choisirHeros(s, 'zeus', 'plume'))).toBe('dieu_inconnu');
    expect(raison(choisirHeros(s, 'plume', 'zeus'))).toBe('heros_inconnu');
    expect(raison(choisirHeros(s, 'plume', 'charlie'))).toBe('heros_pas_du_dieu');
    expect(raison(choisirHeros(s, 'charlie', 'mastoc'))).toBe('heros_non_possede');
    expect(raison(choisirHeros(s, 'constructor', 'plume'))).toBe('dieu_inconnu');
  });
});

describe('points de compétence', () => {
  // Charlie : 500 d'expérience = niveau 4 = 4 points ; Suie : 2000 = niveau 8 ; Mastoc : niveau 1.
  const base = joueur({
    meta: {
      heros: {
        plume: { xp: 0, competences: {} },
        charlie: { xp: 500, competences: {} },
        pollen: { xp: 0, competences: {} },
        suie: { xp: 2000, competences: {} },
        mastoc: { xp: 0, competences: {} },
      },
    },
  });

  it('un point par niveau de héros', () => {
    expect(niveauDuHeros(base, 'charlie', DEFS_TEST)).toBe(4);
    expect(pointsDisponibles(base, 'charlie', DEFS_TEST)).toBe(4);
    expect(pointsDisponibles(base, 'mastoc', DEFS_TEST)).toBe(1);
    expect(pointsDisponibles(base, 'suie', DEFS_TEST)).toBe(8);
    expect(niveauDuHeros(base, 'rouage', DEFS_TEST)).toBeNull();
    expect(pointsDisponibles(base, 'rouage', DEFS_TEST)).toBe(0);
  });

  it('place des points, un rang à la fois, sans toucher à l’original', () => {
    let s = reussie(repartirPoint(base, 'charlie', 'charlie_a', DEFS_TEST));
    s = reussie(repartirPoint(s, 'charlie', 'charlie_a', DEFS_TEST));
    s = reussie(repartirPoint(s, 'charlie', 'charlie_b', DEFS_TEST));
    expect(s.meta.heros.charlie?.competences).toEqual({ charlie_a: 2, charlie_b: 1 });
    expect(pointsDisponibles(s, 'charlie', DEFS_TEST)).toBe(1);
    sansEffet(base, (x) => repartirPoint(x, 'charlie', 'charlie_a', DEFS_TEST));
    expect(base.meta.heros.charlie?.competences).toEqual({});
  });

  it('refuse plus de points que de niveaux', () => {
    let s = base;
    for (const comp of ['charlie_a', 'charlie_b', 'charlie_c', 'charlie_a']) s = reussie(repartirPoint(s, 'charlie', comp, DEFS_TEST));
    expect(pointsDisponibles(s, 'charlie', DEFS_TEST)).toBe(0);
    expect(raison(repartirPoint(s, 'charlie', 'charlie_b', DEFS_TEST))).toBe('plus_de_points');
    // Mastoc, niveau 1 : un seul point.
    const m = reussie(repartirPoint(base, 'mastoc', 'mastoc_a', DEFS_TEST));
    expect(raison(repartirPoint(m, 'mastoc', 'mastoc_b', DEFS_TEST))).toBe('plus_de_points');
  });

  it('refuse un rang au-dessus de 3', () => {
    let s = base;
    for (let i = 0; i < 3; i++) s = reussie(repartirPoint(s, 'suie', 'suie_a', DEFS_TEST));
    expect(raison(repartirPoint(s, 'suie', 'suie_a', DEFS_TEST))).toBe('rang_max');
  });

  it('refuse l’ultime avant le niveau 6, l’accepte ensuite', () => {
    expect(raison(repartirPoint(base, 'charlie', 'charlie_ultime', DEFS_TEST))).toBe('niveau_insuffisant');
    const niveau6 = joueur({ meta: { heros: { ...base.meta.heros, charlie: { xp: 1000, competences: {} } } } });
    expect(niveauDuHeros(niveau6, 'charlie', DEFS_TEST)).toBe(6);
    const avecUltime = reussie(repartirPoint(niveau6, 'charlie', 'charlie_ultime', DEFS_TEST));
    expect(avecUltime.meta.heros.charlie?.competences).toEqual({ charlie_ultime: 1 });
    const niveau5 = joueur({ meta: { heros: { ...base.meta.heros, charlie: { xp: 999, competences: {} } } } });
    expect(raison(repartirPoint(niveau5, 'charlie', 'charlie_ultime', DEFS_TEST))).toBe('niveau_insuffisant');
  });

  it('refuse un héros non possédé ou inconnu, une compétence inconnue ou celle d’un autre héros', () => {
    expect(raison(repartirPoint(base, 'rouage', 'rouage_a', DEFS_TEST))).toBe('heros_non_possede');
    expect(raison(repartirPoint(base, 'zeus', 'zeus_a', DEFS_TEST))).toBe('heros_inconnu');
    expect(raison(repartirPoint(base, 'charlie', 'vol', DEFS_TEST))).toBe('competence_inconnue');
    expect(raison(repartirPoint(base, 'charlie', 'suie_a', DEFS_TEST))).toBe('competence_inconnue');
    expect(raison(repartirPoint(base, 'charlie', 'constructor', DEFS_TEST))).toBe('competence_inconnue');
    expect(raison(repartirPoint(base, 'charlie', '__proto__', DEFS_TEST))).toBe('competence_inconnue');
  });

  it('un héros sans définition est refusé, pas deviné', () => {
    expect(raison(repartirPoint(base, 'charlie', 'charlie_a', { ...DEFS_TEST, heros: {} }))).toBe('heros_inconnu');
  });

  it('redistribuer : tous les points reviennent, la sauvegarde reste valide', () => {
    let s = base;
    for (const comp of ['charlie_a', 'charlie_a', 'charlie_b', 'charlie_c']) s = reussie(repartirPoint(s, 'charlie', comp, DEFS_TEST));
    const r = reussie(reinitialiserPoints(s, 'charlie'));
    expect(r.meta.heros.charlie).toEqual({ xp: 500, competences: {} });
    expect(pointsDisponibles(r, 'charlie', DEFS_TEST)).toBe(4);
    expect(raison(reinitialiserPoints(r, 'charlie'))).toBe('rien_a_reinitialiser');
    expect(raison(reinitialiserPoints(r, 'rouage'))).toBe('heros_non_possede');
    expect(raison(reinitialiserPoints(r, 'zeus'))).toBe('heros_inconnu');
    sansEffet(s, (x) => reinitialiserPoints(x, 'charlie'));
  });
});

describe('fin de partie', () => {
  const enFin = (s: Sauvegarde, o: Partial<Parameters<typeof enregistrerFinDePartie>[1]> = {}) =>
    enregistrerFinDePartie(s, { niveau: 1, statut: 'victoire', difficulte: 'matou', etoiles: 3, ...o }, DEFS_TEST);

  function reussiAvecBilan(t: ReturnType<typeof enFin>) {
    if (!t.ok) throw new Error(`refusée : ${t.raison}`);
    expect(validerSauvegarde(JSON.parse(JSON.stringify(t.sauvegarde)), DEFS_TEST).ok).toBe(true);
    return t;
  }

  it('première victoire à 3 étoiles : 30 + 6 × N + 15 par étoile en arêtes, 2 braises, de l’expérience', () => {
    const t = reussiAvecBilan(enFin(sauvegardeVide(), { heros: 'charlie' }));
    expect(t.bilan).toMatchObject({ aretes: 30 + 6 + 45, braises: 2, xp: 120, nouvellesEtoiles: 3, heros: 'charlie' });
    expect(t.sauvegarde.meta.monnaies).toEqual({ aretes: 81, braises: 2 });
    expect(t.sauvegarde.meta.heros.charlie?.xp).toBe(120);
    expect(t.sauvegarde.progression.niveauMax).toBe(2);
  });

  it('une victoire rejouée sans étoile nouvelle rapporte 10 + 2 × N et ni braises ni bonus', () => {
    let s = reussiAvecBilan(enFin(sauvegardeVide())).sauvegarde;
    const t = reussiAvecBilan(enFin(s));
    expect(t.bilan).toMatchObject({ aretes: 12, braises: 0, nouvellesEtoiles: 0 });
    s = t.sauvegarde;
    expect(s.meta.monnaies).toEqual({ aretes: 81 + 12, braises: 2 });
  });

  it('seules les étoiles nouvelles comptent : de 1 à 3 étoiles, 2 nouvelles', () => {
    const s = reussiAvecBilan(enFin(sauvegardeVide(), { etoiles: 1 })).sauvegarde;
    expect(s.meta.monnaies).toEqual({ aretes: 30 + 6 + 15, braises: 0 });
    const t = reussiAvecBilan(enFin(s, { etoiles: 3 }));
    expect(t.bilan).toMatchObject({ aretes: 30 + 6 + 30, braises: 2, nouvellesEtoiles: 2 });
  });

  it('une étoile déjà obtenue dans une autre difficulté n’est pas nouvelle', () => {
    const s = reussiAvecBilan(enFin(sauvegardeVide(), { difficulte: 'matou' })).sauvegarde;
    const t = reussiAvecBilan(enFin(s, { difficulte: 'chaton', etoiles: 3 }));
    expect(t.bilan).toMatchObject({ aretes: 12, braises: 0, nouvellesEtoiles: 0 });
    expect(t.sauvegarde.progression.etoiles['1']).toEqual({ matou: 3, chaton: 3 });
  });

  it('une victoire qui n’égale pas le meilleur résultat n’ajoute pas d’étoile mais rapporte quand même', () => {
    const s = reussiAvecBilan(enFin(sauvegardeVide(), { etoiles: 3 })).sauvegarde;
    const t = reussiAvecBilan(enFin(s, { etoiles: 1 }));
    expect(t.bilan.nouvellesEtoiles).toBe(0);
    expect(t.sauvegarde.progression.etoiles['1']).toEqual({ matou: 3 });
  });

  it('le boss (niveau 10) donne 10 braises la première fois seulement, 12 avec les 3 étoiles', () => {
    let s = sauvegardeVide();
    for (let n = 1; n <= 9; n++) s = enregistrerVictoire(s, n, 'matou', 1);
    const premiere = reussiAvecBilan(enFin(s, { niveau: 10, etoiles: 1 }));
    expect(premiere.bilan).toMatchObject({ braises: 10, aretes: 30 + 60 + 15 });
    const seconde = reussiAvecBilan(enFin(premiere.sauvegarde, { niveau: 10, etoiles: 1 }));
    expect(seconde.bilan).toMatchObject({ braises: 0, aretes: 30 });
    const troisEtoiles = reussiAvecBilan(enFin(seconde.sauvegarde, { niveau: 10, etoiles: 3 }));
    expect(troisEtoiles.bilan.braises).toBe(2);
    expect(reussiAvecBilan(enFin(s, { niveau: 10, etoiles: 3 })).bilan.braises).toBe(12);
    // Un niveau ordinaire ne donne rien à sa première victoire (hors 3 étoiles).
    expect(reussiAvecBilan(enFin(sauvegardeVide(), { etoiles: 2 })).bilan.braises).toBe(0);
  });

  it('une défaite ne rapporte ni arêtes, ni braises, ni étoiles, mais la moitié de l’expérience', () => {
    const s = reussiAvecBilan(enFin(sauvegardeVide(), { heros: 'plume' })).sauvegarde; // plume : 120
    const t = reussiAvecBilan(enFin(s, { niveau: 2, statut: 'defaite', etoiles: 0, heros: 'plume' }));
    expect(t.bilan).toMatchObject({ aretes: 0, braises: 0, xp: 70, nouvellesEtoiles: 0 });
    expect(t.sauvegarde.meta.heros.plume?.xp).toBe(120 + 70);
    expect(t.sauvegarde.meta.monnaies).toEqual(s.meta.monnaies);
    expect(t.sauvegarde.progression).toEqual(s.progression);
  });

  it('l’expérience va au héros joué seulement, et sans héros il n’y en a pas', () => {
    const s = { ...sauvegardeVide(), meta: { ...sauvegardeVide().meta, heros: { ...sauvegardeVide().meta.heros, suie: { xp: 90, competences: {} } } } };
    const t = reussiAvecBilan(enFin(s, { heros: 'suie' }));
    expect(t.sauvegarde.meta.heros.suie?.xp).toBe(210);
    expect(t.sauvegarde.meta.heros.charlie?.xp).toBe(0);
    expect(t.bilan.niveauHeros).toEqual({ avant: 1, apres: 2 }); // 90 puis 210 d'expérience, seuil du niveau 2 à 100
    const sans = reussiAvecBilan(enFin(s));
    expect(sans.bilan).toMatchObject({ xp: 0, heros: null, niveauHeros: null });
    expect(sans.sauvegarde.meta.heros).toEqual(s.meta.heros);
  });

  it('refuse un héros non possédé ou inconnu', () => {
    expect(raison(enFin(sauvegardeVide(), { heros: 'suie' }))).toBe('heros_non_possede');
    expect(raison(enFin(sauvegardeVide(), { heros: 'zeus' }))).toBe('heros_non_possede');
  });

  it('refuse une victoire invalide sans rien changer : niveau verrouillé ou inconnu, étoiles, difficulté', () => {
    const s = sauvegardeVide();
    sansEffet(s, (x) => {
      expect(raison(enFin(x, { niveau: 5 }))).toBe('niveau_invalide');
      expect(raison(enFin(x, { niveau: 0 }))).toBe('niveau_invalide');
      expect(raison(enFin(x, { niveau: 101 }))).toBe('niveau_invalide');
      expect(raison(enFin(x, { niveau: 1.5 }))).toBe('niveau_invalide');
      expect(raison(enFin(x, { niveau: 5, statut: 'defaite', etoiles: 0 }))).toBe('niveau_invalide');
      for (const etoiles of [0, 4, -1, 1.5, Number.NaN]) expect(raison(enFin(x, { etoiles })), String(etoiles)).toBe('etoiles_invalides');
      for (const difficulte of ['dieu', 'constructor', '__proto__', '']) expect(raison(enFin(x, { difficulte })), difficulte).toBe('difficulte_inconnue');
    });
  });

  it('les gains sont tronqués au plafond des monnaies', () => {
    const riche = joueur({ aretes: PLAFOND_MONNAIE - 10, braises: PLAFOND_MONNAIE - 1 });
    const t = reussiAvecBilan(enFin(riche));
    expect(t.sauvegarde.meta.monnaies).toEqual({ aretes: PLAFOND_MONNAIE, braises: PLAFOND_MONNAIE });
  });

  it('les objets équipés et utilisés sont retirés du stock, les autres restent', () => {
    const s = joueur({ meta: { objets: { fiole_soufre: 3, herbe_sabbat: 2, griffe_renfort: 1, sablier: 4 } } });
    const t = reussiAvecBilan(
      enFin(s, { objetsEquipes: ['sablier', 'sablier', 'fiole_soufre'], objetsUtilises: ['sablier', 'fiole_soufre'] }),
    );
    expect(t.sauvegarde.meta.objets).toEqual({ fiole_soufre: 2, herbe_sabbat: 2, griffe_renfort: 1, sablier: 3 });
    expect(t.bilan.objetsConsommes).toEqual(['sablier', 'fiole_soufre']);
    // Équipés mais non utilisés : rien n'est retiré.
    const intact = reussiAvecBilan(enFin(s, { objetsEquipes: ['sablier'], objetsUtilises: [] }));
    expect(intact.sauvegarde.meta.objets).toEqual(s.meta.objets);
  });

  it('les objets sont consommés aussi en cas de défaite', () => {
    const s = joueur({ meta: { objets: { fiole_soufre: 1, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 } } });
    const t = reussiAvecBilan(enFin(s, { statut: 'defaite', etoiles: 0, objetsEquipes: ['fiole_soufre'], objetsUtilises: ['fiole_soufre'] }));
    expect(t.sauvegarde.meta.objets.fiole_soufre).toBe(0);
  });

  it('refuse d’utiliser plus d’objets qu’on n’en a emporté, ou un objet inconnu', () => {
    const s = joueur({ meta: { objets: { fiole_soufre: 3, herbe_sabbat: 2, griffe_renfort: 1, sablier: 4 } } });
    expect(raison(enFin(s, { objetsEquipes: ['sablier'], objetsUtilises: ['sablier', 'sablier'] }))).toBe('objets_invalides');
    expect(raison(enFin(s, { objetsEquipes: ['sablier'], objetsUtilises: ['fiole_soufre'] }))).toBe('objets_invalides');
    expect(raison(enFin(s, { objetsEquipes: ['potion'], objetsUtilises: ['potion'] }))).toBe('objets_invalides');
    expect(raison(enFin(s, { objetsEquipes: ['sablier', 'sablier', 'sablier', 'sablier'], objetsUtilises: [] }))).toBe('objets_invalides');
  });

  it('le stock ne descend jamais sous zéro (un autre onglet l’a peut-être déjà entamé)', () => {
    const s = joueur({ meta: { objets: { fiole_soufre: 0, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 } } });
    const t = reussiAvecBilan(enFin(s, { objetsEquipes: ['sablier'], objetsUtilises: ['sablier'] }));
    expect(t.sauvegarde.meta.objets.sablier).toBe(0);
  });

  it('les étoiles gagnées s’ajoutent aux étoiles disponibles pour l’arbre', () => {
    const t = reussiAvecBilan(enFin(sauvegardeVide()));
    expect(etoilesDisponibles(t.sauvegarde)).toBe(3);
  });

  it('ne modifie pas la sauvegarde reçue', () => {
    const s = joueur({ meta: { objets: { fiole_soufre: 3, herbe_sabbat: 2, griffe_renfort: 1, sablier: 4 } } });
    sansEffet(s, (x) => enFin(x, { heros: 'charlie', objetsEquipes: ['sablier'], objetsUtilises: ['sablier'] }));
  });
});

describe('suite de transactions au hasard', () => {
  it('ne produit jamais de sauvegarde invalide ni de monnaie négative', () => {
    let graine = 12345;
    const alea = (n: number): number => {
      graine = (Math.imul(graine, 1664525) + 1013904223) >>> 0;
      return graine % n;
    };
    const choisir = <T,>(liste: readonly T[]): T => liste[alea(liste.length)] as T;
    let s = joueur({ aretes: 300, braises: 90 });
    const branches = ['caserne', 'tir', 'magie', 'artillerie', 'sorts', 'heros', 'inconnue'];
    const heros = ['plume', 'suie', 'corbeau', 'charlie', 'mastoc', 'brise_os', 'pollen', 'rouage', 'lanterne'];
    const objets = [...IDS_OBJETS, 'potion'];
    let reussies = 0;
    for (let i = 0; i < 600; i++) {
      const h = choisir(heros);
      const dieuxDuHeros = ['plume', 'charlie', 'pollen'] as const;
      const t = [
        () => acheterRangArbre(s, choisir(branches)),
        () => reinitialiserArbre(s),
        () => acheterDisciple(s, h),
        () => acheterObjet(s, choisir(objets), 1 + alea(3)),
        () => equiperObjets(s, [choisir(objets), choisir(objets), choisir(objets)].slice(0, alea(4))),
        () => choisirHeros(s, choisir(dieuxDuHeros), h),
        () => repartirPoint(s, h, `${h}_${choisir(['a', 'b', 'c', 'ultime', 'x'])}`, DEFS_TEST),
        () => reinitialiserPoints(s, h),
        () =>
          enregistrerFinDePartie(
            s,
            {
              niveau: 1 + alea(Math.min(12, s.progression.niveauMax + 1)),
              statut: alea(3) === 0 ? 'defaite' : 'victoire',
              difficulte: choisir(['chaton', 'matou', 'vieux_sage']),
              etoiles: 1 + alea(3),
              heros: alea(2) === 0 ? h : null,
              objetsEquipes: [choisir(objets)],
              objetsUtilises: [choisir(objets)],
            },
            DEFS_TEST,
          ),
      ][alea(9)]?.();
      if (t?.ok) {
        reussies++;
        s = t.sauvegarde;
        const valide = validerSauvegarde(JSON.parse(JSON.stringify(s)), DEFS_TEST);
        if (!valide.ok) throw new Error(`étape ${String(i)} : ${valide.raison}`);
        expect(s.meta.monnaies.aretes).toBeGreaterThanOrEqual(0);
        expect(s.meta.monnaies.braises).toBeGreaterThanOrEqual(0);
        expect(etoilesDisponibles(s)).toBeGreaterThanOrEqual(0);
      }
    }
    // La suite doit réellement exercer les transactions, pas seulement les refuser.
    expect(reussies).toBeGreaterThan(150);
  });
});
