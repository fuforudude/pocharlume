// Vue « Sprites » : liste, éditeur de pixels (calques, pinceau, gomme, pipette, annuler, zoom), animations en direct.
import type { ApercuSprite, CalqueSprite, DocumentSprite, EntreeSprite } from '../types.ts';
import { LecteurAnimations } from './animations.ts';
import { canvasDe, couleurCss, dernierSeulement, el, appeler } from './outils.ts';
import { cellule, Historique, lire, poser, segment, TRANSPARENT } from './pixels.ts';
import type { Contexte, Vue } from './vue.ts';

type Outil = 'pinceau' | 'gomme' | 'pipette';
const OUTILS: readonly { id: Outil; nom: string; touche: string }[] = [
  { id: 'pinceau', nom: 'Pinceau', touche: 'B' },
  { id: 'gomme', nom: 'Gomme', touche: 'E' },
  { id: 'pipette', nom: 'Pipette', touche: 'I' },
];

export async function monterSprites(racine: HTMLElement, ctx: Contexte): Promise<Vue> {
  const liste = await appeler<EntreeSprite[]>('/api/sprites');

  // --- État ---------------------------------------------------------------------------------------------------
  let doc: DocumentSprite | null = null;
  let apercu: ApercuSprite | null = null;
  let derives: readonly ApercuSprite[] = [];
  /** Calques tels qu'édités, par id (copie de travail) et tels qu'ouverts. */
  let travail = new Map<string, readonly string[]>();
  let origine = new Map<string, readonly string[]>();
  let calqueId = '';
  let outil: Outil = 'pinceau';
  let lettre = '';
  let zoom = 12;
  let grille = true;
  let fondVisible = true;
  let historique = new Historique();
  let trait: { id: string; avant: readonly string[]; derniere: [number, number] | null } | null = null;
  let version = 0;

  // --- Squelette ----------------------------------------------------------------------------------------------
  const filtre = el('input', { type: 'search', placeholder: 'Filtrer les sprites…', 'aria-label': 'Filtrer les sprites' });
  const ul = el('ul', { 'aria-label': 'Sprites' });
  const colListe = el('div', { class: 'colonne liste' }, filtre, ul);

  const barreOutils = el('div', { class: 'rangee' });
  const selectCalque = el('select', { 'aria-label': 'Calque' });
  const boutonsOutils = OUTILS.map((o) => {
    const b = el('button', { type: 'button', title: `${o.nom} (${o.touche})`, 'aria-pressed': String(o.id === outil) }, `${o.nom} (${o.touche})`);
    b.addEventListener('click', () => { choisirOutil(o.id); });
    return b;
  });
  const boutonAnnuler = el('button', { type: 'button', title: 'Annuler (Ctrl+Z)' }, 'Annuler');
  const boutonRefaire = el('button', { type: 'button', title: 'Rétablir (Ctrl+Y)' }, 'Rétablir');
  const zoomMoins = el('button', { type: 'button', title: 'Zoom arrière (-)' }, '−');
  const zoomPlus = el('button', { type: 'button', title: 'Zoom avant (+)' }, '+');
  const zoomTexte = el('span', { class: 'aide' });
  const caseGrille = el('input', { type: 'checkbox', checked: '' });
  const caseFond = el('input', { type: 'checkbox', checked: '' });
  barreOutils.append(
    el('label', {}, 'Calque '), selectCalque, ...boutonsOutils, boutonAnnuler, boutonRefaire, zoomMoins, zoomTexte, zoomPlus,
    el('label', {}, caseGrille, ' grille (G)'), el('label', {}, caseFond, ' fond rendu (F)'),
  );
  const nuancier = el('div', { class: 'nuancier', role: 'group', 'aria-label': 'Couleurs' });
  const toile = el('canvas', { id: 'toile', tabindex: '0', 'aria-label': 'Zone de dessin' });
  const info = el('div', { class: 'aide' });
  const remarque = el('div', { class: 'aide' });
  const centre = el('div', { class: 'colonne centre' }, barreOutils, nuancier, toile, info, remarque,
    el('div', { class: 'aide' }, el('kbd', {}, 'B'), ' pinceau ', el('kbd', {}, 'E'), ' gomme ', el('kbd', {}, 'I'), ' pipette ',
      el('kbd', {}, 'Ctrl+Z'), ' / ', el('kbd', {}, 'Ctrl+Y'), ' annuler / rétablir ', el('kbd', {}, 'Ctrl+S'), ' enregistrer. Clic droit : pipette.'));

  const zoneAnims = el('div', { class: 'colonne', style: 'padding:0' });
  const zoneDerives = el('div', { class: 'derives' });
  const droite = el('div', { class: 'colonne droite' },
    el('strong', {}, 'Animations'), zoneAnims,
    el('strong', {}, 'Sprites qui en dérivent'), zoneDerives);
  racine.replaceChildren(colListe, centre, droite);
  const lecteur = new LecteurAnimations(zoneAnims, '#3b4a2a');

  // --- Liste --------------------------------------------------------------------------------------------------
  function remplirListe(): void {
    const mot = filtre.value.trim().toLowerCase();
    ul.replaceChildren();
    let groupe = '';
    for (const s of liste) {
      if (mot !== '' && !s.nom.toLowerCase().includes(mot)) continue;
      if (s.groupe !== groupe) {
        groupe = s.groupe;
        ul.append(el('li', { class: 'groupe', texte: groupe }));
      }
      const li = el('li', { texte: s.nom, tabindex: '0', 'data-id': s.id, class: doc?.id === s.id ? 'actif' : '' });
      const ouvrir = (): void => { void ouvrirSprite(s.id); };
      li.addEventListener('click', ouvrir);
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') ouvrir(); });
      ul.append(li);
    }
  }
  filtre.addEventListener('input', remplirListe);

  function modifie(): boolean {
    for (const [id, lignes] of travail) if (JSON.stringify(lignes) !== JSON.stringify(origine.get(id))) return true;
    return false;
  }
  function signaler(): void {
    ctx.signalerModif(modifie());
    boutonAnnuler.disabled = !historique.peutAnnuler();
    boutonRefaire.disabled = !historique.peutRefaire();
  }

  async function ouvrirSprite(id: string): Promise<void> {
    if (modifie() && !confirm('Des changements ne sont pas enregistrés. Les abandonner ?')) return;
    try {
      ctx.etat('Ouverture…');
      const d = await appeler<DocumentSprite>(`/api/sprites/doc?id=${encodeURIComponent(id)}`);
      doc = d;
      apercu = d.apercu;
      derives = d.derives;
      travail = new Map(d.calques.map((c) => [c.id, c.lignes]));
      origine = new Map(travail);
      historique = new Historique();
      // Le calque le plus fourni d'abord : c'est en général celui qu'on veut retoucher.
      const pixels = (c: CalqueSprite): number => c.lignes.join('').replaceAll('.', '').length;
      calqueId = [...d.calques].sort((x, y) => pixels(y) - pixels(x))[0]?.id ?? '';
      lettre = d.palette.find((p) => p.lettre !== TRANSPARENT)?.lettre ?? '';
      zoom = Math.max(3, Math.min(24, Math.floor(Math.min((window.innerHeight - 250) / d.hauteur, (window.innerWidth - 640) / d.largeur))));
      selectCalque.replaceChildren(...d.calques.map((c) => {
        const partage = c.partageAvec && c.partageAvec.length > 0 ? ` (partagé : ${c.partageAvec.join(', ')})` : '';
        return el('option', { value: c.id, texte: `${c.nom}${partage}` });
      }));
      selectCalque.value = calqueId;
      remarque.textContent = d.remarque ?? '';
      remplirListe();
      remplirNuancier();
      redessiner();
      afficherApercu();
      signaler();
      ctx.etat(`${d.nom} ouvert`, 'ok');
    } catch (e) {
      ctx.etat(e instanceof Error ? e.message : String(e), 'erreur');
    }
  }

  function remplirNuancier(): void {
    nuancier.replaceChildren();
    for (const p of doc?.palette ?? []) {
      const b = el('button', { type: 'button', title: `${p.lettre} — ${p.commentaire ?? p.couleur}`, 'aria-pressed': String(p.lettre === lettre), style: `background:${couleurCss(p.couleur)};color:${luminance(p.couleur) > 0.5 ? '#000' : '#fff'}` }, p.lettre);
      b.addEventListener('click', () => { lettre = p.lettre; if (outil !== 'pinceau') choisirOutil('pinceau'); remplirNuancier(); });
      nuancier.append(b);
    }
  }

  function luminance(hex: string): number {
    const n = (i: number): number => parseInt(hex.slice(i, i + 2), 16) / 255;
    return 0.2126 * n(1) + 0.7152 * n(3) + 0.0722 * n(5);
  }

  function choisirOutil(o: Outil): void {
    outil = o;
    boutonsOutils.forEach((b, i) => { b.setAttribute('aria-pressed', String(OUTILS[i]?.id === o)); });
  }

  // --- Dessin -------------------------------------------------------------------------------------------------
  const calqueCourant = (): CalqueSprite | undefined => doc?.calques.find((c) => c.id === calqueId);

  function redessiner(): void {
    if (!doc) return;
    const d = doc;
    toile.width = d.largeur * zoom;
    toile.height = d.hauteur * zoom;
    zoomTexte.textContent = `×${String(zoom)}`;
    const g = toile.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < d.hauteur; y++) for (let x = 0; x < d.largeur; x++) {
      g.fillStyle = (x + y) % 2 === 0 ? '#2a2c31' : '#33363c';
      g.fillRect(x * zoom, y * zoom, zoom, zoom);
    }
    const calque = calqueCourant();
    if (fondVisible && apercu) {
      const ref = calque?.contexte;
      const anim = apercu.animations.find((a) => a.nom === ref?.animation) ?? apercu.animations.find((a) => a.nom === 'repos') ?? apercu.animations[0];
      const cadre = anim?.cadres[ref?.indice ?? 0] ?? anim?.cadres[0];
      if (cadre) {
        g.globalAlpha = 0.4;
        g.drawImage(canvasDe(cadre.image), 0, 0, toile.width, toile.height);
        g.globalAlpha = 1;
      }
    }
    const couleurs = new Map(d.palette.map((p) => [p.lettre, couleurCss(p.couleur)]));
    if (calque) {
      const lignes = travail.get(calque.id) ?? [];
      lignes.forEach((ligne, j) => {
        for (let i = 0; i < ligne.length; i++) {
          const c = ligne[i] ?? TRANSPARENT;
          if (c === TRANSPARENT) continue;
          const x = (calque.x + i) * zoom;
          const y = (calque.y + j) * zoom;
          if (c === '_') {
            g.strokeStyle = '#e5584f';
            g.beginPath(); g.moveTo(x + 1, y + 1); g.lineTo(x + zoom - 1, y + zoom - 1); g.stroke();
            continue;
          }
          g.fillStyle = couleurs.get(c) ?? '#ff00ff';
          g.fillRect(x, y, zoom, zoom);
        }
      });
      g.strokeStyle = '#e0a63c';
      g.setLineDash([4, 3]);
      g.strokeRect(calque.x * zoom + 0.5, calque.y * zoom + 0.5, Math.max(...lignes.map((l) => l.length), 1) * zoom, Math.max(lignes.length, 1) * zoom);
      g.setLineDash([]);
    }
    if (grille && zoom >= 6) {
      g.strokeStyle = 'rgba(255,255,255,.12)';
      g.beginPath();
      for (let x = 0; x <= d.largeur; x++) { g.moveTo(x * zoom + 0.5, 0); g.lineTo(x * zoom + 0.5, toile.height); }
      for (let y = 0; y <= d.hauteur; y++) { g.moveTo(0, y * zoom + 0.5); g.lineTo(toile.width, y * zoom + 0.5); }
      g.stroke();
    }
  }

  function afficherApercu(): void {
    if (!apercu || !doc) return;
    lecteur.afficher(apercu, doc.fond ?? '#3b4a2a');
    zoneDerives.replaceChildren();
    for (const dv of derives) {
      const anim = dv.animations.find((a) => a.nom === 'repos') ?? dv.animations[0];
      const cadre = anim?.cadres[0];
      if (!cadre) continue;
      const c = canvasDe(cadre.image);
      const copie = el('canvas', { width: String(c.width), height: String(c.height), style: `width:${String(Math.min(c.width * 2, 84))}px;image-rendering:pixelated;background:${doc.fond ?? '#3b4a2a'}` });
      copie.getContext('2d')?.drawImage(c, 0, 0);
      zoneDerives.append(el('figure', {}, copie, el('figcaption', { texte: dv.nom })));
    }
    if (derives.length === 0) zoneDerives.append(el('span', { class: 'aide', texte: 'Aucun.' }));
  }

  // --- Aperçu en direct ----------------------------------------------------------------------------------------
  const rafraichir = dernierSeulement(async () => {
    if (!doc) return;
    const ma = ++version;
    const corps: Record<string, readonly string[]> = {};
    for (const [id, lignes] of travail) corps[id] = lignes;
    try {
      const r = await appeler<{ apercu: ApercuSprite; derives: ApercuSprite[] }>('/api/sprites/apercu', { id: doc.id, calques: corps });
      if (ma !== version) return;
      apercu = r.apercu;
      derives = r.derives;
      afficherApercu();
      redessiner();
    } catch (e) {
      ctx.etat(e instanceof Error ? e.message : String(e), 'erreur');
    }
  });

  // --- Souris -------------------------------------------------------------------------------------------------
  function pixelSous(e: PointerEvent): [number, number] {
    const r = toile.getBoundingClientRect();
    return cellule((e.clientX - r.left) * (toile.width / r.width), (e.clientY - r.top) * (toile.height / r.height), zoom);
  }

  function appliquer(px: number, py: number): void {
    const calque = calqueCourant();
    if (!calque || !doc || !trait) return;
    if (px < 0 || py < 0 || px >= doc.largeur || py >= doc.hauteur) return;
    const i = px - calque.x;
    const j = py - calque.y;
    if (i < 0 || j < 0) {
      ctx.etat('Hors du calque : une grille ne peut pas s\'étendre à gauche ni au-dessus de son origine.', 'erreur');
      return;
    }
    const lignes = travail.get(calque.id) ?? [];
    const suivant = poser(lignes, i, j, outil === 'gomme' ? TRANSPARENT : lettre);
    if (suivant) travail.set(calque.id, suivant);
  }

  toile.addEventListener('contextmenu', (e) => { e.preventDefault(); });
  toile.addEventListener('pointerdown', (e) => {
    if (!doc) return;
    toile.focus();
    toile.setPointerCapture(e.pointerId);
    const [px, py] = pixelSous(e);
    const calque = calqueCourant();
    if (!calque) return;
    if (e.button === 2 || outil === 'pipette') {
      const c = lire(travail.get(calque.id) ?? [], px - calque.x, py - calque.y);
      if (c !== TRANSPARENT && c !== '_') { lettre = c; remplirNuancier(); if (outil === 'pipette') choisirOutil('pinceau'); }
      return;
    }
    if (outil === 'pinceau' && lettre === '') return;
    trait = { id: calque.id, avant: travail.get(calque.id) ?? [], derniere: [px, py] };
    appliquer(px, py);
    redessiner();
    rafraichir();
  });
  toile.addEventListener('pointermove', (e) => {
    const [px, py] = pixelSous(e);
    const calque = calqueCourant();
    if (doc && calque && px >= 0 && py >= 0 && px < doc.largeur && py < doc.hauteur) {
      info.textContent = `x ${String(px)}, y ${String(py)} — ${lire(travail.get(calque.id) ?? [], px - calque.x, py - calque.y)}`;
    }
    if (!trait?.derniere) return;
    for (const [x, y] of segment(trait.derniere[0], trait.derniere[1], px, py)) appliquer(x, y);
    trait.derniere = [px, py];
    redessiner();
    rafraichir();
  });
  const fin = (): void => {
    if (!trait) return;
    const apres = travail.get(trait.id) ?? [];
    if (JSON.stringify(apres) !== JSON.stringify(trait.avant)) historique.enregistrer({ id: trait.id, avant: trait.avant, apres });
    trait = null;
    signaler();
    rafraichir();
  };
  toile.addEventListener('pointerup', fin);
  toile.addEventListener('pointercancel', fin);

  function appliquerHistorique(sens: 'annuler' | 'refaire'): void {
    const m = sens === 'annuler' ? historique.annuler() : historique.refaire();
    if (!m) return;
    travail.set(m.id, sens === 'annuler' ? m.avant : m.apres);
    calqueId = m.id;
    selectCalque.value = m.id;
    redessiner();
    signaler();
    rafraichir();
  }

  boutonAnnuler.addEventListener('click', () => { appliquerHistorique('annuler'); });
  boutonRefaire.addEventListener('click', () => { appliquerHistorique('refaire'); });
  selectCalque.addEventListener('change', () => { calqueId = selectCalque.value; redessiner(); });
  const changerZoom = (delta: number): void => { zoom = Math.max(2, Math.min(32, zoom + delta)); redessiner(); };
  zoomMoins.addEventListener('click', () => { changerZoom(-1); });
  zoomPlus.addEventListener('click', () => { changerZoom(1); });
  caseGrille.addEventListener('change', () => { grille = caseGrille.checked; redessiner(); });
  caseFond.addEventListener('change', () => { fondVisible = caseFond.checked; redessiner(); });

  remplirListe();
  signaler();
  ctx.etat(`${String(liste.length)} sprites. Choisir un sprite dans la liste.`);

  return {
    ouvrir: ouvrirSprite,
    async enregistrer() {
      if (!doc) return;
      const corps: Record<string, readonly string[]> = {};
      for (const [id, lignes] of travail) if (JSON.stringify(lignes) !== JSON.stringify(origine.get(id))) corps[id] = lignes;
      if (Object.keys(corps).length === 0) { ctx.etat('Rien à enregistrer.'); return; }
      ctx.etat('Enregistrement…');
      const r = await appeler<{ ecrits: string[]; apres: { ok: boolean; message: string } | null }>('/api/sprites/enregistrer', { id: doc.id, calques: corps });
      origine = new Map(travail);
      signaler();
      ctx.etat(`Enregistré : ${r.ecrits.join(', ') || 'aucun changement'}${r.apres ? ` — ${r.apres.message}` : ''}`, r.apres && !r.apres.ok ? 'erreur' : 'ok');
    },
    touche(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { appliquerHistorique('annuler'); return true; }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { appliquerHistorique('refaire'); return true; }
      if (e.ctrlKey || e.metaKey || e.altKey) return false;
      switch (e.key.toLowerCase()) {
        case 'b': choisirOutil('pinceau'); return true;
        case 'e': choisirOutil('gomme'); return true;
        case 'i': choisirOutil('pipette'); return true;
        case 'g': grille = !grille; caseGrille.checked = grille; redessiner(); return true;
        case 'f': fondVisible = !fondVisible; caseFond.checked = fondVisible; redessiner(); return true;
        case '+': case '=': changerZoom(1); return true;
        case '-': changerZoom(-1); return true;
        default: return false;
      }
    },
    arreter() { lecteur.arreter(); },
  };
}
