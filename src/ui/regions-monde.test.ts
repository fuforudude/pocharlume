import { describe, expect, it } from 'vitest';
import { NIVEAUX_PAR_REGION } from '../data/meta';
import { NOEUDS_REGION1 } from '../data/niveaux/carte-du-monde';
import { REGION1 } from '../data/niveaux/region1';
import { fr } from '../i18n/fr';
import { decalageDeRegion, niveauDeCampagne, REGIONS_MONDE, textesDuNiveau } from './regions-monde';

describe('régions du monde', () => {
  it('montre les cinq régions du jalon 3, numérotées de 1 à 5, chacune avec son nom traduit', () => {
    expect(REGIONS_MONDE.map((r) => r.numero)).toEqual([1, 2, 3, 4, 5]);
    for (const r of REGIONS_MONDE) expect(Object.hasOwn(fr, r.nom), r.nom).toBe(true);
  });

  it('chaque région commence au niveau de campagne qui suit celles d’avant', () => {
    expect(REGIONS_MONDE.map((r) => r.premierNiveau)).toEqual([1, 11, 21, 31, 41]);
    expect(REGIONS_MONDE.map((r) => decalageDeRegion(r))).toEqual([0, 10, 20, 30, 40].map((d) => (d / 10) * NIVEAUX_PAR_REGION));
  });

  it('la région 1 est livrée : dix niveaux, dix nœuds, neuf tronçons, un texte par niveau', () => {
    const contenu = REGIONS_MONDE[0]?.contenu;
    expect(contenu).toBeTruthy();
    expect(contenu?.niveaux).toBe(REGION1);
    expect(contenu?.noeuds).toBe(NOEUDS_REGION1);
    expect(contenu?.trace).toHaveLength(9);
    expect(contenu?.textes.map((x) => x.numero)).toEqual(REGION1.map((n) => n.numero));
  });

  it('les contenus livrés sont cohérents : autant de nœuds et de textes que de niveaux, aux numéros de campagne', () => {
    for (const r of REGIONS_MONDE) {
      if (r.contenu === null) continue;
      const attendus = r.contenu.niveaux.map((n) => n.numero);
      expect(attendus, `région ${String(r.numero)}`).toEqual(Array.from({ length: NIVEAUX_PAR_REGION }, (_, i) => r.premierNiveau + i));
      expect(r.contenu.noeuds.map((n) => n.numero + decalageDeRegion(r))).toEqual(attendus);
      expect(r.contenu.textes.map((x) => x.numero)).toEqual(attendus);
    }
  });

  it('retrouve un niveau par son numéro de campagne, ou rien s’il n’est pas livré', () => {
    expect(niveauDeCampagne(3)).toBe(REGION1[2]);
    expect(niveauDeCampagne(10)?.boss).toBe(true);
    expect(niveauDeCampagne(0)).toBeUndefined();
    expect(niveauDeCampagne(101)).toBeUndefined();
  });

  it('retrouve le nom et l’ambiance d’un niveau', () => {
    expect(textesDuNiveau(1)).toEqual({ nom: 'La Porte Ouverte', ambiance: expect.stringContaining('porte ouverte') as string });
    expect(textesDuNiveau(101)).toBeNull();
  });
});
