// Les 9 héros (3 par dieu), leurs 4 compétences de 3 rangs chacun, l'expérience qui fait monter leur niveau.
// L'avatar d'un dieu a le même id que lui. Les noms et descriptions sont des clés de src/i18n/fr.ts.
// La 4e compétence est l'ultime : elle demande le niveau 6.
import type { CapacitesUnite, DefCompetenceHeros, DefHeros, ModUnite } from '../engine/definitions';
import { capacites, rangsUnite, type ValeursParRang } from './capacites';
import { NIVEAU_ULTIME } from './meta';

/** Expérience totale à atteindre pour passer aux niveaux 2 à 10 (l'indice 0 mène au niveau 2). */
export const SEUILS_XP: readonly number[] = [150, 350, 600, 900, 1300, 1800, 2400, 3100, 4000];


function competence(id: string, niveauRequis: number, valeurs: ValeursParRang<ModUnite>): DefCompetenceHeros {
  return {
    id,
    nom: `comp.${id}`,
    description: `comp.${id}.desc`,
    rangMax: 3,
    niveauRequis,
    ultime: niveauRequis >= NIVEAU_ULTIME,
    rangs: rangsUnite(valeurs),
  };
}

const ordinaire = (id: string, valeurs: ValeursParRang<ModUnite>): DefCompetenceHeros => competence(id, 1, valeurs);
const ultime = (id: string, valeurs: ValeursParRang<ModUnite>): DefCompetenceHeros => competence(id, NIVEAU_ULTIME, valeurs);

/** Champs communs à tous les héros ; chaque héros écrit ce qui le distingue. */
type ChampsHeros = Omit<DefHeros, 'nom' | 'role' | 'description' | 'dieu' | 'effets' | 'zone' | 'capacites' | 'resistance' | 'capacite'> &
  Partial<Pick<DefHeros, 'effets' | 'zone' | 'resistance' | 'capacite'>> & { capacites?: Partial<CapacitesUnite> };

function heros(id: string, dieu: string, champs: ChampsHeros): DefHeros {
  const { capacites: pouvoirs, ...stats } = champs;
  return {
    nom: `heros.${id}`,
    role: `heros.${id}.role`,
    description: `heros.${id}.desc`,
    dieu,
    effets: [],
    zone: null,
    resistance: 0,
    capacite: 1,
    ...stats,
    capacites: capacites(pouvoirs ?? {}),
  };
}

// --- Plume ---------------------------------------------------------------------------------------

const plume = heros('plume', 'plume', {
  pv: 300,
  pvParNiveau: 28,
  degats: [10, 16],
  degatsParNiveau: 1.5,
  cadence: 0.9,
  armure: 0,
  vitesse: 2,
  portee: 1.8,
  zone: { rayon: 0.7, effets: [{ type: 'ralentissement', chance: 0.5, duree: 1.5, valeur: 0.5 }] },
  capacites: { esquive: 0.3, critique: { chance: 0.2, multiplicateur: 2 } },
  competences: [
    ordinaire('pas_de_velours', { esquive: [0.05, 0.1, 0.15] }),
    ordinaire('griffe_fantome', { critique: [0.05, 0.1, 0.15] }),
    ordinaire('reflet_vendu', { vitesse: [0.1, 0.2, 0.3] }),
    ultime('ombre_premiere', { esquive: [0.1, 0.15, 0.2], degats: [0.2, 0.35, 0.5] }),
  ],
});

const suie = heros('suie', 'plume', {
  pv: 260,
  pvParNiveau: 24,
  degats: [12, 18],
  degatsParNiveau: 2,
  cadence: 1.1,
  armure: 0,
  vitesse: 2.2,
  portee: 1.8,
  capacites: { execution: 0.2 },
  competences: [
    ordinaire('lame_courte', { degats: [0.08, 0.16, 0.24] }),
    ordinaire('soif_de_sang', { execution: [0.04, 0.08, 0.12] }),
    ordinaire('fumee', { vitesse: [0.1, 0.2, 0.3], esquive: [0.05, 0.1, 0.15] }),
    ultime('cendre_et_silence', { execution: [0.06, 0.1, 0.15], cadence: [0.1, 0.2, 0.3] }),
  ],
});

