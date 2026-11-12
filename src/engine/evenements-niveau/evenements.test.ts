import { describe, expect, it } from 'vitest';
import { EVENEMENTS_NIVEAU } from '../../data/evenements-niveau';
import { CONFIG, VAGUE_LOINTAINE, avancerSecondes, ennemiEssai, heros } from '../aides.test-utils';
import type { EvenementNiveau, Vague } from '../definitions';
import { ajouterEnnemi } from '../ennemis';
import type { EtatPartie } from '../etat';
import type { Evenement } from '../evenements';
import { appliquerAction, creerPartie, step, validerAction } from '../partie';
import { enPas } from '../temps';
import { niveauDynamique, type OptionsNiveauDynamique } from './niveaux-essai.test-utils';

const ANNONCE = enPas(EVENEMENTS_NIVEAU.annonce);

/** Partie sur le niveau dynamique, vague 1 appelée au pas 0. */
function partie(o: OptionsNiveauDynamique): EtatPartie {
  const etat = creerPartie(niveauDynamique(o), CONFIG);
  expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
  return etat;
}

/** Avance de `pas` pas et rend chaque événement avec le pas où il a eu lieu. */
function suivre(etat: EtatPartie, pas: number): { pas: number; ev: Evenement }[] {
  const vus: { pas: number; ev: Evenement }[] = [];
  for (let i = 0; i < pas; i++) {
    const p = etat.pas;
    step(etat);
    for (const ev of etat.evenements) vus.push({ pas: p, ev });
  }
  return vus;
}

/** Ennemi increvable et inoffensif posé sur un chemin, à la vitesse donnée (tuiles par seconde). */
function marcheur(etat: EtatPartie, chemin: number, distance: number, vitesse: number, volant = false): ReturnType<typeof ajouterEnnemi> {
  return ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse, degats: [0, 0], volant }), 'paysan_affame', chemin, distance);
}

describe('vérification des événements du niveau', () => {
  const avec = (evenement: EvenementNiveau): (() => EtatPartie) => () => creerPartie(niveauDynamique({ evenements: [evenement] }), CONFIG);

  it('refuse une vague qui n’existe pas', () => {
    expect(avec({ vague: 0, type: 'ouvrir_chemin', chemin: 0 })).toThrow(/vague/);
    expect(avec({ vague: 3, type: 'ouvrir_chemin', chemin: 0 })).toThrow(/vague/);
  });

  it('refuse un délai plus court que l’annonce', () => {
    expect(avec({ vague: 1, delai: EVENEMENTS_NIVEAU.annonce - 1, type: 'nasse', chemin: 0, debut: 5, longueur: 2, duree: 3 })).toThrow(/délai/);
  });

  it('refuse un chemin inconnu, un repli sur lui-même, une ligne hors de la grille, une unité inconnue', () => {
    expect(avec({ vague: 1, type: 'nasse', chemin: 5, debut: 5, longueur: 2, duree: 3 })).toThrow(/chemin/);
    expect(avec({ vague: 1, type: 'fermer_chemin', chemin: 1, repli: 1 })).toThrow(/repli/);
    expect(avec({ vague: 1, type: 'canon_a_eau', cy: 99, recul: 2, etourdissement: 1 })).toThrow(/ligne/);
    expect(avec({ vague: 1, type: 'renforts', x: 10, y: 5, nombre: 2, duree: 5, unite: 'licorne' })).toThrow(/unité/);
    expect(avec({ vague: 1, type: 'charge', chemin: 0, ennemi: 'inconnu', nombre: 2, intervalle: 1, facteurVitesse: 2, duree: 3 })).toThrow(/ennemi/);
  });

  it('un niveau sans événements a un état dynamique neutre', () => {
    const etat = creerPartie(niveauDynamique(), CONFIG);
    expect(etat.dynamique).toEqual({ evenements: [], cheminsActifs: [true, true], replis: [-1, -1], barrages: [], foules: [] });
  });

  it('le mode infini joue la carte sans ses événements ni ses foules', () => {
    const niveau = niveauDynamique({
      evenements: [{ vague: 1, type: 'ouvrir_chemin', chemin: 1 }],
      cheminsFermes: [{ chemin: 1, repli: 0 }],
      mobiles: [1],
      foules: [{ cases: [{ cx: 5, cy: 3 }], condition: { type: 'payer', cout: 10 }, effet: { type: 'ralentir', rayon: 2, facteur: 0.5, duree: 2 }, recharge: 5 }],
    });
    const etat = creerPartie(niveau, { ...CONFIG, infini: { region: 1 } });
    expect(etat.dynamique.evenements).toEqual([]);
    expect(etat.dynamique.foules).toEqual([]);
    expect(etat.dynamique.cheminsActifs).toEqual([true, true]);
  });
});

