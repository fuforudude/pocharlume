// Assemble un niveau du DLC « Temps modernes » depuis son plan (plan-moderne-r<N>.ts), sa carte (cartes-moderne-r<N>.ts) et ses vagues
// figées (vagues-moderne-r<N>.ts), comme `assemblerNiveau` pour l'histoire, avec ce que le DLC ajoute :
// - le niveau porte la campagne `moderne` (ici et dans `niveau`), un numéro de 1 à 30 et un identifiant `m<région>-<rang>` ;
// - ses événements datés, chemins fermés au départ et foules sont copiés tels quels du plan ;
// - les cases des chemins mobiles (fermés au départ, ou visés par `ouvrir_chemin` / `fermer_chemin`) ne sont pas dans les cases interdites
//   (contrat des données : le moteur les interdit toujours lui-même) ; celles de la mise en scène (groupes, banderoles) y sont.
import type { Carte, CaseGrille, Niveau, Vague } from '../../engine/definitions';
import type { NiveauCampagne, SceneVivante } from '../visuel';
import { decorVisible } from './assemblage';
import { CARTES_MODERNE_R1 } from './cartes-moderne-r1';
import { casesInterditesDuNiveau } from './grille-niveau';
import { zonesBloquantes } from './habillage';
import type { PlanNiveauModerne } from './plan-moderne-r1';

const NIVEAUX_PAR_REGION = 10;

/** Les cases de la mise en scène : groupes d'étudiants et banderoles (sur `largeur` cases vers l'est). */
export function casesDeLaScene(scene: SceneVivante): CaseGrille[] {
  return [
    ...scene.groupes.map((g) => ({ cx: g.cx, cy: g.cy })),
    ...scene.banderoles.flatMap((b) => Array.from({ length: b.largeur }, (_, i) => ({ cx: b.cx + i, cy: b.cy }))),
  ];
}

/** Les chemins (indices du niveau) qui peuvent s'ouvrir ou se fermer pendant la partie. */
export function cheminsMobilesDuPlan(plan: PlanNiveauModerne): Set<number> {
  const mobiles = new Set<number>((plan.cheminsFermes ?? []).map((f) => f.chemin));
  for (const e of plan.evenements ?? []) if (e.type === 'ouvrir_chemin' || e.type === 'fermer_chemin') mobiles.add(e.chemin);
  return mobiles;
}

export function assemblerNiveauModerne(plan: PlanNiveauModerne, vagues: readonly Vague[]): NiveauCampagne {
  const modele = CARTES_MODERNE_R1[plan.carte];
  const region = Math.floor((plan.numero - 1) / NIVEAUX_PAR_REGION) + 1;
  const rang = ((plan.numero - 1) % NIVEAUX_PAR_REGION) + 1;
  const chemins = plan.chemins.map((i) => {
    const c = modele.chemins[i];
    if (!c) throw new Error(`Niveau moderne ${String(plan.numero)} : chemin ${String(i)} inexistant sur la carte ${plan.carte}`);
    return c;
  });
  const carte: Carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins, departHeros: modele.departHeros };
  const decor = decorVisible(modele, carte);
  const mobiles = cheminsMobilesDuPlan(plan);
  const fixes = { ...carte, chemins: chemins.filter((_, i) => !mobiles.has(i)) };
  const interdites = casesInterditesDuNiveau(fixes, decor, zonesBloquantes(modele));
  const deja = new Set(interdites.map((c) => `${String(c.cx)},${String(c.cy)}`));
  for (const c of casesDeLaScene(modele.scene)) {
    const cle = `${String(c.cx)},${String(c.cy)}`;
    if (deja.has(cle)) continue;
    deja.add(cle);
    interdites.push(c);
  }
  const niveau: Niveau = {
    id: `m${String(region)}-${String(rang).padStart(2, '0')}`,
    numero: plan.numero,
    campagne: 'moderne',
    aretesDepart: plan.aretesDepart,
    defiFer: plan.defiFer,
    ...(plan.vagues.horde === true ? { horde: true } : {}),
    carte,
    casesInterdites: interdites,
    vagues,
    ...(plan.evenements ? { evenements: plan.evenements } : {}),
    ...(plan.cheminsFermes ? { cheminsFermes: plan.cheminsFermes } : {}),
    ...(plan.foules ? { foules: plan.foules } : {}),
  };
  return {
    numero: plan.numero,
    campagne: 'moderne',
    niveau,
    visuel: { region: modele.region, zones: modele.zones, decor, scene: modele.scene },
    boss: plan.vagues.boss !== undefined,
    horde: plan.vagues.horde === true,
  };
}
