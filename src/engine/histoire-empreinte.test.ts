// L'histoire se joue comme avant le DLC « Temps modernes » : l'état d'une partie complète, hors les champs que le DLC a ajoutés, a une
// empreinte figée. Les tests de rejeu du projet comparent deux exécutions du même code ; celui-ci compare au code d'avant le DLC (les
// empreintes ont été relevées sur lui, puis vérifiées identiques sur le code courant). Si une règle de l'histoire change exprès, relever
// les nouvelles empreintes (le message d'échec les donne) et le dire dans le commit.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { avancerSecondes, CONFIG, construireTour, niveauEssai } from './aides.test-utils';
import { creerPartie, serialiser, step } from './partie';

/** Les champs de l'état que le DLC a ajoutés (leur valeur ne dit rien de l'histoire) ; `version` suit le format de l'état. */
const CHAMPS_DU_DLC = new Set(['tirsEnnemis', 'renvois', 'binome', 'binomeSeul', 'version']);

function empreinte(etat: Parameters<typeof serialiser>[0]): string {
  const texte = JSON.stringify(JSON.parse(serialiser(etat)), (cle, valeur: unknown) => (CHAMPS_DU_DLC.has(cle) ? undefined : valeur));
  return createHash('sha256').update(texte).digest('hex').slice(0, 16);
}

describe('empreinte de l’histoire', () => {
  it('un niveau d’essai chargé (tous les ennemis de l’histoire, les quatre familles de tours, 150 s)', () => {
    const ids = Object.keys(ENNEMIS).filter((id) => !id.startsWith('moderne_') && !(ENNEMIS as Record<string, { boss: boolean }>)[id]?.boss);
    const paquets = ids.map((ennemi, i) => ({ ennemi, nombre: 2, intervalle: 1.3, chemin: i % 2, delai: (i * 1.7) % 20 }));
    const etat = creerPartie(niveauEssai([{ paquets }]), CONFIG);
    construireTour(etat, 0, 'caserne');
    construireTour(etat, 1, 'tir');
    construireTour(etat, 2, 'magie');
    construireTour(etat, 3, 'artillerie', 'B');
    construireTour(etat, 4, 'artillerie');
    avancerSecondes(etat, 150);
    expect(ids.length).toBeGreaterThan(40);
    expect(etat.statut).toBe('defaite');
    expect(empreinte(etat)).toBe('64a28650f0b710e2');
  });

  const NIVEAUX: readonly (readonly [number, string])[] = [
    [1, 'a5fc730e25def175'],
    [20, '5663748715c4ec58'],
    [100, '30536d5c8579227d'],
  ];

  it.each(NIVEAUX)('le niveau %i de la campagne, joué sans tour jusqu’à la fin', (numero, attendue) => {
    const niveau = CAMPAGNE[numero - 1];
    if (!niveau) throw new Error(`niveau ${String(numero)} absent`);
    const etat = creerPartie(niveau.niveau, CONFIG);
    for (let p = 0; p < 30 * 400 && etat.statut === 'en_cours'; p++) step(etat);
    expect(etat.statut).toBe('defaite');
    expect(empreinte(etat)).toBe(attendue);
  });
});
