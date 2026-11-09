// Lecture des sorties JSON de `gh run list` et `gh run view` pour `npm run ci:attendre`.
import { describe, expect, it } from 'vitest';
import { lireRun, resumerJobs } from './resultats.ts';

describe('lireRun (gh run list --json databaseId,headSha,status,conclusion,url)', () => {
  it('rend le premier run de la liste', () => {
    const texte = JSON.stringify([{ databaseId: 42, headSha: 'abc', status: 'in_progress', conclusion: '', url: 'https://github.com/x/y/actions/runs/42' }]);
    expect(lireRun(texte)).toEqual({ id: 42, sha: 'abc', statut: 'in_progress', conclusion: '', url: 'https://github.com/x/y/actions/runs/42' });
  });

  it('aucun run, ou une sortie illisible : null', () => {
    expect(lireRun('[]')).toBeNull();
    expect(lireRun('pas du json')).toBeNull();
    expect(lireRun('[{"databaseId":"x"}]')).toBeNull();
  });
});

describe('resumerJobs (gh run view --json jobs)', () => {
  it('une ligne par job, avec son résultat, et le succès global', () => {
    const texte = JSON.stringify({
      jobs: [
        { name: 'Choix de la machine', status: 'completed', conclusion: 'success' },
        { name: 'Vérification complète', status: 'completed', conclusion: 'failure' },
        { name: 'Équilibrage, région 1', status: 'completed', conclusion: 'skipped' },
      ],
    });
    const resume = resumerJobs(texte);
    expect(resume.lignes).toEqual(['  réussi   Choix de la machine', '  ÉCHEC    Vérification complète', '  sauté    Équilibrage, région 1']);
    expect(resume.reussi).toBe(false);
  });

  it('tout réussi ou sauté : succès', () => {
    const texte = JSON.stringify({ jobs: [{ name: 'a', status: 'completed', conclusion: 'success' }, { name: 'b', status: 'completed', conclusion: 'skipped' }] });
    expect(resumerJobs(texte).reussi).toBe(true);
  });

  it('sortie illisible ou sans job : pas de succès', () => {
    expect(resumerJobs('{}').reussi).toBe(false);
    expect(resumerJobs('{"jobs":[]}').reussi).toBe(false);
    expect(resumerJobs('<html>').lignes).toEqual([]);
  });
});
