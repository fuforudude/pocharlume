import { describe, expect, it } from 'vitest';
import { VERSION_DONNEES } from '../data/version';
import { DEFS_TEST, sauvegardeRemplie } from './aides.test-utils';
import { configDepuisSauvegarde, type OptionsConfig } from './config-partie';
import { validerSauvegarde } from './validation';

const BASE: OptionsConfig = {
  dieu: 'plume',
  heros: 'suie',
  objetsEquipes: ['sablier', 'sablier'],
  difficulte: 'matou',
  graine: 99,
  versionDonnees: VERSION_DONNEES,
  defsHeros: DEFS_TEST,
};

function refusee(options: Partial<OptionsConfig>, s = sauvegardeRemplie()): string {
  const r = configDepuisSauvegarde(s, { ...BASE, ...options });
  if (r.ok) throw new Error('la config aurait dû être refusée');
  return r.raison;
}

describe('configDepuisSauvegarde', () => {
  it('compose la config depuis la progression : niveau du héros, compétences, arbre, objets', () => {
    const s = sauvegardeRemplie();
    const r = configDepuisSauvegarde(s, BASE);
    if (!r.ok) throw new Error(r.raison);
    expect(r.config).toEqual({
      graine: 99,
      difficulte: 'matou',
      dieu: 'plume',
      heros: 'suie',
      niveauHeros: 8, // 2000 d'expérience
      competencesHeros: { suie_a: 3, suie_b: 2, suie_ultime: 1 },
      ameliorations: { caserne: 2, tir: 3, magie: 0, artillerie: 0, sorts: 1, heros: 0 },
      objets: ['sablier', 'sablier'],
      versionDonnees: VERSION_DONNEES,
    });
  });

  it('un avatar sans rien de placé : niveau 1, aucune compétence, aucun objet', () => {
    const r = configDepuisSauvegarde(sauvegardeRemplie(), { ...BASE, dieu: 'pollen', heros: 'pollen', objetsEquipes: [] });
    if (!r.ok) throw new Error(r.raison);
    expect(r.config).toMatchObject({ heros: 'pollen', niveauHeros: 1, competencesHeros: {}, objets: [] });
  });

  it('rend des copies : modifier la config ne touche pas la sauvegarde', () => {
    const s = sauvegardeRemplie();
    const avant = structuredClone(s);
    const r = configDepuisSauvegarde(s, BASE);
    if (!r.ok) throw new Error(r.raison);
    (r.config.competencesHeros as Record<string, number>).suie_a = 1;
    (r.config.ameliorations as Record<string, number>).tir = 0;
    expect(s).toEqual(avant);
  });

  it('refuse un dieu ou un héros inconnu, ou qui ne vont pas ensemble', () => {
    expect(refusee({ dieu: 'zeus' })).toBe('dieu_inconnu');
    expect(refusee({ dieu: 'constructor' })).toBe('dieu_inconnu');
    expect(refusee({ heros: 'zeus' })).toBe('heros_inconnu');
    expect(refusee({ heros: 'charlie' })).toBe('heros_pas_du_dieu');
  });

  it('refuse un héros non possédé', () => {
    expect(refusee({ dieu: 'plume', heros: 'corbeau' })).toBe('heros_non_possede');
    expect(refusee({ dieu: 'charlie', heros: 'mastoc' })).toBe('heros_non_possede');
  });

  it('refuse une difficulté inconnue', () => {
    expect(refusee({ difficulte: 'facile' })).toBe('difficulte_inconnue');
    expect(refusee({ difficulte: 'constructor' })).toBe('difficulte_inconnue');
  });

  it('refuse un objet non en stock (autant d’exemplaires que d’emplacements), inconnu, ou trop d’emplacements', () => {
    // La sauvegarde remplie a 5 sabliers, 3 fioles, ni herbe ni griffe.
    expect(refusee({ objetsEquipes: ['herbe_sabbat'] })).toBe('objet_hors_stock');
    expect(refusee({ objetsEquipes: ['fiole_soufre', 'fiole_soufre', 'fiole_soufre', 'fiole_soufre'] })).toBe('trop_d_objets');
    expect(refusee({ objetsEquipes: ['potion'] })).toBe('objet_inconnu');
    expect(refusee({ objetsEquipes: ['constructor'] })).toBe('objet_inconnu');
    expect(refusee({ objetsEquipes: 'sablier' as unknown as string[] })).toBe('objet_inconnu');
    const s = sauvegardeRemplie();
    const unSeul = { ...s, meta: { ...s.meta, objets: { ...s.meta.objets, sablier: 1 } } };
    expect(refusee({ objetsEquipes: ['sablier', 'sablier'] }, unSeul)).toBe('objet_hors_stock');
    expect(configDepuisSauvegarde(unSeul, { ...BASE, objetsEquipes: ['sablier', 'fiole_soufre'] }).ok).toBe(true);
  });

  it('refuse des compétences qui ne tiennent plus (rééquilibrage, sauvegarde bricolée) au lieu de les corriger en silence', () => {
    const s = sauvegardeRemplie();
    const suie = s.meta.heros.suie;
    if (!suie) throw new Error('suie absente');
    const avec = (competences: Record<string, number>, xp = suie.xp) => ({ ...s, meta: { ...s.meta, heros: { ...s.meta.heros, suie: { xp, competences } } } });
    expect(refusee({}, avec({ vol: 1 }))).toBe('competences_incoherentes');
    expect(refusee({}, avec({ suie_a: 4 }))).toBe('competences_incoherentes');
    expect(refusee({}, avec({ suie_ultime: 1 }, 500))).toBe('competences_incoherentes'); // niveau 4 : pas d'ultime
    expect(refusee({}, avec({ suie_a: 3, suie_b: 3, suie_c: 2 }, 500))).toBe('competences_incoherentes'); // 8 points pour 4
  });

  it('sans définition du héros, refuse', () => {
    expect(refusee({ defsHeros: { ...DEFS_TEST, heros: {} } })).toBe('heros_inconnu');
  });

  it('la sauvegarde remplie reste valide avec les définitions complètes', () => {
    expect(validerSauvegarde(JSON.parse(JSON.stringify(sauvegardeRemplie())), DEFS_TEST).ok).toBe(true);
  });
});
