// Cycle d'une partie : création, pas de simulation, fin, rejeu d'un journal, sérialisation.
import { REGLES } from '../data/regles';
import { VERSION_DONNEES } from '../data/version';
import type { Action, ResultatAction } from './actions';
import { ajusterMontant } from './argent';
import { calculerChemin } from './chemins';
import { appliquerAction } from './commandes';
import { defDieu, defDifficulte, defEnnemi } from './contenu';
import type { DefHeros, Niveau, StatsCombattant } from './definitions';
import { mettreAJourEnnemis } from './ennemis';
import { VERSION_ETAT, type ConfigPartie, type EntreeJournal, type EtatPartie } from './etat';
import { ouvrirPas } from './evenements';
import { mettreAJourSorts } from './sorts';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { mettreAJourProjectiles, mettreAJourTours } from './tours';
import { creerUnite, estRetiree, mettreAJourUnites } from './unites';
import { mettreAJourVagues } from './vagues';

export { appliquerAction, coutConstruction, validerAction, valeurRevente } from './commandes';

/** Rejeu sans pas final : au-delà de 3 heures de jeu, on s'arrête (partie sans fin). */
const PAS_MAX_REJEU = 3 * 3600 * PAS_PAR_SECONDE;

/** Étoiles d'une victoire : 3 sans vie perdue, 2 avec au moins la moitié des vies, 1 sinon. */
export function etoilesPour(vies: number, viesDepart: number): number {
  if (vies <= 0) return 0;
  if (vies >= viesDepart) return 3;
  return vies >= viesDepart * REGLES.seuilDeuxEtoiles ? 2 : 1;
}

function statsHeros(def: DefHeros, niveau: number): StatsCombattant {
  const bonus = niveau - 1;
  return {
    nom: def.nom,
    pv: def.pv + bonus * def.pvParNiveau,
    degats: [def.degats[0] + bonus * def.degatsParNiveau, def.degats[1] + bonus * def.degatsParNiveau],
    cadence: def.cadence,
    coups: 1,
    armure: def.armure,
    resistance: def.resistance,
    vitesse: def.vitesse,
    portee: def.portee,
    capacite: def.capacite,
    effets: def.effets,
  };
}

function verifierNiveau(niveau: Niveau): void {
  niveau.vagues.forEach((vague, i) => {
    for (const p of vague.paquets) {
      if (!defEnnemi(p.ennemi)) throw new Error(`Vague ${String(i + 1)} : ennemi inconnu ${p.ennemi}`);
      if (!Number.isInteger(p.chemin) || p.chemin < 0 || p.chemin >= niveau.carte.chemins.length) throw new Error(`Vague ${String(i + 1)} : chemin inconnu ${String(p.chemin)}`);
    }
  });
}

function verifierVersionDonnees(version: unknown): void {
  if (version !== VERSION_DONNEES) {
    throw new Error(`Partie prévue pour la version des données ${String(version)}, le jeu est en version ${String(VERSION_DONNEES)}`);
  }
}

export function creerPartie(niveau: Niveau, config: ConfigPartie): EtatPartie {
  verifierVersionDonnees(config.versionDonnees);
  const difficulte = defDifficulte(config.difficulte);
  if (!difficulte) throw new Error(`Difficulté inconnue : ${config.difficulte}`);
  const dieu = defDieu(config.dieu);
  if (!dieu) throw new Error(`Dieu inconnu : ${config.dieu}`);
  if (!Number.isInteger(config.niveauHeros) || config.niveauHeros < 1 || config.niveauHeros > REGLES.niveauHerosMax) {
    throw new Error(`Niveau de héros invalide : ${String(config.niveauHeros)}`);
  }
  verifierNiveau(niveau);
  const copie = JSON.parse(JSON.stringify(niveau)) as Niveau;
  const etat: EtatPartie = {
    version: VERSION_ETAT,
    versionDonnees: VERSION_DONNEES,
    niveau: copie,
    config: { ...config },
    chemins: copie.carte.chemins.map(calculerChemin),
    pas: 0,
    rng: config.graine >>> 0,
    statut: 'en_cours',
    etoiles: 0,
    vies: difficulte.vies,
    viesDepart: difficulte.vies,
    aretes: ajusterMontant(niveau.aretesDepart, difficulte.aretesDepart),
    vagues: { lancees: 0, prochaine: copie.vagues.length > 0 ? enPas(REGLES.delaiPremiereVague) : -1, paquets: [] },
    ennemis: [],
    unites: [],
    tours: [],
    projectiles: [],
    heros: -1,
    sorts: dieu.sorts.map((s) => ({ recharge: enPas(s.rechargeInitiale) })),
    prochainId: 1,
    evenements: [],
    evenementsPas: 0,
    journal: [],
  };
  const depart = copie.carte.departHeros;
  const heros = creerUnite(etat, {
    genre: 'heros',
    tour: -1,
    emplacement: 0,
    x: depart.x,
    y: depart.y,
    ancreX: depart.x,
    ancreY: depart.y,
    stats: statsHeros(dieu.heros, config.niveauHeros),
    delaiReapparition: enPas(REGLES.reapparitionHeros),
    duree: -1,
    zone: dieu.heros.zone,
  });
  etat.heros = heros.id;
  return etat;
}

