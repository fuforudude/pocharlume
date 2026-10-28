// Ce que la v4 ajoute à la progression : la région s'ouvre avec le boss, et la fusion garde les défis réussis.
import { describe, expect, it } from 'vitest';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire, fusionnerProgressions } from './progression';
import { validerSauvegarde } from './validation';

/** Une sauvegarde qui a gagné tous les niveaux de 1 à `jusqua` en 3 étoiles (Matou). */
function victoiresJusqua(jusqua: number): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= jusqua; n++) s = enregistrerVictoire(s, n, 'matou', 3);
  return s;
}

describe('région ouverte', () => {
  it('une sauvegarde neuve est en région 1', () => {
    expect(sauvegardeVide().meta.regionMax).toBe(1);
  });

  it('la région suivante s’ouvre à la victoire sur le boss (niveau 10, 20, …), pas avant', () => {
    expect(victoiresJusqua(9).meta.regionMax).toBe(1);
    const apresBoss = victoiresJusqua(10);
    expect(apresBoss.progression.niveauMax).toBe(11);
    expect(apresBoss.meta.regionMax).toBe(2);
    expect(victoiresJusqua(19).meta.regionMax).toBe(2);
    expect(victoiresJusqua(20).meta.regionMax).toBe(3);
    expect(victoiresJusqua(40).meta.regionMax).toBe(5);
  });

  it('rejouer un niveau déjà gagné ne change pas la région', () => {
    const s = victoiresJusqua(10);
    expect(enregistrerVictoire(s, 3, 'vieux_sage', 2).meta.regionMax).toBe(2);
  });

  it('la région 10 est la dernière : gagner le niveau 100 ne l’avance pas', () => {
    const s = victoiresJusqua(100);
    expect(s.progression.niveauMax).toBe(100);
    expect(s.meta.regionMax).toBe(10);
  });

  it('une victoire refusée (niveau verrouillé) ne change rien', () => {
    const s = victoiresJusqua(10);
    expect(enregistrerVictoire(s, 40, 'matou', 3)).toBe(s);
  });

  it('chaque état de la campagne entière reste une sauvegarde valide', () => {
    let s = sauvegardeVide();
    for (let n = 1; n <= 100; n++) {
      s = enregistrerVictoire(s, n, 'matou', 3);
      const r = validerSauvegarde(JSON.parse(JSON.stringify(s)));
      expect(r.ok, `niveau ${String(n)}`).toBe(true);
    }
  });
});

describe('fusion de deux progressions', () => {
  it('garde la région la plus haute avec le niveau le plus haut', () => {
    const fusion = fusionnerProgressions(victoiresJusqua(3), victoiresJusqua(10));
    expect(fusion.progression.niveauMax).toBe(11);
    expect(fusion.meta.regionMax).toBe(2);
  });

  it('réunit les défis réussis des deux côtés sans en perdre', () => {
    const a = victoiresJusqua(5);
    const b = victoiresJusqua(5);
    const avecA: Sauvegarde = { ...a, meta: { ...a.meta, defis: { '2': { heroique: true } } } };
    const avecB: Sauvegarde = { ...b, meta: { ...b.meta, defis: { '2': { fer: true }, '4': { fer: true } } } };
    const fusion = fusionnerProgressions(avecA, avecB);
    expect(fusion.meta.defis).toEqual({ '2': { heroique: true, fer: true }, '4': { fer: true } });
    expect(validerSauvegarde(JSON.parse(JSON.stringify(fusion))).ok).toBe(true);
  });

  it('rend le même objet quand l’autre n’apporte rien', () => {
    const a = victoiresJusqua(5);
    const defis: Sauvegarde = { ...a, meta: { ...a.meta, defis: { '2': { heroique: true } } } };
    expect(fusionnerProgressions(defis, defis)).toBe(defis);
    expect(fusionnerProgressions(defis, a)).toBe(defis);
  });
});
