// Les neuf héros : l'effet principal de chacun, et l'effet de leurs compétences et du niveau.
import { describe, expect, it } from 'vitest';
import { HEROS, type IdHeros } from '../data/heros';
import { CONFIG, avancerSecondes, compter, configDe, construireTour, ennemiFixe, evenementsPendant, heros, partieEssai } from './aides.test-utils';
import { EFFET, type EtatPartie } from './etat';
import { appliquerAction, creerPartie, step } from './partie';
import { resoudreHeros } from './modificateurs';
import { PAS_PAR_SECONDE } from './temps';
import { blesserUnite } from './unites';
import { niveauEssai } from './aides.test-utils';

function partieDe(id: IdHeros, extra: Partial<typeof CONFIG> = {}): EtatPartie {
  return partieEssai(configDe(HEROS[id].dieu, { heros: id, ...extra }));
}

/** Envoie le héros garder le point (x, 5) du chemin 0 et attend qu'il y soit. */
function posterSur(etat: EtatPartie, x: number): void {
  expect(appliquerAction(etat, { type: 'deplacerHeros', x, y: 5 })).toEqual({ ok: true });
  avancerSecondes(etat, 20);
}

/** Dégâts subis par la cible à chaque pas où le héros frappe (événement `coup`). */
function degatsParCoup(etat: EtatPartie, cible: { pv: number }, secondes: number): number[] {
  const coups: number[] = [];
  for (let i = 0; i < secondes * PAS_PAR_SECONDE; i++) {
    const avant = cible.pv;
    step(etat);
    if (etat.evenements.some((e) => e.type === 'coup')) coups.push(avant - cible.pv);
  }
  return coups;
}

describe('Plume, l’Ombre Première : duelliste', () => {
  it('esquive 30 % des coups reçus', () => {
    const etat = partieDe('plume');
    const h = heros(etat);
    for (let i = 0; i < 1000; i++) blesserUnite(etat, h, 0.01, 'physique');
    const esquives = compter(etat.evenements, 'esquive');
    expect(esquives).toBeGreaterThan(250);
    expect(esquives).toBeLessThan(350);
    expect(h.stats.pv - h.pv).toBeCloseTo((1000 - esquives) * 0.01, 5);
  });

  it('porte des coups critiques (×2) à peu près un coup sur cinq', () => {
    const etat = partieDe('plume');
    posterSur(etat, 20);
    const cible = ennemiFixe(etat, 20.3, { pv: 1e7 });
    const coups = degatsParCoup(etat, cible, 150);
    const base = HEROS.plume.degats[1];
    const critiques = coups.filter((d) => d > base + 0.001);
    expect(coups.length).toBeGreaterThan(100);
    expect(critiques.length / coups.length).toBeGreaterThan(0.1);
    expect(critiques.length / coups.length).toBeLessThan(0.32);
    expect(Math.max(...coups)).toBeGreaterThan(base);
    expect(Math.max(...coups)).toBeLessThanOrEqual(base * 2 + 0.001);
  });
});

describe('Suie : assassin', () => {
  it('exécute un non-boss sous 20 % de PV dès le premier coup, pas au-dessus, pas un boss', () => {
    const fragile = partieDe('suie');
    posterSur(fragile, 20);
    const a = ennemiFixe(fragile, 20.3, { pv: 1e5 });
    a.pv = a.pvMax * 0.19;
    const vus = evenementsPendant(fragile, 3);
    expect(a.vivant).toBe(false);
    expect(vus.some((e) => e.type === 'execution' && e.ennemi === a.id)).toBe(true);

    const solide = partieDe('suie');
    posterSur(solide, 20);
    const b = ennemiFixe(solide, 20.3, { pv: 1e5 });
    b.pv = b.pvMax * 0.21;
    expect(compter(evenementsPendant(solide, 1), 'execution')).toBe(0);
    expect(b.vivant).toBe(true);

    const chef = partieDe('suie');
    posterSur(chef, 20);
    const boss = ennemiFixe(chef, 20.3, { pv: 1e5, boss: true });
    boss.pv = boss.pvMax * 0.05;
    expect(compter(evenementsPendant(chef, 3), 'execution')).toBe(0);
    expect(boss.vivant).toBe(true);
  });
});

