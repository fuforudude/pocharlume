// Tours communes : 4 familles, 3 niveaux puis 2 spécialisations au niveau 4.
// Jalon 1 : chaque spécialisation a ses stats et son effet principal. Ses 2 compétences améliorables
// viendront au jalon 2.
import type { DefFamille, DefNiveauTour, IdFamille, StatsSoldats } from '../engine/definitions';

const DEFAUT: Omit<DefNiveauTour, 'nom' | 'cout' | 'portee'> = {
  cadence: 0,
  degats: [0, 0],
  typeDegats: 'physique',
  projectile: 0,
  zone: 0,
  volants: false,
  effets: [],
  critique: null,
  revele: false,
  chaine: null,
  soldats: null,
  spectres: null,
  onde: false,
};

function niveau(champs: Pick<DefNiveauTour, 'nom' | 'cout' | 'portee'> & Partial<DefNiveauTour>): DefNiveauTour {
  return { ...DEFAUT, ...champs };
}

function soldats(champs: Pick<StatsSoldats, 'pv' | 'degats'> & Partial<StatsSoldats>): StatsSoldats {
  return {
    nom: 'unite.chat_de_grange',
    nombre: 3,
    cadence: 1,
    coups: 1,
    armure: 0,
    resistance: 0,
    vitesse: 1.6,
    portee: 1.6,
    capacite: 1,
    effets: [],
    reapparition: 10,
    ...champs,
  };
}

const caserne: DefFamille = {
  id: 'caserne',
  niveaux: [
    niveau({ nom: 'tour.grenier_des_griffes', cout: 70, portee: 2.5, soldats: soldats({ pv: 50, degats: [1, 3] }) }),
    niveau({ nom: 'tour.grenier_des_griffes', cout: 110, portee: 2.5, soldats: soldats({ pv: 90, degats: [3, 5], armure: 0.3 }) }),
    niveau({ nom: 'tour.grenier_des_griffes', cout: 160, portee: 2.5, soldats: soldats({ pv: 130, degats: [5, 8], armure: 0.3 }) }),
  ],
  specialisations: {
    A: niveau({
      nom: 'tour.garde_du_cloitre',
      cout: 230,
      portee: 2.8,
      soldats: soldats({ nom: 'unite.garde_du_cloitre', pv: 120, degats: [6, 10], armure: 0.6, capacite: 2 }),
    }),
    B: niveau({
      nom: 'tour.ecorcheurs',
      cout: 230,
      portee: 2.8,
      soldats: soldats({
        nom: 'unite.ecorcheur',
        pv: 150,
        degats: [4, 6],
        coups: 2,
        armure: 0.3,
        effets: [{ type: 'saignement', chance: 0.5, duree: 3, valeur: 3 }],
      }),
    }),
  },
};

const tir: DefFamille = {
  id: 'tir',
  niveaux: [
    niveau({ nom: 'tour.clocher_des_archers', cout: 70, portee: 3.5, cadence: 0.8, degats: [4, 7], projectile: 12, volants: true }),
    niveau({ nom: 'tour.clocher_des_archers', cout: 110, portee: 3.8, cadence: 0.7, degats: [7, 11], projectile: 12, volants: true }),
    niveau({ nom: 'tour.clocher_des_archers', cout: 160, portee: 4.1, cadence: 0.6, degats: [10, 15], projectile: 12, volants: true }),
  ],
  specialisations: {
    A: niveau({
      nom: 'tour.guetteurs_des_toits',
      cout: 230,
      portee: 4.4,
      cadence: 0.5,
      degats: [11, 17],
      projectile: 14,
      volants: true,
      revele: true,
      effets: [{ type: 'poison', chance: 1, duree: 3, valeur: 6 }],
    }),
    B: niveau({
      nom: 'tour.arbaletriers_du_beffroi',
      cout: 230,
      portee: 6,
      cadence: 1.2,
      degats: [24, 36],
      projectile: 18,
      volants: true,
      critique: { chance: 0.2, multiplicateur: 2.5 },
    }),
  },
};

const magie: DefFamille = {
  id: 'magie',
  niveaux: [
    niveau({ nom: 'tour.autel_des_cendres', cout: 100, portee: 3.2, cadence: 1.5, degats: [12, 21], typeDegats: 'magique', projectile: 8, volants: true }),
    niveau({ nom: 'tour.autel_des_cendres', cout: 160, portee: 3.4, cadence: 1.5, degats: [24, 40], typeDegats: 'magique', projectile: 8, volants: true }),
    niveau({ nom: 'tour.autel_des_cendres', cout: 240, portee: 3.6, cadence: 1.5, degats: [40, 64], typeDegats: 'magique', projectile: 8, volants: true }),
  ],
  specialisations: {
    A: niveau({
      nom: 'tour.oracle_de_la_braise',
      cout: 300,
      portee: 3.6,
      cadence: 0.5,
      degats: [15, 23],
      typeDegats: 'pur',
      volants: true,
    }),
    B: niveau({
      nom: 'tour.necromancien_des_neuf_vies',
      cout: 300,
      portee: 3.8,
      cadence: 1.5,
      degats: [60, 90],
      typeDegats: 'magique',
      projectile: 8,
      volants: true,
      spectres: {
        nom: 'unite.spectre',
        pv: 80,
        degats: [5, 8],
        cadence: 1,
        coups: 1,
        armure: 0,
        resistance: 0.6,
        vitesse: 1.6,
        portee: 1.6,
        capacite: 1,
        effets: [],
        max: 3,
        duree: 15,
      },
    }),
  },
};

const artillerie: DefFamille = {
  id: 'artillerie',
  niveaux: [
    niveau({ nom: 'tour.catapulte_du_rempart', cout: 125, portee: 3.8, cadence: 3, degats: [10, 17], projectile: 5, zone: 1 }),
    niveau({ nom: 'tour.catapulte_du_rempart', cout: 200, portee: 4, cadence: 3, degats: [20, 33], projectile: 5, zone: 1 }),
    niveau({ nom: 'tour.catapulte_du_rempart', cout: 300, portee: 4.2, cadence: 3, degats: [32, 50], projectile: 5, zone: 1.1 }),
  ],
  specialisations: {
    A: niveau({
      nom: 'tour.mortier_de_soufre',
      cout: 360,
      portee: 4.4,
      cadence: 3.5,
      degats: [38, 62],
      projectile: 4,
      zone: 1.6,
      effets: [{ type: 'brulure', chance: 1, duree: 3, valeur: 4 }],
    }),
    B: niveau({
      nom: 'tour.baliste_a_chaines',
      cout: 360,
      portee: 4.6,
      cadence: 2.5,
      degats: [65, 95],
      projectile: 10,
      effets: [{ type: 'ralentissement', chance: 1, duree: 2, valeur: 0.5 }],
      chaine: { nombre: 3, rayon: 1.5, facteur: 0.6 },
    }),
  },
};

export const TOURS: Readonly<Record<IdFamille, DefFamille>> = { caserne, tir, magie, artillerie };

export const FAMILLES: readonly IdFamille[] = ['caserne', 'tir', 'magie', 'artillerie'];