describe('annonce puis déclenchement', () => {
  it('annonce l’événement quelques secondes avant, une seule fois, puis le déclenche au lancement de sa vague plus son délai', () => {
    const etat = partie({ evenements: [{ vague: 1, delai: 5, type: 'nasse', chemin: 0, debut: 10, longueur: 2, duree: 4 }] });
    const vus = suivre(etat, enPas(6));
    const annonces = vus.filter((v) => v.ev.type === 'annonce_evenement');
    const declenchements = vus.filter((v) => v.ev.type === 'evenement_niveau');
    expect(annonces.map((v) => v.pas)).toEqual([enPas(5) - ANNONCE]);
    expect(declenchements.map((v) => v.pas)).toEqual([enPas(5)]);
    expect(annonces[0]?.ev).toEqual({ type: 'annonce_evenement', index: 0, typeEvenement: 'nasse', chemin: 0, dans: EVENEMENTS_NIVEAU.annonce });
  });

  it('un événement d’une vague lancée plus tard part de ce lancement', () => {
    const etat = partie({ vagues: [{ paquets: [] }, VAGUE_LOINTAINE], evenements: [{ vague: 2, type: 'ouvrir_chemin', chemin: 1 }], cheminsFermes: [{ chemin: 1, repli: 0 }], mobiles: [1] });
    avancerSecondes(etat, 10);
    expect(etat.dynamique.evenements[0]?.pas).toBe(-1);
    const lancement = etat.pas;
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const vus = suivre(etat, ANNONCE + 2);
    expect(vus.find((v) => v.ev.type === 'annonce_evenement')?.pas).toBe(lancement);
    expect(vus.find((v) => v.ev.type === 'evenement_niveau')?.pas).toBe(lancement + ANNONCE);
  });
});

describe('charge', () => {
  const charge: EvenementNiveau = { vague: 1, type: 'charge', chemin: 1, ennemi: 'paysan_affame', nombre: 3, intervalle: 0.5, facteurVitesse: 2, duree: 3 };

  it('fait surgir le groupe sur son chemin, un ennemi par intervalle, en charge', () => {
    const etat = partie({ evenements: [charge] });
    suivre(etat, ANNONCE + enPas(1) + 1);
    const charges = etat.ennemis.filter((e) => e.chemin === 1);
    expect(charges).toHaveLength(3);
    for (const e of charges) {
      expect(e.chargeVitesse).toBe(2);
      expect(e.charge).toBeGreaterThan(0);
      expect(e.vague).toBe(0);
    }
  });

  it('les chargeurs vont plus vite que d’habitude, puis reprennent leur allure', () => {
    const etat = partie({ evenements: [{ ...charge, nombre: 1 }] });
    suivre(etat, ANNONCE + 1);
    const e = etat.ennemis.find((x) => x.chemin === 1);
    if (!e) throw new Error('pas de chargeur');
    const depart = e.distance;
    avancerSecondes(etat, 1);
    expect(e.distance - depart).toBeCloseTo(0.9 * 2, 1);
    avancerSecondes(etat, 3);
    expect(e.charge).toBe(0);
    const ensuite = e.distance;
    avancerSecondes(etat, 1);
    expect(e.distance - ensuite).toBeCloseTo(0.9, 1);
  });

  it('la victoire attend que la charge de la dernière vague soit passée', () => {
    const etat = partie({ vagues: [{ paquets: [] }], evenements: [{ ...charge, delai: 5 }] });
    avancerSecondes(etat, 4);
    expect(etat.statut).toBe('en_cours');
    avancerSecondes(etat, 60);
    expect(etat.statut).toBe('victoire');
    expect(etat.vies).toBe(etat.viesDepart - 3);
  });
});

