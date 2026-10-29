// Validation stricte de ce que la sauvegarde v6 ajoute : les inscriptions de statues trouvées. Même esprit que
// validation-infini.ts : types exacts, identifiants connus, copie neuve.
import { estIdInscription, IDS_INSCRIPTIONS, type IdInscription } from '../data/niveaux/statues';
import { echec, ok, type Resultat } from './validation-base';

/**
 * Les inscriptions trouvées : une liste d'identifiants de cartes connus, sans doublon, dans l'ordre des cartes de la campagne
 * (la forme que les transactions écrivent). Un identifiant inconnu est refusé : un code d'export forgé ne glisse rien dans la liste.
 */
export function validerInscriptions(x: unknown): Resultat<IdInscription[]> {
  if (!Array.isArray(x)) return echec('meta.inscriptions : liste attendue');
  const liste = x as unknown[];
  if (liste.length > IDS_INSCRIPTIONS.length) return echec(`meta.inscriptions : au plus ${String(IDS_INSCRIPTIONS.length)} inscriptions`);
  const trouvees: IdInscription[] = [];
  let dernier = -1;
  for (const id of liste) {
    if (!estIdInscription(id)) return echec('meta.inscriptions : inscription inconnue');
    const rang = IDS_INSCRIPTIONS.indexOf(id);
    if (rang <= dernier) return echec("meta.inscriptions : inscriptions attendues dans l'ordre des cartes, sans doublon");
    dernier = rang;
    trouvees.push(id);
  }
  return ok(trouvees);
}
