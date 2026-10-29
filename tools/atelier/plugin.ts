// Branche l'API de l'atelier sur le serveur de développement de Vite. Le serveur n'écoute que sur la boucle locale ;
// en plus, chaque requête est refusée si son Host n'est pas local (rebond DNS), si son Origin n'est pas local (page
// tierce) et, pour les POST, si son Origin n'est pas exactement celui du serveur.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { traiter } from './api.ts';
import type { Adaptateur } from './types.ts';

const TAILLE_MAX = 8 * 1024 * 1024;
const HOTE_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function hoteLocal(hote: string | undefined): boolean {
  return hote !== undefined && HOTE_LOCAL.test(hote);
}

export function origineLocale(origine: string | undefined): boolean {
  if (origine === undefined) return true;
  try {
    return hoteLocal(new URL(origine).host);
  } catch {
    return false;
  }
}

/** Même origine que le serveur : l'Origin d'un POST doit être exactement `http://<Host de la requête>`. */
export function memeOrigine(origine: string | undefined, hote: string | undefined): boolean {
  return origine !== undefined && hote !== undefined && origine === `http://${hote}`;
}

class ErreurTaille extends Error {}

function lireCorps(req: IncomingMessage, tailleMax: number): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const annoncee = Number(req.headers['content-length']);
    if (Number.isFinite(annoncee) && annoncee > tailleMax) {
      rejeter(new ErreurTaille('Requête trop grande'));
      return;
    }
    const morceaux: Buffer[] = [];
    let taille = 0;
    let trop = false;
    req.on('data', (m: Buffer) => {
      if (trop) return;
      taille += m.length;
      if (taille > tailleMax) {
        trop = true;
        morceaux.length = 0;
        rejeter(new ErreurTaille('Requête trop grande'));
        return;
      }
      morceaux.push(m);
    });
    req.on('end', () => { if (!trop) resoudre(Buffer.concat(morceaux).toString('utf8')); });
    req.on('error', rejeter);
  });
}

function repondre(res: ServerResponse, statut: number, corps: unknown): void {
  const texte = JSON.stringify(corps);
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(texte);
}

/** Le traitement des requêtes `/api/…` ; les autres passent à `suite`. */
export function middlewareAtelier(adaptateur: Adaptateur, tailleMax = TAILLE_MAX): (req: IncomingMessage, res: ServerResponse, suite: () => void) => void {
  return (req, res, suite) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) {
      suite();
      return;
    }
    const methode = req.method ?? 'GET';
    if (!hoteLocal(req.headers.host) || !origineLocale(req.headers.origin) || (methode === 'POST' && !memeOrigine(req.headers.origin, req.headers.host))) {
      repondre(res, 403, { erreur: 'Atelier réservé à la machine locale' });
      return;
    }
    void (async () => {
      let corps: unknown = null;
      if (methode === 'POST') {
        // Un formulaire d'un autre site ne sait pas envoyer ce type : refus des requêtes croisées simples.
        if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
          repondre(res, 415, { erreur: 'JSON attendu' });
          return;
        }
        let brut: string;
        try {
          brut = await lireCorps(req, tailleMax);
        } catch (e) {
          // Répond avant de couper la connexion, sinon le client voit une coupure et pas le 413.
          const trop = e instanceof ErreurTaille;
          res.setHeader('Connection', 'close');
          repondre(res, trop ? 413 : 400, { erreur: trop ? 'Requête trop grande' : 'Requête illisible' });
          // On lit et jette la suite du corps un instant (le client finit d'envoyer et voit la réponse), puis on coupe.
          req.resume();
          setTimeout(() => { req.destroy(); }, 1000).unref();
          return;
        }
        try {
          corps = JSON.parse(brut);
        } catch {
          repondre(res, 400, { erreur: 'JSON invalide' });
          return;
        }
      } else if (methode !== 'GET') {
        repondre(res, 405, { erreur: 'Méthode non permise' });
        return;
      }
      const reponse = await traiter(adaptateur, methode, url.pathname, url.searchParams, corps);
      repondre(res, reponse.statut, reponse.corps);
    })();
  };
}

export function pluginAtelier(adaptateur: Adaptateur): Plugin {
  return {
    name: 'atelier-api',
    configureServer(serveur) {
      serveur.middlewares.use(middlewareAtelier(adaptateur));
    },
  };
}
