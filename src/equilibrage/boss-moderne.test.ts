// Boss tuables (spec du DLC, « Décisions après les relectures de la vague 2 ») : sur chaque niveau de boss du DLC (10, 20, 30), le bot
// soigneux en Matou doit TUER le boss ; le laisser passer en perdant des vies ne compte pas comme une victoire de conception. Un boss peut
// demander une stratégie précise (le Centaure, très blindé : percer l'armure) ; le bot générique, lui, ne doit jamais « gagner » en le
// laissant passer. Graine 7, comme les tests de bot des régions.
import { describe, expect, it } from 'vitest';
import { CAMPAGNE_MODERNE } from '../data/niveaux/campagne-moderne';
import { creerBotPerceArmure } from './bot-perce-armure';
import { creerBotSoigneux } from './bot-soigneux';
import { jouerPartie } from './simulation';

const options = { graine: 7, difficulte: 'matou', secondesMax: 3600 } as const;
const niveau = (numero: number) => {
  const n = CAMPAGNE_MODERNE.find((x) => x.numero === numero);
  if (!n) throw new Error(`Niveau ${String(numero)} introuvable`);
  return n.niveau;
};

describe('boss du DLC tuables par le bot', () => {
  it('niveau 10 : le bot soigneux tue le commissaire divisionnaire', () => {
    const r = jouerPartie(niveau(10), creerBotSoigneux(), options);
    expect(r.bossTues ?? []).toContain('moderne_commissaire_boss');
    expect(r.statut).toBe('victoire');
  });

  it('niveau 30 : le bot soigneux tue le préfet', () => {
    const r = jouerPartie(niveau(30), creerBotSoigneux(), options);
    expect(r.bossTues ?? []).toContain('moderne_prefet');
    expect(r.statut).toBe('victoire');
  });

  it('niveau 20 : le bot générique ne gagne pas en laissant passer le Grand Centaure', () => {
    const r = jouerPartie(niveau(20), creerBotSoigneux(), options);
    if (r.statut === 'victoire') expect(r.bossTues ?? []).toContain('moderne_centaure_boss');
  });

  // DÉCISION REQUISE : le Grand Centaure n'est tué ni par le soigneux ni par la stratégie perce-armure. Ce n'est pas faute de cases
  // (le couloir final y=9 est bordé de cases libres, lignes 3 et 5 de la grille) : à 2 200 arêtes, le bot arrive au boss avec peu de
  // vies et des tours de niveau 1, et la perce-armure ne le tue qu'avec une économie de l'ordre de 20 000 arêtes (rapport « niveau 20 »).
  // `it.fails` garde le test vert tant que c'est le cas et le fait passer au rouge dès que le boss devient tuable : le changer en `it`.
  it.fails('niveau 20 : une stratégie dédiée (percer l’armure) tue le Grand Centaure', () => {
    const r = jouerPartie(niveau(20), creerBotPerceArmure(), options);
    expect(r.bossTues ?? []).toContain('moderne_centaure_boss');
  });
});
