// Cycle d'une partie : création, pas de simulation, fin, rejeu d'un journal, sérialisation.
import { REGLES } from '../data/regles';
import { VERSION_DONNEES } from '../data/version';
import type { Action, ResultatAction } from './actions';
import { ajusterMontant } from './argent';
import { appliquerCapacitesCampagne } from './capacites-campagne';
import { calculerChemin } from './chemins';
import { appliquerAction } from './commandes';
import { copierConfig, verifierConfig } from './config';
import { defDieu, defEnnemi, defFamille, difficulteDeConfig } from './contenu';
import type { DefiFer, Niveau, Vague } from './definitions';
import { mettreAJourEnnemis } from './ennemis';
import { VERSION_ETAT, type ConfigPartie, type DefiPartie, type EntreeJournal, type EtatPartie } from './etat';
import { ouvrirPas } from './evenements';
import { resoudreHeros } from './modificateurs';
import { laisserEffetsDesMorts, laisserNuagesDesMorts, mettreAJourNuages, mettreAJourPouvoirsEnnemis } from './pouvoirs-ennemis';
import { mettreAJourTirsEnnemis } from './pouvoirs-modernes';
import { mettreAJourSorts, rechargeSort } from './sorts';
import { mettreAJourPieges, mettreAJourStructures, mettreAJourZones } from './structures';
import { calculerCouloirs, verifierPaquetEnCouloir } from './gimmicks/corbeaux';
import { mettreAJourGimmick, verifierGimmick } from './gimmicks';
import { chargesEnAttente, creerEtatDynamique, mettreAJourDynamique, sansDynamique, verifierDynamique } from './evenements-niveau';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { mettreAJourProjectiles, mettreAJourTours } from './tours';
import { creerUnite, estRetiree, mettreAJourUnites } from './unites';
import { mettreAJourVagues } from './vagues';

export { appliquerAction, coutCompetence, coutConstruction, validerAction, valeurRevente } from './commandes';

/** Rejeu sans pas final : au-delà de 3 heures de jeu, on s'arrête (partie sans fin). */
const PAS_MAX_REJEU = 3 * 3600 * PAS_PAR_SECONDE;

/**
 * Étoiles d'une victoire : 3 si aucune vie n'a jamais été perdue (même si l'Herbe de Sabbat les a rendues), 2 avec au
 * moins la moitié des vies, 1 sinon.
 */
export function etoilesPour(vies: number, viesDepart: number, viePerdue: boolean): number {
  if (vies <= 0) return 0;
  if (!viePerdue && vies >= viesDepart) return 3;
  return vies >= viesDepart * REGLES.seuilDeuxEtoiles ? 2 : 1;
}

function verifierNiveau(niveau: Niveau): void {
  verifierGimmick(niveau);
  verifierDynamique(niveau);
  niveau.vagues.forEach((vague, i) => {
    for (const p of vague.paquets) {
      const def = defEnnemi(p.ennemi);
      if (!def) throw new Error(`Vague ${String(i + 1)} : ennemi inconnu ${p.ennemi}`);
      if (p.couloir !== undefined) verifierPaquetEnCouloir(niveau, p, def, i + 1);
      else if (!Number.isInteger(p.chemin) || p.chemin < 0 || p.chemin >= niveau.carte.chemins.length) throw new Error(`Vague ${String(i + 1)} : chemin inconnu ${String(p.chemin)}`);
    }
  });
  const fer = niveau.defiFer;
  if (fer) {
    const [a, b] = fer.familles;
    for (const famille of fer.familles) if (!defFamille(famille)) throw new Error(`Défi Fer : famille inconnue ${famille}`);
    if (a === b) throw new Error('Défi Fer : deux familles différentes sont attendues');
    for (const [nom, valeur] of [['facteurAretes', fer.facteurAretes], ['facteurEffectifs', fer.facteurEffectifs]] as const) {
      if (valeur !== undefined && !(Number.isFinite(valeur) && valeur > 0)) throw new Error(`Défi Fer : ${nom} doit être un nombre fini strictement positif (${String(valeur)})`);
    }
  }
}

