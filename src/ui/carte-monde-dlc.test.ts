// @vitest-environment happy-dom
// La carte du monde du DLC « Temps modernes » (le même écran, paramétré par campagne) et le sticker « DLC disponible ! » des cartes de
// l'histoire. Le rendu Canvas est remplacé par une doublure, comme dans carte-monde-regions.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { enregistrerVictoireModerne, sauvegardeVide, type Sauvegarde } from '../save';
import { afficherCarteMonde, type OptionsCarteMonde } from './carte-monde';
import { REGIONS_MONDE_MODERNE } from './regions-monde';

vi.mock('../render/carte-monde', () => ({
  RenduCarteMonde: class {
    camera = { deplacer: vi.fn(), debutPincement: vi.fn(), pincement: vi.fn(), molette: vi.fn(), decalageX: 0, decalageY: 0, vueL: 512, vueH: 288, zoom: 2 };
    ratio = 1;
    rayonToucher = 20;
    cadrer = vi.fn();
    definirMargeHaut = vi.fn();
    centrerSur = vi.fn();
    redimensionner = vi.fn();
    dessiner = vi.fn();
    enMondeX = (x: number): number => x;
    enMondeY = (y: number): number => y;
  },
}));

const ATLAS = { iconeUrl: () => 'icone.png', sprite: () => undefined } as unknown as AtlasRendu;

function monter(sauvegarde: Sauvegarde, supplement: Partial<OptionsCarteMonde> = {}) {
  const surRetour = vi.fn();
  const ecran = afficherCarteMonde(document.body, {
    atlas: ATLAS,
    session: { sauvegarde, choisirHeros: vi.fn(), equiperObjets: vi.fn() },
    difficulte: 'matou',
    surLancer: vi.fn(),
    surOptions: vi.fn(),
    surHeros: vi.fn(),
    surBoutique: vi.fn(),
    surRetour,
    ...supplement,
  });
  return { ecran, surRetour };
}

