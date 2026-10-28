// Transactions du mode infini : record par carte, paliers payés une seule fois au total, objets rendus, ouverture du
// mode et cartes jouables.
import { describe, expect, it } from 'vitest';
import { NIVEAU_OUVERTURE_INFINI, PALIERS_INFINI, PLAFOND_MONNAIE, RECOMPENSES_PALIERS_INFINI } from '../data/meta';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { cartesInfiniJouables, enregistrerFinInfinie, infiniOuvert, recordDeLaCarte } from './transactions-infini';
import { validerSauvegarde } from './validation';

/** Une sauvegarde où le boss de la région 1 est battu (niveaux 1 à 10) : le mode infini est ouvert. */
function infiniOuvertSauvegarde(): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= NIVEAU_OUVERTURE_INFINI; n++) s = enregistrerVictoire(s, n, 'matou', 1);
  return s;
}

function jouer(s: Sauvegarde, carte: string, vague: number, extra: { objetsEquipes?: string[]; objetsUtilises?: string[] } = {}) {
  const r = enregistrerFinInfinie(s, { carte, vague, ...extra });
  if (!r.ok) throw new Error(r.raison);
  return r;
}

describe('ouverture du mode infini', () => {
  it('fermé tant que le boss de la région 1 (niveau 10) n’est pas battu', () => {
    expect(infiniOuvert(sauvegardeVide())).toBe(false);
    let s = sauvegardeVide();
    for (let n = 1; n <= 9; n++) s = enregistrerVictoire(s, n, 'matou', 3);
    expect(infiniOuvert(s)).toBe(false);
    expect(infiniOuvert(enregistrerVictoire(s, 10, 'chaton', 1))).toBe(true);
  });

  it('une partie infinie est refusée tant qu’il est fermé, sans rien changer', () => {
    expect(enregistrerFinInfinie(sauvegardeVide(), { carte: 'chaumes', vague: 12 })).toEqual({ ok: false, raison: 'infini_ferme' });
  });
});

describe('record par carte', () => {
  it('enregistre la dernière vague terminée comme record de la carte', () => {
    const r = jouer(infiniOuvertSauvegarde(), 'chaumes', 7);
    expect(r.sauvegarde.meta.infini.records).toEqual({ chaumes: 7 });
    expect(r.bilan).toMatchObject({ vague: 7, record: 7, recordPrecedent: 0, nouveauRecord: true });
    expect(recordDeLaCarte(r.sauvegarde, 'chaumes')).toBe(7);
    expect(recordDeLaCarte(r.sauvegarde, 'gue')).toBe(0);
  });

  it('un record n’est mis à jour que s’il est battu', () => {
    let s = jouer(infiniOuvertSauvegarde(), 'chaumes', 9).sauvegarde;
    const moins = jouer(s, 'chaumes', 4);
    expect(moins.sauvegarde.meta.infini.records).toEqual({ chaumes: 9 });
    expect(moins.bilan).toMatchObject({ record: 9, recordPrecedent: 9, nouveauRecord: false });
    const egal = jouer(s, 'chaumes', 9);
    expect(egal.bilan.nouveauRecord).toBe(false);
    s = jouer(s, 'chaumes', 14).sauvegarde;
    expect(recordDeLaCarte(s, 'chaumes')).toBe(14);
  });

  it('chaque carte a son record', () => {
    let s = jouer(infiniOuvertSauvegarde(), 'chaumes', 9).sauvegarde;
    s = jouer(s, 'gue', 3).sauvegarde;
    expect(s.meta.infini.records).toEqual({ chaumes: 9, gue: 3 });
  });

  it('une partie arrêtée avant la fin de la première vague (0) ne crée aucun record', () => {
    const r = jouer(infiniOuvertSauvegarde(), 'chaumes', 0);
    expect(r.sauvegarde.meta.infini).toEqual({ records: {}, paliers: [] });
    expect(r.bilan).toMatchObject({ nouveauRecord: false, aretes: 0, braises: 0 });
  });

  it('refuse une carte mal formée ou une vague impossible, sans rien changer', () => {
    const s = infiniOuvertSauvegarde();
    for (const carte of ['', 'Chaumes', 'constructor', '__proto__', 'a'.repeat(40), 'ca rte', 12 as unknown as string]) {
      expect(enregistrerFinInfinie(s, { carte, vague: 5 })).toEqual({ ok: false, raison: 'carte_invalide' });
    }
    for (const vague of [-1, 1.5, 10_000, Number.NaN, Infinity, '5' as unknown as number]) {
      expect(enregistrerFinInfinie(s, { carte: 'chaumes', vague })).toEqual({ ok: false, raison: 'vague_invalide' });
    }
  });

  it('refuse un nouveau nom de carte quand 64 cartes ont déjà un record', () => {
    const s = infiniOuvertSauvegarde();
    const records = Object.fromEntries(Array.from({ length: 64 }, (_, i) => [`carte_${String(i)}`, 1]));
    const pleine: Sauvegarde = { ...s, meta: { ...s.meta, infini: { records, paliers: [] } } };
    expect(enregistrerFinInfinie(pleine, { carte: 'une_de_trop', vague: 5 })).toEqual({ ok: false, raison: 'carte_invalide' });
    expect(enregistrerFinInfinie(pleine, { carte: 'carte_3', vague: 5 }).ok).toBe(true);
  });

  it('ne modifie pas la sauvegarde reçue et rend une sauvegarde valide', () => {
    const s = infiniOuvertSauvegarde();
    const avant = JSON.stringify(s);
    const r = jouer(s, 'chaumes', 35);
    expect(JSON.stringify(s)).toBe(avant);
    expect(validerSauvegarde(JSON.parse(JSON.stringify(r.sauvegarde))).ok).toBe(true);
  });

  it('le record survit à une écriture puis une relecture (JSON)', () => {
    const r = jouer(infiniOuvertSauvegarde(), 'chaumes', 22);
    const relue = validerSauvegarde(JSON.parse(JSON.stringify(r.sauvegarde)));
    expect(relue.ok && relue.valeur.meta.infini).toEqual(r.sauvegarde.meta.infini);
  });
});