/** Les facteurs du défi Fer pour ce niveau : ceux de son `defiFer` quand il en donne, sinon ceux de `REGLES.fer`. */
function facteursFer(fer: DefiFer | undefined): { facteurAretes: number; facteurEffectifs: number } {
  return { facteurAretes: fer?.facteurAretes ?? REGLES.fer.facteurAretes, facteurEffectifs: fer?.facteurEffectifs ?? REGLES.fer.facteurEffectifs };
}

function estBoss(ennemi: string): boolean {
  return defEnnemi(ennemi)?.boss === true;
}

/**
 * Les vagues telles que le défi les joue. Héroïque : chaque groupe (hors boss) est d'élite. Fer : toutes les vagues
 * n'en font qu'une (les groupes gardent leurs délais), les effectifs sont multipliés (`facteurEffectifs` du niveau, sinon
 * celui de `REGLES.fer` ; arrondi au-dessus), sauf ceux d'un boss. Sans défi, les vagues du niveau.
 */
function vaguesDuDefi(vagues: readonly Vague[], defi: DefiPartie | null, fer?: DefiFer): readonly Vague[] {
  if (defi === 'heroique') {
    return vagues.map((v) => ({ paquets: v.paquets.map((p) => (estBoss(p.ennemi) ? p : { ...p, elite: true })) }));
  }
  if (defi === 'fer' && vagues.length > 0) {
    // La tolérance évite qu'un produit juste (4 × 1,5) monte d'un cran à cause des flottants.
    const { facteurEffectifs } = facteursFer(fer);
    const effectif = (p: Vague['paquets'][number]): number => (estBoss(p.ennemi) ? p.nombre : Math.ceil(p.nombre * facteurEffectifs - 1e-9));
    return [{ paquets: vagues.flatMap((v) => v.paquets.map((p) => ({ ...p, nombre: effectif(p) }))) }];
  }
  return vagues;
}

/**
 * Les `nombre` dernières vagues avec leurs groupes (boss exceptés) en élite : la difficulté Vieux Sage les joue ainsi.
 * Les défis se jouent avec les règles de Matou, qui n'en demande aucune.
 */
function vaguesAvecElites(vagues: readonly Vague[], nombre: number): readonly Vague[] {
  if (nombre <= 0) return vagues;
  const debut = vagues.length - nombre;
  return vagues.map((v, i) => (i < debut ? v : { paquets: v.paquets.map((p) => (estBoss(p.ennemi) ? p : { ...p, elite: true })) }));
}

function verifierVersionDonnees(version: unknown): void {
  if (version !== VERSION_DONNEES) {
    throw new Error(`Partie prévue pour la version des données ${String(version)}, le jeu est en version ${String(VERSION_DONNEES)}`);
  }
}

/** Le niveau sans son gimmick (copie de surface) : l'infini joue les cartes d'après l'histoire sans leur particularité. */
function sansGimmick(niveau: Niveau): Niveau {
  const copie: { -readonly [K in keyof Niveau]: Niveau[K] } = { ...niveau };
  delete copie.gimmick;
  return copie;
}

