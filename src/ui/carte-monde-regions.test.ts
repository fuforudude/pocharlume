// @vitest-environment happy-dom
// La carte du monde du jalon 3 : passer d'une région ouverte à l'autre, les régions fermées grisées, et la fiche d'un niveau
// avec ses trois modes (Normal, Héroïque, Fer). Le rendu Canvas est remplacé par une doublure qui note ce qu'on lui demande ;
// les régions 2 et suivantes sont des copies de la région 1 aux numéros de campagne décalés (les vraies arrivent avec les niveaux).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOEUDS_REGION1, TRACE_REGION1 } from '../data/niveaux/carte-du-monde';
import { REGION1, TEXTES_REGION1 } from '../data/niveaux/region1';
import type { NiveauCampagne } from '../data/visuel';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { sauvegardeVide, type RaisonChoix, type RaisonEquipement, type Sauvegarde } from '../save';
import { afficherCarteMonde, type OptionsCarteMonde } from './carte-monde';
import { REGIONS_MONDE, type RegionMonde } from './regions-monde';

const rendus = vi.hoisted(() => ({ crees: [] as { trace: unknown; troncons: number }[] }));

vi.mock('../render/carte-monde', () => ({
  RenduCarteMonde: class {
    camera = { deplacer: vi.fn(), debutPincement: vi.fn(), pincement: vi.fn(), molette: vi.fn(), decalageX: 0, decalageY: 0, vueL: 512, vueH: 288, zoom: 2 };
    ratio = 1;
    rayonToucher = 20;
    cadrer = vi.fn();
    centrerSur = vi.fn();
    redimensionner = vi.fn();
    dessiner = vi.fn();
    enMondeX = (x: number): number => x;
    enMondeY = (y: number): number => y;
    constructor(_canvas: unknown, _atlas: unknown, trace: unknown, _decor: unknown, troncons: number) {
      rendus.crees.push({ trace, troncons });
    }
  },
}));

const ATLAS = { iconeUrl: () => 'icone.png', sprite: () => undefined } as unknown as AtlasRendu;

/** Le niveau sans ses familles imposées (les niveaux de la campagne en ont tous un). */
function sansFer(niveau: NiveauCampagne['niveau']): NiveauCampagne['niveau'] {
  return Object.fromEntries(Object.entries(niveau).filter(([cle]) => cle !== 'defiFer')) as NiveauCampagne['niveau'];
}

/** Une région de la campagne : les niveaux de la région 1 renumérotés à partir de `premier`, avec le défi Fer sur certains. */
function regionCopiee(numero: number, premier: number, livree: boolean): RegionMonde {
  const niveaux: NiveauCampagne[] = REGION1.map((n, i) => ({
    ...n,
    numero: premier + i,
    niveau: i % 2 === 0 ? { ...n.niveau, defiFer: { familles: ['tir', 'caserne'] as [string, string] } } : sansFer(n.niveau),
  }));
  return {
    numero,
    nom: `region.${String(numero)}` as RegionMonde['nom'],
    premierNiveau: premier,
    contenu: livree
      ? {
          niveaux,
          noeuds: NOEUDS_REGION1.map((n) => ({ ...n, numero: n.numero })),
          trace: TRACE_REGION1,
          decor: [],
          textes: TEXTES_REGION1.map((x) => ({ ...x, numero: premier + x.numero - 1 })),
        }
      : null,
  };
}

const REGIONS: readonly RegionMonde[] = [
  regionCopiee(1, 1, true),
  regionCopiee(2, 11, true),
  regionCopiee(3, 21, false),
  regionCopiee(4, 31, false),
  regionCopiee(5, 41, false),
];

type Succes = { ok: true; sauvegarde: Sauvegarde; ecrite: boolean };

