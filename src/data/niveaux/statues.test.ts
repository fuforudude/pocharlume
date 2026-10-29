// Les 31 statues cachées : chaque carte a la sienne, sur une case de décor valide (dans la carte, interdite à la construction par le
// décor, hors chemin), sans rien recouvrir, et son inscription existe.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { caseExiste, estCaseDeChemin, estCaseInterdite } from '../../engine/grille';
import { fr } from '../../i18n/fr';
import { REGLES } from '../regles';
import { CARTES } from './cartes-toutes';
import { CAMPAGNE } from './campagne';
import { rectsSeChevauchent } from './geometrie';
import { tuilesDeChemin } from './grille-niveau';
import { empriseDecor, GRANDS_DECORS } from './habillage';
import { PLANS_REGIONS } from './plans';
import { cleInscription, estIdInscription, IDS_INSCRIPTIONS, SPRITE_STATUE, SPRITES_STATUES, STATUES, type OrigineStatue } from './statues';

const ATLAS = (JSON.parse(readFileSync(new URL('../../../public/sprites/atlas.json', import.meta.url), 'utf8')) as { sprites: Record<string, { categorie: string; largeur: number; hauteur: number }> }).sprites;
const PLANS = PLANS_REGIONS.flat();
const TAILLE = REGLES.tailleCase;

describe('statues : une par carte', () => {
  it('il y a exactement 31 statues, une pour chaque carte, dans l’ordre de la campagne', () => {
    expect(IDS_INSCRIPTIONS).toHaveLength(31);
    expect(Object.keys(STATUES)).toEqual(Object.keys(CARTES));
    expect([...IDS_INSCRIPTIONS]).toEqual(Object.keys(CARTES));
  });

  it('chaque carte a son inscription, non vide, dans la table des textes', () => {
    for (const id of IDS_INSCRIPTIONS) {
      const texte = (fr as Record<string, string>)[cleInscription(id)];
      expect(texte, id).toBeTypeOf('string');
      expect((texte ?? '').length, id).toBeGreaterThan(10);
    }
  });

  it('les sprites des statues existent dans l’atlas : des décors de 16×16, trop petits pour bloquer la pose d’une tour', () => {
    for (const nom of SPRITES_STATUES) {
      expect(ATLAS[nom]?.categorie, nom).toBe('decor');
      expect(GRANDS_DECORS.has(nom), nom).toBe(false);
    }
  });

  it('les origines se répartissent comme docs/lore.md : 8 pour chaque entité, 7 pour l’Église', () => {
    const parOrigine: Record<OrigineStatue, number> = { colosse: 0, ombre: 0, trois_pattes: 0, eglise: 0 };
    for (const id of IDS_INSCRIPTIONS) parOrigine[STATUES[id].origine]++;
    expect(parOrigine).toEqual({ colosse: 8, ombre: 8, trois_pattes: 8, eglise: 7 });
    expect(Object.keys(SPRITE_STATUE).sort()).toEqual(Object.keys(parOrigine).sort());
  });

  it('reconnaît les identifiants d’inscription et rien d’autre', () => {
    expect(estIdInscription('chaumes')).toBe(true);
    for (const x of ['', 'inconnue', 'toString', '__proto__', 3, null, undefined]) expect(estIdInscription(x)).toBe(false);
  });
});

describe('statues : une case de décor valide dans chaque niveau', () => {
  it('chaque niveau de campagne porte la statue de sa carte, dessinée comme un décor', () => {
    expect(CAMPAGNE).toHaveLength(100);
    for (const n of CAMPAGNE) {
      const carte = PLANS[n.numero - 1]?.carte;
      expect(carte, `niveau ${String(n.numero)}`).toBeDefined();
      if (carte === undefined) continue;
      const statue = STATUES[carte];
      expect(n.visuel.statue, `niveau ${String(n.numero)}`).toBe(statue);
      expect(n.visuel.decor.filter((d) => d.sprite === SPRITE_STATUE[statue.origine] && d.x === statue.x && d.y === statue.y), `niveau ${String(n.numero)}`).toHaveLength(1);
    }
  });

  it('la statue est sur une case de la carte, interdite à la construction (décor), hors chemin, dans tous les niveaux de la carte', () => {
    for (const n of CAMPAGNE) {
      const carte = PLANS[n.numero - 1]?.carte;
      if (carte === undefined || n.visuel.statue === undefined) throw new Error(`niveau ${String(n.numero)} sans statue`);
      const { x, y } = n.visuel.statue;
      const emprise = empriseDecor({ sprite: 'statue', x, y });
      // Le sprite tient dans la carte, et dans une seule case de la grille (la zone de toucher).
      expect(emprise.x0 >= 0 && emprise.y0 >= 0 && emprise.x1 <= n.niveau.carte.largeur && emprise.y1 <= n.niveau.carte.hauteur, `niveau ${String(n.numero)} : dans la carte`).toBe(true);
      const cx = Math.floor(x / TAILLE);
      const cy = Math.floor((y - 0.5) / TAILLE);
      expect(Math.floor(emprise.x0 / TAILLE) === cx && Math.floor((emprise.x1 - 1e-9) / TAILLE) === cx, `niveau ${String(n.numero)} : une seule colonne`).toBe(true);
      expect(Math.floor(emprise.y0 / TAILLE) === cy && Math.floor((emprise.y1 - 1e-9) / TAILLE) === cy, `niveau ${String(n.numero)} : une seule ligne`).toBe(true);
      expect(caseExiste(n.niveau.carte, cx, cy), `niveau ${String(n.numero)} : case de la carte`).toBe(true);
      // Hors chemin : ni case de chemin pour le moteur, ni tuile de chemin dessinée dans la case.
      expect(estCaseDeChemin(n.niveau.carte, cx, cy), `niveau ${String(n.numero)} : hors chemin`).toBe(false);
      const masque = tuilesDeChemin(n.niveau.carte);
      for (let dy = 0; dy < TAILLE; dy++) {
        for (let dx = 0; dx < TAILLE; dx++) expect(masque[(cy * TAILLE + dy) * n.niveau.carte.largeur + cx * TAILLE + dx], `niveau ${String(n.numero)} : tuile de chemin`).toBe(0);
      }
      // Hors case constructible : le décor interdit déjà la case, la statue n'en retire aucune.
      expect(estCaseInterdite(n.niveau, cx, cy), `niveau ${String(n.numero)} : case interdite par le décor`).toBe(true);
      expect(carte in CARTES).toBe(true);
    }
  });

  it('la statue ne recouvre aucun autre décor (ni sprite, ni emprise)', () => {
    for (const n of CAMPAGNE) {
      const statue = n.visuel.statue;
      if (!statue) throw new Error(`niveau ${String(n.numero)} sans statue`);
      const emprise = empriseDecor({ sprite: 'statue', x: statue.x, y: statue.y });
      for (const d of n.visuel.decor) {
        if (d.x === statue.x && d.y === statue.y) continue;
        expect(rectsSeChevauchent(emprise, empriseDecor(d)), `niveau ${String(n.numero)} : ${d.sprite} en (${String(d.x)}, ${String(d.y)})`).toBe(false);
      }
    }
  });
});