describe('Corbeau : tireur', () => {
  it('tire de loin sur terre comme dans les airs, sans bloquer personne', () => {
    const etat = partieDe('corbeau');
    posterSur(etat, 20);
    const sol = ennemiFixe(etat, 22.5);
    const vus = evenementsPendant(etat, 6);
    expect(compter(vus, 'tir_unite')).toBeGreaterThanOrEqual(4);
    expect(vus.some((e) => e.type === 'tir_unite' && e.ennemi === sol.id)).toBe(true);
    // Un volant, seul, est visé lui aussi.
    const air = ennemiFixe(etat, 22, { volant: true });
    sol.vivant = false;
    expect(evenementsPendant(etat, 4).some((e) => e.type === 'tir_unite' && e.ennemi === air.id)).toBe(true);
    expect(sol.bloqueur).toBe(-1);
    expect(heros(etat).bloques).toBe(0);
    expect(compter(vus, 'coup')).toBe(0);
  });

  it('ignore la moitié de l’armure : 60 % d’armure ne retirent que 30 % des dégâts', () => {
    const subis = (armure: number): number => {
      const etat = partieDe('corbeau');
      posterSur(etat, 20);
      const cible = ennemiFixe(etat, 22.5, { armure });
      avancerSecondes(etat, 8);
      return cible.pvMax - cible.pv;
    };
    const nu = subis(0);
    expect(nu).toBeGreaterThan(0);
    expect(subis(0.6) / nu).toBeCloseTo(0.7, 5);
  });

  it('ne tire pas hors de portée', () => {
    const etat = partieDe('corbeau');
    posterSur(etat, 20);
    const loin = ennemiFixe(etat, 26);
    avancerSecondes(etat, 5);
    expect(loin.pv).toBe(loin.pvMax);
  });
});

describe('Charlie, le Colosse : tank', () => {
  it('frappe en zone et étourdit parfois les voisins de sa cible', () => {
    const etat = partieDe('charlie');
    posterSur(etat, 20);
    const a = ennemiFixe(etat, 20.3);
    const b = ennemiFixe(etat, 20.7);
    let etourdi = 0;
    for (let i = 0; i < 20 * PAS_PAR_SECONDE; i++) {
      step(etat);
      const voisin = a.id === heros(etat).cible ? b : a;
      if ((voisin.effetsPas[EFFET.etourdissement] ?? 0) > 0) etourdi++;
    }
    expect(a.pv).toBeLessThan(a.pvMax);
    expect(b.pv).toBeLessThan(b.pvMax);
    expect(etourdi).toBeGreaterThan(0);
  });
});

describe('Mastoc : provocation', () => {
  it('bloque trois ennemis à la fois, là où un héros ordinaire en bloque un', () => {
    const bloques = (id: IdHeros): number => {
      const etat = partieDe(id);
      posterSur(etat, 20);
      const ennemis = [20.1, 20.15, 20.2].map((x) => ennemiFixe(etat, x));
      avancerSecondes(etat, 5);
      expect(ennemis.filter((e) => e.bloqueur === etat.heros).length).toBe(heros(etat).bloques);
      return heros(etat).bloques;
    };
    expect(bloques('mastoc')).toBe(3);
    expect(bloques('charlie')).toBe(1);
  });
});

describe('Brise-Os : berserker', () => {
  it('frappe plus fort à mesure qu’il perd des PV', () => {
    const frappes = (fraction: number): number[] => {
      const etat = partieDe('brise_os');
      posterSur(etat, 20);
      heros(etat).pv = heros(etat).stats.pv * fraction;
      const cible = ennemiFixe(etat, 20.3, { pv: 1e7 });
      return degatsParCoup(etat, cible, 30);
    };
    const sain = frappes(1);
    const blesse = frappes(0.1);
    const [min, max] = HEROS.brise_os.degats;
    expect(sain.length).toBeGreaterThan(10);
    expect(Math.max(...sain)).toBeLessThanOrEqual(max + 0.001);
    // À 10 % de PV : +81 % de dégâts, donc même le plus faible coup dépasse le plus fort d'un héros en pleine forme.
    expect(Math.min(...blesse)).toBeGreaterThan(min * 1.8 - 0.001);
    expect(Math.min(...blesse)).toBeGreaterThan(max);
  });
});