function fausseSession(sauvegarde: Sauvegarde) {
  const accepte = (): Promise<Succes> => Promise.resolve({ ok: true, sauvegarde, ecrite: true });
  return {
    sauvegarde,
    choisirHeros: vi.fn<(dieu: string, heros: string) => Promise<Succes | { ok: false; raison: RaisonChoix }>>(accepte),
    equiperObjets: vi.fn<(objets: readonly string[]) => Promise<Succes | { ok: false; raison: RaisonEquipement }>>(accepte),
  };
}

/** Le joueur a battu le boss de la région 1 (région 2 ouverte), avec trois étoiles aux niveaux 1 et 11 et des défis réussis. */
function apresLeBoss(): Sauvegarde {
  const s = sauvegardeVide();
  const etoiles: Sauvegarde['progression']['etoiles'] = {};
  for (let n = 1; n <= 10; n++) etoiles[String(n)] = { matou: n === 1 ? 3 : 2 };
  etoiles['11'] = { matou: 3 };
  etoiles['12'] = { matou: 3 };
  return {
    ...s,
    progression: { niveauMax: 13, etoiles },
    meta: { ...s.meta, regionMax: 2, monnaies: { aretes: 50, braises: 10 }, defis: { '1': { heroique: true } } },
  };
}

function monter(sauvegarde: Sauvegarde, supplement: Partial<OptionsCarteMonde> = {}) {
  const session = fausseSession(sauvegarde);
  const surLancer = vi.fn();
  const surRegion = vi.fn();
  afficherCarteMonde(document.body, {
    atlas: ATLAS,
    session,
    difficulte: 'matou',
    surLancer,
    surOptions: vi.fn(),
    surHeros: vi.fn(),
    surBoutique: vi.fn(),
    surRetour: vi.fn(),
    surRegion,
    regions: REGIONS,
    ...supplement,
  });
  return { session, surLancer, surRegion };
}

function appuyer(touche: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: touche, bubbles: true }));
}

const puce = (numero: number): HTMLButtonElement => {
  const b = document.querySelector<HTMLButtonElement>(`[data-cle="region:${String(numero)}"]`);
  if (!b) throw new Error(`pastille absente : ${String(numero)}`);
  return b;
};
const mode = (nom: string): HTMLButtonElement => {
  const b = document.querySelector<HTMLButtonElement>(`[data-cle="mode:${nom}"]`);
  if (!b) throw new Error(`mode absent : ${nom}`);
  return b;
};
/** Ouvre la fiche du niveau `cible` en partant du nœud sélectionné `depuis` (flèches du clavier, puis Entrée). */
function ouvrir(depuis: number, cible: number): void {
  for (let n = depuis; n !== cible; n += cible > depuis ? 1 : -1) appuyer(cible > depuis ? 'ArrowRight' : 'ArrowLeft');
  appuyer('Enter');
}
const nomRegion = (): string => document.querySelector('.region-nom')?.textContent ?? '';
const titre = (): string => document.querySelector('.carte-titre')?.textContent ?? '';
const messageFiche = (): string => document.querySelector('.fiche-message')?.textContent ?? '';
const fiche = (): Element | null => document.querySelector('.ecran.fiche');

