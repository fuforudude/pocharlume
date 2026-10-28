// Bot « naïf » : un joueur débutant. Il construit sur les cases de la grille proches du chemin, dans un ordre un peu
// mélangé, avec des familles tirées au hasard, améliore ce qu'il peut quand il a des arêtes, choisit ses
// spécialisations au hasard, et n'utilise ni les sorts ni le héros. Tous ses choix viennent d'un générateur à
// graine : même graine, même partie.
import { casesLibres, centreCase, creerGenerateur, tirer, tourSurCase, validerAction } from '../engine';
import type { Action, CaseGrille, EtatPartie, Generateur, IdFamille, Voie } from '../engine';
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

/**
 * Toutes les cases constructibles du niveau par distance croissante au chemin, avec un bruit : « proches du chemin » sans être
 * parfaitement triées.
 */
function ordreDesCases(etat: EtatPartie, g: Generateur, echantillons: readonly Echantillon[]): CaseGrille[] {
  const notes = casesLibres({ niveau: etat.niveau, tours: [] }).map((c) => {
    const centre = centreCase(c.cx, c.cy);
    let min = Infinity;
    for (const e of echantillons) min = Math.min(min, distance(e, centre));
    return { c, note: min + tirer(g) * 1.5 };
  });
  return notes.sort((a, b) => a.note - b.note).map((n) => n.c);
}

export function creerBotNaif(options: OptionsNaif): Bot {
  const g = creerGenerateur(options.graine);
  const goutDeConstruire = options.goutDeConstruire ?? 0.7;
  let ordre: CaseGrille[] | null = null;
  /** Achat voulu mais pas encore payable : le bot économise plutôt que d'en changer. */
  let envie: Action | null = null;

  function nouvelleEnvie(etat: EtatPartie): Action | null {
    if (!ordre) return null;
    const libres = ordre.filter((c) => !tourSurCase(etat, c.cx, c.cy));
    const ameliorables = etat.tours.filter((t) => t.famille !== 'divine' && t.niveau < 4);
    const construire = libres.length > 0 && (ameliorables.length === 0 || tirer(g) < goutDeConstruire);
    if (construire) {
      const choisie = libres[0];
      const famille: IdFamille | undefined = choisir(g, FAMILLES);
      return choisie && famille ? { type: 'construire', cx: choisie.cx, cy: choisie.cy, tour: famille } : null;
    }
    const tour = choisir(g, ameliorables);
    if (!tour) return null;
    if (tour.niveau === 3) {
      const voie: Voie = tirer(g) < 0.5 ? 'A' : 'B';
      return { type: 'specialiser', cx: tour.cx, cy: tour.cy, voie };
    }
    return { type: 'ameliorer', cx: tour.cx, cy: tour.cy };
  }

  return {
    nom: 'naïf',
    decider(etat) {
      ordre ??= ordreDesCases(etat, g, echantillonner(etat));
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
