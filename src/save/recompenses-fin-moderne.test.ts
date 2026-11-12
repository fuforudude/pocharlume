// Badges et titres gagnés en fin de partie du DLC « Temps modernes » (spec du DLC, tâche 6) : montants de `BADGES_MODERNE`, prime de boss,
// défis, plafond, titres qui s'ajoutent sans jamais se retirer ; rien pour une partie de l'histoire.
import { describe, expect, it } from 'vitest';
import { NIVEAU_MAX_MODERNE } from '../data/campagnes';
import { IDS_DEFIS, PLAFOND_MONNAIE } from '../data/meta';
import { BADGES_MODERNE, badgesDuDlcComplet, DEFS_TITRES_MODERNES, titresMerites } from '../data/recompenses-moderne';
import { DEFS_TEST } from './aides.test-utils';
import { badgesDeLaVictoire } from './badges-moderne';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoireModerne } from './moderne';
import { enregistrerVictoire } from './progression';
import { enregistrerFinDePartie, type FinDePartieMeta, type ResultatFin } from './transactions';
import { validerSauvegarde } from './validation';

function joueurModerne(jusqua: number): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= jusqua; n++) s = enregistrerVictoireModerne(s, n, 'matou', 3);
  return s;
}

function reussie(s: Sauvegarde, changements: Partial<FinDePartieMeta> & { niveau: number }): Extract<ResultatFin, { ok: true }> {
  const r = enregistrerFinDePartie(s, { statut: 'victoire', difficulte: 'matou', etoiles: 3, heros: 'charlie', campagne: 'moderne', ...changements }, DEFS_TEST);
  if (!r.ok) throw new Error(`refusée : ${r.raison}`);
  const validee = validerSauvegarde(JSON.parse(JSON.stringify(r.sauvegarde)));
  if (!validee.ok) throw new Error(`sauvegarde invalide : ${validee.raison}`);
  return r;
}

describe('point d’entrée des badges (fin de partie)', () => {
  it('suit la table des badges : première victoire, boss à sa première victoire, 3 étoiles, défi', () => {
    const base = { numero: 1, boss: false, premiereVictoire: true, etoilesAvant: 0, etoilesApres: 2, defiReussi: null };
    expect(badgesDeLaVictoire(base)).toBe(BADGES_MODERNE.premiereVictoire);
    expect(badgesDeLaVictoire({ ...base, numero: 10, boss: true, etoilesApres: 3 })).toBe(BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.boss + BADGES_MODERNE.troisEtoiles);
    expect(badgesDeLaVictoire({ ...base, numero: 10, boss: true, premiereVictoire: false, etoilesAvant: 2, etoilesApres: 3 })).toBe(BADGES_MODERNE.troisEtoiles);
    expect(badgesDeLaVictoire({ ...base, premiereVictoire: false, etoilesAvant: 3, etoilesApres: 3, defiReussi: 'fer' })).toBe(BADGES_MODERNE.defi);
    expect(badgesDeLaVictoire({ ...base, premiereVictoire: false, etoilesAvant: 3, etoilesApres: 3 })).toBe(0);
  });
});

