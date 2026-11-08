// Module « cartes » de l'adaptateur Pocharlume : déplacer les décors d'une carte (src/data/niveaux/cartes*.ts) sur la
// grille des tuiles. Les règles sont celles du jeu, appelées telles quelles : emprise des sprites (habillage.ts), cases
// interdites par le chemin et les grands décors (grille-niveau.ts), décor visible selon les chemins du niveau (assemblage.ts).
//
// Ce module isole tout ce qui dépend du format des données de carte : si ce format change (j5-densite), c'est ici
// qu'on adapte. Les décors sont lus et réécrits dans le TEXTE du fichier (une ligne `decor('sprite', x, y[, true])`
// chacun) ; seuls x et y des décors déplacés sont modifiés, tout le reste du fichier reste identique. La statue de la
// carte (objet `statue`) vit dans src/data/niveaux/statues.ts : sa lecture, son écriture et ses règles sont dans statues.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Carte } from '../../src/engine/definitions';
import { REGLES } from '../../src/data/regles';
import type { Decor } from '../../src/data/visuel';
import { decorVisible } from '../../src/data/niveaux/assemblage';
import { CARTES, type CarteModele } from '../../src/data/niveaux/cartes-toutes';
import { distanceRectChemin } from '../../src/data/niveaux/geometrie';
import { casesInterditesDuNiveau } from '../../src/data/niveaux/grille-niveau';
import { DEMI_LARGEUR_CHEMIN, empriseDecor, GRANDS_DECORS, MARGE_DECOR, zonesBloquantes } from '../../src/data/niveaux/habillage';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans';
import { empreinte } from '../atelier/empreinte.ts';
import { ErreurConflit, ErreurIntrouvable, ErreurRequete, type Ecriture, type ErreurCarte, type LigneBilan, type ModuleCartes, type ObjetCarte, type Positions, type VerificationCarte } from '../atelier/types.ts';
import { mesures, niveauAvecDecors } from './seuils.ts';
import { arrondirPosition, CHEMIN_STATUES, ID_STATUE, lireStatue, reecrireStatue, verifierStatue, type EtatStatues } from './statues.ts';

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
  if (!/^[a-z0-9_]+$/.test(id)) throw new ErreurIntrouvable(`Carte inconnue : ${id}`);
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
  throw new ErreurIntrouvable(`Carte inconnue : ${id}`);
}

