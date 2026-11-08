// Le bestiaire de la sauvegarde (v7) : migration depuis la v6, validation stricte, transactions pures, persistance par la session, fusion.
import { describe, expect, it } from 'vitest';
import { copie, FIXTURE_V6 } from './aides.test-utils';
import { Depot } from './depot';
import { sauvegardeVide, VERSION_SAUVEGARDE, type Sauvegarde } from './format';
import { migrer } from './migrations';
import { fusionnerProgressions } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { changerFichesEnnemis, ennemiRencontre, rencontrerEnnemis, reunirRencontres } from './transactions-bestiaire';
import { validerSauvegarde } from './validation';
import { creerVerrouMemoire } from './verrou';

function avecBestiaire(bestiaire: unknown): unknown {
  const s = sauvegardeVide();
  return JSON.parse(JSON.stringify({ ...s, meta: { ...s.meta, bestiaire } }));
}

describe('migration v6 vers v7', () => {
  it('la fixture v6 figée est bien une sauvegarde en version 6', () => {
    expect((JSON.parse(FIXTURE_V6) as { version: number }).version).toBe(6);
  });

  it('ne perd rien : seule la méta reçoit un bestiaire vide, fiches activées', () => {
    const v6 = JSON.parse(FIXTURE_V6) as { progression: unknown; reglages: unknown; meta: Record<string, unknown>; partie: unknown };
    const r = migrer(v6);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(6);
    expect(r.sauvegarde.version).toBe(VERSION_SAUVEGARDE);
    expect(r.sauvegarde.progression).toEqual(v6.progression);
    expect(r.sauvegarde.reglages).toEqual(v6.reglages);
    expect(r.sauvegarde.partie).toEqual(v6.partie);
    expect(r.sauvegarde.meta).toEqual({ ...v6.meta, bestiaire: { rencontres: [], fiches: true } });
    expect(r.sauvegarde.meta.inscriptions).toEqual(['chaumes', 'pendus', 'choeur']);
  });

  it('une v6 abîmée est refusée après migration', () => {
    const v6 = JSON.parse(FIXTURE_V6) as Record<string, unknown>;
    expect(migrer({ ...v6, extra: 1 })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...v6, meta: { ...(v6.meta as object), inscriptions: ['inconnue'] } })).toMatchObject({ ok: false, cause: 'invalide' });
  });
});

describe('validation du bestiaire', () => {
  it('accepte un bestiaire trié, sans doublon, et en rend une copie neuve', () => {
    const brut = avecBestiaire({ rencontres: ['mendiant', 'paysan_affame'], fiches: false });
    const r = validerSauvegarde(brut);
    if (!r.ok) throw new Error(r.raison);
    expect(r.valeur.meta.bestiaire).toEqual({ rencontres: ['mendiant', 'paysan_affame'], fiches: false });
    expect(r.valeur.meta.bestiaire).not.toBe((brut as Sauvegarde).meta.bestiaire);
  });

  it('refuse un bestiaire absent, mal formé ou piégé', () => {
    const sans = copie(sauvegardeVide());
    Reflect.deleteProperty(sans.meta as object, 'bestiaire');
    const mauvais: unknown[] = [
      { rencontres: ['b', 'a'], fiches: true },
      { rencontres: ['a', 'a'], fiches: true },
      { rencontres: ['A'], fiches: true },
      { rencontres: [3], fiches: true },
      { rencontres: ['x y'], fiches: true },
      { rencontres: [], fiches: 'oui' },
      { rencontres: {}, fiches: true },
      { rencontres: [], fiches: true, extra: 1 },
      { rencontres: Array.from({ length: 501 }, (_, i) => `e${String(i).padStart(4, '0')}`), fiches: true },
      null,
    ];
    expect(validerSauvegarde(sans).ok).toBe(false);
    for (const b of mauvais) expect(validerSauvegarde(avecBestiaire(b)).ok, JSON.stringify(b).slice(0, 60)).toBe(false);
  });

  it('tolère un ennemi que les données ne connaissent plus (ne rend pas la sauvegarde illisible)', () => {
    expect(validerSauvegarde(avecBestiaire({ rencontres: ['ancien_ennemi_retire'], fiches: true })).ok).toBe(true);
  });
});

