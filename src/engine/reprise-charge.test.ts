// Reprise d'une partie en pleine charge : `accelerationCharge` (champ du DLC) est absent d'une sauvegarde faite avant lui ; `deserialiser`
// lui donne alors la valeur de `charge` (la charge du Prince Croisé et du voleur accélère pendant toute sa durée).
import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../data/ennemis';
import { avancerSecondes, ennemiDonnees, partieEssai } from './aides.test-utils';
import type { EtatPartie } from './etat';
import { deserialiser, serialiser, step } from './partie';

const VITESSE = ENNEMIS.prince_croise.vitesse;

/** Une partie avec un Prince Croisé immortel, avancée jusqu'à `secondes`. */
function partieAvecPrince(secondes: number): { etat: EtatPartie; id: number } {
  const etat = partieEssai();
  const prince = ennemiDonnees(etat, 'prince_croise', 2, { vitesse: VITESSE, pv: 1e9, degats: [0, 0] });
  avancerSecondes(etat, secondes);
  return { etat, id: prince.id };
}

/** La même sauvegarde telle qu'elle était avant le champ `accelerationCharge`. */
function sansAcceleration(texte: string): string {
  const copie = JSON.parse(texte) as { ennemis: Record<string, unknown>[] };
  for (const e of copie.ennemis) delete e.accelerationCharge;
  return JSON.stringify(copie);
}

describe('reprise d’une partie sérialisée', () => {
  it('une sauvegarde sans accelerationCharge, en pleine charge : l’accélération prend la valeur de la charge', () => {
    const { etat, id } = partieAvecPrince(10.2);
    const prince = etat.ennemis.find((e) => e.id === id);
    expect(prince?.charge).toBeGreaterThan(0);
    const texte = sansAcceleration(serialiser(etat));
    expect(texte).not.toContain('accelerationCharge');
    const repris = deserialiser(texte).ennemis.find((e) => e.id === id);
    expect(repris?.accelerationCharge).toBe(prince?.charge);
  });

  it('une sauvegarde sans accelerationCharge, juste avant la charge : le Prince accélère encore à sa charge suivante', () => {
    const { etat, id } = partieAvecPrince(5);
    const repris = deserialiser(sansAcceleration(serialiser(etat)));
    const prince = repris.ennemis.find((e) => e.id === id);
    if (!prince) throw new Error('Prince absent');
    expect(prince.accelerationCharge).toBe(0);
    avancerSecondes(repris, 4.5);
    let debut = Number.NaN;
    for (let i = 0; i < 60 && Number.isNaN(debut); i++) {
      step(repris);
      if (prince.charge > 0) debut = prince.distance;
    }
    expect(debut).not.toBeNaN();
    avancerSecondes(repris, 2);
    expect(prince.distance - debut).toBeCloseTo(VITESSE * 3 * 2, 1);
  });

  it('rejeu après deserialiser en pleine charge : la copie relue et l’original avancent à l’identique', () => {
    const { etat } = partieAvecPrince(10.3);
    const copie = deserialiser(serialiser(etat));
    expect(serialiser(copie)).toBe(serialiser(etat));
    avancerSecondes(etat, 6);
    avancerSecondes(copie, 6);
    expect(serialiser(copie)).toBe(serialiser(etat));
  });

  it('rejeu d’une sauvegarde d’avant le champ, en pleine charge : même trajectoire que l’original', () => {
    const { etat, id } = partieAvecPrince(10.3);
    const copie = deserialiser(sansAcceleration(serialiser(etat)));
    avancerSecondes(etat, 6);
    avancerSecondes(copie, 6);
    const a = etat.ennemis.find((e) => e.id === id);
    const b = copie.ennemis.find((e) => e.id === id);
    expect(b?.distance).toBeCloseTo(a?.distance ?? Number.NaN, 6);
  });
});
