// Le suivi visuel des nouveautés du jalon 3 : élites, relèvement et plongée, effets d'état (brûlure, noyade, tour en feu ou
// affamée, nuage toxique, soin d'ennemis, appels), skins équipés et familier du héros.
import { describe, expect, it } from 'vitest';
import { NIVEAU_TOUT_OUVERT } from '../data/deblocage';
import { ENNEMIS } from '../data/ennemis';
import { REGION1 } from '../data/niveaux/region1';
import { ajouterEnnemi, appliquerAction, creerPartie } from '../engine';
import type { Ennemi, EtatPartie, Evenement } from '../engine';
import { configDe, ct } from '../engine/aides.test-utils';
import type { AtlasRendu, SpriteAtlas, SpriteHabille } from './atlas';
import { PoolEffets, TYPE_EFFET } from './effets';
import { Suivi } from './suivi';

// La carte du niveau 1, jouée comme un niveau où toutes les tours sont débloquées (on y améliore des tours).
const NIVEAU = REGION1[0] ? { ...REGION1[0].niveau, numero: NIVEAU_TOUT_OUVERT } : undefined;
if (!NIVEAU) throw new Error('niveau 1 absent');

/** Un atlas dont on choisit les sprites connus ; les demandes de skin sont notées et un skin « skin_refuse » n'habille rien. */
function atlasDe(connus: ReadonlySet<string> | null = null) {
  const habilles: [string, string][] = [];
  const sprite = { ancre: { x: 0, y: 0 }, largeur: 16, hauteur: 16 } as unknown as SpriteAtlas;
  const atlas = {
    sprite: (nom: string) => (connus === null || connus.has(nom) ? { ...sprite, nom } : undefined),
    animation: () => undefined,
    habiller: (nom: string, skin: string) => {
      habilles.push([nom, skin]);
      return skin === 'skin_refuse' ? null : ({ nom, skin } as unknown as SpriteHabille);
    },
  } as unknown as AtlasRendu;
  return { atlas, habilles };
}

function monter(dieu = 'charlie', connus: ReadonlySet<string> | null = null) {
  const effets = new PoolEffets(32);
  const { atlas, habilles } = atlasDe(connus);
  const suivi = new Suivi(atlas, effets);
  const etat: EtatPartie = creerPartie(NIVEAU as NonNullable<typeof NIVEAU>, configDe(dieu));
  return { effets, suivi, etat, habilles };
}

function evenements(etat: EtatPartie, ...liste: Evenement[]): void {
  etat.evenements = liste;
}

function ennemi(etat: EtatPartie, type: keyof typeof ENNEMIS, elite = false): Ennemi {
  return ajouterEnnemi(etat, ENNEMIS[type], type, 0, 2, elite);
}

const nomDe = (sprite: SpriteAtlas | null | undefined): string | undefined => (sprite as unknown as { nom?: string } | null)?.nom;

describe('Suivi : élites', () => {
  it('une élite prend le sprite <id>-elite, un ennemi ordinaire celui de son id', () => {
    const { suivi, etat } = monter();
    const elite = ennemi(etat, 'paysan_affame', true);
    const ordinaire = ennemi(etat, 'paysan_affame');
    suivi.apresPas(etat, 0);
    expect(nomDe(suivi.ennemis.get(elite.id)?.sprite)).toBe('paysan-affame-elite');
    expect(nomDe(suivi.ennemis.get(ordinaire.id)?.sprite)).toBe('paysan-affame');
  });

  it('si le sprite d’élite manque, l’élite retombe sur le sprite de base', () => {
    const { suivi, etat } = monter('charlie', new Set(['paysan-affame']));
    const elite = ennemi(etat, 'paysan_affame', true);
    suivi.apresPas(etat, 0);
    expect(nomDe(suivi.ennemis.get(elite.id)?.sprite)).toBe('paysan-affame');
  });

  it('un boss n’est jamais élite : son sprite est celui du boss', () => {
    const { suivi, etat } = monter();
    const boss = ennemi(etat, 'dame_puits', true);
    suivi.apresPas(etat, 0);
    expect(boss.elite).toBe(false);
    expect(nomDe(suivi.ennemis.get(boss.id)?.sprite)).toBe('dame-puits');
  });

  it('le cadavre d’une élite garde son sprite d’élite', () => {
    const { suivi, etat, effets } = monter();
    const elite = ennemi(etat, 'mendiant', true);
    suivi.apresPas(etat, 0);
    evenements(etat, { type: 'mort', ennemi: elite.id, typeEnnemi: 'mendiant', x: 2, y: 5, prime: 0 });
    suivi.apresPas(etat, 100);
    const fantome = effets.liste.find((e) => e.actif && e.type === TYPE_EFFET.fantome);
    expect(nomDe(fantome?.sprite)).toBe('mendiant-elite');
  });
});