export function creerPartie(niveau: Niveau, config: ConfigPartie): EtatPartie {
  const refus = verifierConfig(config);
  if (refus !== null) throw new Error(refus);
  const difficulte = difficulteDeConfig(config);
  const dieu = defDieu(config.dieu);
  if (!difficulte || !dieu) throw new Error('Config de partie invalide');
  verifierNiveau(niveau);
  const defi = config.defi ?? null;
  if (defi === 'fer' && !niveau.defiFer) throw new Error(`Défi Fer : le niveau ${niveau.id} n’a pas de familles imposées`);
  const copieBrute = JSON.parse(JSON.stringify(niveau)) as Niveau;
  const infini = config.infini ?? null;
  // Infini : les vagues du niveau sont ignorées, le moteur génère les siennes (voir infini.ts) et la partie ne se gagne pas. Les cartes
  // d'après l'histoire s'y jouent sans leur gimmick (spec de l'après-histoire) : on retire celui du niveau de campagne qui les porte.
  const copie: Niveau = infini
    ? { ...sansDynamique(sansGimmick(copieBrute)), vagues: [] }
    : { ...copieBrute, vagues: vaguesAvecElites(vaguesDuDefi(copieBrute.vagues, defi, niveau.defiFer), niveau.sansElites === true ? 0 : difficulte.vaguesElites) };
  const vies = defi === 'heroique' ? REGLES.heroique.vies : difficulte.vies;
  const etat: EtatPartie = {
    version: VERSION_ETAT,
    versionDonnees: VERSION_DONNEES,
    niveau: copie,
    config: copierConfig(config),
    chemins: copie.carte.chemins.map(calculerChemin),
    couloirs: calculerCouloirs(copie),
    pas: 0,
    rng: config.graine >>> 0,
    statut: 'en_cours',
    etoiles: 0,
    vies,
    viesDepart: vies,
    viePerdue: false,
    aretes: ajusterMontant(niveau.aretesDepart, difficulte.aretesDepart * (defi === 'heroique' ? REGLES.heroique.facteurAretes : defi === 'fer' ? facteursFer(niveau.defiFer).facteurAretes : 1)),
    vagues: { lancees: 0, prochaine: infini || copie.vagues.length > 0 ? enPas(REGLES.delaiPremiereVague) : -1, paquets: [] },
    ennemis: [],
    unites: [],
    tours: [],
    projectiles: [],
    tirsEnnemis: [],
    pieges: [],
    zones: [],
    structures: [],
    heros: -1,
    morts: [],
    sorts: [],
    objetsUtilises: config.objets.map(() => false),
    prochainId: 1,
    evenements: [],
    evenementsPas: 0,
    journal: [],
    dynamique: creerEtatDynamique(copie),
  };
  etat.sorts = dieu.sorts.map((s) => ({ recharge: rechargeSort(etat, s, true) }));
  const depart = copie.carte.departHeros;
  const resolu = resoudreHeros(etat.config);
  const heros = creerUnite(etat, {
    genre: 'heros',
    tour: -1,
    emplacement: 0,
    x: depart.x,
    y: depart.y,
    ancreX: depart.x,
    ancreY: depart.y,
    stats: resolu.stats,
    delaiReapparition: enPas(REGLES.reapparitionHeros),
    duree: -1,
    zone: resolu.zone,
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
  } else if (etat.config.infini) {
    // Infini : jamais de victoire, la partie finit à la dernière vie perdue.
    return;
  } else if (etat.vagues.lancees >= etat.niveau.vagues.length && etat.vagues.paquets.length === 0 && etat.ennemis.length === 0 && !chargesEnAttente(etat)) {
    etat.statut = 'victoire';
    etat.etoiles = etoilesPour(etat.vies, etat.viesDepart, etat.viePerdue);
  } else {
    return;
  }
  etat.evenements.push({ type: 'fin', statut: etat.statut, etoiles: etat.etoiles });
}

/** Le pas de simulation lui-même, dans un ordre fixe. */
function simuler(etat: EtatPartie): void {
  ouvrirPas(etat);
  mettreAJourGimmick(etat);
  mettreAJourVagues(etat);
  mettreAJourDynamique(etat);
  mettreAJourPouvoirsEnnemis(etat);
  appliquerCapacitesCampagne(etat);
  mettreAJourNuages(etat);
  mettreAJourZones(etat);
  mettreAJourEnnemis(etat);
  mettreAJourPieges(etat);
  mettreAJourUnites(etat);
  mettreAJourTours(etat);
  mettreAJourStructures(etat);
  mettreAJourProjectiles(etat);
  mettreAJourTirsEnnemis(etat);
  mettreAJourSorts(etat);
  laisserNuagesDesMorts(etat);
  laisserEffetsDesMorts(etat);
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
