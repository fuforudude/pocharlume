// Choix de la machine des tests distants (job `choisir` de .github/workflows/tests.yml), sans effet de bord :
// on lui donne la réponse de l'API de facturation de GitHub, il rend la part de minutes restante et le runner.
//
// Endpoint lu par tools/ci/choisir-runner.ts : le rapport d'usage de la plateforme de facturation actuelle,
//   GET https://api.github.com/users/{username}/settings/billing/usage?year=AAAA&month=M
//   (en-têtes Accept: application/vnd.github+json, X-GitHub-Api-Version: 2022-11-28, jeton fine-grained avec le
//   droit de compte « Plan » en lecture). Doc : https://docs.github.com/en/rest/billing/usage
// Sa réponse est `{ usageItems: [{ date, product, sku, quantity, unitType, pricePerUnit, grossAmount, discountAmount,
// netAmount, repositoryName }] }`. Elle ne donne pas le quota inclus : il vient de la variable MINUTES_INCLUSES.
// L'API a changé avec le temps : on accepte aussi le résumé d'usage (`grossQuantity`, aperçu public) et l'ancienne
// réponse de `GET /users/{username}/settings/billing/actions` (`total_minutes_used`, `included_minutes`), retirée
// avec le passage à la nouvelle facturation.
// Tout ce qui n'est pas compris retombe sur GitHub avec un avertissement : on ne bascule sur le VPS que sur une
// réponse claire.

/** Sous cette part de minutes restantes, les jobs partent sur le VPS. */
export const SEUIL_RELAIS = 0.1;

/** Minutes d'Actions incluses par mois dans le forfait GitHub Free pour un dépôt privé. */
export const MINUTES_INCLUSES_PAR_DEFAUT = 2000;

export type Runner = 'vps' | 'ubuntu-latest';
export type Quota = number | 'illimite';

/** Ce que l'appel à l'API a donné : un statut HTTP et un corps, ou une erreur réseau. */
export type ReponseApi = { readonly statut: number; readonly corps: string } | { readonly erreur: string };

export interface EntreeChoix {
  readonly jetonPresent: boolean;
  readonly minutesIncluses: Quota;
  /** `null` quand l'API n'a pas été appelée (pas de jeton). */
  readonly reponse: ReponseApi | null;
}

export interface Choix {
  readonly runner: Runner;
  /** Part restante, de 0 à 1 ; `null` si elle n'a pas pu être calculée. */
  readonly restant: number | null;
  /** Message pour le résumé du job quand on retombe sur GitHub faute de savoir. */
  readonly avertissement: string | null;
}

/** Lit la variable MINUTES_INCLUSES : un entier positif, `illimite`, ou le quota du forfait gratuit par défaut. */
export function minutesIncluses(valeur: string | undefined): Quota {
  const texte = (valeur ?? '').trim();
  if (texte === 'illimite') return 'illimite';
  if (/^\d+$/.test(texte) && Number(texte) > 0) return Number(texte);
  return MINUTES_INCLUSES_PAR_DEFAUT;
}

function parDefaut(avertissement: string): Choix {
  return { runner: 'ubuntu-latest', restant: null, avertissement };
}

function estObjet(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function nombrePositif(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0;
}

/** Minutes consommées et quota lus dans la réponse ; un texte d'erreur si elle n'a pas la forme attendue. */
function lireConsommation(corps: unknown, quota: Quota): { utilisees: number; quota: Quota; facture: boolean } | string {
  if (!estObjet(corps)) return 'réponse de l’API inattendue (pas un objet JSON)';
  // Ancienne API : le quota est dans la réponse.
  if ('total_minutes_used' in corps || 'included_minutes' in corps) {
    const { total_minutes_used: utilisees, included_minutes: incluses, total_paid_minutes_used: payees } = corps;
    if (!nombrePositif(utilisees) || !nombrePositif(incluses) || incluses === 0) return 'réponse de l’ancienne API inattendue (total_minutes_used ou included_minutes manquant ou invalide)';
    return { utilisees, quota: incluses, facture: nombrePositif(payees) && payees > 0 };
  }
  const items = corps['usageItems'];
  if (!Array.isArray(items)) return 'réponse de l’API inattendue (champ usageItems manquant)';
  let utilisees = 0;
  let facture = false;
  for (const item of items as unknown[]) {
    if (!estObjet(item)) return 'réponse de l’API inattendue (ligne de usageItems qui n’est pas un objet)';
    const minutes = item['product'] === 'actions' && typeof item['unitType'] === 'string' && item['unitType'].toLowerCase() === 'minutes';
    if (!minutes) continue;
    const quantite = item['quantity'] ?? item['grossQuantity'];
    if (!nombrePositif(quantite)) return 'réponse de l’API inattendue (ligne de minutes Actions sans quantité valide)';
    utilisees += quantite;
    const net = item['netAmount'];
    if (typeof net === 'number' && net > 0) facture = true;
  }
  return { utilisees, quota, facture };
}

/** Le choix du runner à partir de la réponse de l'API (voir l'en-tête du fichier pour l'endpoint). */
export function choisirRunner(entree: EntreeChoix): Choix {
  if (!entree.jetonPresent) return parDefaut('Secret QUOTA_GITHUB absent : quota non lu, les jobs partent sur GitHub.');
  if (entree.minutesIncluses === 'illimite') return { runner: 'ubuntu-latest', restant: 1, avertissement: null };
  if (entree.minutesIncluses <= 0) return parDefaut('Quota de minutes inclus invalide (MINUTES_INCLUSES) : les jobs partent sur GitHub.');
  const reponse = entree.reponse;
  if (reponse === null) return parDefaut('API de facturation non appelée : les jobs partent sur GitHub.');
  if ('erreur' in reponse) return parDefaut(`API de facturation injoignable (${reponse.erreur}) : les jobs partent sur GitHub.`);
  if (reponse.statut < 200 || reponse.statut >= 300) return parDefaut(`API de facturation en erreur (HTTP ${String(reponse.statut)}) : les jobs partent sur GitHub.`);
  let corps: unknown;
  try {
    corps = JSON.parse(reponse.corps);
  } catch {
    return parDefaut('Réponse de l’API de facturation illisible (pas du JSON) : les jobs partent sur GitHub.');
  }
  const conso = lireConsommation(corps, entree.minutesIncluses);
  if (typeof conso === 'string') return parDefaut(`${conso} : les jobs partent sur GitHub.`);
  if (conso.quota === 'illimite') return { runner: 'ubuntu-latest', restant: 1, avertissement: null };
  // Des minutes déjà facturées : le quota inclus est épuisé, quoi qu'en dise le compte des minutes.
  const restant = conso.facture ? 0 : Math.max(0, (conso.quota - conso.utilisees) / conso.quota);
  return { runner: restant < SEUIL_RELAIS ? 'vps' : 'ubuntu-latest', restant, avertissement: null };
}