function retirerDisparus(etat: EtatPartie): void {
  let garde = 0;
  for (const e of etat.ennemis) if (e.vivant) etat.ennemis[garde++] = e;
  etat.ennemis.length = garde;
  garde = 0;
  for (const u of etat.unites) if (!estRetiree(u)) etat.unites[garde++] = u;
  etat.unites.length = garde;
}

function verifierFin(etat: EtatPartie): void {
  if (etat.vies <= 0) {
    etat.statut = 'defaite';
    etat.etoiles = 0;
  } else if (etat.vagues.lancees >= etat.niveau.vagues.length && etat.vagues.paquets.length === 0 && etat.ennemis.length === 0) {
    etat.statut = 'victoire';
    etat.etoiles = etoilesPour(etat.vies, etat.viesDepart);
  } else {
    return;
  }
  etat.evenements.push({ type: 'fin', statut: etat.statut, etoiles: etat.etoiles });
}

/** Le pas de simulation lui-même, dans un ordre fixe. */
function simuler(etat: EtatPartie): void {
  ouvrirPas(etat);
  mettreAJourVagues(etat);
  mettreAJourEnnemis(etat);
  mettreAJourUnites(etat);
  mettreAJourTours(etat);
  mettreAJourProjectiles(etat);
  mettreAJourSorts(etat);
  retirerDisparus(etat);
  verifierFin(etat);
  etat.pas++;
}

/**
 * Un pas complet : applique les actions de ce pas (dans l'ordre), puis simule 1/30 s. Les événements des
 * actions et de la simulation se retrouvent ensemble dans `etat.evenements` (règle dans evenements.ts).
 * Partie terminée : rien ne bouge, les actions sont refusées et les événements sont vidés.
 */
export function avancer(etat: EtatPartie, actions: readonly Action[]): ResultatAction[] {
  if (etat.statut !== 'en_cours') {
    etat.evenements = [];
    return actions.map(() => ({ ok: false, raison: 'partie_terminee' }));
  }
  const resultats = actions.map((a) => appliquerAction(etat, a));
  simuler(etat);
  return resultats;
}

/** Un pas sans action ; garde les événements des actions appliquées juste avant à ce même pas. */
export function step(etat: EtatPartie): void {
  if (etat.statut !== 'en_cours') {
    etat.evenements = [];
    return;
  }
  simuler(etat);
}

/**
 * Rejoue une partie à partir de sa config (version des données comprise) et de son journal. S'arrête au pas `pasFinal` s'il est donné,
 * sinon à la fin de la partie.
 */
export function rejouer(niveau: Niveau, config: ConfigPartie, journal: readonly EntreeJournal[], pasFinal?: number): EtatPartie {
  const etat = creerPartie(niveau, config);
  const limite = pasFinal ?? PAS_MAX_REJEU;
  const lot: Action[] = [];
  let i = 0;
  while (etat.statut === 'en_cours' && etat.pas < limite) {
    lot.length = 0;
    for (let entree = journal[i]; entree && entree.pas <= etat.pas; entree = journal[++i]) lot.push(entree.action);
    avancer(etat, lot);
  }
  return etat;
}

export function serialiser(etat: EtatPartie): string {
  return JSON.stringify(etat);
}

export function deserialiser(texte: string): EtatPartie {
  const etat = JSON.parse(texte) as EtatPartie;
  if (etat.version !== VERSION_ETAT) throw new Error(`Etat de partie en version ${String(etat.version)}, attendue ${String(VERSION_ETAT)}`);
  verifierVersionDonnees(etat.versionDonnees);
  return etat;
}
