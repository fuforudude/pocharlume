// Données du jalon 2 : dieux, héros, compétences, arbre, objets. Textes présents, valeurs cohérentes.
import { describe, expect, it } from 'vitest';
import type { DefCompetenceHeros, DefCompetenceTour, EffetSort } from '../engine/definitions';
import { fr } from '../i18n/fr';
import { BRANCHES } from './ameliorations';
import { DIEUX } from './dieux';
import { HEROS, SEUILS_XP } from './heros';
import { NIVEAU_ULTIME, RANG_MAX_ARBRE, RANG_MAX_COMPETENCE } from './meta';
import { OBJETS } from './objets';
import { REGLES } from './regles';
import { FAMILLES, TOURS } from './tours';

const cles = new Set(Object.keys(fr));
const paliers = new Set(REGLES.paliersProtection);

/** Somme des champs numériques d'un objet (pour comparer des rangs). */
function sommeChamps(objet: object): number {
  return (Object.values(objet) as number[]).reduce((a, v) => a + v, 0);
}

function competencesTours(): DefCompetenceTour[] {
  return FAMILLES.flatMap((f) => [...TOURS[f].specialisations.A.competences, ...TOURS[f].specialisations.B.competences]);
}

describe('textes du jalon 2', () => {
  it('dieux, héros, compétences, sorts, tours divines, objets et arbre ont tous leurs textes', () => {
    const noms: string[] = [];
    for (const d of Object.values(DIEUX)) {
      noms.push(d.nom, d.description, d.tourDivine.nom, ...d.sorts.flatMap((s) => [s.nom, s.description]));
      const divine = d.tourDivine;
      if (divine.soldats) noms.push(divine.soldats.nom);
      if (divine.atelier?.constructeur) noms.push(divine.atelier.constructeur.tourelle.nom);
    }
    for (const h of Object.values(HEROS)) noms.push(h.nom, h.role, h.description, ...h.competences.flatMap((c) => [c.nom, c.description]));
    for (const o of Object.values(OBJETS)) {
      noms.push(o.nom, o.description);
      for (const e of o.effets) if (e.type === 'invoquer') noms.push(e.unite.nom);
    }
    for (const b of Object.values(BRANCHES)) noms.push(b.nom, b.description);
    for (const c of competencesTours()) noms.push(c.nom, c.description);
    for (const h of Object.values(HEROS)) {
      const constructeur = h.capacites.ouvrage?.constructeur;
      if (constructeur) noms.push(constructeur.tourelle.nom);
    }
    for (const nom of noms) expect(cles.has(nom), nom).toBe(true);
  });
});

describe('dieux', () => {
  it('sont trois : Plume, Charlie, Pollen, avec chacun deux sorts et une tour divine à 200', () => {
    expect(Object.keys(DIEUX).sort()).toEqual(['charlie', 'plume', 'pollen']);
    for (const d of Object.values(DIEUX)) {
      expect(d.sorts).toHaveLength(2);
      expect(d.tourDivine.cout).toBe(200);
    }
  });

  it('chacun a trois héros qui lui appartiennent, l’avatar (de même id) en premier', () => {
    for (const [id, d] of Object.entries(DIEUX)) {
      expect(d.idsHeros).toHaveLength(3);
      expect(d.idsHeros[0]).toBe(id);
      expect(d.heros).toBe(HEROS[id as keyof typeof HEROS]);
      for (const h of d.idsHeros) expect(HEROS[h as keyof typeof HEROS].dieu, h).toBe(id);
    }
  });

  it('les bonus de famille suivent la spec', () => {
    // Valeurs réglées avec le simulateur (jalon 2, tâche 6) ; la spec donne seulement les valeurs de départ.
    expect(DIEUX.plume.bonus).toMatchObject({ famille: 'tir', cadence: 0.6, chanceCritique: 0.15 });
    expect(DIEUX.pollen.bonus).toMatchObject({ famille: 'artillerie', prix: -0.1, cadence: 0.15 });
    expect(DIEUX.pollen.bonus.piegeAuSol?.chance).toBe(0.2);
  });

  it('les sorts ont les recharges de la spec', () => {
    expect(DIEUX.plume.sorts.map((s) => s.recharge)).toEqual([30, 40]);
    expect(DIEUX.pollen.sorts.map((s) => s.recharge)).toEqual([30, 50]);
  });
});

