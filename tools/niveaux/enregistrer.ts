// Préchargé par `node --import ./tools/niveaux/enregistrer.ts` : les sources de src/ s'importent sans extension
// (résolution « bundler » de Vite et de TypeScript), ce que Node ne sait pas faire seul. Ce crochet de
// résolution essaie `.ts` puis `/index.ts` quand un import relatif échoue. Pour les scripts de tools/ qui lisent
// src/data ou src/engine.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, suite) {
    try {
      return suite(specifier, context);
    } catch (erreur) {
      const relatif = specifier.startsWith('./') || specifier.startsWith('../');
      if (!relatif || (erreur as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND') throw erreur;
      try {
        return suite(`${specifier}.ts`, context);
      } catch {
        return suite(`${specifier}/index.ts`, context);
      }
    }
  },
});
