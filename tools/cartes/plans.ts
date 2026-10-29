import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';
for (const [r, plans] of PLANS_REGIONS.entries()) console.log(r + 1, plans.map((p) => `${p.numero}:${p.carte}[${p.chemins.join('')}]${p.vagues.ennemis.length}e/${p.vagues.nombre}v`).join('  '));