describe('Pollen, Trois-Pattes : poseur de pièges', () => {
  it('pose un piège sur le chemin près de lui toutes les 14 s, et tire à la fronde', () => {
    const etat = partieDe('pollen');
    posterSur(etat, 20);
    expect(etat.pieges.length).toBeGreaterThanOrEqual(1);
    const piege = etat.pieges[0];
    expect(Math.abs((piege?.y ?? 0) - 5)).toBeLessThan(0.001);
    expect(Math.abs((piege?.x ?? 0) - 20)).toBeLessThan(0.5);
    const avant = etat.pieges.length;
    avancerSecondes(etat, 14);
    expect(etat.pieges.length).toBe(avant + 1);
    ennemiFixe(etat, 22.5);
    expect(compter(evenementsPendant(etat, 4), 'tir_unite')).toBeGreaterThan(0);
  });

  it('un piège du héros prend un ennemi qui passe', () => {
    const etat = partieDe('pollen');
    posterSur(etat, 20);
    const e = ennemiFixe(etat, 17.5, { vitesse: 1.4 });
    e.vitesse = 1.4 / PAS_PAR_SECONDE;
    expect(compter(evenementsPendant(etat, 4), 'piege_declenche')).toBe(1);
  });
});

describe('Rouage : ingénieur', () => {
  it('construit une tourelle qui tire seule, une seule à la fois, remplacée quand elle disparaît', () => {
    const etat = partieDe('rouage');
    posterSur(etat, 20);
    expect(etat.structures).toHaveLength(1);
    const tourelle = etat.structures[0];
    expect(tourelle).toMatchObject({ origine: etat.heros });
    expect(tourelle?.stats.nom).toBe('unite.tourelle_de_rouage');
    ennemiFixe(etat, 22);
    const vus = evenementsPendant(etat, 8);
    expect(vus.some((e) => e.type === 'tir_structure' && e.structure === tourelle?.id)).toBe(true);
    // 25 s de vie : elle disparaît, une autre vient (cadence de construction 15 s).
    const plus = evenementsPendant(etat, 30);
    expect(compter(plus, 'structure_fin')).toBeGreaterThanOrEqual(1);
    expect(compter(plus, 'structure')).toBeGreaterThanOrEqual(1);
    expect(etat.structures.length).toBeLessThanOrEqual(1);
  });
});

describe('Lanterne : soigneuse', () => {
  it('soigne les alliés autour d’elle, elle comprise', () => {
    const etat = partieDe('lanterne');
    construireTour(etat, 0, 'caserne');
    posterSur(etat, 5);
    const lanterne = heros(etat);
    const soldat = etat.unites.find((u) => u.genre === 'soldat');
    if (!soldat) throw new Error('pas de soldat');
    lanterne.pv = lanterne.stats.pv * 0.4;
    soldat.pv = soldat.stats.pv * 0.4;
    const avant = [lanterne.pv, soldat.pv];
    const vus = evenementsPendant(etat, 4);
    expect(lanterne.pv).toBeGreaterThan(avant[0] ?? 0);
    expect(soldat.pv).toBeGreaterThan(avant[1] ?? 0);
    expect(vus.some((e) => e.type === 'soin' && e.source === lanterne.id && e.unite === soldat.id)).toBe(true);
    // 8 % des PV max par soin.
    expect(lanterne.pv - (avant[0] ?? 0)).toBeCloseTo(lanterne.stats.pv * 0.08 * Math.floor(compter(vus, 'soin') / 2), 1);
  });

  it('ne soigne pas les morts et ne dépasse pas les PV maximaux', () => {
    const etat = partieDe('lanterne');
    posterSur(etat, 5);
    const lanterne = heros(etat);
    lanterne.pv = lanterne.stats.pv - 1;
    avancerSecondes(etat, 7);
    expect(lanterne.pv).toBe(lanterne.stats.pv);
  });

  it('attaque en magie : la résistance magique réduit ses dégâts', () => {
    const subis = (resistance: number): number => {
      const etat = partieDe('lanterne');
      posterSur(etat, 20);
      const cible = ennemiFixe(etat, 22.5, { resistance });
      avancerSecondes(etat, 8);
      return cible.pvMax - cible.pv;
    };
    expect(subis(0.6) / subis(0)).toBeCloseTo(0.4, 5);
  });
});

