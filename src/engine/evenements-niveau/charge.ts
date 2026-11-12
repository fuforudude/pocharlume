// Charge : un groupe d'ennemis surgit à l'entrée d'un chemin, un toutes les `intervalle` secondes, et file plus vite que d'habitude pendant
// `duree` secondes. La charge reprend celle du Prince Croisé (`Ennemi.charge`, `chargeVitesse`) : pendant qu'il charge, un ennemi ne
// s'arrête pas aux soldats. Les chargeurs comptent dans la vague de l'événement.
import { defEnnemi } from '../contenu';
import type { EvenementCharge, Niveau } from '../definitions';
import { ajouterEnnemi } from '../ennemis';
import type { EtatEvenementNiveau, EtatPartie } from '../etat';
import { enPas } from '../temps';
import { cheminEffectif } from './chemins-mobiles';

export function verifierCharge(niveau: Niveau, e: EvenementCharge, quoi: string): void {
  if (!Number.isInteger(e.chemin) || e.chemin < 0 || e.chemin >= niveau.carte.chemins.length) throw new Error(`${quoi} : chemin inconnu ${String(e.chemin)}`);
  if (!defEnnemi(e.ennemi)) throw new Error(`${quoi} : ennemi inconnu ${e.ennemi}`);
  if (!Number.isInteger(e.nombre) || e.nombre < 1) throw new Error(`${quoi} : nombre invalide (${String(e.nombre)})`);
  if (!(Number.isFinite(e.intervalle) && e.intervalle >= 0)) throw new Error(`${quoi} : intervalle invalide (${String(e.intervalle)})`);
  if (!(Number.isFinite(e.facteurVitesse) && e.facteurVitesse > 0)) throw new Error(`${quoi} : facteur de vitesse invalide (${String(e.facteurVitesse)})`);
  if (!(Number.isFinite(e.duree) && e.duree > 0)) throw new Error(`${quoi} : durée invalide (${String(e.duree)})`);
}

export function declencherCharge(etat: EtatPartie, suivi: EtatEvenementNiveau, e: EvenementCharge): void {
  suivi.restants = e.nombre;
  suivi.prochain = etat.pas;
}

/** Fait apparaître les chargeurs dont l'heure est venue ; l'événement est fini quand tous sont apparus. */
export function poursuivreCharge(etat: EtatPartie, suivi: EtatEvenementNiveau, e: EvenementCharge): void {
  const def = defEnnemi(e.ennemi);
  if (!def) {
    suivi.restants = 0;
    suivi.fini = true;
    return;
  }
  while (suivi.restants > 0 && etat.pas >= suivi.prochain) {
    const ennemi = ajouterEnnemi(etat, def, e.ennemi, cheminEffectif(etat, e.chemin), 0, e.elite === true, { vague: e.vague - 1 });
    ennemi.charge = Math.max(1, enPas(e.duree));
    ennemi.chargeVitesse = e.facteurVitesse;
    suivi.restants--;
    suivi.prochain += enPas(e.intervalle);
  }
  if (suivi.restants === 0) suivi.fini = true;
}