const puce = (numero: number): HTMLButtonElement => {
  const b = document.querySelector<HTMLButtonElement>(`[data-cle="region:${String(numero)}"]`);
  if (!b) throw new Error(`pastille absente : ${String(numero)}`);
  return b;
};
const racine = (): HTMLElement => {
  const r = document.querySelector<HTMLElement>('.carte-monde');
  if (!r) throw new Error('carte absente');
  return r;
};
const sticker = (): HTMLElement | null => document.querySelector('.sticker-dlc');
const boutonDlc = (): HTMLButtonElement | null => document.querySelector('.bouton-dlc');

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (): number => 1);
  vi.stubGlobal('cancelAnimationFrame', (): void => undefined);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('carte du monde du DLC', () => {
  it('trois régions : la Fac, la Manif et la Préfecture, chacune avec son ambiance', () => {
    expect(REGIONS_MONDE_MODERNE.map((r) => [r.numero, r.premierNiveau, r.campagne])).toEqual([
      [1, 1, 'moderne'],
      [2, 11, 'moderne'],
      [3, 21, 'moderne'],
    ]);
    expect(REGIONS_MONDE_MODERNE.map((r) => r.ambiance?.motif)).toEqual(['fac', 'manif', 'prefecture']);
    expect(new Set(REGIONS_MONDE_MODERNE.map((r) => r.ambiance?.fond)).size).toBe(3);
  });

  it('une campagne vide ne casse rien : la Fac s’annonce « à venir », avec son ambiance et le nom du DLC en titre', () => {
    // Des régions sans contenu (comme avant la livraison des niveaux de la Fac).
    monter(sauvegardeVide(), { campagne: 'moderne', regions: REGIONS_MONDE_MODERNE.map((r) => ({ ...r, contenu: null })) });
    expect(document.querySelectorAll('.region-puce')).toHaveLength(3);
    expect(puce(1).classList.contains('actif')).toBe(true);
    expect(document.querySelector<HTMLElement>('.carte-region-vide')?.hidden).toBe(false);
    expect(racine().dataset.campagne).toBe('moderne');
    expect(racine().dataset.ambiance).toBe('fac');
    expect(document.querySelector('.carte-titre')?.textContent).toBe(t('moderne.titre'));
    expect(document.querySelector('.region-nom')?.textContent).toBe(t('carte.region_nom', { n: 1, nom: 'La Fac' }));
  });

  it('la Fac est livrée : ses 10 niveaux, ses nœuds et son tracé sont sur la carte, plus de panneau « à venir » (les trois régions le sont)', () => {
    expect(REGIONS_MONDE_MODERNE[0]?.contenu?.niveaux.map((n) => n.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(REGIONS_MONDE_MODERNE[0]?.contenu?.noeuds).toHaveLength(10);
    expect(REGIONS_MONDE_MODERNE.every((r) => r.contenu !== null)).toBe(true);
    monter(sauvegardeVide(), { campagne: 'moderne', regions: REGIONS_MONDE_MODERNE });
    expect(document.querySelector<HTMLElement>('.carte-region-vide')?.hidden ?? true).toBe(true);
  });

  it('la Manif est livrée : ses 10 niveaux (11 à 20), ses nœuds dans le fond de 512 × 288 et ses 9 tronçons sont sur la carte', () => {
    const manif = REGIONS_MONDE_MODERNE[1]?.contenu;
    expect(manif?.niveaux.map((n) => n.numero)).toEqual(Array.from({ length: 10 }, (_, i) => i + 11));
    expect(manif?.noeuds).toHaveLength(10);
    for (const n of manif?.noeuds ?? []) expect(n.x >= 0 && n.x <= 512 && n.y >= 0 && n.y <= 288, `nœud ${String(n.numero)}`).toBe(true);
    expect(manif?.noeuds.filter((n) => n.boss).map((n) => n.numero)).toEqual([10]);
    // Les 9 tronçons : chacun part d'un nœud et arrive au suivant, dans le fond de 512 × 288.
    if (!manif) throw new Error('Manif absente');
    expect(manif.trace).toHaveLength(9);
    manif.trace.forEach((troncon, i) => {
      const a = manif.noeuds[i];
      const b = manif.noeuds[i + 1];
      expect([troncon[0]?.x, troncon[0]?.y], `tronçon ${String(i + 1)} : départ`).toEqual([a?.x, a?.y]);
      expect([troncon.at(-1)?.x, troncon.at(-1)?.y], `tronçon ${String(i + 1)} : arrivée`).toEqual([b?.x, b?.y]);
      for (const p of troncon) expect(p.x >= 0 && p.x <= 512 && p.y >= 0 && p.y <= 288).toBe(true);
    });
  });

  it('la Préfecture est livrée : ses 10 niveaux (21 à 30), ses 10 nœuds dont le boss au dernier, et ses 9 tronçons', () => {
    const prefecture = REGIONS_MONDE_MODERNE[2]?.contenu;
    if (!prefecture) throw new Error('Préfecture absente');
    expect(prefecture.niveaux.map((n) => n.numero)).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    expect(prefecture.noeuds.map((n) => n.boss)).toEqual([false, false, false, false, false, false, false, false, false, true]);
    expect(prefecture.trace).toHaveLength(9);
    // Chaque tronçon part d'un nœud et arrive au suivant, dans le fond de 512 × 288.
    prefecture.trace.forEach((troncon, i) => {
      const a = prefecture.noeuds[i];
      const b = prefecture.noeuds[i + 1];
      expect([troncon[0]?.x, troncon[0]?.y]).toEqual([a?.x, a?.y]);
      expect([troncon.at(-1)?.x, troncon.at(-1)?.y]).toEqual([b?.x, b?.y]);
      for (const p of troncon) expect(p.x >= 0 && p.x <= 512 && p.y >= 0 && p.y <= 288).toBe(true);
    });
  });

  it('les régions du DLC s’ouvrent avec la progression du DLC, pas celle de l’histoire', () => {
    // L'histoire est bien avancée, le DLC pas : seule la Fac est ouverte.
    const s = sauvegardeVide();
    const avancee: Sauvegarde = { ...s, progression: { niveauMax: 31, etoiles: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [String(i + 1), { matou: 1 }])) }, meta: { ...s.meta, regionMax: 4 } };
    monter(avancee, { campagne: 'moderne', regions: REGIONS_MONDE_MODERNE });
    expect(puce(2).classList.contains('grise')).toBe(true);
    document.body.replaceChildren();
    // La Fac finie dans le DLC : la Manif est ouverte (bitume et pavés), la Préfecture reste fermée.
    let dlc = sauvegardeVide();
    for (let n = 1; n <= 10; n++) dlc = enregistrerVictoireModerne(dlc, n, 'matou', 2);
    monter(dlc, { campagne: 'moderne', regions: REGIONS_MONDE_MODERNE });
    expect(puce(2).classList.contains('actif')).toBe(true);
    expect(racine().dataset.ambiance).toBe('manif');
    expect(puce(3).classList.contains('grise')).toBe(true);
    puce(1).click();
    expect(racine().dataset.ambiance).toBe('fac');
  });

  it('« Retour » ramène au menu ; ni sticker ni bouton DLC sur la carte du DLC', () => {
    const { surRetour } = monter(sauvegardeVide(), { campagne: 'moderne', regions: REGIONS_MONDE_MODERNE });
    expect(sticker()).toBeNull();
    expect(boutonDlc()).toBeNull();
    [...document.querySelectorAll<HTMLButtonElement>('.carte-barre button')].find((b) => b.textContent === t('carte.retour'))?.click();
    expect(surRetour).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.carte-monde')).toBeNull();
  });
});

