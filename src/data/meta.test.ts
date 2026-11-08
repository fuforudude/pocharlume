import { describe, expect, it } from 'vitest';
import { INFINI } from './infini';
import {
  AVATARS,
  aretesDeVictoire,
  BONUS_FAMILIER_POURCENT,
  BONUS_SKIN_POURCENT,
  bonusEnEntiers,
  braisesDeVictoire,
  BRAISES_DEFI,
  BRANCHES_ARBRE,
  CAISSES_AVANT_GARANTIE,
  CHANCES_RARETE,
  coutCumuleArbre,
  coutRangArbre,
  coutRangEclats,
  DISCIPLES_OFFERTS,
  dieuDuHeros,
  ECLATS_DOUBLON,
  estIdDefi,
  braisesDeDefi,
  BRAISES_APRES_HISTOIRE,
  estApresHistoire,
  estFinDeBloc,
  estNiveauBoss,
  NIVEAU_FIN_CAMPAGNE,
  NIVEAU_MAX,
  NOMBRE_REGIONS,
  NOMBRE_REGIONS_HISTOIRE,
  NOMBRE_REGIONS_INFINI,
  estRarete,
  estTypeCaisse,
  HEROS_PAR_DIEU,
  IDS_DEFIS,
  IDS_DIEUX,
  IDS_HEROS,
  IDS_OBJETS,
  NIVEAUX_DISCIPLE_OFFERT,
  OBJETS,
  PLAFOND_BONUS_ENTIERS,
  PLAFOND_BONUS_POURCENT,
  PRIX_CAISSE,
  PRIX_DISCIPLE,
  PRIX_ECLATS_OBJET,
  RANG_MAX_ARBRE,
  RANG_MAX_COLLECTION,
  RARETE_GARANTIE,
  RARETES,
  regionDuNiveau,
  regionOuverte,
  TYPES_CAISSE,
  xpDePartie,
} from './meta';

describe('ids de la méta-progression', () => {
  it('3 dieux, 9 héros (3 par dieu, l’avatar d’abord), sans doublon', () => {
    expect(IDS_DIEUX).toEqual(['plume', 'charlie', 'pollen']);
    expect(new Set(IDS_HEROS).size).toBe(9);
    for (const dieu of IDS_DIEUX) {
      expect(HEROS_PAR_DIEU[dieu]).toHaveLength(3);
      expect(HEROS_PAR_DIEU[dieu][0]).toBe(dieu);
    }
    expect([...IDS_DIEUX.flatMap((d) => HEROS_PAR_DIEU[d])].sort()).toEqual([...IDS_HEROS].sort());
    expect(AVATARS).toEqual(['plume', 'charlie', 'pollen']);
    expect(dieuDuHeros('brise_os')).toBe('charlie');
    expect(dieuDuHeros('lanterne')).toBe('pollen');
  });

  it('6 branches de 5 rangs, le rang n coûte n étoiles', () => {
    expect(BRANCHES_ARBRE).toEqual(['caserne', 'tir', 'magie', 'artillerie', 'sorts', 'heros']);
    expect(RANG_MAX_ARBRE).toBe(5);
    expect([1, 2, 3, 4, 5].map(coutRangArbre)).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 5].map(coutCumuleArbre)).toEqual([1, 3, 6, 10, 15]);
  });

  it('4 objets aux prix du cahier des charges', () => {
    expect(IDS_OBJETS).toEqual(['fiole_soufre', 'herbe_sabbat', 'griffe_renfort', 'sablier']);
    expect(IDS_OBJETS.map((o) => OBJETS[o].prix)).toEqual([60, 80, 60, 100]);
  });
});

