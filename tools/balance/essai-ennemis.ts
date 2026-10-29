import { ENNEMIS } from '../../src/data/ennemis.ts';
import { menaceEnnemi } from '../../src/data/equilibrage.ts';
for (const [id, d] of Object.entries(ENNEMIS)) console.log(id.padEnd(20), 'pv', String(d.pv).padStart(6), 'arm', d.armure, 'res', d.resistance, 'vit', d.vitesse, 'vies', d.coutVies, 'prime', (d as {prime?:number}).prime, 'menace', Math.round(menaceEnnemi(d)), d.volant ? 'V' : '', d.furtif ? 'F' : '', d.boss ? 'B' : '');
