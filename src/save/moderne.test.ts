// La campagne « Temps modernes » dans la sauvegarde v9 : sa progression à part (étoiles, défis, records), les badges, la collection
// du DLC, les titres et la préférence du sticker replié. Validation stricte, fusion de deux sauvegardes, projection pour la carte.
import { describe, expect, it } from 'vitest';
import { sauvegardeRemplie, SUPPRIME, variante } from './aides.test-utils';
import { moderneParDefaut, sauvegardeVide, type CampagneModerne, type Sauvegarde } from './format';
import {
  enregistrerVictoireModerne,
  fusionnerModerne,
  replierStickerDlc,
  sauvegardeDeCampagne,
  stickerDlcReplie,
} from './moderne';
import { enregistrerVictoire, fusionnerProgressions } from './progression';
import { Depot } from './depot';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { validerSauvegarde } from './validation';
import { creerVerrouMemoire } from './verrou';

/** Une campagne du DLC bien remplie : la Fac finie (région 2 ouverte), des défis, des badges, des skins, un titre, le sticker replié. */
function moderneRemplie(): CampagneModerne {
  const etoiles: CampagneModerne['progression']['etoiles'] = {};
  for (let n = 1; n <= 10; n++) etoiles[String(n)] = n % 2 === 0 ? { matou: 3 } : { chaton: 2 };
  return {
    progression: { niveauMax: 11, etoiles },
    defis: { '2': { heroique: true }, '4': { fer: true } },
    records: { amphi: 14 },
    badges: 120,
    collection: { skinsTours: ['skin_moderne_tir', 'skin_moderne_caserne'].sort(), skinsHeros: ['skin_moderne_plume'], garantie: 3 },
    titres: ['fac_occupee'],
    stickerReplie: true,
  };
}

function avecModerne(moderne: CampagneModerne, base: Sauvegarde = sauvegardeRemplie()): Sauvegarde {
  return { ...base, moderne };
}