describe('rencontrer des ennemis', () => {
  it('note les nouveaux, triés, sans doublon, et rend la sauvegarde elle-même s’il n’y a rien de neuf', () => {
    const vide = sauvegardeVide();
    const a = rencontrerEnnemis(vide, ['mendiant', 'chien_errant', 'mendiant']);
    expect(a.nouveaux).toEqual(['mendiant', 'chien_errant']);
    expect(a.sauvegarde.meta.bestiaire.rencontres).toEqual(['chien_errant', 'mendiant']);
    expect(vide.meta.bestiaire.rencontres).toEqual([]);
    const b = rencontrerEnnemis(a.sauvegarde, ['mendiant', 'paysan_affame']);
    expect(b.nouveaux).toEqual(['paysan_affame']);
    const c = rencontrerEnnemis(b.sauvegarde, ['mendiant']);
    expect(c.nouveaux).toEqual([]);
    expect(c.sauvegarde).toBe(b.sauvegarde);
  });

  it('la liste écrite passe la validation et ennemiRencontre la relit', () => {
    const s = rencontrerEnnemis(sauvegardeVide(), ['paysan_affame', 'corbeau_noir']).sauvegarde;
    expect(validerSauvegarde(JSON.parse(JSON.stringify(s))).ok).toBe(true);
    expect(ennemiRencontre(s, 'corbeau_noir')).toBe(true);
    expect(ennemiRencontre(s, 'mendiant')).toBe(false);
  });

  it('couper puis rallumer les fiches ne touche pas aux rencontres', () => {
    const s = rencontrerEnnemis(sauvegardeVide(), ['mendiant']).sauvegarde;
    const coupe = changerFichesEnnemis(s, false);
    expect(coupe.meta.bestiaire).toEqual({ rencontres: ['mendiant'], fiches: false });
    expect(changerFichesEnnemis(coupe, false)).toBe(coupe);
    expect(changerFichesEnnemis(coupe, true).meta.bestiaire.fiches).toBe(true);
  });
});

describe('persistance et fusion', () => {
  it('la session écrit les rencontres, une seule fois par ennemi, et une session rouverte les relit', async () => {
    const stockage = new StockageMemoire();
    const verrou = creerVerrouMemoire();
    const ouvrir = (): Promise<Session> => Session.ouvrir(new Depot(stockage), null, { verrou });
    const session = await ouvrir();
    const premiere = await session.rencontrerEnnemis(['mendiant', 'chien_errant']);
    expect(premiere.ok && premiere.detail).toEqual(['mendiant', 'chien_errant']);
    const seconde = await session.rencontrerEnnemis(['mendiant']);
    expect(seconde.ok && seconde.detail).toEqual([]);
    expect(await session.changerFichesEnnemis(false)).toBe(true);
    const rouverte = await ouvrir();
    expect(rouverte.sauvegarde.meta.bestiaire).toEqual({ rencontres: ['chien_errant', 'mendiant'], fiches: false });
  });

  it('la fusion réunit les ennemis rencontrés des deux côtés et garde l’option de a', () => {
    const a = rencontrerEnnemis(changerFichesEnnemis(sauvegardeVide(), false), ['mendiant']).sauvegarde;
    const b = rencontrerEnnemis(sauvegardeVide(), ['chien_errant', 'mendiant']).sauvegarde;
    const m = fusionnerProgressions(a, b);
    expect(m.meta.bestiaire).toEqual({ rencontres: ['chien_errant', 'mendiant'], fiches: false });
    expect(fusionnerProgressions(m, a)).toBe(m);
  });

  it('reunirRencontres trie et dédoublonne', () => {
    expect(reunirRencontres(['b', 'a'], ['c', 'a'])).toEqual(['a', 'b', 'c']);
  });
});
