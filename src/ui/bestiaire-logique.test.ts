// La logique du Bestiaire : ennemis listés depuis les données et classés par région, conseils générés d'après les particularités, tours
// verrouillées selon la campagne, chiffres identiques à ceux des bulles.
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { IDS_DIEUX } from '../data/meta';
import { REGIONS } from '../data/niveaux/campagne';
import { FAMILLES, TOURS } from '../data/tours';
import { aTexte, t, tCle } from '../i18n';
import { rencontrerEnnemis, sauvegardeVide } from '../save';
import type { DefEnnemi } from '../engine/definitions';
import { CONSEILS_ACTIONS, CONSEILS_POUVOIRS, conseilsContre, contenuDeTour, libelleDeTour, ennemisDeLaFiche, ennemisDuNiveau, ennemisParRegion, ficheEnnemi, groupesDeTours, nomDeTour } from './bestiaire-logique';
import { contenuEnnemiDeDonnees, contenuTourDeDonnees } from './bulle-contenus';

describe('le conseil contre un ennemi très blindé du DLC', () => {
  it('le Grand Centaure : il faut percer son armure, sans chiffre', () => {
    const conseils = conseilsContre('moderne_centaure_boss');
    const phrase = t('bestiaire.contre.tres_blinde');
    expect(conseils).toContain(phrase);
    expect(phrase).toContain('percer');
    expect(phrase).not.toMatch(/\d/);
  });

  it('un ennemi peu blindé du DLC, ou un ennemi de l’histoire, n’a pas ce conseil', () => {
    const phrase = t('bestiaire.contre.tres_blinde');
    expect(conseilsContre('moderne_prefet')).not.toContain(phrase);
    expect(conseilsContre('garde_royal')).not.toContain(phrase);
  });
});

describe('les ennemis viennent des données', () => {
  it('chaque ennemi de la table figure une fois, et une seule, dans les groupes', () => {
    const ids = ennemisParRegion(sauvegardeVide()).flatMap((g) => g.ennemis.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    // Le Bestiaire de l'histoire est celui d'avant le DLC : aucun ennemi « Temps modernes ».
    expect([...ids].sort()).toEqual(Object.keys(ENNEMIS).filter((id) => !id.startsWith('moderne_')).sort());
  });

  it('le Bestiaire du DLC montre les ennemis « Temps modernes », et eux seuls', () => {
    const ids = ennemisParRegion(sauvegardeVide(), undefined, 'moderne').flatMap((g) => g.ennemis.map((e) => e.id));
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(Object.keys(ENNEMIS).filter((id) => id.startsWith('moderne_')).sort());
    // Un Bestiaire par campagne : ces ennemis paraissent dans les niveaux du DLC (régions 1 à 3 : la Fac, la Manif, la Préfecture) ; les
    // seuls du groupe « hors campagne » (région 0) sont ceux qu'aucun niveau ne place (renforts invoqués...).
    const groupes = ennemisParRegion(sauvegardeVide(), undefined, 'moderne');
    expect(groupes.map((g) => g.region).filter((r) => r > 0)).toEqual([1, 2, 3]);
    expect(groupes.every((g) => g.region >= 0 && g.region <= 3)).toBe(true);
    // Et le Bestiaire de l'histoire n'en montre aucun, dans aucun groupe.
    expect(ennemisParRegion(sauvegardeVide()).some((g) => g.ennemis.some((e) => e.id.startsWith('moderne_')))).toBe(false);
  });

  it('un ennemi du DLC placé dans un niveau du DLC prend la région de ce niveau, et jamais celle de l’histoire', () => {
    const niveau = REGIONS[0]?.[0];
    if (!niveau) throw new Error('niveau 1 absent');
    const faux = { ...niveau, niveau: { ...niveau.niveau, vagues: [{ paquets: [{ ennemi: 'moderne_gendarme', nombre: 1, intervalle: 1, chemin: 0, delai: 0 }, { ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 0, delai: 0 }] }] } };
    const moderne = ennemisParRegion(sauvegardeVide(), [[faux]], 'moderne');
    expect(moderne[0]).toMatchObject({ region: 1, ennemis: [{ id: 'moderne_gendarme' }] });
    expect(moderne.flatMap((g) => g.ennemis).some((e) => e.id === 'paysan_affame')).toBe(false);
    const histoire = ennemisParRegion(sauvegardeVide(), [[faux]]);
    expect(histoire.flatMap((g) => g.ennemis).some((e) => e.id === 'moderne_gendarme')).toBe(false);
  });

  it('range un ennemi dans la région où il paraît d’abord, dans l’ordre des régions', () => {
    const groupes = ennemisParRegion(sauvegardeVide());
    const region = (id: string): number | undefined => groupes.find((g) => g.ennemis.some((e) => e.id === id))?.region;
    expect(region('paysan_affame')).toBe(1);
    expect(region('glaneur')).toBe(2);
    const numeros = groupes.map((g) => g.region).filter((r) => r > 0);
    expect(numeros).toEqual([...numeros].sort((a, b) => a - b));
  });

  it('un ennemi ajouté aux données et à un niveau apparaît sans autre changement', () => {
    const niveau = REGIONS[0]?.[0];
    if (!niveau) throw new Error('niveau 1 absent');
    const faux = { ...niveau, niveau: { ...niveau.niveau, vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 0, delai: 0 }] }] } };
    const groupes = ennemisParRegion(sauvegardeVide(), [[faux]]);
    expect(groupes[0]).toMatchObject({ region: 1, ennemis: [{ id: 'paysan_affame', rencontre: false }] });
    // Tous les autres ennemis de la table, absents des niveaux donnés, finissent dans le groupe « hors campagne ».
    expect(groupes[1]?.region).toBe(0);
    expect(groupes[1]?.ennemis.length).toBe(Object.keys(ENNEMIS).filter((id) => !id.startsWith('moderne_')).length - 1);
  });

  it('marque comme rencontrés ceux de la sauvegarde', () => {
    const s = rencontrerEnnemis(sauvegardeVide(), ['mendiant']).sauvegarde;
    const tous = ennemisParRegion(s).flatMap((g) => g.ennemis);
    expect(tous.find((e) => e.id === 'mendiant')?.rencontre).toBe(true);
    expect(tous.find((e) => e.id === 'paysan_affame')?.rencontre).toBe(false);
  });

  it('la fiche d’un niveau liste ses ennemis une fois chacun et signale les nouveaux', () => {
    const niveau = REGIONS[0]?.[0]?.niveau;
    if (!niveau) throw new Error('niveau 1 absent');
    const ids = ennemisDuNiveau(niveau);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ennemisDeLaFiche(niveau, sauvegardeVide()).every((e) => e.nouveau)).toBe(true);
    const connu = rencontrerEnnemis(sauvegardeVide(), [ids[0] ?? '']).sauvegarde;
    const fiche = ennemisDeLaFiche(niveau, connu);
    expect(fiche[0]).toEqual({ id: ids[0], nouveau: false });
    expect(fiche.slice(1).every((e) => e.nouveau)).toBe(true);
  });
});

