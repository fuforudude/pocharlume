// @vitest-environment happy-dom
// Indications de départ et d'arrivée : la composition annoncée à chaque entrée est celle de la prochaine vague, le panneau
// disparaît quand la vague part et revient avant la suivante, la porte réagit à une fuite, la traînée part au début du
// niveau et respecte « réduire les animations ». Le rendu est remplacé par une projection simple (1 tuile = 16 px).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { VERSION_DONNEES } from '../data/version';
import { ajouterEnnemi, creerPartie } from '../engine';
import type { ConfigPartie, EtatPartie, Vague } from '../engine';
import { defEnnemi } from '../engine/contenu';
import { tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { DELAI_SURVOL_MS, fermerBulle } from './bulle';
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

function monter(options: { reduit?: boolean; etat?: EtatPartie; temps?: number } = {}): Montage {
  const etat = options.etat ?? nouvellePartie();
  const controleur = new AbortController();
  const reduit = options.reduit ?? false;
  const indications = new Indications(document.body, ATLAS, PROJECTION, etat, controleur.signal, options.temps ?? 0, { reduit: () => reduit });
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
    expect(document.querySelector<HTMLElement>('.puce-ennemi')?.style.pointerEvents).toBe('auto');
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

  it('la bulle d’une pastille décrit l’ennemi au survol de la souris', () => {
    const { etat, indications } = monter();
    indications.mettreAJour(etat, 0);
    const puce = document.querySelector<HTMLElement>('.puce-ennemi[data-type]');
    const type = puce?.dataset['type'] ?? '';
    expect(type).not.toBe('');
    puce?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', bubbles: true }));
    vi.advanceTimersByTime(DELAI_SURVOL_MS);
    const bulle = document.querySelector<HTMLElement>('.bulle');
    expect(bulle?.hidden).toBe(false);
    expect(bulle?.textContent).toContain(tCle(ENNEMIS[type as keyof typeof ENNEMIS].nom));
  });
});

describe('porte de sortie', () => {
  it('tremble et rougit quand un ennemi sort, puis se calme', () => {
    const { etat, indications } = monter();
    const portes = [...document.querySelectorAll<HTMLElement>('.sortie-chemin')];
    expect(portes.length).toBeGreaterThan(0);
    expect(portes.some((p) => p.classList.contains('rougit'))).toBe(false);

    const def = defEnnemi('paysan_affame');
    if (!def) throw new Error('ennemi absent');
    ajouterEnnemi(etat, def, 'paysan_affame', 0, 0, false, {});
    const ennemi = etat.ennemis[etat.ennemis.length - 1];
    if (!ennemi) throw new Error('ennemi non créé');
    indications.evenement(etat, { type: 'fuite', ennemi: ennemi.id, vies: 1 }, 1000);
    indications.mettreAJour(etat, 1100);
    const reagit = [...document.querySelectorAll<HTMLElement>('.sortie-chemin')].filter((p) => p.classList.contains('rougit'));
    expect(reagit.length).toBeGreaterThan(0);
    expect(reagit.every((p) => p.classList.contains('secoue'))).toBe(true);

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
    const etat = nouvellePartie();
    // Un chemin que la première vague n'emprunte pas, s'il y en a un.
    const premiere = etat.niveau.vagues[0] as Vague;
    const emprunte = premiere.paquets.map((p) => p.chemin);
    const absent = etat.chemins.findIndex((_, i) => !emprunte.includes(i));
    const { indications } = monter({ etat });
    indications.mettreAJour(etat, DUREE_TRAINEE_MS + 10);
    expect(indications.cheminsEnTrainee).toEqual([]);

    // La première vague part : ses chemins ont déjà eu leur traînée au début.
    etat.vagues.paquets.push(...premiere.paquets.map((p) => paquet(0, p.chemin, p.ennemi)));
    indications.evenement(etat, { type: 'vague', index: 0, bonus: 0 }, 3000);
    expect(indications.cheminsEnTrainee).toEqual([]);

    if (absent >= 0) {
      etat.vagues.paquets.push(paquet(1, absent));
      indications.evenement(etat, { type: 'vague', index: 1, bonus: 0 }, 9000);
      expect(indications.cheminsEnTrainee).toEqual([absent]);
      // Une seconde fois : le chemin est déjà servi.
      indications.mettreAJour(etat, 9000 + DUREE_TRAINEE_MS);
      etat.vagues.paquets.push(paquet(2, absent));
      indications.evenement(etat, { type: 'vague', index: 2, bonus: 0 }, 20_000);
      expect(indications.cheminsEnTrainee).toEqual([]);
    }
  });

  it('avec « réduire les animations » aucune traînée ne part', () => {
    const { etat, indications } = monter({ reduit: true });
    expect(indications.cheminsEnTrainee).toEqual([]);
    etat.vagues.paquets.push(paquet(1, 0));
    indications.evenement(etat, { type: 'vague', index: 1, bonus: 0 }, 5000);
    expect(indications.cheminsEnTrainee).toEqual([]);
  });

  it('une partie reprise ne rejoue pas l’annonce des chemins déjà servis', () => {
    const etat = nouvellePartie();
    etat.vagues.lancees = 2;
    const { indications } = monter({ etat });
    indications.mettreAJour(etat, DUREE_TRAINEE_MS + 1);
    etat.vagues.paquets.push(paquet(2, 0));
    indications.evenement(etat, { type: 'vague', index: 2, bonus: 0 }, 5000);
    expect(indications.cheminsEnTrainee).toEqual([]);
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