function modeleDe(id: string): CarteModele {
  const modele = (CARTES as Record<string, CarteModele>)[id];
  if (!modele) throw new ErreurIntrouvable(`Carte inconnue : ${id}`);
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
  const interdites = casesInterditesDuNiveau(carte, visibles, zonesBloquantes(modele));
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

/** Empreinte de ce qu'un enregistrement de la carte relit : son fichier de décors et, s'il existe, statues.ts. */
function empreinteCarte(texte: string, statues: EtatStatues): string {
  return empreinte(statues.texte === null ? [texte] : [texte, statues.texte]);
}

/** Position de la statue dans une disposition (celle du fichier si elle n'a pas bougé), arrondie comme elle sera écrite. */
function positionStatue(statue: NonNullable<EtatStatues['statue']>, positions: Positions): { x: number; y: number } {
  const p = positions[ID_STATUE];
  return p ? { x: arrondirPosition(p.x), y: arrondirPosition(p.y) } : { x: statue.x, y: statue.y };
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
  // Un niveau ne doit pas passer sous les seuils de jouabilité des tests de niveaux à cause d'un décor déplacé.
  const deplaces = apres.flatMap((d, i) => { const depart = avant[i]; return depart?.x === d.x && depart.y === d.y ? [] : [idObjet(i)]; });
  if (deplaces.length > 0) {
    for (const plan of PLANS_REGIONS.flat().filter((p) => p.carte === id)) {
      const avantMesures = mesures(niveauAvecDecors(modele, plan, avant), plan);
      mesures(niveauAvecDecors(modele, plan, apres), plan).forEach((m, k) => {
        if (m.valeur < m.minimum && m.valeur < (avantMesures[k]?.valeur ?? Infinity)) {
          for (const objet of deplaces) erreurs.push({ objet, message: `Niveau ${String(plan.numero)} : ${String(m.valeur)} ${m.nom}, il en faut au moins ${String(m.minimum)}` });
        }
      });
    }
  }
  // La statue est jugée dans toute disposition : elle a pu bouger, ou un décor déplacé a pu changer sa case.
  const { statue } = lireStatue(racine, id);
  if (statue) {
    const p = positionStatue(statue, positions);
    erreurs.push(...verifierStatue({ carte: id, modele, sprite: statue.sprite, ...p, deplacee: p.x !== statue.x || p.y !== statue.y, avant, apres, ids: texte.decors.map((l) => idObjet(l.index)), deplaces: new Set(deplaces) }));
  }
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
      const { texte, carte } = lireDecors(racine, id);
      const statues = lireStatue(racine, id);
      const statue = statues.statue;
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
          { id: 'statue', libelle: 'Statue (sur une case de décor)', couleur: '#c9b6e8', actif: statues.actif, ...(statues.raison === undefined ? {} : { raison: statues.raison }) },
        ],
        objets: [
          ...carte.decors.map((d): ObjetCarte => ({
            id: idObjet(d.index),
            genre: GRANDS_DECORS.has(d.sprite) ? 'grand-decor' : 'decor',
            libelle: d.sprite,
            x: d.x,
            y: d.y,
            emprise: emprise(d.sprite),
          })),
          ...(statue ? [{ id: ID_STATUE, genre: 'statue', libelle: statue.sprite, x: statue.x, y: statue.y, emprise: emprise(statue.sprite) }] : []),
        ],
        verification: verifierCarte(racine, id, {}),
        empreinte: empreinteCarte(texte, statues),
      });
    },

    verifier: (id, positions) => Promise.resolve(verifierCarte(racine, id, positions)),

    enregistrer: (id, deplaces, empreinteClient): Promise<readonly Ecriture[]> => {
      const { texte, carte } = lireDecors(racine, id);
      const statues = lireStatue(racine, id);
      const conflit = 'La carte a changé depuis son ouverture : la rouvrir avant d\'enregistrer (rien n\'a été écrit).';
      if (empreinteClient !== empreinteCarte(texte, statues)) throw new ErreurConflit(conflit);
      const positions: Record<string, { x: number; y: number }> = {};
      for (const [objet, p] of Object.entries(deplaces)) {
        if (objet === ID_STATUE) {
          const s = statues.statue;
          if (!s || s.sprite !== p.origine.libelle || s.x !== p.origine.x || s.y !== p.origine.y) throw new ErreurConflit(conflit);
          positions[objet] = { x: p.x, y: p.y };
          continue;
        }
        const m = /^decor-(\d+)$/.exec(objet);
        const d = m ? carte.decors[Number(m[1])] : undefined;
        if (!d) throw new ErreurConflit(conflit);
        if (d.sprite !== p.origine.libelle || d.x !== p.origine.x || d.y !== p.origine.y) throw new ErreurConflit(conflit);
        positions[objet] = { x: p.x, y: p.y };
      }
      const verification = verifierCarte(racine, id, positions);
      if (verification.erreurs.length > 0) throw new ErreurRequete(`Carte refusée : ${verification.erreurs.map((e) => e.message).join(' ; ')}`);
      const lignes = texte.split('\n');
      for (const [objet, p] of Object.entries(positions)) {
        if (objet === ID_STATUE) continue;
        const d = carte.decors[Number(/^decor-(\d+)$/.exec(objet)?.[1])];
        if (!d || (p.x === d.x && p.y === d.y)) continue;
        const brute = lignes[d.ligne - 1] ?? '';
        const cr = brute.endsWith('\r') ? '\r' : '';
        const lue = LIGNE_DECOR.exec(brute.replace(/\r$/, ''));
        if (!lue) throw new ErreurConflit(conflit);
        lignes[d.ligne - 1] = `${lue[1] ?? ''}${lue[2] ?? ''}${lue[3] ?? ''}${String(p.x)}${lue[5] ?? ''}${String(p.y)}${lue[7] ?? ''}${cr}`;
      }
      const ecritures: Ecriture[] = [{ chemin: carte.fichier, contenu: lignes.join('\n') }];
      // La statue déplacée : seule sa ligne change dans statues.ts (le fichier n'est pas réécrit si elle n'a pas bougé).
      const p = positions[ID_STATUE];
      if (p && statues.statue && statues.texte !== null) {
        const { x, y } = positionStatue(statues.statue, positions);
        const contenu = reecrireStatue(statues.texte, statues.statue, x, y);
        if (contenu === null) throw new ErreurConflit(conflit);
        ecritures.push({ chemin: CHEMIN_STATUES, contenu });
      }
      return Promise.resolve(ecritures);
    },
  };
}
