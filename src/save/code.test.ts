import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { FIXTURE_V1, sauvegardeRemplie } from './aides.test-utils';
import { crc32, depuisBase64Url, exporterCode, importerCode, PREFIXE_CODE, remplacerProgression, TAILLE_MAX_CODE, versBase64Url } from './code';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';

/** Fabrique un code valide (somme comprise) autour de données quelconques. */
async function fabriquerCode(json: string, mode: 'j' | 'z' = 'j'): Promise<string> {
  let octets = new TextEncoder().encode(json);
  if (mode === 'z') {
    const flux = new Blob([octets]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    octets = new Uint8Array(await new Response(flux).arrayBuffer());
  }
  const corps = `${mode}.${versBase64Url(octets)}`;
  return `${PREFIXE_CODE}.${corps}.${crc32(new TextEncoder().encode(corps)).toString(16).padStart(8, '0')}`;
}

function campagneComplete(): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= 100; n++) {
    s = enregistrerVictoire(s, n, 'matou', 3);
    s = enregistrerVictoire(s, n, 'chaton', 2);
    if (n % 2 === 0) s = enregistrerVictoire(s, n, 'vieux_sage', 1);
  }
  return s;
}

describe('base64url et somme de contrôle', () => {
  it('encode et décode tous les octets, avec les vecteurs connus', () => {
    expect(versBase64Url(new TextEncoder().encode('Man'))).toBe('TWFu');
    expect(versBase64Url(new TextEncoder().encode('Ma'))).toBe('TWE');
    expect(versBase64Url(new TextEncoder().encode('M'))).toBe('TQ');
    expect(versBase64Url(new Uint8Array([0xfb, 0xff, 0xfe]))).toBe('-__-');
    for (let longueur = 0; longueur < 40; longueur++) {
      const octets = Uint8Array.from({ length: longueur }, (_, i) => (i * 37 + longueur) & 255);
      expect(depuisBase64Url(versBase64Url(octets))).toEqual(octets);
    }
  });

  it('refuse un base64url mal formé : alphabet, longueur, forme non canonique', () => {
    for (const mauvais of ['TWF+', 'TWF/', 'TWF=', 'TW Fu', 'T', 'TWFuT', 'TWF\n', 'é']) expect(depuisBase64Url(mauvais), mauvais).toBeNull();
    expect(depuisBase64Url('TR')).toBeNull(); // bits de fin non nuls : le même octet s'écrit « TQ »
  });

  it('CRC-32 : valeur de référence', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

describe('export et import d’un code', () => {
  it('un profil vide reçoit la même progression et les mêmes réglages que celui qui a exporté', async () => {
    const source = sauvegardeRemplie();
    const code = await exporterCode(source);
    const r = await importerCode(code);
    if (!r.ok) throw new Error(r.detail);
    const sur = remplacerProgression(r.sauvegarde);
    expect(sur.progression).toEqual(source.progression);
    expect(sur.reglages).toEqual(source.reglages);
    expect(sur.partie).toBeNull();
  });

  it('le code ne contient pas la partie en cours', async () => {
    const source = sauvegardeRemplie();
    expect(source.partie).not.toBeNull();
    const r = await importerCode(await exporterCode(source));
    expect(r.ok && r.sauvegarde.partie).toBeNull();
  });

  it('est compact : une campagne complète tient en moins de 1000 caractères, une sauvegarde vide en moins de 500', async () => {
    const complete = await exporterCode(campagneComplete());
    expect(complete.length).toBeLessThan(1000);
    expect((await exporterCode(sauvegardeVide())).length).toBeLessThan(500);
    expect(complete).toMatch(/^PCH1\.z\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
  });

  it('reste compact avec un bestiaire plein (tous les ennemis rencontrés) : moins de 1600 caractères, et il revient intact', async () => {
    const base = campagneComplete();
    const plein: Sauvegarde = { ...base, meta: { ...base.meta, bestiaire: { rencontres: Object.keys(ENNEMIS).sort(), fiches: false } } };
    const code = await exporterCode(plein);
    // 1431 caractères avec les 20 ennemis du 2026-11-03 ; plafond relevé par décision de l’auteur plutôt que de compacter les rencontres en bits.
    expect(code.length).toBeLessThan(1600);
    const relu = await importerCode(code);
    expect(relu.ok && relu.sauvegarde.meta.bestiaire).toEqual(plein.meta.bestiaire);
  });

  it('produit le même code pour la même progression', async () => {
    expect(await exporterCode(sauvegardeRemplie())).toBe(await exporterCode(sauvegardeRemplie()));
  });

  it('accepte le code même collé avec des espaces et des retours à la ligne', async () => {
    const code = await exporterCode(sauvegardeRemplie());
    const colle = `  ${code.slice(0, 20)}\n${code.slice(20, 40)} \r\n${code.slice(40)}\n`;
    const r = await importerCode(colle);
    expect(r.ok).toBe(true);
  });

  it('comprend aussi le mode sans compression', async () => {
    const source = sauvegardeRemplie();
    const json = JSON.stringify({ version: source.version, progression: source.progression, reglages: source.reglages, meta: source.meta });
    const r = await importerCode(await fabriquerCode(json, 'j'));
    expect(r.ok && r.sauvegarde.progression).toEqual(source.progression);
  });

  it('importe un code d’une ancienne version en le migrant', async () => {
    const v1 = JSON.parse(FIXTURE_V1) as Record<string, unknown>;
    Reflect.deleteProperty(v1, 'partie');
    const r = await importerCode(await fabriquerCode(JSON.stringify(v1), 'z'));
    if (!r.ok) throw new Error(r.detail);
    expect(r.depuis).toBe(1);
    expect(r.sauvegarde.progression).toEqual({ niveauMax: 4, etoiles: { '1': { matou: 3 }, '2': { matou: 2 }, '3': { matou: 1 } } });
  });

  describe('refuse sans rien produire', () => {
    it('un code vide, trop long, qui n’est pas un code, ou à une autre version de code', async () => {
      expect(await importerCode('')).toMatchObject({ ok: false, raison: 'vide' });
      expect(await importerCode('   \n ')).toMatchObject({ ok: false, raison: 'vide' });
      expect(await importerCode('x'.repeat(TAILLE_MAX_CODE + 1))).toMatchObject({ ok: false, raison: 'trop_long' });
      expect(await importerCode('bonjour')).toMatchObject({ ok: false, raison: 'format' });
      expect(await importerCode('PCH1.z.abc')).toMatchObject({ ok: false, raison: 'format' });
      expect(await importerCode('PCH9.z.abc.12345678')).toMatchObject({ ok: false, raison: 'format' });
      expect(await importerCode('PCH1.x.abc.12345678')).toMatchObject({ ok: false, raison: 'format' });
      expect(await importerCode('PCH1.z..12345678')).toMatchObject({ ok: false, raison: 'format' });
      expect(await importerCode('PCH1.z.a.b.12345678')).toMatchObject({ ok: false, raison: 'format' });
    });

    it('un code dont un caractère a changé ou qui est tronqué (somme de contrôle)', async () => {
      const code = await exporterCode(sauvegardeRemplie());
      const milieu = Math.floor(code.length / 2);
      const change = code.slice(0, milieu) + (code[milieu] === 'A' ? 'B' : 'A') + code.slice(milieu + 1);
      expect(await importerCode(change)).toMatchObject({ ok: false, raison: 'somme' });
      expect(await importerCode(code.slice(0, code.length - 12) + code.slice(code.length - 9))).toMatchObject({ ok: false, raison: 'somme' });
      expect(await importerCode(code.replace(/\.[0-9a-f]{8}$/, '.00000000'))).toMatchObject({ ok: false, raison: 'somme' });
    });

    it('des données qui ne sont pas du base64url, pas du JSON ou pas de l’UTF-8, malgré une somme correcte', async () => {
      const corps = 'j.pas*du*base64';
      const somme = crc32(new TextEncoder().encode(corps)).toString(16).padStart(8, '0');
      expect(await importerCode(`${PREFIXE_CODE}.${corps}.${somme}`)).toMatchObject({ ok: false, raison: 'format' });
      expect(await importerCode(await fabriquerCode('ceci n’est pas du json'))).toMatchObject({ ok: false, raison: 'donnees' });
      expect(await importerCode(await fabriquerCode('[1,2,3]'))).toMatchObject({ ok: false, raison: 'donnees' });
      expect(await importerCode(await fabriquerCode('null'))).toMatchObject({ ok: false, raison: 'donnees' });
      const octets = new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]);
      const corpsBinaire = `j.${versBase64Url(octets)}`;
      const sommeBinaire = crc32(new TextEncoder().encode(corpsBinaire)).toString(16).padStart(8, '0');
      expect(await importerCode(`${PREFIXE_CODE}.${corpsBinaire}.${sommeBinaire}`)).toMatchObject({ ok: false, raison: 'donnees' });
    });

    it('des données compressées invalides', async () => {
      const corps = `z.${versBase64Url(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))}`;
      const somme = crc32(new TextEncoder().encode(corps)).toString(16).padStart(8, '0');
      expect(await importerCode(`${PREFIXE_CODE}.${corps}.${somme}`)).toMatchObject({ ok: false, raison: 'compression' });
    });

    it('une bombe de décompression (petit code, énormes données)', async () => {
      const bombe = await fabriquerCode(`{"version":2,"remplissage":"${'0'.repeat(5_000_000)}"}`, 'z');
      expect(bombe.length).toBeLessThan(TAILLE_MAX_CODE);
      expect(await importerCode(bombe)).toMatchObject({ ok: false, raison: 'compression' });
    });

    it('un code d’une version de sauvegarde plus récente que le jeu', async () => {
      const r = await importerCode(await fabriquerCode('{"version":99,"progression":{},"reglages":{}}'));
      expect(r).toMatchObject({ ok: false, raison: 'trop_recent' });
    });

    it('des données invalides : types, bornes, clés en trop ou héritées', async () => {
      const bon = { version: 2, progression: { niveauMax: 3, etoiles: { '1': { matou: 3 } } }, reglages: { son: 50, musique: 50, vitesse: 1 } };
      const mauvais = [
        { ...bon, progression: { niveauMax: 300, etoiles: {} } },
        { ...bon, progression: { niveauMax: 3, etoiles: { '1': { matou: 7 } } } },
        { ...bon, reglages: { son: 50, musique: 50, vitesse: 4 } },
        { ...bon, reglages: { son: '50', musique: 50, vitesse: 1 } },
        { ...bon, extra: true },
        { ...bon, partie: null },
        { ...bon, partie: { niveau: 1 } },
      ];
      for (const x of mauvais) expect(await importerCode(await fabriquerCode(JSON.stringify(x))), JSON.stringify(x)).toMatchObject({ ok: false, raison: 'donnees' });
      const empoisonnes = [
        '{"version":2,"__proto__":{"admin":true},"progression":{"niveauMax":3,"etoiles":{}},"reglages":{"son":50,"musique":50,"vitesse":1}}',
        '{"version":2,"progression":{"niveauMax":3,"etoiles":{"__proto__":{"matou":3}}},"reglages":{"son":50,"musique":50,"vitesse":1}}',
        '{"version":2,"progression":{"niveauMax":3,"etoiles":{"constructor":{"matou":3}}},"reglages":{"son":50,"musique":50,"vitesse":1}}',
        '{"version":2,"progression":{"niveauMax":3,"etoiles":{"1":{"prototype":3}}},"reglages":{"son":50,"musique":50,"vitesse":1}}',
        '{"version":2,"progression":{"niveauMax":3,"etoiles":{}},"reglages":{"son":50,"musique":50,"vitesse":1,"constructor":{"prototype":{"admin":true}}}}',
      ];
      for (const json of empoisonnes) expect(await importerCode(await fabriquerCode(json, 'z')), json).toMatchObject({ ok: false, raison: 'donnees' });
      expect(Reflect.get({}, 'admin')).toBeUndefined();
      expect(Reflect.get({}, 'matou')).toBeUndefined();
    });
  });

  it('un import valide remplace la progression, les réglages et abandonne la partie en cours', async () => {
    const courante = sauvegardeRemplie();
    const importee = campagneComplete();
    const r = await importerCode(await exporterCode(importee));
    if (!r.ok) throw new Error(r.detail);
    const apres = remplacerProgression(r.sauvegarde);
    expect(apres.progression).toEqual(importee.progression);
    expect(apres.reglages).toEqual(importee.reglages);
    expect(apres.progression).not.toEqual(courante.progression);
    expect(apres.partie).toBeNull();
  });

  it('un import refusé ne change pas la sauvegarde courante (l’import ne reçoit ni ne modifie rien)', async () => {
    const courante = sauvegardeRemplie();
    const avant = JSON.stringify(courante);
    const r = await importerCode('PCH1.z.abc.00000000');
    expect(r.ok).toBe(false);
    expect(JSON.stringify(courante)).toBe(avant);
  });
});
