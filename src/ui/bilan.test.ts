import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BRAISES_DEFI } from '../data/meta';
import { t } from '../i18n';
import type { BilanPartie } from '../save';
import { DEFS_TEST } from '../save/aides.test-utils';
import { sauvegardeVide, type Sauvegarde } from '../save/format';
import { enregistrerVictoireModerne } from '../save/moderne';
import { enregistrerVictoire } from '../save/progression';
import { enregistrerFinDePartie, type FinDePartieMeta } from '../save/transactions';
import { lignesBilan } from './ecrans';

const BILAN: BilanPartie = {
  aretes: 0,
  braises: 0,
  xp: 0,
  nouvellesEtoiles: 0,
  heros: 'charlie',
  niveauHeros: { avant: 1, apres: 1 },
  objetsConsommes: [],
  objetsRendus: [],
};

describe('bilan de fin : défi, disciple offert, région ouverte', () => {
  it('rien à signaler : aucune ligne de plus', () => {
    expect(lignesBilan(BILAN)).toEqual([]);
  });

  it('un défi réussi pour la première fois dit lequel et la prime de braises', () => {
    const heroique = lignesBilan({ ...BILAN, braises: BRAISES_DEFI, defiReussi: 'heroique' });
    expect(heroique).toContain(t('fin.bilan_defi', { defi: 'Héroïque', n: BRAISES_DEFI }));
    expect(lignesBilan({ ...BILAN, braises: 4, defiReussi: 'fer' })).toContain(t('fin.bilan_defi', { defi: 'Fer', n: 4 }));
    expect(t('fin.bilan_defi', { defi: 'Fer', n: 4 })).toBe('Défi Fer réussi : +4 braises');
  });

  it('les braises d’un défi ne sont annoncées qu’une fois', () => {
    const lignes = lignesBilan({ ...BILAN, braises: BRAISES_DEFI, defiReussi: 'heroique' });
    expect(lignes.filter((l) => l.includes('braises'))).toHaveLength(1);
    expect(lignesBilan({ ...BILAN, braises: BRAISES_DEFI + 5, defiReussi: 'fer' })).toContain(t('fin.bilan_braises', { n: 5 }));
  });

  it('un disciple offert est annoncé par son nom', () => {
    expect(lignesBilan({ ...BILAN, discipleOffert: 'suie' })).toEqual([t('fin.bilan_disciple', { nom: 'Suie' })]);
  });

  it('une région débloquée est annoncée par son nom', () => {
    expect(lignesBilan({ ...BILAN, regionDebloquee: 2 })).toEqual([t('fin.bilan_region', { nom: 'Les Champs Brûlés' })]);
    expect(lignesBilan({ ...BILAN, regionDebloquee: 4 })).toEqual([t('fin.bilan_region', { nom: 'Les Marais de l’Ordalie' })]);
  });

  it('une région que l’écran ne connaît pas est annoncée par son numéro', () => {
    expect(lignesBilan({ ...BILAN, regionDebloquee: 16 })).toEqual([t('fin.bilan_region_numero', { n: 16 })]);
    expect(lignesBilan({ ...BILAN, regionDebloquee: 11 })).toEqual([t('fin.bilan_region', { nom: 'Les Grèves Grises' })]);
    expect(lignesBilan({ ...BILAN, regionDebloquee: 7 })).toEqual([t('fin.bilan_region', { nom: 'La Croisade' })]);
  });

  it('tout ensemble, après le butin habituel et dans l’ordre : défi, disciple, région', () => {
    const lignes = lignesBilan({ ...BILAN, aretes: 120, braises: 9, defiReussi: 'heroique', discipleOffert: 'mastoc', regionDebloquee: 3 });
    expect(lignes.map((l) => l.split(' ')[0])).toEqual(['+120', '+5', 'Défi', 'Mastoc', 'Région']);
  });

  it('le mode infini débloqué et la fin de campagne sont annoncés', () => {
    expect(lignesBilan({ ...BILAN, infiniDebloque: true })).toEqual([t('fin.bilan_infini_debloque')]);
    expect(lignesBilan({ ...BILAN, campagneTerminee: true })).toEqual([t('fin.bilan_campagne')]);
    expect(t('fin.bilan_infini_debloque')).toBe('Mode infini débloqué : il t’attend sur l’accueil.');
  });

  it('DLC : les badges et les titres gagnés sont annoncés, après les gains habituels', () => {
    const lignes = lignesBilan({ ...BILAN, aretes: 681, badges: 30, titresNouveaux: ['fac_occupee', 'greve_generale'] });
    expect(lignes).toEqual([
      t('fin.bilan_aretes', { n: 681 }),
      t('fin.bilan_badges', { n: 30 }),
      t('fin.bilan_titre', { nom: 'Fac occupée' }),
      t('fin.bilan_titre', { nom: 'Grève générale' }),
    ]);
    expect(t('fin.bilan_badges', { n: 30 })).toBe('+30 badges');
  });

  it('DLC : zéro badge et aucun titre ne disent rien ; un titre inconnu est ignoré', () => {
    expect(lignesBilan({ ...BILAN, badges: 0 })).toEqual([]);
    expect(lignesBilan({ ...BILAN, titresNouveaux: ['titre_inconnu'] })).toEqual([]);
  });

  it('DLC : à 740×360, le butin le plus long (six lignes) reste sur une colonne et les étoiles gardent leurs proportions', () => {
    const feuille = readFileSync('src/ui/style-meta.css', 'utf8');
    const bas = /@media \(max-height: 460px\) \{\s*\.ecran\.fin \.bilan \{([^}]*)\}/.exec(feuille);
    expect(bas).not.toBeNull();
    expect(bas?.[1]).not.toContain('grid-template-columns');
    expect(/\.ecran\.fin \.etoile \{\s*width: 30px;\s*height: 30px;\s*\}/.test(feuille)).toBe(true);
    const lignes = lignesBilan({ ...BILAN, aretes: 681, braises: 21, xp: 2120, niveauHeros: { avant: 1, apres: 7 }, badges: 30, titresNouveaux: ['fac_occupee'] });
    expect(lignes).toHaveLength(6);
  });
});

