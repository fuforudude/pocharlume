// Fin de partie du DLC « Temps modernes » : une victoire du DLC passe par la progression du DLC (`moderne`), jamais par celle de
// l'histoire, et inversement ; braises aux montants de la spec (15 la première victoire, +30 au boss, +6 aux 3 étoiles, 12 par défi) ;
// la session exige la même campagne pour effacer la partie rangée. Les niveaux du DLC ne sont pas encore livrés : ces tests raisonnent sur
// des numéros et sur un plan de l'histoire déguisé en niveau du DLC.
import { describe, expect, it } from 'vitest';
import { BADGES_MODERNE } from '../data/recompenses-moderne';
import { REGION1 } from '../data/niveaux/region1';
import { VERSION_DONNEES } from '../data/version';
import { premiereCaseLibre } from '../engine/aides.test-utils';
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import { appliquerAction, creerPartie, step } from '../engine/partie';
import { DEFS_TEST, FIXTURE_V8 } from './aides.test-utils';
import { migrer } from './migrations';
import { Depot } from './depot';
import { moderneParDefaut, sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { enregistrerVictoireModerne } from './moderne';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { enregistrerFinDePartie, type FinDePartieMeta, type ResultatFin } from './transactions';
import { validerSauvegarde } from './validation';

/** Un joueur du DLC qui a gagné les niveaux 1 à `jusqua` du DLC en 3 étoiles (Matou). */
function joueurModerne(jusqua: number): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= jusqua; n++) s = enregistrerVictoireModerne(s, n, 'matou', 3);
  return s;
}

function fin(s: Sauvegarde, changements: Partial<FinDePartieMeta> & { niveau: number }): ResultatFin {
  return enregistrerFinDePartie(s, { statut: 'victoire', difficulte: 'matou', etoiles: 3, heros: 'charlie', campagne: 'moderne', ...changements }, DEFS_TEST);
}

function reussie(s: Sauvegarde, changements: Partial<FinDePartieMeta> & { niveau: number }): Extract<ResultatFin, { ok: true }> {
  const r = fin(s, changements);
  if (!r.ok) throw new Error(`refusée : ${r.raison}`);
  const validee = validerSauvegarde(JSON.parse(JSON.stringify(r.sauvegarde)));
  if (!validee.ok) throw new Error(`sauvegarde invalide : ${validee.raison}`);
  return r;
}