describe('Suivi : relèvement et plongée', () => {
  it('l’Épouvantail à terre est suivi comme intouchable, puis se relève d’une animation `releve`', () => {
    const { suivi, etat } = monter();
    const e = ennemi(etat, 'epouvantail');
    suivi.apresPas(etat, 0);
    e.invulnerable = 45;
    suivi.apresPas(etat, 1000);
    const v = suivi.ennemis.get(e.id);
    expect(v?.intouchable).toBe(true);
    expect(v?.intouchableDebut).toBe(1000);
    e.invulnerable = 0;
    e.x += 0.5;
    suivi.apresPas(etat, 2500);
    expect(v?.intouchable).toBe(false);
    expect(v?.actionAnim).toBe('releve');
    expect(v?.actionFin).toBeGreaterThan(2500);
  });

  it('la Dame du Puits émerge d’un bond : pas d’interpolation sur les 3 tuiles du saut, animation `emerge`', () => {
    const { suivi, etat } = monter();
    const e = ennemi(etat, 'dame_puits');
    suivi.apresPas(etat, 0);
    e.invulnerable = 90;
    suivi.apresPas(etat, 33);
    e.invulnerable = 0;
    e.x += 3;
    suivi.apresPas(etat, 3000);
    const v = suivi.ennemis.get(e.id);
    expect(v?.actionAnim).toBe('emerge');
    expect(v?.xPrec).toBe(v?.x);
  });

  it('un ennemi vu pour la première fois déjà intouchable (partie reprise) l’est aussi pour le rendu', () => {
    const { suivi, etat } = monter();
    const e = ennemi(etat, 'dame_puits');
    e.invulnerable = 30;
    suivi.apresPas(etat, 500, false);
    expect(suivi.ennemis.get(e.id)?.intouchable).toBe(true);
    expect(suivi.ennemis.get(e.id)?.intouchableDebut).toBe(500);
  });

  it('la plongée d’un boss éclabousse en double taille, son émergence aussi ; un ennemi qui se relève ne fait pas de gerbe', () => {
    const { suivi, etat, effets } = monter();
    const dame = ennemi(etat, 'dame_puits');
    const epouvantail = ennemi(etat, 'epouvantail');
    suivi.apresPas(etat, 0);
    evenements(etat, { type: 'plongee', ennemi: dame.id, x: 3, y: 5, delai: 3 });
    suivi.apresPas(etat, 100);
    const gerbe = effets.liste.find((e) => e.actif);
    expect(gerbe).toMatchObject({ anim: 'impact', echelle: 2, x: 48, y: 80 });
    evenements(etat, { type: 'emergence', ennemi: epouvantail.id, x: 2, y: 5 });
    suivi.apresPas(etat, 200);
    expect(effets.actifs).toBe(1);
    evenements(etat, { type: 'emergence', ennemi: dame.id, x: 6, y: 5 });
    suivi.apresPas(etat, 300);
    expect(effets.actifs).toBe(2);
  });
});