const corbeau = heros('corbeau', 'plume', {
  pv: 220,
  pvParNiveau: 20,
  degats: [0, 0],
  degatsParNiveau: 2,
  cadence: 1,
  armure: 0,
  vitesse: 1.6,
  portee: 3.6,
  capacites: {
    ignoreArmure: 0.5,
    distance: { portee: 3.6, degats: [14, 22], cadence: 1, typeDegats: 'physique', volants: true, effets: [] },
  },
  competences: [
    ordinaire('oeil_noir', { portee: [0.4, 0.8, 1.2] }),
    ordinaire('bec_aiguise', { ignoreArmure: [0.1, 0.2, 0.3] }),
    ordinaire('plumes_de_nuit', { cadence: [0.1, 0.2, 0.3] }),
    ultime('festin', { degats: [0.25, 0.4, 0.6] }),
  ],
});

// --- Charlie -------------------------------------------------------------------------------------

const charlie = heros('charlie', 'charlie', {
  pv: 420,
  pvParNiveau: 40,
  degats: [14, 22],
  degatsParNiveau: 2,
  cadence: 1.5,
  armure: 0.3,
  vitesse: 1.5,
  portee: 1.8,
  zone: { rayon: 1, effets: [{ type: 'etourdissement', chance: 0.35, duree: 1, valeur: 0 }] },
  competences: [
    ordinaire('poigne_de_fer', { degats: [0.1, 0.2, 0.3] }),
    ordinaire('peau_epaisse', { pv: [0.1, 0.2, 0.3] }),
    ordinaire('onde_de_choc', { zone: [0.2, 0.4, 0.6] }),
    ultime('neuf_nuits', { pv: [0.2, 0.35, 0.5], regeneration: [2, 4, 6] }),
  ],
});

const mastoc = heros('mastoc', 'charlie', {
  pv: 560,
  pvParNiveau: 50,
  degats: [8, 12],
  degatsParNiveau: 1,
  cadence: 1.6,
  armure: 0.6,
  vitesse: 1.2,
  portee: 1.8,
  capacite: 3,
  competences: [
    ordinaire('mur_de_chair', { pv: [0.1, 0.2, 0.3] }),
    ordinaire('cri_de_defi', { capacite: [0, 1, 2], portee: [0.2, 0.3, 0.4] }),
    ordinaire('cuirasse_de_clous', { armure: [0.05, 0.1, 0.15] }),
    ultime('rempart_vivant', { regeneration: [3, 5, 8], pv: [0.1, 0.2, 0.3] }),
  ],
});

const briseOs = heros('brise_os', 'charlie', {
  pv: 380,
  pvParNiveau: 35,
  degats: [16, 24],
  degatsParNiveau: 2.5,
  cadence: 1.3,
  armure: 0,
  vitesse: 1.6,
  portee: 1.8,
  capacites: { rage: 0.9 },
  competences: [
    ordinaire('colere', { rage: [0.2, 0.4, 0.6] }),
    ordinaire('broyeur', { degats: [0.1, 0.2, 0.3] }),
    ordinaire('faim_de_loup', { regeneration: [1, 2, 3], cadence: [0.05, 0.1, 0.15] }),
    ultime('os_brises', { degats: [0.3, 0.5, 0.7], rage: [0.2, 0.3, 0.4] }),
  ],
});

// --- Pollen --------------------------------------------------------------------------------------

const pollen = heros('pollen', 'pollen', {
  pv: 240,
  pvParNiveau: 22,
  degats: [0, 0],
  degatsParNiveau: 1.5,
  cadence: 1,
  armure: 0,
  vitesse: 1.6,
  portee: 3.2,
  capacites: {
    distance: { portee: 3.2, degats: [10, 16], cadence: 0.3, typeDegats: 'physique', volants: true, effets: [] },
    ouvrage: {
      constructeur: null,
      pieges: { piege: { degats: 50, typeDegats: 'physique', immobilisation: 1.2, rayon: 0.6 }, cadence: 14, portee: 3 },
    },
  },
  competences: [
    ordinaire('ressorts_rouilles', { cadenceOuvrages: [0.1, 0.2, 0.3] }),
    ordinaire('fronde_tordue', { degats: [0.1, 0.2, 0.3] }),
    ordinaire('trois_pattes', { vitesse: [0.1, 0.2, 0.3], esquive: [0.05, 0.1, 0.15] }),
    ultime('maitre_des_pieges', { degatsOuvrages: [0.3, 0.6, 1], cadenceOuvrages: [0.1, 0.2, 0.3] }),
  ],
});

