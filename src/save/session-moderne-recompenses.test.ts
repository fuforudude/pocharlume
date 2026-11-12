// Session et récompenses du DLC : la caisse « Temps modernes » et les skins du DLC écrits aussitôt, hasard rejouable (deux jets par caisse).
import { describe, expect, it } from 'vitest';
import { PRIX_CAISSE_MODERNE, skinsCaisseModerne } from '../data/recompenses-moderne';
import { sourceListe } from '../meta/aides.test-utils';
import type { SourceAleatoire } from '../meta/aleatoire';
import { DEFS_TEST } from './aides.test-utils';
import { Depot } from './depot';
import { sauvegardeVide, type Sauvegarde } from './format';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { creerVerrouMemoire } from './verrou';

async function ouvrir(initiale: Sauvegarde, aleatoire: SourceAleatoire | null): Promise<{ session: Session; relire: () => Promise<Sauvegarde> }> {
  const stockage = new StockageMemoire();
  expect(await new Depot(stockage).enregistrer(initiale)).toBe(true);
  const verrou = creerVerrouMemoire();
  const session = await Session.ouvrir(new Depot(stockage), null, { verrou, defs: DEFS_TEST, aleatoire });
  return { session, relire: async () => (await Session.ouvrir(new Depot(stockage), null, { verrou, defs: DEFS_TEST, aleatoire: null })).sauvegarde };
}

function avecBadges(badges: number): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, moderne: { ...s.moderne, badges } };
}

describe('session : caisse Temps modernes', () => {
  it('débite les badges, écrit le skin et rend le tirage ; deux jets par caisse (tirés d’avance, même pour un refus)', async () => {
    const { session, relire } = await ouvrir(avecBadges(2 * PRIX_CAISSE_MODERNE), sourceListe([0, 0, 0.7, 0, 0, 0]));
    const r = await session.ouvrirCaisseModerne();
    if (!r.ok) throw new Error(r.raison);
    expect(r.detail).toMatchObject({ id: skinsCaisseModerne('commun')[0], nouveau: true, badges: PRIX_CAISSE_MODERNE });
    expect((await session.ouvrirCaisseModerne()).ok).toBe(true);
    const relue = await relire();
    expect(relue.moderne.badges).toBe(0);
    expect(relue.moderne.collection.skinsTours).toEqual([skinsCaisseModerne('commun')[0]]);
    expect(relue.moderne.collection.skinsHeros).toEqual([skinsCaisseModerne('rare')[0]]);
    expect(await session.ouvrirCaisseModerne()).toEqual({ ok: false, raison: 'badges_insuffisants' });
  });

  it('sans source aléatoire, la caisse est refusée', async () => {
    const { session } = await ouvrir(avecBadges(100), null);
    expect(await session.ouvrirCaisseModerne()).toEqual({ ok: false, raison: 'aleatoire_indisponible' });
  });

  it('porte et retire un skin du DLC', async () => {
    const s = sauvegardeVide();
    const { session, relire } = await ouvrir({ ...s, moderne: { ...s.moderne, collection: { ...s.moderne.collection, skinsTours: ['skin_moderne_tir'] } } }, null);
    expect((await session.equiperSkinModerne('tir', 'skin_moderne_tir')).ok).toBe(true);
    expect((await relire()).moderne.collection.equipes).toEqual({ tir: 'skin_moderne_tir' });
    expect(await session.equiperSkinModerne('caserne', 'skin_moderne_tir')).toEqual({ ok: false, raison: 'emplacement_invalide' });
    expect((await session.equiperSkinModerne('tir', null)).ok).toBe(true);
    expect((await relire()).moderne.collection.equipes).toEqual({});
  });
});
