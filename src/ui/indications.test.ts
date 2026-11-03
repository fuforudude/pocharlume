// @vitest-environment happy-dom
// Indications de départ et d'arrivée : la composition annoncée à chaque entrée est celle de la prochaine vague, le panneau
// disparaît quand la vague part et revient avant la suivante, la porte réagit à une fuite, la traînée part au début du
// niveau et respecte « réduire les animations ». Le rendu est remplacé par une projection simple (1 tuile = 16 px).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPAGNE, niveauDeCampagne } from '../data/niveaux/campagne';
import { VERSION_DONNEES } from '../data/version';
import { ajouterEnnemi, avancer, creerPartie } from '../engine';
import type { Action, ConfigPartie, EtatPartie, Vague } from '../engine';
import { defEnnemi } from '../engine/contenu';
import type { AtlasRendu } from '../render/atlas';
import { fermerBulle } from './bulle';
import {
  compositionParChemin,
  DUREE_SECOUSSE_MS,
  DUREE_TRAINEE_MS,
  Indications,
  panneauxVisibles,
  prochaineVague,
  TYPES_MAX_PAR_PANNEAU,
} from './indications';

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;
const PROJECTION = { pixelsCssParTuile: 16, enCssX: (x: number): number => x * 16, enCssY: (y: number): number => y * 16 };
const CONFIG: ConfigPartie = { graine: 7, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

function entrees(niveau: (typeof CAMPAGNE)[number]): number {
  return new Set(niveau.niveau.carte.chemins.map((c) => `${String(c.points[0]?.x)},${String(c.points[0]?.y)}`)).size;
}

/** Un niveau de la campagne avec plusieurs entrées distinctes. */
const MULTI = CAMPAGNE.find((n) => entrees(n) >= 2);
if (!MULTI) throw new Error('aucun niveau à plusieurs entrées');

function nouvellePartie(): EtatPartie {
  return creerPartie(MULTI?.niveau as NonNullable<typeof MULTI>['niveau'], CONFIG);
}

interface Montage {
  readonly etat: EtatPartie;
  readonly indications: Indications;
  readonly controleur: AbortController;
}

function monter(options: { reduit?: boolean; etat?: EtatPartie; temps?: number; maintenant?: () => number } = {}): Montage {
  const etat = options.etat ?? nouvellePartie();
  const controleur = new AbortController();
  const reduit = options.reduit ?? false;
  const indications = new Indications(document.body, ATLAS, PROJECTION, etat, controleur.signal, options.temps ?? 0, { reduit: () => reduit, ...(options.maintenant ? { maintenant: options.maintenant } : {}) });
  return { etat, indications, controleur };
}

/** Ce qu'affichent les panneaux visibles : pour chaque panneau, ses pastilles `type:nombre`. */
function affiche(): string[][] {
  return [...document.querySelectorAll<HTMLElement>('.entree-chemin')]
    .filter((p) => !p.hidden)
    .map((p) => [...p.querySelectorAll<HTMLElement>('.puce-ennemi[data-type]')].map((c) => `${c.dataset['type'] ?? ''}:${c.dataset['nombre'] ?? ''}`));
}

/** Ce que la vague doit sortir à chaque entrée distincte (les chemins qui partent du même point sont réunis). */
function attendu(etat: EtatPartie, vague: Vague): string[][] {
  const parEntree = new Map<string, Map<string, number>>();
  etat.chemins.forEach((chemin, i) => {
    const debut = chemin.points[0];
    const cle = `${String(debut?.x)},${String(debut?.y)}`;
    const cumul = parEntree.get(cle) ?? new Map<string, number>();
    for (const p of vague.paquets) if (p.chemin === i) cumul.set(p.ennemi, (cumul.get(p.ennemi) ?? 0) + p.nombre);
    parEntree.set(cle, cumul);
  });
  return [...parEntree.values()]
    .filter((m) => m.size > 0)
    .map((m) => [...m.entries()].slice(0, TYPES_MAX_PAR_PANNEAU).map(([type, n]) => `${type}:${String(n)}`));
}

/** Une partie dont chaque vague n'a qu'un paquet d'un ennemi, sans délai, sur le chemin donné. */
function partieAvecVagues(chemins: readonly (readonly number[])[]): EtatPartie {
  const niveau = (MULTI as NonNullable<typeof MULTI>).niveau;
  const vagues: Vague[] = chemins.map((cs) => ({ paquets: cs.map((chemin) => ({ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin, delai: 0 })) }));
  return creerPartie({ ...niveau, vagues }, CONFIG);
}

function paquet(vague: number, chemin: number, ennemi = 'paysan_affame'): EtatPartie['vagues']['paquets'][number] {
  return { vague, ennemi, chemin, restants: 1, intervalle: 1, prochain: 0, elite: false, facteurPv: 1 };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
});

