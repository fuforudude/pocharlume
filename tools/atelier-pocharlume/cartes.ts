// Module « cartes » de l'adaptateur Pocharlume : déplacer les décors d'une carte (src/data/niveaux/cartes*.ts) sur la
// grille des tuiles. Les règles sont celles du jeu, appelées telles quelles : emprise des sprites (habillage.ts), cases
// interdites par le chemin et les grands décors (grille-niveau.ts), décor visible selon les chemins du niveau (assemblage.ts).
//
// Ce module isole tout ce qui dépend du format des données de carte : si ce format change (j5-densite), c'est ici
// qu'on adapte. Les décors sont lus et réécrits dans le TEXTE du fichier (une ligne `decor('sprite', x, y[, true])`
// chacun) ; seuls x et y des décors déplacés sont modifiés, tout le reste du fichier reste identique.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Carte } from '../../src/engine/definitions';
import { REGLES } from '../../src/data/regles';
import type { Decor } from '../../src/data/visuel';
import { decorVisible } from '../../src/data/niveaux/assemblage';
import { CARTES, type CarteModele } from '../../src/data/niveaux/cartes-toutes';
import { distanceRectChemin } from '../../src/data/niveaux/geometrie';
import { casesInterditesDuNiveau } from '../../src/data/niveaux/grille-niveau';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, GRANDS_DECORS, MARGE_DECOR } from '../../src/data/niveaux/habillage';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans';
import type { Ecriture, ErreurCarte, LigneBilan, ModuleCartes, ObjetCarte, Positions, VerificationCarte } from '../atelier/types.ts';
import { etatStatues } from './statues.ts';

const DOSSIER_CARTES = 'src/data/niveaux';
const AVERTISSEMENT = 'Les cases constructibles changent : un niveau peut devenir plus facile ou plus dur. Relancer l\'équilibrage (npm run balance) et les tests avant de commiter.';

interface LigneDecor {
  readonly index: number;
  /** Numéro de ligne dans le fichier, à partir de 1. */
  readonly ligne: number;
  readonly sprite: string;
  readonly x: number;
  readonly y: number;
  readonly miroir: boolean;
}

interface CarteTexte {
  readonly fichier: string;
  readonly decors: readonly LigneDecor[];
}