describe('héros', () => {
  const tous = Object.entries(HEROS);

  it('sont neuf, trois par dieu', () => {
    expect(tous).toHaveLength(9);
    for (const dieu of Object.keys(DIEUX)) expect(tous.filter(([, h]) => h.dieu === dieu)).toHaveLength(3);
  });

  it('ont quatre compétences de trois rangs, l’ultime en dernier et au niveau 6', () => {
    for (const [id, h] of tous) {
      expect(h.competences, id).toHaveLength(4);
      h.competences.forEach((c: DefCompetenceHeros, i) => {
        expect(c.rangMax, c.id).toBe(RANG_MAX_COMPETENCE);
        expect(c.rangs, c.id).toHaveLength(3);
        expect(c.ultime, c.id).toBe(i === 3);
        expect(c.niveauRequis, c.id).toBe(i === 3 ? NIVEAU_ULTIME : 1);
      });
    }
  });

  it('les ids de compétence sont uniques et chaque rang apporte un effet de plus en plus fort', () => {
    const ids = tous.flatMap(([, h]) => h.competences.map((c) => c.id));
    expect(new Set(ids).size).toBe(36);
    for (const [, h] of tous) {
      for (const c of h.competences) {
        const [r1, r2, r3] = c.rangs;
        for (const cle of Object.keys(r1) as (keyof typeof r1)[]) {
          expect(r2[cle], `${c.id}.${cle}`).toBeGreaterThanOrEqual(r1[cle]);
          expect(r3[cle], `${c.id}.${cle}`).toBeGreaterThanOrEqual(r2[cle]);
        }
        const somme = (r: object): number => sommeChamps(r);
        expect(somme(r1), c.id).toBeGreaterThan(0);
        expect(somme(r3), c.id).toBeGreaterThan(somme(r1));
      }
    }
  });

  it('armures et résistances de départ sur les paliers, PV et cadence positifs', () => {
    for (const [id, h] of tous) {
      expect(paliers.has(h.armure), id).toBe(true);
      expect(paliers.has(h.resistance), id).toBe(true);
      expect(h.pv, id).toBeGreaterThan(0);
      expect(h.cadence, id).toBeGreaterThan(0);
      expect(h.vitesse, id).toBeGreaterThan(0);
      // Un héros frappe de près ou de loin, pas des deux.
      const distance = h.capacites.distance;
      expect(distance !== null || h.degats[1] > 0, id).toBe(true);
      expect(distance !== null && h.degats[1] > 0, id).toBe(false);
    }
  });

  it('chaque héros a son pouvoir distinctif', () => {
    expect(HEROS.plume.capacites).toMatchObject({ esquive: 0.3 });
    expect(HEROS.plume.capacites.critique).not.toBeNull();
    expect(HEROS.suie.capacites.execution).toBe(0.2);
    expect(HEROS.corbeau.capacites).toMatchObject({ ignoreArmure: 0.5 });
    expect(HEROS.corbeau.capacites.distance).not.toBeNull();
    expect(HEROS.charlie.zone?.effets.some((e) => e.type === 'etourdissement')).toBe(true);
    expect(HEROS.mastoc.capacite).toBe(3);
    expect(HEROS.brise_os.capacites.rage).toBeGreaterThan(0);
    expect(HEROS.pollen.capacites.ouvrage?.pieges).not.toBeNull();
    expect(HEROS.rouage.capacites.ouvrage?.constructeur).not.toBeNull();
    expect(HEROS.lanterne.capacites.soin).not.toBeNull();
    expect(HEROS.lanterne.capacites.distance?.typeDegats).toBe('magique');
  });
});

describe('expérience', () => {
  it('neuf seuils croissants pour les niveaux 2 à 10', () => {
    expect(SEUILS_XP).toHaveLength(REGLES.niveauHerosMax - 1);
    SEUILS_XP.forEach((s, i) => {
      if (i > 0) expect(s).toBeGreaterThan(SEUILS_XP[i - 1] ?? 0);
    });
  });
});

describe('arbre d’améliorations', () => {
  it('six branches de cinq rangs, chaque rang plus fort que le précédent', () => {
    expect(Object.keys(BRANCHES).sort()).toEqual(['artillerie', 'caserne', 'heros', 'magie', 'sorts', 'tir']);
    for (const [id, b] of Object.entries(BRANCHES)) {
      expect(b.rangMax, id).toBe(RANG_MAX_ARBRE);
      expect(b.effets, id).toHaveLength(RANG_MAX_ARBRE);
      const total = (i: number): number => sommeChamps(b.effets[i] ?? {});
      for (let i = 1; i < RANG_MAX_ARBRE; i++) expect(total(i), `${id} rang ${String(i + 1)}`).toBeGreaterThan(total(i - 1));
      expect(total(0), id).toBeGreaterThan(0);
    }
  });

  it('chaque branche vise ce que son nom annonce', () => {
    for (const [id, b] of Object.entries(BRANCHES)) expect(b.cible).toBe(id);
  });
});

describe('objets', () => {
  it('les effets des objets sont ceux de la spec', () => {
    const effets = (id: keyof typeof OBJETS): readonly EffetSort[] => OBJETS[id].effets;
    expect(effets('fiole_soufre')).toMatchObject([{ type: 'degats', degats: [150, 150], typeDegats: 'pur' }]);
    expect(effets('herbe_sabbat')).toMatchObject([{ type: 'vies', nombre: 5 }]);
    expect(effets('griffe_renfort')).toMatchObject([{ type: 'invoquer', nombre: 1, duree: 30 }]);
    expect(OBJETS.sablier.global).toBe(true);
  });
});

describe('compétences des spécialisations', () => {
  it('chaque spécialisation en a deux, de trois rangs, à prix croissants', () => {
    for (const f of FAMILLES) {
      for (const voie of ['A', 'B'] as const) {
        const spe = TOURS[f].specialisations[voie];
        expect(spe.competences, `${f}${voie}`).toHaveLength(2);
      }
      for (const niveau of TOURS[f].niveaux) expect(niveau.competences).toHaveLength(0);
    }
    expect(competencesTours()).toHaveLength(16);
    for (const c of competencesTours()) {
      expect(c.rangs).toHaveLength(3);
      expect(c.cout[1], c.id).toBeGreaterThan(c.cout[0]);
      expect(c.cout[2], c.id).toBeGreaterThan(c.cout[1]);
    }
    expect(new Set(competencesTours().map((c) => c.id)).size).toBe(16);
  });

  it('les exemples de la spec existent', () => {
    const ids = (f: keyof typeof TOURS, v: 'A' | 'B'): string[] => TOURS[f].specialisations[v].competences.map((c) => c.id);
    expect(ids('caserne', 'A')).toEqual(['benediction', 'mur']);
    expect(ids('tir', 'B')).toEqual(['tir_a_la_tete', 'carreau_perforant']);
    expect(ids('artillerie', 'A')).toEqual(['nappe_de_soufre', 'charge_lourde']);
  });
});
