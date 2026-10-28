// Assemble un niveau de campagne à partir de son plan, de sa carte et de ses vagues figées : choisit les
// chemins et les socles du niveau, et ne garde du décor de la carte que ce qui ne recouvre ni un chemin ni un
// socle utilisés.
import type { Carte, Niveau, Vague } from '../../engine/definitions';
import type { Decor, NiveauCampagne } from '../visuel';
import { CARTES, type CarteModele } from './cartes-toutes';
import { distanceRectChemin, rectsSeChevauchent } from './geometrie';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, empriseSprite, MARGE_DECOR } from './habillage';
import type { PlanNiveau } from './plan-niveau';

function choisir<T>(liste: readonly T[], indices: readonly number[], quoi: string, plan: PlanNiveau): T[] {
  return indices.map((i) => {
    const element = liste[i];
    if (element === undefined) throw new Error(`Niveau ${String(plan.numero)} : ${quoi} ${String(i)} inexistant sur la carte ${plan.carte}`);
    return element;
  });
}

/** Le décor de la carte qui reste visible une fois les chemins et les socles du niveau posés. */
export function decorVisible(modele: CarteModele, carte: Carte): Decor[] {
  return modele.decor.filter((d) => {
    const emprise = empriseDecor(d);
    const surChemin = carte.chemins.some((c) => distanceRectChemin(emprise, c.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR);
    const surSocle = carte.socles.some((s) => rectsSeChevauchent(emprise, empriseSprite(s.x, s.y)));
    return !surChemin && !surSocle;
  });
}

/** Niveaux par région : le numéro de campagne 1 à 100 se range par dizaines. */
const NIVEAUX_PAR_REGION = 10;

export function assemblerNiveau(plan: PlanNiveau, vagues: readonly Vague[]): NiveauCampagne {
  const modele = CARTES[plan.carte];
  const region = Math.floor((plan.numero - 1) / NIVEAUX_PAR_REGION) + 1;
  if (modele.region !== region) throw new Error(`Niveau ${String(plan.numero)} : la carte ${plan.carte} est celle de la région ${String(modele.region)}, pas de la région ${String(region)}`);
  const rang = ((plan.numero - 1) % NIVEAUX_PAR_REGION) + 1;
  const niveau: Niveau = {
    id: `r${String(region)}-${String(rang).padStart(2, '0')}`,
    aretesDepart: plan.aretesDepart,
    defiFer: plan.defiFer,
    carte: {
      largeur: modele.largeur,
      hauteur: modele.hauteur,
      chemins: choisir(modele.chemins, plan.chemins, 'chemin', plan),
      socles: choisir(modele.socles, plan.socles, 'socle', plan),
      departHeros: modele.departHeros,
    },
    vagues,
  };
  return {
    numero: plan.numero,
    niveau,
    visuel: { region, zones: modele.zones, decor: decorVisible(modele, niveau.carte) },
    boss: plan.vagues.boss !== undefined,
  };
}