describe('victoire du DLC : la progression du DLC, jamais celle de l’histoire', () => {
  it('enregistre les étoiles et débloque le niveau suivant dans `moderne.progression` seulement', () => {
    const avant = sauvegardeVide();
    const r = reussie(avant, { niveau: 1, etoiles: 2 });
    expect(r.sauvegarde.moderne.progression).toEqual({ niveauMax: 2, etoiles: { '1': { matou: 2 } } });
    expect(r.sauvegarde.progression).toEqual(avant.progression);
    expect(r.sauvegarde.meta.regionMax).toBe(avant.meta.regionMax);
    expect(r.sauvegarde.meta.defis).toEqual({});
    expect(r.sauvegarde.meta.infini).toEqual(avant.meta.infini);
    expect(r.bilan.nouvellesEtoiles).toBe(2);
  });

  it('une victoire de l’histoire ne touche pas à la progression du DLC', () => {
    const avant = sauvegardeVide();
    const r = enregistrerFinDePartie(avant, { niveau: 1, statut: 'victoire', difficulte: 'matou', etoiles: 3, heros: 'charlie' }, DEFS_TEST);
    expect(r.ok && r.sauvegarde.moderne).toEqual(moderneParDefaut());
    expect(r.ok && r.sauvegarde.progression.niveauMax).toBe(2);
  });

  it('le niveau du DLC se juge sur la progression du DLC : l’histoire avancée n’ouvre rien', () => {
    let s = sauvegardeVide();
    for (let n = 1; n <= 40; n++) s = enregistrerVictoire(s, n, 'matou', 3);
    expect(fin(s, { niveau: 5 })).toEqual({ ok: false, raison: 'niveau_invalide' });
    // Et un niveau de l'histoire ne s'ouvre pas avec le DLC.
    const dlc = joueurModerne(30);
    expect(enregistrerFinDePartie(dlc, { niveau: 5, statut: 'victoire', difficulte: 'matou', etoiles: 3 }, DEFS_TEST)).toEqual({ ok: false, raison: 'niveau_invalide' });
  });

  it('refuse un niveau hors du DLC (31) même si l’histoire le permettrait', () => {
    expect(fin(joueurModerne(30), { niveau: 31 })).toEqual({ ok: false, raison: 'niveau_invalide' });
  });

  it('une victoire des niveaux 10, 20 et 30 du DLC n’ouvre ni mode infini, ni disciple, ni région de l’histoire, ni fin de campagne', () => {
    for (const niveau of [10, 20, 30]) {
      const r = reussie(joueurModerne(niveau - 1), { niveau });
      expect(r.bilan.infiniDebloque).toBeUndefined();
      expect(r.bilan.discipleOffert).toBeUndefined();
      expect(r.bilan.regionDebloquee).toBeUndefined();
      expect(r.bilan.campagneTerminee).toBeUndefined();
      expect(Object.keys(r.sauvegarde.meta.heros)).toEqual(Object.keys(sauvegardeVide().meta.heros));
      expect(r.sauvegarde.meta.regionMax).toBe(1);
    }
  });

  it('l’original n’est pas modifié', () => {
    const avant = joueurModerne(3);
    const copie = JSON.stringify(avant);
    reussie(avant, { niveau: 3 });
    expect(JSON.stringify(avant)).toBe(copie);
  });

  it('arêtes et expérience : celles des niveaux 100 + N, figées (choix de l’étudiant du 2026-11-12)', () => {
    // Niveau 1 du DLC en 3 étoiles = 681 arêtes (81 au niveau 1 de l'histoire) et 2 120 points d'expérience (120 dans l'histoire).
    const r = reussie(sauvegardeVide(), { niveau: 1 });
    expect(r.bilan.aretes).toBe(681);
    expect(r.bilan.xp).toBe(2120);
    expect(r.sauvegarde.meta.monnaies.aretes).toBe(681);
    expect(reussie(sauvegardeVide(), { niveau: 1, etoiles: 1 }).bilan.aretes).toBe(651);
    expect(reussie(r.sauvegarde, { niveau: 1 }).bilan.aretes).toBe(212);
    expect(enregistrerFinDePartie(sauvegardeVide(), { niveau: 1, statut: 'defaite', difficulte: 'matou', etoiles: 0, heros: 'charlie', campagne: 'moderne' }, DEFS_TEST)).toMatchObject({ ok: true, bilan: { xp: 1060, aretes: 0 } });
  });
});

