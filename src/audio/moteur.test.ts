import { describe, expect, it } from 'vitest';
import { gainDuVolume, MoteurAudio, type ContexteAudio, type DependancesAudio, type GainAudio, type SourceAudio } from './moteur';
import { IDS_SONS, SONS, type VuePartie } from './table';

/** Un faux contexte audio : enregistre ce qui est créé, branché et lancé. */
class FauxContexte implements ContexteAudio {
  state = 'running';
  readonly destination = { connect: () => undefined };
  readonly gains: (GainAudio & { cible: unknown })[] = [];
  readonly sources: (SourceAudio & { reliee: unknown })[] = [];
  lancees: { source: SourceAudio; gain: number; vitesse: number; bus: unknown }[] = [];
  reprises = 0;
  decodages = 0;

  createGain(): GainAudio & { cible: unknown } {
    const noeud = {
      gain: { value: 1 },
      cible: null as unknown,
      connect(destination: unknown): void {
        noeud.cible = destination;
      },
    };
    this.gains.push(noeud);
    return noeud;
  }

  createBufferSource(): SourceAudio & { reliee: unknown } {
    const lancees = this.lancees;
    const source = {
      buffer: null as unknown,
      playbackRate: { value: 1 },
      reliee: null as unknown,
      connect(destination: unknown): void {
        source.reliee = destination;
      },
      start(): void {
        const gain = source.reliee as GainAudio & { cible: unknown };
        lancees.push({ source, gain: gain.gain.value, vitesse: source.playbackRate.value, bus: gain.cible });
      },
    };
    this.sources.push(source);
    return source;
  }

  decodeAudioData(donnees: ArrayBuffer): Promise<unknown> {
    this.decodages++;
    return Promise.resolve({ octets: donnees.byteLength });
  }

  resume(): Promise<void> {
    this.reprises++;
    this.state = 'running';
    return Promise.resolve();
  }
}

interface Banc {
  readonly moteur: MoteurAudio;
  readonly contexte: FauxContexte;
  readonly urls: string[];
  horloge: { t: number };
  volumes: { son: number; musique: number };
  alea: { valeur: number };
}

function banc(options: { sansContexte?: boolean; echecReseau?: boolean; etat?: string } = {}): Banc {
  const contexte = new FauxContexte();
  if (options.etat) contexte.state = options.etat;
  const urls: string[] = [];
  const horloge = { t: 1000 };
  const alea = { valeur: 0.5 };
  const volumes = { son: 100, musique: 60 };
  const dependances: DependancesAudio = {
    creerContexte: () => (options.sansContexte ? null : contexte),
    charger: (url) => {
      urls.push(url);
      return options.echecReseau ? Promise.reject(new Error('réseau')) : Promise.resolve(new ArrayBuffer(8));
    },
    urlDe: (id) => `sons/${id}.ogg`,
    maintenant: () => horloge.t,
    alea: () => alea.valeur,
  };
  const moteur = new MoteurAudio(dependances);
  moteur.relierVolumes(() => volumes);
  return { moteur, contexte, urls, horloge, volumes, alea };
}

async function pret(b: Banc): Promise<void> {
  b.moteur.debloquer();
  await b.moteur.attendreChargements();
}