describe('comment le contrer', () => {
  it('un volant renvoie aux tours qui visent les volants, lues dans les données', () => {
    const familles = FAMILLES.filter((f) => [...TOURS[f].niveaux, TOURS[f].specialisations.A, TOURS[f].specialisations.B].some((d) => d.volants)).map((f) => tCle(`famille.${f}`));
    expect(familles.length).toBeGreaterThan(0);
    const texte = conseilsContre('corbeau_noir').join(' ');
    for (const nom of familles) expect(texte).toContain(nom);
  });

  it('un archer est signalé comme un tireur, un ennemi qui se relève comme tel', () => {
    expect(conseilsContre('glaneur').join(' ')).toContain('de loin');
    expect(conseilsContre('epouvantail').join(' ')).toContain('relève');
  });

  it('un ennemi sans particularité reçoit un conseil général, jamais une liste vide', () => {
    expect(conseilsContre('paysan_affame')).toHaveLength(1);
  });

  it('chaque ennemi du jeu a au moins un conseil, sans paramètre manquant, et un boss le dit', () => {
    for (const [id, def] of Object.entries(ENNEMIS)) {
      const conseils = conseilsContre(id);
      expect(conseils.length, id).toBeGreaterThan(0);
      if ((def as { boss: boolean }).boss) expect(conseils.join(' '), id).toContain('boss');
    }
  });

  it('le Passeur (boss de la région 11) : péage, plongée, corbeaux et tours gelées, tirés de ses données', () => {
    const texte = conseilsContre('passeur').join(' ');
    for (const cle of ['bestiaire.contre.vol', 'bestiaire.contre.intouchable', 'bestiaire.contre.renforts', 'bestiaire.contre.tours_gelees', 'bestiaire.contre.boss'] as const) {
      expect(texte).toContain(t(cle));
    }
    expect(tCle(ENNEMIS.passeur.nom)).toBe('Le Passeur');
    expect(ficheEnnemi('passeur').lore).not.toBeNull();
  });

  it('un identifiant inconnu n’a aucun conseil', () => {
    expect(conseilsContre('ennemi_imaginaire')).toEqual([]);
  });
});

