// `node --import ./tools/niveaux/enregistrer.ts tools/balance/regler.ts --niveaux=11-20` : cherche, niveau par niveau, les arêtes de départ
// pour lesquelles le bot naïf gagne la part cible de ses parties en Matou (moyenne des trois dieux, graines d'évaluation). Les arêtes de
// départ sont le levier fin de la difficulté d'un niveau (elles jouent dans les trois difficultés) ; la recherche est une dichotomie
// sur des parties du seul bot naïf, bien moins chères que celles du soigneux. Écrit le résultat en JSON sur la sortie standard
// (`{ "11": 640, ... }`) à reporter à la main dans les plans (plan-region<N>.ts). Mise au point seulement : ne modifie aucun fichier.
// `GRAINE=1234` essaie une autre graine de vagues pour le niveau ; `--haut=` et `--bas=` fixent la part cible au niveau 1 et au niveau 10.
import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
import { DIEUX_EVALUES, GRAINES_EVALUATION } from '../../src/equilibrage/campagne.ts';
import { jouerPartie } from '../../src/equilibrage/simulation.ts';

const options = new Map<string, string>();
for (const argument of process.argv.slice(2)) {
  const [cle, valeur] = argument.replace(/^--/, '').split('=');
  options.set(cle ?? '', valeur ?? '');
}
function lireNiveaux(texte: string): number[] {
  return texte.split(',').flatMap((morceau) => {
    const [a, b] = morceau.split('-').map(Number);
    return b === undefined ? [a ?? 0] : Array.from({ length: b - (a ?? 0) + 1 }, (_, i) => (a ?? 0) + i);
  });
}
const numeros = lireNiveaux(options.get('niveaux') ?? '1-10');
const difficulte = options.get('difficulte') ?? 'matou';
/** Part cible de victoires du naïf au niveau k (1 à 10) de sa région : de `haut` au niveau 1 à `bas` au niveau 10. */
const haut = Number(options.get('haut') ?? 0.75);
const bas = Number(options.get('bas') ?? 0.3);

function tauxNaif(numero: number, aretes: number): number {
  const campagne = CAMPAGNE.find((c) => c.numero === numero);
  if (!campagne) throw new Error(`Niveau ${String(numero)} inconnu`);
  const niveau = { ...campagne.niveau, aretesDepart: aretes };
  // GRAINE=1234 : essaie une autre graine de vagues pour ce niveau (sans rien écrire).
  const plan = PLANS_REGIONS.flat().find((p) => p.numero === numero);
  const vagues = process.env.GRAINE && plan ? vaguesDuPlan({ ...plan, vagues: { ...plan.vagues, graine: Number(process.env.GRAINE) } }) : niveau.vagues;
  Object.assign(niveau, { vagues });
  let gagnees = 0;
  let total = 0;
  for (const dieu of DIEUX_EVALUES) {
    for (const graine of GRAINES_EVALUATION) {
      const r = jouerPartie(niveau, creerBotNaif({ graine: graine * 31 + 7 }), { graine, difficulte, dieu });
      total++;
      if (r.statut === 'victoire') gagnees++;
    }
  }
  return gagnees / total;
}

const resultat: Record<string, number> = {};
for (const numero of numeros) {
  const k = ((numero - 1) % 10) + 1;
  const cible = haut + ((bas - haut) * (k - 1)) / 9;
  let bas_ = 100;
  let haut_ = 6000;
  // Le taux croît avec les arêtes : dichotomie sur une échelle logarithmique grossière (pas de 1 %).
  for (let i = 0; i < 9; i++) {
    const milieu = Math.round(Math.sqrt(bas_ * haut_));
    if (tauxNaif(numero, milieu) < cible) bas_ = milieu;
    else haut_ = milieu;
  }
  const choisi = Math.round(haut_ / 5) * 5;
  resultat[String(numero)] = choisi;
  console.error(`niveau ${String(numero)} : cible ${String(Math.round(cible * 100))} % -> ${String(choisi)} arêtes (taux ${String(Math.round(tauxNaif(numero, choisi) * 100))} %)`);
}
console.log(JSON.stringify(resultat));
