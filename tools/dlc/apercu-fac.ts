// Aperçu d'un niveau du DLC Temps modernes (la Fac, la Manif) pour les captures : le bot soigneux joue `t` secondes en avance rapide, puis la
// partie continue en temps réel. Outil de développement seulement (tools/dlc/apercu-fac.html), hors du jeu publié.
import { CAMPAGNE_MODERNE } from '../../src/data/niveaux/campagne-moderne';
import { VERSION_DONNEES } from '../../src/data/version';
import { avancer, creerPartie } from '../../src/engine/partie';
import { PAS_PAR_SECONDE } from '../../src/engine/temps';
import { creerBotSoigneux } from '../../src/equilibrage/bot-soigneux';
import { chargerAtlas } from '../../src/render/atlas';
import { Rendu, Surbrillance } from '../../src/render/rendu';

const params = new URLSearchParams(location.search);
const numero = Number(params.get('n') ?? '1');
const avance = Number(params.get('t') ?? '40');
const niveau = CAMPAGNE_MODERNE.find((n) => n.numero === numero) ?? CAMPAGNE_MODERNE[0];
if (!niveau) throw new Error('aucun niveau du DLC');
const canvas = document.querySelector<HTMLCanvasElement>('#vue');
const info = document.querySelector<HTMLElement>('#info');
if (!canvas || !info) throw new Error('page incomplète');

const atlas = await chargerAtlas('moderne', '/sprites/');
const etat = creerPartie(niveau.niveau, { graine: 7, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES });
const rendu = new Rendu(canvas, atlas, etat.niveau.carte, niveau.visuel);
const surb = new Surbrillance();
const bot = creerBotSoigneux();
const temps = (): number => (etat.pas * 1000) / PAS_PAR_SECONDE;
function pas(): void {
  avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
  rendu.apresPas(etat, temps());
}
while (etat.statut === 'en_cours' && etat.pas < avance * PAS_PAR_SECONDE) pas();
window.addEventListener('resize', () => {
  rendu.redimensionner();
});
let dernier = performance.now();
let reste = 0;
function image(maintenant: number): void {
  reste += maintenant - dernier;
  dernier = maintenant;
  while (reste >= 1000 / PAS_PAR_SECONDE && etat.statut === 'en_cours') {
    pas();
    reste -= 1000 / PAS_PAR_SECONDE;
  }
  rendu.dessiner(etat, 0, temps(), surb);
  if (info) info.textContent = `Niveau ${String(numero)} — vague ${String(etat.vagues.lancees)}/${String(etat.niveau.vagues.length)} — ${etat.statut}`;
  requestAnimationFrame(image);
}
requestAnimationFrame(image);
