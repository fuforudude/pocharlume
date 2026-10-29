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
  let empreinte = '';

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

  /** Dernières positions acceptées par le serveur : seules celles-là s'enregistrent (l'écran peut avoir une longueur d'avance). */
  let valides = new Map<string, { x: number; y: number }>();
  /** Les déplacements s'exécutent l'un après l'autre : chacun part de la position acceptée par le précédent. */
  let chaine: Promise<void> = Promise.resolve();
  const enfiler = (f: () => Promise<void>): void => {
    chaine = chaine.then(f).catch((e: unknown) => { ctx.etat(e instanceof Error ? e.message : String(e), 'erreur'); });
  };
  /** Objets dont la position acceptée diffère de l'ouverture, plus éventuellement un objet à l'essai. */
  const deplacees = (essai?: { id: string; x: number; y: number }): Positions => {
    const sortie: Record<string, { x: number; y: number }> = {};
    for (const [id, p] of valides) {
      const depart = origine.get(id);
      if (depart === undefined || depart.x !== p.x || depart.y !== p.y) sortie[id] = p;
    }
    if (essai) sortie[essai.id] = { x: essai.x, y: essai.y };
    return sortie;
  };
  const modifie = (): boolean => Object.keys(deplacees()).length > 0;
  const genre = (o: ObjetCarte): DocumentCarte['genres'][number] | undefined => doc?.genres.find((g) => g.id === o.genre);

  async function ouvrirCarte(id: string, rechargement = false): Promise<void> {
    if (!rechargement && modifie() && !confirm('Des déplacements ne sont pas enregistrés. Les abandonner ?')) return;
    const ma = ++version;
    try {
      const d = await appeler<DocumentCarte>(`/api/cartes/doc?id=${encodeURIComponent(id)}`);
      if (ma !== version) return;
      doc = d;
      empreinte = d.empreinte;
      objets = d.objets.map((o) => ({ ...o }));
      origine = new Map(objets.map((o) => [o.id, { x: o.x, y: o.y }]));
      valides = new Map(origine);
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

  /** Vérification pendant le glissement : l'objet tenu à sa position du moment, les autres à leur dernière position acceptée. */
  const verifier = dernierSeulement(async () => {
    if (!doc || !glisse) return;
    const tenu = objets.find((o) => o.id === glisse?.id);
    const ma = ++version;
    try {
      const v = await appeler<VerificationCarte>('/api/cartes/verifier', { id: doc.id, positions: deplacees(tenu ? { id: tenu.id, x: tenu.x, y: tenu.y } : undefined) });
      if (ma !== version) return;
      verification = v;
      rendre();
    } catch (e) {
      ctx.etat(e instanceof Error ? e.message : String(e), 'erreur');
    }
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
  const lacher = (): void => {
    if (!glisse || !doc) return;
    const g = glisse;
    glisse = null;
    const o = objets.find((x) => x.id === g.id);
    if (!o) return;
    const cible = { x: o.x, y: o.y };
    enfiler(() => essayer(g.id, () => cible));
  };
  toile.addEventListener('pointerup', lacher);
  toile.addEventListener('pointercancel', lacher);

  /**
   * Essaie de poser l'objet : la cible se calcule à partir de la dernière position acceptée. Le serveur vérifie les règles ;
   * refusée, la position retombe sur la dernière acceptée (jamais sur une position qui n'a pas été vérifiée).
   */
  async function essayer(id: string, cible: (depart: { x: number; y: number }) => { x: number; y: number }): Promise<void> {
    if (!doc) return;
    const avant = valides.get(id);
    if (!avant) return;
    const apres = cible(avant);
    deplacer(id, apres.x, apres.y);
    if (apres.x === avant.x && apres.y === avant.y) { rendre(); return; }
    rendre();
    const ma = ++version;
    const v = await appeler<VerificationCarte>('/api/cartes/verifier', { id: doc.id, positions: deplacees({ id, ...apres }) });
    const fautes = v.erreurs.filter((e) => e.objet === id);
    if (fautes.length > 0) {
      deplacer(id, avant.x, avant.y);
      const retour = await appeler<VerificationCarte>('/api/cartes/verifier', { id: doc.id, positions: deplacees() });
      if (ma === version) verification = retour;
      ctx.etat(`Refusé : ${fautes.map((f) => f.message).join(' ; ')}`, 'erreur');
    } else {
      valides.set(id, apres);
      if (ma === version) verification = v;
      passe.push({ id, avant, apres });
      futur = [];
      ctx.etat('Déplacé.', 'ok');
    }
    ctx.signalerModif(modifie());
    rendre();
  }

  function annulerRefaire(sens: 'annuler' | 'refaire'): void {
    enfiler(async () => {
      const m = sens === 'annuler' ? passe.pop() : futur.pop();
      if (!m || !doc) return;
      (sens === 'annuler' ? futur : passe).push(m);
      const p = sens === 'annuler' ? m.avant : m.apres;
      valides.set(m.id, p);
      deplacer(m.id, p.x, p.y);
      ctx.signalerModif(modifie());
      rendre();
      const ma = ++version;
      const v = await appeler<VerificationCarte>('/api/cartes/verifier', { id: doc.id, positions: deplacees() });
      if (ma === version) { verification = v; rendre(); }
    });
  }

  remplirListe();
  ctx.etat(`${String(liste.length)} cartes. Choisir une carte dans la liste.`);

  return {
    ouvrir: (id: string) => ouvrirCarte(id),
    async enregistrer() {
      if (!doc) return;
      await chaine;
      const moved = deplacees();
      if (Object.keys(moved).length === 0) { ctx.etat('Rien à enregistrer.'); return; }
      ctx.etat('Enregistrement…');
      // Seuls les objets déplacés partent, avec ce qu'ils étaient à l'ouverture : le serveur refuse si le fichier a changé.
      const deplaces: Record<string, { x: number; y: number; origine: { libelle: string; x: number; y: number } }> = {};
      for (const [id, p] of Object.entries(moved)) {
        const depart = origine.get(id);
        const o = objets.find((x) => x.id === id);
        if (!depart || !o) continue;
        deplaces[id] = { x: p.x, y: p.y, origine: { libelle: o.libelle, x: depart.x, y: depart.y } };
      }
      const r = await appeler<{ ecrits: string[]; apres: { ok: boolean; message: string } | null }>('/api/cartes/enregistrer', { id: doc.id, deplaces, empreinte });
      // On repart du fichier tel qu'il est maintenant.
      await ouvrirCarte(doc.id, true);
      ctx.etat(`Enregistré : ${r.ecrits.join(', ') || 'aucun changement'}. Un changement de carte peut demander de rééquilibrer.`, 'ok');
    },
    touche(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { annulerRefaire('annuler'); return true; }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { annulerRefaire('refaire'); return true; }
      const fleches: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const fleche = fleches[e.key];
      const o = objets.find((x) => x.id === selection);
      if (fleche && o && doc && genre(o)?.actif !== false) {
        const pas = e.shiftKey ? doc.pas : doc.aimantation;
        const id = o.id;
        // Chaque flèche part de la dernière position acceptée, pas de ce que l'écran montre.
        enfiler(() => essayer(id, (depart) => ({ x: depart.x + fleche[0] * pas, y: depart.y + fleche[1] * pas })));
        return true;
      }
      return false;
    },
    arreter: () => undefined,
  };
}
