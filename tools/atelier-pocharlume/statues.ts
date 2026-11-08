// La statue de chaque carte dans l'atelier : lue et réécrite dans le TEXTE de src/data/niveaux/statues.ts (une ligne
// `id: { x: …, y: …, origine: '…' },` par carte dans la table POSITIONS ; seuls x et y de la carte concernée changent),
// jugée avec les règles de son test (src/data/niveaux/statues.test.ts) pour chaque niveau qui emploie la carte : sprite
// dans la carte et dans une seule case de la grille, case hors chemin, case que le décor du niveau interdit déjà à la
// construction, aucun décor recouvert.
//
// Position : celle du fichier, le pied du sprite en tuiles. À la souris l'interface l'aimante au demi-tuile (le pas de
// toutes les statues sauf `pendus`, réglée à la main en 15.9) ; aux flèches elle part de la position actuelle (Maj : une
// case entière, ce qui garde la place de la statue dans sa case). Elle est arrondie au millième de tuile avant d'être
// jugée et écrite, pour qu'un reste de calcul flottant ne finisse pas dans le fichier. L'origine (donc le sprite) ne se
// change pas ici. Sans le fichier, la statue est montrée désactivée avec un message.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Carte } from '../../src/engine/definitions';
import { caseExiste, estCaseDeChemin, estCaseInterdite } from '../../src/engine/grille';
import { REGLES } from '../../src/data/regles';
import type { Decor } from '../../src/data/visuel';
import { decorVisible } from '../../src/data/niveaux/assemblage';
import type { CarteModele } from '../../src/data/niveaux/cartes-toutes';
import { rectsSeChevauchent } from '../../src/data/niveaux/geometrie';
import { casesInterditesDuNiveau, tuilesDeChemin } from '../../src/data/niveaux/grille-niveau';
import { empriseDecor, GRANDS_DECORS, zonesBloquantes } from '../../src/data/niveaux/habillage';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans';
import { SPRITE_STATUE, type OrigineStatue } from '../../src/data/niveaux/statues';
import type { ErreurCarte } from '../atelier/types.ts';

export const CHEMIN_STATUES = 'src/data/niveaux/statues.ts';
/** Identifiant de l'objet statue dans le document de carte (les décors sont `decor-<rang>`). */
export const ID_STATUE = 'statue';

/** La ligne de la statue d'une carte dans statues.ts. */
export interface LigneStatue {
  /** Numéro de ligne dans le fichier, à partir de 1. */
  readonly ligne: number;
  readonly x: number;
  readonly y: number;
  readonly origine: OrigineStatue;
  readonly sprite: string;
}

export interface EtatStatues {
  readonly actif: boolean;
  readonly raison?: string;
  /** Texte de statues.ts (null s'il n'existe pas) : il entre dans l'empreinte de la carte. */
  readonly texte: string | null;
  readonly statue: LigneStatue | null;
}

