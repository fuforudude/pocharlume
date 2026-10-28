// @vitest-environment happy-dom
// La partie « dieu, héros, objets » d'une fiche de niveau, avec une session truquée dont les réponses sont données à la
// main : deux choix rapides se suivent avant que la session ait répondu au premier.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { sauvegardeVide, type RaisonChoix, type RaisonEquipement, type ResultatTransaction, type Sauvegarde } from '../save';
import { creerChoixFiche, type SessionChoix } from './fiche-choix';

const ATLAS = { iconeUrl: () => 'icone.png' } as unknown as AtlasRendu;

type Reponse<R extends string> = (resultat: ResultatTransaction<R>) => void;

/** Une session dont chaque appel attend qu'on réponde à la main, dans l'ordre qu'on veut. */
function sessionTruquee(sauvegarde: Sauvegarde) {
  const equipements: Reponse<RaisonEquipement>[] = [];
  const heros: Reponse<RaisonChoix>[] = [];
  const session: SessionChoix = {
    sauvegarde,
    equiperObjets: () => new Promise((resolve) => { equipements.push(resolve); }),
    choisirHeros: () => new Promise((resolve) => { heros.push(resolve); }),
  };
  return { session, equipements, heros };
}

const OK = (s: Sauvegarde): ResultatTransaction<never> => ({ ok: true, sauvegarde: s, ecrite: true });

function avecStock(): Sauvegarde {
  const s = sauvegardeVide();
  return { ...s, meta: { ...s.meta, objets: { ...s.meta.objets, sablier: 5, fiole_soufre: 5 } } };
}

function toucher(racine: HTMLElement, cle: string): void {
  const b = racine.querySelector<HTMLElement>(`[data-cle="${cle}"]`);
  if (!b) throw new Error(`bouton absent : ${cle}`);
  b.click();
}

const message = (racine: HTMLElement): string => racine.querySelector('.choix-message')?.textContent ?? '';
const emplacements = (racine: HTMLElement): number => racine.querySelectorAll('.choix-slot:not(.vide)').length;

/** Laisse passer les microtâches (les réponses des promesses). */
const attendre = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  document.body.replaceChildren();
});

describe('fiche : en défi', () => {
  it('les objets disparaissent (rien n’est emporté en défi), le dieu et le héros restent', () => {
    const { session } = sessionTruquee(avecStock());
    const fiche = creerChoixFiche(ATLAS, session, new AbortController().signal);
    document.body.append(fiche.racine);
    expect(fiche.racine.querySelector('.choix-slot')).not.toBeNull();
    fiche.definirDefi(true);
    expect(fiche.racine.querySelector('.choix-slot')).toBeNull();
    expect(fiche.racine.querySelector('.choix-objet')).toBeNull();
    expect(fiche.racine.textContent).toContain(t('fiche.defi_sans_objet'));
    expect(fiche.racine.querySelectorAll('.choix-dieu')).toHaveLength(3);
    expect(fiche.racine.querySelectorAll('.choix-heros')).toHaveLength(3);
  });

  it('le choix d’objets mémorisé revient en quittant le défi', async () => {
    const s = avecStock();
    const { session, equipements } = sessionTruquee(s);
    const fiche = creerChoixFiche(ATLAS, session, new AbortController().signal);
    document.body.append(fiche.racine);
    toucher(fiche.racine, 'objet:sablier');
    equipements[0]?.(OK(s));
    await attendre();
    fiche.definirDefi(true);
    fiche.definirDefi(false);
    expect(emplacements(fiche.racine)).toBe(1);
    expect(fiche.choix().objets).toEqual(['sablier']);
  });
});

describe('fiche : réponses périmées', () => {
  it('le refus du premier choix, arrivé après le second, est ignoré : le second reste, aucun message', async () => {
    const s = avecStock();
    const { session, equipements } = sessionTruquee(s);
    const fiche = creerChoixFiche(ATLAS, session, new AbortController().signal);
    document.body.append(fiche.racine);
    toucher(fiche.racine, 'objet:sablier');
    toucher(fiche.racine, 'objet:fiole_soufre');
    expect(fiche.choix().objets).toEqual(['sablier', 'fiole_soufre']);
    // La session répond d'abord au second (accepté), puis au premier (refusé, périmé).
    equipements[1]?.(OK(s));
    equipements[0]?.({ ok: false, raison: 'objet_hors_stock' });
    await attendre();
    expect(fiche.choix().objets).toEqual(['sablier', 'fiole_soufre']);
    expect(emplacements(fiche.racine)).toBe(2);
    expect(message(fiche.racine)).toBe('');
  });

  it('le refus du dernier choix remet l’état d’avant ce choix (le premier, accepté) et le dit', async () => {
    const s = avecStock();
    const { session, equipements } = sessionTruquee(s);
    const fiche = creerChoixFiche(ATLAS, session, new AbortController().signal);
    document.body.append(fiche.racine);
    toucher(fiche.racine, 'objet:sablier');
    toucher(fiche.racine, 'objet:fiole_soufre');
    equipements[0]?.(OK(s));
    equipements[1]?.({ ok: false, raison: 'objet_hors_stock' });
    await attendre();
    expect(fiche.choix().objets).toEqual(['sablier']);
    expect(message(fiche.racine)).toBe(t('meta.refus.objet_hors_stock'));
  });

  it('un choix de héros périmé ne défait pas un choix d’objet plus récent, ni l’inverse', async () => {
    const s = avecStock();
    const { session, equipements, heros } = sessionTruquee(s);
    const fiche = creerChoixFiche(ATLAS, session, new AbortController().signal);
    document.body.append(fiche.racine);
    toucher(fiche.racine, 'dieu:plume');
    toucher(fiche.racine, 'objet:sablier');
    expect(fiche.choix()).toMatchObject({ dieu: 'plume', heros: 'plume', objets: ['sablier'] });
    // Le choix du dieu est refusé : il revient en arrière, mais l'objet choisi entre-temps reste.
    heros[0]?.({ ok: false, raison: 'heros_non_possede' });
    await attendre();
    expect(fiche.choix()).toMatchObject({ dieu: 'charlie', heros: 'charlie', objets: ['sablier'] });
    expect(message(fiche.racine)).toBe(t('meta.refus.heros_non_possede'));
    equipements[0]?.(OK(s));
    await attendre();
    expect(fiche.choix().objets).toEqual(['sablier']);
  });

  it('une session qui lève rend l’état d’avant et dit l’erreur, sans rejet orphelin', async () => {
    const s = avecStock();
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const session: SessionChoix = {
      sauvegarde: s,
      equiperObjets: () => Promise.reject(new Error('écriture impossible')),
      choisirHeros: () => Promise.reject(new Error('écriture impossible')),
    };
    const fiche = creerChoixFiche(ATLAS, session, new AbortController().signal);
    document.body.append(fiche.racine);
    toucher(fiche.racine, 'objet:sablier');
    await attendre();
    expect(fiche.choix().objets).toEqual([]);
    expect(message(fiche.racine)).toBe(t('erreur.sauvegarde'));
    erreurs.mockRestore();
  });

  it('le reste du stock d’un objet passe par la table des textes (×n)', () => {
    const { session } = sessionTruquee(avecStock());
    const fiche = creerChoixFiche(ATLAS, session, new AbortController().signal);
    expect(fiche.racine.querySelector('[data-cle="objet:sablier"] .detail-heros')?.textContent).toBe(t('fiche.objet_reste', { n: 5 }));
  });
});
