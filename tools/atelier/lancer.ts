// Point d'entrée : `node tools/atelier/lancer.ts [--config atelier.config.ts] [--port 5199]`.
// Lit la configuration du projet (adaptateur, port), puis sert l'interface avec le serveur de développement de Vite,
// sur 127.0.0.1 uniquement et sur le port demandé (ou le programme s'arrête : jamais un autre port en silence).
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { pluginAtelier } from './plugin.ts';
import type { ConfigAtelier } from './types.ts';

function option(nom: string, defaut: string): string {
  const i = process.argv.indexOf(nom);
  const valeur = i >= 0 ? process.argv[i + 1] : undefined;
  return valeur ?? defaut;
}

const fichierConfig = resolve(option('--config', 'atelier.config.ts'));
const module = await import(pathToFileURL(fichierConfig).href) as { default?: ConfigAtelier };
if (!module.default || typeof module.default.adaptateur !== 'function') {
  throw new Error(`${fichierConfig} doit exporter par défaut un definirConfig({ adaptateur })`);
}
const config = module.default;
const adaptateur = await config.adaptateur();
const port = Number(option('--port', String(config.port ?? 5199)));
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error(`Port invalide : ${String(port)}`);

const serveur = await createServer({
  configFile: false,
  root: join(import.meta.dirname, 'client'),
  // Le cache de Vite va dans le dossier du cœur, jamais dans les dossiers du projet.
  cacheDir: join(dirname(fichierConfig), 'node_modules', '.vite-atelier'),
  clearScreen: false,
  plugins: [pluginAtelier(adaptateur)],
  server: { host: '127.0.0.1', port, strictPort: true, open: false, fs: { allow: [join(import.meta.dirname, 'client')] } },
});
await serveur.listen();
console.log(`Atelier « ${adaptateur.nom} » : http://127.0.0.1:${String(port)}/ (Ctrl+C pour arrêter)`);
const arreter = (): void => { void serveur.close().then(() => process.exit(0)); };
process.on('SIGINT', arreter);
process.on('SIGTERM', arreter);