describe('niveau, compétences et stats des héros', () => {
  it('chaque héros gagne des PV et des dégâts par niveau', () => {
    for (const [id, def] of Object.entries(HEROS)) {
      const config = configDe(def.dieu, { heros: id, niveauHeros: 1 });
      const haut = configDe(def.dieu, { heros: id, niveauHeros: 10 });
      const bas = resoudreHeros(config).stats;
      const plus = resoudreHeros(haut).stats;
      // Les PV sont arrondis à l'entier : au plus un point d'écart avec la somme exacte.
      expect(Math.abs(plus.pv - (bas.pv + 9 * def.pvParNiveau)), id).toBeLessThanOrEqual(1);
      const attaque = (s: typeof bas): number => s.capacites?.distance?.degats[1] ?? s.degats[1];
      expect(attaque(plus), id).toBeCloseTo(attaque(bas) + 9 * def.degatsParNiveau, 5);
    }
  });

  it('chaque rang de chaque compétence change les stats du héros, de plus en plus', () => {
    for (const [id, def] of Object.entries(HEROS)) {
      for (const competence of def.competences) {
        const resume = (rang: number): string => {
          const config = configDe(def.dieu, { heros: id, niveauHeros: 10, competencesHeros: { [competence.id]: rang } });
          const { stats, zone } = resoudreHeros(config);
          return JSON.stringify({ stats, zone });
        };
        const [r0, r1, r2, r3] = [resume(0), resume(1), resume(2), resume(3)];
        expect(r1, `${competence.id} rang 1`).not.toBe(r0);
        expect(r2, `${competence.id} rang 2`).not.toBe(r1);
        expect(r3, `${competence.id} rang 3`).not.toBe(r2);
      }
    }
  });

  it('applique les compétences en partie : esquive de Plume, capacité de Mastoc, tourelles de Rouage', () => {
    const plume = partieDe('plume', { niveauHeros: 4, competencesHeros: { pas_de_velours: 3 } });
    expect(heros(plume).stats.capacites?.esquive).toBeCloseTo(HEROS.plume.capacites.esquive + (HEROS.plume.competences[0]?.rangs[2]?.esquive ?? 0), 5);

    const mastoc = partieDe('mastoc', { niveauHeros: 4, competencesHeros: { cri_de_defi: 3 } });
    expect(heros(mastoc).stats.capacite).toBe(5);

    const rouage = partieDe('rouage', { niveauHeros: 8, competencesHeros: { deuxieme_servant: 3, automate: 1 } });
    expect(heros(rouage).stats.capacites?.ouvrage?.constructeur?.max).toBe(1 + 2 + 1);
    posterSur(rouage, 20);
    let max = rouage.structures.length;
    for (let i = 0; i < 60 * PAS_PAR_SECONDE; i++) {
      step(rouage);
      max = Math.max(max, rouage.structures.length);
    }
    expect(max).toBeGreaterThanOrEqual(2);
  });

  it('une partie avec compétences se crée sans erreur pour chaque héros au niveau 10', () => {
    for (const [id, def] of Object.entries(HEROS)) {
      const [a, b, c] = def.competences;
      const config = configDe(def.dieu, {
        heros: id,
        niveauHeros: 10,
        competencesHeros: { [a?.id ?? '']: 3, [b?.id ?? '']: 3, [c?.id ?? '']: 3, [def.competences[3]?.id ?? '']: 1 },
      });
      expect(() => creerPartie(niveauEssai(), config), id).not.toThrow();
    }
  });
});
