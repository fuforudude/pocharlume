// Validation de la config d'une partie. Elle vient de l'interface, d'une sauvegarde ou d'un journal relu : rien
// n'est fiable. Les tables de données ne sont lues que par propriétés propres (voir contenu.ts).
import { INFINI } from '../data/infini';
import { EMPLACEMENTS_OBJETS } from '../data/meta';
import { REGLES } from '../data/regles';
import { FAMILLES } from '../data/tours';
import { VERSION_DONNEES } from '../data/version';
import { STATS_BONUS_HEROS, STATS_BONUS_TOUR, copierBonus } from './bonus';
import { defBranche, defDieu, defDifficulte, defHeros, defObjet } from './contenu';
import type { ConfigPartie } from './etat';

type Dictionnaire = Record<string, unknown>;

function estDictionnaire(x: unknown): x is Dictionnaire {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const proto = Object.getPrototypeOf(x) as unknown;
  return proto === Object.prototype || proto === null;
}

function estEntier(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x);
}

/** Rangs d'une table (compétences, branches) : chaque id connu de `rangMax`, chaque rang un entier de 0 à son maximum. */
function verifierRangs(
  rangs: unknown,
  nom: string,
  rangMax: (id: string) => number | undefined,
): string | null {
  if (!estDictionnaire(rangs)) return `${nom} : un objet est attendu`;
  for (const id of Object.keys(rangs)) {
    const max = rangMax(id);
    if (max === undefined) return `${nom} : ${id} inconnu`;
    const rang = rangs[id];
    if (!estEntier(rang) || rang < 0 || rang > max) return `${nom} : rang invalide pour ${id}`;
  }
  return null;
}

function verifierCompetences(config: Dictionnaire, niveauHeros: number): string | null {
  const heros = defHeros(config.heros);
  if (!heros) return null;
  const competences = config.competencesHeros;
  const probleme = verifierRangs(competences, 'Compétences du héros', (id) => heros.competences.find((c) => c.id === id)?.rangMax);
  if (probleme) return probleme;
  if (!estDictionnaire(competences)) return null;
  let points = 0;
  for (const id of Object.keys(competences)) {
    const rang = competences[id] as number;
    const def = heros.competences.find((c) => c.id === id);
    if (rang > 0 && def && niveauHeros < def.niveauRequis) {
      return `Compétences du héros : ${id} demande le niveau ${String(def.niveauRequis)} du héros`;
    }
    points += rang;
  }
  return points > niveauHeros
    ? `Compétences du héros : ${String(points)} points placés pour un héros de niveau ${String(niveauHeros)}`
    : null;
}

function verifierObjets(objets: unknown): string | null {
  if (!Array.isArray(objets)) return 'Objets : une liste est attendue';
  if (objets.length > EMPLACEMENTS_OBJETS) return `Objets : ${String(EMPLACEMENTS_OBJETS)} au plus`;
  // Un même objet peut occuper plusieurs emplacements (chacun ne sert qu'une fois) : pas de contrôle d'unicité.
  for (const objet of objets as unknown[]) {
    if (typeof objet !== 'string' || !defObjet(objet)) return `Objets : ${String(objet)} inconnu`;
  }
  return null;
}

/** Défi absent, null ou connu ; un défi se joue sans objet consommable. */
function verifierDefi(defi: unknown, objets: unknown): string | null {
  if (defi === undefined || defi === null) return null;
  if (defi !== 'heroique' && defi !== 'fer') return `Défi inconnu : ${typeof defi === 'string' ? defi : typeof defi}`;
  return Array.isArray(objets) && objets.length > 0 ? 'Défi : aucun objet consommable permis' : null;
}

/** Mode infini absent, null ou `{ region }` (entier de 1 au nombre de régions) ; il exclut les défis. */
function verifierInfini(infini: unknown, defi: unknown): string | null {
  if (infini === undefined || infini === null) return null;
  if (!estDictionnaire(infini)) return 'Infini : un objet est attendu';
  for (const cle of Object.keys(infini)) if (cle !== 'region') return `Infini : ${cle} inconnu`;
  const region = infini.region;
  if (!estEntier(region) || region < 1 || region > INFINI.regions.length) return `Infini : région invalide ${String(region)}`;
  return defi === undefined || defi === null ? null : 'Infini : aucun défi permis';
}

/** Les stats d'un bonus : noms connus, fractions finies et positives. Renvoie leur total, ou la raison du refus. */
function totalBonus(stats: unknown, noms: readonly string[], nom: string): number | string {
  if (!estDictionnaire(stats)) return `Bonus ${nom} : un objet est attendu`;
  let total = 0;
  for (const stat of Object.keys(stats)) {
    if (!noms.includes(stat)) return `Bonus ${nom} : ${stat} inconnu`;
    const valeur = stats[stat];
    if (typeof valeur !== 'number' || !Number.isFinite(valeur) || valeur < 0) return `Bonus ${nom} : valeur invalide pour ${stat}`;
    total += valeur;
  }
  return total;
}

