// Lecture des sons avec la Web Audio API. Principes :
// - le contexte audio n'est créé qu'au premier geste du joueur (`debloquer`) : les navigateurs refusent le son avant ;
// - les fichiers se chargent à la demande (au déblocage si le volume n'est pas nul, ou au premier usage) ;
// - deux bus, effets et interface, reliés au volume « son » des réglages, et un bus musique prévu pour plus tard ;
// - rien ne lève : sans AudioContext (test, vieux navigateur), en silencieux, avec un fichier introuvable, on ne joue rien.
// Le hasard d'ici (variation de hauteur) est celui du rendu, jamais celui du moteur de jeu.
import type { Evenement } from '../engine';
import { Limiteur } from './limiteur';
import { IDS_SONS, PARTIE_VIDE, SONS, sonDe, type IdSon, type VuePartie } from './table';

// Le strict nécessaire de la Web Audio API : un faux objet suffit dans les tests, et `AudioContext` y correspond.
export interface ParametreAudio {
  value: number;
}
export interface NoeudAudio {
  connect(destination: NoeudAudio): unknown;
}
export interface GainAudio extends NoeudAudio {
  readonly gain: ParametreAudio;
}
export interface SourceAudio extends NoeudAudio {
  buffer: unknown;
  readonly playbackRate: ParametreAudio;
  start(quand?: number): void;
}
export interface ContexteAudio {
  readonly state: string;
  readonly destination: NoeudAudio;
  createGain(): GainAudio;
  createBufferSource(): SourceAudio;
  decodeAudioData(donnees: ArrayBuffer): Promise<unknown>;
  resume(): Promise<void>;
}

/** Volumes des réglages, de 0 à 100. */
export interface VolumesAudio {
  readonly son: number;
  readonly musique: number;
}

export interface DependancesAudio {
  /** Crée le contexte audio, ou rend null s'il n'existe pas dans cet environnement. */
  creerContexte(): ContexteAudio | null;
  /** Télécharge un fichier. */
  charger(url: string): Promise<ArrayBuffer>;
  urlDe(id: IdSon): string;
  /** Horloge en millisecondes (la fenêtre du limiteur). */
  maintenant(): number;
  /** Nombre dans [0, 1[ pour la variation de hauteur et de volume. */
  alea(): number;
}

/** Variation aléatoire du volume d'une lecture, en fraction (± 8 %). */
const VARIATION_VOLUME = 0.08;

/** Volume des réglages (0 à 100) vers un gain : courbe carrée, plus proche de l'oreille qu'une droite. */
export function gainDuVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  const v = Math.min(100, Math.max(0, volume)) / 100;
  return v * v;
}

export class MoteurAudio {
  private contexte: ContexteAudio | null = null;
  private busEffets: GainAudio | null = null;
  private busInterface: GainAudio | null = null;
  private busMusiqueNoeud: GainAudio | null = null;
  private readonly tampons = new Map<IdSon, unknown>();
  private readonly chargements = new Map<IdSon, Promise<void>>();
  private readonly echecs = new Set<IdSon>();
  private readonly limiteur = new Limiteur();
  private indisponible = false;
  private lireVolumes: () => VolumesAudio = () => ({ son: 0, musique: 0 });

  constructor(private readonly dependances: DependancesAudio) {}

  /** Donne la source des volumes (les réglages) : lue à chaque son, donc un curseur déplacé agit tout de suite. */
  relierVolumes(lire: () => VolumesAudio): void {
    this.lireVolumes = lire;
    this.appliquerVolumes();
  }

  /** Vrai une fois le contexte créé et en marche : les sons peuvent sortir. */
  get actif(): boolean {
    return this.contexte !== null && this.contexte.state === 'running';
  }

  /** Le bus de la musique, quand il y en aura : null tant que l'audio n'est pas débloqué. */
  get busMusique(): NoeudAudio | null {
    return this.busMusiqueNoeud;
  }

  /**
   * À appeler à chaque geste du joueur (clic, touche, toucher) : crée le contexte au premier appel, le relance s'il
   * a été suspendu (onglet caché, iOS), puis charge les sons si le volume n'est pas nul. Ne lève jamais.
   */
  debloquer(): void {
    if (this.indisponible) return;
    try {
      if (!this.contexte) this.creer();
      const contexte = this.contexte;
      if (!contexte) return;
      if (contexte.state !== 'running') contexte.resume().catch(() => { /* refusé : un prochain geste réessaiera */ });
      this.appliquerVolumes();
      if (this.volumeSon() > 0) this.precharger();
    } catch {
      this.indisponible = true;
    }
  }

