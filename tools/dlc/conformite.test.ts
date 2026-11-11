// Conformité des skins du DLC « Temps modernes » à leurs originaux : chaque skin (et chacun de ses tireurs) doit avoir
// exactement les mêmes noms d'animations et le même nombre d'images que le sprite du jeu dont il reprend la place
// (art/sprites/), pour pouvoir être branché plus tard sans toucher au moteur.
//
// Les catégories de CATEGORIES_BLOQUANTES échouent au moindre écart ; les autres apparaissent en « à faire » (todo) dans le
// résumé de vitest tant qu'un skin n'est pas complet. Une catégorie entre dans la liste une fois tous ses skins animés.
// Les écarts de cadence sont seulement affichés par `npm run dlc:apercu`.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RACINE, lireSources } from '../art/construire.ts';
import { decoderPng } from '../art/png.ts';
import { decrireEcart, estBloquant, rendreApercus } from './skins.ts';

const CATEGORIES_BLOQUANTES = new Set<string>([]);

const dossier = join(RACINE, 'art', 'dlc-moderne');
const dlc = readdirSync(dossier, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.txt'))
  .sort()
  .map((f) => ({ texte: readFileSync(join(dossier, f), 'utf8'), fichier: relative(RACINE, join(dossier, f)).replaceAll('\\', '/') }));
const { sprites: jeu, palettes } = lireSources();
const apercus = rendreApercus({
  jeu,
  dlc,
  palettes,
  planche: (chemin) => decoderPng(readFileSync(join(RACINE, 'art', 'minifolks', chemin))),
  facteur: 1,
  animations: false,
});

describe('les skins du DLC ont les animations de leur original', () => {
  it('trouve des skins', () => {
    expect(apercus.length).toBeGreaterThan(0);
  });
  for (const a of apercus) {
    if (!a.entete.original) continue;
    const ecarts = a.ecarts.filter(estBloquant).map(decrireEcart);
    const nom = `${a.entete.id} (${a.categorie})`;
    if (CATEGORIES_BLOQUANTES.has(a.categorie) || ecarts.length === 0) {
      it(nom, () => {
        expect(ecarts).toEqual([]);
      });
    } else {
      it.todo(`${nom} : ${ecarts.join(' | ')}`);
    }
  }
});
