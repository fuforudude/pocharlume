import { describe, expect, it } from 'vitest';
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
  estNiveauBoss,
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
  it('10 régions de 10 niveaux ; la région r + 1 s’ouvre quand le boss de la région r est battu', () => {
    expect([0, 1, 10, 11, 20, 50, 100, 101, 1.5].map(regionDuNiveau)).toEqual([0, 1, 1, 2, 2, 5, 10, 0, 0]);
    // niveauMax passe à 11 quand le niveau 10 (le boss) est gagné.
    expect([1, 9, 10, 11, 20, 21, 50, 51, 100].map(regionOuverte)).toEqual([1, 1, 1, 2, 2, 3, 5, 6, 10]);
  });

  it('deux défis, 4 braises la première réussite', () => {
    expect(IDS_DEFIS).toEqual(['heroique', 'fer']);
    expect(BRAISES_DEFI).toBe(4);
    expect(['heroique', 'fer', 'Fer', 'constructor', 3].map(estIdDefi)).toEqual([true, true, false, false, false]);
  });

  it('disciples offerts aux boss des régions 2 et 4, dans l’ordre Suie, Mastoc, Rouage, Corbeau, Brise-Os, Lanterne', () => {
    expect(NIVEAUX_DISCIPLE_OFFERT).toEqual([20, 40]);
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
