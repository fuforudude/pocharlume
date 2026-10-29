// Validation de la sauvegarde v4 : région ouverte, défis réussis, collection (objets, rangs, éclats, garanties, équipement).
import { describe, expect, it } from 'vitest';
import { sauvegardeRemplie, SUPPRIME, variante } from './aides.test-utils';
import { sauvegardeVide } from './format';
import { validerSauvegarde } from './validation';

function refusee(x: unknown): string {
  const r = validerSauvegarde(x);
  if (r.ok) throw new Error(`la sauvegarde aurait dû être refusée : ${JSON.stringify(x).slice(0, 300)}`);
  return r.raison;
}

function acceptee(x: unknown): void {
  const r = validerSauvegarde(x);
  if (!r.ok) throw new Error(`la sauvegarde aurait dû être acceptée : ${r.raison}`);
}

describe('sauvegarde v4 : région ouverte', () => {
  it('une sauvegarde neuve et la sauvegarde remplie sont valides', () => {
    acceptee(JSON.parse(JSON.stringify(sauvegardeVide())));
    acceptee(JSON.parse(JSON.stringify(sauvegardeRemplie())));
  });

  it('la région ouverte suit le boss battu : région 2 quand le niveau 10 est gagné, pas avant', () => {
    // La sauvegarde remplie a niveauMax 13 : la région 2 est ouverte.
    acceptee(variante({ 'meta.regionMax': 2 }));
    expect(refusee(variante({ 'meta.regionMax': 1 }))).toContain('regionMax');
    expect(refusee(variante({ 'meta.regionMax': 3 }))).toContain('regionMax');
    // Niveau 10 pas encore gagné : niveauMax 10, région 1 seulement.
    acceptee(variante({ 'progression.niveauMax': 10, 'progression.etoiles': {}, 'meta.regionMax': 1, 'meta.defis': {}, 'meta.arbre': { caserne: 0, tir: 0, magie: 0, artillerie: 0, sorts: 0, heros: 0 }, partie: null }));
    refusee(variante({ 'progression.niveauMax': 10, 'progression.etoiles': {}, 'meta.regionMax': 2, 'meta.defis': {}, 'meta.arbre': { caserne: 0, tir: 0, magie: 0, artillerie: 0, sorts: 0, heros: 0 }, partie: null }));
  });

  it('refuse une région hors bornes ou d’un autre type, ou absente', () => {
    for (const v of [0, 11, 1.5, '2', null, Number.NaN]) refusee(variante({ 'meta.regionMax': v }));
    refusee(variante({ 'meta.regionMax': SUPPRIME }));
  });
});

describe('sauvegarde v4 : défis réussis', () => {
  it('accepte un défi sur un niveau à 3 étoiles', () => {
    acceptee(variante({ 'meta.defis': { '2': { fer: true } } }));
    acceptee(variante({ 'meta.defis': {} }));
  });

  it('refuse un défi sur un niveau qui n’a pas 3 étoiles (ou jamais réussi)', () => {
    // Niveau 1 : 2 étoiles en Matou seulement dans la sauvegarde remplie ; niveau 20 : jamais joué.
    expect(refusee(variante({ 'meta.defis': { '1': { heroique: true } } }))).toContain('3 étoiles');
    refusee(variante({ 'meta.defis': { '20': { heroique: true } } }));
  });

  it('les 3 étoiles peuvent venir d’une autre difficulté que Matou', () => {
    // Niveau 6 : 3 étoiles en Chaton (n pair), 1 en Matou.
    acceptee(variante({ 'meta.defis': { '6': { heroique: true } } }));
  });

  it('refuse un défi inconnu, une valeur autre que vrai, un niveau mal écrit, une entrée vide ou une clé héritée', () => {
    refusee(variante({ 'meta.defis': { '2': { legendaire: true } } }));
    refusee(variante({ 'meta.defis': { '2': { heroique: false } } }));
    refusee(variante({ 'meta.defis': { '2': { heroique: 1 } } }));
    refusee(variante({ 'meta.defis': { '2': {} } }));
    refusee(variante({ 'meta.defis': { '02': { heroique: true } } }));
    refusee(variante({ 'meta.defis': { '101': { heroique: true } } }));
    refusee(variante({ 'meta.defis': { '2': { constructor: true } } }));
    refusee(variante({ 'meta.defis': { '2': 'heroique' } }));
    refusee(variante({ 'meta.defis': [] }));
    refusee(variante({ 'meta.defis': SUPPRIME }));
    refusee(JSON.parse('{"version":4,"progression":{"niveauMax":1,"etoiles":{}},"reglages":{"son":1,"musique":1,"vitesse":1},"partie":null,"meta":{"defis":{"__proto__":{"fer":true}}}}'));
  });
});

