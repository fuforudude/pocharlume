// Validation de la config d'une partie. Elle vient de l'interface, d'une sauvegarde ou d'un journal relu : rien
// n'est fiable. Les tables de données ne sont lues que par propriétés propres (voir contenu.ts).
import { REGLES } from '../data/regles';
import { VERSION_DONNEES } from '../data/version';
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
  if (objets.length > REGLES.emplacementsObjets) return `Objets : ${String(REGLES.emplacementsObjets)} au plus`;
  const vus = new Set<string>();
  for (const objet of objets as unknown[]) {
    if (typeof objet !== 'string' || !defObjet(objet)) return `Objets : ${String(objet)} inconnu`;
    if (vus.has(objet)) return `Objets : ${objet} emporté deux fois`;
    vus.add(objet);
  }
  return null;
}

/**
 * Dit si la config permet de créer une partie. Renvoie la raison du refus, en français, ou null si elle est bonne.
 * Règles : version des données, difficulté, dieu et héros connus (le héros appartient au dieu), niveau du héros de 1 à 10,
 * compétences du héros connues (rang de 0 à 3, ultime à partir du niveau 6, pas plus de points que de niveaux), branches
 * de l'arbre connues (rang de 0 à 5), objets connus, distincts, trois au plus.
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
    verifierObjets(config.objets)
  );
}

/** Copie propre d'une config déjà vérifiée : seuls les champs connus, sans lien avec l'objet d'origine. */
export function copierConfig(config: ConfigPartie): ConfigPartie {
  return {
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
}
