// Session et mode infini : la fin d'une partie infinie est écrite aussitôt, survit à un rechargement, et deux onglets
// qui atteignent le même palier ne le paient qu'une fois.
import { describe, expect, it } from 'vitest';
import { Depot } from './depot';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { creerVerrouMemoire } from './verrou';

function departInfini(): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= 10; n++) s = enregistrerVictoire(s, n, 'matou', 1);
  return s;
}

async function onglets(initiale: Sauvegarde, combien: number) {
  const stockage = new StockageMemoire();
  expect(await new Depot(stockage).enregistrer(initiale)).toBe(true);
  const verrou = creerVerrouMemoire();
  const sessions = await Promise.all(Array.from({ length: combien }, () => Session.ouvrir(new Depot(stockage), null, { verrou })));
  return { stockage, sessions };
}

describe('session : fin de partie infinie', () => {
  it('écrit le record et les paliers, et les retrouve après un rechargement', async () => {
    const { stockage, sessions } = await onglets(departInfini(), 1);
    const r = await sessions[0]?.enregistrerFinInfini({ carte: 'chaumes', vague: 22 });
    expect(r).toMatchObject({ ok: true, ecrite: true, detail: { paliersPayes: [10, 20], nouveauRecord: true, aretes: 150, braises: 5 } });
    const relue = await Session.ouvrir(new Depot(stockage), null, { verrou: null });
    expect(relue.sauvegarde.meta.infini).toEqual({ records: { chaumes: 22 }, paliers: [10, 20] });
    expect(relue.sauvegarde.meta.monnaies).toEqual({ aretes: 150, braises: 5 });
  });

  it('refuse quand le mode est fermé et ne touche à rien', async () => {
    const { sessions } = await onglets(sauvegardeVide(), 1);
    expect(await sessions[0]?.enregistrerFinInfini({ carte: 'chaumes', vague: 22 })).toEqual({ ok: false, raison: 'infini_ferme' });
    expect(sessions[0]?.sauvegarde.meta.monnaies).toEqual({ aretes: 0, braises: 0 });
  });

  it('deux onglets qui atteignent le même palier sur deux cartes ne le paient qu’une fois', async () => {
    const { stockage, sessions } = await onglets(departInfini(), 2);
    const [a, b] = sessions;
    if (!a || !b) throw new Error('deux onglets attendus');
    const [ra, rb] = await Promise.all([a.enregistrerFinInfini({ carte: 'chaumes', vague: 10 }), b.enregistrerFinInfini({ carte: 'gue', vague: 10 })]);
    expect(ra.ok && rb.ok).toBe(true);
    const paye = [ra, rb].map((r) => (r.ok ? r.detail.aretes : -1));
    expect(paye.sort((x, y) => x - y)).toEqual([0, 50]);
    const relue = await Session.ouvrir(new Depot(stockage), null, { verrou: null });
    expect(relue.sauvegarde.meta.monnaies).toEqual({ aretes: 50, braises: 2 });
    expect(relue.sauvegarde.meta.infini).toEqual({ records: { chaumes: 10, gue: 10 }, paliers: [10] });
  });
});
