// Les particularités (gimmicks des niveaux 101 à 150) telles que l'interface les présente : leur ligne sur la fiche du niveau,
// la fiche « Nouvelle particularité » la première fois qu'on en rencontre une, l'onglet du Bestiaire, les bulles en partie.
// Logique pure, sans DOM : tout est tiré des données (`Niveau.gimmick.type`) et des textes de src/i18n/fr-gimmicks.ts.
//
// Sauvegarde : aucune donnée nouvelle. Une particularité rencontrée est notée dans la liste des rencontres du bestiaire
// (`meta.bestiaire.rencontres`), sous l'identifiant `particularite_<type>` : il a la forme d'un identifiant d'ennemi (validation
// inchangée), ne peut pas se confondre avec un ennemi (aucun ne porte ce préfixe), se fusionne et s'exporte avec les rencontres,
// et l'écran des ennemis ne montre que les identifiants que la table des ennemis connaît. L'option des fiches « Nouvel ennemi »
// coupe aussi celles-ci.
import { gimmickRadeau, type EtatPartie } from '../engine';
import type { Gimmick, Niveau } from '../engine/definitions';
import { t, tCle } from '../i18n';
import { ennemiRencontre, type Sauvegarde } from '../save';
import type { ContenuBulle } from './bulle-contenus';

export type TypeParticularite = Gimmick['type'];

interface DefParticularite {
  /** Icône de l'atlas (fiche, onglet du Bestiaire). */
  readonly icone: string;
}

/** Une ligne par type de gimmick : le `Record` oblige à présenter tout nouveau type (sans elle, rien ne compile). */
const PARTICULARITES: Readonly<Record<TypeParticularite, DefParticularite>> = {
  corbeaux: { icone: 'icone-couloir' },
  radeau: { icone: 'icone-radeau' },
};

/** Les types de particularités, dans l'ordre où l'après-histoire les présente. */
export const TYPES_PARTICULARITES = Object.keys(PARTICULARITES) as TypeParticularite[];

export function iconeParticularite(type: TypeParticularite): string {
  return PARTICULARITES[type].icone;
}

export function nomParticularite(type: TypeParticularite): string {
  return tCle(`gimmick.${type}.nom`);
}

export function phraseParticularite(type: TypeParticularite): string {
  return tCle(`gimmick.${type}.phrase`);
}

export function conseilParticularite(type: TypeParticularite): string {
  return tCle(`gimmick.${type}.conseil`);
}

/** L'identifiant sous lequel une particularité rencontrée est notée dans `meta.bestiaire.rencontres`. */
export function idRencontreParticularite(type: TypeParticularite): string {
  return `particularite_${type}`;
}

export function particulariteRencontree(s: Sauvegarde, type: TypeParticularite): boolean {
  return ennemiRencontre(s, idRencontreParticularite(type));
}

/** « Particularité : <nom> — <phrase> » pour la fiche d'un niveau ; null pour un niveau sans gimmick. */
export function ligneParticularite(niveau: Pick<Niveau, 'gimmick'>): string | null {
  const type = niveau.gimmick?.type;
  return type ? t('gimmick.fiche_ligne', { nom: nomParticularite(type), phrase: phraseParticularite(type) }) : null;
}

/** Ce dont la décision a besoin de la session (une `Session` convient), comme pour les fiches « Nouvel ennemi ». */
export interface SourceParticularites {
  readonly sauvegarde: Sauvegarde;
  rencontrerEnnemis(ids: readonly string[]): Promise<unknown>;
}

/**
 * Le niveau qui commence a une particularité : si le joueur ne l'avait jamais rencontrée, elle est notée (pour toujours, même quand
 * l'option coupe les fiches) et la fiche est à montrer si l'option est active. Une partie hors sauvegarde ne note rien : sa fiche
 * ne s'ouvre que si `essai` le demande (niveaux d'essai du développement, pour voir la fiche).
 */
export function particulariteAMontrer(session: SourceParticularites, type: TypeParticularite, horsSauvegarde: boolean, essai = false): boolean {
  if (horsSauvegarde) return essai;
  if (particulariteRencontree(session.sauvegarde, type)) return false;
  session.rencontrerEnnemis([idRencontreParticularite(type)]).catch(console.error);
  return session.sauvegarde.meta.bestiaire.fiches;
}

/** Les particularités pour l'onglet du Bestiaire : chacune, rencontrée ou pas. */
export function vueParticularites(s: Sauvegarde): { type: TypeParticularite; rencontree: boolean }[] {
  return TYPES_PARTICULARITES.map((type) => ({ type, rencontree: particulariteRencontree(s, type) }));
}

/** La bulle d'une particularité (repère d'un couloir, fiche du Bestiaire) : son nom, sa phrase et comment s'y prendre. */
export function contenuParticularite(type: TypeParticularite, notes: readonly string[] = []): ContenuBulle {
  return { titre: nomParticularite(type), sousTitre: null, lignes: [], notes: [...notes, conseilParticularite(type)], texte: phraseParticularite(type) };
}

/** La bulle du radeau en partie : ses places libres et sa vitesse, lues dans l'état et les données. */
export function contenuRadeau(etat: EtatPartie): ContenuBulle | null {
  const g = gimmickRadeau(etat.niveau);
  if (!g) return null;
  const occupees = etat.tours.filter((tour) => tour.place >= 0).length;
  const vitesse = Math.round(g.vitesse * 100) / 100;
  return {
    titre: nomParticularite('radeau'),
    sousTitre: null,
    lignes: [
      { libelle: t('gimmick.radeau.places'), valeur: `${String(g.places.length - occupees)} / ${String(g.places.length)}` },
      { libelle: t('gimmick.radeau.vitesse'), valeur: t('bulle.ennemi.vitesse_valeur', { n: t(vitesse < 2 ? 'bulle.case_un' : 'bulle.cases', { n: String(vitesse).replace('.', ',') }) }) },
    ],
    notes: [t('gimmick.radeau.note')],
    texte: phraseParticularite('radeau'),
  };
}
