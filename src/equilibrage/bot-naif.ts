// Bot « naïf » : un joueur débutant. Il construit sur les socles proches du chemin, dans un ordre un peu
// mélangé, avec des familles tirées au hasard, améliore ce qu'il peut quand il a des arêtes, choisit ses
// spécialisations au hasard, et n'utilise ni les sorts ni le héros. Tous ses choix viennent d'un générateur à
// graine : même graine, même partie.
import { creerGenerateur, tirer, validerAction } from '../engine';
import type { Action, EtatPartie, Generateur, IdFamille, Voie } from '../engine';
import { FAMILLES } from '../data/tours';
import { distance, echantillonner, type Echantillon } from './geometrie';
import type { Bot } from './simulation';

export interface OptionsNaif {
  /** Graine des choix du bot (indépendante de celle de la partie). */
  readonly graine: number;
  /** Probabilité de construire plutôt qu'améliorer quand les deux sont possibles. */
  readonly goutDeConstruire?: number;
}

function choisir<T>(g: Generateur, liste: readonly T[]): T | undefined {
  return liste[Math.floor(tirer(g) * liste.length)];
}

/** Socles par distance croissante au chemin, avec un bruit : « proches du chemin » sans être parfaitement triés. */
function ordreDesSocles(etat: EtatPartie, g: Generateur, echantillons: readonly Echantillon[]): number[] {
  const notes = etat.niveau.carte.socles.map((s, i) => {
    let min = Infinity;
    for (const e of echantillons) min = Math.min(min, distance(e, s));
    return { i, note: min + tirer(g) * 1.5 };
  });
  return notes.sort((a, b) => a.note - b.note).map((n) => n.i);
}

export function creerBotNaif(options: OptionsNaif): Bot {
  const g = creerGenerateur(options.graine);
  const goutDeConstruire = options.goutDeConstruire ?? 0.7;
  let ordre: number[] | null = null;
  /** Achat voulu mais pas encore payable : le bot économise plutôt que d'en changer. */
  let envie: Action | null = null;

  function nouvelleEnvie(etat: EtatPartie): Action | null {
    if (!ordre) return null;
    const libres = ordre.filter((s) => !etat.tours.some((t) => t.socle === s));
    const ameliorables = etat.tours.filter((t) => t.famille !== 'divine' && t.niveau < 4);
    const construire = libres.length > 0 && (ameliorables.length === 0 || tirer(g) < goutDeConstruire);
    if (construire) {
      const socle = libres[0];
      const famille: IdFamille | undefined = choisir(g, FAMILLES);
      return socle !== undefined && famille ? { type: 'construire', socle, tour: famille } : null;
    }
    const tour = choisir(g, ameliorables);
    if (!tour) return null;
    if (tour.niveau === 3) {
      const voie: Voie = tirer(g) < 0.5 ? 'A' : 'B';
      return { type: 'specialiser', socle: tour.socle, voie };
    }
    return { type: 'ameliorer', socle: tour.socle };
  }

  return {
    nom: 'naïf',
    decider(etat) {
      ordre ??= ordreDesSocles(etat, g, echantillonner(etat));
      envie ??= nouvelleEnvie(etat);
      if (!envie) return [];
      const raison = validerAction(etat, envie);
      if (raison === 'aretes_insuffisantes') return [];
      const action = envie;
      envie = null;
      return raison === null ? [action] : [];
    },
  };
}
