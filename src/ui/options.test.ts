// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import { CATALOGUE_MODERNE } from '../data/recompenses-moderne';
import { Depot, enregistrerVictoire, etoilesDe, exporterCode, sauvegardeVide, Session, StockageMemoire, type Sauvegarde } from '../save';
import { afficherOptions } from './options';

afterEach(() => {
  document.body.replaceChildren();
});

async function ouvrirSession(): Promise<Session> {
  return Session.ouvrir(new Depot(new StockageMemoire()));
}

describe('options par-dessus un écran', () => {
  it('Échap les ferme même quand le focus n’est pas dedans', async () => {
    const surFermer = vi.fn();
    afficherOptions(document.body, await ouvrirSession(), surFermer);
    (document.activeElement as HTMLElement | null)?.blur();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(surFermer).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ecran.options')).toBeNull();
  });

  it('une fois fermées, elles n’écoutent plus le clavier', async () => {
    const surFermer = vi.fn();
    afficherOptions(document.body, await ouvrirSession(), surFermer);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(surFermer).toHaveBeenCalledTimes(1);
  });

  it('le curseur « Musique » est masqué jusqu’au jalon 5 ; le réglage reste en sauvegarde', async () => {
    const session = await ouvrirSession();
    await session.changerReglages({ musique: 25 });
    afficherOptions(document.body, session, vi.fn());
    const noms = [...document.querySelectorAll('.ligne-reglage .nom-reglage')].map((n) => n.textContent);
    expect(noms).toContain(t('options.son'));
    expect(noms).toContain(t('options.vitesse'));
    expect(noms).not.toContain(t('options.musique'));
    expect(document.querySelectorAll('input[type="range"]')).toHaveLength(1);
    expect(session.sauvegarde.reglages.musique).toBe(25);
  });

  it('les touches pressées dans les options ne remontent pas à l’écran dessous', async () => {
    afficherOptions(document.body, await ouvrirSession(), vi.fn());
    const dessous = vi.fn();
    window.addEventListener('keydown', dessous);
    document.querySelector('.ecran.options button')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(dessous).not.toHaveBeenCalled();
    window.removeEventListener('keydown', dessous);
  });
});

describe('import d’un code : le DLC de l’appareil', () => {
  async function importerParEcran(session: Session, code: string, phrase: string): Promise<void> {
    afficherOptions(document.body, session, vi.fn());
    const champ = [...document.querySelectorAll('textarea')].find((c) => !c.readOnly);
    if (!champ) throw new Error('champ d’import absent');
    champ.value = code;
    const bouton = (texte: string): HTMLButtonElement | undefined => [...document.querySelectorAll('button')].find((b) => b.textContent === texte);
    bouton(t('options.importer_valider'))?.click();
    await vi.waitFor(() => { expect(bouton(t('options.confirmer'))).toBeDefined(); });
    expect(document.querySelector('.confirmation')?.textContent).toContain(phrase);
    bouton(t('options.confirmer'))?.click();
    await vi.waitFor(() => { expect(document.body.textContent).toContain(t('options.import_ok')); });
  }

  it('un code sans `moderne` laisse badges et skins de l’appareil', async () => {
    const vide = sauvegardeVide();
    const avecDlc: Sauvegarde = { ...vide, moderne: { ...vide.moderne, badges: 321, collection: { ...vide.moderne.collection, skinsTours: [...CATALOGUE_MODERNE.skinsTours].slice(0, 1) } } };
    const session = await ouvrirSession();
    await session.appliquerImport(avecDlc);
    await importerParEcran(session, await exporterCode(enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3)), t('options.confirmer_dlc_garde'));
    expect(session.sauvegarde.progression.niveauMax).toBe(2);
    expect(etoilesDe(session.sauvegarde, 1, 'matou')).toBe(3);
    expect(session.sauvegarde.moderne.badges).toBe(321);
    expect(session.sauvegarde.moderne.collection.skinsTours).toEqual(avecDlc.moderne.collection.skinsTours);
  });

  it('un code avec `moderne` le remplace', async () => {
    const vide = sauvegardeVide();
    const code = await exporterCode({ ...vide, moderne: { ...vide.moderne, badges: 55 } });
    const session = await ouvrirSession();
    await session.appliquerImport({ ...vide, moderne: { ...vide.moderne, badges: 321 } });
    await importerParEcran(session, code, t('options.confirmer_dlc_remplace'));
    expect(session.sauvegarde.moderne.badges).toBe(55);
  });

  it('si l’import n’a pas pu être écrit, l’écran le dit au lieu d’annoncer un succès', async () => {
    class StockageEnPanne extends StockageMemoire {
      panne = false;
      override set(cle: string, valeur: string): Promise<void> {
        return this.panne ? Promise.reject(new Error('écriture impossible')) : super.set(cle, valeur);
      }
    }
    const stockage = new StockageEnPanne();
    const session = await Session.ouvrir(new Depot(stockage));
    stockage.panne = true;
    afficherOptions(document.body, session, vi.fn());
    const champ = [...document.querySelectorAll('textarea')].find((c) => !c.readOnly);
    if (!champ) throw new Error('champ d’import absent');
    champ.value = await exporterCode(enregistrerVictoire(sauvegardeVide(), 1, 'matou', 3));
    const bouton = (texte: string): HTMLButtonElement | undefined => [...document.querySelectorAll('button')].find((b) => b.textContent === texte);
    bouton(t('options.importer_valider'))?.click();
    await vi.waitFor(() => { expect(bouton(t('options.confirmer'))).toBeDefined(); });
    bouton(t('options.confirmer'))?.click();
    await vi.waitFor(() => { expect(document.body.textContent).toContain(t('options.import_echec')); });
    expect(document.body.textContent).not.toContain(t('options.import_ok'));
  });
});
