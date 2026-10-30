// Contenu des bulles de description : les chiffres affichés sont ceux des données (ou de l'état de la partie), jamais
// recopiés à la main ; les textes sont ceux de src/i18n.
import { describe, expect, it } from 'vitest';
import { DIEUX } from '../data/dieux';
import { ENNEMIS } from '../data/ennemis';
import { HEROS } from '../data/heros';
import { REGION1 } from '../data/niveaux/region1';
import { TOURS } from '../data/tours';
import { VERSION_DONNEES } from '../data/version';
import { ajouterEnnemi, appliquerAction, casesLibres, creerPartie, step, validerAction } from '../engine';
import type { ConfigPartie, EtatPartie } from '../engine';
import { chercherParId } from '../engine/recherche';
import { t, tCle } from '../i18n';
import {
  contenuCompetenceHeros,
  contenuElementMenu,
  contenuEnnemi,
  contenuEnnemiDeDonnees,
  contenuHerosEnPartie,
  contenuTourDeDonnees,
  ennemiSous,
  type ContenuBulle,
} from './bulle-contenus';
import { elementsMenu } from './menu-cercle';

const NIVEAU = REGION1[0];
if (!NIVEAU) throw new Error('niveau 1 absent');

function partie(config: Partial<ConfigPartie> = {}): EtatPartie {
  return creerPartie(NIVEAU?.niveau as NonNullable<typeof NIVEAU>['niveau'], {
    graine: 3,
    difficulte: 'matou',
    dieu: 'charlie',
    heros: 'charlie',
    niveauHeros: 1,
    competencesHeros: {},
    ameliorations: {},
    objets: [],
    versionDonnees: VERSION_DONNEES,
    ...config,
  });
}

/** Valeur de la ligne `libelle` de la bulle ; lève si elle n'y est pas. */
function valeur(contenu: ContenuBulle | null, libelle: string): string {
  const ligne = contenu?.lignes.find((l) => l.libelle === libelle);
  if (!ligne) throw new Error(`Ligne absente : ${libelle} dans ${JSON.stringify(contenu)}`);
  return ligne.valeur;
}

function aLigne(contenu: ContenuBulle | null, libelle: string): boolean {
  return contenu?.lignes.some((l) => l.libelle === libelle) ?? false;
}

const fourchette = (a: number, b: number): string => t('bulle.fourchette', { a, b });
const nombre = (n: number): string => String(n).replace('.', ',');