describe('la fiche d’un ennemi', () => {
  it('reprend les chiffres des bulles et la phrase de lore', () => {
    const f = ficheEnnemi('paysan_affame');
    expect(f.contenu).toEqual(contenuEnnemiDeDonnees('paysan_affame'));
    expect(f.contenu.lignes.find((l) => l.libelle === 'PV')?.valeur).toBe(String(ENNEMIS.paysan_affame.pv));
    expect(f.sprite).toBe('paysan-affame');
    expect(f.lore).toBe(aTexte('ennemi.paysan_affame.desc') ? tCle('ennemi.paysan_affame.desc') : null);
  });

  it('a un sprite et un nom pour chaque ennemi', () => {
    for (const id of Object.keys(ENNEMIS)) {
      const f = ficheEnnemi(id);
      expect(f.contenu.titre.length, id).toBeGreaterThan(0);
      expect(f.sprite, id).toBe(id.replaceAll('_', '-'));
    }
  });
});

describe('les tours et ce que la campagne a ouvert', () => {
  it('liste chaque famille avec ses trois niveaux et ses deux spécialisations, puis la tour divine de chaque dieu', () => {
    const groupes = groupesDeTours(1);
    expect(groupes.map((g) => g.famille)).toEqual([...FAMILLES, 'divine']);
    for (const g of groupes.slice(0, -1)) expect(g.tours.map((x) => x.id)).toEqual([`${g.famille}-1`, `${g.famille}-2`, `${g.famille}-3`, `${g.famille}-4A`, `${g.famille}-4B`]);
    expect(groupes[groupes.length - 1]?.tours.map((x) => x.dieu)).toEqual([...IDS_DIEUX]);
  });

  it('verrouille ce que le niveau le plus avancé n’a pas encore ouvert', () => {
    const plat = (niveauMax: number) => groupesDeTours(niveauMax).flatMap((g) => g.tours);
    const verrou = (niveauMax: number, id: string): boolean | undefined => plat(niveauMax).find((x) => x.id === id)?.verrouillee;
    expect(verrou(1, 'caserne-1')).toBe(false);
    expect(verrou(1, 'caserne-2')).toBe(true);
    expect(verrou(2, 'caserne-2')).toBe(false);
    expect(verrou(3, 'caserne-3')).toBe(true);
    expect(verrou(4, 'caserne-3')).toBe(false);
    expect(verrou(5, 'caserne-4A')).toBe(true);
    expect(verrou(6, 'caserne-4A')).toBe(false);
    expect(verrou(6, 'caserne-4B')).toBe(false);
    expect(verrou(9, 'divine-plume')).toBe(true);
    expect(verrou(10, 'divine-plume')).toBe(false);
    expect(plat(11).every((x) => !x.verrouillee)).toBe(true);
    expect(plat(1).find((x) => x.id === 'tir-2')?.ouvertAuNiveau).toBe(2);
  });

  it('ses chiffres sont ceux des bulles, tirés des données', () => {
    const tir1 = groupesDeTours(11).flatMap((g) => g.tours).find((x) => x.id === 'tir-1');
    if (!tir1) throw new Error('tir-1 absent');
    // Le Bestiaire de l'histoire montre exactement les lignes des bulles ; celui du DLC y ajoute la capacité de la famille.
    const bulle = contenuTourDeDonnees('tir', { niveau: 1 });
    expect(contenuDeTour(tir1)).toEqual(bulle);
    expect(contenuDeTour(tir1, 'histoire')).toEqual(bulle);
    expect(contenuDeTour(tir1, 'moderne')).toEqual({ ...bulle, lignes: [...bulle.lignes, { libelle: t('bulle.tour.capacite_dlc'), valeur: expect.any(String) as string }] });
    const [min, max] = TOURS.tir.niveaux[0].degats;
    expect(contenuDeTour(tir1, 'moderne').lignes.map((l) => l.valeur).join(' ')).toContain(`${String(min)} à ${String(max)}`);
    expect(nomDeTour(tir1)).toBe(tCle(TOURS.tir.niveaux[0].nom));
  });

  it('chaque tour a un nom et un contenu, spécialisations et tours divines comprises', () => {
    for (const tour of groupesDeTours(11).flatMap((g) => g.tours)) {
      expect(nomDeTour(tour).length, tour.id).toBeGreaterThan(0);
      expect(contenuDeTour(tour).lignes.length, tour.id).toBeGreaterThan(0);
    }
  });
});