describe('paliers', () => {
  it('une vague sous le premier palier ne rapporte rien', () => {
    const r = jouer(infiniOuvertSauvegarde(), 'chaumes', 9);
    expect(r.bilan).toMatchObject({ aretes: 0, braises: 0, paliersPayes: [] });
    expect(r.sauvegarde.meta.monnaies).toEqual({ aretes: 0, braises: 0 });
  });

  it('les récompenses sont celles de la spec : arêtes 50/100/150/250/400/600, braises 2/3/5/8/12/20', () => {
    expect(PALIERS_INFINI).toEqual([10, 20, 30, 50, 75, 100]);
    expect(PALIERS_INFINI.map((p) => RECOMPENSES_PALIERS_INFINI[p].aretes)).toEqual([50, 100, 150, 250, 400, 600]);
    expect(PALIERS_INFINI.map((p) => RECOMPENSES_PALIERS_INFINI[p].braises)).toEqual([2, 3, 5, 8, 12, 20]);
  });

  it.each(PALIERS_INFINI)('arrivé d’un coup au palier %i, il est payé avec tous les paliers inférieurs', (palier) => {
    const r = jouer(infiniOuvertSauvegarde(), 'chaumes', palier);
    const dus = PALIERS_INFINI.filter((p) => p <= palier);
    expect(r.bilan.paliersPayes).toEqual(dus);
    expect(r.bilan.aretes).toBe(dus.reduce((t, p) => t + RECOMPENSES_PALIERS_INFINI[p].aretes, 0));
    expect(r.bilan.braises).toBe(dus.reduce((t, p) => t + RECOMPENSES_PALIERS_INFINI[p].braises, 0));
    expect(r.sauvegarde.meta.infini.paliers).toEqual(dus);
  });

  it('la vague juste sous un palier ne le paie pas', () => {
    expect(jouer(infiniOuvertSauvegarde(), 'chaumes', 29).bilan.paliersPayes).toEqual([10, 20]);
  });

  it('chaque palier atteint pendant une partie est payé', () => {
    const r = jouer(infiniOuvertSauvegarde(), 'chaumes', 31);
    expect(r.bilan.paliersPayes).toEqual([10, 20, 30]);
    expect(r.bilan.aretes).toBe(50 + 100 + 150);
    expect(r.bilan.braises).toBe(2 + 3 + 5);
    expect(r.sauvegarde.meta.monnaies).toEqual({ aretes: 300, braises: 10 });
  });

  it('au total, les six paliers rapportent 1 550 arêtes et 50 braises', () => {
    const r = jouer(infiniOuvertSauvegarde(), 'chaumes', 100);
    expect(r.sauvegarde.meta.monnaies).toEqual({ aretes: 1550, braises: 50 });
  });

  it('rejouer la même vague ne repaie rien', () => {
    const premiere = jouer(infiniOuvertSauvegarde(), 'chaumes', 12);
    const seconde = jouer(premiere.sauvegarde, 'chaumes', 12);
    expect(seconde.bilan).toMatchObject({ aretes: 0, braises: 0, paliersPayes: [] });
    expect(seconde.sauvegarde.meta.monnaies).toEqual(premiere.sauvegarde.meta.monnaies);
  });

  it('un palier déjà payé sur une carte ne repaie rien sur une autre carte', () => {
    const sur1 = jouer(infiniOuvertSauvegarde(), 'chaumes', 22);
    expect(sur1.sauvegarde.meta.monnaies).toEqual({ aretes: 150, braises: 5 });
    const sur2 = jouer(sur1.sauvegarde, 'gue', 25);
    expect(sur2.bilan).toMatchObject({ aretes: 0, braises: 0, paliersPayes: [], nouveauRecord: true });
    expect(sur2.sauvegarde.meta.monnaies).toEqual({ aretes: 150, braises: 5 });
    expect(sur2.sauvegarde.meta.infini).toEqual({ records: { chaumes: 22, gue: 25 }, paliers: [10, 20] });
  });

  it('sur une autre carte, seuls les paliers pas encore payés le sont', () => {
    const sur1 = jouer(infiniOuvertSauvegarde(), 'chaumes', 22);
    const sur2 = jouer(sur1.sauvegarde, 'gue', 55);
    expect(sur2.bilan.paliersPayes).toEqual([30, 50]);
    expect(sur2.bilan.aretes).toBe(150 + 250);
    expect(sur2.bilan.braises).toBe(5 + 8);
    expect(sur2.sauvegarde.meta.infini.paliers).toEqual([10, 20, 30, 50]);
  });

  it('atteindre le palier 100 sur une autre carte ne paie que ce qui reste', () => {
    let s = jouer(infiniOuvertSauvegarde(), 'chaumes', 80).sauvegarde;
    const avant = s.meta.monnaies;
    s = jouer(s, 'gue', 100).sauvegarde;
    expect(s.meta.monnaies.aretes - avant.aretes).toBe(600);
    expect(s.meta.monnaies.braises - avant.braises).toBe(20);
  });

  it('les monnaies restent bornées au plafond', () => {
    const s = infiniOuvertSauvegarde();
    const riche: Sauvegarde = { ...s, meta: { ...s.meta, monnaies: { aretes: PLAFOND_MONNAIE - 10, braises: PLAFOND_MONNAIE } } };
    const r = jouer(riche, 'chaumes', 10);
    expect(r.sauvegarde.meta.monnaies).toEqual({ aretes: PLAFOND_MONNAIE, braises: PLAFOND_MONNAIE });
    expect(r.bilan).toMatchObject({ aretes: 10, braises: 0 });
  });

  it('un palier non payé et dépassé sans battre le record est payé quand même', () => {
    const s = infiniOuvertSauvegarde();
    const importee: Sauvegarde = { ...s, meta: { ...s.meta, infini: { records: { chaumes: 40 }, paliers: [10] } } };
    const r = jouer(importee, 'chaumes', 25);
    expect(r.bilan.paliersPayes).toEqual([20]);
    expect(r.bilan.nouveauRecord).toBe(false);
    expect(r.sauvegarde.meta.infini.paliers).toEqual([10, 20]);
  });
});