describe('bulle d’une tour (données brutes)', () => {
  it('reprend dégâts, cadence et portée du Clocher des Archers de niveau 1', () => {
    const def = TOURS.tir.niveaux[0];
    const contenu = contenuTourDeDonnees('tir');
    expect(contenu.titre).toBe(tCle(def.nom));
    expect(contenu.sousTitre).toBe(t('bulle.role.tir'));
    expect(valeur(contenu, t('bulle.tour.degats'))).toContain(fourchette(def.degats[0], def.degats[1]));
    expect(valeur(contenu, t('bulle.tour.cadence'))).toBe(t('bulle.tour.cadence_valeur', { n: nombre(def.cadence) }));
    expect(valeur(contenu, t('bulle.tour.portee'))).toBe(t('bulle.cases', { n: nombre(def.portee) }));
    expect(valeur(contenu, t('bulle.tour.volants'))).toBe(t('bulle.oui'));
  });

  it('dit les soldats d’une caserne (nombre, PV) et qu’elle n’atteint pas les volants', () => {
    const def = TOURS.caserne.niveaux[0];
    const soldats = def.soldats;
    if (!soldats) throw new Error('caserne sans soldats');
    const contenu = contenuTourDeDonnees('caserne');
    expect(valeur(contenu, t('bulle.tour.soldats'))).toBe(t('bulle.tour.soldats_valeur', { n: soldats.nombre, nom: tCle(soldats.nom) }));
    expect(valeur(contenu, t('bulle.tour.pv_soldats'))).toBe(String(soldats.pv));
    expect(valeur(contenu, t('bulle.tour.portee_ralliement'))).toBe(t('bulle.cases', { n: nombre(def.portee) }));
    expect(valeur(contenu, t('bulle.tour.volants'))).toBe(t('bulle.non'));
    expect(aLigne(contenu, t('bulle.tour.degats'))).toBe(false);
  });

  it('donne le pouvoir d’une spécialisation et ses compétences', () => {
    const def = TOURS.tir.specialisations.B;
    const contenu = contenuTourDeDonnees('tir', { niveau: 4, voie: 'B' });
    expect(contenu.titre).toBe(tCle(def.nom));
    expect(valeur(contenu, t('bulle.tour.critique'))).toBe(
      t('bulle.tour.critique_valeur', { c: Math.round((def.critique?.chance ?? 0) * 100), m: nombre(def.critique?.multiplicateur ?? 0) }),
    );
    expect(contenu.notes).toContain(t('bulle.competences_tour', { noms: def.competences.map((c) => tCle(c.nom)).join(', ') }));
  });

  it('décrit chaque tour divine', () => {
    for (const id of ['plume', 'charlie', 'pollen'] as const) {
      const def = DIEUX[id].tourDivine;
      const contenu = contenuTourDeDonnees('divine', { dieu: id });
      expect(contenu.titre).toBe(tCle(def.nom));
      expect(contenu.sousTitre).toBe(t('bulle.role.divine'));
      expect(contenu.lignes.length).toBeGreaterThan(1);
    }
    expect(valeur(contenuTourDeDonnees('divine', { dieu: 'charlie' }), t('bulle.tour.onde'))).toBe(t('bulle.tour.onde_valeur'));
  });

  it('n’écrit jamais un paramètre vide ni un nombre anglais', () => {
    const contenus: ContenuBulle[] = [];
    for (const famille of ['caserne', 'tir', 'magie', 'artillerie'] as const) {
      for (const n of [1, 2, 3] as const) contenus.push(contenuTourDeDonnees(famille, { niveau: n }));
      for (const voie of ['A', 'B'] as const) contenus.push(contenuTourDeDonnees(famille, { niveau: 4, voie }));
    }
    for (const id of ['plume', 'charlie', 'pollen'] as const) contenus.push(contenuTourDeDonnees('divine', { dieu: id }));
    for (const id of Object.keys(ENNEMIS) as (keyof typeof ENNEMIS)[]) contenus.push(contenuEnnemiDeDonnees(id));
    for (const c of contenus) {
      for (const l of c.lignes) {
        expect(l.valeur).not.toMatch(/\d\.\d|NaN|undefined|\{/);
        expect(l.libelle).not.toBe('');
      }
      for (const note of c.notes) expect(note).not.toMatch(/\d\.\d|NaN|undefined|\{/);
    }
  });
});

describe('bulles du menu de construction', () => {
  const etat = partie();
  const libre = casesLibres(etat).find((c) => validerAction(etat, { type: 'construire', ...c, tour: 'tir' }) === null);
  if (!libre) throw new Error('aucune case libre');

  it('une tour à construire montre ses stats effectives (bonus du dieu compris)', () => {
    const elements = elementsMenu(etat, libre.cx, libre.cy);
    const tir = elements.find((e) => e.id === 'construire:tir');
    if (!tir) throw new Error('pas de tir');
    const contenu = contenuElementMenu(etat, libre.cx, libre.cy, tir);
    const def = TOURS.tir.niveaux[0];
    expect(valeur(contenu, t('bulle.tour.portee'))).toBe(t('bulle.cases', { n: nombre(def.portee) }));
    expect(valeur(contenu, t('bulle.tour.degats'))).toContain(fourchette(def.degats[0], def.degats[1]));
  });

  it('la tour divine du menu est celle du dieu de la partie', () => {
    const divine = elementsMenu(etat, libre.cx, libre.cy).find((e) => e.id === 'construire:divine');
    if (!divine) throw new Error('pas de divine');
    expect(contenuElementMenu(etat, libre.cx, libre.cy, divine)?.titre).toBe(tCle(DIEUX.charlie.tourDivine.nom));
  });

  it('une amélioration dit ce qui change, avant → après', () => {
    const e = partie();
    e.aretes = 5000;
    appliquerAction(e, { type: 'construire', ...libre, tour: 'tir' });
    const ameliorer = elementsMenu(e, libre.cx, libre.cy).find((x) => x.id === 'ameliorer');
    if (!ameliorer) throw new Error('pas d’amélioration');
    const contenu = contenuElementMenu(e, libre.cx, libre.cy, ameliorer);
    const [n1, n2] = TOURS.tir.niveaux;
    expect(contenu?.titre).toBe(t('bulle.amelioration', { n: 2 }));
    expect(valeur(contenu, t('bulle.tour.degats'))).toBe(
      t('bulle.avant_apres', {
        avant: t('bulle.degats.physique', { d: fourchette(n1.degats[0], n1.degats[1]) }),
        apres: t('bulle.degats.physique', { d: fourchette(n2.degats[0], n2.degats[1]) }),
      }),
    );
    expect(valeur(contenu, t('bulle.tour.portee'))).toBe(
      t('bulle.avant_apres', { avant: t('bulle.cases', { n: nombre(n1.portee) }), apres: t('bulle.cases', { n: nombre(n2.portee) }) }),
    );
    // Ce qui ne change pas n'est pas répété.
    expect(aLigne(contenu, t('bulle.tour.volants'))).toBe(false);
  });

  it('une spécialisation donne son pouvoir, une compétence de tour ce que le rang suivant change', () => {
    const e = partie();
    e.aretes = 5000;
    appliquerAction(e, { type: 'construire', ...libre, tour: 'tir' });
    appliquerAction(e, { type: 'ameliorer', ...libre });
    appliquerAction(e, { type: 'ameliorer', ...libre });
    const voieB = elementsMenu(e, libre.cx, libre.cy).find((x) => x.id === 'specialiser:B');
    if (!voieB) throw new Error('pas de spécialisation');
    const spec = contenuElementMenu(e, libre.cx, libre.cy, voieB);
    expect(spec?.titre).toBe(tCle(TOURS.tir.specialisations.B.nom));
    expect(aLigne(spec, t('bulle.tour.critique'))).toBe(true);

    appliquerAction(e, { type: 'specialiser', ...libre, voie: 'B' });
    const tete = elementsMenu(e, libre.cx, libre.cy).find((x) => x.id === 'competence:tir_a_la_tete');
    if (!tete) throw new Error('pas de compétence');
    const comp = contenuElementMenu(e, libre.cx, libre.cy, tete);
    const def = TOURS.tir.specialisations.B;
    const rang1 = def.competences[0]?.rangs[0].critique ?? 0;
    const avant = def.critique?.chance ?? 0;
    expect(valeur(comp, t('bulle.tour.critique'))).toBe(
      t('bulle.avant_apres', {
        avant: t('bulle.tour.critique_valeur', { c: Math.round(avant * 100), m: nombre(def.critique?.multiplicateur ?? 0) }),
        apres: t('bulle.tour.critique_valeur', { c: Math.round((avant + rang1) * 100), m: nombre(def.critique?.multiplicateur ?? 0) }),
      }),
    );
  });

  it('vendre et le ralliement n’ont pas de bulle', () => {
    const e = partie();
    e.aretes = 5000;
    appliquerAction(e, { type: 'construire', ...libre, tour: 'caserne' });
    for (const element of elementsMenu(e, libre.cx, libre.cy).filter((x) => x.id === 'vendre' || x.id === 'ralliement')) {
      expect(contenuElementMenu(e, libre.cx, libre.cy, element)).toBeNull();
    }
  });
});

describe('bulle d’un ennemi', () => {
  it('reprend PV, armure, résistance et vitesse des données', () => {
    const def = ENNEMIS.boucher_vaudrelle;
    const contenu = contenuEnnemiDeDonnees('boucher_vaudrelle');
    expect(contenu.titre).toBe(tCle(def.nom));
    expect(contenu.sousTitre).toBe(t('bulle.ennemi.boss'));
    expect(valeur(contenu, t('bulle.pv'))).toBe(String(def.pv));
    expect(valeur(contenu, t('bulle.ennemi.armure'))).toBe(t('bulle.ennemi.armure_valeur', { n: Math.round(def.armure * 100) }));
    expect(valeur(contenu, t('bulle.ennemi.resistance'))).toBe(t('bulle.ennemi.resistance_valeur', { n: Math.round(def.resistance * 100) }));
    expect(valeur(contenu, t('bulle.ennemi.vitesse'))).toBe(t('bulle.ennemi.vitesse_valeur', { n: nombre(def.vitesse) }));
    expect(contenu.notes).toContain(t('bulle.ennemi.inarretable'));
    expect(contenu.texte).toBe(tCle('ennemi.boucher_vaudrelle.desc'));
  });

  it('dit « aucune » sans armure et nomme les particularités (volant, furtif, soigneur)', () => {
    expect(valeur(contenuEnnemiDeDonnees('paysan_affame'), t('bulle.ennemi.armure'))).toBe(t('bulle.ennemi.aucune'));
    expect(contenuEnnemiDeDonnees('corbeau_noir').notes).toContain(t('bulle.ennemi.volant'));
    expect(contenuEnnemiDeDonnees('delateur').notes).toContain(t('bulle.ennemi.furtif'));
    const soin = ENNEMIS.medecin_peste.pouvoirs?.soin;
    if (!soin) throw new Error('le médecin de peste ne soigne plus');
    expect(contenuEnnemiDeDonnees('medecin_peste').notes).toContain(t('bulle.ennemi.soin', { p: Math.round(soin.quantite * 100), s: nombre(soin.cadence) }));
  });

  it('en partie : PV actuels sur PV max, ceux de l’état (difficulté et élite comprises)', () => {
    const etat = partie({ difficulte: 'vieux_sage' });
    const e = ajouterEnnemi(etat, ENNEMIS.paysan_affame, 'paysan_affame', 0, 2, true);
    e.pv = e.pvMax / 2;
    const contenu = contenuEnnemi(e);
    expect(valeur(contenu, t('bulle.pv'))).toBe(t('bulle.pv_valeur', { n: Math.round(e.pv), m: Math.round(e.pvMax) }));
    expect(contenu.notes).toContain(t('bulle.ennemi.elite'));
    expect(valeur(contenu, t('bulle.ennemi.vitesse'))).toBe(t('bulle.ennemi.vitesse_valeur', { n: nombre(ENNEMIS.paysan_affame.vitesse) }));
  });

  it('trouve l’ennemi vivant le plus proche du point touché, dans le rayon', () => {
    const etat = partie();
    const e = ajouterEnnemi(etat, ENNEMIS.mendiant, 'mendiant', 0, 3);
    expect(ennemiSous(etat, e.x, e.y - 0.5, 0.5)).toBe(e);
    expect(ennemiSous(etat, e.x + 5, e.y, 0.5)).toBeNull();
    e.vivant = false;
    expect(ennemiSous(etat, e.x, e.y - 0.5, 0.5)).toBeNull();
  });
});

describe('bulles des héros', () => {
  it('en partie : nom, rôle, PV et dégâts du héros (état de la partie)', () => {
    const etat = partie({ heros: 'corbeau', dieu: 'plume', niveauHeros: 3, competencesHeros: { oeil_noir: 2 } });
    step(etat);
    const heros = chercherParId(etat.unites, etat.heros);
    if (!heros) throw new Error('pas de héros');
    const contenu = contenuHerosEnPartie(etat);
    expect(contenu?.titre).toBe(tCle(HEROS.corbeau.nom));
    expect(contenu?.sousTitre).toBe(tCle(HEROS.corbeau.role));
    expect(valeur(contenu, t('bulle.pv'))).toBe(t('bulle.pv_valeur', { n: Math.round(heros.pv), m: Math.round(heros.stats.pv) }));
    const distance = heros.stats.capacites?.distance;
    if (!distance) throw new Error('corbeau sans tir');
    expect(valeur(contenu, t('bulle.heros.portee'))).toBe(t('bulle.cases', { n: nombre(Math.round(distance.portee * 100) / 100) }));
    expect(contenu?.lignes.some((l) => l.valeur.includes(t('bulle.heros.competence_rang', { nom: tCle('comp.oeil_noir'), n: 2, m: 3 })))).toBe(true);
  });

  it('compétence : ce qu’elle fait au rang actuel et au suivant', () => {
    const comp = HEROS.plume.competences[0];
    if (!comp) throw new Error('pas de compétence');
    const contenu = contenuCompetenceHeros('plume', 0, 1);
    expect(contenu.titre).toBe(tCle(comp.nom));
    expect(valeur(contenu, t('bulle.comp.rang_actuel', { n: 1, m: 3 }))).toBe(t('bulle.mod.esquive', { n: Math.round(comp.rangs[0].esquive * 100) }));
    expect(valeur(contenu, t('bulle.comp.rang_suivant', { n: 2, m: 3 }))).toBe(t('bulle.mod.esquive', { n: Math.round(comp.rangs[1].esquive * 100) }));
    const zero = contenuCompetenceHeros('plume', 0, 0);
    expect(valeur(zero, t('bulle.comp.rang_actuel', { n: 0, m: 3 }))).toBe(t('bulle.comp.pas_apprise'));
    const max = contenuCompetenceHeros('plume', 0, 3);
    expect(aLigne(max, t('bulle.comp.rang_suivant', { n: 4, m: 3 }))).toBe(false);
    expect(max.notes).toContain(t('bulle.au_sommet'));
  });

  it('une ultime dit le niveau qui la débloque', () => {
    const ultime = HEROS.plume.competences[3];
    if (!ultime) throw new Error('pas d’ultime');
    const contenu = contenuCompetenceHeros('plume', 3, 0, true);
    expect(contenu.sousTitre).toBe(t('bulle.comp.ultime'));
    expect(contenu.notes).toContain(t('bulle.comp.verrouillee', { n: ultime.niveauRequis }));
  });
});