const DEBUT_TABLE = /^const POSITIONS\b.*=\s*\{\s*$/;
const LIGNE_STATUE = /^(\s*([a-z0-9_]+):\s*\{\s*x:\s*)(-?\d+(?:\.\d+)?)(,\s*y:\s*)(-?\d+(?:\.\d+)?)(,\s*origine:\s*'([a-z_]+)'\s*\}\s*,?\s*(?:\/\/.*)?)$/;

/** Arrondi au millième de tuile, appliqué à la position de la statue avant de la juger et de l'écrire. */
export const arrondirPosition = (v: number): number => Math.round(v * 1000) / 1000;

/** Lit la statue de la carte `id` (identifiant déjà validé) dans le texte de statues.ts. Lève si le format n'est pas reconnu. */
export function lireStatue(racine: string, id: string): EtatStatues {
  const chemin = join(racine, CHEMIN_STATUES);
  if (!existsSync(chemin)) return { actif: false, raison: `${CHEMIN_STATUES} introuvable : statue non modifiable`, texte: null, statue: null };
  const texte = readFileSync(chemin, 'utf8');
  const lignes = texte.split('\n');
  const debut = lignes.findIndex((l) => DEBUT_TABLE.test(l.replace(/\r$/, '')));
  if (debut < 0) throw new Error(`${CHEMIN_STATUES} : table « const POSITIONS … = { » introuvable`);
  for (let i = debut + 1; i < lignes.length; i++) {
    const brute = (lignes[i] ?? '').replace(/\r$/, '');
    if (/^\s*\};?\s*$/.test(brute)) return { actif: false, raison: `${CHEMIN_STATUES} : pas de statue pour la carte ${id}`, texte, statue: null };
    if (brute.trim() === '' || brute.trim().startsWith('//')) continue;
    const m = LIGNE_STATUE.exec(brute);
    if (!m) throw new Error(`${CHEMIN_STATUES}:${String(i + 1)} : ligne de statue non reconnue « ${brute.trim()} »`);
    if (m[2] !== id) continue;
    const origine = m[7] ?? '';
    if (!Object.hasOwn(SPRITE_STATUE, origine)) throw new Error(`${CHEMIN_STATUES}:${String(i + 1)} : origine inconnue « ${origine} »`);
    const o = origine as OrigineStatue;
    return { actif: true, texte, statue: { ligne: i + 1, x: Number(m[3]), y: Number(m[5]), origine: o, sprite: SPRITE_STATUE[o] } };
  }
  throw new Error(`${CHEMIN_STATUES} : fin de la table POSITIONS introuvable`);
}

/** Le texte de statues.ts avec la statue à (x, y) : seuls les deux nombres de sa ligne changent. Null si la ligne n'est plus reconnue. */
export function reecrireStatue(texte: string, statue: LigneStatue, x: number, y: number): string | null {
  const lignes = texte.split('\n');
  const brute = lignes[statue.ligne - 1] ?? '';
  const cr = brute.endsWith('\r') ? '\r' : '';
  const m = LIGNE_STATUE.exec(brute.replace(/\r$/, ''));
  if (!m) return null;
  if (x !== statue.x || y !== statue.y) lignes[statue.ligne - 1] = `${m[1] ?? ''}${String(x)}${m[4] ?? ''}${String(y)}${m[6] ?? ''}${cr}`;
  return lignes.join('\n');
}

/** Ce qu'il faut pour juger la statue d'une carte dans une disposition. */
export interface ContexteStatue {
  readonly carte: string;
  readonly modele: CarteModele;
  readonly sprite: string;
  readonly x: number;
  readonly y: number;
  readonly deplacee: boolean;
  /** Décors de la carte à l'ouverture et dans la disposition jugée (même ordre), et leurs identifiants d'objet. */
  readonly avant: readonly Decor[];
  readonly apres: readonly Decor[];
  readonly ids: readonly string[];
  /** Identifiants des décors déplacés. */
  readonly deplaces: ReadonlySet<string>;
}

/** Les niveaux qui emploient la carte, avec leurs chemins (la carte entière si aucun niveau ne l'emploie). */
function niveauxDe(id: string, modele: CarteModele): { numero: number | null; carte: Carte }[] {
  const base = { largeur: modele.largeur, hauteur: modele.hauteur, departHeros: modele.departHeros };
  const plans = PLANS_REGIONS.flat().filter((p) => p.carte === id);
  if (plans.length === 0) return [{ numero: null, carte: { ...base, chemins: modele.chemins } }];
  return plans.map((p) => ({ numero: p.numero, carte: { ...base, chemins: p.chemins.flatMap((i) => { const c = modele.chemins[i]; return c ? [c] : []; }) } }));
}

function caseDeChemin(carte: Carte, cx: number, cy: number): boolean {
  if (estCaseDeChemin(carte, cx, cy)) return true;
  const t = REGLES.tailleCase;
  const masque = tuilesDeChemin(carte);
  for (let dy = 0; dy < t; dy++) {
    for (let dx = 0; dx < t; dx++) if (masque[(cy * t + dy) * carte.largeur + cx * t + dx] !== 0) return true;
  }
  return false;
}