describe('objets emportés en infini', () => {
  function avecStock(): Sauvegarde {
    const s = infiniOuvertSauvegarde();
    return { ...s, meta: { ...s.meta, objets: { ...s.meta.objets, sablier: 1, herbe_sabbat: 9 } } };
  }

  it('les objets non utilisés sont rendus, ceux qui ont servi restent consommés', () => {
    const r = jouer(avecStock(), 'chaumes', 5, { objetsEquipes: ['sablier', 'herbe_sabbat'], objetsUtilises: ['sablier'] });
    expect(r.bilan.objetsConsommes).toEqual(['sablier']);
    expect(r.bilan.objetsRendus).toEqual(['herbe_sabbat']);
    expect(r.sauvegarde.meta.objets.herbe_sabbat).toBe(10);
    expect(r.sauvegarde.meta.objets.sablier).toBe(1);
  });

  it('le stock rendu ne dépasse pas 10', () => {
    const r = jouer(avecStock(), 'chaumes', 5, { objetsEquipes: ['herbe_sabbat', 'herbe_sabbat'], objetsUtilises: [] });
    expect(r.sauvegarde.meta.objets.herbe_sabbat).toBe(10);
    expect(r.bilan.objetsRendus).toEqual(['herbe_sabbat']);
  });

  it('refuse des objets inconnus, trop nombreux ou utilisés sans avoir été emportés, sans rien changer', () => {
    const s = avecStock();
    expect(enregistrerFinInfinie(s, { carte: 'chaumes', vague: 5, objetsEquipes: ['potion'] })).toEqual({ ok: false, raison: 'objets_invalides' });
    expect(enregistrerFinInfinie(s, { carte: 'chaumes', vague: 5, objetsEquipes: ['sablier', 'sablier', 'sablier', 'sablier'] })).toEqual({ ok: false, raison: 'objets_invalides' });
    expect(enregistrerFinInfinie(s, { carte: 'chaumes', vague: 5, objetsEquipes: [], objetsUtilises: ['sablier'] })).toEqual({ ok: false, raison: 'objets_invalides' });
  });
});

