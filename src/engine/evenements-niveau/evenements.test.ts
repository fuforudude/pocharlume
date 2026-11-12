import { describe, expect, it } from 'vitest';
import { EVENEMENTS_NIVEAU } from '../../data/evenements-niveau';
import { CONFIG, VAGUE_LOINTAINE, avancerSecondes, ennemiEssai, heros } from '../aides.test-utils';
import type { EvenementNiveau, Niveau, Vague } from '../definitions';
import { ajouterEnnemi } from '../ennemis';
import type { EtatPartie } from '../etat';
import type { Evenement } from '../evenements';
import { appliquerAction, creerPartie, step, validerAction } from '../partie';
import { cheminEffectif } from './chemins-mobiles';
import { repartirEvenementsFer } from './index';
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

  it('ouvrir un chemin : avant, ses groupes prennent le repli ; après, il sert ; ses cases sont interdites à la construction avant comme après, sans rien vendre', () => {
    const etat = partie({
      vagues: [paysan(1, 1), paysan(1, 5), VAGUE_LOINTAINE],
      evenements: [{ vague: 2, type: 'ouvrir_chemin', chemin: 1 }],
      cheminsFermes: [{ chemin: 1, repli: 0 }],
      mobiles: [1],
    });
    expect(etat.dynamique.cheminsActifs).toEqual([true, false]);
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 })).toBe('case_interdite');
    avancerSecondes(etat, 1.5);
    expect(etat.ennemis[0]?.chemin).toBe(0);
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const vus = suivre(etat, ANNONCE + 1);
    expect(etat.dynamique.cheminsActifs).toEqual([true, true]);
    expect(vus.some((v) => v.ev.type === 'chemin_ouvert' && v.ev.chemin === 1)).toBe(true);
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 })).toBe('case_interdite');
    avancerSecondes(etat, 2.5);
    expect(etat.ennemis.filter((e) => e.chemin === 1)).toHaveLength(1);
  });

  it('fermer un chemin : ses cases restent interdites, ses groupes prennent le repli, ceux qui y marchent déjà vont au bout', () => {
    const etat = partie({ vagues: [paysan(1, 5), VAGUE_LOINTAINE], evenements: [{ vague: 1, type: 'fermer_chemin', chemin: 1, repli: 0 }], mobiles: [1] });
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 })).toBe('case_interdite');
    const engage = marcheur(etat, 1, 2, 1);
    const vus = suivre(etat, ANNONCE + 1);
    expect(vus.some((v) => v.ev.type === 'chemin_ferme' && v.ev.chemin === 1)).toBe(true);
    // Les cases d'un chemin mobile restent interdites une fois le chemin fermé.
    expect(validerAction(etat, { type: 'construire', tour: 'tir', cx: 4, cy: 6 })).toBe('case_interdite');
    avancerSecondes(etat, 2.5);
    const venus = etat.ennemis.filter((e) => e !== engage);
    expect(venus.map((e) => e.chemin)).toEqual([0]);
    expect(engage.chemin).toBe(1);
    expect(engage.distance).toBeGreaterThan(6);
  });
});

describe('appel de la vague suivante en avance : rattrapage des événements de chemin', () => {
  const paysan = (delai: number): Vague => ({ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 0, chemin: 1, delai }] });
  /** Chemin 0 fermé au départ ; la vague 1 l'ouvre à 20 s, la vague 2 ferme le chemin 1 trois secondes après son lancement. */
  function etatRelecture(): EtatPartie {
    return creerPartie(
      niveauDynamique({
        mobiles: [0, 1],
        vagues: [paysan(1), paysan(1), VAGUE_LOINTAINE],
        cheminsFermes: [{ chemin: 0, repli: 1 }],
        evenements: [
          { vague: 1, delai: 20, type: 'ouvrir_chemin', chemin: 0 },
          { vague: 1, delai: 25, type: 'renforts', x: 10, y: 5, nombre: 1, duree: 3, unite: 'etudiant' },
          { vague: 2, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
        ],
      }),
      CONFIG,
    );
  }

  it('l’ouverture de la vague 1, encore en attente, part aussitôt, avant la fermeture de la vague 2 ; jamais tous les chemins fermés', () => {
    const etat = etatRelecture();
    const verifier = (): void => {
      expect(etat.dynamique.cheminsActifs.some((a) => a)).toBe(true);
    };
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    // La vague 1 a fini d'apparaître (1 s), bien avant l'ouverture prévue à 20 s.
    while (validerAction(etat, { type: 'appelerVague' }) !== null) {
      step(etat);
      verifier();
    }
    expect(etat.pas).toBeLessThan(enPas(20));
    expect(etat.dynamique.cheminsActifs).toEqual([false, true]);
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    // Tout de suite : annonce puis événement, dans l'ordre, et le chemin est ouvert.
    const types = etat.evenements.filter((ev) => ev.type === 'annonce_evenement' || ev.type === 'evenement_niveau' || ev.type === 'chemin_ouvert').map((ev) => ev.type);
    expect(types).toEqual(['annonce_evenement', 'evenement_niveau', 'chemin_ouvert']);
    expect(etat.dynamique.cheminsActifs).toEqual([true, true]);
    // Les autres types gardent leur comportement : les renforts de la vague 1 attendent leur délai.
    expect(etat.dynamique.evenements[1]?.fini).toBe(false);
    const ordre: number[] = [];
    for (let i = 0; i < enPas(40); i++) {
      step(etat);
      for (const ev of etat.evenements) if (ev.type === 'evenement_niveau') ordre.push(ev.index);
      verifier();
    }
    // L'ouverture (déjà jouée à l'appel, la liste du pas la garde encore au premier pas), puis la fermeture de la vague 2 (3 s après son
    // appel), puis les renforts de la vague 1 (25 s) : le rattrapage ne touche pas aux autres types.
    expect(ordre).toEqual([0, 2, 1]);
    expect(etat.dynamique.cheminsActifs).toEqual([true, false]);
  });
});

