// Bot « perce-armure » : le soigneux avec une stratégie dédiée contre les boss très blindés (le Grand Centaure du DLC, armure 90 %).
// Il aime les tours de tir et d'artillerie (dans le DLC, l'artillerie ignore déjà une part de l'armure), spécialise ses tours de tir en
// Arbalétriers du Beffroi (voie B) et achète leur compétence « Carreau perforant », qui fait ignorer à chaque carreau une part croissante de
// l'armure. Le reste (cases, sorts, héros, tour divine) est le travail du soigneux.
import { validerAction } from '../engine';
import type { Action, EtatPartie, IdFamille } from '../engine';
import { creerBotSoigneux, type OptionsSoigneux } from './bot-soigneux';
import { cleDuLieu, lieuDeLaTour, type Bot } from './simulation';

const COMPETENCE_PERCANTE = 'carreau_perforant';

export function creerBotPerceArmure(options: OptionsSoigneux = {}, poids: Readonly<Record<IdFamille, number>> = { caserne: 0.7, tir: 1.6, magie: 0.6, artillerie: 1.2 }): Bot {
  const soigneux = creerBotSoigneux({
    ...options,
    variante: { nom: 'perce-armure', poids, diversite: 0.4 },
  });
  return {
    nom: 'perce-armure',
    decider(etat: EtatPartie): readonly Action[] {
      const percantes: Action[] = [];
      for (const t of etat.tours) {
        if (t.famille !== 'tir') continue;
        const lieu = lieuDeLaTour(t);
        const action: Action =
          t.voie === 'B' ? { type: 'ameliorerCompetence', competence: COMPETENCE_PERCANTE, ...lieu } : t.niveau >= 3 ? { type: 'specialiser', voie: 'B', ...lieu } : { type: 'ameliorer', ...lieu };
        if (validerAction(etat, action) === null) percantes.push(action);
      }
      // Une tour de tir qui se spécialise prend toujours la voie B ; les ordres du soigneux sont les autres.
      const ordres = soigneux.decider(etat).map((a): Action => {
        if (a.type !== 'specialiser') return a;
        const t = etat.tours.find((x) => cleDuLieu(lieuDeLaTour(x)) === cleDuLieu(a));
        return t?.famille === 'tir' ? { ...a, voie: 'B' } : a;
      });
      return [...percantes, ...ordres];
    },
  };
}