describe('volumes', () => {
  it('gainDuVolume : 0 coupe, 100 plein, courbe carrée, valeurs folles bornées', () => {
    expect(gainDuVolume(0)).toBe(0);
    expect(gainDuVolume(100)).toBe(1);
    expect(gainDuVolume(50)).toBeCloseTo(0.25);
    expect(gainDuVolume(-20)).toBe(0);
    expect(gainDuVolume(900)).toBe(1);
    expect(gainDuVolume(Number.NaN)).toBe(0);
    expect(gainDuVolume(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('applique les volumes des réglages aux bus, en direct', async () => {
    const b = banc();
    await pret(b);
    const [effets, interfaceBus, musique] = b.contexte.gains;
    expect(effets?.gain.value).toBe(1);
    expect(interfaceBus?.gain.value).toBe(1);
    expect(musique?.gain.value).toBeCloseTo(0.36);
    b.volumes.son = 50;
    b.volumes.musique = 0;
    b.moteur.jouer('clic');
    expect(effets?.gain.value).toBeCloseTo(0.25);
    expect(interfaceBus?.gain.value).toBeCloseTo(0.25);
    expect(musique?.gain.value).toBe(0);
  });

  it('volume 0 : rien ne se joue, rien ne se charge', async () => {
    const b = banc();
    b.volumes.son = 0;
    await pret(b);
    expect(b.urls).toEqual([]);
    expect(b.moteur.jouer('clic')).toBe(false);
    expect(b.contexte.lancees).toEqual([]);
  });

  it('un son remis à 100 après 0 se charge à la demande puis se joue', async () => {
    const b = banc();
    b.volumes.son = 0;
    await pret(b);
    b.volumes.son = 100;
    expect(b.moteur.jouer('clic')).toBe(false);
    await b.moteur.attendreChargements();
    expect(b.moteur.jouer('clic')).toBe(true);
  });

  it('un volume absurde dans la sauvegarde ne fait pas de bruit', async () => {
    const b = banc();
    await pret(b);
    b.volumes.son = Number.NaN;
    expect(b.moteur.jouer('clic')).toBe(false);
  });
});

describe('chargement paresseux', () => {
  it("ne charge rien avant le premier geste, puis charge chaque son une seule fois", async () => {
    const b = banc();
    expect(b.urls).toEqual([]);
    expect(b.moteur.jouer('clic')).toBe(false);
    expect(b.urls).toEqual([]);
    await pret(b);
    b.moteur.debloquer();
    await b.moteur.attendreChargements();
    expect([...b.urls].sort()).toEqual([...IDS_SONS].map((id) => `sons/${id}.ogg`).sort());
    expect(b.contexte.decodages).toBe(IDS_SONS.length);
  });

  it('un fichier introuvable est abandonné sans exception, les autres sons restent jouables', async () => {
    const b = banc({ echecReseau: true });
    await pret(b);
    expect(b.moteur.jouer('clic')).toBe(false);
    const nombre = b.urls.length;
    b.moteur.jouer('clic');
    expect(b.urls.length).toBe(nombre);
  });
});

describe('lecture', () => {
  it('joue un son chargé : bus, volume et hauteur du son, variation centrée quand le hasard vaut 0,5', async () => {
    const b = banc();
    await pret(b);
    expect(b.moteur.jouer('tir_fleche')).toBe(true);
    const lecture = b.contexte.lancees[0];
    expect(lecture?.bus).toBe(b.contexte.gains[0]);
    expect(lecture?.gain).toBeCloseTo(SONS.tir_fleche.volume);
    expect(lecture?.vitesse).toBeCloseTo(SONS.tir_fleche.hauteur);
  });

  it('le son d\'interface passe par le bus d\'interface', async () => {
    const b = banc();
    await pret(b);
    b.moteur.jouer('clic');
    expect(b.contexte.lancees[0]?.bus).toBe(b.contexte.gains[1]);
  });

  it('varie légèrement la hauteur, dans la limite du son', async () => {
    const b = banc();
    await pret(b);
    b.alea.valeur = 0;
    b.moteur.jouer('tir_fleche');
    b.horloge.t += 1000;
    b.alea.valeur = 0.999999;
    b.moteur.jouer('tir_fleche');
    const [bas, haut] = b.contexte.lancees;
    const { hauteur, variation } = SONS.tir_fleche;
    expect(bas?.vitesse).toBeCloseTo(hauteur * (1 - variation));
    expect(haut?.vitesse).toBeCloseTo(hauteur * (1 + variation), 3);
  });

  it('un son sans variation (cloche) garde exactement sa hauteur', async () => {
    const b = banc();
    await pret(b);
    b.alea.valeur = 0.99;
    b.moteur.jouer('vague');
    expect(b.contexte.lancees[0]?.vitesse).toBe(SONS.vague.hauteur);
  });

  it('limite le même son : pas plus de max instances par fenêtre de 80 ms', async () => {
    const b = banc();
    await pret(b);
    const resultats = Array.from({ length: 6 }, () => b.moteur.jouer('tir_fleche'));
    expect(resultats.filter(Boolean)).toHaveLength(SONS.tir_fleche.max);
    b.horloge.t += 80;
    expect(b.moteur.jouer('tir_fleche')).toBe(true);
  });

  it('une rafale de sons ordinaires laisse passer la cloche de vague', async () => {
    const b = banc();
    await pret(b);
    for (const id of ['tir_fleche', 'coup_griffe', 'mort_ennemi', 'impact_physique', 'coup_epee', 'tir_carreau'] as const) b.moteur.jouer(id);
    expect(b.moteur.jouer('mort_ennemi')).toBe(false);
    expect(b.moteur.jouer('vague')).toBe(true);
  });

  it('joue les événements d\'un pas, avec la famille des tours', async () => {
    const b = banc();
    await pret(b);
    const partie: VuePartie = { tours: [{ id: 3, famille: 'artillerie' }], unites: [] };
    b.moteur.jouerEvenements([
      { type: 'vague', index: 1, bonus: 0 },
      { type: 'apparition', ennemi: 1, typeEnnemi: 'paysan_affame' },
      { type: 'tir', tour: 3, cible: 1, projectile: 1, x: 0, y: 0, critique: false },
      { type: 'fin', statut: 'victoire', etoiles: 3 },
    ], partie);
    expect(b.contexte.lancees).toHaveLength(3);
  });

  it('suspendu (iOS en silencieux, onglet en arrière-plan) : relance le contexte sans jouer ni lever', async () => {
    const b = banc({ etat: 'suspended' });
    b.moteur.debloquer();
    await b.moteur.attendreChargements();
    expect(b.contexte.reprises).toBeGreaterThan(0);
    expect(b.contexte.state).toBe('running');
    expect(b.moteur.jouer('clic')).toBe(true);
    b.contexte.state = 'interrupted';
    b.horloge.t += 1000;
    expect(b.moteur.jouer('clic')).toBe(false);
    expect(b.contexte.reprises).toBeGreaterThan(1);
  });
});

describe('audio indisponible', () => {
  it("sans AudioContext, aucune méthode ne lève et rien ne se joue ni ne se charge", async () => {
    const b = banc({ sansContexte: true });
    b.moteur.debloquer();
    b.moteur.debloquer();
    b.moteur.precharger();
    await b.moteur.attendreChargements();
    expect(b.moteur.jouer('clic')).toBe(false);
    expect(() => { b.moteur.jouerEvenements([{ type: 'vague', index: 1, bonus: 0 }]); }).not.toThrow();
    expect(b.urls).toEqual([]);
    expect(b.moteur.actif).toBe(false);
    expect(b.moteur.busMusique).toBeNull();
  });

  it('un contexte qui lève à la création désactive le son sans exception', () => {
    const moteur = new MoteurAudio({
      creerContexte: () => { throw new Error('refusé'); },
      charger: () => Promise.reject(new Error('non')),
      urlDe: (id) => id,
      maintenant: () => 0,
      alea: () => 0.5,
    });
    moteur.relierVolumes(() => ({ son: 100, musique: 100 }));
    expect(() => { moteur.debloquer(); }).not.toThrow();
    expect(moteur.jouer('clic')).toBe(false);
  });

  it('un contexte dont createBufferSource lève ne casse pas la boucle de jeu', async () => {
    const b = banc();
    await pret(b);
    b.contexte.createBufferSource = () => { throw new Error('mémoire'); };
    expect(() => { b.moteur.jouerEvenements([{ type: 'vague', index: 1, bonus: 0 }]); }).not.toThrow();
  });

  it("avant d'être relié aux réglages, le moteur est muet", () => {
    const contexte = new FauxContexte();
    const moteur = new MoteurAudio({
      creerContexte: () => contexte,
      charger: () => Promise.resolve(new ArrayBuffer(1)),
      urlDe: (id) => id,
      maintenant: () => 0,
      alea: () => 0.5,
    });
    moteur.debloquer();
    expect(moteur.jouer('clic')).toBe(false);
  });
});
