// Ce que l'écran du mode infini montre, d'après la sauvegarde : les cartes jouables avec leur record, les paliers et ce
// qu'ils rapportent, le bilan d'une partie. Des fonctions pures, sans DOM : l'écran (ecran-infini.ts) ne fait que les dessiner.
import { NOMBRE_REGIONS_INFINI, PALIERS_INFINI, RECOMPENSES_PALIERS_INFINI, regionDuNiveau, type PalierInfini } from '../data/meta';
import { OBJETS } from '../data/objets';
import { PLANS_REGIONS } from '../data/niveaux/plans';
import type { NiveauCampagne } from '../data/visuel';
import { t, tCle } from '../i18n';
import { fr } from '../i18n/fr';
import { cartesInfiniJouables, niveauReussi, NOMBRE_NIVEAUX, recordDeLaCarte, type BilanInfini, type Sauvegarde } from '../save';
import { niveauDeCampagne } from './regions-monde';

/** La carte que joue un niveau de campagne (1 à 100), ou undefined si son plan n'est pas dans le jeu. */
export function carteDuNiveau(numero: number): string | undefined {
  if (!Number.isInteger(numero) || numero < 1) return undefined;
  for (const plans of PLANS_REGIONS) {
    const plan = plans.find((p) => p.numero === numero);
    if (plan) return plan.carte;
  }
  return undefined;
}

/** Nom d'une carte : son texte s'il existe, sinon son identifiant mis en forme (« cour_des_miracles » : « Cour des miracles »). */
export function nomDeCarte(id: string): string {
  const cle = `carte.nom.${id}`;
  if (Object.hasOwn(fr, cle)) return tCle(cle);
  const texte = id.replace(/_/g, ' ');
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Une carte qu'on peut choisir en infini. */
export interface VueCarteInfini {
  readonly id: string;
  readonly nom: string;
  /** Région de la carte (1 à 10) : ses ennemis et son boss, et ceux des régions d'avant, peuplent les vagues. */
  readonly region: number;
  /** Le niveau de campagne qui sert de décor et d'entrées : le premier gagné sur cette carte. */
  readonly niveau: NiveauCampagne;
  /** Dernière vague terminée sur cette carte (0 si jamais jouée). */
  readonly record: number;
}

export interface DonneesInfini {
  /** Quelle carte porte un niveau de campagne. */
  readonly carteDuNiveau?: (numero: number) => string | undefined;
  /** Le niveau de campagne de ce numéro, s'il est dans le jeu. */
  readonly niveauDeCampagne?: (numero: number) => NiveauCampagne | undefined;
}

/**
 * Les cartes du mode infini : celles dont au moins un niveau est gagné et dont les niveaux sont dans le jeu, une fois
 * chacune, dans l'ordre des niveaux ; aucune tant que le mode est fermé. Une région dont les niveaux ne sont pas livrés
 * n'apporte aucune carte.
 */
export function vueCartesInfini(s: Sauvegarde, donnees: DonneesInfini = {}): VueCarteInfini[] {
  const carteDe = donnees.carteDuNiveau ?? carteDuNiveau;
  const niveauDe = donnees.niveauDeCampagne ?? niveauDeCampagne;
  const livree = (n: number): string | undefined => (niveauDe(n) ? carteDe(n) : undefined);
  const vues: VueCarteInfini[] = [];
  for (const id of cartesInfiniJouables(s, livree)) {
    for (let n = 1; n <= NOMBRE_NIVEAUX; n++) {
      if (!niveauReussi(s, n) || livree(n) !== id) continue;
      const niveau = niveauDe(n);
      if (niveau) vues.push({ id, nom: nomDeCarte(id), region: Math.min(NOMBRE_REGIONS_INFINI, Math.max(1, regionDuNiveau(n))), niveau, record: recordDeLaCarte(s, id) });
      break;
    }
  }
  return vues;
}

export interface VuePalier {
  readonly palier: PalierInfini;
  readonly aretes: number;
  readonly braises: number;
  /** Déjà payé (sur n'importe quelle carte) : il ne rapportera plus rien. */
  readonly paye: boolean;
}

export function vuePaliers(s: Sauvegarde): VuePalier[] {
  return PALIERS_INFINI.map((palier) => ({ palier, ...RECOMPENSES_PALIERS_INFINI[palier], paye: s.meta.infini.paliers.includes(palier) }));
}

/** Les lignes de l'écran de fin d'une partie infinie : la vague, le record, les paliers payés, les objets. */
export function lignesBilanInfini(bilan: BilanInfini, carte: string): string[] {
  const nom = nomDeCarte(carte);
  const lignes = [t('fin.infini_vague', { n: bilan.vague })];
  lignes.push(bilan.nouveauRecord ? t('fin.infini_nouveau_record', { carte: nom }) : t('fin.infini_record', { carte: nom, n: bilan.record }));
  if (bilan.paliersPayes.length === 0) lignes.push(t('fin.infini_aucun_palier'));
  for (const palier of bilan.paliersPayes) {
    const gain = RECOMPENSES_PALIERS_INFINI[palier];
    lignes.push(t('fin.infini_palier', { n: palier, aretes: gain.aretes, braises: gain.braises }));
  }
  if (bilan.objetsConsommes.length > 0) lignes.push(t('fin.bilan_objets', { noms: bilan.objetsConsommes.map((o) => tCle(OBJETS[o].nom)).join(', ') }));
  if (bilan.objetsRendus.length > 0) lignes.push(t('fin.bilan_rendus', { noms: bilan.objetsRendus.map((o) => tCle(OBJETS[o].nom)).join(', ') }));
  return lignes;
}
