// Préchargé par `node --import ./tools/niveaux/enregistrer.ts` : les sources de src/ s'importent sans extension
// (résolution « bundler » de Vite et de TypeScript), ce que Node ne sait pas faire seul. Ce crochet de
// résolution essaie `.ts` puis `/index.ts` quand un import relatif échoue (fichier introuvable ou dossier). Pour les scripts de tools/ qui lisent
// src/data ou src/engine.
import { readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';

/** Syntaxe TypeScript que Node ne sait pas seulement effacer : propriétés de paramètre (`constructor(readonly x)`) et enum. */
const SYNTAXE_A_TRANSFORMER = /constructor\s*\([^)]*(?:readonly|private|public|protected)\s|enum\s+\w+\s*\{/;

registerHooks({
  // Les fichiers de src/ qui emploient une syntaxe non effaçable (la caméra, que `src/render/sol.ts` importe) sont transformés.
  load(url, context, suite) {
    if (url.startsWith('file:') && url.endsWith('.ts') && url.includes('/src/')) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      if (SYNTAXE_A_TRANSFORMER.test(source)) return { format: 'module', source: stripTypeScriptTypes(source, { mode: 'transform' }), shortCircuit: true };
    }
    return suite(url, context);
  },
  resolve(specifier, context, suite) {
    try {
      return suite(specifier, context);
    } catch (erreur) {
      const relatif = specifier.startsWith('./') || specifier.startsWith('../');
      const code = (erreur as { code?: string }).code;
      if (!relatif || (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'ERR_UNSUPPORTED_DIR_IMPORT')) throw erreur;
      try {
        return suite(`${specifier}.ts`, context);
      } catch {
        return suite(`${specifier}/index.ts`, context);
      }
    }
  },
});
