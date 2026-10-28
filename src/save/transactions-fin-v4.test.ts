// Fin de partie, jalon 3 : récompense d'un défi (une fois), disciple offert au boss des régions 2 et 4, région débloquée.
import { describe, expect, it } from 'vitest';
import { BRAISES_DEFI, DISCIPLES_OFFERTS, PLAFOND_MONNAIE, braisesDeVictoire, xpDePartie, type IdHeros } from '../data/meta';
import { DEFS_TEST } from './aides.test-utils';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { enregistrerFinDePartie, type FinDePartieMeta, type ResultatFin } from './transactions';
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

describe('récompense d’un défi', () => {
  it('Héroïque réussi : 4 braises, défi marqué, et rien d’autre de la campagne (ni étoiles, ni arêtes, ni braises de première victoire)', () => {
    const s = joueur(3);
    const r = reussie(s, { niveau: 2, defi: 'heroique', etoiles: 2 });
    expect(r.bilan.braises).toBe(BRAISES_DEFI);
    expect(r.bilan.defiReussi).toBe('heroique');
    expect(r.bilan.aretes).toBe(0);
    expect(r.bilan.nouvellesEtoiles).toBe(0);
    expect(r.sauvegarde.meta.monnaies).toEqual({ aretes: 0, braises: BRAISES_DEFI });
    expect(r.sauvegarde.meta.defis).toEqual({ '2': { heroique: true } });
    expect(r.sauvegarde.progression).toEqual(s.progression);
    // Le héros gagne l'expérience d'une victoire.
    expect(r.bilan.xp).toBe(xpDePartie(2, true));
    expect(r.sauvegarde.meta.heros.charlie?.xp).toBe(xpDePartie(2, true));
  });

  it('la récompense n’est donnée qu’une fois par défi et par niveau', () => {
    const premiere = reussie(joueur(3), { niveau: 2, defi: 'heroique' });
    const seconde = reussie(premiere.sauvegarde, { niveau: 2, defi: 'heroique' });
    expect(seconde.bilan.braises).toBe(0);
    expect(seconde.bilan.defiReussi).toBeUndefined();
    expect(seconde.sauvegarde.meta.monnaies.braises).toBe(BRAISES_DEFI);
    expect(seconde.sauvegarde.meta.defis).toEqual({ '2': { heroique: true } });
  });

  it('Fer est un défi à part : 4 braises de plus, Héroïque garde sa marque', () => {
    const apresHeroique = reussie(joueur(3), { niveau: 2, defi: 'heroique' }).sauvegarde;
    const r = reussie(apresHeroique, { niveau: 2, defi: 'fer' });
    expect(r.bilan.defiReussi).toBe('fer');
    expect(r.sauvegarde.meta.defis).toEqual({ '2': { heroique: true, fer: true } });
    expect(r.sauvegarde.meta.monnaies.braises).toBe(2 * BRAISES_DEFI);
  });

  it('chaque niveau a ses propres défis', () => {
    let s = reussie(joueur(3), { niveau: 2, defi: 'fer' }).sauvegarde;
    s = reussie(s, { niveau: 3, defi: 'fer' }).sauvegarde;
    expect(s.meta.defis).toEqual({ '2': { fer: true }, '3': { fer: true } });
    expect(s.meta.monnaies.braises).toBe(2 * BRAISES_DEFI);
  });

  it('un défi perdu ou abandonné ne rapporte rien et ne marque rien ; la défaite donne la moitié de l’expérience', () => {
    const s = joueur(3);
    const defaite = reussie(s, { niveau: 2, defi: 'fer', statut: 'defaite', etoiles: 1 });
    expect(defaite.bilan.braises).toBe(0);
    expect(defaite.bilan.defiReussi).toBeUndefined();
    expect(defaite.sauvegarde.meta.defis).toEqual({});
    expect(defaite.bilan.xp).toBe(xpDePartie(2, false));
    const abandon = reussie(s, { niveau: 2, defi: 'heroique', statut: 'abandon', etoiles: 1 });
    expect(abandon.bilan.braises).toBe(0);
    expect(abandon.bilan.xp).toBe(0);
    expect(abandon.sauvegarde.meta.defis).toEqual({});
  });

  it('refuse une victoire de défi sur un niveau qui n’a pas 3 étoiles, ou un défi inconnu : rien ne bouge', () => {
    let s = joueur(3);
    s = enregistrerVictoire(s, 4, 'matou', 2);
    const avant = structuredClone(s);
    expect(fin(s, { niveau: 4, defi: 'heroique' })).toEqual({ ok: false, raison: 'niveau_invalide' });
    expect(fin(s, { niveau: 5, defi: 'fer' })).toEqual({ ok: false, raison: 'niveau_invalide' });
    expect(fin(s, { niveau: 2, defi: 'normal' })).toEqual({ ok: false, raison: 'niveau_invalide' });
    expect(fin(s, { niveau: 2, defi: 'constructor' })).toEqual({ ok: false, raison: 'niveau_invalide' });
    expect(s).toEqual(avant);
  });

  it('les braises du défi respectent le plafond des monnaies', () => {
    const s = joueur(3);
    const presque = { ...s, meta: { ...s.meta, monnaies: { aretes: 0, braises: PLAFOND_MONNAIE - 1 } } };
    const r = reussie(presque, { niveau: 2, defi: 'heroique' });
    expect(r.sauvegarde.meta.monnaies.braises).toBe(PLAFOND_MONNAIE);
    expect(r.bilan.braises).toBe(1);
  });

  it('sans défi, une victoire ordinaire n’est pas touchée (étoiles, arêtes, braises de première victoire)', () => {
    const s = joueur(2);
    const r = reussie(s, { niveau: 3 });
    expect(r.bilan.defiReussi).toBeUndefined();
    expect(r.bilan.braises).toBe(braisesDeVictoire(3, true, true));
    expect(r.sauvegarde.meta.defis).toEqual({});
  });
});

