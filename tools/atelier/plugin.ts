// Branche l'API de l'atelier sur le serveur de développement de Vite. Le serveur n'écoute que sur la boucle locale ;
// en plus, chaque requête est refusée si son Host ou son Origin n'est pas local (attaque par rebond DNS, page tierce).
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

function lireCorps(req: IncomingMessage): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const morceaux: Buffer[] = [];
    let taille = 0;
    req.on('data', (m: Buffer) => {
      taille += m.length;
      if (taille > TAILLE_MAX) {
        rejeter(new Error('Requête trop grande'));
        req.destroy();
        return;
      }
      morceaux.push(m);
    });
    req.on('end', () => { resoudre(Buffer.concat(morceaux).toString('utf8')); });
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

export function pluginAtelier(adaptateur: Adaptateur): Plugin {
  return {
    name: 'atelier-api',
    configureServer(serveur) {
      serveur.middlewares.use((req, res, suite) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith('/api/')) {
          suite();
          return;
        }
        if (!hoteLocal(req.headers.host) || !origineLocale(req.headers.origin)) {
          repondre(res, 403, { erreur: 'Atelier réservé à la machine locale' });
          return;
        }
        const methode = req.method ?? 'GET';
        void (async () => {
          let corps: unknown = null;
          if (methode === 'POST') {
            // Un formulaire d'un autre site ne sait pas envoyer ce type : refus des requêtes croisées simples.
            if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
              repondre(res, 415, { erreur: 'JSON attendu' });
              return;
            }
            try {
              corps = JSON.parse(await lireCorps(req));
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
      });
    },
  };
}
