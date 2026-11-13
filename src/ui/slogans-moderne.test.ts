import { describe, expect, it } from 'vitest';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { CAMPAGNE_MODERNE } from '../data/niveaux/campagne-moderne';
import type { Evenement } from '../engine';
import type { Vague } from '../engine/definitions';
import { aTexte, tCle } from '../i18n';
import { ajouterSlogan, cleSlogan, SLOGANS_PAR_REGION, sloganDuPas } from './slogans-moderne';
import { reunirParoles } from './evenements-niveau';

const annonce: Evenement = { type: 'annonce_evenement', index: 0, typeEvenement: 'charge', chemin: 0, dans: 5 };
const foule: Evenement = { type: 'foule_activee', foule: 0, x: 1, y: 1 };
const vide: Vague[] = [];
const etat = (pas: number, evenements: Evenement[]) => ({ pas, evenements });

const FAC = CAMPAGNE_MODERNE[0];
const NIVEAU_BOSS = CAMPAGNE_MODERNE.find((n) => n.boss && n.numero <= 10);
const HISTOIRE = CAMPAGNE[0];
if (!FAC || !NIVEAU_BOSS || !HISTOIRE) throw new Error('campagnes vides');

describe('slogans du DLC', () => {
  it('les textes existent : dix slogans par région, non vides, sans marqueur', () => {
    for (let region = 1; region <= 3; region++) {
      for (let n = 1; n <= SLOGANS_PAR_REGION; n++) {
        const cle = `slogan.m${String(region)}.${String(n)}`;
        expect(aTexte(cle), cle).toBe(true);
        expect(tCle(cle).length).toBeGreaterThan(10);
      }
      expect(aTexte(`slogan.m${String(region)}.${String(SLOGANS_PAR_REGION + 1)}`)).toBe(false);
    }
  });

  it('ne s’affiche que dans le DLC : rien dans l’histoire, même avec une annonce', () => {
    expect(cleSlogan(HISTOIRE, etat(10, [annonce]), vide)).toBeNull();
    expect(sloganDuPas(HISTOIRE, etat(10, [foule]), vide)).toBeNull();
    expect(cleSlogan(FAC, etat(10, [annonce]), vide)).not.toBeNull();
  });

  it('ne réagit qu’aux événements qui font scander', () => {
    expect(cleSlogan(FAC, etat(10, []), vide)).toBeNull();
    expect(cleSlogan(FAC, etat(10, [{ type: 'chemin_ouvert', chemin: 0 }]), vide)).toBeNull();
    expect(cleSlogan(FAC, etat(10, [foule]), vide)).not.toBeNull();
  });

  it('une vague de boss le déclenche, une autre non', () => {
    const vagues = NIVEAU_BOSS.niveau.vagues;
    const indices = vagues.map((_, i) => cleSlogan(NIVEAU_BOSS, etat(5, [{ type: 'vague', index: i, bonus: 0 }]), vagues)).flatMap((c, i) => (c ? [i] : []));
    expect(indices.length).toBeGreaterThan(0);
    expect(indices.length).toBeLessThan(vagues.length);
  });

  it('est déterministe : même niveau, même pas, même événement, même slogan ; et il varie avec le pas', () => {
    const a = Array.from({ length: 60 }, (_, pas) => cleSlogan(FAC, etat(pas, [annonce]), vide));
    const b = Array.from({ length: 60 }, (_, pas) => cleSlogan(FAC, etat(pas, [annonce]), vide));
    expect(a).toEqual(b);
    expect(new Set(a).size).toBeGreaterThan(3);
  });

  it('prend la région du niveau (clé slogan.m<région>)', () => {
    for (const n of CAMPAGNE_MODERNE) {
      const cle = cleSlogan(n, etat(3, [foule]), vide);
      expect(cle?.startsWith(`slogan.m${String(Math.floor((n.numero - 1) / 10) + 1)}.`)).toBe(true);
      expect(aTexte(cle ?? '')).toBe(true);
    }
  });

  it('jamais à la place d’une annonce : il passe après, tout le texte de l’annonce reste', () => {
    const slogan = sloganDuPas(FAC, etat(10, [annonce]), vide);
    const bandeau = reunirParoles(ajouterSlogan(['Une charge arrive !'], slogan));
    expect(bandeau?.startsWith('Une charge arrive !')).toBe(true);
    expect(bandeau).toContain(slogan ?? 'absent');
    expect(ajouterSlogan(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(ajouterSlogan(['a'], null)).toEqual(['a']);
  });
});