describe('bilan de fin : la phrase de fin du DLC (« Préfecture tombée »)', () => {
  const PHRASE = t('fin.bilan_campagne_moderne');
  const TITRE = t('fin.bilan_titre', { nom: 'Préfecture tombée' });

  function bilanDe(s: Sauvegarde, fin: FinDePartieMeta): BilanPartie {
    const r = enregistrerFinDePartie(s, fin, DEFS_TEST);
    if (!r.ok) throw new Error(`refusée : ${r.raison}`);
    return r.bilan;
  }
  function joueurModerne(jusqua: number): Sauvegarde {
    let s = sauvegardeVide();
    for (let n = 1; n <= jusqua; n++) s = enregistrerVictoireModerne(s, n, 'matou', 3);
    return s;
  }
  const victoire = { statut: 'victoire', difficulte: 'matou', etoiles: 2, heros: 'charlie' } as const;

  it('lignesBilan : la phrase suit le titre « Préfecture tombée », et seulement lui', () => {
    expect(lignesBilan({ ...BILAN, titresNouveaux: ['prefecture_tombee'] })).toEqual([TITRE, PHRASE]);
    expect(lignesBilan({ ...BILAN, titresNouveaux: ['cortege_de_tete'] })).not.toContain(PHRASE);
    expect(lignesBilan({ ...BILAN, campagneTerminee: true })).not.toContain(PHRASE);
  });

  it('niveau 30 du DLC gagné pour la première fois : titre et phrase ; rejoué ensuite : ni l’un ni l’autre', () => {
    const avant = joueurModerne(29);
    const r = enregistrerFinDePartie(avant, { ...victoire, niveau: 30, campagne: 'moderne' }, DEFS_TEST);
    if (!r.ok) throw new Error(`refusée : ${r.raison}`);
    expect(lignesBilan(r.bilan)).toEqual(expect.arrayContaining([TITRE, PHRASE]));
    const encore = lignesBilan(bilanDe(r.sauvegarde, { ...victoire, niveau: 30, campagne: 'moderne' }));
    expect(encore).not.toContain(PHRASE);
    expect(encore).not.toContain(TITRE);
  });

  it('un autre boss du DLC et l’histoire ne donnent jamais la phrase', () => {
    expect(lignesBilan(bilanDe(joueurModerne(19), { ...victoire, niveau: 20, campagne: 'moderne' }))).not.toContain(PHRASE);
    let histoire = sauvegardeVide();
    for (let n = 1; n <= 29; n++) histoire = enregistrerVictoire(histoire, n, 'matou', 3);
    const lignes = lignesBilan(bilanDe(histoire, { ...victoire, niveau: 30 }));
    expect(lignes).not.toContain(PHRASE);
    expect(lignes).not.toContain(TITRE);
  });
});