describe('chemins fermés : garde-fous', () => {
  const creer = (o: OptionsNiveauDynamique): (() => EtatPartie) => () => creerPartie(niveauDynamique(o), CONFIG);

  it('refuse des replis qui bouclent, au départ comme au fil des événements', () => {
    expect(creer({ mobiles: [0, 1], cheminsFermes: [{ chemin: 0, repli: 1 }, { chemin: 1, repli: 0 }] })).toThrow(/aucun chemin ouvert/);
    expect(creer({ mobiles: [0, 1], cheminsFermes: [{ chemin: 0, repli: 1 }], evenements: [{ vague: 1, type: 'fermer_chemin', chemin: 1, repli: 0 }] })).toThrow(/aucun chemin ouvert/);
  });

  it('accepte un chemin qui se ferme puis un autre, tant qu’il en reste un ouvert au bout des replis', () => {
    expect(
      creer({
        mobiles: [0, 1],
        evenements: [
          { vague: 1, type: 'fermer_chemin', chemin: 0, repli: 1 },
          { vague: 2, type: 'ouvrir_chemin', chemin: 0 },
          { vague: 2, delai: 8, type: 'fermer_chemin', chemin: 1, repli: 0 },
        ],
      }),
    ).not.toThrow();
  });

  it('jamais d’ennemi sur un chemin fermé tant qu’un autre est ouvert, même si les replis sont incohérents', () => {
    const etat = creerPartie(niveauDynamique(), CONFIG);
    etat.dynamique.cheminsActifs = [false, true];
    etat.dynamique.replis = [-1, -1];
    expect(cheminEffectif(etat, 0)).toBe(1);
    etat.dynamique.cheminsActifs = [false, false];
    etat.dynamique.replis = [1, 0];
    expect(cheminEffectif(etat, 0)).toBe(0);
    etat.dynamique.cheminsActifs = [false, true];
    etat.dynamique.replis = [1, 0];
    expect(cheminEffectif(etat, 0)).toBe(1);
  });
});

describe('annonce du chemin réellement pris', () => {
  it('une charge sur un chemin fermé est annoncée sur son repli, et sort par le repli', () => {
    const etat = partie({
      mobiles: [1],
      cheminsFermes: [{ chemin: 1, repli: 0 }],
      evenements: [{ vague: 1, type: 'charge', chemin: 1, ennemi: 'paysan_affame', nombre: 1, intervalle: 0.5, facteurVitesse: 2, duree: 3 }],
    });
    const vus = suivre(etat, ANNONCE + 2);
    expect(vus.find((v) => v.ev.type === 'annonce_evenement')?.ev).toMatchObject({ type: 'annonce_evenement', chemin: 0 });
    expect(vus.find((v) => v.ev.type === 'evenement_niveau')?.ev).toMatchObject({ type: 'evenement_niveau', chemin: 0 });
    expect(etat.ennemis.length).toBeGreaterThan(0);
    expect(etat.ennemis.every((e) => e.chemin === 0)).toBe(true);
  });

  it('une nasse garde son chemin, et un chemin qui s’ouvre est annoncé sous son propre numéro', () => {
    const etat = partie({
      mobiles: [1],
      cheminsFermes: [{ chemin: 1, repli: 0 }],
      evenements: [{ vague: 1, type: 'ouvrir_chemin', chemin: 1 }, { vague: 1, delai: 5, type: 'nasse', chemin: 1, debut: 6, longueur: 2, duree: 3 }],
    });
    const chemins = suivre(etat, enPas(6)).flatMap((v) => (v.ev.type === 'annonce_evenement' ? [v.ev.chemin] : []));
    expect(chemins).toEqual([1, 1]);
  });
});