describe('badges et titres d’une partie du DLC', () => {
  it('une première victoire à 3 étoiles crédite `moderne.badges` et le dit au bilan', () => {
    const r = reussie(sauvegardeVide(), { niveau: 1 });
    const attendu = BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.troisEtoiles;
    expect(r.sauvegarde.moderne.badges).toBe(attendu);
    expect(r.bilan.badges).toBe(attendu);
    expect(r.sauvegarde.meta.monnaies).not.toHaveProperty('badges');
  });

  it('le boss de la Fac donne sa prime et le titre « Fac occupée », une fois', () => {
    const r = reussie(joueurModerne(9), { niveau: 10, etoiles: 1 });
    expect(r.bilan.badges).toBe(BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.boss);
    expect(r.sauvegarde.moderne.titres).toEqual(['fac_occupee']);
    expect(r.bilan.titresNouveaux).toEqual(['fac_occupee']);
    const encore = reussie(r.sauvegarde, { niveau: 10, etoiles: 1 });
    expect(encore.bilan.badges).toBe(0);
    expect(encore.bilan.titresNouveaux).toBeUndefined();
    expect(encore.sauvegarde.moderne.titres).toEqual(['fac_occupee']);
  });

  it('un défi réussi la première fois rapporte sa prime ; la seconde fois rien', () => {
    const r = reussie(joueurModerne(2), { niveau: 1, defi: 'heroique' });
    expect(r.bilan.badges).toBe(BADGES_MODERNE.defi);
    expect(reussie(r.sauvegarde, { niveau: 1, defi: 'heroique' }).bilan.badges).toBe(0);
  });

  it('une défaite ne rapporte aucun badge', () => {
    const r = enregistrerFinDePartie(sauvegardeVide(), { niveau: 1, statut: 'defaite', difficulte: 'matou', etoiles: 0, heros: 'charlie', campagne: 'moderne' }, DEFS_TEST);
    expect(r.ok && r.sauvegarde.moderne.badges).toBe(0);
  });

  it('les badges sont tronqués au plafond des monnaies', () => {
    const plein = { ...sauvegardeVide(), moderne: { ...sauvegardeVide().moderne, badges: PLAFOND_MONNAIE - 5 } };
    const r = reussie(plein, { niveau: 1 });
    expect(r.sauvegarde.moderne.badges).toBe(PLAFOND_MONNAIE);
    expect(r.bilan.badges).toBe(5);
  });

  it('un titre déjà obtenu n’est jamais retiré', () => {
    const avecTitre = { ...sauvegardeVide(), moderne: { ...sauvegardeVide().moderne, titres: ['greve_generale'] } };
    expect(reussie(avecTitre, { niveau: 1 }).sauvegarde.moderne.titres).toEqual(['greve_generale']);
  });

  it('une partie de l’histoire ne touche ni aux badges ni aux titres, même au boss', () => {
    let histoire = sauvegardeVide();
    for (let n = 1; n <= 9; n++) histoire = enregistrerVictoire(histoire, n, 'matou', 3);
    // Le niveau 10 (le boss) est joué ici pour la première fois.
    const r = enregistrerFinDePartie(histoire, { niveau: 10, statut: 'victoire', difficulte: 'matou', etoiles: 3, heros: 'charlie' }, DEFS_TEST);
    expect(r.ok && r.sauvegarde.moderne.badges).toBe(0);
    expect(r.ok && r.sauvegarde.moderne.titres).toEqual([]);
    expect(r.ok && r.bilan.badges).toBeUndefined();
    expect(r.ok && r.bilan.titresNouveaux).toBeUndefined();
  });

  it('une défaite ou un abandon dans le DLC n’ajoute aucun titre ni badge, même quand tout le reste mérite un titre', () => {
    // Le boss de la Fac est déjà battu (titre obtenu) ; les niveaux 11 à 19 aussi : une défaite au 20 ne donne pas « Cortège de tête ».
    const gagne = joueurModerne(19);
    const avance = { ...gagne, moderne: { ...gagne.moderne, titres: titresMerites({ etoiles: gagne.moderne.progression.etoiles, defis: gagne.moderne.defis }) } };
    expect(avance.moderne.titres).toEqual(['fac_occupee']);
    for (const statut of ['defaite', 'abandon'] as const) {
      const r = enregistrerFinDePartie(avance, { niveau: 20, statut, difficulte: 'matou', etoiles: 0, heros: 'charlie', campagne: 'moderne' }, DEFS_TEST);
      if (!r.ok) throw new Error(`refusée : ${r.raison}`);
      expect(r.sauvegarde.moderne.titres).toEqual(['fac_occupee']);
      expect(r.sauvegarde.moderne.badges).toBe(0);
      expect(r.bilan.titresNouveaux).toBeUndefined();
      expect(r.bilan.badges ?? 0).toBe(0);
    }
  });
});

describe('le total des badges, par de vraies fins de partie', () => {
  it('30 niveaux à 3 étoiles (boss compris), puis les 2 défis de chacun : tout le DLC rapporte 2 220 badges et tous les titres', () => {
    let s = sauvegardeVide();
    let total = 0;
    for (let n = 1; n <= NIVEAU_MAX_MODERNE; n++) {
      const r = reussie(s, { niveau: n });
      total += r.bilan.badges ?? 0;
      s = r.sauvegarde;
      for (const defi of IDS_DEFIS) {
        const d = reussie(s, { niveau: n, defi });
        total += d.bilan.badges ?? 0;
        s = d.sauvegarde;
      }
    }
    expect(total).toBe(badgesDuDlcComplet());
    expect(total).toBe(2220);
    expect(s.moderne.badges).toBe(total);
    expect(s.moderne.titres).toEqual(DEFS_TITRES_MODERNES.map((d) => d.id).sort());
  });

  it('rejouer tout ne rapporte plus rien', () => {
    let s = sauvegardeVide();
    for (let n = 1; n <= NIVEAU_MAX_MODERNE; n++) {
      s = reussie(s, { niveau: n }).sauvegarde;
      for (const defi of IDS_DEFIS) s = reussie(s, { niveau: n, defi }).sauvegarde;
    }
    expect(reussie(s, { niveau: 10 }).bilan.badges).toBe(0);
    expect(reussie(s, { niveau: 30, defi: 'fer' }).bilan.badges).toBe(0);
  });
});
