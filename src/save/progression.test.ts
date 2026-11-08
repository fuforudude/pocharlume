import { describe, expect, it } from 'vitest';
import { sauvegardeRemplie } from './aides.test-utils';
import { NOMBRE_NIVEAUX, sauvegardeVide, type Sauvegarde } from './format';
import { changerReglages, enregistrerVictoire, etoilesDe, fusionnerProgressions, meilleuresEtoiles, niveauDebloque, niveauReussi, totalEtoiles } from './progression';
import { validerSauvegarde } from './validation';

describe('progression de la campagne', () => {
  it('un nouveau joueur n’a que le niveau 1 d’ouvert, sans étoile', () => {
    const s = sauvegardeVide();
    expect(niveauDebloque(s, 1)).toBe(true);
    expect(niveauDebloque(s, 2)).toBe(false);
    expect(niveauReussi(s, 1)).toBe(false);
    expect(totalEtoiles(s)).toBe(0);
    expect(meilleuresEtoiles(s, 1)).toBe(0);
  });

  it('réussir le niveau N débloque N + 1', () => {
    let s = sauvegardeVide();
    s = enregistrerVictoire(s, 1, 'matou', 2);
    expect(s.progression.niveauMax).toBe(2);
    expect(niveauDebloque(s, 2)).toBe(true);
    expect(niveauDebloque(s, 3)).toBe(false);
    s = enregistrerVictoire(s, 2, 'chaton', 1);
    expect(s.progression.niveauMax).toBe(3);
  });

  it('rejouer un ancien niveau ne fait pas reculer le niveau débloqué', () => {
    let s = sauvegardeRemplie();
    const avant = s.progression.niveauMax;
    s = enregistrerVictoire(s, 3, 'matou', 3);
    expect(s.progression.niveauMax).toBe(avant);
  });

  it('garde le meilleur résultat par niveau et par difficulté, jamais un moins bon', () => {
    let s = sauvegardeVide();
    s = enregistrerVictoire(s, 1, 'matou', 2);
    s = enregistrerVictoire(s, 1, 'matou', 1);
    expect(etoilesDe(s, 1, 'matou')).toBe(2);
    s = enregistrerVictoire(s, 1, 'matou', 3);
    expect(etoilesDe(s, 1, 'matou')).toBe(3);
    s = enregistrerVictoire(s, 1, 'chaton', 1);
    expect(etoilesDe(s, 1, 'chaton')).toBe(1);
    expect(etoilesDe(s, 1, 'matou')).toBe(3);
    expect(etoilesDe(s, 1, 'vieux_sage')).toBe(0);
    expect(meilleuresEtoiles(s, 1)).toBe(3);
  });

  it('compte une fois par niveau le meilleur résultat, toutes difficultés confondues', () => {
    let s = sauvegardeVide();
    s = enregistrerVictoire(s, 1, 'chaton', 3);
    s = enregistrerVictoire(s, 1, 'matou', 2);
    s = enregistrerVictoire(s, 2, 'matou', 1);
    expect(totalEtoiles(s)).toBe(4);
  });

  it('ne modifie jamais la sauvegarde reçue', () => {
    const s = sauvegardeRemplie();
    const avant = JSON.stringify(s);
    enregistrerVictoire(s, 5, 'vieux_sage', 3);
    changerReglages(s, { son: 1 });
    expect(JSON.stringify(s)).toBe(avant);
  });

  it('le résultat reste une sauvegarde valide après chaque victoire de la campagne entière', () => {
    let s: Sauvegarde = sauvegardeVide();
    for (let n = 1; n <= NOMBRE_NIVEAUX; n++) {
      s = enregistrerVictoire(s, n, 'matou', 3);
      expect(validerSauvegarde(JSON.parse(JSON.stringify(s))).ok, `niveau ${String(n)}`).toBe(true);
    }
    expect(s.progression.niveauMax).toBe(NOMBRE_NIVEAUX);
    expect(totalEtoiles(s)).toBe(NOMBRE_NIVEAUX * 3);
  });

  it('ignore les victoires impossibles : niveau verrouillé ou inconnu, étoiles invalides', () => {
    const s = sauvegardeVide();
    expect(enregistrerVictoire(s, 2, 'matou', 3)).toBe(s);
    expect(enregistrerVictoire(s, 0, 'matou', 3)).toBe(s);
    expect(enregistrerVictoire(s, 151, 'matou', 3)).toBe(s);
    expect(enregistrerVictoire(s, 1.5, 'matou', 3)).toBe(s);
    expect(enregistrerVictoire(s, 1, 'matou', 0)).toBe(s);
    expect(enregistrerVictoire(s, 1, 'matou', 4)).toBe(s);
    expect(enregistrerVictoire(s, 1, 'matou', 2.5)).toBe(s);
    expect(enregistrerVictoire(s, 1, 'facile' as 'matou', 3)).toBe(s);
    expect(enregistrerVictoire(s, Number.NaN, 'matou', 3)).toBe(s);
  });

  it('étoiles d’un niveau inconnu : 0, sans lire de propriété héritée', () => {
    const s = sauvegardeVide();
    expect(etoilesDe(s, 0, 'matou')).toBe(0);
    expect(etoilesDe(s, 999, 'matou')).toBe(0);
    expect(niveauDebloque(s, Number.NaN)).toBe(false);
  });
});