describe('défi Fer : tous les événements sont joués pendant la vague unique', () => {
  /** Trois vagues d'un groupe de paysans étalé dans le temps, un événement par vague (le premier avec un délai propre). */
  function niveauFer(): Niveau {
    const vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 3, intervalle: 10, chemin: 0, delai: 0 }] };
    return {
      ...niveauDynamique({
        vagues: [vague, vague, vague],
        evenements: [
          { vague: 1, delai: 5, type: 'nasse', chemin: 0, debut: 6, longueur: 2, duree: 3 },
          { vague: 2, type: 'canon_a_eau', cy: 2, recul: 1, etourdissement: 1 },
          { vague: 3, type: 'renforts', x: 10, y: 5, nombre: 1, duree: 3, unite: 'etudiant' },
        ],
      }),
      defiFer: { familles: ['tir', 'magie'] },
    };
  }
  const CONFIG_FER = { ...CONFIG, defi: 'fer' as const };

  it('passe tous les événements à la vague 1, répartis selon le rang de leur vague d’origine', () => {
    const etat = creerPartie(niveauFer(), CONFIG_FER);
    expect(etat.niveau.vagues).toHaveLength(1);
    const evenements = etat.niveau.evenements ?? [];
    expect(evenements.map((e) => e.vague)).toEqual([1, 1, 1]);
    const delais = evenements.map((e) => e.delai ?? 0);
    const duree = Math.max(...(etat.niveau.vagues[0]?.paquets ?? []).map((p) => p.delai + p.intervalle * (p.nombre - 1)));
    expect(duree).toBeGreaterThan(5);
    expect(delais[0]).toBeCloseTo(5, 5);
    expect(delais[1]).toBeCloseTo(Math.round(((duree * 1) / 3 + EVENEMENTS_NIVEAU.annonce) * 10) / 10, 5);
    expect(delais[2]).toBeCloseTo(Math.round(((duree * 2) / 3 + EVENEMENTS_NIVEAU.annonce) * 10) / 10, 5);
    expect(delais[0]).toBeLessThan(delais[1] ?? 0);
    expect(delais[1]).toBeLessThan(delais[2] ?? 0);
    for (const d of delais) expect(d).toBeGreaterThanOrEqual(EVENEMENTS_NIVEAU.annonce);
    // Le niveau d'origine n'est pas modifié, et sans défi Fer rien ne change.
    expect(niveauFer().evenements?.map((e) => e.vague)).toEqual([1, 2, 3]);
    expect(creerPartie(niveauFer(), CONFIG).niveau.evenements?.map((e) => e.vague)).toEqual([1, 2, 3]);
  });

  it('joue bien les trois événements, dans l’ordre des vagues, pendant la partie', () => {
    const etat = creerPartie(niveauFer(), CONFIG_FER);
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const ordre: number[] = [];
    for (let i = 0; i < 30 * 120 && ordre.length < 3; i++) {
      step(etat);
      for (const ev of etat.evenements) if (ev.type === 'evenement_niveau') ordre.push(ev.index);
    }
    expect(ordre).toEqual([0, 1, 2]);
  });
});