/** Bonus de collection absent, ou `{ tours, heros }` de fractions dont le total par famille ou pour le héros ne dépasse pas le plafond. */
function verifierBonus(bonus: unknown): string | null {
  if (bonus === undefined) return null;
  if (!estDictionnaire(bonus)) return 'Bonus : un objet est attendu';
  for (const cle of Object.keys(bonus)) if (cle !== 'tours' && cle !== 'heros') return `Bonus : ${cle} inconnu`;
  const tours = bonus.tours;
  if (!estDictionnaire(tours)) return 'Bonus : les tours sont attendues sous forme d’objet';
  // Une tolérance : 0,01 + 0,02 + 0,03 + 0,04 ne donne pas exactement 0,1 en flottants.
  const limite = REGLES.plafondBonus + 1e-9;
  for (const famille of Object.keys(tours)) {
    if (!(FAMILLES as readonly string[]).includes(famille)) return `Bonus : famille de tours inconnue ${famille}`;
    const total = totalBonus(tours[famille], STATS_BONUS_TOUR, famille);
    if (typeof total === 'string') return total;
    if (total > limite) return `Bonus : +${String(Math.round(total * 1000) / 10)} % pour la tour ${famille}, au plus +${String(REGLES.plafondBonus * 100)} %`;
  }
  const total = totalBonus(bonus.heros, STATS_BONUS_HEROS, 'du héros');
  if (typeof total === 'string') return total;
  return total > limite ? `Bonus : +${String(Math.round(total * 1000) / 10)} % pour le héros, au plus +${String(REGLES.plafondBonus * 100)} %` : null;
}

/**
 * Dit si la config permet de créer une partie. Renvoie la raison du refus, en français, ou null si elle est bonne.
 * Règles : version des données, difficulté, dieu et héros connus (le héros appartient au dieu), niveau du héros de 1 à 10,
 * compétences du héros connues (rang de 0 à 3, ultime à partir du niveau 6, pas plus de points que de niveaux), branches
 * de l'arbre connues (rang de 0 à 5), objets connus (un même objet peut occuper plusieurs emplacements), trois au plus.
 * Jalon 3 : `defi` absent ou null (partie ordinaire), `heroique` ou `fer`, sans objet ; `bonus` absent (aucun) ou des
 * fractions par famille de tours et pour le héros, au plus +10 % au total chacun.
 * Jalon 4 : `infini` absent ou null (campagne) ou `{ region }` de 1 à 10 (vagues générées, règles de Matou, pas de défi).
 */
export function verifierConfig(config: unknown): string | null {
  if (!estDictionnaire(config)) return 'Config de partie : un objet est attendu';
  if (config.versionDonnees !== VERSION_DONNEES) {
    return `Partie prévue pour la version des données ${String(config.versionDonnees)}, le jeu est en version ${String(VERSION_DONNEES)}`;
  }
  if (!estEntier(config.graine)) return 'Graine invalide';
  if (!defDifficulte(config.difficulte)) return `Difficulté inconnue : ${String(config.difficulte)}`;
  const dieu = defDieu(config.dieu);
  if (!dieu) return `Dieu inconnu : ${String(config.dieu)}`;
  const heros = defHeros(config.heros);
  if (!heros) return `Héros inconnu : ${String(config.heros)}`;
  if (heros.dieu !== config.dieu) return `Le héros ${String(config.heros)} n’appartient pas au dieu ${String(config.dieu)}`;
  const niveauHeros = config.niveauHeros;
  if (!estEntier(niveauHeros) || niveauHeros < 1 || niveauHeros > REGLES.niveauHerosMax) {
    return `Niveau de héros invalide : ${String(niveauHeros)}`;
  }
  return (
    verifierCompetences(config, niveauHeros) ??
    verifierRangs(config.ameliorations, 'Améliorations', (id) => defBranche(id)?.rangMax) ??
    verifierObjets(config.objets) ??
    verifierDefi(config.defi, config.objets) ??
    verifierInfini(config.infini, config.defi) ??
    verifierBonus(config.bonus)
  );
}

/**
 * Copie propre d'une config déjà vérifiée : seuls les champs connus, sans lien avec l'objet d'origine. `defi` absent ou
 * null et `bonus` absent ou vide ne sont pas rangés : la config d'une partie ordinaire reste celle d'avant le jalon 3
 * (même état, même sauvegarde), et tout le moteur lit un `defi` absent comme null et un `bonus` absent comme vide.
 */
export function copierConfig(config: ConfigPartie): ConfigPartie {
  const copie: ConfigPartie = {
    graine: config.graine,
    difficulte: config.difficulte,
    dieu: config.dieu,
    heros: config.heros,
    niveauHeros: config.niveauHeros,
    competencesHeros: { ...config.competencesHeros },
    ameliorations: { ...config.ameliorations },
    objets: [...config.objets],
    versionDonnees: config.versionDonnees,
  };
  if (config.defi) copie.defi = config.defi;
  if (config.infini) copie.infini = { region: config.infini.region };
  const bonus = copierBonus(config.bonus);
  if (Object.keys(bonus.tours).length > 0 || Object.keys(bonus.heros).length > 0) copie.bonus = bonus;
  return copie;
}