describe('réglages', () => {
  it('change seulement les champs donnés', () => {
    const s = changerReglages(sauvegardeVide(), { musique: 10 });
    expect(s.reglages).toEqual({ son: 80, musique: 10, vitesse: 1 });
    expect(changerReglages(s, { vitesse: 2, son: 0 }).reglages).toEqual({ son: 0, musique: 10, vitesse: 2 });
  });

  it('ignore les valeurs hors bornes', () => {
    const s = sauvegardeVide();
    const r = changerReglages(s, { son: 101, musique: -1, vitesse: 3 as 1 });
    expect(r.reglages).toEqual(s.reglages);
    expect(changerReglages(s, { son: 50.5 }).reglages.son).toBe(80);
  });
});

describe('fusion de deux progressions', () => {
  it('garde le niveau débloqué le plus haut et les meilleures étoiles par niveau et par difficulté', () => {
    let a = sauvegardeVide();
    a = enregistrerVictoire(a, 1, 'matou', 1);
    a = enregistrerVictoire(a, 2, 'chaton', 3);
    let b = sauvegardeVide();
    b = enregistrerVictoire(b, 1, 'matou', 3);
    b = enregistrerVictoire(b, 2, 'chaton', 1);
    b = enregistrerVictoire(b, 2, 'matou', 2);
    b = enregistrerVictoire(b, 3, 'matou', 1);

    const m = fusionnerProgressions(a, b);
    expect(m.progression.niveauMax).toBe(4);
    expect(etoilesDe(m, 1, 'matou')).toBe(3);
    expect(etoilesDe(m, 2, 'chaton')).toBe(3);
    expect(etoilesDe(m, 2, 'matou')).toBe(2);
    expect(etoilesDe(m, 3, 'matou')).toBe(1);
    expect(validerSauvegarde(m).ok).toBe(true);
  });

  it('est symétrique pour la progression', () => {
    const a = enregistrerVictoire(sauvegardeVide(), 1, 'chaton', 2);
    const b = enregistrerVictoire(enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3), 2, 'matou', 1);
    expect(fusionnerProgressions(a, b).progression).toEqual(fusionnerProgressions(b, a).progression);
  });

  it('garde les réglages et la partie de la première sauvegarde', () => {
    const a = { ...sauvegardeRemplie(), reglages: { son: 1, musique: 2, vitesse: 2 as const } };
    const b = sauvegardeVide();
    const m = fusionnerProgressions(a, b);
    expect(m.reglages).toEqual(a.reglages);
    expect(m.partie).toBe(a.partie);
  });

  it('ne change rien (même objet) quand la seconde n’apporte rien', () => {
    const a = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3);
    expect(fusionnerProgressions(a, sauvegardeVide())).toBe(a);
    expect(fusionnerProgressions(a, a)).toBe(a);
  });

  it('ne modifie aucune des deux sauvegardes', () => {
    const a = enregistrerVictoire(sauvegardeVide(), 1, 'chaton', 1);
    const b = enregistrerVictoire(sauvegardeVide(), 1, 'matou', 2);
    const copieA = structuredClone(a);
    const copieB = structuredClone(b);
    fusionnerProgressions(a, b);
    expect(a).toEqual(copieA);
    expect(b).toEqual(copieB);
  });
});
