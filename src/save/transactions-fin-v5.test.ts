// Fin de partie, jalon 4 : régions 6 à 10 (chacune ouverte par le boss de la précédente), disciples offerts aux boss des
// régions 6 et 8, mode infini ouvert par le boss de la région 1, fin de campagne au boss de la région 10. Les niveaux 51 à
// 100 n'existent pas encore dans le jeu : la sauvegarde raisonne sur des numéros, ces tests n'ont besoin d'aucune donnée.
import { describe, expect, it } from 'vitest';
import { DISCIPLES_OFFERTS, NIVEAU_FIN_CAMPAGNE, NIVEAUX_DISCIPLE_OFFERT, braisesDeVictoire, type IdHeros } from '../data/meta';
import { DEFS_TEST } from './aides.test-utils';
import { sauvegardeVide, type Sauvegarde } from './format';
import { campagneTerminee, enregistrerVictoire, niveauDebloque } from './progression';
import { enregistrerFinDePartie, type FinDePartieMeta, type ResultatFin } from './transactions';
import { infiniOuvert } from './transactions-infini';
import { validerSauvegarde } from './validation';

/** Un joueur qui a gagné les niveaux 1 à `jusqua` en 3 étoiles (Matou), et recruté ces disciples. */
function joueur(jusqua: number, disciples: readonly IdHeros[] = []): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= jusqua; n++) s = enregistrerVictoire(s, n, 'matou', 3);
  const heros = { ...s.meta.heros };
  for (const d of disciples) heros[d] = { xp: 0, competences: {} };
  return { ...s, meta: { ...s.meta, heros } };
}

function fin(s: Sauvegarde, changements: Partial<FinDePartieMeta> & { niveau: number }): ResultatFin {
  return enregistrerFinDePartie(s, { statut: 'victoire', difficulte: 'matou', etoiles: 3, heros: 'charlie', ...changements }, DEFS_TEST);
}

function reussie(s: Sauvegarde, changements: Partial<FinDePartieMeta> & { niveau: number }): Extract<ResultatFin, { ok: true }> {
  const r = fin(s, changements);
  if (!r.ok) throw new Error(`refusée : ${r.raison}`);
  const validee = validerSauvegarde(JSON.parse(JSON.stringify(r.sauvegarde)));
  if (!validee.ok) throw new Error(`sauvegarde invalide : ${validee.raison}`);
  return r;
}

describe('régions 6 à 10', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('le boss de la région %i ouvre la région suivante, pas avant', (region) => {
    const boss = region * 10;
    // Avant le boss : la région suivante est fermée, et son premier niveau verrouillé.
    const avant = joueur(boss - 1);
    expect(avant.meta.regionMax).toBe(region);
    expect(niveauDebloque(avant, boss + 1)).toBe(false);
    expect(fin(avant, { niveau: boss + 1 })).toEqual({ ok: false, raison: 'niveau_invalide' });
    const r = reussie(avant, { niveau: boss });
    expect(r.bilan.regionDebloquee).toBe(region + 1);
    expect(r.sauvegarde.meta.regionMax).toBe(region + 1);
    expect(r.sauvegarde.progression.niveauMax).toBe(boss + 1);
    expect(niveauDebloque(r.sauvegarde, boss + 1)).toBe(true);
  });

  it('une victoire sur un niveau ordinaire d’une région ne l’ouvre pas à la suivante', () => {
    for (const niveau of [51, 55, 59, 61, 75, 99]) {
      const r = reussie(joueur(niveau - 1), { niveau });
      expect(r.bilan.regionDebloquee, String(niveau)).toBeUndefined();
      expect(r.sauvegarde.meta.regionMax).toBe(Math.floor((niveau - 1) / 10) + 1);
    }
  });

  it('rejouer un boss déjà battu n’ouvre rien de plus', () => {
    const premiere = reussie(joueur(59), { niveau: 60 });
    const seconde = reussie(premiere.sauvegarde, { niveau: 60, etoiles: 1 });
    expect(seconde.bilan.regionDebloquee).toBeUndefined();
    expect(seconde.sauvegarde.meta.regionMax).toBe(7);
  });

  it('un boss de région 6 à 10 rapporte les braises d’un boss (5 + 10, et 2 pour les 3 étoiles)', () => {
    const r = reussie(joueur(69), { niveau: 70 });
    expect(r.bilan.braises).toBe(braisesDeVictoire(70, true, true));
    expect(r.bilan.braises).toBe(17);
  });

  it('une défaite ou un abandon sur un boss n’ouvre aucune région', () => {
    const s = joueur(59);
    for (const statut of ['defaite', 'abandon'] as const) {
      const r = reussie(s, { niveau: 60, statut, etoiles: 1 });
      expect(r.bilan.regionDebloquee).toBeUndefined();
      expect(r.sauvegarde.meta.regionMax).toBe(6);
    }
  });
});

