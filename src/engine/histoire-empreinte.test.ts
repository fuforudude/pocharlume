// L'histoire se joue comme avant le DLC « Temps modernes » : l'état d'une partie complète, hors les champs que le DLC a ajoutés, a une
// empreinte figée. Les tests de rejeu du projet comparent deux exécutions du même code ; celui-ci compare au code d'avant le DLC. Les
// empreintes ont été relevées sur le commit 7813d0e (avant tout code du DLC dans le moteur), avec ce même scénario, puis vérifiées
// identiques sur le code courant. Si une règle de l'histoire change exprès, relever les nouvelles empreintes (le message d'échec les
// donne) et le dire dans le commit.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { CAMPAGNE } from '../data/niveaux/campagne';
import { avancerSecondes, CONFIG, construireTour, niveauEssai } from './aides.test-utils';
import { creerPartie, serialiser, step } from './partie';

/**
 * Les champs de l'état que le DLC a ajoutés (leur valeur ne dit rien de l'histoire) ; `version` et `versionDonnees` suivent le format de
 * l'état et des données. `dynamique` (événements, chemins, foules) doit rester neutre dans l'histoire : `neutre` le vérifie.
 */
const CHAMPS_DU_DLC = new Set(['tirsEnnemis', 'renvois', 'binome', 'binomeSeul', 'version', 'versionDonnees', 'dynamique']);

/** Rien de dynamique dans l'histoire : ni événement, ni chemin fermé, ni barrage, ni foule. */
function neutre(etat: Parameters<typeof serialiser>[0]): boolean {
  const d = etat.dynamique;
  return d.evenements.length === 0 && d.cheminsActifs.every((a) => a) && d.barrages.length === 0 && d.foules.length === 0;
}

function empreinte(etat: Parameters<typeof serialiser>[0]): string {
  const texte = JSON.stringify(JSON.parse(serialiser(etat)), (cle, valeur: unknown) => (CHAMPS_DU_DLC.has(cle) ? undefined : valeur));
  return createHash('sha256').update(texte).digest('hex').slice(0, 16);
}

describe('empreinte de l’histoire', () => {
  it('un niveau d’essai chargé (tous les ennemis de l’histoire, les quatre familles de tours, jusqu’à la défaite au pas 1823)', () => {
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
    // Couverture : la partie a vraiment tourné (pas joués, ennemis apparus), et rien de dynamique n'y est entré.
    expect(etat.pas).toBeGreaterThanOrEqual(1500);
    expect(etat.ennemis.length).toBeGreaterThanOrEqual(70);
    expect(neutre(etat)).toBe(true);
    expect(empreinte(etat)).toBe('a148b31347ea2720');
  });

  const NIVEAUX: readonly (readonly [number, string])[] = [
    [1, '5f564cab74600491'],
    [20, '94b93ce42605a56b'],
    [100, 'a2a7eb5e4affb33b'],
  ];

  it.each(NIVEAUX)('le niveau %i de la campagne, joué sans tour jusqu’à la fin', (numero, attendue) => {
    const niveau = CAMPAGNE[numero - 1];
    if (!niveau) throw new Error(`niveau ${String(numero)} absent`);
    const etat = creerPartie(niveau.niveau, CONFIG);
    for (let p = 0; p < 30 * 400 && etat.statut === 'en_cours'; p++) step(etat);
    expect(etat.statut).toBe('defaite');
    // Couverture : la marche des ennemis sur plusieurs vagues (ces niveaux se jouent sans tour), rien de dynamique.
    expect(etat.pas).toBeGreaterThanOrEqual(3000);
    expect(etat.vagues.lancees).toBeGreaterThanOrEqual(4);
    expect(etat.ennemis.length).toBeGreaterThanOrEqual(10);
    expect(neutre(etat)).toBe(true);
    expect(empreinte(etat)).toBe(attendue);
  });
});