describe('conseils : volants, charges, pouvoirs génériques', () => {
  it('un volant rapide ne reçoit pas de conseil de soldats', () => {
    const texte = conseilsContre('corbeau_noir').join(' ');
    expect(ENNEMIS.corbeau_noir.vitesse).toBeGreaterThanOrEqual(1.8);
    expect(texte).not.toContain(t('bestiaire.contre.rapide'));
    expect(t('bestiaire.contre.rapide_volant')).not.toContain('soldat');
    expect(texte).toContain(t('bestiaire.contre.rapide_volant'));
  });

  it('un ennemi au sol rapide garde le conseil de barrage', () => {
    expect(conseilsContre('chien_errant').join(' ')).toContain(t('bestiaire.contre.rapide'));
  });

  it('un ennemi qui charge a sa phrase (action charger)', () => {
    const charge = Object.entries(ENNEMIS).find(([, d]) => [...((d as DefEnnemi).pouvoirs?.paliers ?? []).flatMap((p) => p.actions), ...((d as DefEnnemi).pouvoirs?.periodiques ?? []).flatMap((p) => p.actions)].some((a) => a.type === 'charger'));
    if (!charge) return;
    expect(conseilsContre(charge[0]).join(' ')).toContain(t('bestiaire.contre.charge'));
  });

  it('le conseil des tireurs ne parle pas de se poser, celui de la résistance cite des familles des données', () => {
    expect(t('bestiaire.contre.distance')).not.toContain('pose');
    const resistant = Object.keys(ENNEMIS).find((id) => (ENNEMIS[id as keyof typeof ENNEMIS] as DefEnnemi).resistance >= 0.3);
    if (!resistant) return;
    const texte = conseilsContre(resistant).join(' ');
    expect(texte).toContain(t('bestiaire.contre.resistant', { familles: FAMILLES.map((f) => tCle(`famille.${f}`)).join(', ') }).slice(0, 20));
  });

  it('les nouveaux ennemis ont leur conseil (pouvoir, action, pouvoir conditionnel)', () => {
    expect(conseilsContre('coupe_bourse').join(' ')).toContain(t('bestiaire.contre.vol'));
    expect(conseilsContre('porte_herse').join(' ')).toContain(t('bestiaire.contre.bouclier'));
    expect(conseilsContre('aumonier').join(' ')).toContain(t('bestiaire.contre.purifier'));
    expect(conseilsContre('martyr_bleme').join(' ')).toContain(t('bestiaire.contre.derniere_lueur'));
  });

  it('la division cite les familles de zone des données, sans les écrire à la main', () => {
    const id = Object.keys(ENNEMIS).find((e) => 'division' in ((ENNEMIS[e as keyof typeof ENNEMIS] as DefEnnemi).pouvoirs ?? {}));
    expect(id).toBeDefined();
    const texte = conseilsContre(id as string).join(' ');
    expect(texte).not.toContain('{familles}');
    const zone = FAMILLES.find((f) => TOURS[f].niveaux.some((n) => n.zone > 0));
    expect(zone).toBeDefined();
    expect(texte).toContain(tCle(`famille.${zone ?? ''}`));
  });

  it('chaque pouvoir et chaque action présents dans les données ont une phrase (ajouter une phrase dans CONSEILS_POUVOIRS ou CONSEILS_ACTIONS pour un nouveau)', () => {
    const pouvoirs = new Set<string>();
    const actions = new Set<string>();
    for (const d of Object.values(ENNEMIS) as DefEnnemi[]) {
      for (const cle of Object.keys(d.pouvoirs ?? {})) pouvoirs.add(cle);
      for (const a of [...(d.pouvoirs?.paliers ?? []).flatMap((p) => p.actions), ...(d.pouvoirs?.periodiques ?? []).flatMap((p) => p.actions)]) actions.add(a.type);
    }
    for (const cle of pouvoirs) expect(cle in CONSEILS_POUVOIRS, `pouvoir sans conseil : ${cle}`).toBe(true);
    for (const type of actions) expect(type in CONSEILS_ACTIONS, `action sans conseil : ${type}`).toBe(true);
  });
});

describe('libellés des tours', () => {
  it('les niveaux 1 à 3 d’une famille ont des libellés différents, et les spécialisations aussi', () => {
    const tir = groupesDeTours(11).find((g) => g.famille === 'tir')?.tours ?? [];
    const libelles = tir.map((x) => libelleDeTour(x));
    expect(new Set(libelles).size).toBe(libelles.length);
    expect(libelles[1]).toContain(t('bestiaire.tour_niveau', { n: 2 }));
    expect(libelles[3]).toContain(t('bestiaire.tour_specialisation', { voie: 'A' }));
  });

  it('la tour divine garde son nom seul', () => {
    const d = groupesDeTours(11).find((g) => g.famille === 'divine')?.tours[0];
    if (!d) throw new Error('divine absente');
    expect(libelleDeTour(d)).toBe(nomDeTour(d));
  });
});
