import { describe, expect, it } from 'vitest';
import { Gestes, SEUIL_GLISSEMENT, type RappelsGestes } from './gestes';

function enregistreur(): { rappels: RappelsGestes; journal: string[] } {
  const journal: string[] = [];
  const f = (n: number): string => String(Math.round(n * 100) / 100);
  return {
    journal,
    rappels: {
      toucher: (x, y) => journal.push(`toucher ${f(x)},${f(y)}`),
      glisser: (dx, dy) => journal.push(`glisser ${f(dx)},${f(dy)}`),
      debutPincement: () => journal.push('debut'),
      pincer: (k, x, y) => journal.push(`pincer ${f(k)} ${f(x)},${f(y)}`),
      survol: (x, y) => journal.push(`survol ${f(x)},${f(y)}`),
    },
  };
}

describe('Gestes : un doigt', () => {
  it('un appui relâché sur place est un toucher', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 50);
    g.relacher(1, 100, 50);
    expect(journal).toEqual(['toucher 100,50']);
  });

  it('un doigt qui tremble un peu fait encore un toucher', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 50);
    g.bouger(1, 100 + SEUIL_GLISSEMENT - 2, 50);
    g.relacher(1, 103, 51);
    expect(journal).toEqual(['toucher 103,51']);
  });

  it('au-delà du seuil c’est un glissement : plus de toucher au relâchement', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.bouger(1, 130, 100);
    g.bouger(1, 140, 110);
    g.relacher(1, 140, 110);
    // Le premier glissement rattrape les 30 px déjà parcourus, les suivants sont des deltas.
    expect(journal).toEqual(['glisser 30,0', 'glisser 10,10']);
  });

  it('un glissement qui revient au point de départ ne devient pas un toucher', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.bouger(1, 150, 100);
    g.bouger(1, 100, 100);
    g.relacher(1, 100, 100);
    expect(journal.filter((l) => l.startsWith('toucher'))).toEqual([]);
  });

  it('un geste annulé par le système ne touche rien', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.annuler(1);
    g.relacher(1, 100, 100);
    expect(journal).toEqual([]);
  });

  it('après un glissement, l’appui suivant redevient un toucher possible', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 0, 0);
    g.bouger(1, 50, 0);
    g.relacher(1, 50, 0);
    g.appuyer(2, 10, 10);
    g.relacher(2, 10, 10);
    expect(journal[journal.length - 1]).toBe('toucher 10,10');
  });
});

describe('Gestes : souris sans appui', () => {
  it('signale le survol', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.bouger(1, 12, 34);
    expect(journal).toEqual(['survol 12,34']);
  });

  it('ne signale pas de survol pendant un appui', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 0, 0);
    g.bouger(2, 12, 34);
    expect(journal).toEqual([]);
  });
});

describe('Gestes : deux doigts', () => {
  it('écarter les doigts donne un facteur supérieur à 1, autour de leur milieu', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.appuyer(2, 200, 100);
    g.bouger(2, 300, 100);
    expect(journal).toEqual(['debut', 'glisser 50,0', 'pincer 2 200,100']);
  });

  it('rapprocher les doigts donne un facteur inférieur à 1', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.appuyer(2, 300, 100);
    g.bouger(2, 200, 100);
    expect(journal.at(-1)).toBe('pincer 0.5 150,100');
  });

  it('déplacer les deux doigts ensemble déplace la caméra sans changer le zoom', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.appuyer(2, 200, 100);
    g.bouger(1, 100, 140);
    g.bouger(2, 200, 140);
    expect(journal).toContain('glisser 0,20');
    const facteurs = journal.filter((l) => l.startsWith('pincer')).map((l) => Number(l.split(' ')[1]));
    expect(Math.min(...facteurs)).toBeCloseTo(1, 1);
  });

  it('lever les doigts d’un pincement ne déclenche aucun toucher, même le dernier doigt', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.appuyer(2, 200, 100);
    g.bouger(2, 260, 100);
    g.relacher(2, 260, 100);
    g.relacher(1, 100, 100);
    expect(journal.filter((l) => l.startsWith('toucher'))).toEqual([]);
  });

  it('le doigt qui reste après un pincement ne fait pas défiler la carte', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 100, 100);
    g.appuyer(2, 200, 100);
    g.relacher(2, 200, 100);
    const avant = journal.length;
    g.bouger(1, 300, 300);
    expect(journal).toHaveLength(avant);
  });

  it('un nouveau pincement repart de l’écartement du moment', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 0, 0);
    g.appuyer(2, 100, 0);
    g.bouger(2, 200, 0);
    g.relacher(1, 0, 0);
    g.relacher(2, 200, 0);
    journal.length = 0;
    g.appuyer(3, 0, 0);
    g.appuyer(4, 50, 0);
    g.bouger(4, 100, 0);
    expect(journal.filter((l) => l.startsWith('pincer')).at(-1)).toBe('pincer 2 50,0');
  });

  it('réinitialiser oublie les appuis en cours', () => {
    const { rappels, journal } = enregistreur();
    const g = new Gestes(rappels);
    g.appuyer(1, 0, 0);
    g.reinitialiser();
    g.relacher(1, 0, 0);
    expect(journal).toEqual([]);
  });
});