describe('campagne Temps modernes : format v9', () => {
  it('un nouveau joueur a la campagne du DLC vide : niveau 1 ouvert, rien de gagné, 0 badge, sticker déplié', () => {
    expect(sauvegardeVide().moderne).toEqual({
      progression: { niveauMax: 1, etoiles: {} },
      defis: {},
      records: {},
      badges: 0,
      collection: { skinsTours: [], skinsHeros: [], garantie: 0 },
      titres: [],
      stickerReplie: false,
    });
    expect(moderneParDefaut()).toEqual(sauvegardeVide().moderne);
    expect(moderneParDefaut()).not.toBe(moderneParDefaut());
  });

  it('une campagne du DLC remplie est valide et revient à l’identique', () => {
    const s = avecModerne(moderneRemplie());
    const r = validerSauvegarde(JSON.parse(JSON.stringify(s)));
    expect(r.ok ? r.valeur : r.raison).toEqual(s);
  });

  it('la progression du DLC est indépendante de celle de l’histoire', () => {
    const s = avecModerne(moderneRemplie(), sauvegardeVide());
    expect(validerSauvegarde(s).ok).toBe(true);
    expect(s.progression.niveauMax).toBe(1);
  });

  it.each([
    ['moderne absente', { moderne: SUPPRIME }],
    ['clé en trop', { 'moderne.extra': 1 }],
    ['niveau max au-delà de 30', { 'moderne.progression.niveauMax': 31 }],
    ['niveau max nul', { 'moderne.progression.niveauMax': 0 }],
    ['niveau réussi au-delà de 30', { 'moderne.progression': { niveauMax: 30, etoiles: { '31': { matou: 1 } } } }],
    ['niveau réussi sans le suivant débloqué', { 'moderne.progression.niveauMax': 5 }],
    ['défi sans 3 étoiles', { 'moderne.defis': { '1': { heroique: true } } }],
    ['défi inconnu', { 'moderne.defis': { '2': { titan: true } } }],
    ['record hors bornes', { 'moderne.records': { amphi: 0 } }],
    ['record d’une carte mal nommée', { 'moderne.records': { 'Amphi!': 3 } }],
    ['badges négatifs', { 'moderne.badges': -1 }],
    ['badges non entiers', { 'moderne.badges': 1.5 }],
    ['badges au-delà du plafond', { 'moderne.badges': 100_000_000 }],
    ['garantie négative', { 'moderne.collection.garantie': -1 }],
    ['garantie au-delà de 9', { 'moderne.collection.garantie': 10 }],
    ['trop de skins', { 'moderne.collection.skinsTours': Array.from({ length: 129 }, (_, i) => `skin_${String(1000 + i)}`) }],
    ['skin au nom hérité d’Object', { 'moderne.collection.skinsHeros': ['constructor'] }],
    ['titre au nom hérité d’Object', { 'moderne.titres': ['constructor'] }],
    ['skin en double', { 'moderne.collection.skinsTours': ['skin_a', 'skin_a'] }],
    ['skins dans le désordre', { 'moderne.collection.skinsTours': ['skin_b', 'skin_a'] }],
    ['skin mal nommé', { 'moderne.collection.skinsHeros': ['__proto__'] }],
    ['titre qui n’est pas une chaîne', { 'moderne.titres': [3] }],
    ['titre en double', { 'moderne.titres': ['fac_occupee', 'fac_occupee'] }],
    ['sticker qui n’est pas un booléen', { 'moderne.stickerReplie': 'oui' }],
  ])('refuse une campagne du DLC abîmée : %s', (_, changements) => {
    expect(validerSauvegarde(variante(changements, avecModerne(moderneRemplie()))).ok).toBe(false);
  });

  it('refuse les clés empoisonnées dans les tables du DLC', () => {
    // La clé empoisonnée porte un objet : une pollution laisserait `pollue` sur tous les objets.
    const json = JSON.stringify(avecModerne(moderneRemplie())).replace('"amphi":14', '"__proto__":{"pollue":1}');
    expect(validerSauvegarde(JSON.parse(json)).ok).toBe(false);
    expect((({}) as Record<string, unknown>).pollue).toBeUndefined();
    expect(Object.keys(Object.prototype)).toEqual([]);
  });
});

describe('progression du DLC', () => {
  it('une victoire garde les meilleures étoiles, débloque le niveau suivant, sans toucher à l’histoire', () => {
    const avant = sauvegardeRemplie();
    let s = enregistrerVictoireModerne(avant, 1, 'matou', 2);
    s = enregistrerVictoireModerne(s, 1, 'matou', 1);
    expect(s.moderne.progression).toEqual({ niveauMax: 2, etoiles: { '1': { matou: 2 } } });
    expect(s.progression).toBe(avant.progression);
    expect(s.meta).toBe(avant.meta);
    expect(validerSauvegarde(s).ok).toBe(true);
  });

  it('une victoire impossible (niveau verrouillé, hors du DLC, étoiles hors bornes) ne change rien', () => {
    const s = sauvegardeVide();
    for (const [n, e] of [[2, 1], [0, 1], [31, 1], [1, 0], [1, 4]] as const) expect(enregistrerVictoireModerne(s, n, 'matou', e)).toBe(s);
  });

  it('le dernier niveau gagné ne débloque rien au-delà de 30', () => {
    let s = sauvegardeVide();
    for (let n = 1; n <= 30; n++) s = enregistrerVictoireModerne(s, n, 'chaton', 1);
    expect(s.moderne.progression.niveauMax).toBe(30);
    expect(validerSauvegarde(s).ok).toBe(true);
  });

  it('la projection pour la carte du DLC lit la progression, les défis et la région ouverte du DLC', () => {
    const s = avecModerne(moderneRemplie());
    const vue = sauvegardeDeCampagne(s, 'moderne');
    expect(vue.progression).toBe(s.moderne.progression);
    expect(vue.meta.defis).toBe(s.moderne.defis);
    expect(vue.meta.regionMax).toBe(2);
    // Les monnaies et le reste de la méta restent ceux du joueur.
    expect(vue.meta.monnaies).toBe(s.meta.monnaies);
    expect(sauvegardeDeCampagne(s, 'histoire')).toBe(s);
  });
});