describe('sauvegarde v4 : collection', () => {
  it('refuse une collection absente, incomplète ou avec une clé en trop', () => {
    refusee(variante({ 'meta.collection': SUPPRIME }));
    for (const cle of ['possedes', 'eclats', 'garanties', 'equipes']) refusee(variante({ [`meta.collection.${cle}`]: SUPPRIME }));
    refusee(variante({ 'meta.collection.extra': 1 }));
    refusee(variante({ 'meta.collection': null }));
  });

  it('objets possédés : ids du catalogue seulement, rangs de 1 à 5', () => {
    acceptee(variante({ 'meta.collection.possedes.skin_lanterne': 5 }));
    for (const rang of [0, 6, -1, 1.5, '2', null]) refusee(variante({ 'meta.collection.possedes.skin_tir_1': rang }));
    for (const id of ['skin_inconnu', 'constructor', 'toString', '__proto__', 'familier_dragon', '']) {
      refusee(variante({ 'meta.collection.possedes': { [id]: 1 } }));
    }
    refusee(variante({ 'meta.collection.possedes': [] }));
  });

  it('éclats : entier de 0 au plafond des monnaies', () => {
    acceptee(variante({ 'meta.collection.eclats': 99_999_999 }));
    for (const v of [-1, 100_000_000, 1.5, '5', null]) refusee(variante({ 'meta.collection.eclats': v }));
  });

  it('garanties : une par type de caisse, de 0 à 9', () => {
    acceptee(variante({ 'meta.collection.garanties': { skins: 9, familiers: 0 } }));
    for (const v of [-1, 10, 1.5, '3', null]) {
      refusee(variante({ 'meta.collection.garanties.skins': v }));
      refusee(variante({ 'meta.collection.garanties.familiers': v }));
    }
    refusee(variante({ 'meta.collection.garanties.autre': 1 }));
    refusee(variante({ 'meta.collection.garanties.skins': SUPPRIME }));
  });

  it('skins équipés : un skin possédé, à l’emplacement pour lequel il est fait', () => {
    acceptee(variante({ 'meta.collection.equipes.skins': { caserne: 'skin_caserne_3', suie: 'skin_suie' } }));
    // Skin d'une autre tour, d'un autre héros, inconnu, ou pas possédé.
    refusee(variante({ 'meta.collection.equipes.skins': { magie: 'skin_tir_1' } }));
    refusee(variante({ 'meta.collection.equipes.skins': { plume: 'skin_suie' } }));
    refusee(variante({ 'meta.collection.equipes.skins': { tir: 'skin_tir_3' } }));
    refusee(variante({ 'meta.collection.equipes.skins': { tir: 'skin_inconnu' } }));
    refusee(variante({ 'meta.collection.equipes.skins': { tir: 'familier_rat' } }));
    refusee(variante({ 'meta.collection.equipes.skins': { tir: 3 } }));
    refusee(variante({ 'meta.collection.equipes.skins': { sorts: 'skin_tir_1' } }));
    refusee(variante({ 'meta.collection.equipes.skins': { constructor: 'skin_tir_1' } }));
  });

  it('familiers équipés : un familier possédé, sur un héros qui existe', () => {
    acceptee(variante({ 'meta.collection.equipes.familiers': { plume: 'familier_rat', suie: 'familier_chouette' } }));
    refusee(variante({ 'meta.collection.equipes.familiers': { plume: 'familier_salamandre' } })); // pas possédé
    refusee(variante({ 'meta.collection.equipes.familiers': { plume: 'skin_suie' } }));
    refusee(variante({ 'meta.collection.equipes.familiers': { zeus: 'familier_rat' } }));
    refusee(variante({ 'meta.collection.equipes.familiers': { plume: 'inconnu' } }));
    refusee(variante({ 'meta.collection.equipes.extra': {} }));
    refusee(variante({ 'meta.collection.equipes.skins': SUPPRIME }));
  });

  it('rend une copie neuve, sans partage avec l’objet reçu', () => {
    const brut = JSON.parse(JSON.stringify(sauvegardeRemplie())) as ReturnType<typeof sauvegardeRemplie>;
    const r = validerSauvegarde(brut);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valeur.meta.collection).toEqual(brut.meta.collection);
    expect(r.valeur.meta.collection).not.toBe(brut.meta.collection);
    expect(r.valeur.meta.collection.possedes).not.toBe(brut.meta.collection.possedes);
    expect(r.valeur.meta.defis).not.toBe(brut.meta.defis);
  });
});

