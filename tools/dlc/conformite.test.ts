// Conformité des skins du DLC « Temps modernes » à leurs originaux : chaque skin (et chacun de ses tireurs) doit avoir
// exactement les mêmes noms d'animations et le même nombre d'images que le sprite du jeu dont il reprend la place
// (art/sprites/), pour pouvoir être branché plus tard sans toucher au moteur.
// Un tireur que l'original n'a pas est un écart bloquant, sauf exception documentée dans TIREURS_SANS_ORIGINAL
// (skins.ts) : l'étudiant au mégaphone de `moderne-magie-megaphone` (décision de l'auteur du 2026-11-11, pour qu'il se
// tourne vers sa cible) ; il est alors comparé à la tour de l'original, `tour-magie-oracle`.
//
// Les catégories de CATEGORIES_BLOQUANTES échouent au moindre écart ; les autres apparaissent en « à faire » (todo) dans le
// résumé de vitest tant qu'un skin n'est pas complet. Une catégorie entre dans la liste une fois tous ses skins animés.
// Les écarts de cadence sont seulement affichés par `npm run dlc:apercu`.
//
// Héros (catégorie `heros`, art/dlc-moderne/heros/) : ils sont animés un par un, une fois leur pose validée en revue.
// Ceux de HEROS_ANIMES sont bloquants comme les tours et les ennemis ; les autres (pose seule) restent informatifs (todo).
// La catégorie entrera dans CATEGORIES_BLOQUANTES une fois les neuf héros animés. Dès maintenant, est bloquant : chaque skin de héros a une pose de repos, la même taille de cadre et la
// même ancre que son original, pour pouvoir prendre sa place sans toucher au rendu.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RACINE, lireSources } from '../art/construire.ts';
import { decoderPng } from '../art/png.ts';
import { CATEGORIE_HEROS, decrireEcart, estBloquant, rendreApercus } from './skins.ts';

const CATEGORIES_BLOQUANTES = new Set<string>(['tour', 'ennemi']);
/** Héros validés en revue et animés (2026-11-12) : Brise-Os et Corbeau attendent la revue de leur pose retouchée. */
const HEROS_ANIMES = new Set<string>([
  'moderne-heros-plume', 'moderne-heros-suie', 'moderne-heros-charlie', 'moderne-heros-mastoc', 'moderne-heros-pollen',
  'moderne-heros-rouage', 'moderne-heros-lanterne',
]);

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
    if (CATEGORIES_BLOQUANTES.has(a.categorie) || HEROS_ANIMES.has(a.entete.id) || ecarts.length === 0) {
      it(nom, () => {
        expect(ecarts).toEqual([]);
      });
    } else {
      it.todo(`${nom} : ${ecarts.join(' | ')}`);
    }
  }
});

describe('les skins de héros prennent la place de leur original', () => {
  const heros = apercus.filter((a) => a.categorie === CATEGORIE_HEROS);
  it('trouve les neuf héros', () => {
    expect(heros.map((a) => a.entete.original?.base).sort()).toEqual([
      'charlie', 'heros-brise-os', 'heros-corbeau', 'heros-lanterne', 'heros-mastoc', 'heros-plume', 'heros-pollen', 'heros-rouage',
      'heros-suie',
    ]);
  });
  for (const a of heros) {
    it(`${a.entete.id} : même cadre et même ancre que ${a.entete.original?.base ?? '-'}, pose de repos`, () => {
      expect(a.gabarit).toEqual(a.gabaritOriginal);
      expect(a.ecarts[0]?.manquantes ?? []).not.toContain('repos');
    });
  }
});
