// @vitest-environment happy-dom
// Le menu principal (écran d'accueil) : l'entrée « Temps modernes » ouvre la carte du monde du DLC, ouverte à tous.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import { afficherAccueil } from './ecrans';

const boutons = (): string[] => [...document.querySelectorAll<HTMLButtonElement>('.accueil button')].map((b) => b.textContent);

afterEach(() => {
  document.body.replaceChildren();
});

describe('menu principal', () => {
  it('propose « Temps modernes » juste après « Jouer » ; un clic ouvre la carte du DLC', () => {
    const surModerne = vi.fn();
    afficherAccueil(document.body, { surJouer: vi.fn(), surOptions: vi.fn(), surModerne });
    expect(boutons().slice(0, 2)).toEqual([t('accueil.jouer'), t('accueil.moderne')]);
    const b = document.querySelector<HTMLButtonElement>('[data-cle="moderne"]');
    b?.click();
    expect(surModerne).toHaveBeenCalledTimes(1);
  });

  it('garde « Reprendre » en tête et le focus dessus quand une partie attend', () => {
    afficherAccueil(document.body, { surJouer: vi.fn(), surOptions: vi.fn(), surModerne: vi.fn(), reprise: { vague: 4, surReprendre: vi.fn() } });
    expect(boutons().slice(0, 3)).toEqual([t('accueil.reprendre', { n: 4 }), t('accueil.jouer'), t('accueil.moderne')]);
    expect(document.activeElement?.textContent).toBe(t('accueil.reprendre', { n: 4 }));
  });

  it('sans l’option, pas d’entrée « Temps modernes »', () => {
    afficherAccueil(document.body, { surJouer: vi.fn(), surOptions: vi.fn() });
    expect(boutons()).not.toContain(t('accueil.moderne'));
  });
});