beforeEach(() => {
  rendus.crees.length = 0;
  vi.stubGlobal('requestAnimationFrame', (): number => 1);
  vi.stubGlobal('cancelAnimationFrame', (): void => undefined);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('carte du monde : régions', () => {
  it('un nouveau joueur voit la région 1 et les quatre autres grisées avec un cadenas', () => {
    monter(sauvegardeVide());
    expect(document.querySelectorAll('.region-puce')).toHaveLength(5);
    expect(puce(1).classList.contains('actif')).toBe(true);
    for (const n of [2, 3, 4, 5]) {
      expect(puce(n).classList.contains('grise'), `région ${String(n)}`).toBe(true);
      expect(puce(n).getAttribute('aria-disabled')).toBe('true');
      expect(puce(n).querySelector('img.cadenas')).not.toBeNull();
    }
    expect(puce(1).querySelector('img.cadenas')).toBeNull();
    expect(nomRegion()).toBe(t('carte.region_nom', { n: 1, nom: 'Le Village Affamé' }));
    expect(titre()).toBe(t('carte.niveau', { n: 1, nom: 'La Porte Ouverte' }));
  });

  it('toucher une région fermée dit comment l’ouvrir et ne change pas de région', () => {
    monter(sauvegardeVide());
    puce(2).click();
    expect(nomRegion()).toBe(t('carte.region_fermee', { n: 2, m: 1 }));
    expect(puce(1).classList.contains('actif')).toBe(true);
    expect(rendus.crees).toHaveLength(1);
  });

  it('s’ouvre sur la plus haute région ouverte, avec ses niveaux numérotés pour la campagne', () => {
    monter(apresLeBoss());
    expect(puce(2).classList.contains('actif')).toBe(true);
    expect(puce(3).classList.contains('grise')).toBe(true);
    expect(titre()).toBe(t('carte.niveau', { n: 13, nom: 'La Route des Pendus' }));
    // Les nœuds de la région 2 se lisent sur les niveaux 11 à 13 de la sauvegarde : trois nœuds visibles, deux tronçons.
    expect(rendus.crees[0]?.troncons).toBe(2);
  });

  it('une région ouverte se touche pour y aller, le rendu est refait pour elle et la région est signalée', () => {
    const { surRegion } = monter(apresLeBoss(), { region: 1 });
    expect(puce(1).classList.contains('actif')).toBe(true);
    expect(rendus.crees).toHaveLength(1);
    expect(rendus.crees[0]?.troncons).toBe(9);
    puce(2).click();
    expect(puce(2).classList.contains('actif')).toBe(true);
    expect(rendus.crees).toHaveLength(2);
    expect(rendus.crees[1]?.troncons).toBe(2);
    expect(surRegion).toHaveBeenCalledWith(2);
    expect(titre()).toBe(t('carte.niveau', { n: 13, nom: 'La Route des Pendus' }));
  });

  it('les flèches et Page haut, Page bas suivent les régions ouvertes sans entrer dans une région fermée', () => {
    monter(apresLeBoss(), { region: 1 });
    const suivante = document.querySelector<HTMLButtonElement>('.region-fleche[aria-label="' + t('carte.region_suivante') + '"]');
    const precedente = document.querySelector<HTMLButtonElement>('.region-fleche[aria-label="' + t('carte.region_precedente') + '"]');
    expect(precedente?.getAttribute('aria-disabled')).toBe('true');
    expect(suivante?.getAttribute('aria-disabled')).toBe('false');
    suivante?.click();
    expect(puce(2).classList.contains('actif')).toBe(true);
    expect(suivante?.getAttribute('aria-disabled')).toBe('true');
    suivante?.click();
    expect(puce(2).classList.contains('actif')).toBe(true);
    expect(nomRegion()).toBe(t('carte.region_fermee', { n: 3, m: 2 }));
    appuyer('PageUp');
    expect(puce(1).classList.contains('actif')).toBe(true);
    appuyer('PageDown');
    expect(puce(2).classList.contains('actif')).toBe(true);
    appuyer('PageDown');
    expect(puce(2).classList.contains('actif')).toBe(true);
  });

  it('les quinze régions : la 11 s’ouvre avec le niveau 100 gagné, les 12 à 15 restent verrouillées', () => {
    const s = sauvegardeVide();
    monter({ ...s, progression: { ...s.progression, niveauMax: 101 }, meta: { ...s.meta, regionMax: 11 } }, { regions: REGIONS_MONDE });
    expect(document.querySelectorAll('.region-puce')).toHaveLength(15);
    // Les quinze pastilles sont dans leur bande défilante, entre les deux flèches.
    expect(document.querySelector('.region-puces')?.children).toHaveLength(15);
    expect(puce(11).classList.contains('actif')).toBe(true);
    expect(nomRegion()).toBe(t('carte.region_nom', { n: 11, nom: 'Les Grèves Grises' }));
    // La région 11 est livrée : ses nœuds s'affichent, pas l'annonce « à venir ».
    expect((document.querySelector('.carte-region-vide') as HTMLElement).hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.carte-monde')?.style.getPropertyValue('--region-brume')).not.toBe('');
    for (let n = 1; n <= 11; n++) expect(puce(n).classList.contains('grise'), `région ${String(n)}`).toBe(false);
    for (let n = 12; n <= 15; n++) {
      expect(puce(n).classList.contains('grise'), `région ${String(n)}`).toBe(true);
      expect(puce(n).querySelector('img.cadenas')).not.toBeNull();
    }
    puce(12).click();
    expect(nomRegion()).toBe(t('carte.region_fermee', { n: 12, m: 11 }));
    expect(puce(11).classList.contains('actif')).toBe(true);
  });

  it('une région ouverte dont les niveaux ne sont pas livrés l’annonce, sans nœud ni fiche', () => {
    const s = apresLeBoss();
    monter({ ...s, progression: { ...s.progression, niveauMax: 22 }, meta: { ...s.meta, regionMax: 3 } });
    expect(puce(3).classList.contains('actif')).toBe(true);
    expect(document.querySelector('.carte-region-vide')?.textContent).toBe(t('carte.region_bientot'));
    expect((document.querySelector('.carte-region-vide') as HTMLElement).hidden).toBe(false);
    appuyer('Enter');
    expect(fiche()).toBeNull();
    puce(2).click();
    expect((document.querySelector('.carte-region-vide') as HTMLElement).hidden).toBe(true);
  });

  it('pas de changement de région pendant qu’une fiche est ouverte', () => {
    monter(apresLeBoss(), { region: 1 });
    appuyer('Enter');
    expect(fiche()).not.toBeNull();
    appuyer('PageDown');
    puce(2).click();
    expect(puce(1).classList.contains('actif')).toBe(true);
  });
});

describe('fiche de niveau : Normal, Héroïque, Fer', () => {
  it('niveau pas à trois étoiles : les défis sont grisés et expliquent ce qui manque', () => {
    monter(apresLeBoss(), { region: 1 });
    ouvrir(10, 2); // niveau 2 : 2 étoiles
    expect(document.querySelector('.ecran.fiche .fiche-numero')?.textContent).toBe(t('accueil.niveau', { n: 2 }));
    expect(mode('normal').classList.contains('actif')).toBe(true);
    for (const defi of ['heroique', 'fer']) {
      expect(mode(defi).classList.contains('grise')).toBe(true);
      expect(mode(defi).getAttribute('aria-disabled')).toBe('true');
    }
    mode('heroique').click();
    expect(messageFiche()).toBe(t('fiche.mode_trois_etoiles'));
    expect(mode('normal').classList.contains('actif')).toBe(true);
  });

  it('niveau à trois étoiles : Héroïque s’ouvre, cache la difficulté et les objets, donne les règles et la prime', () => {
    monter(apresLeBoss(), { region: 1 });
    // Le niveau 1 a 3 étoiles et le défi Héroïque déjà réussi ; on le prend tout de même.
    ouvrir(10, 1);
    expect(mode('heroique').classList.contains('grise')).toBe(false);
    expect(mode('heroique').classList.contains('reussi')).toBe(true);
    mode('heroique').click();
    expect(mode('heroique').classList.contains('actif')).toBe(true);
    expect((document.querySelector('.difficultes') as HTMLElement).hidden).toBe(true);
    const regles = document.querySelector('.defi-regles') as HTMLElement;
    expect(regles.hidden).toBe(false);
    expect(regles.textContent).toContain(t('fiche.defi_heroique'));
    expect(regles.textContent).toContain(t('fiche.defi_regles'));
    expect(regles.textContent).toContain(t('fiche.defi_deja'));
    expect(document.querySelector('.choix-slot')).toBeNull();
    expect(document.querySelector('.choix-fiche')?.textContent).toContain(t('fiche.defi_sans_objet'));
  });

  it('Fer affiche les deux familles imposées et la prime de première réussite', () => {
    monter(apresLeBoss(), { region: 1 });
    ouvrir(10, 1);
    mode('fer').click();
    const regles = document.querySelector('.defi-regles')?.textContent ?? '';
    expect(regles).toContain(t('fiche.defi_fer'));
    expect(regles).toContain(t('fiche.defi_familles', { noms: 'Tir, Caserne' }));
    expect(regles).toContain(t('fiche.defi_prime', { n: 4 }));
    expect(regles).not.toContain(t('fiche.defi_deja'));
  });

  it('un niveau sans défi Fer le dit, même à trois étoiles', () => {
    // Région 2 : le niveau 11 (indice 0) porte des familles, le 12 non (voir regionCopiee) ; les deux ont 3 étoiles.
    monter(apresLeBoss(), { region: 2 });
    ouvrir(13, 11);
    expect(mode('fer').classList.contains('grise')).toBe(false);
    document.body.replaceChildren();
    monter(apresLeBoss(), { region: 2 });
    ouvrir(13, 12);
    expect(mode('heroique').classList.contains('grise')).toBe(false);
    expect(mode('fer').classList.contains('grise')).toBe(true);
    mode('fer').click();
    expect(messageFiche()).toBe(t('fiche.mode_pas_de_fer'));
  });

  it('« Lancer » en Héroïque transmet le défi et Matou, même si une autre difficulté était cochée', () => {
    const { surLancer } = monter(apresLeBoss(), { region: 1, difficulte: 'vieux_sage' });
    ouvrir(10, 1);
    mode('heroique').click();
    (document.querySelector('.rangee .bouton.grand') as HTMLButtonElement).click();
    expect(surLancer).toHaveBeenCalledTimes(1);
    const [niveau, difficulte, , defi] = surLancer.mock.calls[0] as [NiveauCampagne, string, unknown, string | null];
    expect(niveau.numero).toBe(1);
    expect(difficulte).toBe('matou');
    expect(defi).toBe('heroique');
  });

  it('« Lancer » en Fer envoie le défi Fer ; en Normal, le défi est null et la difficulté choisie reste', () => {
    const { surLancer } = monter(apresLeBoss(), { region: 1, difficulte: 'chaton' });
    ouvrir(10, 1);
    mode('fer').click();
    (document.querySelector('.rangee .bouton.grand') as HTMLButtonElement).click();
    expect((surLancer.mock.calls[0] as unknown[])[3]).toBe('fer');
    document.body.replaceChildren();
    const autre = monter(apresLeBoss(), { region: 1, difficulte: 'chaton' });
    ouvrir(10, 1);
    (document.querySelector('.rangee .bouton.grand') as HTMLButtonElement).click();
    const appel = autre.surLancer.mock.calls[0] as unknown[];
    expect(appel[1]).toBe('chaton');
    expect(appel[3]).toBeNull();
  });

  it('un niveau d’une autre région se lance avec son numéro de campagne', () => {
    const { surLancer } = monter(apresLeBoss(), { region: 2 });
    ouvrir(13, 12);
    expect(document.querySelector('.ecran.fiche .fiche-numero')?.textContent).toBe(t('accueil.niveau', { n: 12 }));
    mode('normal').click();
    (document.querySelector('.rangee .bouton.grand') as HTMLButtonElement).click();
    expect((surLancer.mock.calls[0] as [NiveauCampagne])[0].numero).toBe(12);
  });

  it('quitter le défi rend la difficulté et les objets', () => {
    monter(apresLeBoss(), { region: 1 });
    ouvrir(10, 1);
    mode('heroique').click();
    mode('normal').click();
    expect((document.querySelector('.difficultes') as HTMLElement).hidden).toBe(false);
    expect((document.querySelector('.defi-regles') as HTMLElement).hidden).toBe(true);
    expect(document.querySelector('.choix-slot')).not.toBeNull();
  });
});