describe('Suivi : effets d’état sur les unités, les tours et le sol', () => {
  it('la brûlure d’une unité ne lance pas d’effet ponctuel : elle se lit dans l’état', () => {
    const { suivi, etat, effets } = monter();
    const e = ennemi(etat, 'porteur_torche');
    suivi.apresPas(etat, 0);
    evenements(etat, { type: 'brulure', ennemi: e.id, unite: etat.heros });
    suivi.apresPas(etat, 33);
    expect(effets.actifs).toBe(0);
  });

  it('la noyade : le noyeur attaque, une gerbe sur la victime, et le suivi retient le plus long compte à rebours', () => {
    const { suivi, etat, effets } = monter();
    const noyeur = ennemi(etat, 'noyeur');
    const soldat = etat.unites[0];
    if (!soldat) throw new Error('unité absente');
    soldat.noyade = 90;
    suivi.apresPas(etat, 0);
    evenements(etat, { type: 'noyade', ennemi: noyeur.id, unite: soldat.id, delai: 3 });
    soldat.noyade = 60;
    suivi.apresPas(etat, 1000);
    const v = suivi.unites.get(soldat.id);
    expect(v?.noyadeMax).toBe(90);
    expect(suivi.ennemis.get(noyeur.id)?.actionAnim).toBe('attaque');
    expect(effets.liste.find((e) => e.actif)?.anim).toBe('impact');
    soldat.noyade = 0;
    suivi.apresPas(etat, 1033);
    expect(v?.noyadeMax).toBe(0);
  });

  it('un soin d’ennemi pose un halo sur l’ennemi soigné, une seule fois tant qu’il dure', () => {
    const { suivi, etat, effets } = monter();
    const medecin = ennemi(etat, 'medecin_peste');
    const blesse = ennemi(etat, 'paysan_affame');
    suivi.apresPas(etat, 0);
    evenements(etat, { type: 'soin_ennemi', source: medecin.id, ennemi: blesse.id, pv: 4 });
    suivi.apresPas(etat, 100);
    suivi.apresPas(etat, 133);
    expect(effets.actifs).toBe(1);
    expect(effets.liste.find((e) => e.actif)?.anim).toBe('repos');
  });

  it('la famine trace un anneau de la taille du rayon et fait attaquer le boss', () => {
    const { suivi, etat, effets } = monter();
    const boss = ennemi(etat, 'la_faim');
    suivi.apresPas(etat, 0);
    evenements(etat, { type: 'famine', ennemi: boss.id, x: 4, y: 6, rayon: 5, duree: 5 });
    suivi.apresPas(etat, 50);
    expect(effets.liste.find((e) => e.actif)).toMatchObject({ type: TYPE_EFFET.ordre, x: 64, y: 96, valeur: 80 });
    expect(suivi.ennemis.get(boss.id)?.actionAnim).toBe('attaque');
  });

  it('un appel fait sortir les ennemis appelés de la fumée, et eux seuls', () => {
    const { suivi, etat, effets } = monter();
    const mere = ennemi(etat, 'mere_rats');
    suivi.apresPas(etat, 0);
    const rats = [ennemi(etat, 'rat_peste'), ennemi(etat, 'rat_peste'), ennemi(etat, 'rat_peste')];
    const autre = ennemi(etat, 'rat_peste');
    evenements(
      etat,
      { type: 'appel', ennemi: mere.id, typeEnnemi: 'rat_peste', nombre: 3 },
      ...rats.map((r): Evenement => ({ type: 'apparition', ennemi: r.id, typeEnnemi: 'rat_peste' })),
      { type: 'apparition', ennemi: autre.id, typeEnnemi: 'rat_peste' },
    );
    suivi.apresPas(etat, 100);
    expect(effets.actifs).toBe(3);
    expect(suivi.ennemis.get(mere.id)?.actionAnim).toBe('attaque');
    // Une apparition ordinaire (sans appel) ne fait pas de fumée.
    evenements(etat, { type: 'apparition', ennemi: autre.id, typeEnnemi: 'rat_peste' });
    suivi.apresPas(etat, 200);
    expect(effets.actifs).toBe(3);
  });

  it('un nuage toxique se déploie en effet puis est noté ; une autre zone n’est pas notée ; la fin l’oublie', () => {
    const { suivi, etat, effets } = monter();
    const base = { restant: 90, effets: [], critique: 0, volants: true, revele: false, x: 5, y: 5, rayon: 1.5 };
    etat.zones.push({ ...base, id: 900, degatsAllies: 6 }, { ...base, id: 901, degatsAllies: 0 });
    evenements(
      etat,
      { type: 'zone', zone: 900, x: 5, y: 5, rayon: 1.5, duree: 3 },
      { type: 'zone', zone: 901, x: 5, y: 5, rayon: 1.5, duree: 3 },
    );
    suivi.apresPas(etat, 700);
    expect(effets.actifs).toBe(1);
    expect(effets.liste.find((e) => e.actif)).toMatchObject({ anim: 'impact', x: 80, y: 80 });
    expect(suivi.debutNuage.get(900)).toBe(700);
    expect(suivi.debutNuage.has(901)).toBe(false);
    evenements(etat, { type: 'zone_fin', zone: 900, x: 5, y: 5 });
    suivi.apresPas(etat, 4000);
    expect(suivi.debutNuage.size).toBe(0);
  });
});