  /** Charge tous les sons en tâche de fond (une fois le contexte créé). */
  precharger(): void {
    for (const id of IDS_SONS) this.charger(id);
  }

  /** Résolu quand les chargements en cours sont finis (tests). */
  async attendreChargements(): Promise<void> {
    await Promise.all([...this.chargements.values()]);
  }

  /** Joue l'effet d'un événement du moteur. `partie` sert à choisir entre deux sons (famille de la tour, genre de l'unité). */
  jouerEvenement(evenement: Evenement, partie: VuePartie = PARTIE_VIDE): void {
    const id = sonDe(evenement, partie);
    if (id !== null) this.jouer(id);
  }

  /** Joue les événements d'un pas, dans l'ordre. */
  jouerEvenements(evenements: readonly Evenement[], partie: VuePartie = PARTIE_VIDE): void {
    for (const evenement of evenements) this.jouerEvenement(evenement, partie);
  }

  /** Joue un son. Rend vrai s'il est parti ; faux s'il est coupé, limité, pas encore chargé ou si l'audio manque. */
  jouer(id: IdSon): boolean {
    try {
      return this.lancer(id);
    } catch {
      return false;
    }
  }

  private lancer(id: IdSon): boolean {
    if (this.indisponible || this.volumeSon() <= 0) return false;
    const contexte = this.contexte;
    if (!contexte) return false;
    if (contexte.state !== 'running') {
      contexte.resume().catch(() => { /* idem */ });
      return false;
    }
    const tampon = this.tampons.get(id);
    if (tampon === undefined) {
      this.charger(id);
      return false;
    }
    const def = SONS[id];
    if (!this.limiteur.autoriser(id, def.priorite, def.max, this.dependances.maintenant())) return false;
    const bus = def.bus === 'interface' ? this.busInterface : this.busEffets;
    if (!bus) return false;
    this.appliquerVolumes();
    const gain = contexte.createGain();
    gain.gain.value = def.volume * (1 + (this.dependances.alea() * 2 - 1) * VARIATION_VOLUME);
    const source = contexte.createBufferSource();
    source.buffer = tampon;
    source.playbackRate.value = def.hauteur * (1 + (this.dependances.alea() * 2 - 1) * def.variation);
    source.connect(gain);
    gain.connect(bus);
    source.start(0);
    return true;
  }

  private volumeSon(): number {
    try {
      const { son } = this.lireVolumes();
      return Number.isFinite(son) ? son : 0;
    } catch {
      return 0;
    }
  }

  private appliquerVolumes(): void {
    if (!this.busEffets || !this.busInterface || !this.busMusiqueNoeud) return;
    let volumes: VolumesAudio;
    try {
      volumes = this.lireVolumes();
    } catch {
      return;
    }
    const son = gainDuVolume(volumes.son);
    this.busEffets.gain.value = son;
    this.busInterface.gain.value = son;
    this.busMusiqueNoeud.gain.value = gainDuVolume(volumes.musique);
  }

  private creer(): void {
    const contexte = this.dependances.creerContexte();
    if (!contexte) {
      this.indisponible = true;
      return;
    }
    const creerBus = (): GainAudio => {
      const bus = contexte.createGain();
      bus.connect(contexte.destination);
      return bus;
    };
    this.busEffets = creerBus();
    this.busInterface = creerBus();
    this.busMusiqueNoeud = creerBus();
    this.contexte = contexte;
  }

  /** Charge et décode un son, une seule fois ; un échec (réseau, format) est mémorisé et on n'insiste pas. */
  private charger(id: IdSon): void {
    const contexte = this.contexte;
    if (!contexte || this.tampons.has(id) || this.chargements.has(id) || this.echecs.has(id)) return;
    const travail = this.dependances.charger(this.dependances.urlDe(id))
      .then((octets) => contexte.decodeAudioData(octets))
      .then((tampon) => { this.tampons.set(id, tampon); })
      .catch(() => { this.echecs.add(id); })
      .finally(() => { this.chargements.delete(id); });
    this.chargements.set(id, travail);
  }
}