describe('sticker « DLC disponible ! » sur la carte de l’histoire', () => {
  const avecSticker = (replie: boolean) => {
    const surOuvrir = vi.fn();
    const surReplier = vi.fn();
    monter(sauvegardeVide(), { sticker: { replie, surOuvrir, surReplier } });
    return { surOuvrir, surReplier };
  };

  it('s’affiche dans l’en-tête de la carte (la mise en page n’est pas jouée ici : l’absence de recouvrement se juge sur les captures 740x360), penché, avec son texte et sa croix', () => {
    avecSticker(false);
    const s = sticker();
    expect(s).not.toBeNull();
    expect(document.querySelector('.carte-haut')?.contains(s)).toBe(true);
    expect(s?.textContent).toContain(t('sticker.texte'));
    expect(s?.querySelector('.sticker-dlc-fermer')?.getAttribute('aria-label')).toBe(t('sticker.replier'));
    expect(boutonDlc()).toBeNull();
  });

  it('un clic sur le sticker ferme la carte et ouvre la campagne du DLC', () => {
    const { surOuvrir, surReplier } = avecSticker(false);
    sticker()?.querySelector<HTMLButtonElement>('.sticker-dlc-ouvrir')?.click();
    expect(surOuvrir).toHaveBeenCalledTimes(1);
    expect(surReplier).not.toHaveBeenCalled();
    expect(document.querySelector('.carte-monde')).toBeNull();
  });

  it('la croix le replie en bouton « DLC » dans la barre du haut, et le choix est transmis pour être gardé', () => {
    const { surOuvrir, surReplier } = avecSticker(false);
    sticker()?.querySelector<HTMLButtonElement>('.sticker-dlc-fermer')?.click();
    expect(surReplier).toHaveBeenCalledTimes(1);
    expect(surOuvrir).not.toHaveBeenCalled();
    expect(sticker()).toBeNull();
    const b = boutonDlc();
    expect(b?.textContent).toBe(t('sticker.bouton'));
    expect(document.querySelector('.carte-barre')?.contains(b)).toBe(true);
    b?.click();
    expect(surOuvrir).toHaveBeenCalledTimes(1);
  });

  it('déjà replié (choix gardé dans la sauvegarde) : seulement le bouton « DLC »', () => {
    avecSticker(true);
    expect(sticker()).toBeNull();
    expect(boutonDlc()?.getAttribute('aria-label')).toBe(t('sticker.bouton_libelle'));
  });

  it('sans option, pas de sticker (écrans d’essai)', () => {
    monter(sauvegardeVide());
    expect(sticker()).toBeNull();
    expect(boutonDlc()).toBeNull();
  });
});
