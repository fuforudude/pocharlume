// Bot « naïf » : un joueur débutant. Il construit sur les cases de la grille proches du chemin, dans un ordre un peu
// mélangé, avec des familles tirées au hasard, améliore ce qu'il peut quand il a des arêtes, choisit ses
// spécialisations au hasard, et n'utilise ni les sorts ni le héros. Tous ses choix viennent d'un générateur à
// graine : même graine, même partie.
import { casesLibres, centreCase, creerGenerateur, tirer, tourSurCase, validerAction } from '../engine';
import type { Action, CaseGrille, EtatPartie, Generateur, IdFamille, Voie } from '../engine';
import { ENNEMIS } from '../data/ennemis';
import { FAMILLES } from '../data/tours';
import { distance, echantillonner, PAS_ECHANTILLON, type Echantillon } from './geometrie';
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

/** Nombre d'emplacements que le débutant juge bons : il y construit, puis il améliore. */
const EMPLACEMENTS_DEBUTANT = 16;

/** Distance (en tuiles) à laquelle le débutant juge qu'une case « voit » le chemin. */
const PORTEE_VUE = 3.5;

/**
 * Toutes les cases constructibles du niveau, les mieux placées d'abord : un débutant construit là où le chemin passe le plus près et le
 * plus longtemps (virages, boucles), à vue d'œil, donc avec un bruit. Il ne connaît pas les vagues : aucun chemin n'est pesé.
 */
function ordreDesCases(etat: EtatPartie, g: Generateur, echantillons: readonly Echantillon[]): CaseGrille[] {
  const notes = casesLibres({ niveau: etat.niveau, tours: [] }).map((c) => {
    const centre = centreCase(c.cx, c.cy);
    let vue = 0;
    for (const e of echantillons) if (distance(e, centre) <= PORTEE_VUE) vue += PAS_ECHANTILLON;
    return { c, note: -vue + tirer(g) * 4 };
  });
  return notes.sort((a, b) => a.note - b.note).map((n) => n.c);
}

export function creerBotNaif(options: OptionsNaif): Bot {
  const g = creerGenerateur(options.graine);
  const goutDeConstruire = options.goutDeConstruire ?? 0.95;
  let ordre: CaseGrille[] | null = null;
  /** Achat voulu mais pas encore payable : le bot économise plutôt que d'en changer. */
  let envie: Action | null = null;

  /** Le niveau compte des furtifs (le débutant lit les ennemis annoncés et sait qu'il lui faut des Guetteurs des Toits). */
  let furtifs: boolean | null = null;

  /** Un débutant qui sait qu'un furtif viendra : une tour de tir par chemin, montée puis spécialisée en Guetteurs des Toits (voie A). */
  function envieGuetteurs(etat: EtatPartie): Action | null {
    furtifs ??= etat.niveau.vagues.some((v) => v.paquets.some((p) => ENNEMIS[p.ennemi as keyof typeof ENNEMIS].furtif));
    if (!furtifs) return null;
    const tirs = etat.tours.filter((t) => t.famille === 'tir');
    if (tirs.filter((t) => t.voie === 'A').length >= etat.niveau.carte.chemins.length) return null;
    const tour = tirs.filter((t) => t.niveau < 4).sort((a, b) => b.niveau - a.niveau)[0];
    if (tour) return tour.niveau === 3 ? { type: 'specialiser', cx: tour.cx, cy: tour.cy, voie: 'A' } : { type: 'ameliorer', cx: tour.cx, cy: tour.cy };
    const choisie = ordre?.find((c) => !tourSurCase(etat, c.cx, c.cy));
    return choisie ? { type: 'construire', cx: choisie.cx, cy: choisie.cy, tour: 'tir' } : null;
  }

  function nouvelleEnvie(etat: EtatPartie): Action | null {
    if (!ordre) return null;
    const guetteurs = envieGuetteurs(etat);
    if (guetteurs) return guetteurs;
    // Un débutant n'occupe que les emplacements qui lui paraissent bons ; une fois ceux-là pris, il améliore ses tours.
    const libres = ordre.slice(0, EMPLACEMENTS_DEBUTANT).filter((c) => !tourSurCase(etat, c.cx, c.cy));
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
