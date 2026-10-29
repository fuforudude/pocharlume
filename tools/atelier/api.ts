// API JSON de l'atelier, indépendante de HTTP : une requête (méthode, chemin, corps) donne une réponse. Le plugin
// du serveur ne fait que la brancher ; les tests l'appellent directement.
import { ecrireFichiers, ErreurChemin } from './chemins.ts';
import { ErreurConflit, ErreurIntrouvable, ErreurRequete, type Adaptateur, type CalquesModifies, type Deplacements, type Positions } from './types.ts';

export interface Reponse {
  readonly statut: number;
  readonly corps: unknown;
}

function objet(valeur: unknown, quoi: string): Record<string, unknown> {
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) throw new ErreurRequete(`${quoi} : objet attendu`);
  return valeur as Record<string, unknown>;
}

function texte(valeur: unknown, quoi: string): string {
  if (typeof valeur !== 'string' || valeur === '' || valeur.length > 300) throw new ErreurRequete(`${quoi} : texte attendu`);
  return valeur;
}

function calques(valeur: unknown): CalquesModifies {
  const brut = objet(valeur, 'calques');
  const sortie: Record<string, string[]> = {};
  for (const [id, lignes] of Object.entries(brut)) {
    if (!Array.isArray(lignes) || lignes.some((l) => typeof l !== 'string' || l.length > 4096)) throw new ErreurRequete(`calque ${id} : lignes attendues`);
    sortie[id] = lignes as string[];
  }
  return sortie;
}

function positions(valeur: unknown): Positions {
  const brut = objet(valeur, 'positions');
  const sortie: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(brut)) {
    const o = objet(p, `position de ${id}`);
    if (typeof o['x'] !== 'number' || typeof o['y'] !== 'number' || !Number.isFinite(o['x']) || !Number.isFinite(o['y'])) {
      throw new ErreurRequete(`position de ${id} : nombres attendus`);
    }
    sortie[id] = { x: o['x'], y: o['y'] };
  }
  return sortie;
}

function deplacements(valeur: unknown): Deplacements {
  const brut = objet(valeur, 'deplaces');
  const sortie: Record<string, Deplacements[string]> = {};
  const nombre = (v: unknown, quoi: string): number => {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new ErreurRequete(`${quoi} : nombre attendu`);
    return v;
  };
  for (const [id, p] of Object.entries(brut)) {
    const o = objet(p, `déplacement de ${id}`);
    const origine = objet(o['origine'], `origine de ${id}`);
    sortie[id] = { x: nombre(o['x'], id), y: nombre(o['y'], id), origine: { libelle: texte(origine['libelle'], 'libelle'), x: nombre(origine['x'], id), y: nombre(origine['y'], id) } };
  }
  return sortie;
}

function changements(valeur: unknown): Record<string, string> {
  const brut = objet(valeur, 'changements');
  const sortie: Record<string, string> = {};
  for (const [lettre, couleur] of Object.entries(brut)) {
    if (typeof couleur !== 'string' || !/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(couleur)) throw new ErreurRequete(`couleur de « ${lettre} » invalide`);
    sortie[lettre] = couleur.toLowerCase();
  }
  return sortie;
}

async function enregistrer(a: Adaptateur, ecritures: Parameters<typeof ecrireFichiers>[1]): Promise<unknown> {
  const ecrits = ecrireFichiers(a.racine, ecritures, a.ecriturePermise);
  const apres = ecrits.length > 0 && a.apresEcriture ? await a.apresEcriture(ecrits) : null;
  return { ecrits, apres };
}

/** Traite une requête. Les erreurs de saisie donnent 400, un chemin refusé 403, le reste 500 avec le message. */
export async function traiter(a: Adaptateur, methode: string, chemin: string, requete: URLSearchParams, corps: unknown): Promise<Reponse> {
  try {
    return { statut: 200, corps: await router(a, methode, chemin, requete, corps) };
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    if (erreur instanceof ErreurRequete) return { statut: 400, corps: { erreur: message } };
    if (erreur instanceof ErreurChemin) return { statut: 403, corps: { erreur: message } };
    if (erreur instanceof ErreurIntrouvable) return { statut: 404, corps: { erreur: message } };
    if (erreur instanceof ErreurConflit) return { statut: 409, corps: { erreur: message } };
    return { statut: 500, corps: { erreur: message } };
  }
}

async function router(a: Adaptateur, methode: string, chemin: string, q: URLSearchParams, corps: unknown): Promise<unknown> {
  const pris = (nom: string): string => texte(q.get(nom), nom);
  const module = <T>(m: T | undefined, nom: string): T => {
    if (!m) throw new ErreurIntrouvable(`Cet adaptateur n'a pas de module ${nom}`);
    return m;
  };
  const cle = `${methode} ${chemin}`;
  switch (cle) {
    case 'GET /api/info':
      return { nom: a.nom, sprites: !!a.sprites, palette: !!a.palette, cartes: !!a.cartes, ecriturePermise: a.ecriturePermise };
    case 'GET /api/sprites':
      return module(a.sprites, 'sprites').lister();
    case 'GET /api/sprites/doc':
      return module(a.sprites, 'sprites').ouvrir(pris('id'));
    case 'POST /api/sprites/apercu': {
      const o = objet(corps, 'corps');
      return module(a.sprites, 'sprites').apercu(texte(o['id'], 'id'), calques(o['calques']), calques(o['origine']));
    }
    case 'POST /api/sprites/enregistrer': {
      const o = objet(corps, 'corps');
      const base = objet(o['base'], 'base');
      const ecritures = await module(a.sprites, 'sprites').enregistrer(texte(o['id'], 'id'), calques(o['calques']), { origine: calques(base['origine']), empreinte: texte(base['empreinte'], 'empreinte') });
      return enregistrer(a, ecritures);
    }
    case 'GET /api/palette':
      return module(a.palette, 'palette').lister();
    case 'GET /api/palette/doc':
      return module(a.palette, 'palette').ouvrir(pris('nom'));
    case 'POST /api/palette/apercu': {
      const o = objet(corps, 'corps');
      return module(a.palette, 'palette').apercu(texte(o['nom'], 'nom'), changements(o['changements']));
    }
    case 'POST /api/palette/enregistrer': {
      const o = objet(corps, 'corps');
      const ecritures = await module(a.palette, 'palette').enregistrer(texte(o['nom'], 'nom'), changements(o['changements']));
      return enregistrer(a, ecritures);
    }
    case 'GET /api/cartes':
      return module(a.cartes, 'cartes').lister();
    case 'GET /api/cartes/doc':
      return module(a.cartes, 'cartes').ouvrir(pris('id'));
    case 'POST /api/cartes/verifier': {
      const o = objet(corps, 'corps');
      return module(a.cartes, 'cartes').verifier(texte(o['id'], 'id'), positions(o['positions']));
    }
    case 'POST /api/cartes/enregistrer': {
      const o = objet(corps, 'corps');
      const ecritures = await module(a.cartes, 'cartes').enregistrer(texte(o['id'], 'id'), deplacements(o['deplaces']), texte(o['empreinte'], 'empreinte'));
      return enregistrer(a, ecritures);
    }
    default:
      throw new ErreurIntrouvable(`Route inconnue : ${cle}`);
  }
}