describe('cartes jouables en infini', () => {
  // Données factices : la carte de chaque niveau (les régions 6 à 10 n’ont pas encore de cartes dans le jeu).
  const carteDuNiveau = (n: number): string | undefined => (n <= 100 ? `carte_${String(Math.ceil(n / 4))}` : undefined);

  it('aucune carte tant que le mode est fermé, même si des niveaux sont gagnés', () => {
    let s = sauvegardeVide();
    for (let n = 1; n <= 9; n++) s = enregistrerVictoire(s, n, 'matou', 1);
    expect(cartesInfiniJouables(s, carteDuNiveau)).toEqual([]);
  });

  it('les cartes dont au moins un niveau est gagné, une fois chacune, dans l’ordre des niveaux', () => {
    let s = infiniOuvertSauvegarde();
    expect(cartesInfiniJouables(s, carteDuNiveau)).toEqual(['carte_1', 'carte_2', 'carte_3']);
    s = enregistrerVictoire(s, 11, 'chaton', 2);
    expect(cartesInfiniJouables(s, carteDuNiveau)).toEqual(['carte_1', 'carte_2', 'carte_3']);
    s = enregistrerVictoire(s, 12, 'chaton', 2);
    s = enregistrerVictoire(s, 13, 'chaton', 2);
    expect(cartesInfiniJouables(s, carteDuNiveau)).toEqual(['carte_1', 'carte_2', 'carte_3', 'carte_4']);
  });

  it('ignore les niveaux sans carte connue (région pas encore livrée)', () => {
    const s = infiniOuvertSauvegarde();
    expect(cartesInfiniJouables(s, (n) => (n <= 4 ? 'chaumes' : undefined))).toEqual(['chaumes']);
  });

  it('un niveau débloqué mais pas gagné ne compte pas', () => {
    const s = infiniOuvertSauvegarde();
    expect(s.progression.niveauMax).toBe(11);
    expect(cartesInfiniJouables(s, (n) => `niveau_${String(n)}`)).not.toContain('niveau_11');
  });
});