describe('gains', () => {
  it('arêtes : 30 + 6 × N + 15 par étoile nouvelle, sinon 10 + 2 × N', () => {
    expect(aretesDeVictoire(1, 3)).toBe(30 + 6 + 45);
    expect(aretesDeVictoire(10, 1)).toBe(30 + 60 + 15);
    expect(aretesDeVictoire(1, 0)).toBe(12);
    expect(aretesDeVictoire(10, 0)).toBe(30);
  });

  it('braises : 5 à la première victoire d’un niveau, 10 de plus pour un boss, 2 aux premières 3 étoiles', () => {
    expect(braisesDeVictoire(10, true, false)).toBe(15);
    expect(braisesDeVictoire(10, true, true)).toBe(17);
    expect(braisesDeVictoire(10, false, false)).toBe(0);
    expect(braisesDeVictoire(10, false, true)).toBe(2);
    expect(braisesDeVictoire(5, true, false)).toBe(5);
    expect(braisesDeVictoire(5, true, true)).toBe(7);
    expect(braisesDeVictoire(5, false, false)).toBe(0);
    expect(braisesDeVictoire(20, true, false)).toBe(15);
  });

  it('braises après l’histoire : 15 la première victoire, +30 au 5e niveau du bloc, +6 aux premières 3 étoiles', () => {
    expect(braisesDeVictoire(101, true, false)).toBe(BRAISES_APRES_HISTOIRE.premiereVictoire);
    expect(braisesDeVictoire(101, true, false)).toBe(15);
    expect(braisesDeVictoire(101, true, true)).toBe(21);
    expect(braisesDeVictoire(101, false, true)).toBe(6);
    expect(braisesDeVictoire(101, false, false)).toBe(0);
    // 105 et 110 sont les 5es niveaux de leur bloc : +30, à la place du bonus de boss (le 110 est aussi un boss).
    expect(braisesDeVictoire(105, true, false)).toBe(45);
    expect(braisesDeVictoire(110, true, false)).toBe(45);
    expect(braisesDeVictoire(110, true, true)).toBe(51);
    expect(braisesDeVictoire(110, false, false)).toBe(0);
    expect(braisesDeVictoire(150, true, false)).toBe(45);
    expect(braisesDeVictoire(106, true, false)).toBe(15);
    // Les niveaux 1 à 100 ne changent pas.
    expect(braisesDeVictoire(50, true, false)).toBe(15);
    expect(braisesDeVictoire(50, true, true)).toBe(17);
    expect(braisesDeVictoire(45, true, false)).toBe(5);
    expect(braisesDeVictoire(100, true, false)).toBe(15);
    expect(braisesDeVictoire(100, true, true)).toBe(17);
    expect(braisesDeVictoire(95, true, false)).toBe(5);
  });

  it('braises de la première réussite d’un défi : 4 jusqu’au niveau 100, 12 ensuite', () => {
    expect([1, 50, 100].map(braisesDeDefi)).toEqual([4, 4, 4]);
    expect([101, 110, 150].map(braisesDeDefi)).toEqual([12, 12, 12]);
  });

  it('un tour complet des niveaux 101 à 150 rapporte 50 × 15 + 10 × 30 + 50 × 6 de braises avant les défis', () => {
    let total = 0;
    for (let n = 101; n <= 150; n++) total += braisesDeVictoire(n, true, true);
    expect(total).toBe(50 * 15 + 10 * 30 + 50 * 6);
  });

  it('la région 1 rapporte 80 braises au plus (50 + 10 + 20), soit deux disciples à 30', () => {
    let total = 0;
    for (let n = 1; n <= 10; n++) total += braisesDeVictoire(n, true, true);
    expect(total).toBe(80);
    expect(Math.floor(total / PRIX_DISCIPLE)).toBe(2);
  });

  it('les boss sont les niveaux 10, 20, … 100', () => {
    expect([1, 9, 10, 11, 20, 99, 100].map(estNiveauBoss)).toEqual([false, false, true, false, true, false, true]);
    expect(estNiveauBoss(0)).toBe(false);
    expect(estNiveauBoss(10.5)).toBe(false);
  });

  it('expérience : 100 + 20 × N, la moitié en cas de défaite, toujours entière', () => {
    expect(xpDePartie(1, true)).toBe(120);
    expect(xpDePartie(1, false)).toBe(60);
    for (let n = 1; n <= 100; n++) expect(Number.isInteger(xpDePartie(n, false))).toBe(true);
  });
});

describe('régions, défis et disciples offerts', () => {
  it('15 régions de 10 niveaux, 150 niveaux ; la fin de l’histoire reste le niveau 100', () => {
    expect([NOMBRE_REGIONS, NOMBRE_REGIONS_HISTOIRE, NIVEAU_MAX, NIVEAU_FIN_CAMPAGNE, NOMBRE_REGIONS_INFINI]).toEqual([15, 10, 150, 100, 11]);
    // La sauvegarde (validation.ts) borne la région d'infini par NOMBRE_REGIONS_INFINI, le moteur (config.ts) par INFINI.regions : mêmes bornes.
    expect(NOMBRE_REGIONS_INFINI).toBe(INFINI.regions.length);
    expect([100, 101, 150, 151, 0].map(estApresHistoire)).toEqual([false, true, true, false, false]);
    expect([101, 104, 105, 110, 150].map(estFinDeBloc)).toEqual([false, false, true, true, true]);
    expect([95, 100].map(estFinDeBloc)).toEqual([false, false]);
  });

  it('la région r + 1 s’ouvre quand le boss de la région r est battu, jusqu’à la région 15', () => {
    expect([0, 1, 10, 11, 20, 50, 100, 101, 150, 151, 1.5].map(regionDuNiveau)).toEqual([0, 1, 1, 2, 2, 5, 10, 11, 15, 0, 0]);
    // Gagner le niveau 100 débloque le 101 : la région 11 s'ouvre. Le niveau 150 est le dernier : la région 15 est la plus haute.
    expect([100, 101, 110, 111, 141, 150].map(regionOuverte)).toEqual([10, 11, 11, 12, 15, 15]);
    // niveauMax passe à 11 quand le niveau 10 (le boss) est gagné.
    expect([1, 9, 10, 11, 20, 21, 50, 51, 100].map(regionOuverte)).toEqual([1, 1, 1, 2, 2, 3, 5, 6, 10]);
  });

  it('la région d’un niveau d’avant l’après-histoire n’a pas changé', () => {
    expect(Array.from({ length: 100 }, (_, i) => regionDuNiveau(i + 1))).toEqual(Array.from({ length: 100 }, (_, i) => Math.floor(i / 10) + 1));
  });

  it('deux défis, 4 braises la première réussite', () => {
    expect(IDS_DEFIS).toEqual(['heroique', 'fer']);
    expect(BRAISES_DEFI).toBe(4);
    expect(['heroique', 'fer', 'Fer', 'constructor', 3].map(estIdDefi)).toEqual([true, true, false, false, false]);
  });

  it('disciples offerts aux boss des régions 2, 4, 6 et 8, dans l’ordre Suie, Mastoc, Rouage, Corbeau, Brise-Os, Lanterne', () => {
    expect(NIVEAUX_DISCIPLE_OFFERT).toEqual([20, 40, 60, 80]);
    expect(DISCIPLES_OFFERTS).toEqual(['suie', 'mastoc', 'rouage', 'corbeau', 'brise_os', 'lanterne']);
    // Ce sont les six disciples, ni plus ni moins.
    expect([...DISCIPLES_OFFERTS].sort()).toEqual(IDS_HEROS.filter((h) => !AVATARS.includes(h)).sort());
  });
});

