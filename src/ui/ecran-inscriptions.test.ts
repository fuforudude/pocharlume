// @vitest-environment happy-dom
// Le recueil des inscriptions : trouvées en texte complet, les autres en « ??? » avec la région, compteur, état vide, clavier.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { sauvegardeVide, trouverInscription, type Sauvegarde } from '../save';
import { afficherEcranInscriptions } from './ecran-inscriptions';
import { vueInscriptions } from './inscriptions-vues';

const ATLAS = { iconeUrl: () => 'icone.png' } as unknown as AtlasRendu;

function avec(...ids: string[]): Sauvegarde {
  let s = sauvegardeVide();
  for (const id of ids) {
    const r = trouverInscription(s, id);
    if (!r.ok) throw new Error(r.raison);
    s = r.sauvegarde;
  }
  return s;
}

afterEach(() => { document.body.replaceChildren(); });

describe('vue des inscriptions', () => {
  it('31 lignes ; une trouvée donne son texte et le nom de sa carte, une autre rien que sa région', () => {
    const vue = vueInscriptions(avec('chaumes'));
    expect(vue.lignes).toHaveLength(31);
    expect(vue.compteur).toBe('1 / 31');
    const chaumes = vue.lignes.find((l) => l.id === 'chaumes');
    expect(chaumes).toMatchObject({ trouvee: true, carte: 'Les Chaumes', texte: t('inscription.chaumes') });
    const gue = vue.lignes.find((l) => l.id === 'gue');
    expect(gue).toMatchObject({ trouvee: false, carte: null, texte: null, region: t('region.1') });
    expect(vueInscriptions(sauvegardeVide()).vide).toBe(true);
  });
});

describe('écran du recueil', () => {
  it('montre le compteur, les textes trouvés et « ??? » avec la région des autres', () => {
    afficherEcranInscriptions(document.body, { atlas: ATLAS, session: { sauvegarde: avec('chaumes', 'choeur') }, surFermer: vi.fn() });
    expect(document.querySelector('.inscriptions-compteur')?.textContent).toBe('2 / 31');
    const entrees = [...document.querySelectorAll('.inscription')];
    expect(entrees).toHaveLength(31);
    expect(document.querySelectorAll('.inscription.trouvee')).toHaveLength(2);
    expect(document.querySelector('[data-carte="chaumes"]')?.textContent).toContain(t('inscription.chaumes'));
    const inconnue = document.querySelector('[data-carte="gue"]');
    expect(inconnue?.textContent).toContain('???');
    expect(inconnue?.textContent).toContain(t('region.1'));
    expect(inconnue?.textContent).not.toContain(t('inscription.gue'));
    expect(document.querySelector('.inscriptions-vide')).toBeNull();
  });

  it('état vide : 0 / 31, un message, et les 31 entrées en « ??? »', () => {
    afficherEcranInscriptions(document.body, { atlas: ATLAS, session: { sauvegarde: sauvegardeVide() }, surFermer: vi.fn() });
    expect(document.querySelector('.inscriptions-compteur')?.textContent).toBe('0 / 31');
    expect(document.querySelector('.inscriptions-vide')?.textContent).toBe(t('inscriptions.vide'));
    expect(document.querySelectorAll('.inscription.inconnue')).toHaveLength(31);
  });

  it('s’utilise au clavier : entrées focalisables, Échap et le bouton ferment', () => {
    const surFermer = vi.fn();
    afficherEcranInscriptions(document.body, { atlas: ATLAS, session: { sauvegarde: avec('gue') }, surFermer });
    expect(document.querySelector<HTMLElement>('.inscription')?.tabIndex).toBe(0);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(surFermer).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ecran-inscriptions')).toBeNull();
    afficherEcranInscriptions(document.body, { atlas: ATLAS, session: { sauvegarde: sauvegardeVide() }, surFermer });
    [...document.querySelectorAll('button')].find((b) => b.textContent === t('inscriptions.fermer'))?.click();
    expect(surFermer).toHaveBeenCalledTimes(2);
  });
});