describe('nasse', () => {
  const nasse: EvenementNiveau = { vague: 1, type: 'nasse', chemin: 0, debut: 6, longueur: 3, duree: 5 };

  it('les ennemis au sol s’arrêtent à l’entrée de la nasse tant qu’elle tient, puis repartent', () => {
    const etat = partie({ evenements: [nasse] });
    const e = marcheur(etat, 0, 0, 1);
    avancerSecondes(etat, 7.5);
    expect(e.distance).toBe(6);
    expect(etat.dynamique.barrages).toHaveLength(1);
    avancerSecondes(etat, 2.5);
    expect(etat.dynamique.barrages).toHaveLength(0);
    expect(e.distance).toBeGreaterThan(7);
  });

  it('ne retient ni un volant, ni un ennemi déjà entré dans la nasse ou passé, ni un autre chemin', () => {
    const etat = partie({ evenements: [nasse] });
    const volant = marcheur(etat, 0, 0, 1, true);
    const dedans = marcheur(etat, 0, 7, 1);
    const autre = marcheur(etat, 1, 0, 1);
    avancerSecondes(etat, 7.5);
    expect(volant.distance).toBeGreaterThan(7);
    expect(dedans.distance).toBeGreaterThan(14);
    expect(autre.distance).toBeGreaterThan(7);
  });

  it('les soldats et le héros ne peuvent pas y aller', () => {
    const etat = partie({ evenements: [nasse] });
    avancerSecondes(etat, 3.5);
    expect(validerAction(etat, { type: 'deplacerHeros', x: 7, y: 5 })).toBe('zone_bloquee');
    expect(validerAction(etat, { type: 'deplacerHeros', x: 15, y: 5 })).toBeNull();
    expect(appliquerAction(etat, { type: 'construire', tour: 'caserne', cx: 4, cy: 3 }).ok).toBe(true);
    expect(validerAction(etat, { type: 'deplacerRalliement', cx: 4, cy: 3, x: 8, y: 5 })).toBe('zone_bloquee');
    avancerSecondes(etat, 6);
    expect(validerAction(etat, { type: 'deplacerHeros', x: 7, y: 5 })).toBeNull();
  });

  it('émet le début et la fin de la coupure', () => {
    const etat = partie({ evenements: [nasse] });
    const vus = suivre(etat, enPas(9));
    expect(vus.filter((v) => v.ev.type === 'barrage').map((v) => v.pas)).toEqual([ANNONCE]);
    expect(vus.filter((v) => v.ev.type === 'barrage_fin').map((v) => v.pas)).toEqual([ANNONCE + enPas(5)]);
  });
});

describe('canon à eau', () => {
  it('repousse et étourdit les unités de la ligne balayée, pas les autres', () => {
    const etat = partie({
      evenements: [
        { vague: 1, type: 'canon_a_eau', cy: 8, sens: -1, recul: 3, etourdissement: 2 },
        { vague: 1, delai: 6, type: 'canon_a_eau', cy: 2, recul: 3, etourdissement: 2 },
      ],
    });
    const h = heros(etat);
    const vus = suivre(etat, ANNONCE + 1);
    expect(h.x).toBeCloseTo(25, 5);
    expect(h.etourdi).toBeGreaterThan(0);
    expect(vus.some((v) => v.ev.type === 'balayage' && v.ev.cy === 8 && v.ev.unites === 1)).toBe(true);
    avancerSecondes(etat, 2);
    const x = h.x;
    const y = h.y;
    suivre(etat, ANNONCE + 2);
    // Le second balayage passe sur la ligne 2 : le héros, revenu vers son poste en bas, n'est pas touché.
    expect(Math.abs(h.y - y)).toBeLessThan(1);
    expect(h.x).toBeGreaterThanOrEqual(x - 0.01);
  });
});