describe('Suivi : skins équipés', () => {
  function avecTour(dieu = 'charlie') {
    const m = monter(dieu);
    appliquerAction(m.etat, { type: 'construire', ...ct(0), tour: 'tir' });
    return m;
  }

  it('sans option, rien n’est recoloré et l’atlas n’est pas sollicité pour des skins', () => {
    const { suivi, etat, habilles } = avecTour();
    suivi.apresPas(etat, 0);
    expect([...suivi.tours.values()].every((v) => v.habille === null)).toBe(true);
    expect(suivi.unites.get(etat.heros)?.habille).toBeNull();
    expect(habilles).toEqual([]);
  });

  it('le skin de la famille habille sa tour de base et ses spécialisations, pas les autres familles', () => {
    const { suivi, etat, habilles } = avecTour();
    appliquerAction(etat, { type: 'construire', ...ct(1), tour: 'caserne' });
    suivi.definirCollection({ skins: { tir: 'skin_tir_2' } });
    suivi.apresPas(etat, 0);
    const tir = [...suivi.tours.values()].find((v) => v.famille === 'tir');
    const caserne = [...suivi.tours.values()].find((v) => v.famille === 'caserne');
    expect(tir?.habille).toMatchObject({ nom: 'tour-tir-1', skin: 'skin_tir_2' });
    expect(caserne?.habille).toBeNull();
    expect(habilles).toEqual([['tour-tir-1', 'skin_tir_2']]);
  });

  it('une tour améliorée change de sprite : le skin la suit', () => {
    const { suivi, etat } = avecTour();
    suivi.definirCollection({ skins: { tir: 'skin_tir_2' } });
    suivi.apresPas(etat, 0);
    etat.aretes = 10000;
    appliquerAction(etat, { type: 'ameliorer', ...ct(0) });
    suivi.apresPas(etat, 33);
    expect([...suivi.tours.values()].find((v) => v.famille === 'tir')?.habille).toMatchObject({ nom: 'tour-tir-2', skin: 'skin_tir_2' });
  });

  it('un skin que l’atlas refuse (ne va pas à ce sprite) laisse le sprite de base', () => {
    const { suivi, etat } = avecTour();
    suivi.definirCollection({ skins: { tir: 'skin_refuse' } });
    suivi.apresPas(etat, 0);
    expect([...suivi.tours.values()].find((v) => v.famille === 'tir')?.habille).toBeNull();
  });

  it('le héros de la partie porte son skin ; une clé héritée de Object (constructor) n’est pas un skin', () => {
    const { suivi, etat } = monter('charlie');
    suivi.definirCollection({ skins: { charlie: 'skin_charlie', plume: 'skin_plume' } });
    suivi.apresPas(etat, 0);
    expect(suivi.unites.get(etat.heros)?.habille).toMatchObject({ nom: 'charlie', skin: 'skin_charlie' });
    suivi.definirCollection({ skins: {} });
    suivi.apresPas(etat, 33);
    expect(suivi.unites.get(etat.heros)?.habille).toBeNull();
    suivi.definirCollection({});
    suivi.apresPas(etat, 66);
    expect(suivi.unites.get(etat.heros)?.habille).toBeNull();
  });

  it('un skin de héros ne sert qu’au héros de la partie : pas à ses soldats, pas à un autre héros', () => {
    const { suivi, etat, habilles } = monter('plume');
    suivi.definirCollection({ skins: { charlie: 'skin_charlie' } });
    suivi.apresPas(etat, 0);
    expect(suivi.unites.get(etat.heros)?.habille).toBeNull();
    expect(habilles).toEqual([]);
  });

  it('changer la collection en cours de partie rhabille les tours et le héros déjà suivis', () => {
    const { suivi, etat } = avecTour('charlie');
    suivi.apresPas(etat, 0);
    expect([...suivi.tours.values()][0]?.habille).toBeNull();
    suivi.definirCollection({ skins: { tir: 'skin_tir_1', charlie: 'skin_charlie' } });
    suivi.apresPas(etat, 33);
    expect([...suivi.tours.values()][0]?.habille).toMatchObject({ skin: 'skin_tir_1' });
    expect(suivi.unites.get(etat.heros)?.habille).toMatchObject({ skin: 'skin_charlie' });
  });
});

