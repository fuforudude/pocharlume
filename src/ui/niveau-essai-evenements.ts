// Niveau d'essai des événements datés et des foules (DLC Temps modernes), réservé au développement : il sert à voir le bandeau, les
// foules, les coupures et la carte qui bouge avant que les niveaux du DLC ne soient écrits. Chargé seulement par un import dynamique
// gardé par `import.meta.env.DEV` (main.ts) : rien n'en reste dans le site publié. Carte de la Grève (région 11), plus un second chemin
// droit sur la rangée 1, fermé au départ, qui s'ouvre à la vague 2 et se referme à la vague 3.
import { decorVisible } from '../data/niveaux/assemblage';
import { GREVE } from '../data/niveaux/cartes-region11';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { zonesBloquantes } from '../data/niveaux/habillage';
import type { NiveauCampagne } from '../data/visuel';
import type { Carte, EvenementNiveau, Foule, Paquet, Vague } from '../engine/definitions';

const paquet = (ennemi: string, nombre: number, chemin: number, delai = 0): Paquet => ({ ennemi, nombre, intervalle: 1.2, chemin, delai });

const VAGUES: Vague[] = [
  { paquets: [paquet('paysan_affame', 6, 0), paquet('mendiant', 3, 1, 4)] },
  { paquets: [paquet('paysan_affame', 6, 1, 6), paquet('mendiant', 4, 0, 2)] },
  { paquets: [paquet('paysan_affame', 8, 0), paquet('mendiant', 5, 1, 3)] },
];

const EVENEMENTS: EvenementNiveau[] = [
  { vague: 1, delai: 8, type: 'nasse', chemin: 0, debut: 12, longueur: 3, duree: 6 },
  { vague: 1, delai: 14, type: 'canon_a_eau', cy: 4, recul: 3, etourdissement: 1.5 },
  { vague: 2, type: 'ouvrir_chemin', chemin: 1 },
  { vague: 2, delai: 10, type: 'charge', chemin: 1, ennemi: 'chien_errant', nombre: 4, intervalle: 0.6, facteurVitesse: 1.8, duree: 4 },
  { vague: 3, delai: 5, type: 'renforts', x: 19, y: 10, nombre: 3, duree: 10, unite: 'etudiant' },
  { vague: 3, delai: 12, type: 'fermer_chemin', chemin: 1, repli: 0 },
];

const FOULES: Foule[] = [
  { cases: [{ cx: 6, cy: 3 }, { cx: 7, cy: 3 }], condition: { type: 'payer', cout: 60 }, effet: { type: 'ralentir', rayon: 4, facteur: 0.5, duree: 4 }, recharge: 15 },
  { cases: [{ cx: 9, cy: 4 }, { cx: 9, cy: 5 }], condition: { type: 'heros', duree: 3 }, effet: { type: 'renforts', nombre: 2, duree: 8, unite: 'etudiant' }, recharge: 25 },
  { cases: [{ cx: 12, cy: 6 }], condition: { type: 'payer', cout: 40 }, effet: { type: 'bloquer', chemin: 0, debut: 36, longueur: 3, duree: 5 }, utilisations: 2 },
];

function assembler(): NiveauCampagne {
  const modele = GREVE;
  const fixe: Carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins, departHeros: modele.departHeros };
  const carte: Carte = { ...fixe, chemins: [...modele.chemins, { points: [{ x: -1, y: 3 }, { x: 33, y: 3 }] }] };
  const decor = decorVisible(modele, carte);
  return {
    numero: 101,
    niveau: {
      id: 'essai-evenements',
      aretesDepart: 900,
      carte,
      // Le chemin mobile (1) n'est pas dans les cases interdites : le moteur les interdit quand il est ouvert.
      casesInterdites: casesInterditesDuNiveau(fixe, decor, zonesBloquantes(modele)),
      vagues: VAGUES,
      evenements: EVENEMENTS,
      cheminsFermes: [{ chemin: 1, repli: 0 }],
      foules: FOULES,
    },
    visuel: { region: modele.region, zones: modele.zones, decor },
    boss: false,
    horde: false,
  };
}

export const ESSAI_EVENEMENTS: NiveauCampagne = assembler();
