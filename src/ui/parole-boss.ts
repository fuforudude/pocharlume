// La parole d'un boss (`boss.r<n>.parole` pour l'histoire, `boss.m<n>.parole` pour le DLC) s'affiche quand la vague qui le contient arrive : un bandeau qui
// ne bloque rien (voir Hud.afficherParole).
import { ENNEMIS } from '../data/ennemis';
import { NIVEAUX_PAR_REGION } from '../data/meta';
import type { NiveauCampagne } from '../data/visuel';
import { aTexte, type CleTexte } from '../i18n';
import type { Vague } from '../engine/definitions';

/**
 * La région à passer à `cleParoleBoss` pour ce niveau : la région visuelle dans l'histoire, la région de la campagne (1 à 3, par dizaines
 * de numéros) dans le DLC, dont la région visuelle (101…) ne dit pas quel boss on affronte.
 */
export function regionDeParole(niveau: Pick<NiveauCampagne, 'numero' | 'campagne' | 'visuel'>): number {
  return niveau.campagne === 'moderne' ? Math.floor((niveau.numero - 1) / NIVEAUX_PAR_REGION) + 1 : niveau.visuel.region;
}

/**
 * Clé de la parole à dire au lancement de la vague `index` (0 = première) d'un niveau, ou null (pas de boss dans la vague, ou pas de texte).
 * `region` est la région visuelle pour l'histoire (`boss.r<n>.parole`), ou la région de la campagne pour le DLC quand `moderne` est vrai
 * (`boss.m<n>.parole` : la région visuelle du DLC ne dit pas quel boss on affronte). Une clé sans texte ne lève jamais d'erreur : null.
 */
export function cleParoleBoss(vagues: readonly Vague[], index: number, region: number, niveauDeBoss: boolean, moderne = false): CleTexte | null {
  if (!niveauDeBoss) return null;
  const vague = vagues[index];
  if (!vague) return null;
  const aUnBoss = vague.paquets.some((p) => Object.hasOwn(ENNEMIS, p.ennemi) && ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss);
  if (!aUnBoss) return null;
  const cle = `boss.${moderne ? 'm' : 'r'}${String(region)}.parole`;
  return aTexte(cle) ? (cle as CleTexte) : null;
}

/** Écart maximal pris en compte entre deux images (ms) : un onglet qui dort ne vide pas le bandeau d'un coup. */
const ECART_MAX_MS = 100;

/** Temps restant du bandeau après `ecartMs` de temps réel : rien en pause, ×vitesse en jeu. */
export function decompteParole(restantMs: number, ecartMs: number, pause: boolean, vitesse: number): number {
  if (pause) return restantMs;
  return Math.max(0, restantMs - Math.min(ecartMs, ECART_MAX_MS) * vitesse);
}
