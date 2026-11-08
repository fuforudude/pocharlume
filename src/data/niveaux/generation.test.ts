// Générateur des vagues de campagne : apparitions en couloir pour les niveaux du Vol de Corbeaux.
import { describe, expect, it } from 'vitest';
import type { Paquet } from '../../engine/definitions';
import { ENNEMIS, type IdEnnemi } from '../ennemis';
import { genererVaguesNiveau, type PlanVagues } from './generation';

const PLAN: PlanVagues = { niveau: 60, nombre: 8, ennemis: ['fossoyeur', 'chauve_souris', 'corbeau_noir'], graine: 11, chemins: 2 };
const estVolant = (id: string): boolean => ENNEMIS[id as IdEnnemi].volant;
/** Le groupe sans son trajet (chemin ou couloir) : ce que les couloirs ne doivent pas changer. */
const sansTrajet = (p: Paquet): unknown => ({ ennemi: p.ennemi, nombre: p.nombre, intervalle: p.intervalle, delai: p.delai, facteurPv: p.facteurPv });

describe('génération des vagues en couloir', () => {
  it('avec des couloirs, les groupes de volants y vont à tour de rôle et les autres gardent leur chemin', () => {
    const sans = genererVaguesNiveau(PLAN);
    const avec = genererVaguesNiveau({ ...PLAN, couloirs: 2 });
    expect(avec).toHaveLength(sans.length);
    let volants = 0;
    avec.forEach((vague, w) => {
      const avant = sans[w]?.paquets ?? [];
      expect(vague.paquets).toHaveLength(avant.length);
      let k = 0;
      vague.paquets.forEach((p, i) => {
        expect(sansTrajet(p)).toEqual(sansTrajet(avant[i] ?? p));
        if (estVolant(p.ennemi)) {
          volants++;
          expect(p).toMatchObject({ chemin: 0, couloir: k++ % 2 });
        } else {
          expect(p).toEqual(avant[i]);
        }
      });
    });
    expect(volants).toBeGreaterThan(1);
  });

  it('un boss volant reste sur son chemin, hors des couloirs', () => {
    const vagues = genererVaguesNiveau({ ...PLAN, couloirs: 2, boss: { vague: 3, ennemi: 'ange_cendre', chemin: 1, delai: 5 } });
    expect(estVolant('ange_cendre')).toBe(true);
    const dernier = vagues[2]?.paquets.at(-1);
    expect(dernier).toEqual({ ennemi: 'ange_cendre', nombre: 1, intervalle: 0, chemin: 1, delai: 5 });
    expect(dernier).not.toHaveProperty('couloir');
    // Les autres volants de la vague, eux, vont bien en couloir.
    expect(vagues[2]?.paquets.slice(0, -1).filter((p) => estVolant(p.ennemi)).every((p) => p.couloir !== undefined)).toBe(true);
  });

  it('sans couloir, rien ne change', () => {
    expect(genererVaguesNiveau({ ...PLAN, couloirs: 0 })).toEqual(genererVaguesNiveau(PLAN));
    expect(JSON.stringify(genererVaguesNiveau(PLAN))).not.toContain('couloir');
  });
});
