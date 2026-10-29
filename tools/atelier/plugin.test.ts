// Protections du serveur local : Host et Origin étrangers, Origin null, type de contenu, taille du corps.
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { middlewareAtelier } from './plugin.ts';
import type { Adaptateur } from './types.ts';

const adaptateur: Adaptateur = { nom: 'Test', racine: '.', ecriturePermise: [] };
let serveur: Server;
let port = 0;

beforeAll(async () => {
  const mw = middlewareAtelier(adaptateur, 1000);
  serveur = createServer((req, res) => { mw(req, res, () => { res.statusCode = 404; res.end('hors api'); }); });
  await new Promise<void>((ok) => { serveur.listen(0, '127.0.0.1', ok); });
  port = (serveur.address() as AddressInfo).port;
});
afterAll(async () => { await new Promise((ok) => { serveur.close(ok); }); });

interface Rep { statut: number; texte: string }
function envoyer(methode: string, chemin: string, entetes: Record<string, string>, corps?: string): Promise<Rep> {
  return new Promise((resoudre, rejeter) => {
    const req = request({ host: '127.0.0.1', port, method: methode, path: chemin, headers: entetes }, (res) => {
      let texte = '';
      res.on('data', (m: Buffer) => { texte += m.toString(); });
      res.on('end', () => { resoudre({ statut: res.statusCode ?? 0, texte }); });
    });
    req.on('error', rejeter);
    req.end(corps);
  });
}

const hote = (): string => `127.0.0.1:${String(port)}`;
const origine = (): string => `http://127.0.0.1:${String(port)}`;
const json = { 'Content-Type': 'application/json' };

describe('protections du serveur local', () => {
  it('répond à une requête locale normale', async () => {
    const r = await envoyer('GET', '/api/info', { Host: hote() });
    expect(r.statut).toBe(200);
    expect(JSON.parse(r.texte)).toMatchObject({ nom: 'Test' });
  });

  it('refuse un Host étranger (rebond DNS)', async () => {
    expect((await envoyer('GET', '/api/info', { Host: 'evil.example' })).statut).toBe(403);
  });

  it('refuse un Origin étranger, pour GET comme pour POST', async () => {
    expect((await envoyer('GET', '/api/info', { Host: hote(), Origin: 'http://evil.example' })).statut).toBe(403);
    expect((await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: 'http://evil.example', ...json }, '{}')).statut).toBe(403);
  });

  it('refuse un Origin null', async () => {
    expect((await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: 'null', ...json }, '{}')).statut).toBe(403);
  });

  it('refuse un POST local dont l\'Origin n\'est pas exactement celui du serveur (autre port, absent)', async () => {
    expect((await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: 'http://127.0.0.1:1', ...json }, '{}')).statut).toBe(403);
    expect((await envoyer('POST', '/api/sprites/apercu', { Host: hote(), ...json }, '{}')).statut).toBe(403);
  });

  it('refuse un POST qui n\'est pas du JSON (formulaire croisé)', async () => {
    expect((await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: origine(), 'Content-Type': 'text/plain' }, '{}')).statut).toBe(415);
  });

  it('refuse un corps trop gros avec un 413, annoncé ou non', async () => {
    const gros = JSON.stringify({ x: 'a'.repeat(2000) });
    expect((await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: origine(), ...json, 'Content-Length': String(gros.length) }, gros)).statut).toBe(413);
    const r = await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: origine(), ...json, 'Transfer-Encoding': 'chunked' }, gros);
    expect(r.statut).toBe(413);
  });

  it('accepte un POST JSON local ; la route absente est un 404 de l\'API, un JSON invalide un 400', async () => {
    const bon = await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: origine(), ...json }, JSON.stringify({ id: 'a', calques: {} }));
    expect(bon.statut).toBe(404);
    expect((await envoyer('POST', '/api/sprites/apercu', { Host: hote(), Origin: origine(), ...json }, '{pas du json')).statut).toBe(400);
    expect((await envoyer('PUT', '/api/info', { Host: hote() })).statut).toBe(405);
  });

  it('laisse passer ce qui n\'est pas l\'API', async () => {
    expect((await envoyer('GET', '/index.html', { Host: hote() })).texte).toBe('hors api');
  });
});
