// Skins du DLC portés dans l'histoire : la tour ou le héros habillé prend son sprite du DLC quand l'atlas du DLC est chargé, et garde son
// sprite de base sinon.
import { describe, expect, it } from 'vitest';
import { NIVEAU_TOUT_OUVERT } from '../data/deblocage';
import { REGION1 } from '../data/niveaux/region1';
import { appliquerAction, creerPartie } from '../engine';
import type { EtatPartie } from '../engine';
import { configDe, ct } from '../engine/aides.test-utils';
import type { AtlasRendu, SpriteAtlas, SpriteHabille } from './atlas';
import { PoolEffets } from './effets';
import { Suivi } from './suivi';

const NIVEAU = REGION1[0] ? { ...REGION1[0].niveau, numero: NIVEAU_TOUT_OUVERT } : undefined;
if (!NIVEAU) throw new Error('niveau 1 absent');

/** Un atlas qui connaît les sprites de l'histoire, et ceux du DLC seulement si `moderne`. */
function monter(moderne: boolean, dieu = 'charlie') {
  const sprite = { ancre: { x: 0, y: 0 }, largeur: 16, hauteur: 16 } as unknown as SpriteAtlas;
  const atlas = {
    sprite: (nom: string) => (moderne || !nom.startsWith('moderne-') ? { ...sprite, nom } : undefined),
    animation: () => undefined,
    habiller: (nom: string, skin: string) => ({ nom, skin }) as unknown as SpriteHabille,
  } as unknown as AtlasRendu;
  const suivi = new Suivi(atlas, new PoolEffets(32));
  const etat: EtatPartie = creerPartie(NIVEAU as NonNullable<typeof NIVEAU>, configDe(dieu));
  appliquerAction(etat, { type: 'construire', ...ct(0), tour: 'tir' });
  appliquerAction(etat, { type: 'construire', ...ct(1), tour: 'caserne' });
  return { suivi, etat };
}

const nomDe = (sprite: SpriteAtlas | null | undefined): string | undefined => (sprite as unknown as { nom?: string } | null)?.nom;

describe('Suivi : skins du DLC dans l’histoire', () => {
  it('la tour qui porte son skin du DLC prend le sprite du DLC (et son tireur) ; les autres non', () => {
    const { suivi, etat } = monter(true);
    suivi.definirCollection({ skins: { tir: 'skin_tir_2' }, skinsModernes: { tir: 'skin_moderne_tir' } });
    suivi.apresPas(etat, 0);
    const tir = [...suivi.tours.values()].find((v) => v.famille === 'tir');
    const caserne = [...suivi.tours.values()].find((v) => v.famille === 'caserne');
    expect(tir?.nomSprite).toBe('moderne-tir-1');
    expect(nomDe(tir?.tireur)).toBe('moderne-lanceur-chat');
    expect(caserne?.nomSprite).toBe('tour-caserne-1');
  });

  it('sans l’atlas du DLC, ou avec un skin qui ne va pas à sa cible, la tour garde son sprite de base', () => {
    const sans = monter(false);
    sans.suivi.definirCollection({ skinsModernes: { tir: 'skin_moderne_tir' } });
    sans.suivi.apresPas(sans.etat, 0);
    expect([...sans.suivi.tours.values()].find((v) => v.famille === 'tir')?.nomSprite).toBe('tour-tir-1');
    const faux = monter(true);
    faux.suivi.definirCollection({ skinsModernes: { caserne: 'skin_moderne_tir' } });
    faux.suivi.apresPas(faux.etat, 0);
    expect([...faux.suivi.tours.values()].find((v) => v.famille === 'caserne')?.nomSprite).toBe('tour-caserne-1');
  });

  it('le héros de la partie prend son sprite d’étudiant ; le retirer en cours de partie le rhabille', () => {
    const { suivi, etat } = monter(true, 'charlie');
    suivi.definirCollection({ skinsModernes: { charlie: 'skin_moderne_charlie' } });
    suivi.apresPas(etat, 0);
    expect(nomDe(suivi.unites.get(etat.heros)?.sprite)).toBe('moderne-heros-charlie');
    suivi.definirCollection({});
    suivi.apresPas(etat, 33);
    expect(nomDe(suivi.unites.get(etat.heros)?.sprite)).toBe('charlie');
  });
});