describe('Suivi : familier du héros', () => {
  it('sans familier équipé, rien n’est ajouté', () => {
    const { suivi, etat } = monter();
    const avant = suivi.dessinables.length;
    suivi.apresPas(etat, 0);
    expect(suivi.familier).toBeNull();
    expect(suivi.dessinables.length).toBe(avant + etat.unites.length);
  });

  it('le familier est un visuel de plus, au sprite `familier-<bête>`, posé derrière le héros', () => {
    const { suivi, etat } = monter();
    suivi.definirCollection({ familier: 'familier_chauve_souris' });
    suivi.apresPas(etat, 0);
    const f = suivi.familier;
    const heros = suivi.unites.get(etat.heros);
    expect(nomDe(f?.sprite)).toBe('familier-chauve-souris');
    expect(f && suivi.dessinables.includes(f)).toBe(true);
    // Le héros regarde vers la droite : le familier est à sa gauche.
    expect(f?.x).toBeLessThan(heros?.x ?? 0);
    expect(f?.masque).toBe(false);
  });

  it('il rattrape le héros d’une part de l’écart à chaque pas, sans le dépasser, et le rejoint d’un bond s’il est loin', () => {
    const { suivi, etat } = monter();
    suivi.definirCollection({ familier: 'familier_rat' });
    suivi.apresPas(etat, 0);
    const heros = etat.unites.find((u) => u.id === etat.heros);
    if (!heros) throw new Error('héros absent');
    heros.x -= 2;
    suivi.apresPas(etat, 33);
    const f = suivi.familier;
    // Le héros marche vers la gauche : il regarde à gauche, le familier le suit à sa droite.
    const cible = (suivi.unites.get(etat.heros)?.x ?? 0) + 0.85;
    const avant = f?.x ?? 0;
    expect(avant).toBeGreaterThan(cible);
    suivi.apresPas(etat, 66);
    expect(f?.x).toBeLessThan(avant);
    expect(f?.x).toBeGreaterThan(cible);
    // Le héros réapparaît à l'autre bout de la carte.
    heros.x += 20;
    suivi.apresPas(etat, 99);
    // Le héros a reculé : il regarde à gauche, le familier se tient donc à sa droite.
    expect(suivi.unites.get(etat.heros)?.miroir).toBe(true);
    expect(f?.x).toBeCloseTo(heros.x + 0.85, 5);
    expect(f?.xPrec).toBe(f?.x);
  });

  it('il disparaît avec le héros tombé, revient avec lui, et s’enlève quand on le déséquipe', () => {
    const { suivi, etat } = monter();
    suivi.definirCollection({ familier: 'familier_rat' });
    suivi.apresPas(etat, 0);
    const heros = etat.unites.find((u) => u.id === etat.heros);
    if (!heros) throw new Error('héros absent');
    heros.mort = true;
    suivi.apresPas(etat, 33);
    expect(suivi.familier?.masque).toBe(true);
    heros.mort = false;
    suivi.apresPas(etat, 66);
    expect(suivi.familier?.masque).toBe(false);
    suivi.definirCollection({ familier: null });
    suivi.apresPas(etat, 99);
    expect(suivi.familier?.masque).toBe(true);
  });

  it('un familier dont le sprite manque n’est pas dessiné (pas de carré magenta)', () => {
    const { suivi, etat } = monter('charlie', new Set(['charlie']));
    suivi.definirCollection({ familier: 'familier_rat' });
    suivi.apresPas(etat, 0);
    expect(suivi.familier).toBeNull();
  });
});
