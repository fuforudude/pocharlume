import { avancer, creerPartie, derniereVagueTerminee } from '../../src/engine/index.ts';
import { niveauDeCampagne } from '../../src/data/niveaux/campagne.ts';
import { configPartie } from '../../src/equilibrage/simulation.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
const c = niveauDeCampagne(1)!;
const etat = creerPartie(c.niveau, configPartie({ graine: 102, difficulte: 'matou', dieu: 'charlie', infini: { region: 1 } }));
const bot = creerBotNaif({ graine: 102 * 31 + 7 });
while (etat.statut === 'en_cours' && etat.pas < 30 * 3000) {
  avancer(etat, etat.pas % 15 === 0 ? bot.decider(etat) : []);
  if (etat.pas % 900 === 0) console.log(Math.round(etat.pas / 30), 'lancees', etat.vagues.lancees, 'term', derniereVagueTerminee(etat), 'vies', etat.vies, 'ennemis', etat.ennemis.length, 'aretes', etat.aretes, 'tours', etat.tours.length);
}