/**
 * Les erreurs de la statue dans la disposition donnée. Une erreur revient à la statue si elle a été déplacée, et aux décors
 * déplacés qui la causent (décor posé sur la statue, grand décor retiré de sa case), pour que l'interface refuse le
 * déplacement fautif ; à défaut (fichier déjà invalide), à la statue.
 */
export function verifierStatue(c: ContexteStatue): ErreurCarte[] {
  const taille = REGLES.tailleCase;
  const quoi = `Statue (${c.sprite}) en (${String(c.x)}, ${String(c.y)})`;
  const r = empriseDecor({ sprite: c.sprite, x: c.x, y: c.y });
  if (!(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= c.modele.largeur && r.y1 <= c.modele.hauteur)) return [{ objet: ID_STATUE, message: `${quoi} sortirait de la carte` }];
  // Le sprite tient dans une seule case de la grille : c'est la zone de toucher de la statue.
  const cx = Math.floor(c.x / taille);
  const cy = Math.floor((c.y - 0.5) / taille);
  const uneCase = Math.floor(r.x0 / taille) === cx && Math.floor((r.x1 - 1e-9) / taille) === cx && Math.floor(r.y0 / taille) === cy && Math.floor((r.y1 - 1e-9) / taille) === cy;
  if (!uneCase) return [{ objet: ID_STATUE, message: `${quoi} serait à cheval sur deux cases de la grille : elle doit tenir dans une seule case` }];

  const interdite = (carte: Carte, decors: readonly Decor[]): boolean =>
    estCaseInterdite({ carte, casesInterdites: casesInterditesDuNiveau(carte, decorVisible({ ...c.modele, decor: decors }, carte), zonesBloquantes(c.modele)) }, cx, cy);
  const fautes = new Map<string, { objets: Set<string>; niveaux: (number | null)[] }>();
  const noter = (message: string, objets: readonly string[], numero: number | null): void => {
    const f = fautes.get(message) ?? { objets: new Set<string>(), niveaux: [] };
    for (const o of objets.length > 0 ? objets : [ID_STATUE]) f.objets.add(o);
    f.niveaux.push(numero);
    fautes.set(message, f);
  };
  const statue = c.deplacee ? [ID_STATUE] : [];
  for (const { numero, carte } of niveauxDe(c.carte, c.modele)) {
    if (!caseExiste(carte, cx, cy)) { noter(`${quoi} sortirait de la carte`, [ID_STATUE], numero); continue; }
    if (caseDeChemin(carte, cx, cy)) { noter(`${quoi} serait sur le chemin`, [ID_STATUE], numero); continue; }
    if (!interdite(carte, c.apres)) {
      // Case qu'aucun décor n'interdit : la faute est aussi aux grands décors déplacés s'ils l'interdisaient à l'ouverture.
      const responsables = interdite(carte, c.avant) ? c.ids.filter((id, i) => c.deplaces.has(id) && GRANDS_DECORS.has(c.apres[i]?.sprite ?? '')) : [];
      noter(`${quoi} serait sur une case constructible : elle va sur une case que le décor interdit déjà à la construction`, [...statue, ...responsables], numero);
    }
    for (const d of decorVisible({ ...c.modele, decor: c.apres }, carte)) {
      if (!rectsSeChevauchent(r, empriseDecor(d))) continue;
      const id = c.ids[c.apres.indexOf(d)] ?? '';
      noter(`${quoi} recouvrirait ${d.sprite} en (${String(d.x)}, ${String(d.y)})`, [...statue, ...(c.deplaces.has(id) ? [id] : [])], numero);
    }
  }
  return [...fautes].flatMap(([message, f]) => {
    const numeros = f.niveaux.filter((n): n is number => n !== null);
    const suffixe = numeros.length === 0 ? '' : ` (${numeros.length > 1 ? 'niveaux' : 'niveau'} ${numeros.join(', ')})`;
    return [...f.objets].map((objet) => ({ objet, message: `${message}${suffixe}` }));
  });
}