describe('disciples offerts aux boss des régions 6 et 8', () => {
  it('les boss des régions 2, 4, 6 et 8 offrent un disciple', () => {
    expect(NIVEAUX_DISCIPLE_OFFERT).toEqual([20, 40, 60, 80]);
  });

  it('la suite complète 20, 40, 60, 80 offre Suie, Mastoc, Rouage, Corbeau, dans cet ordre', () => {
    let s = joueur(19);
    const offerts: (IdHeros | undefined)[] = [];
    for (const boss of [20, 40, 60, 80]) {
      for (let n = s.progression.niveauMax; n < boss; n++) s = enregistrerVictoire(s, n, 'matou', 3);
      const r = reussie(s, { niveau: boss });
      offerts.push(r.bilan.discipleOffert);
      s = r.sauvegarde;
    }
    expect(offerts).toEqual(DISCIPLES_OFFERTS.slice(0, 4));
    expect(offerts).toEqual(['suie', 'mastoc', 'rouage', 'corbeau']);
    expect(Object.keys(s.meta.heros)).toHaveLength(3 + 4);
  });

  it('la région 6 offre le premier disciple non possédé (ici Rouage après Suie et Mastoc)', () => {
    const r = reussie(joueur(59, ['suie', 'mastoc']), { niveau: 60 });
    expect(r.bilan.discipleOffert).toBe('rouage');
    expect(r.sauvegarde.meta.heros.rouage).toEqual({ xp: 0, competences: {} });
  });

  it('la région 8 saute un disciple déjà acheté', () => {
    const r = reussie(joueur(79, ['suie', 'mastoc', 'rouage']), { niveau: 80 });
    expect(r.bilan.discipleOffert).toBe('corbeau');
    const achete = reussie(joueur(79, ['suie', 'mastoc', 'rouage', 'corbeau']), { niveau: 80 });
    expect(achete.bilan.discipleOffert).toBe('brise_os');
  });

  it('plus rien à offrir quand les six disciples sont possédés', () => {
    const tous: IdHeros[] = ['suie', 'mastoc', 'rouage', 'corbeau', 'brise_os', 'lanterne'];
    expect(reussie(joueur(59, tous), { niveau: 60 }).bilan.discipleOffert).toBeUndefined();
  });

  it('seule la première victoire l’offre, et pas les boss 70, 90, 100, ni une défaite ou un défi', () => {
    const premiere = reussie(joueur(59), { niveau: 60 });
    expect(premiere.bilan.discipleOffert).toBe('suie');
    expect(reussie(premiere.sauvegarde, { niveau: 60 }).bilan.discipleOffert).toBeUndefined();
    for (const niveau of [70, 90, 100]) expect(reussie(joueur(niveau - 1), { niveau }).bilan.discipleOffert, String(niveau)).toBeUndefined();
    expect(reussie(joueur(59), { niveau: 60, statut: 'defaite', etoiles: 1 }).bilan.discipleOffert).toBeUndefined();
    expect(reussie(joueur(60), { niveau: 60, defi: 'heroique' }).bilan.discipleOffert).toBeUndefined();
  });
});

describe('mode infini ouvert par le boss de la région 1', () => {
  it('fermé avant, ouvert après la première victoire sur le niveau 10', () => {
    const avant = joueur(9);
    expect(infiniOuvert(avant)).toBe(false);
    const r = reussie(avant, { niveau: 10 });
    expect(infiniOuvert(r.sauvegarde)).toBe(true);
    expect(r.bilan.infiniDebloque).toBe(true);
  });

  it('la signalisation n’a lieu qu’une fois, et pas pour les autres boss', () => {
    const premiere = reussie(joueur(9), { niveau: 10 });
    expect(reussie(premiere.sauvegarde, { niveau: 10 }).bilan.infiniDebloque).toBeUndefined();
    expect(reussie(joueur(19), { niveau: 20 }).bilan.infiniDebloque).toBeUndefined();
  });

  it('une défaite sur le boss de la région 1 ne l’ouvre pas', () => {
    const r = reussie(joueur(9), { niveau: 10, statut: 'defaite', etoiles: 1 });
    expect(infiniOuvert(r.sauvegarde)).toBe(false);
    expect(r.bilan.infiniDebloque).toBeUndefined();
  });
});

describe('fin de campagne', () => {
  it('la première victoire sur le boss de la région 10 termine la campagne', () => {
    const avant = joueur(99);
    expect(campagneTerminee(avant)).toBe(false);
    expect(avant.meta.regionMax).toBe(10);
    const r = reussie(avant, { niveau: NIVEAU_FIN_CAMPAGNE });
    expect(r.bilan.campagneTerminee).toBe(true);
    expect(campagneTerminee(r.sauvegarde)).toBe(true);
    // Il n'y a pas de région 11 : rien n'est ouvert, le plafond reste le niveau 100 et la région 10.
    expect(r.bilan.regionDebloquee).toBeUndefined();
    expect(r.sauvegarde.progression.niveauMax).toBe(100);
    expect(r.sauvegarde.meta.regionMax).toBe(10);
  });

  it('l’écran de fin n’est annoncé qu’une fois : rejouer le Soleil Blême ne le refait pas', () => {
    const premiere = reussie(joueur(99), { niveau: 100 });
    expect(reussie(premiere.sauvegarde, { niveau: 100 }).bilan.campagneTerminee).toBeUndefined();
  });

  it('ni une défaite, ni un abandon, ni un défi, ni un autre niveau ne terminent la campagne', () => {
    expect(campagneTerminee(reussie(joueur(99), { niveau: 100, statut: 'defaite', etoiles: 1 }).sauvegarde)).toBe(false);
    expect(reussie(joueur(99), { niveau: 100, statut: 'abandon', etoiles: 1 }).bilan.campagneTerminee).toBeUndefined();
    expect(reussie(joueur(98), { niveau: 99 }).bilan.campagneTerminee).toBeUndefined();
    expect(reussie(joueur(100), { niveau: 100, defi: 'fer' }).bilan.campagneTerminee).toBeUndefined();
  });

  it('une sauvegarde neuve ou à mi-campagne n’est pas terminée', () => {
    expect(campagneTerminee(sauvegardeVide())).toBe(false);
    expect(campagneTerminee(joueur(99))).toBe(false);
  });

  it('le niveau 100 reste verrouillé tant que le 99 n’est pas gagné', () => {
    expect(fin(joueur(98), { niveau: 100 })).toEqual({ ok: false, raison: 'niveau_invalide' });
  });
});
