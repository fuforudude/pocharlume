// Vue « Cartes » : déplacer des objets (décors, statue…) sur une grille 2D. Les règles du projet sont vérifiées par
// l'adaptateur à chaque déplacement ; un dépôt refusé revient à la position d'avant.
import type { DocumentCarte, EntreeCarte, ObjetCarte, Positions, VerificationCarte } from '../types.ts';
import { appeler, dernierSeulement, el } from './outils.ts';
import type { Contexte, Vue } from './vue.ts';

interface Deplacement {
  readonly id: string;
  readonly avant: { x: number; y: number };
  readonly apres: { x: number; y: number };
}

export async function monterCartes(racine: HTMLElement, ctx: Contexte): Promise<Vue> {
  const liste = await appeler<EntreeCarte[]>('/api/cartes');
  let doc: DocumentCarte | null = null;
  let objets: ObjetCarte[] = [];
  let origine = new Map<string, { x: number; y: number }>();
  let verification: VerificationCarte | null = null;
  let selection: string | null = null;
  let glisse: { id: string; decalageX: number; decalageY: number; depart: { x: number; y: number } } | null = null;
  let passe: Deplacement[] = [];
  let futur: Deplacement[] = [];
  let unite = 24;
  let version = 0;

  const ul = el('ul', { 'aria-label': 'Cartes' });
  const filtre = el('input', { type: 'search', placeholder: 'Filtrer les cartes…', 'aria-label': 'Filtrer les cartes' });
  const colListe = el('div', { class: 'colonne liste' }, filtre, ul);
  const toile = el('canvas', { id: 'toile-carte', tabindex: '0', 'aria-label': 'Carte' });
  const info = el('div', { class: 'aide' });
  const legende = el('div', { class: 'rangee' });
  const centre = el('div', { class: 'colonne centre' }, legende, toile, info,
    el('div', { class: 'aide' }, 'Glisser un objet pour le déplacer, ou le choisir puis les flèches (', el('kbd', {}, 'Maj'), ' : une case entière). ',
      el('kbd', {}, 'Ctrl+Z'), ' / ', el('kbd', {}, 'Ctrl+Y'), ' annuler / rétablir.'));
  const boiteBilan = el('div', { class: 'colonne', style: 'padding:0' });
  const boiteErreurs = el('div', {});
  const listeObjets = el('ul', { class: 'liste-objets', style: 'list-style:none;margin:0;padding:0;overflow:auto;max-height:260px' });
  const droite = el('div', { class: 'colonne droite' }, el('strong', { texte: 'Cases constructibles' }), boiteBilan, boiteErreurs, el('strong', { texte: 'Objets' }), listeObjets);
  racine.replaceChildren(colListe, centre, droite);

  function remplirListe(): void {
    const mot = filtre.value.trim().toLowerCase();
    ul.replaceChildren();
    let groupe = '';
    for (const c of liste) {
      if (mot !== '' && !c.nom.toLowerCase().includes(mot)) continue;
      if (c.groupe !== groupe) {
        groupe = c.groupe;
        ul.append(el('li', { class: 'groupe', texte: groupe }));
      }
      const li = el('li', { texte: c.nom, tabindex: '0', class: doc?.id === c.id ? 'actif' : '' });
      const ouvrir = (): void => { void ouvrirCarte(c.id); };
      li.addEventListener('click', ouvrir);
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') ouvrir(); });
      ul.append(li);
    }
  }
  filtre.addEventListener('input', remplirListe);

  const positions = (): Positions => Object.fromEntries(objets.map((o) => [o.id, { x: o.x, y: o.y }]));
  const modifie = (): boolean => objets.some((o) => { const p = origine.get(o.id); return p === undefined || p.x !== o.x || p.y !== o.y; });
  const genre = (o: ObjetCarte): DocumentCarte['genres'][number] | undefined => doc?.genres.find((g) => g.id === o.genre);

  async function ouvrirCarte(id: string): Promise<void> {
    if (modifie() && !confirm('Des déplacements ne sont pas enregistrés. Les abandonner ?')) return;
    try {
      const d = await appeler<DocumentCarte>(`/api/cartes/doc?id=${encodeURIComponent(id)}`);
      doc = d;
      objets = d.objets.map((o) => ({ ...o }));
      origine = new Map(objets.map((o) => [o.id, { x: o.x, y: o.y }]));
      verification = d.verification;
      selection = null;
      passe = [];
      futur = [];
      unite = Math.max(10, Math.min(30, Math.floor((window.innerWidth - 580) / d.colonnes)));
      legende.replaceChildren(...d.genres.map((g) => el('span', { title: g.raison ?? '', style: `opacity:${g.actif ? '1' : '.55'}` },
        el('span', { style: `display:inline-block;width:12px;height:12px;background:${g.couleur};margin-right:4px;vertical-align:middle` }), g.actif ? g.libelle : `${g.libelle} (désactivé : ${g.raison ?? ''})`)));
      legende.append(el('span', { style: 'color:#e55' }, '■ case non constructible'));
      remplirListe();
      rendre();
      ctx.signalerModif(false);
      ctx.etat(`${d.nom} ouverte`, 'ok');
    } catch (e) {
      ctx.etat(e instanceof Error ? e.message : String(e), 'erreur');
    }
  }

  function rect(o: ObjetCarte): { x0: number; y0: number; x1: number; y1: number } {
    return { x0: o.x - o.emprise.gauche, y0: o.y - o.emprise.haut, x1: o.x + o.emprise.droite, y1: o.y + o.emprise.bas };
  }

  function rendre(): void {
    if (!doc) return;
    const d = doc;
    toile.width = d.colonnes * unite;
    toile.height = d.lignes * unite;
    const g = toile.getContext('2d');
    if (!g) return;
    g.fillStyle = '#2d3a24';
    g.fillRect(0, 0, toile.width, toile.height);
    // Grille.
    for (let x = 0; x <= d.colonnes; x++) {
      g.strokeStyle = x % d.pas === 0 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.06)';
      g.beginPath(); g.moveTo(x * unite + 0.5, 0); g.lineTo(x * unite + 0.5, toile.height); g.stroke();
    }
    for (let y = 0; y <= d.lignes; y++) {
      g.strokeStyle = y % d.pas === 0 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.06)';
      g.beginPath(); g.moveTo(0, y * unite + 0.5); g.lineTo(toile.width, y * unite + 0.5); g.stroke();
    }
    // Chemins.
    g.strokeStyle = 'rgba(190,160,110,.8)';
    g.lineWidth = unite * 2;
    g.lineJoin = 'round';
    g.globalAlpha = 0.55;
    for (const chemin of d.chemins) {
      g.beginPath();
      chemin.forEach((p, i) => { if (i === 0) g.moveTo(p.x * unite, p.y * unite); else g.lineTo(p.x * unite, p.y * unite); });
      g.stroke();
    }
    g.globalAlpha = 1;
    g.lineWidth = 1;
    // Objets.
    const fautifs = new Set((verification?.erreurs ?? []).map((e) => e.objet));
    for (const o of objets) {
      const r = rect(o);
      const gen = genre(o);
      g.fillStyle = `${gen?.couleur ?? '#888'}aa`;
      g.fillRect(r.x0 * unite, r.y0 * unite, (r.x1 - r.x0) * unite, (r.y1 - r.y0) * unite);
      g.strokeStyle = fautifs.has(o.id) ? '#ff3b30' : o.id === selection ? '#ffffff' : 'rgba(0,0,0,.6)';
      g.lineWidth = o.id === selection || fautifs.has(o.id) ? 2 : 1;
      g.strokeRect(r.x0 * unite, r.y0 * unite, (r.x1 - r.x0) * unite, (r.y1 - r.y0) * unite);
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(o.x * unite, o.y * unite, 2.5, 0, Math.PI * 2); g.fill();
      g.font = '10px system-ui';
      g.fillStyle = '#fff';
      g.fillText(o.libelle, r.x0 * unite + 2, r.y0 * unite + 10, Math.max(20, (r.x1 - r.x0) * unite - 4));
    }
    g.lineWidth = 1;
    // Cases où l'on ne peut pas construire, par-dessus tout pour qu'on les voie.
    const colonnesCases = Math.floor(d.colonnes / d.pas);
    g.fillStyle = 'rgba(229,60,60,.30)';
    g.strokeStyle = 'rgba(229,60,60,.7)';
    for (const i of verification?.casesBloquees ?? []) {
      const cx = (i % colonnesCases) * d.pas * unite;
      const cy = Math.floor(i / colonnesCases) * d.pas * unite;
      g.fillRect(cx, cy, d.pas * unite, d.pas * unite);
      g.strokeRect(cx + 0.5, cy + 0.5, d.pas * unite - 1, d.pas * unite - 1);
    }
    rendreCotes();
  }

  function rendreCotes(): void {
    boiteBilan.replaceChildren();
    const v = verification;
    if (v) {
      if (v.bilan.length > 0) {
        const tab = el('table', { class: 'tableau' }, el('tr', {}, el('th', { texte: '' }), el('th', { texte: 'Avant' }), el('th', { texte: 'Après' })));
        for (const l of v.bilan) tab.append(el('tr', {}, el('td', { texte: l.libelle }), el('td', { texte: String(l.avant) }), el('td', { texte: String(l.apres), style: l.apres !== l.avant ? 'color:#e0a63c;font-weight:700' : '' })));
        boiteBilan.append(tab);
      }
      if (v.avertissement && v.bilan.some((l) => l.avant !== l.apres)) boiteBilan.append(el('div', { class: 'avert', texte: v.avertissement }));
    }
    boiteErreurs.replaceChildren(...(v?.erreurs ?? []).map((e) => el('div', { class: 'erreur-boite', texte: e.message })));
    listeObjets.replaceChildren(...objets.map((o) => {
      const p = origine.get(o.id);
      const deplace = p === undefined || p.x !== o.x || p.y !== o.y;
      const li = el('li', { tabindex: '0', texte: `${o.libelle} (${String(o.x)}, ${String(o.y)})${deplace ? ' *' : ''}`, style: `padding:1px 4px;cursor:pointer;${o.id === selection ? 'background:#e0a63c;color:#111' : ''}` });
      li.addEventListener('click', () => { selection = o.id; rendre(); });
      return li;
    }));
  }

  const verifier = dernierSeulement(async () => {
    if (!doc) return;
    const ma = ++version;
    const v = await appeler<VerificationCarte>('/api/cartes/verifier', { id: doc.id, positions: positions() });
    if (ma !== version) return;
    verification = v;
    rendre();
  });

  const aimanter = (v: number): number => {
    const pas = doc?.aimantation ?? 1;
    return Math.round(v / pas) * pas;
  };

  function pointeur(e: PointerEvent): { x: number; y: number } {
    const r = toile.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (toile.width / r.width) / unite, y: (e.clientY - r.top) * (toile.height / r.height) / unite };
  }

  function objetSous(p: { x: number; y: number }): ObjetCarte | undefined {
    const candidats = objets.filter((o) => { const r = rect(o); return p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1; });
    candidats.sort((a, b) => (a.emprise.gauche + a.emprise.droite) * (a.emprise.haut + a.emprise.bas) - (b.emprise.gauche + b.emprise.droite) * (b.emprise.haut + b.emprise.bas));
    return candidats[0];
  }

  function deplacer(id: string, x: number, y: number): void {
    objets = objets.map((o) => (o.id === id ? { ...o, x, y } : o));
  }

  toile.addEventListener('pointerdown', (e) => {
    const p = pointeur(e);
    const o = objetSous(p);
    selection = o?.id ?? null;
    if (o) {
      const gen = genre(o);
      if (gen && !gen.actif) {
        ctx.etat(gen.raison ?? `${gen.libelle} : non modifiable`, 'erreur');
      } else {
        glisse = { id: o.id, decalageX: o.x - p.x, decalageY: o.y - p.y, depart: { x: o.x, y: o.y } };
        toile.setPointerCapture(e.pointerId);
      }
    }
    rendre();
  });
  toile.addEventListener('pointermove', (e) => {
    const p = pointeur(e);
    info.textContent = `x ${String(Math.round(p.x * 2) / 2)}, y ${String(Math.round(p.y * 2) / 2)}`;
    if (!glisse) return;
    deplacer(glisse.id, aimanter(p.x + glisse.decalageX), aimanter(p.y + glisse.decalageY));
    rendre();
    verifier();
  });
  const lacher = async (): Promise<void> => {
    if (!glisse || !doc) return;
    const g = glisse;
    glisse = null;
    const o = objets.find((x) => x.id === g.id);
    if (!o || (o.x === g.depart.x && o.y === g.depart.y)) return;
    await terminerDeplacement(g.id, g.depart, { x: o.x, y: o.y });
  };
  toile.addEventListener('pointerup', () => { void lacher(); });
  toile.addEventListener('pointercancel', () => { void lacher(); });

  /** Vérifie l'arrivée : refusée, l'objet revient à son départ. */
  async function terminerDeplacement(id: string, avant: { x: number; y: number }, apres: { x: number; y: number }): Promise<void> {
    if (!doc) return;
    const v = await appeler<VerificationCarte>('/api/cartes/verifier', { id: doc.id, positions: positions() });
    const fautes = v.erreurs.filter((e) => e.objet === id);
    if (fautes.length > 0) {
      deplacer(id, avant.x, avant.y);
      verification = await appeler<VerificationCarte>('/api/cartes/verifier', { id: doc.id, positions: positions() });
      ctx.etat(`Refusé : ${fautes.map((f) => f.message).join(' ; ')}`, 'erreur');
    } else {
      verification = v;
      passe.push({ id, avant, apres });
      futur = [];
      ctx.etat('Déplacé.', 'ok');
    }
    ctx.signalerModif(modifie());
    rendre();
  }

  function annulerRefaire(sens: 'annuler' | 'refaire'): void {
    const m = sens === 'annuler' ? passe.pop() : futur.pop();
    if (!m) return;
    (sens === 'annuler' ? futur : passe).push(m);
    const p = sens === 'annuler' ? m.avant : m.apres;
    deplacer(m.id, p.x, p.y);
    ctx.signalerModif(modifie());
    rendre();
    verifier();
  }

  remplirListe();
  ctx.etat(`${String(liste.length)} cartes. Choisir une carte dans la liste.`);

  return {
    ouvrir: ouvrirCarte,
    async enregistrer() {
      if (!doc) return;
      if (!modifie()) { ctx.etat('Rien à enregistrer.'); return; }
      const r = await appeler<{ ecrits: string[]; apres: { ok: boolean; message: string } | null }>('/api/cartes/enregistrer', { id: doc.id, positions: positions() });
      origine = new Map(objets.map((o) => [o.id, { x: o.x, y: o.y }]));
      ctx.signalerModif(false);
      ctx.etat(`Enregistré : ${r.ecrits.join(', ') || 'aucun changement'}. Un changement de carte peut demander de rééquilibrer.`, 'ok');
      rendreCotes();
    },
    touche(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { annulerRefaire('annuler'); return true; }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { annulerRefaire('refaire'); return true; }
      const fleches: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const f = fleches[e.key];
      const o = objets.find((x) => x.id === selection);
      if (f && o && doc && genre(o)?.actif !== false) {
        const pas = e.shiftKey ? doc.pas : doc.aimantation;
        const avant = { x: o.x, y: o.y };
        const apres = { x: o.x + f[0] * pas, y: o.y + f[1] * pas };
        deplacer(o.id, apres.x, apres.y);
        rendre();
        void terminerDeplacement(o.id, avant, apres);
        return true;
      }
      return false;
    },
    arreter: () => undefined,
  };
}