describe('défi Fer : bornes et ordre de la répartition', () => {
  const renforts = (vague: number, delai?: number): EvenementNiveau => ({ vague, ...(delai !== undefined ? { delai } : {}), type: 'renforts', x: 10, y: 5, nombre: 1, duree: 3, unite: 'etudiant' });

  it('aucun événement ne tombe après la dernière apparition, même quand l’arrondi au dixième dépasserait la durée', () => {
    // Durée 12,36 s : 6,18 + 12,3 = 18,48 est borné à 12,36, que l'arrondi seul aurait porté à 12,4.
    const [e] = repartirEvenementsFer([renforts(2, 12.3)], 2, 12.36);
    expect(e?.delai).toBeLessThanOrEqual(12.36);
    expect(e?.delai).toBeGreaterThanOrEqual(12.3);
    for (const d of repartirEvenementsFer([renforts(1, 12.3), renforts(2, 12.34), renforts(3)], 3, 12.36).map((x) => x.delai ?? 0)) expect(d).toBeLessThanOrEqual(12.36);
  });

  it('un événement placé plus tard dans le niveau ne passe jamais avant un événement placé plus tôt', () => {
    // Vague 1 au délai 20 et vague 2 au délai 3, sur 30 s : brut 20 et 13 ; l'ordre d'origine impose 20 et 20.
    const delais = repartirEvenementsFer([renforts(1, 20), renforts(2, 3)], 3, 30).map((e) => e.delai ?? 0);
    expect(delais).toEqual([20, 20]);
    // Dans les données en désordre (vague 2 écrite avant), c'est l'ordre (vague, délai) qui compte, pas celui du tableau.
    expect(repartirEvenementsFer([renforts(2, 3), renforts(1, 20)], 3, 30).map((e) => e.delai ?? 0)).toEqual([20, 20]);
    // À vague et délai égaux, l'ordre des données est gardé.
    const egaux = repartirEvenementsFer([renforts(1, 5), renforts(1, 5), renforts(1, 8)], 2, 30).map((e) => e.delai ?? 0);
    expect(egaux).toEqual([5, 5, 8]);
  });

  it('le scénario de la relecture : l’ouverture passe avant la fermeture, sans chemin fermé en même temps', () => {
    const vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 4, intervalle: 10, chemin: 0, delai: 0 }] };
    const niveau: Niveau = {
      ...niveauDynamique({
        mobiles: [0, 1],
        vagues: [vague, vague, vague],
        cheminsFermes: [{ chemin: 0, repli: 1 }],
        evenements: [
          { vague: 1, delai: 20, type: 'ouvrir_chemin', chemin: 0 },
          { vague: 2, delai: 3, type: 'fermer_chemin', chemin: 1, repli: 0 },
        ],
      }),
      defiFer: { familles: ['tir', 'magie'] },
    };
    const etat = creerPartie(niveau, { ...CONFIG, defi: 'fer' as const });
    const [ouvrir, fermer] = etat.niveau.evenements ?? [];
    expect(ouvrir?.type).toBe('ouvrir_chemin');
    expect(fermer?.type).toBe('fermer_chemin');
    expect(ouvrir?.delai ?? 0).toBeLessThanOrEqual(fermer?.delai ?? 0);
    expect(appliquerAction(etat, { type: 'appelerVague' }).ok).toBe(true);
    const ordre: number[] = [];
    for (let i = 0; i < 40 * 120 && ordre.length < 2; i++) {
      step(etat);
      for (const ev of etat.evenements) if (ev.type === 'evenement_niveau') ordre.push(ev.index);
      // Jamais les deux chemins fermés à la fois, à chaque pas (pas seulement à la fin).
      expect(etat.dynamique.cheminsActifs.some((a) => a)).toBe(true);
    }
    expect(ordre).toEqual([0, 1]);
    expect(etat.dynamique.cheminsActifs).toEqual([true, false]);
  });

  it('un niveau dont les événements ne sont pas écrits dans l’ordre (vague, délai) est refusé, même en défi Fer', () => {
    const vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 4, intervalle: 10, chemin: 0, delai: 0 }] };
    // Le scénario de la relecture : fermer 1 (vague 2, délai 4), ouvrir 0 (vague 2, délai 3), fermer 0 (vague 1, délai 20).
    const niveau: Niveau = {
      ...niveauDynamique({
        mobiles: [0, 1],
        vagues: [vague, vague, vague],
        evenements: [
          { vague: 2, delai: 4, type: 'fermer_chemin', chemin: 1, repli: 0 },
          { vague: 2, delai: 3, type: 'ouvrir_chemin', chemin: 0 },
          { vague: 1, delai: 20, type: 'fermer_chemin', chemin: 0, repli: 1 },
        ],
      }),
      defiFer: { familles: ['tir', 'magie'] },
    };
    expect(() => creerPartie(niveau, { ...CONFIG, defi: 'fer' as const })).toThrow(/ordre/);
    expect(() => creerPartie(niveau, CONFIG)).toThrow(/ordre/);
  });

  it('une durée de la vague Fer comptée en pas : aucun événement après la dernière apparition réelle', () => {
    // 11 ennemis toutes les 0,41 s : le moteur compte 12 pas par intervalle, la dernière apparition tombe au pas 120 (4 s) et non à 4,1 s.
    const vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 11, intervalle: 0.41, chemin: 0, delai: 0 }] };
    const niveau: Niveau = {
      ...niveauDynamique({ vagues: [vague], evenements: [{ vague: 1, delai: 10, type: 'renforts', x: 10, y: 5, nombre: 1, duree: 3, unite: 'etudiant' }] }),
      defiFer: { familles: ['tir', 'magie'], facteurEffectifs: 1 },
    };
    const etat = creerPartie(niveau, { ...CONFIG, defi: 'fer' as const });
    expect(enPas(etat.niveau.evenements?.[0]?.delai ?? 0)).toBeLessThanOrEqual(120);
  });
});