describe('braises du DLC (montants de la spec)', () => {
  it('15 la première victoire, 6 de plus aux 3 étoiles', () => {
    expect(reussie(sauvegardeVide(), { niveau: 1, etoiles: 1 }).bilan.braises).toBe(15);
    expect(reussie(sauvegardeVide(), { niveau: 1, etoiles: 3 }).bilan.braises).toBe(15 + 6);
  });

  it('+30 au boss de chaque région (10, 20, 30), pas aux autres niveaux', () => {
    for (const boss of [10, 20, 30]) expect(reussie(joueurModerne(boss - 1), { niveau: boss, etoiles: 1 }).bilan.braises).toBe(15 + 30);
    expect(reussie(joueurModerne(4), { niveau: 5, etoiles: 1 }).bilan.braises).toBe(15);
  });

  it('les 3 étoiles ne rapportent leurs 6 braises qu’une fois, et une victoire répétée rien', () => {
    const premiere = reussie(sauvegardeVide(), { niveau: 1, etoiles: 1 });
    const trois = reussie(premiere.sauvegarde, { niveau: 1, etoiles: 3 });
    expect(trois.bilan.braises).toBe(6);
    expect(reussie(trois.sauvegarde, { niveau: 1, etoiles: 3 }).bilan.braises).toBe(0);
    expect(trois.sauvegarde.meta.monnaies.braises).toBe(21);
  });

  it('vont dans les monnaies habituelles (`meta.monnaies.braises`), les badges vont dans `moderne.badges`', () => {
    const r = reussie(sauvegardeVide(), { niveau: 1 });
    expect(r.sauvegarde.meta.monnaies.braises).toBe(21);
    expect(r.sauvegarde.moderne.badges).toBe(BADGES_MODERNE.premiereVictoire + BADGES_MODERNE.troisEtoiles);
  });

  it('12 par défi réussi la première fois, sur le niveau du DLC à 3 étoiles ; le défi est noté dans `moderne.defis`', () => {
    const base = joueurModerne(2);
    const r = reussie(base, { niveau: 1, defi: 'heroique' });
    expect(r.bilan.braises).toBe(12);
    expect(r.bilan.defiReussi).toBe('heroique');
    expect(r.sauvegarde.moderne.defis).toEqual({ '1': { heroique: true } });
    expect(r.sauvegarde.meta.defis).toEqual({});
    // Étoiles et niveau suivant inchangés par un défi.
    expect(r.sauvegarde.moderne.progression).toEqual(base.moderne.progression);
    // Une seconde réussite ne rapporte plus rien ; un autre défi rapporte de nouveau 12.
    expect(reussie(r.sauvegarde, { niveau: 1, defi: 'heroique' }).bilan.braises).toBe(0);
    expect(reussie(r.sauvegarde, { niveau: 1, defi: 'fer' }).bilan.braises).toBe(12);
  });

  it('un défi exige les 3 étoiles dans le DLC : celles de l’histoire ne comptent pas', () => {
    let s = sauvegardeVide();
    s = enregistrerVictoire(s, 1, 'matou', 3);
    s = enregistrerVictoireModerne(s, 1, 'matou', 2);
    expect(fin(s, { niveau: 1, defi: 'heroique' })).toEqual({ ok: false, raison: 'niveau_invalide' });
  });

  it('un défi du DLC ne note rien dans les défis de l’histoire, et inversement', () => {
    let s = joueurModerne(1);
    s = enregistrerVictoire(s, 1, 'matou', 3);
    const dlc = reussie(s, { niveau: 1, defi: 'fer' });
    expect(dlc.sauvegarde.meta.defis).toEqual({});
    const histoire = enregistrerFinDePartie(s, { niveau: 1, statut: 'victoire', difficulte: 'matou', etoiles: 3, defi: 'fer' }, DEFS_TEST);
    expect(histoire.ok && histoire.sauvegarde.moderne.defis).toEqual({});
    expect(histoire.ok && histoire.sauvegarde.meta.defis).toEqual({ '1': { fer: true } });
  });

  it('défaite et abandon : aucune braise, aucune progression', () => {
    for (const statut of ['defaite', 'abandon'] as const) {
      const r = reussie(sauvegardeVide(), { niveau: 1, statut, etoiles: 0 });
      expect(r.bilan.braises).toBe(0);
      expect(r.sauvegarde.moderne).toEqual(moderneParDefaut());
    }
  });
});

describe('sauvegarde v8 migrée', () => {
  it('une victoire du DLC sur la fixture v8 migrée (histoire avancée, partie rangée) laisse l’histoire intacte et reste valide', () => {
    const migree = migrer(JSON.parse(FIXTURE_V8));
    expect(migree.ok).toBe(true);
    if (!migree.ok) return;
    const avant = migree.sauvegarde;
    expect(avant.moderne).toEqual(moderneParDefaut());
    const r = reussie(avant, { niveau: 1 });
    expect(r.sauvegarde.progression).toEqual(avant.progression);
    expect(r.sauvegarde.meta.regionMax).toBe(avant.meta.regionMax);
    expect(r.sauvegarde.meta.defis).toEqual(avant.meta.defis);
    expect(r.sauvegarde.partie).toEqual(avant.partie);
    expect(r.sauvegarde.moderne.progression.niveauMax).toBe(2);
  });
});

// --- Session ---------------------------------------------------------------------------------------------------------------