const LIGNE_DECOR = /^(\s*decor\(\s*')([^']+)(',\s*)(-?\d+(?:\.\d+)?)(,\s*)(-?\d+(?:\.\d+)?)((?:,\s*(?:true|false))?\s*\)\s*,?\s*(?:\/\/.*)?)$/;

/** Fichiers de données des cartes, relatifs à la racine (le fichier qui les rassemble n'en fait pas partie). */
function fichiersCartes(racine: string): string[] {
  return readdirSync(join(racine, DOSSIER_CARTES)).filter((f) => /^cartes.*\.ts$/.test(f) && f !== 'cartes-toutes.ts').sort().map((f) => `${DOSSIER_CARTES}/${f}`);
}

/** Lit dans le texte les décors de la carte `id` (dans l'ordre du tableau `decor: [...]`). Lève si le format n'est pas reconnu. */
export function lireDecors(racine: string, id: string): { texte: string; carte: CarteTexte } {
  if (!/^[a-z0-9_]+$/.test(id)) throw new Error(`Carte inconnue : ${id}`);
  for (const fichier of fichiersCartes(racine)) {
    const texte = readFileSync(join(racine, fichier), 'utf8');
    const lignes = texte.split('\n');
    const debut = lignes.findIndex((l) => new RegExp(`^\\s*id:\\s*'${id}'`).test(l));
    if (debut < 0) continue;
    const ouverture = lignes.findIndex((l, i) => i > debut && /^\s*decor:\s*\[\s*$/.test(l.replace(/\r$/, '')));
    if (ouverture < 0) throw new Error(`Carte ${id} : tableau « decor: [ » introuvable dans ${fichier}`);
    const decors: LigneDecor[] = [];
    for (let i = ouverture + 1; i < lignes.length; i++) {
      const brute = (lignes[i] ?? '').replace(/\r$/, '');
      if (/^\s*\],?\s*$/.test(brute)) return { texte, carte: { fichier, decors } };
      if (brute.trim() === '' || brute.trim().startsWith('//')) continue;
      const m = LIGNE_DECOR.exec(brute);
      if (!m) throw new Error(`${fichier}:${String(i + 1)} : ligne de décor non reconnue « ${brute.trim()} »`);
      decors.push({ index: decors.length, ligne: i + 1, sprite: m[2] ?? '', x: Number(m[4]), y: Number(m[6]), miroir: /true/.test(m[7] ?? '') });
    }
    throw new Error(`Carte ${id} : fin du tableau decor introuvable dans ${fichier}`);
  }
  throw new Error(`Carte inconnue : ${id}`);
}

function modeleDe(id: string): CarteModele {
  const modele = (CARTES as Record<string, CarteModele>)[id];
  if (!modele) throw new Error(`Carte inconnue : ${id}`);
  return modele;
}

const idObjet = (index: number): string => `decor-${String(index)}`;

function emprise(sprite: string): ObjetCarte['emprise'] {
  const r = empriseDecor({ sprite, x: 0, y: 0 });
  return { gauche: -r.x0, haut: -r.y0, droite: r.x1, bas: r.y1 };
}

/** Chemins utilisés par tous les niveaux qui emploient la carte (ou tous si aucun niveau ne l'emploie). */
function cheminsToujoursUtilises(id: string, nombre: number): Set<number> {
  const plans = PLANS_REGIONS.flat().filter((p) => p.carte === id);
  if (plans.length === 0) return new Set(Array.from({ length: nombre }, (_, i) => i));
  return new Set(Array.from({ length: nombre }, (_, i) => i).filter((i) => plans.every((p) => p.chemins.includes(i))));
}

function constructibles(modele: CarteModele, chemins: Carte['chemins'], decors: readonly Decor[]): { libres: number; bloquees: number[] } {
  const taille = REGLES.tailleCase;
  const carte: Carte = { largeur: modele.largeur, hauteur: modele.hauteur, chemins, departHeros: modele.departHeros };
  const visibles = decorVisible({ ...modele, decor: decors }, carte);
  const interdites = casesInterditesDuNiveau(carte, visibles);
  const colonnes = Math.floor(modele.largeur / taille);
  const total = colonnes * Math.floor(modele.hauteur / taille);
  return { libres: total - interdites.length, bloquees: interdites.map((c) => c.cy * colonnes + c.cx) };
}

function decorsAvec(lignes: readonly LigneDecor[], positions: Positions): Decor[] {
  return lignes.map((l) => {
    const p = positions[idObjet(l.index)];
    return { sprite: l.sprite, x: p?.x ?? l.x, y: p?.y ?? l.y, ...(l.miroir ? { miroir: true } : {}) };
  });
}

function verifierCarte(racine: string, id: string, positions: Positions): VerificationCarte {
  const modele = modeleDe(id);
  const { carte: texte } = lireDecors(racine, id);
  const apres = decorsAvec(texte.decors, positions);
  const avant = decorsAvec(texte.decors, {});
  const toujours = cheminsToujoursUtilises(id, modele.chemins.length);
  const erreurs: ErreurCarte[] = [];
  apres.forEach((d, i) => {
    // Seuls les décors déplacés sont jugés : ceux que la carte contient déjà sur un chemin sont masqués par le jeu (assemblage.ts).
    const depart = avant[i];
    if (depart?.x === d.x && depart.y === d.y) return;
    const r = empriseDecor(d);
    const quoi = `${d.sprite} en (${String(d.x)}, ${String(d.y)})`;
    if (!(r.x0 >= 0 && r.x1 <= modele.largeur && r.y0 >= 0 && r.y1 <= modele.hauteur)) {
      erreurs.push({ objet: idObjet(i), message: `${quoi} sortirait de la carte` });
    }
    for (const c of toujours) {
      const chemin = modele.chemins[c];
      if (chemin && distanceRectChemin(r, chemin.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR) {
        erreurs.push({ objet: idObjet(i), message: `${quoi} serait sur le chemin ${String(c + 1)}` });
        break;
      }
    }
  });
  const bilan: LigneBilan[] = [];
  const toutes = constructibles(modele, modele.chemins, apres);
  bilan.push({ libelle: 'Carte entière (tous les chemins)', avant: constructibles(modele, modele.chemins, avant).libres, apres: toutes.libres });
  for (const plan of PLANS_REGIONS.flat().filter((p) => p.carte === id)) {
    const chemins = plan.chemins.flatMap((i) => { const c = modele.chemins[i]; return c ? [c] : []; });
    bilan.push({ libelle: `Niveau ${String(plan.numero)}`, avant: constructibles(modele, chemins, avant).libres, apres: constructibles(modele, chemins, apres).libres });
  }
  return { erreurs, casesBloquees: toutes.bloquees, bilan, avertissement: AVERTISSEMENT };
}

export function moduleCartes(racine: string): ModuleCartes {
  return {
    lister: () => Promise.resolve(Object.entries(CARTES).map(([cle, c]) => ({ id: cle, nom: cle.replaceAll('_', ' '), groupe: `Région ${String(c.region)}` }))),

    ouvrir: (id) => {
      const modele = modeleDe(id);
      const { carte } = lireDecors(racine, id);
      const statues = etatStatues(racine);
      return Promise.resolve({
        id,
        nom: `${id.replaceAll('_', ' ')} (région ${String(modele.region)})`,
        colonnes: modele.largeur,
        lignes: modele.hauteur,
        pas: REGLES.tailleCase,
        aimantation: 0.5,
        chemins: modele.chemins.map((c) => c.points),
        genres: [
          { id: 'decor', libelle: 'Petit décor', couleur: '#8fb35a', actif: true },
          { id: 'grand-decor', libelle: 'Grand décor (bloque des cases)', couleur: '#d98a3a', actif: true },
          { id: 'statue', libelle: 'Statue', couleur: '#c9b6e8', actif: statues.actif, raison: statues.raison },
        ],
        objets: carte.decors.map((d): ObjetCarte => ({
          id: idObjet(d.index),
          genre: GRANDS_DECORS.has(d.sprite) ? 'grand-decor' : 'decor',
          libelle: d.sprite,
          x: d.x,
          y: d.y,
          emprise: emprise(d.sprite),
        })),
        verification: verifierCarte(racine, id, {}),
      });
    },

    verifier: (id, positions) => Promise.resolve(verifierCarte(racine, id, positions)),

    enregistrer: (id, positions): Promise<readonly Ecriture[]> => {
      const verification = verifierCarte(racine, id, positions);
      if (verification.erreurs.length > 0) throw new Error(`Carte refusée : ${verification.erreurs.map((e) => e.message).join(' ; ')}`);
      const { texte, carte } = lireDecors(racine, id);
      const lignes = texte.split('\n');
      for (const [objet, p] of Object.entries(positions)) {
        const m = /^decor-(\d+)$/.exec(objet);
        const d = m ? carte.decors[Number(m[1])] : undefined;
        if (!d) throw new Error(`Objet inconnu : ${objet}`);
        if (p.x === d.x && p.y === d.y) continue;
        const brute = lignes[d.ligne - 1] ?? '';
        const cr = brute.endsWith('\r') ? '\r' : '';
        const lue = LIGNE_DECOR.exec(brute.replace(/\r$/, ''));
        if (!lue) throw new Error(`Ligne ${String(d.ligne)} modifiée depuis la lecture`);
        lignes[d.ligne - 1] = `${lue[1] ?? ''}${lue[2] ?? ''}${lue[3] ?? ''}${String(p.x)}${lue[5] ?? ''}${String(p.y)}${lue[7] ?? ''}${cr}`;
      }
      return Promise.resolve([{ chemin: carte.fichier, contenu: lignes.join('\n') }]);
    },
  };
}