describe('sauvegarde v4 : config d’une partie en cours avec défi et bonus', () => {
  const config = { graine: 42, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 3, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: 3 };
  const avec = (extra: Record<string, unknown>): Record<string, unknown> => variante({ 'partie.config': { ...config, ...extra } });

  it('une config sans défi ni bonus (moteur sans ces champs) reste acceptée', () => {
    acceptee(avec({}));
  });

  it('accepte un défi (ou null) et un bonus au contrat du moteur', () => {
    acceptee(avec({ defi: null, bonus: { tours: {}, heros: {} } }));
    acceptee(avec({ defi: 'heroique', bonus: { tours: { tir: { cadence: 0.03 } }, heros: { pv: 0.1 } } }));
    acceptee(avec({ defi: 'fer', bonus: { tours: {}, heros: {} } }));
  });

  it('refuse un défi inconnu', () => {
    for (const defi of ['normal', '', 3, true, 'constructor']) refusee(avec({ defi, bonus: { tours: {}, heros: {} } }));
  });

  it('refuse un bonus mal formé ou au-dessus du plafond de +10 %', () => {
    const mal = [
      { tours: {}, heros: { pv: 0.11 } },
      { tours: { tir: { cadence: 0.2 } }, heros: {} },
      { tours: {}, heros: { pv: -0.01 } },
      { tours: {}, heros: { pv: Number.NaN } },
      { tours: {}, heros: { vitesse: 0.01 } },
      { tours: { donjon: { degats: 0.01 } }, heros: {} },
      { tours: { tir: { pv: 0.01 } }, heros: {} },
      { tours: {}, heros: { portee: 0.01 } },
      { tours: {}, heros: { pv: 0.06, degats: 0.06 } },
      { tours: { tir: { degats: 0.06, cadence: 0.06 } }, heros: {} },
      { tours: {} },
      { heros: {} },
      { tours: {}, heros: {}, extra: 1 },
      { tours: [], heros: {} },
      'rien',
      null,
    ];
    for (const bonus of mal) refusee(avec({ defi: null, bonus }));
  });

  it('défi et bonus sont facultatifs et indépendants (le moteur ne range que ceux qui ne sont pas vides)', () => {
    acceptee(avec({ defi: null }));
    acceptee(avec({ bonus: { tours: {}, heros: {} } }));
    acceptee(avec({ defi: 'fer' }));
    acceptee(avec({ bonus: { tours: { tir: { degats: 0.05 } }, heros: {} } }));
    refusee(avec({ defi: 'inconnu' }));
  });

  it('le défi Fer n’admet aucun bonus', () => {
    refusee(avec({ defi: 'fer', bonus: { tours: {}, heros: { pv: 0.01 } } }));
    refusee(avec({ defi: 'fer', bonus: { tours: { tir: { cadence: 0.01 } }, heros: {} } }));
  });
});