const CONFIG: ConfigPartie = { graine: 5, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

/** Une partie du plan du niveau 1 de l'histoire, ou de ce plan rangé comme le niveau 1 du DLC, avec une vague lancée. */
function partie(campagne: 'histoire' | 'moderne'): EtatPartie {
  const base = REGION1[0]?.niveau;
  if (!base) throw new Error('niveau 1 absent');
  const etat = creerPartie(campagne === 'moderne' ? { ...base, campagne: 'moderne' as const } : base, CONFIG);
  appliquerAction(etat, { type: 'construire', ...premiereCaseLibre(etat), tour: 'tir' });
  while (etat.vagues.lancees < 1 && etat.statut === 'en_cours') step(etat);
  return etat;
}

async function ouvrir(stockage = new StockageMemoire()): Promise<{ session: Session; stockage: StockageMemoire }> {
  return { session: await Session.ouvrir(new Depot(stockage), null, { defs: DEFS_TEST }), stockage };
}

describe('session : enregistrerFin du DLC', () => {
  it('une victoire du DLC est enregistrée dans le DLC, avec ses braises, et survit au rechargement', async () => {
    const { session, stockage } = await ouvrir();
    const r = await session.enregistrerFin({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG, campagne: 'moderne' });
    expect(r.bilan?.braises).toBe(21);
    expect(session.sauvegarde.moderne.progression.niveauMax).toBe(2);
    expect(session.sauvegarde.progression.niveauMax).toBe(1);
    expect(session.sauvegarde.meta.monnaies.braises).toBe(21);
    const relue = (await ouvrir(stockage)).session;
    expect(relue.sauvegarde.moderne.progression).toEqual(session.sauvegarde.moderne.progression);
    expect(relue.sauvegarde.progression).toEqual(session.sauvegarde.progression);
  });

  it('une victoire de l’histoire (sans `campagne`) ne touche pas au DLC', async () => {
    const { session } = await ouvrir();
    await session.enregistrerFin({ niveau: 1, statut: 'victoire', etoiles: 3, config: CONFIG });
    expect(session.sauvegarde.progression.niveauMax).toBe(2);
    expect(session.sauvegarde.moderne).toEqual(moderneParDefaut());
  });

  it('l’abandon d’une partie du DLC efface sa partie rangée ; sans la campagne, celle de l’histoire n’est pas la sienne', async () => {
    const { session } = await ouvrir();
    expect(await session.rangerPartie(partie('moderne'), 1)).toBe(true);
    expect(session.sauvegarde.partie?.campagne).toBe('moderne');
    // Même niveau, même graine, mais l'autre campagne : la partie du DLC est gardée.
    await session.enregistrerFin({ niveau: 1, statut: 'abandon', etoiles: 0, config: CONFIG });
    expect(session.sauvegarde.partie?.campagne).toBe('moderne');
    await session.enregistrerFin({ niveau: 1, statut: 'abandon', etoiles: 0, config: CONFIG, campagne: 'moderne' });
    expect(session.sauvegarde.partie).toBeNull();
  });

  it('et inversement : l’abandon d’une partie du DLC n’efface pas la partie de l’histoire de même niveau et même graine', async () => {
    const { session } = await ouvrir();
    expect(await session.rangerPartie(partie('histoire'), 1)).toBe(true);
    await session.enregistrerFin({ niveau: 1, statut: 'abandon', etoiles: 0, config: CONFIG, campagne: 'moderne' });
    expect(session.sauvegarde.partie).not.toBeNull();
    await session.enregistrerFin({ niveau: 1, statut: 'abandon', etoiles: 0, config: CONFIG });
    expect(session.sauvegarde.partie).toBeNull();
  });

  it('« Reprendre » : la partie du DLC rangée se relit comme une reprise du DLC, celle de l’histoire sans campagne', async () => {
    const { session, stockage } = await ouvrir();
    await session.rangerPartie(partie('moderne'), 1);
    const reprise = (await ouvrir(stockage)).session.partieAReprendre();
    expect(reprise?.campagne).toBe('moderne');
    expect(reprise?.etat.niveau.campagne).toBe('moderne');
    await session.effacerPartie();
    await session.rangerPartie(partie('histoire'), 1);
    expect(session.partieAReprendre()?.campagne).toBeUndefined();
  });
});
