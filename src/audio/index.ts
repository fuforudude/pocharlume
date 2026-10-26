// API du son pour le reste du jeu : un moteur unique, branché sur le navigateur. Rien ici ne lève si l'audio manque.
//
//   installerAudio(() => session.sauvegarde.reglages)   une fois, au démarrage (main.ts)
//   audio.jouerEvenements(etat.evenements, etat)          à chaque pas de la partie (src/ui/partie.ts)
//   jouerInterface('refus' | 'clic' | 'achat')            depuis un écran : 'achat' pour la boutique, à appeler au succès
//
// Les volumes sont lus dans les réglages à chaque son : un curseur déplacé agit tout de suite. Le déblocage se fait au
// premier geste du joueur. Voir docs/architecture.md, section Son.
import { installerGestes } from './geste';
import { MoteurAudio, type ContexteAudio, type VolumesAudio } from './moteur';
import type { IdSonInterface } from './table';

export { MoteurAudio, gainDuVolume, type ContexteAudio, type VolumesAudio } from './moteur';
export { sonDe, SONS, SON_DES_EVENEMENTS, type IdSon, type IdSonInterface } from './table';

interface FenetreAudio {
  AudioContext?: new () => ContexteAudio;
  webkitAudioContext?: new () => ContexteAudio;
}

function creerContexteNavigateur(): ContexteAudio | null {
  const fenetre = globalThis as FenetreAudio;
  const Constructeur = fenetre.AudioContext ?? fenetre.webkitAudioContext;
  return Constructeur ? new Constructeur() : null;
}

async function chargerFichier(url: string): Promise<ArrayBuffer> {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`Son introuvable : ${url} (${String(reponse.status)})`);
  return reponse.arrayBuffer();
}

/** Le moteur du jeu. Sans AudioContext (test, navigateur ancien), toutes ses méthodes ne font rien. */
export const audio = new MoteurAudio({
  creerContexte: creerContexteNavigateur,
  charger: chargerFichier,
  urlDe: (id) => `${import.meta.env.BASE_URL}sons/${id}.ogg`,
  maintenant: () => performance.now(),
  // Le hasard du rendu : jamais celui du moteur de jeu, qui reste à graine.
  alea: () => Math.random(),
});

let retirer: (() => void) | null = null;

/**
 * Branche le son sur les réglages et sur le navigateur : volumes lus à chaque son, déblocage au premier geste, clic de
 * tout bouton. À appeler une fois ; un second appel remplace le premier.
 */
export function installerAudio(lireVolumes: () => VolumesAudio): void {
  audio.relierVolumes(lireVolumes);
  retirer?.();
  retirer = installerGestes(audio);
}

/** Joue un son d'interface : 'clic' (déjà joué par tout bouton), 'refus' (action impossible), 'achat' (boutique). */
export function jouerInterface(id: IdSonInterface): void {
  audio.jouer(id);
}