const rouage = heros('rouage', 'pollen', {
  pv: 260,
  pvParNiveau: 24,
  degats: [0, 0],
  degatsParNiveau: 1,
  cadence: 1.2,
  armure: 0.3,
  vitesse: 1.4,
  portee: 3,
  capacites: {
    distance: { portee: 3, degats: [8, 12], cadence: 1.2, typeDegats: 'physique', volants: false, effets: [] },
    ouvrage: {
      constructeur: {
        tourelle: {
          nom: 'unite.tourelle_de_rouage',
          portee: 3.2,
          degats: [9, 14],
          cadence: 0.9,
          typeDegats: 'physique',
          volants: true,
          effets: [],
          duree: 25,
        },
        max: 1,
        cadence: 15,
        decalages: [
          { x: 0.9, y: -0.9 },
          { x: -0.9, y: -0.9 },
          { x: 0, y: 1 },
        ],
      },
      pieges: null,
    },
  },
  competences: [
    ordinaire('boulons_neufs', { degatsOuvrages: [0.15, 0.3, 0.45] }),
    ordinaire('deuxieme_servant', { nombreOuvrages: [0, 1, 2], cadenceOuvrages: [0.1, 0.1, 0.1] }),
    ordinaire('huile_noire', { cadenceOuvrages: [0.15, 0.3, 0.45] }),
    ultime('automate', { nombreOuvrages: [1, 1, 2], degatsOuvrages: [0.2, 0.4, 0.6] }),
  ],
});

const lanterne = heros('lanterne', 'pollen', {
  pv: 230,
  pvParNiveau: 20,
  degats: [0, 0],
  degatsParNiveau: 1.5,
  cadence: 1.4,
  armure: 0,
  vitesse: 1.5,
  portee: 3,
  capacites: {
    distance: { portee: 3, degats: [10, 15], cadence: 1.4, typeDegats: 'magique', volants: true, effets: [] },
    soin: { rayon: 2.5, quantite: 0.08, cadence: 3 },
  },
  competences: [
    ordinaire('flamme_douce', { soin: [0.03, 0.06, 0.09] }),
    ordinaire('halo_de_cire', { zone: [0.3, 0.6, 0.9] }),
    ordinaire('cire_et_cendre', { pv: [0.1, 0.2, 0.3] }),
    ultime('derniere_lueur', { soin: [0.05, 0.1, 0.15], regeneration: [1, 2, 4] }),
  ],
});

export const HEROS = { plume, suie, corbeau, charlie, mastoc, brise_os: briseOs, pollen, rouage, lanterne } as const satisfies Record<
  string,
  DefHeros
>;

export type IdHeros = keyof typeof HEROS;

/**
 * Ce que la méta-progression (src/save/) sait des héros : leurs compétences et les seuils d'expérience. Même forme
 * que `DefsMeta` de src/save/definitions.ts (la donnée ne dépend pas de la sauvegarde : un test vérifie la
 * compatibilité). `seuilsXp[0]` est l'expérience cumulée qu'il faut pour le niveau 2.
 */
export const DEFS_META: {
  readonly heros: Readonly<Record<string, { readonly competences: readonly { readonly id: string; readonly rangMax: number; readonly niveauRequis: number }[] }>>;
  readonly seuilsXp: readonly number[];
} = {
  heros: Object.fromEntries(
    Object.entries(HEROS).map(([id, def]) => [
      id,
      { competences: def.competences.map((c) => ({ id: c.id, rangMax: c.rangMax, niveauRequis: c.niveauRequis })) },
    ]),
  ),
  seuilsXp: SEUILS_XP,
};
