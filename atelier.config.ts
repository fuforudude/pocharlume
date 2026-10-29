// Configuration de l'atelier pour ce projet : `npm run editeur` la lit.
import { adaptateurPocharlume } from './tools/atelier-pocharlume/adaptateur.ts';
import { definirConfig } from './tools/atelier/types.ts';

export default definirConfig({
  adaptateur: () => adaptateurPocharlume(import.meta.dirname),
  port: 5199,
});
