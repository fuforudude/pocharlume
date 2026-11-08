// Présentation des particularités : la ligne de la fiche du niveau vient du gimmick, la fiche « Nouvelle particularité » ne s'ouvre
// qu'à la première rencontre (notée dans les rencontres du bestiaire, sans nouveau format de sauvegarde) et se coupe avec l'option
// des fiches, et le Bestiaire les liste.
import { describe, expect, it } from 'vitest';
import { REGION1 } from '../data/niveaux/region1';
import { creerPartie } from '../engine';
import { CONFIG } from '../engine/aides.test-utils';
import { fr } from '../i18n/fr';
import { ennemiRencontre, exporterCode, fusionnerProgressions, importerCode, sauvegardeVide, type Sauvegarde } from '../save';
import { validerBestiaire } from '../save/validation-bestiaire';
import { ennemisParRegion } from './bestiaire-logique';
import {
  contenuParticularite,
  contenuRadeau,
  idRencontreParticularite,
  ligneParticularite,
  particulariteAMontrer,
  TYPES_PARTICULARITES,
  vueParticularites,
} from './particularites';

/** Une session de test : elle retient les identifiants qu'on lui fait noter. */
function session(s: Sauvegarde): { sauvegarde: Sauvegarde; notes: string[][]; rencontrerEnnemis: (ids: readonly string[]) => Promise<unknown> } {
  const notes: string[][] = [];
  return {
    sauvegarde: s,
    notes,
    rencontrerEnnemis: (ids) => {
      notes.push([...ids]);
      return Promise.resolve();
    },
  };
}

function avecRencontres(rencontres: string[], fiches = true): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, meta: { ...s.meta, bestiaire: { rencontres: [...rencontres].sort(), fiches } } };
}

describe('textes des particularités', () => {
  it('chaque type a son nom, sa phrase et son conseil ; les deux phrases ne changent pas sans qu’on le voie', () => {
    for (const type of TYPES_PARTICULARITES) {
      for (const cle of ['nom', 'phrase', 'conseil']) expect(Object.hasOwn(fr, `gimmick.${type}.${cle}`)).toBe(true);
    }
    expect(fr['gimmick.corbeaux.phrase']).toBe('Des corbeaux traversent la carte dans des couloirs, sans suivre le chemin. Chacun qui passe coûte un cœur. Seul ce qui vise les volants les touche.');
    expect(fr['gimmick.radeau.phrase']).toBe('Il va et vient sur l’eau. On y construit tout sauf ce qui pose quelque chose au sol. L’eau, elle, ne porte rien.');
  });
});

describe('ligne de la fiche du niveau', () => {
  it('« Particularité : <nom> — <phrase> » pour un niveau à gimmick, rien pour un niveau ordinaire', () => {
    expect(ligneParticularite({ gimmick: { type: 'corbeaux', couloirs: [{ cy: 1 }] } })).toBe(
      'Particularité : Vol de Corbeaux — Des corbeaux traversent la carte dans des couloirs, sans suivre le chemin. Chacun qui passe coûte un cœur. Seul ce qui vise les volants les touche.',
    );
    expect(ligneParticularite({ gimmick: { type: 'radeau', trajet: [], vitesse: 1, places: [] } })).toMatch(/^Particularité : Radeau — Il va et vient/);
    expect(ligneParticularite({})).toBeNull();
  });
});

describe('fiche « Nouvelle particularité »', () => {
  it('à la première rencontre : notée dans les rencontres du bestiaire, et à montrer', () => {
    const s = session(avecRencontres([]));
    expect(particulariteAMontrer(s, 'corbeaux', false)).toBe(true);
    expect(s.notes).toEqual([['particularite_corbeaux']]);
  });

  it('déjà rencontrée : ni notée de nouveau, ni montrée', () => {
    const s = session(avecRencontres(['particularite_radeau']));
    expect(particulariteAMontrer(s, 'radeau', false)).toBe(false);
    expect(s.notes).toEqual([]);
  });

  it('l’option des fiches coupée : notée quand même, mais pas montrée', () => {
    const s = session(avecRencontres([], false));
    expect(particulariteAMontrer(s, 'radeau', false)).toBe(false);
    expect(s.notes).toEqual([['particularite_radeau']]);
  });

  it('hors sauvegarde : rien n’est noté ; la fiche ne s’ouvre que pour un niveau d’essai', () => {
    const s = session(avecRencontres([]));
    expect(particulariteAMontrer(s, 'corbeaux', true)).toBe(false);
    expect(particulariteAMontrer(s, 'corbeaux', true, true)).toBe(true);
    expect(s.notes).toEqual([]);
  });

  it('l’identifiant noté passe la validation du bestiaire de la sauvegarde et ne trouble pas l’écran des ennemis', () => {
    const ids = TYPES_PARTICULARITES.map(idRencontreParticularite);
    expect(ids).toEqual(['particularite_corbeaux', 'particularite_radeau']);
    const rencontres = ['paysan_affame', ...ids].sort();
    expect(validerBestiaire({ rencontres, fiches: true })).toEqual({ ok: true, valeur: { rencontres, fiches: true } });
    const s = avecRencontres(['particularite_corbeaux', 'paysan_affame']);
    expect(ennemiRencontre(s, 'particularite_corbeaux')).toBe(true);
    const ennemis = ennemisParRegion(s).flatMap((g) => g.ennemis);
    expect(ennemis.some((e) => e.id.startsWith('particularite_'))).toBe(false);
    expect(ennemis.filter((e) => e.rencontre).map((e) => e.id)).toEqual(['paysan_affame']);
  });

  it('une rencontre particularite_* survit à l’export puis à l’import du code de sauvegarde', async () => {
    const source = avecRencontres(['paysan_affame', 'particularite_radeau']);
    const r = await importerCode(await exporterCode(source));
    if (!r.ok) throw new Error(r.detail);
    expect(r.sauvegarde.meta.bestiaire.rencontres).toEqual(['particularite_radeau', 'paysan_affame']);
    expect(particulariteAMontrer(session(r.sauvegarde), 'radeau', false)).toBe(false);
  });

  it('la fusion de deux sauvegardes réunit les rencontres particularite_* des deux côtés', () => {
    const a = avecRencontres(['particularite_corbeaux']);
    const b = avecRencontres(['paysan_affame', 'particularite_radeau']);
    expect(fusionnerProgressions(a, b).meta.bestiaire.rencontres).toEqual(['particularite_corbeaux', 'particularite_radeau', 'paysan_affame']);
  });
});

describe('Bestiaire et bulles', () => {
  it('liste chaque particularité, rencontrée ou pas', () => {
    expect(vueParticularites(avecRencontres(['particularite_radeau']))).toEqual([
      { type: 'corbeaux', rencontree: false },
      { type: 'radeau', rencontree: true },
    ]);
  });

  it('la bulle d’une particularité : nom, phrase, comment s’y prendre', () => {
    const c = contenuParticularite('corbeaux', ['note']);
    expect(c.titre).toBe('Vol de Corbeaux');
    expect(c.texte).toBe(fr['gimmick.corbeaux.phrase']);
    expect(c.notes).toEqual(['note', fr['gimmick.corbeaux.conseil']]);
  });

  it('la bulle du radeau : rien sans radeau', () => {
    const niveau = REGION1[0]?.niveau;
    if (!niveau) throw new Error('niveau 1 absent');
    expect(contenuRadeau(creerPartie(niveau, CONFIG))).toBeNull();
  });
});