describe('disciple offert au boss des régions 2 et 4', () => {
  it('la première victoire sur le niveau 20 offre Suie ; sur le niveau 40, Mastoc', () => {
    const r20 = reussie(joueur(19), { niveau: 20 });
    expect(r20.bilan.discipleOffert).toBe('suie');
    expect(r20.sauvegarde.meta.heros.suie).toEqual({ xp: 0, competences: {} });
    const r40 = reussie(joueur(39, ['suie']), { niveau: 40 });
    expect(r40.bilan.discipleOffert).toBe('mastoc');
    expect(r40.sauvegarde.meta.heros.mastoc).toEqual({ xp: 0, competences: {} });
  });

  it('prend le premier disciple non possédé dans l’ordre Suie, Mastoc, Rouage, Corbeau, Brise-Os, Lanterne', () => {
    expect([...DISCIPLES_OFFERTS]).toEqual(['suie', 'mastoc', 'rouage', 'corbeau', 'brise_os', 'lanterne']);
    const casses: [IdHeros[], IdHeros | undefined][] = [
      [[], 'suie'],
      [['suie'], 'mastoc'],
      [['mastoc'], 'suie'],
      [['suie', 'mastoc'], 'rouage'],
      [['suie', 'rouage'], 'mastoc'],
      [['suie', 'mastoc', 'rouage'], 'corbeau'],
      [['suie', 'mastoc', 'rouage', 'corbeau'], 'brise_os'],
      [['suie', 'mastoc', 'rouage', 'corbeau', 'brise_os'], 'lanterne'],
      [['suie', 'mastoc', 'rouage', 'corbeau', 'brise_os', 'lanterne'], undefined],
      [['lanterne', 'brise_os'], 'suie'],
    ];
    for (const [possedes, attendu] of casses) {
      const r = reussie(joueur(19, possedes), { niveau: 20 });
      expect(r.bilan.discipleOffert, possedes.join(',')).toBe(attendu);
      expect(Object.keys(r.sauvegarde.meta.heros).length, possedes.join(',')).toBe(3 + possedes.length + (attendu ? 1 : 0));
    }
  });

  it('un disciple déjà acheté n’est pas offert une seconde fois : on passe au suivant', () => {
    const r = reussie(joueur(19, ['suie']), { niveau: 20 });
    expect(r.bilan.discipleOffert).toBe('mastoc');
    expect(r.sauvegarde.meta.heros.suie).toEqual({ xp: 0, competences: {} });
  });

  it('seule la première victoire sur le boss l’offre : rejouer le niveau ne fait pas pleuvoir les disciples', () => {
    const premiere = reussie(joueur(19), { niveau: 20 });
    const seconde = reussie(premiere.sauvegarde, { niveau: 20 });
    expect(seconde.bilan.discipleOffert).toBeUndefined();
    expect(Object.keys(seconde.sauvegarde.meta.heros)).toHaveLength(4);
    // Même en changeant de difficulté ou d'étoiles.
    const troisieme = reussie(seconde.sauvegarde, { niveau: 20, difficulte: 'vieux_sage', etoiles: 1 });
    expect(troisieme.bilan.discipleOffert).toBeUndefined();
  });

  it('pas de disciple pour les autres boss (10, 30, 50…), les autres niveaux, une défaite, un abandon ni un défi', () => {
    for (const niveau of [10, 19, 30, 50]) {
      expect(reussie(joueur(niveau - 1), { niveau }).bilan.discipleOffert, String(niveau)).toBeUndefined();
    }
    expect(reussie(joueur(19), { niveau: 20, statut: 'defaite', etoiles: 1 }).bilan.discipleOffert).toBeUndefined();
    expect(reussie(joueur(19), { niveau: 20, statut: 'abandon', etoiles: 1 }).bilan.discipleOffert).toBeUndefined();
    const defi = reussie(joueur(20), { niveau: 20, defi: 'heroique' });
    expect(defi.bilan.discipleOffert).toBeUndefined();
  });

  it('un disciple offert part à 0 d’expérience, sans compétence, et le héros joué garde sa propre expérience', () => {
    const r = reussie(joueur(19), { niveau: 20, heros: 'plume' });
    expect(r.sauvegarde.meta.heros.suie).toEqual({ xp: 0, competences: {} });
    expect(r.sauvegarde.meta.heros.plume?.xp).toBe(xpDePartie(20, true));
  });
});

