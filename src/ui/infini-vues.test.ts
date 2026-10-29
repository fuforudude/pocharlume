import { describe, expect, it } from 'vitest';
import { PALIERS_INFINI, RECOMPENSES_PALIERS_INFINI } from '../data/meta';
import { REGION1 } from '../data/niveaux/region1';
import { fr } from '../i18n/fr';
import { t } from '../i18n';
import { enregistrerFinInfinie, enregistrerVictoire, sauvegardeVide, type BilanInfini, type Sauvegarde } from '../save';
import { configInfini } from './lancement';
import { carteDuNiveau, lignesBilanInfini, nomDeCarte, vueCartesInfini, vuePaliers } from './infini-vues';

function gagner(niveaux: readonly number[]): Sauvegarde {
  let s = sauvegardeVide();
  for (const n of niveaux) s = enregistrerVictoire(s, n, 'matou', 1);
  return s;
}

describe('cartes du mode infini', () => {
  it('aucune carte tant que le boss de la région 1 n’est pas battu', () => {
    expect(vueCartesInfini(sauvegardeVide())).toEqual([]);
    expect(vueCartesInfini(gagner([1, 2, 3]))).toEqual([]);
  });

  it('chaque niveau de la région 1 connaît sa carte, et les cartes sont celles des niveaux gagnés, une fois chacune', () => {
    expect(REGION1.map((n) => carteDuNiveau(n.numero))).not.toContain(undefined);
    expect(carteDuNiveau(0)).toBeUndefined();
    expect(carteDuNiveau(1000)).toBeUndefined();
    const vues = vueCartesInfini(gagner([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    const ids = vues.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
    for (const v of vues) {
      expect(v.region).toBe(1);
      expect(v.record).toBe(0);
      expect(carteDuNiveau(v.niveau.numero)).toBe(v.id);
      // Le niveau proposé pour jouer est le premier gagné de la carte.
      expect(v.niveau.numero).toBeLessThanOrEqual(10);
    }
  });

  it('une région sans niveaux livrés n’ajoute aucune carte et ne plante pas', () => {
    // Le niveau 55 n’existe pas encore : sa carte est ignorée, même gagné.
    const vues = vueCartesInfini(gagner([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { carteDuNiveau: (n) => (n === 1 ? 'chaumes' : n === 55 ? 'inconnue' : undefined) });
    expect(vues.map((v) => v.id)).toEqual(['chaumes']);
  });

  it('le record de chaque carte est celui de la sauvegarde', () => {
    let s = gagner([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const r = enregistrerFinInfinie(s, { carte: 'chaumes', vague: 12 });
    if (!r.ok) throw new Error('fin refusée');
    s = r.sauvegarde;
    const vues = vueCartesInfini(s);
    expect(vues.find((v) => v.id === 'chaumes')?.record).toBe(12);
    expect(vues.filter((v) => v.id !== 'chaumes').every((v) => v.record === 0)).toBe(true);
  });

  it('nomme chaque carte livrée, et met en forme l’identifiant d’une carte sans nom', () => {
    for (const n of REGION1) {
      const id = carteDuNiveau(n.numero);
      expect(Object.hasOwn(fr, `carte.nom.${String(id)}`), String(id)).toBe(true);
    }
    expect(nomDeCarte('chaumes')).toBe('Les Chaumes');
    expect(nomDeCarte('cour_des_miracles')).toBe('Cour des miracles');
  });
});

describe('paliers du mode infini', () => {
  it('liste les six paliers avec leur récompense, aucun payé au départ', () => {
    const vues = vuePaliers(gagner([10]));
    expect(vues.map((v) => v.palier)).toEqual([...PALIERS_INFINI]);
    for (const v of vues) {
      expect(v.paye).toBe(false);
      expect({ aretes: v.aretes, braises: v.braises }).toEqual(RECOMPENSES_PALIERS_INFINI[v.palier]);
    }
  });

  it('un palier payé sur une carte l’est pour toutes', () => {
    let s = gagner([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const r = enregistrerFinInfinie(s, { carte: 'chaumes', vague: 21 });
    if (!r.ok) throw new Error('fin refusée');
    s = r.sauvegarde;
    expect(vuePaliers(s).filter((v) => v.paye).map((v) => v.palier)).toEqual([10, 20]);
  });
});

describe('bilan de la partie infinie', () => {
  const BILAN: BilanInfini = {
    vague: 12,
    record: 12,
    recordPrecedent: 8,
    nouveauRecord: true,
    paliersPayes: [10],
    aretes: 50,
    braises: 2,
    objetsConsommes: ['fiole_soufre'],
    objetsRendus: [],
  };

  it('dit la vague, le nouveau record, les paliers payés et les objets', () => {
    const lignes = lignesBilanInfini(BILAN, 'chaumes');
    expect(lignes[0]).toBe(t('fin.infini_vague', { n: 12 }));
    expect(lignes).toContain(t('fin.infini_nouveau_record', { carte: 'Les Chaumes' }));
    expect(lignes).toContain(t('fin.infini_palier', { n: 10, aretes: 50, braises: 2 }));
    expect(lignes).toContain(t('fin.bilan_objets', { noms: 'Fiole de Soufre' }));
  });

  it('sans nouveau record, rappelle le record de la carte ; sans palier, le dit', () => {
    const lignes = lignesBilanInfini({ ...BILAN, vague: 5, record: 8, nouveauRecord: false, paliersPayes: [], aretes: 0, braises: 0, objetsConsommes: [] }, 'gue');
    expect(lignes).toEqual([t('fin.infini_vague', { n: 5 }), t('fin.infini_record', { carte: 'Le Gué', n: 8 }), t('fin.infini_aucun_palier')]);
  });
});

describe('config d’une partie infinie', () => {
  it('compose la config de Matou avec le mode infini de la région de la carte, sans défi', () => {
    const s = gagner([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const choix = { dieu: s.meta.choix.dieu, heros: s.meta.choix.heros, objets: [] };
    const r = configInfini(s, choix, 77, 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.config.infini).toEqual({ region: 3 });
    expect(r.config.difficulte).toBe('matou');
    expect(r.config.graine).toBe(77);
    expect(r.config.defi ?? null).toBeNull();
  });
});
