// Assemble un niveau de campagne à partir de son plan, de sa carte et de ses vagues figées : choisit les
// chemins du niveau, ne garde du décor de la carte que ce qui ne recouvre pas un chemin utilisé, et en tire les
// cases interdites de la grille de construction (grille-niveau.ts).
import type { Carte, Niveau, Vague } from '../../engine/definitions';
import type { Decor, NiveauCampagne } from '../visuel';
import { CARTES, type CarteModele } from './cartes-toutes';
import { distanceRectChemin } from './geometrie';
import { casesInterditesDuNiveau } from './grille-niveau';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, MARGE_DECOR } from './habillage';
import type { PlanNiveau } from './plan-niveau';
import { SPRITE_STATUE, STATUES } from './statues';

function choisir<T>(liste: readonly T[], indices: readonly number[], quoi: string, plan: PlanNiveau): T[] {
  return indices.map((i) => {
    const element = liste[i];
    if (element === undefined) throw new Error(`Niveau ${String(plan.numero)} : ${quoi} ${String(i)} inexistant sur la carte ${plan.carte}`);
    return element;
  });
}

/** Le décor de la carte qui reste visible une fois les chemins du niveau posés. */
export function decorVisible(modele: CarteModele, carte: Carte): Decor[] {
  return modele.decor.filter((d) => {
    const emprise = empriseDecor(d);
    return !carte.chemins.some((c) => distanceRectChemin(emprise, c.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR);
  });
}

/** Niveaux par région : le numéro de campagne 1 à 100 se range par dizaines. */
const NIVEAUX_PAR_REGION = 10;

/**
 * Régions dont les niveaux ne jouent pas d'élites en Vieux Sage. La région 1, réglée au jalon 2 sans élites, ne tient pas ses
 * bandes de Vieux Sage avec elles (les trois dieux ne les subissent pas pareillement) : le réglage fin est à refaire avec les
 * autres régions (tâche 6 du jalon 3). Le défi Héroïque y garde toutes ses élites.
 */
const REGIONS_SANS_ELITES: readonly number[] = [1];

export function assemblerNiveau(plan: PlanNiveau, vagues: readonly Vague[]): NiveauCampagne {
  const modele = CARTES[plan.carte];
  const region = Math.floor((plan.numero - 1) / NIVEAUX_PAR_REGION) + 1;
  if (modele.region !== region) throw new Error(`Niveau ${String(plan.numero)} : la carte ${plan.carte} est celle de la région ${String(modele.region)}, pas de la région ${String(region)}`);
  const rang = ((plan.numero - 1) % NIVEAUX_PAR_REGION) + 1;
  const carte: Carte = {
    largeur: modele.largeur,
    hauteur: modele.hauteur,
    chemins: choisir(modele.chemins, plan.chemins, 'chemin', plan),
    departHeros: modele.departHeros,
  };
  const decor = decorVisible(modele, carte);
  const statue = STATUES[plan.carte];
  const niveau: Niveau = {
    id: `r${String(region)}-${String(rang).padStart(2, '0')}`,
    numero: plan.numero,
    aretesDepart: plan.aretesDepart,
    defiFer: plan.defiFer,
    ...(REGIONS_SANS_ELITES.includes(region) ? { sansElites: true } : {}),
    ...(plan.vagues.horde === true ? { horde: true } : {}),
    carte,
    casesInterdites: casesInterditesDuNiveau(carte, decor),
    vagues,
  };
  return {
    numero: plan.numero,
    niveau,
    // La statue de la carte est un décor de plus (petit : il ne bloque rien) que l'interface rend touchable.
    visuel: { region, zones: modele.zones, decor: [...decor, { sprite: SPRITE_STATUE[statue.origine], x: statue.x, y: statue.y }], statue },
    boss: plan.vagues.boss !== undefined,
    horde: plan.vagues.horde === true,
  };
}
