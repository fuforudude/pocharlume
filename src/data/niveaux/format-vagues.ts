// Format compact des vagues figées (vagues-region<N>.ts). Les 50 niveaux comptent plus de 10 000 groupes d'ennemis : écrits
// en objets (`{ ennemi: 'glaneur', nombre: 5, … }`), ils pesaient 700 Ko dans le jeu livré. Une vague est ici une suite plate
// de nombres, six par groupe : `indice de l'ennemi dans la légende de la région, nombre, intervalle, chemin, délai, facteur de PV`. Le
// fichier porte sa légende. Un groupe qui vole dans le couloir k du Vol de Corbeaux (`Paquet.couloir`) s'écrit avec le chemin −(k + 1) :
// −1 pour le couloir 0, −2 pour le couloir 1… (les vagues sans couloir ne changent pas d'un octet). Le contenu est exactement celui du générateur (un test le vérifie) ; ce module ne fait que traduire.
import type { Paquet, Vague } from '../../engine/definitions';

/** Nombres par groupe : indice de l'ennemi, nombre, intervalle (s), chemin, délai (s), facteur de PV et de prime (1 = ennemi normal). */
export const CHAMPS_PAR_GROUPE = 6;

/** Le nombre écrit à la place du chemin : le chemin, ou −(couloir + 1) pour un groupe en couloir. */
function cheminCompact(p: Paquet): number {
  return p.couloir === undefined ? p.chemin : -(p.couloir + 1);
}

/** Une vague : ses groupes à la suite, `CHAMPS_PAR_GROUPE` nombres chacun. */
export type VagueCompacte = readonly number[];
/** Un niveau : ses vagues. */
export type NiveauCompact = readonly VagueCompacte[];

/** Les vagues d'une région à partir de leur forme compacte et de la légende des ennemis qu'elle emploie. */
export function decoderVagues(legende: readonly string[], niveaux: readonly NiveauCompact[]): Vague[][] {
  return niveaux.map((niveau, n) =>
    niveau.map((vague, w) => {
      if (vague.length % CHAMPS_PAR_GROUPE !== 0) throw new Error(`Niveau ${String(n + 1)} vague ${String(w + 1)} : ${String(vague.length)} nombres, un multiple de ${String(CHAMPS_PAR_GROUPE)} est attendu`);
      const paquets: Paquet[] = [];
      for (let i = 0; i < vague.length; i += CHAMPS_PAR_GROUPE) {
        const [indice, nombre, intervalle, chemin, delai, facteur] = vague.slice(i, i + CHAMPS_PAR_GROUPE) as [number, number, number, number, number, number];
        const ennemi = legende[indice];
        if (ennemi === undefined) throw new Error(`Niveau ${String(n + 1)} vague ${String(w + 1)} : ennemi ${String(indice)} absent de la légende`);
        if (!Number.isInteger(chemin)) throw new Error(`Niveau ${String(n + 1)} vague ${String(w + 1)} : chemin ${String(chemin)}, un entier est attendu`);
        // Chemin négatif : le groupe vole dans le couloir −chemin − 1 (son chemin, ignoré, vaut 0 par convention).
        const trajet = chemin >= 0 ? { chemin } : { chemin: 0, couloir: -chemin - 1 };
        paquets.push(facteur === 1 ? { ennemi, nombre, intervalle, ...trajet, delai } : { ennemi, nombre, intervalle, ...trajet, delai, facteurPv: facteur });
      }
      return { paquets };
    }),
  );
}

/** La légende (ennemis employés, en ordre alphabétique) et la forme compacte des vagues d'une région : l'inverse de `decoderVagues`. */
export function encoderVagues(niveaux: readonly (readonly Vague[])[]): { legende: string[]; niveaux: NiveauCompact[] } {
  const legende = [...new Set(niveaux.flatMap((n) => n.flatMap((v) => v.paquets.map((p) => p.ennemi))))].sort();
  return {
    legende,
    niveaux: niveaux.map((niveau) => niveau.map((vague) => vague.paquets.flatMap((p) => [legende.indexOf(p.ennemi), p.nombre, p.intervalle, cheminCompact(p), p.delai, p.facteurPv ?? 1]))),
  };
}