afterEach(() => {
  fermerBulle();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('composition par chemin', () => {
  it('chaque vague de chaque niveau : les nombres par chemin et par type sont ceux des paquets', () => {
    for (const niveau of CAMPAGNE) {
      const chemins = niveau.niveau.carte.chemins.length;
      for (const vague of niveau.niveau.vagues) {
        const compo = compositionParChemin(vague, chemins);
        expect(compo).toHaveLength(chemins);
        for (let c = 0; c < chemins; c++) {
          const groupes = compo[c] ?? [];
          expect(groupes.reduce((s, g) => s + g.nombre, 0)).toBe(vague.paquets.filter((p) => p.chemin === c).reduce((s, p) => s + p.nombre, 0));
          expect(new Set(groupes.map((g) => g.type)).size).toBe(groupes.length);
        }
      }
    }
  });

  it('réunit deux paquets du même type sur un même chemin', () => {
    const vague: Vague = {
      paquets: [
        { ennemi: 'paysan_affame', nombre: 3, intervalle: 1, chemin: 0, delai: 0 },
        { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 1 },
        { ennemi: 'paysan_affame', nombre: 2, intervalle: 1, chemin: 0, delai: 5 },
        { ennemi: 'paysan_affame', nombre: 4, intervalle: 1, chemin: 1, delai: 0 },
      ],
    };
    expect(compositionParChemin(vague, 2)).toEqual([
      [{ type: 'paysan_affame', nombre: 5 }, { type: 'mendiant', nombre: 1 }],
      [{ type: 'paysan_affame', nombre: 4 }],
    ]);
  });
});

describe('panneaux d’entrée', () => {
  it('montrent, à chaque entrée, la composition de la prochaine vague, vague après vague', () => {
    const { etat, indications } = monter();
    const vagues = etat.niveau.vagues;
    for (let k = 0; k < vagues.length; k++) {
      etat.vagues.lancees = k;
      indications.mettreAJour(etat, 0);
      expect(affiche()).toEqual(attendu(etat, vagues[k] as Vague));
    }
  });

  it('un panneau laisse passer les clics : seules les pastilles les captent', () => {
    const { etat, indications } = monter();
    indications.mettreAJour(etat, 0);
    const panneau = document.querySelector<HTMLElement>('.entree-chemin');
    expect(panneau?.style.pointerEvents).toBe('none');
    // Les pastilles non plus ne captent rien : un toucher court atteint toujours la case dessous.
    expect(document.querySelector<HTMLElement>('.puce-ennemi')?.style.pointerEvents).not.toBe('auto');
    expect(document.querySelector('.puce-ennemi')?.getAttribute('role')).toBe('img');
    expect(document.querySelector('.puce-ennemi')?.getAttribute('aria-label')).toContain('par cette entrée');
    expect(document.querySelector<HTMLElement>('.indications')?.parentElement).toBe(document.body);
  });

  it('disparaissent quand la vague part et reviennent quand elle a fini d’apparaître', () => {
    const { etat, indications } = monter();
    indications.mettreAJour(etat, 0);
    expect(affiche().length).toBeGreaterThan(0);
    expect(panneauxVisibles(etat)).toBe(true);

    // La vague part : ses paquets attendent d'apparaître.
    etat.vagues.lancees = 1;
    etat.vagues.paquets.push(paquet(0, 0));
    indications.mettreAJour(etat, 100);
    expect(affiche()).toEqual([]);
    expect(panneauxVisibles(etat)).toBe(false);

    // Tous les ennemis sont apparus : le panneau annonce la vague suivante.
    etat.vagues.paquets.length = 0;
    indications.mettreAJour(etat, 200);
    expect(affiche()).toEqual(attendu(etat, etat.niveau.vagues[1] as Vague));
  });

  it('ne montrent plus rien après la dernière vague, ni quand la partie est finie', () => {
    const { etat, indications } = monter();
    etat.vagues.lancees = etat.niveau.vagues.length;
    expect(prochaineVague(etat)).toBeNull();
    indications.mettreAJour(etat, 0);
    expect(affiche()).toEqual([]);
    etat.vagues.lancees = 0;
    etat.statut = 'defaite';
    indications.mettreAJour(etat, 0);
    expect(affiche()).toEqual([]);
  });

  it('en mode infini, annoncent la vague que le générateur va produire', () => {
    const etat = creerPartie((MULTI).niveau, { ...CONFIG, infini: { region: 1 } });
    const { indications } = monter({ etat });
    indications.mettreAJour(etat, 0);
    const vague = prochaineVague(etat) as Vague;
    expect(vague.paquets.length).toBeGreaterThan(0);
    expect(affiche()).toEqual(attendu(etat, vague));
  });

  it('une pastille est retrouvée sous le pointeur (pour sa bulle) et ne l’est plus quand le panneau se masque', () => {
    const { etat, indications } = monter();
    indications.mettreAJour(etat, 0);
    const puce = document.querySelector<HTMLElement>('.puce-ennemi[data-type]');
    if (!puce) throw new Error('pastille absente');
    puce.getBoundingClientRect = (): DOMRect => ({ left: 100, top: 50, right: 130, bottom: 80, width: 30, height: 30, x: 100, y: 50, toJSON: () => ({}) });
    expect(indications.puceSous(10, 10)).toBeNull();
    const trouvee = indications.puceSous(115, 65);
    expect(trouvee?.type).toBe(puce.dataset['type']);
    expect(trouvee?.cle).toBeLessThan(0);
    expect(trouvee?.encore()).toBe(true);
    // Un peu à côté compte aussi (tolérance d'un doigt).
    expect(indications.puceSous(133, 65)).not.toBeNull();
    etat.vagues.paquets.push(paquet(0, 0));
    indications.mettreAJour(etat, 10);
    expect(trouvee?.encore()).toBe(false);
    expect(indications.puceSous(115, 65)).toBeNull();
  });

  it('un panneau d’une entrée en haut de la carte ne passe jamais sous la barre du HUD', () => {
    const niveau = CAMPAGNE.find((n) => n.niveau.id === 'r1-02');
    if (!niveau) throw new Error('r1-02 absent');
    const etat = creerPartie(niveau.niveau, CONFIG);
    const haut = etat.chemins.some((c) => (c.points[0]?.y ?? 99) <= 0);
    expect(haut).toBe(true);
    const { indications } = monter({ etat });
    indications.definirMarges({ haut: 44, bas: 60, gauche: 0, droite: 0 });
    indications.mettreAJour(etat, 0);
    const panneaux = [...document.querySelectorAll<HTMLElement>('.entree-chemin')].filter((p) => !p.hidden);
    expect(panneaux.length).toBeGreaterThan(0);
    for (const p of panneaux) expect(Number.parseFloat(p.style.top)).toBeGreaterThanOrEqual(44);
  });

  it('au redimensionnement ou à la rotation, la largeur des panneaux est remesurée (le panneau est refait)', () => {
    const { etat, indications } = monter();
    indications.mettreAJour(etat, 0);
    const avant = document.querySelector('.puce-ennemi');
    indications.mettreAJour(etat, 1);
    expect(document.querySelector('.puce-ennemi')).toBe(avant);
    indications.redimensionner();
    indications.mettreAJour(etat, 2);
    expect(document.querySelector('.puce-ennemi')).not.toBe(avant);
  });
});

describe('porte de sortie', () => {
  it('tremble et rougit quand un ennemi sort, puis se calme', () => {
    let horloge = 1000;
    const { etat, indications } = monter({ maintenant: () => horloge });
    const portes = [...document.querySelectorAll<HTMLElement>('.sortie-chemin')];
    expect(portes.length).toBeGreaterThan(0);
    expect(portes.some((p) => p.classList.contains('rougit'))).toBe(false);

    const def = defEnnemi('paysan_affame');
    if (!def) throw new Error('ennemi absent');
    ajouterEnnemi(etat, def, 'paysan_affame', 0, 0, false, {});
    const ennemi = etat.ennemis[etat.ennemis.length - 1];
    if (!ennemi) throw new Error('ennemi non créé');
    indications.apresPas(etat);
    indications.evenement(etat, { type: 'fuite', ennemi: ennemi.id, vies: 1 }, 1000);
    horloge = 1100;
    indications.mettreAJour(etat, 1100);
    const reagit = [...document.querySelectorAll<HTMLElement>('.sortie-chemin')].filter((p) => p.classList.contains('rougit'));
    expect(reagit.length).toBeGreaterThan(0);
    expect(reagit.every((p) => p.classList.contains('secoue'))).toBe(true);

    horloge = 1000 + DUREE_SECOUSSE_MS + 1;
    indications.mettreAJour(etat, 1000 + DUREE_SECOUSSE_MS + 1);
    expect(document.querySelector('.sortie-chemin.rougit')).toBeNull();
    expect(document.querySelector('.sortie-chemin.secoue')).toBeNull();
  });

  it('avec « réduire les animations » la porte rougit sans trembler', () => {
    const { etat, indications } = monter({ reduit: true });
    indications.evenement(etat, { type: 'fuite', ennemi: -1, vies: 1 }, 0);
    indications.mettreAJour(etat, 10);
    expect(document.querySelector('.sortie-chemin.rougit')).not.toBeNull();
    expect(document.querySelector('.sortie-chemin.secoue')).toBeNull();
    expect(document.querySelector('.indications')?.classList.contains('animations-reduites')).toBe(true);
  });
});

describe('traînée des chemins', () => {
  it('part sur chaque chemin au début du niveau et s’éteint au bout de la durée', () => {
    const { etat, indications } = monter({ temps: 500 });
    expect(indications.cheminsEnTrainee).toEqual(etat.chemins.map((_, i) => i));
    indications.mettreAJour(etat, 500 + DUREE_TRAINEE_MS - 1);
    expect(indications.cheminsEnTrainee).toHaveLength(etat.chemins.length);
    indications.mettreAJour(etat, 500 + DUREE_TRAINEE_MS);
    expect(indications.cheminsEnTrainee).toEqual([]);
  });

  it('repart la première fois qu’un chemin sert, pas pour un chemin déjà annoncé', () => {
    const etat = partieAvecVagues([[0], [0], [1], [1]]);
    const { indications } = monter({ etat });
    indications.mettreAJour(etat, DUREE_TRAINEE_MS + 10);
    expect(indications.cheminsEnTrainee).toEqual([]);

    // Les vagues 0 et 1 n'empruntent que le chemin 0, déjà annoncé au début.
    indications.evenement(etat, { type: 'vague', index: 0, bonus: 0 }, 3000);
    indications.evenement(etat, { type: 'vague', index: 1, bonus: 0 }, 6000);
    expect(indications.cheminsEnTrainee).toEqual([]);

    // La vague 2 emprunte le chemin 1 pour la première fois, même si son paquet est déjà sorti à ce pas.
    indications.evenement(etat, { type: 'vague', index: 2, bonus: 0 }, 9000);
    expect(indications.cheminsEnTrainee).toEqual([1]);
    // Une seconde fois : le chemin est déjà servi.
    indications.mettreAJour(etat, 9000 + DUREE_TRAINEE_MS);
    indications.evenement(etat, { type: 'vague', index: 3, bonus: 0 }, 20_000);
    expect(indications.cheminsEnTrainee).toEqual([]);
  });

  it('avec « réduire les animations » aucune traînée ne part', () => {
    const etat = partieAvecVagues([[0], [1]]);
    const { indications } = monter({ reduit: true, etat });
    expect(indications.cheminsEnTrainee).toEqual([]);
    indications.evenement(etat, { type: 'vague', index: 1, bonus: 0 }, 5000);
    expect(indications.cheminsEnTrainee).toEqual([]);
  });

  it('une partie reprise ne rejoue pas l’annonce des chemins déjà servis', () => {
    const etat = nouvellePartie();
    etat.vagues.lancees = 2;
    const { indications } = monter({ etat });
    indications.mettreAJour(etat, DUREE_TRAINEE_MS + 1);
    indications.evenement(etat, { type: 'vague', index: 2, bonus: 0 }, 5000);
    expect(indications.cheminsEnTrainee).toEqual([]);
  });
});

describe('avec le vrai moteur', () => {
  /** Joue un pas comme `partie.ts` : les événements du pas, puis `apresPas`. */
  function pas(etat: EtatPartie, indications: Indications, temps: number, actions: readonly Action[] = []): void {
    avancer(etat, actions);
    for (const ev of etat.evenements) indications.evenement(etat, ev, temps);
    indications.apresPas(etat);
  }

  it('r10-10 : la traînée d’un chemin neuf part même quand son paquet (1 ennemi, sans délai) est déjà sorti', () => {
    const niveau = niveauDeCampagne(100);
    if (!niveau) throw new Error('niveau 100 absent');
    const etat = creerPartie(niveau.niveau, CONFIG);
    const { indications } = monter({ etat });
    // La première vague dont un paquet unique et immédiat emprunte un chemin jamais servi avant.
    const vus = new Set((etat.niveau.vagues[0] as Vague).paquets.map((p) => p.chemin));
    let cible = -1;
    let neuf = -1;
    for (let k = 1; k < etat.niveau.vagues.length && cible < 0; k++) {
      const vague = etat.niveau.vagues[k] as Vague;
      const trouve = vague.paquets.find((p) => !vus.has(p.chemin) && p.nombre === 1 && p.delai === 0);
      if (trouve) {
        cible = k;
        neuf = trouve.chemin;
      }
      for (const p of vague.paquets) vus.add(p.chemin);
    }
    expect(cible).toBeGreaterThan(0);
    let temps = DUREE_TRAINEE_MS + 100;
    indications.mettreAJour(etat, temps);
    let garde = 0;
    let vu = false;
    while (etat.vagues.lancees <= cible && etat.statut === 'en_cours' && garde++ < 20_000) {
      temps += 33;
      const avant = etat.vagues.lancees;
      pas(etat, indications, temps, [{ type: 'appelerVague' }]);
      // La vague vient de partir : le paquet d'un seul ennemi sans délai est déjà sorti de la file des paquets.
      if (avant === cible && etat.vagues.lancees === cible + 1) {
        vu = true;
        expect(indications.cheminsEnTrainee).toContain(neuf);
      }
    }
    expect(vu).toBe(true);
  });

  it('une vraie fuite fait réagir la porte du chemin de l’ennemi, alors qu’il n’est plus dans etat.ennemis', () => {
    // Aucun niveau de la campagne n'a deux sorties : on sépare celles d'un niveau à deux chemins.
    const niveau = (MULTI).niveau;
    const [c0, c1] = niveau.carte.chemins;
    if (!c0 || !c1) throw new Error('deux chemins attendus');
    const fin = c1.points[c1.points.length - 1] ?? { x: 0, y: 0 };
    const separe = { points: [...c1.points.slice(0, -1), { x: fin.x + 5, y: fin.y + 5 }] };
    const etat = creerPartie({ ...niveau, carte: { ...niveau.carte, chemins: [c0, separe] } }, CONFIG);
    const { indications } = monter({ etat, maintenant: () => 5000 });
    const def = defEnnemi('paysan_affame');
    if (!def) throw new Error('ennemi absent');
    const chemin = 1;
    const ennemi = ajouterEnnemi(etat, def, 'paysan_affame', chemin, 0, false, {});
    pas(etat, indications, 0);
    const calcule = etat.chemins[chemin];
    if (!calcule) throw new Error('chemin absent');
    ennemi.distance = calcule.longueur - 0.001;
    ennemi.segment = calcule.points.length - 2;
    let fuite = false;
    for (let i = 0; i < 20 && !fuite; i++) {
      pas(etat, indications, 0);
      fuite = etat.evenements.some((e) => e.type === 'fuite');
    }
    expect(fuite).toBe(true);
    expect(etat.ennemis.some((e) => e.id === ennemi.id)).toBe(false);
    indications.mettreAJour(etat, 0);
    const reagit = [...document.querySelectorAll<HTMLElement>('.sortie-chemin')].map((p) => p.classList.contains('rougit'));
    expect(reagit.some(Boolean)).toBe(true);
    expect(reagit.every(Boolean)).toBe(false);
  });

  it('la porte tremble le même temps réel à la vitesse ×1 et ×2 (le temps de jeu n’y change rien)', () => {
    for (const facteur of [1, 2]) {
      document.body.replaceChildren();
      let horloge = 0;
      const { etat, indications } = monter({ maintenant: () => horloge });
      indications.evenement(etat, { type: 'fuite', ennemi: -1, vies: 1 }, 0);
      horloge = DUREE_SECOUSSE_MS - 1;
      indications.mettreAJour(etat, (DUREE_SECOUSSE_MS - 1) * facteur);
      expect(document.querySelector('.sortie-chemin.secoue')).not.toBeNull();
      horloge = DUREE_SECOUSSE_MS + 1;
      indications.mettreAJour(etat, (DUREE_SECOUSSE_MS + 1) * facteur);
      expect(document.querySelector('.sortie-chemin.secoue')).toBeNull();
    }
  });
});

describe('canvas de la traînée et préférence du système', () => {
  it('n’est effacé que s’il a dessiné à l’image précédente, et masqué sans traînée', () => {
    const clearRect = vi.fn();
    const cible: Record<string | symbol, unknown> = { clearRect };
    const ctx = new Proxy(cible, {
      get: (c, nom): unknown => (nom in c ? c[nom] : (): void => undefined),
      set: () => true,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const { etat, indications } = monter({ temps: 0 });
    const canvas = document.querySelector<HTMLCanvasElement>('canvas.trace');
    indications.mettreAJour(etat, 100);
    expect(canvas?.hidden).toBe(false);
    expect(clearRect).toHaveBeenCalledTimes(1);
    // La traînée finit : un dernier effacement, puis plus rien.
    indications.mettreAJour(etat, DUREE_TRAINEE_MS + 1);
    expect(canvas?.hidden).toBe(true);
    expect(clearRect).toHaveBeenCalledTimes(2);
    indications.mettreAJour(etat, DUREE_TRAINEE_MS + 50);
    indications.mettreAJour(etat, DUREE_TRAINEE_MS + 100);
    expect(clearRect).toHaveBeenCalledTimes(2);
  });

  it('crée la requête « réduire les animations » une seule fois', () => {
    const matchMedia = vi.fn(() => ({ matches: false }) as MediaQueryList);
    vi.stubGlobal('matchMedia', matchMedia);
    window.matchMedia = matchMedia;
    const etat = nouvellePartie();
    const indications = new Indications(document.body, ATLAS, PROJECTION, etat, new AbortController().signal, 0);
    for (let i = 0; i < 5; i++) indications.mettreAJour(etat, i);
    expect(matchMedia).toHaveBeenCalledTimes(1);
  });
});

describe('nettoyage', () => {
  it('le signal retire le calque', () => {
    const { controleur } = monter();
    expect(document.querySelector('.indications')).not.toBeNull();
    controleur.abort();
    expect(document.querySelector('.indications')).toBeNull();
  });
});
