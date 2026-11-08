// Niveaux d'essai des gimmicks de la région 11, réservés au développement : ils servent à voir le rendu des couloirs et du
// radeau avant que les niveaux 101 à 110 ne soient branchés. Chargés seulement par un import dynamique gardé par
// `import.meta.env.DEV` (main.ts) : rien n'en reste dans le site publié. Cartes de la région 11 (la Grève aux Corbeaux pour les
// couloirs, l'Eau Morte pour le radeau), gimmick injecté, vagues écrites à la main. Sans numéro de campagne : tout est ouvert.
import { decorVisible } from '../data/niveaux/assemblage';
import { EAU_MORTE, GREVE } from '../data/niveaux/cartes-region11';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { zonesBloquantes } from '../data/niveaux/habillage';
import type { CarteModele } from '../data/niveaux/modele-carte';
import type { NiveauCampagne } from '../data/visuel';
import { casesDuTrajet } from '../engine';
import type { Carte, Gimmick, GimmickCorbeaux, GimmickRadeau, Paquet, Vague } from '../engine/definitions';

/** Un niveau d'essai : la carte du modèle avec tous ses chemins, son décor visible, et les cases du trajet d'un radeau interdites. */
function assemblerNiveauEssai(modele: CarteModele, gimmick: Gimmick, vagues: readonly Vague[], id: string): NiveauCampagne {
  const carte: Carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins: modele.chemins, departHeros: modele.departHeros };
  const decor = decorVisible(modele, carte);
  const trajet = gimmick.type === 'radeau' ? casesDuTrajet(gimmick) : [];
  return {
    numero: 101,
    niveau: { id, aretesDepart: 900, carte, casesInterdites: [...casesInterditesDuNiveau(carte, decor, zonesBloquantes(modele)), ...trajet], vagues, gimmick },
    visuel: { region: modele.region, zones: modele.zones, decor },
    boss: false,
    horde: false,
  };
}

const chemin = (ennemi: string, nombre: number, delai = 0): Paquet => ({ ennemi, nombre, intervalle: 1.2, chemin: 0, delai });
const couloir = (k: number, ennemi: string, nombre: number, delai = 0): Paquet => ({ ennemi, nombre, intervalle: 1, chemin: 0, couloir: k, delai });

/** Couloirs proposés par la carte de la Grève (lignes de cases 1 et 6). */
const CORBEAUX: GimmickCorbeaux = { type: 'corbeaux', couloirs: [{ cy: 1 }, { cy: 6 }] };
/** Trajet proposé par la carte de l'Eau Morte (ligne 4, de la colonne 5 à la colonne 13), trois places en triangle. */
const RADEAU: GimmickRadeau = { type: 'radeau', trajet: [{ cx: 5, cy: 4 }, { cx: 13, cy: 4 }], vitesse: 0.5, places: [{ dx: -2, dy: 0 }, { dx: 0, dy: 0 }, { dx: 2, dy: 0 }] };

const VAGUES_CORBEAUX: Vague[] = [
  { paquets: [chemin('paysan_affame', 4), couloir(1, 'corbeau_noir', 3, 2)] },
  { paquets: [chemin('mendiant', 3), couloir(0, 'corbeau_noir', 4), couloir(1, 'chauve_souris', 5, 3)] },
  { paquets: [chemin('paysan_affame', 6), couloir(0, 'chauve_souris', 5), couloir(1, 'corbeau_noir', 6, 2), couloir(0, 'corbeau_noir', 2, 6)] },
];

const VAGUES_RADEAU: Vague[] = [
  { paquets: [chemin('paysan_affame', 5)] },
  { paquets: [chemin('mendiant', 4), chemin('paysan_affame', 4, 4)] },
  { paquets: [chemin('paysan_affame', 8), chemin('mendiant', 5, 5)] },
];

export const ESSAIS_GIMMICKS: Readonly<Record<'corbeaux' | 'radeau', NiveauCampagne>> = {
  corbeaux: assemblerNiveauEssai(GREVE, CORBEAUX, VAGUES_CORBEAUX, 'essai-corbeaux'),
  radeau: assemblerNiveauEssai(EAU_MORTE, RADEAU, VAGUES_RADEAU, 'essai-radeau'),
};