describe('région débloquée', () => {
  it('battre le boss de la région r ouvre la région r + 1, et le bilan le dit', () => {
    const r10 = reussie(joueur(9), { niveau: 10 });
    expect(r10.bilan.regionDebloquee).toBe(2);
    expect(r10.sauvegarde.meta.regionMax).toBe(2);
    expect(r10.sauvegarde.progression.niveauMax).toBe(11);
    const r20 = reussie(joueur(19), { niveau: 20 });
    expect(r20.bilan.regionDebloquee).toBe(3);
    expect(r20.sauvegarde.meta.regionMax).toBe(3);
  });

  it('aucune région avant le boss, sur un défaite, un abandon, ou en rejouant le boss', () => {
    expect(reussie(joueur(8), { niveau: 9 }).bilan.regionDebloquee).toBeUndefined();
    expect(reussie(joueur(9), { niveau: 10, statut: 'defaite', etoiles: 1 }).bilan.regionDebloquee).toBeUndefined();
    expect(reussie(joueur(9), { niveau: 10, statut: 'defaite', etoiles: 1 }).sauvegarde.meta.regionMax).toBe(1);
    expect(reussie(joueur(9), { niveau: 10, statut: 'abandon', etoiles: 1 }).sauvegarde.meta.regionMax).toBe(1);
    expect(reussie(joueur(10), { niveau: 10 }).bilan.regionDebloquee).toBeUndefined();
  });

  it('la région 10 est la dernière : gagner le niveau 100 n’ouvre rien', () => {
    const r = reussie(joueur(99), { niveau: 100 });
    expect(r.bilan.regionDebloquee).toBeUndefined();
    expect(r.sauvegarde.meta.regionMax).toBe(10);
  });

  it('les régions 2 à 5 s’ouvrent l’une après l’autre, et le boss de la région 2 offre Suie en même temps', () => {
    let s = sauvegardeVide();
    const ouvertes: number[] = [];
    for (let n = 1; n <= 50; n++) {
      const r = reussie(s, { niveau: n, heros: 'charlie' });
      if (r.bilan.regionDebloquee) ouvertes.push(r.bilan.regionDebloquee);
      s = r.sauvegarde;
    }
    expect(ouvertes).toEqual([2, 3, 4, 5, 6]);
    expect(s.meta.regionMax).toBe(6);
    // Les boss 20 et 40 ont offert Suie puis Mastoc.
    expect(Object.keys(s.meta.heros).sort()).toEqual(['charlie', 'mastoc', 'plume', 'pollen', 'suie']);
  });
});