describe('renforts', () => {
  it('des unités alliées apparaissent au point donné et tiennent le temps donné', () => {
    const etat = partie({ evenements: [{ vague: 1, type: 'renforts', x: 10, y: 5, nombre: 3, duree: 4, unite: 'etudiant' }] });
    suivre(etat, ANNONCE + 1);
    const renforts = etat.unites.filter((u) => u.genre === 'renfort');
    expect(renforts).toHaveLength(3);
    for (const u of renforts) {
      expect(Math.abs(u.x - 10)).toBeLessThan(1);
      expect(Math.abs(u.y - 5)).toBeLessThan(1);
      expect(u.stats.nom).toBe('unite.etudiant');
    }
    avancerSecondes(etat, 4.1);
    expect(etat.unites.filter((u) => u.genre === 'renfort')).toHaveLength(0);
  });
});

describe('carte qui bouge', () => {
  /** Une vague d'un paysan sur le chemin donné, `delai` s après son lancement. */
  const paysan = (chemin: number, delai: number): Vague => ({ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 0, chemin, delai }] });

  it('ouvrir un chemin : avant, ses groupes prennent le repli et ses cases se bâtissent ; après, il sert, ses cases sont interdites et la tour posée dessus est vendue au prix total', () => {
    const etat = partie({
      vagues: [paysan(1, 1), paysan(1, 5), VAGUE_LOINTAINE],
      evenements: [{ vague: 2, type: 'ouvrir_chemin', chemin: 1 }],
      cheminsFermes: [{ chemin: 1, repli: 0 }],
      mobiles: [1],
    });
    expect(etat.dynamique.cheminsActifs).toEqual([true, false]);
    expect(appliquerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 }).ok).toBe(true);
    expect(appliquerAction(etat, { type: 'ameliorer', cx: 4, cy: 6 }).ok).toBe(true);
    const tour = etat.tours[0];
    if (!tour) throw new Error('pas de tour');
    const cout = tour.coutCumule;
    avancerSecondes(etat, 1.5);
    expect(etat.ennemis[0]?.chemin).toBe(0);
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const aretes = etat.aretes;
    const vus = suivre(etat, ANNONCE + 1);
    expect(etat.dynamique.cheminsActifs).toEqual([true, true]);
    expect(etat.tours).toHaveLength(0);
    const vente = vus.find((v) => v.ev.type === 'vente_office')?.ev;
    expect(vente).toEqual({ type: 'vente_office', tour: tour.id, cx: 4, cy: 6, place: -1, x: tour.x, y: tour.y, aretes: cout });
    expect(vus.some((v) => v.ev.type === 'chemin_ouvert' && v.ev.chemin === 1)).toBe(true);
    expect(etat.aretes).toBe(aretes + cout);
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 })).toBe('case_interdite');
    avancerSecondes(etat, 2.5);
    expect(etat.ennemis.filter((e) => e.chemin === 1)).toHaveLength(1);
  });

  it('fermer un chemin : ses cases se libèrent, ses groupes prennent le repli, ceux qui y marchent déjà vont au bout', () => {
    const etat = partie({ vagues: [paysan(1, 5), VAGUE_LOINTAINE], evenements: [{ vague: 1, type: 'fermer_chemin', chemin: 1, repli: 0 }], mobiles: [1] });
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 })).toBe('case_interdite');
    const engage = marcheur(etat, 1, 2, 1);
    const vus = suivre(etat, ANNONCE + 1);
    expect(vus.some((v) => v.ev.type === 'chemin_ferme' && v.ev.chemin === 1)).toBe(true);
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 })).toBeNull();
    avancerSecondes(etat, 2.5);
    const venus = etat.ennemis.filter((e) => e !== engage);
    expect(venus.map((e) => e.chemin)).toEqual([0]);
    expect(engage.chemin).toBe(1);
    expect(engage.distance).toBeGreaterThan(6);
  });
});