describe('sticker « DLC disponible ! »', () => {
  it('se replie et se déplie ; ne change rien s’il est déjà dans cet état', () => {
    const s = sauvegardeVide();
    expect(stickerDlcReplie(s)).toBe(false);
    const repliee = replierStickerDlc(s, true);
    expect(stickerDlcReplie(repliee)).toBe(true);
    expect(replierStickerDlc(repliee, true)).toBe(repliee);
    expect(stickerDlcReplie(replierStickerDlc(repliee, false))).toBe(false);
    expect(validerSauvegarde(repliee).ok).toBe(true);
  });
});

describe('sticker dans la session', () => {
  it('le choix « replié » est écrit dans la sauvegarde et relu par une session rouverte', async () => {
    const stockage = new StockageMemoire();
    const verrou = creerVerrouMemoire();
    const ouvrir = (): Promise<Session> => Session.ouvrir(new Depot(stockage), null, { verrou });
    const session = await ouvrir();
    expect(session.sauvegarde.moderne.stickerReplie).toBe(false);
    expect(await session.replierStickerDlc(true)).toBe(true);
    const rouverte = await ouvrir();
    expect(rouverte.sauvegarde.moderne.stickerReplie).toBe(true);
  });
});

describe('fusion de deux sauvegardes : la campagne du DLC', () => {
  it('garde le meilleur des deux : niveau débloqué, étoiles, défis, records, titres ; badges, collection et sticker de la première', () => {
    const a = avecModerne({ ...moderneParDefaut(), badges: 7, titres: ['manif_tenue'], progression: { niveauMax: 3, etoiles: { '1': { matou: 1 }, '2': { chaton: 3 } } }, records: { amphi: 20, rue: 2 } });
    const b = avecModerne(moderneRemplie());
    const m = fusionnerProgressions(a, b);
    expect(m.moderne.progression.niveauMax).toBe(11);
    expect(m.moderne.progression.etoiles['1']).toEqual({ matou: 1, chaton: 2 });
    expect(m.moderne.progression.etoiles['2']).toEqual({ chaton: 3, matou: 3 });
    expect(m.moderne.defis).toEqual(b.moderne.defis);
    expect(m.moderne.records).toEqual({ amphi: 20, rue: 2 });
    expect(m.moderne.titres).toEqual(['fac_occupee', 'manif_tenue']);
    expect(m.moderne.badges).toBe(7);
    expect(m.moderne.collection).toEqual(a.moderne.collection);
    expect(m.moderne.stickerReplie).toBe(false);
    expect(validerSauvegarde(m).ok).toBe(true);
  });

  it('est symétrique pour la progression du DLC', () => {
    const a = enregistrerVictoireModerne(sauvegardeVide(), 1, 'chaton', 2);
    const b = enregistrerVictoireModerne(enregistrerVictoireModerne(sauvegardeVide(), 1, 'matou', 3), 2, 'matou', 1);
    expect(fusionnerModerne(a.moderne, b.moderne)?.progression).toEqual(fusionnerModerne(b.moderne, a.moderne)?.progression);
  });

  it('ne change rien (même objet) quand la seconde n’apporte rien au DLC ni à l’histoire', () => {
    const a = avecModerne(moderneRemplie());
    expect(fusionnerModerne(a.moderne, moderneParDefaut())).toBeNull();
    expect(fusionnerProgressions(a, { ...a, moderne: moderneParDefaut() })).toBe(a);
  });

  it('une victoire du DLC dans l’autre onglet ne se perd pas, une victoire de l’histoire non plus', () => {
    const a = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3);
    const b = enregistrerVictoireModerne(sauvegardeVide(), 1, 'matou', 3);
    const m = fusionnerProgressions(a, b);
    expect(m.progression).toEqual(a.progression);
    expect(m.moderne.progression).toEqual(b.moderne.progression);
  });
});