describe('caisses et collection', () => {
  it('une caisse coûte 20 braises ; deux types', () => {
    expect(PRIX_CAISSE).toBe(20);
    expect(TYPES_CAISSE).toEqual(['skins', 'familiers']);
    expect(['skins', 'familiers', 'autre', 'constructor'].map(estTypeCaisse)).toEqual([true, true, false, false]);
  });

  it('chances 60 / 25 / 10 / 4 / 1 : cinq raretés, 100 % en tout', () => {
    expect(RARETES.map((r) => CHANCES_RARETE[r])).toEqual([60, 25, 10, 4, 1]);
    expect(RARETES.reduce((somme, r) => somme + CHANCES_RARETE[r], 0)).toBe(100);
    expect(RARETE_GARANTIE).toBe('epique');
    expect(CAISSES_AVANT_GARANTIE).toBe(10);
    expect(['commun', 'mythique', 'divin', 'toString'].map(estRarete)).toEqual([true, true, false, false]);
  });

  it('éclats des doublons 5 / 10 / 25 / 60 / 150 et achat précis 50 / 120 / 300 / 700 / 1500', () => {
    expect(RARETES.map((r) => ECLATS_DOUBLON[r])).toEqual([5, 10, 25, 60, 150]);
    expect(RARETES.map((r) => PRIX_ECLATS_OBJET[r])).toEqual([50, 120, 300, 700, 1500]);
  });

  it('5 rangs : passer du rang r au rang r + 1 coûte 20 × r éclats', () => {
    expect(RANG_MAX_COLLECTION).toBe(5);
    expect([1, 2, 3, 4].map(coutRangEclats)).toEqual([20, 40, 60, 80]);
  });

  it('bonus de base : skin +1 à +5 %, familier +1 / 1,5 / 2 / 3 / 4 %, plafond +10 %', () => {
    expect(RARETES.map((r) => BONUS_SKIN_POURCENT[r])).toEqual([1, 2, 3, 4, 5]);
    expect(RARETES.map((r) => BONUS_FAMILIER_POURCENT[r])).toEqual([1, 1.5, 2, 3, 4]);
    expect(PLAFOND_BONUS_POURCENT).toBe(10);
    expect(PLAFOND_BONUS_ENTIERS).toBe(10_000);
  });

  it('multiplicateur de rang 1 + 0,25 × (rang − 1), en entiers exacts', () => {
    // Un bonus de base de 2 % (2 000 en 1/100 000) : 2 ; 2,5 ; 3 ; 3,5 ; 4 %.
    expect([1, 2, 3, 4, 5].map((rang) => bonusEnEntiers(2, rang))).toEqual([2000, 2500, 3000, 3500, 4000]);
    // Un familier Rare (1,5 %) au rang 2 : 1,875 %.
    expect(bonusEnEntiers(1.5, 2)).toBe(1875);
    // Le plus fort skin (Mythique, rang 5) atteint exactement le plafond.
    expect(bonusEnEntiers(BONUS_SKIN_POURCENT.mythique, RANG_MAX_COLLECTION)).toBe(PLAFOND_BONUS_ENTIERS);
    for (const rarete of RARETES) {
      for (let rang = 1; rang <= RANG_MAX_COLLECTION; rang++) {
        expect(Number.isInteger(bonusEnEntiers(BONUS_SKIN_POURCENT[rarete], rang))).toBe(true);
        expect(Number.isInteger(bonusEnEntiers(BONUS_FAMILIER_POURCENT[rarete], rang))).toBe(true);
      }
    }
  });
});
